import * as puppeteer from 'puppeteer';

import { defaultCrawlerOption, CrawlerOption } from './CrawlerOption';
import Spider from './spider/Spider';
import { DatastoreCache } from '../server/datastore-cache';
import { PageSpider } from './spider/PageSpider';

/** 爬虫定义 */

export default class Crawler {
  browser: puppeteer.Browser;
  crawlerOption: CrawlerOption;
  datastoreCache: DatastoreCache;

  // 所有的 URL 的队列
  private _urlQueue: string[] = [];

  // 等待执行的 URL 队列
  private _pendingUrlQueue: string[] = [];

  // 内部所有的蜘蛛列表
  private _spiders: Spider[] = [];

  // 当前的执行进度
  private progress: number = 0;

  constructor(
    browser: puppeteer.Browser,
    crawlerOption: CrawlerOption = defaultCrawlerOption,
    datastoreCache: DatastoreCache = new DatastoreCache()
  ) {
    this.browser = browser;
    this.crawlerOption = crawlerOption;
    this.datastoreCache = datastoreCache;
  }

  // 启动爬虫
  async start(entryUrl: string) {
    // 初始化首个爬虫
    const spider = new PageSpider(entryUrl, this);

    // 等待爬虫初始化
    await spider.init();

    // 执行爬虫
    spider.run();

    // 这里会立刻返回结果，Koa 会自动缓存，等待爬虫执行完毕之后，其会自动地去复写缓存
  }

  // 某个 Spider 执行完毕，触发 Crawler 执行下一个请求
  async next(spider: Spider) {
    // 在这里执行对于某个 Spider 的解析
    // 如果全部执行完毕，则将结果写入到
  }

  // 获取爬虫当前的状态
  async stats() {}

  // 聚合爬虫中的所有蜘蛛的结果
  async report() {}
}
