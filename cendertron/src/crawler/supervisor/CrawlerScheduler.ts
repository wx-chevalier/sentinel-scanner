import { defaultCrawlerOption, defaultScheduleOption } from './../../config';
import { CrawlerOption } from './../CrawlerOption';

import Crawler from '../Crawler';
import { crawlerCache } from '../CrawlerCache';
import { SpiderPage } from '../types';

/** 默认的爬虫调度器 */
export default class CrawlerScheduler {
  crawlerOption?: Partial<CrawlerOption>;

  /** 待执行的爬虫队列 */
  pageQueue: SpiderPage[] = [];

  /** 正在执行的爬虫 */
  runningCrawler: Record<string, Crawler> = {};

  /** 当前正在执行的爬虫数目 */
  get runningCrawlerCount() {
    return Object.keys(this.runningCrawler).length;
  }

  /** 已经执行完毕的爬虫数目 */
  finishedCrawlerCount = 0;

  constructor() {
    // 定时器，每 15s 判断下是否有已经完成的爬虫，但是未清除出队列的
    setInterval(() => {
      Object.keys(this.runningCrawler).forEach(url => {
        const c = this.runningCrawler[url];

        if (c.isClosed || Date.now() - c.startTime > c.crawlerOption.timeout) {
          this.onFinish(c);
        }
      });
    }, 15 * 1000);
  }

  get status() {
    return {
      pageQueue: this.pageQueue,
      runingCrawlers: Object.keys(this.runningCrawler).map(u =>
        this.runningCrawler[u] ? this.runningCrawler[u]!.status : null
      ),
      runningCrawlerCount: this.runningCrawlerCount,
      finishedCrawlerCount: this.finishedCrawlerCount
    };
  }

  get pageQueueUrls() {
    return this.pageQueue.map(s => s.url);
  }

  /** 添加某个目标 */
  async addTarget({
    request,
    crawlerOption
  }: {
    request: SpiderPage;
    crawlerOption?: Partial<CrawlerOption>;
  }) {
    if (!request) {
      throw new Error('Invalid request');
    }

    const finalUrl = request!.url;
    const cacheResult = await crawlerCache.queryCrawler(finalUrl);

    // 判断是否存在于缓存中，如果存在则直接返回
    if (cacheResult) {
      return { ...cacheResult, from: 'cache' };
    }

    const resp = {
      isFinished: false,
      isStarted: false,
      status: {
        progress: 0
      },
      from: 'scheduler'
    };

    if (this.pageQueueUrls.indexOf(finalUrl) < 0) {
      this.pageQueue.push(request!);
    }

    this.crawlerOption = crawlerOption || defaultCrawlerOption;

    this.runNext();

    // 返回正在执行
    return resp;
  }

  /** 选取下一个爬虫并且执行 */
  runNext() {
    // 判断当前正在执行的爬虫数目，是否超过阈值
    if (
      this.runningCrawlerCount >= defaultScheduleOption.maxConcurrentCrawler
    ) {
      return;
    }

    const request = this.pageQueue.shift();

    if (request && request.url) {
      const crawler = new Crawler(this.crawlerOption, {
        onFinish: this.onFinish
      });

      crawler.start(request);

      this.runningCrawler[request.url] = crawler;
    }
  }

  reset() {
    this.pageQueue = [];
  }

  /** 爬虫执行完毕的回调 */
  onFinish = async (crawler: Crawler) => {
    // 如果不在运行，则关闭
    if (!this.runningCrawler[crawler.entryPage!.url]) {
      return;
    }

    this.finishedCrawlerCount++;

    // 清除正在的缓存
    delete this.runningCrawler[crawler.entryPage!.url];

    // 否则执行下一个爬虫
    this.runNext();
  };
}
