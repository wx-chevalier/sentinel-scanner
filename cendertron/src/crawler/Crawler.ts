import { defaultCrawlerOption } from './../config';
import * as uuid from 'uuid/v1';

import { logger } from './supervisor/logger';

import { CrawlerOption } from './CrawlerOption';
import Spider from './spider/Spider';
import { PageSpider } from './spider/PageSpider';
import { CrawlerResult, SpiderResult, ParsedUrl, SpiderPage } from './types';
import { isMedia, shouldIgnore } from '../utils/validator';
import { parseUrl, stripBackspaceInUrl } from '../utils/transformer';
import { hashUrl, isDir } from '../utils/model';
import { CrawlerCache, crawlerCache } from './storage/CrawlerCache';
import { WeakfileSpider } from './spider/WeakfileSpider';

export interface CrawlerCallback {
  onStart?: (crawler: Crawler) => void;
  onFinish?: (crawler: Crawler) => void;
}

/** 爬虫定义 */
export default class Crawler {
  id = uuid();
  entryPage: SpiderPage | null = null;
  parsedEntryUrl: ParsedUrl | null = null;

  crawlerCache?: CrawlerCache = crawlerCache;
  crawlerOption: CrawlerOption;
  crawlerCallback: CrawlerCallback;

  // 内部所有的蜘蛛列表
  spiders: Spider[] = [];
  spiderQueue: Spider[] = [];
  // 当前正在运行的蜘蛛
  // 蜘蛛去重，仅爬取不重复的蜘蛛
  existedHash = new Set<string>();

  startTime = Date.now();
  isClosed: boolean = false;

  // 爬虫的执行结果
  spidersResultMap: { [key: string]: SpiderResult[] } = {};

  public get status() {
    if (!this.entryPage) {
      return {
        id: this.id,
        progress: 0
      };
    }

    if (this.spiders.length === 0) {
      return {
        id: this.id,
        entryPage: this.entryPage.url,
        progress: 0
      };
    }

    return {
      id: this.id,
      entryPage: this.entryPage.url,
      progress: (this.spiderQueue.length / this.spiders.length).toFixed(2),
      startedAt: this.startTime,
      spiders: this.spiders.map(s => s.status)
    };
  }

  constructor(
    crawlerOption: Partial<CrawlerOption> = defaultCrawlerOption,
    cb: CrawlerCallback = {}
  ) {
    this.crawlerOption = { ...defaultCrawlerOption, ...crawlerOption };
    this.crawlerCallback = cb;
  }

  // 启动爬虫
  async start(entryPage: SpiderPage): Promise<CrawlerResult> {
    const entryUrl = entryPage.url;

    this.entryPage = entryPage;
    this.parsedEntryUrl = parseUrl(entryUrl);
    this.existedHash.add(hashUrl(entryUrl, 'GET'));

    // 判断是否存在缓存
    if (this.crawlerCache && this.crawlerOption.useCache) {
      const cache = await this.crawlerCache.queryCrawler(entryUrl);

      if (cache) {
        logger.info(`>>>Crawler>>>return>>>Use cache ${entryUrl}`);
        return cache;
      }
    }

    this.initMonitor();

    // 初始化首个爬虫
    const spider = new PageSpider(entryPage, this, {});

    // 这里为了处理跳转的情况，因此初始化两次
    const spiderWithRedirect = new PageSpider(entryPage, this, {
      allowRedirect: true
    });

    this.spiderQueue = [spider, spiderWithRedirect];
    this.spiders = [spider, spiderWithRedirect];

    const weakfileSpider = new WeakfileSpider(entryPage, this, {});
    this.spiderQueue.push(weakfileSpider);
    this.spiders.push(weakfileSpider);

    this.startTime = Date.now();

    this.next();

    const resp = {
      id: this.id,
      isFinished: false,
      startedAt: new Date(),
      status: {
        progress: 0
      }
    };

    if (this.crawlerCache) {
      // 这里会立刻返回结果，Koa 会自动缓存，等待爬虫执行完毕之后，其会自动地去复写缓存
      this.crawlerCache.cacheCrawler(entryUrl, resp);
    }

    logger.info(`>>>Crawler>>>start>>>Start crawling ${entryUrl}`);

    return resp;
  }

  /** 初始化超时监听函数 */
  async initMonitor() {
    const intl = setTimeout(() => {
      logger.info(
        `${new Date()} -- Stop crawling ${this.entryPage!.url} -- with Timeout`
      );

      // 执行回调函数
      this.finish();

      // 完成对于自身的清理，避免出现内存泄露
      clearTimeout(intl);
    }, this.crawlerOption.timeout);
  }

  // 某个 Spider 执行完毕，触发 Crawler 执行下一个请求
  async next(
    { clearTaskQueue }: { clearTaskQueue: boolean } = { clearTaskQueue: false }
  ) {
    if (this.isClosed) {
      return;
    }

    if (clearTaskQueue) {
      this.spiderQueue = [];
    }

    // 如果全部执行完毕，则将结果回写到缓存中
    if (
      this.spiderQueue.length === 0 ||
      Date.now() - this.startTime > this.crawlerOption.timeout
    ) {
      this.finish();
      return;
    } else {
      // 将数据临时写入
      if (this.crawlerCache) {
        // 缓存爬虫结果
        this.crawlerCache.cacheCrawler(this.entryPage!.url, {
          id: this.id,
          isFinished: false,
          metrics: {
            executionDuration: Date.now() - this.startTime,
            spiderCount: this.spiders.length,
            depth: this.crawlerOption.depth
          },
          spiderMap: this.spidersResultMap,
          updatedAt: new Date(),
          progress: (this.spiderQueue.length / this.spiders.length).toFixed(2)
        });
      }
    }

    // 否则获取下一个 Spider
    const spider = this.spiderQueue.shift();

    if (!spider) {
      return;
    }

    // 在蜘蛛执行层容错
    try {
      // 初始化并且执行蜘蛛
      await spider.start();
    } catch (e) {
      // 继续执行下一个蜘蛛
      this.next();
      logger.error('crawler-error>>>spider execution>>>', e.message);
    }
  }

  // 将单个请求添加到结果集中
  public _SPIDER_addRequest(
    spider: Spider,
    result: SpiderResult,
    ignoreAsSpider = false
  ) {
    if (this.isClosed) {
      return;
    }

    if (this.existedHash.has(result.hash)) {
      return;
    } else {
      this.existedHash.add(result.hash);
    }

    // 判断是否为内置脚本
    if (
      result.hash ===
      'cdnjs.cloudflare.com#ajaxlibsgremlins.jsidgremlins.min.js'
    ) {
      return;
    }

    // 判断是否需要过滤非同域请求
    if (this.crawlerOption.isSameOrigin) {
      if (result.parsedUrl.host !== this.parsedEntryUrl!.host) {
        return;
      }
    }

    // 判断是否是要忽略的 url
    if (
      this.crawlerOption.ignoredRegex &&
      shouldIgnore(this.crawlerOption.ignoredRegex, result.url)
    ) {
      return;
    }

    if (!this.spidersResultMap[spider.pageUrl]) {
      // 将该结果添加到蜘蛛的执行结果
      this.spidersResultMap[spider.pageUrl] = [];
    }

    this.spidersResultMap[spider.pageUrl]!.push(result);

    // 判断是否需要创建新的蜘蛛
    // 判断是否需要过滤图片，JS/CSS 等代码资源
    if (this.crawlerOption.isIgnoreAssets) {
      if (
        isMedia(result.url) ||
        result.url.indexOf('.js') > -1 ||
        result.url.indexOf('.css') > -1
      ) {
        return;
      }
    }

    if (ignoreAsSpider) {
      return;
    }

    if (
      this.spiders.length < this.crawlerOption.maxPageCount &&
      spider.spiderOption.depth < this.crawlerOption.depth &&
      // 非 Ajax 类型的页面才进行二次抓取
      result.resourceType !== 'xhr' &&
      result.resourceType !== 'form' &&
      result.resourceType !== 'script'
    ) {
      const nextPage = {
        url: stripBackspaceInUrl(result.url),
        cookies: this.crawlerOption.cookies,
        localStorage: this.crawlerOption.localStorage
      };

      const nextSpider = new PageSpider(nextPage, this, {
        depth: spider.spiderOption.depth + 1
      });

      this.spiderQueue.push(nextSpider);
      this.spiders.push(nextSpider);

      if (isDir(result.parsedUrl.pathname) && this.crawlerOption.useWeakfile) {
        // 判断是否需要添加敏感信息漏洞，仅对于可能为目录的 path 添加
        const weakfileSpider = new WeakfileSpider(nextPage, this, {});

        this.spiderQueue.push(weakfileSpider);
        this.spiders.push(weakfileSpider);
      }

      // 将该请求添加到历史记录中
      this.existedHash.add(result.hash);
    }
  }

  /** 执行关闭函数 */
  private finish() {
    if (!this.entryPage) {
      return;
    }

    if (this.isClosed) {
      return;
    }

    logger.info(`${new Date()} -- Stop crawling ${this.entryPage.url}`);

    if (this.crawlerCache) {
      // 缓存爬虫结果
      this.crawlerCache.cacheCrawler(this.entryPage.url, {
        id: this.id,
        isFinished: true,
        metrics: {
          executionDuration: Date.now() - this.startTime,
          spiderCount: this.spiders.length,
          depth: this.crawlerOption.depth
        },
        spiderMap: this.spidersResultMap
      });
    }

    // 清理所有的蜘蛛队列，清理所有的蜘蛛
    this.spiderQueue = [];
    this.spiders = [];

    // 调用回调函数
    if (this.crawlerCallback.onFinish) {
      this.crawlerCallback.onFinish(this);
    }

    // 标记为已关闭，不再执行其他程序
    this.isClosed = true;
  }
}
