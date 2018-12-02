import * as puppeteer from 'puppeteer';

import { defaultCrawlerOption, CrawlerOption } from './CrawlerOption';
import Spider from './spider/Spider';
import { PageSpider } from './spider/PageSpider';
import { ResultMap, CrawlerResult, Request, ParsedUrl } from './types';
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
  // 蜘蛛去重，仅爬取不重复的蜘蛛
  private existedSpidersHash = new Set<string>();

  private startTime = Date.now();

  // 爬虫的执行结果
  private crawlerResult: { [key: string]: ResultMap } = {};

  constructor(
    browser: puppeteer.Browser,
    crawlerOption: CrawlerOption = defaultCrawlerOption
  ) {
    this.browser = browser;
    this.crawlerOption = crawlerOption;
  }

  // 启动爬虫
  async start(entryUrl: string): Promise<CrawlerResult> {
    this.entryUrl = entryUrl;
    this.parsedEntryUrl = parseUrl(entryUrl);
    this.existedSpidersHash.add(hashUrl({ url: entryUrl }));

    // 判断是否存在缓存
    if (crawlerCache.queryCrawler(entryUrl)) {
      return crawlerCache.queryCrawler(entryUrl);
    }

    // 初始化首个爬虫
    const spider = new PageSpider(entryUrl, this, 1);

    this.spiderQueue = [];
    this.spiders = [];
    this.spiderQueue.push(spider);

    this.next();

    // 这里会立刻返回结果，Koa 会自动缓存，等待爬虫执行完毕之后，其会自动地去复写缓存
    crawlerCache.cacheCrawler(this.entryUrl, {});

    return {
      isFinished: false
    };
  }

  // 某个 Spider 执行完毕，触发 Crawler 执行下一个请求
  async next() {
    // 如果全部执行完毕，则将结果回写到缓存中
    if (this.spiderQueue.length === 0) {
      crawlerCache.cacheCrawler(this.entryUrl, this.crawlerResult, true);
      return;
    }

    // 否则获取下一个 Spider
    const spider = this.spiderQueue.shift();

    if (!spider) {
      return;
    }

    // 从全局缓存中获取到蜘蛛的缓存结果，直接解析该结果

    // 初始化并且执行蜘蛛
    await spider.init();
    spider.run();
  }

  // 获取爬虫当前的状态
  async stats() {}

  // 聚合爬虫中的所有蜘蛛的结果
  async report() {
    return this.crawlerResult;
  }

  // 将单个请求添加到结果集中
  public _SPIDER_addRequest(
    spider: Spider,
    request: Request,
    type: keyof ResultMap = 'apis'
  ) {
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
    if (!this.crawlerResult[spider.pageUrl]) {
      this.crawlerResult[spider.pageUrl] = {};
    }

    if (!this.crawlerResult[spider.pageUrl][type]) {
      this.crawlerResult[spider.pageUrl][type] = [];
    }

    this.crawlerResult[spider.pageUrl][type]!.push(request);

    // 判断是否需要创建新的蜘蛛
    if (
      this.spiders.length < this.crawlerOption.maxPageCount &&
      spider.depth < this.crawlerOption.depth &&
      !this.existedSpidersHash.has(request.hash) &&
      // 非 Ajax 类型的页面才进行二次抓取
      request.resourceType !== 'xhr' &&
      request.resourceType !== 'form' &&
      request.resourceType !== 'script'
    ) {
      const nextSpider = new PageSpider(request.url, this, spider.depth + 1);

      this.spiderQueue!.push(nextSpider);
      this.spiders.push(nextSpider);

      this.existedSpidersHash.add(request.hash);
    }
  }
}
