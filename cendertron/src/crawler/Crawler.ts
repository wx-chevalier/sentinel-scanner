import { logger } from './supervisor/logger';
import * as puppeteer from 'puppeteer';

import { defaultCrawlerOption, CrawlerOption } from './CrawlerOption';
import Spider from './spider/Spider';
import { PageSpider } from './spider/PageSpider';
import { CrawlerResult, SpiderResult, ParsedUrl, SpiderPage } from './types';
import { isMedia } from '../utils/validator';
import { parseUrl } from '../utils/transformer';
import { hashUrl } from '../utils/model';
import { CrawlerCache, crawlerCache } from './CrawlerCache';

export interface CrawlerCallback {
  onStart: () => void;
  onFinish: () => void;
}

/** 爬虫定义 */
export default class Crawler {
  entryPage: SpiderPage | null = null;
  parsedEntryUrl: ParsedUrl | null = null;

  browser: puppeteer.Browser;
  crawlerCache?: CrawlerCache = crawlerCache;
  crawlerOption: CrawlerOption;

  // 内部所有的蜘蛛列表
  private spiders: Spider[] = [];
  private spiderQueue: Spider[] = [];
  // 当前正在运行的蜘蛛
  // 蜘蛛去重，仅爬取不重复的蜘蛛
  private existedSpidersHash = new Set<string>();

  private startTime = Date.now();
  private isClosed: boolean = false;

  // 爬虫的执行结果
  private spidersResultMap: { [key: string]: SpiderResult[] } = {};

  constructor(
    browser: puppeteer.Browser,
    crawlerOption: Partial<CrawlerOption>
  ) {
    this.browser = browser;
    this.crawlerOption = { ...defaultCrawlerOption, ...crawlerOption };
  }

  // 启动爬虫
  async start(entryPage: SpiderPage): Promise<CrawlerResult> {
    const entryUrl = entryPage.url;

    this.entryPage = entryPage;
    this.parsedEntryUrl = parseUrl(entryUrl);
    this.existedSpidersHash.add(hashUrl({ url: entryUrl }));

    // 判断是否存在缓存
    if (
      this.crawlerCache &&
      this.crawlerCache.queryCrawler(entryUrl) &&
      this.crawlerOption.useCache
    ) {
      return this.crawlerCache.queryCrawler(entryUrl);
    }

    this.initMonitor();

    // 初始化首个爬虫
    const spider = new PageSpider(entryPage, this, {
      // 仅在首个爬虫处允许敏感文件扫描
      useWeakfile: true
    });
    // 这里为了处理跳转的情况，因此初始化两次
    const spiderWithRedirect = new PageSpider(entryPage, this, {
      allowRedirect: true
    });

    this.spiderQueue = [spider, spiderWithRedirect];
    this.spiders = [spider, spiderWithRedirect];

    this.startTime = Date.now();

    this.next();

    if (this.crawlerCache) {
      // 这里会立刻返回结果，Koa 会自动缓存，等待爬虫执行完毕之后，其会自动地去复写缓存
      this.crawlerCache.cacheCrawler(entryUrl, {
        isFinished: false
      });
    }

    logger.info(`${new Date()} -- Start crawling ${entryUrl}`);

    return {
      isFinished: false
    };
  }

  async initEntrySpider() {}

  /** 初始化超时监听函数 */
  async initMonitor() {
    const intl = setTimeout(() => {
      // 执行回调函数
      this.finish();

      // 完成对于自身的清理，避免出现内存泄露
      clearTimeout(intl);
    }, this.crawlerOption.timeout);
  }

  // 某个 Spider 执行完毕，触发 Crawler 执行下一个请求
  async next() {
    if (this.isClosed) {
      return;
    }

    // 如果全部执行完毕，则将结果回写到缓存中
    if (
      this.spiderQueue.length === 0 ||
      Date.now() - this.startTime > this.crawlerOption.timeout
    ) {
      this.finish();
      return;
    }

    // 否则获取下一个 Spider
    const spider = this.spiderQueue.shift();

    if (!spider) {
      return;
    }

    // Todo 从全局缓存中获取到蜘蛛的缓存结果，直接解析该结果

    // 将该结果添加到蜘蛛的执行结果
    if (!this.spidersResultMap[spider.pageUrl]) {
      this.spidersResultMap[spider.pageUrl] = [];
    }

    // 在蜘蛛执行层容错
    try {
      // 初始化并且执行蜘蛛
      await spider.init();
      spider.run();
    } catch (e) {
      logger.error('crawler-error>>>spider execution>>>', e.message);
    }
  }

  // 获取爬虫当前的状态
  async stats() {}

  // 聚合爬虫中的所有蜘蛛的结果
  async report() {
    return this.spidersResultMap;
  }

  // 将单个请求添加到结果集中
  public _SPIDER_addRequest(spider: Spider, result: SpiderResult) {
    if (this.isClosed) {
      return;
    }

    // 判断是否需要过滤非同域请求
    if (this.crawlerOption.isSameOrigin) {
      if (result.parsedUrl.host !== this.parsedEntryUrl!.host) {
        return;
      }
    }

    // 将该结果添加到蜘蛛的执行结果
    if (!this.spidersResultMap[spider.pageUrl]) {
      this.spidersResultMap[spider.pageUrl] = [];
    }

    this.spidersResultMap[spider.pageUrl]!.push(result);

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

    // 判断是否需要创建新的蜘蛛
    if (
      this.spiders.length < this.crawlerOption.maxPageCount &&
      spider.spiderOption.depth < this.crawlerOption.depth &&
      !this.existedSpidersHash.has(result.hash) &&
      // 非 Ajax 类型的页面才进行二次抓取
      result.resourceType !== 'xhr' &&
      result.resourceType !== 'form' &&
      result.resourceType !== 'script'
    ) {
      const nextSpider = new PageSpider(
        {
          url: result.url,
          cookies: this.entryPage!.cookies,
          localStorage: this.entryPage!.localStorage
        },
        this,
        {
          depth: spider.spiderOption.depth + 1
        }
      );

      this.spiderQueue!.push(nextSpider);
      this.spiders.push(nextSpider);

      // 将该请求添加到历史记录中
      this.existedSpidersHash.add(result.hash);
    }
  }

  /** 执行关闭函数 */
  private finish() {
    if (!this.entryPage) {
      return;
    }

    logger.info(`${new Date()} -- Stop crawling ${this.entryPage.url}`);

    // 标记为已关闭，不再执行其他程序
    this.isClosed = true;

    if (this.crawlerCache) {
      // 缓存爬虫结果
      this.crawlerCache.cacheCrawler(this.entryPage.url, {
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
    if (this.crawlerOption.onFinish) {
      this.crawlerOption.onFinish(this);
    }
  }
}
