import { logger } from './supervisor/logger';
import * as puppeteer from 'puppeteer';

import { defaultCrawlerOption, CrawlerOption } from './CrawlerOption';
import Spider from './spider/Spider';
import { PageSpider } from './spider/PageSpider';
import { CrawlerResult, SpiderResult, ParsedUrl } from './types';
import { isMedia } from '../shared/validator';
import { parseUrl } from '../shared/transformer';
import { hashUrl } from '../shared/model';
import { crawlerCache } from './CrawlerCache';

/** 爬虫定义 */
export default class Crawler {
  entryUrl: string = '';
  parsedEntryUrl: ParsedUrl | null = null;

  browser: puppeteer.Browser;
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
  private spidersRequestMap: { [key: string]: SpiderResult[] } = {};

  constructor(
    browser: puppeteer.Browser,
    crawlerOption: Partial<CrawlerOption>
  ) {
    this.browser = browser;
    this.crawlerOption = { ...defaultCrawlerOption, ...crawlerOption };
  }

  // 启动爬虫
  async start(entryUrl: string): Promise<CrawlerResult> {
    this.entryUrl = entryUrl;
    this.parsedEntryUrl = parseUrl(entryUrl);
    this.existedSpidersHash.add(hashUrl({ url: entryUrl }));

    // 判断是否存在缓存
    if (crawlerCache.queryCrawler(entryUrl) && this.crawlerOption.useCache) {
      return crawlerCache.queryCrawler(entryUrl);
    }

    this.initMonitor();

    // 初始化首个爬虫
    const spider = new PageSpider(entryUrl, this, {});
    const spiderWithRedirect = new PageSpider(entryUrl, this, {
      allowRedirect: true
    });

    this.spiderQueue = [spider, spiderWithRedirect];
    this.spiders = [spider, spiderWithRedirect];

    this.startTime = Date.now();

    this.next();

    // 这里会立刻返回结果，Koa 会自动缓存，等待爬虫执行完毕之后，其会自动地去复写缓存
    crawlerCache.cacheCrawler(this.entryUrl, {
      isFinished: false
    });

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
    if (!this.spidersRequestMap[spider.pageUrl]) {
      this.spidersRequestMap[spider.pageUrl] = [];
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
    return this.spidersRequestMap;
  }

  // 将单个请求添加到结果集中
  public _SPIDER_addRequest(spider: Spider, request: SpiderResult) {
    if (this.isClosed) {
      return;
    }

    // 过滤 JS/CSS 等代码资源
    if (request.url.indexOf('.js') > -1 || request.url.indexOf('.css') > -1) {
      return;
    }

    // 判断是否需要过滤图片
    if (this.crawlerOption.isIgnoreAssets) {
      if (isMedia(request.url)) {
        return;
      }
    }

    // 判断是否需要过滤非同域请求
    if (this.crawlerOption.isSameOrigin) {
      if (request.parsedUrl.host !== this.parsedEntryUrl!.host) {
        return;
      }
    }

    // 将该结果添加到蜘蛛的执行结果
    if (!this.spidersRequestMap[spider.pageUrl]) {
      this.spidersRequestMap[spider.pageUrl] = [];
    }

    this.spidersRequestMap[spider.pageUrl]!.push(request);

    // 判断是否需要创建新的蜘蛛
    if (
      this.spiders.length < this.crawlerOption.maxPageCount &&
      spider.spiderOption.depth < this.crawlerOption.depth &&
      !this.existedSpidersHash.has(request.hash) &&
      // 非 Ajax 类型的页面才进行二次抓取
      request.resourceType !== 'xhr' &&
      request.resourceType !== 'form' &&
      request.resourceType !== 'script'
    ) {
      const nextSpider = new PageSpider(request.url, this, {
        depth: spider.spiderOption.depth + 1
      });

      this.spiderQueue!.push(nextSpider);
      this.spiders.push(nextSpider);

      // 将该请求添加到历史记录中
      this.existedSpidersHash.add(request.hash);
    }
  }

  /** 执行关闭函数 */
  private finish() {
    logger.info(`${new Date()} -- Stop crawling ${this.entryUrl}`);

    // 标记为已关闭，不再执行其他程序
    this.isClosed = true;

    // 缓存爬虫结果
    crawlerCache.cacheCrawler(this.entryUrl, {
      isFinished: true,
      metrics: {
        executionDuration: Date.now() - this.startTime,
        spiderCount: this.spiders.length,
        depth: this.crawlerOption.depth
      },
      spiderMap: this.spidersRequestMap
    });

    // 清理所有的蜘蛛队列，清理所有的蜘蛛
    this.spiderQueue = [];
    this.spiders = [];

    // 调用回调函数
    if (this.crawlerOption.onFinish) {
      this.crawlerOption.onFinish(this);
    }
  }
}
