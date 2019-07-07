import { CrawlerOption } from './../CrawlerOption';

import Crawler from '../Crawler';
import { crawlerCache } from '../CrawlerCache';
import { logger } from './logger';
import { SpiderPage } from '../types';
import defaultCrawlerOption from '../CrawlerOption';

export interface ScheduleOption {
  // 并发爬虫数
  maxConcurrentCrawler: number;

  // 重置浏览器的阈值
  resetThreshold: number;
}

export const defaultScheduleOption: ScheduleOption = {
  maxConcurrentCrawler: 2,
  resetThreshold: 50
};

/** 默认的爬虫调度器 */
export default class CrawlerScheduler {
  crawlerOption?: Partial<CrawlerOption>;

  /** 待执行的爬虫队列 */
  pageQueue: SpiderPage[] = [];
  /** 正在执行的爬虫 */
  runningCrawler: Record<string, Crawler | null> = {};

  /** 当前是否正在等待重启 */
  waitingForReset = false;
  /** 当前正在执行的爬虫数目 */
  runningCrawlerCount = 0;
  /** 已经执行完毕的爬虫数目 */
  finishedCrawlerCount = 0;

  get status() {
    return {
      pageQueue: this.pageQueue,
      runingCrawlers: Object.keys(this.runningCrawler).map(u =>
        this.runningCrawler[u] ? this.runningCrawler[u]!.status : null
      ),
      waitingForReset: this.waitingForReset,
      runningCrawlerCount: this.runningCrawlerCount,
      finishedCrawlerCount: this.finishedCrawlerCount
    };
  }

  /** 添加某个目标 */
  addTarget({
    url,
    request,
    crawlerOption
  }: {
    url?: string;
    request?: SpiderPage;
    crawlerOption?: Partial<CrawlerOption>;
  }) {
    if (!url && !request) {
      throw new Error('Invalid request');
    }

    const finalUrl = url || request!.url;
    const cacheResult = crawlerCache.queryCrawler(finalUrl);

    // 判断是否存在于缓存中，如果存在则直接返回
    if (cacheResult) {
      return cacheResult;
    }

    // 判断是否正在爬取
    const c = this.runningCrawler[finalUrl];

    // 判断是否正在爬取，如果正在爬取，则返回进度
    if (c) {
      return {
        isFinished: false,
        status: c.status
      };
    }

    // 这里立刻加入到缓存中，避免异步加入缓存带来的冲突
    const resp = {
      isFinished: false,
      progress: 0,
      startedAt: new Date()
    };

    crawlerCache.cacheCrawler(finalUrl, resp);

    if (url) {
      // 不存在则直接创建，压入队列
      this.pageQueue.push({ url });
    } else {
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
      this.runningCrawlerCount > defaultScheduleOption.maxConcurrentCrawler ||
      this.waitingForReset
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

      this.runningCrawlerCount++;
    }
  }

  /** 爬虫执行完毕的回调 */
  onFinish = async (crawler: Crawler) => {
    // 如果不在运行，则关闭
    if (!this.runningCrawler[crawler.entryPage!.url]) {
      return;
    }

    this.runningCrawlerCount--;
    this.finishedCrawlerCount++;

    // 清除正在的缓存
    this.runningCrawler[crawler.entryPage!.url] = null;

    // 如果已经超过阈值，则准备重启浏览器
    if (this.finishedCrawlerCount > defaultScheduleOption.resetThreshold) {
      this.waitingForReset = true;

      // 判断当前正在运行的爬虫数目
      if (this.runningCrawlerCount < 1) {
        // 重置默认的浏览器
        logger.info(
          `>>>scheduler>>>reset browser>>>(${this.runningCrawlerCount},${
            this.finishedCrawlerCount
          })`
        );

        // 将计数器归零
        this.finishedCrawlerCount = 0;
        this.waitingForReset = false;
      }
    } else {
      // 否则执行下一个爬虫
      this.runNext();
    }
  };
}
