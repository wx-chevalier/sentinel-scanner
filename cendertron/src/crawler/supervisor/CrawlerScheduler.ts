import * as puppeteer from 'puppeteer';

import Crawler from '../Crawler';
import { initPuppeteer } from '../../render/puppeteer';
import { crawlerCache } from '../CrawlerCache';
import { logger } from './logger';

export interface ScheduleOption {
  // 并发爬虫数
  maxConcurrentCrawler: number;

  // 重置浏览器的阈值
  resetThreshold: number;
}

export const defaultScheduleOption: ScheduleOption = {
  maxConcurrentCrawler: 5,
  resetThreshold: 50
};

/** 默认的爬虫调度器 */
export default class CrawlerScheduler {
  browser: puppeteer.Browser;

  /** 待执行的爬虫队列 */
  urlQueue: string[] = [];

  /** 当前是否正在等待重启 */
  waitingForReset = false;
  /** 当前正在执行的爬虫数目 */
  runningCrawlerCount = 0;
  /** 已经执行完毕的爬虫数目 */
  finishedCrawlerCount = 0;

  /** 构造函数 */
  constructor(browser: puppeteer.Browser) {
    this.browser = browser;
  }

  /** 添加某个爬虫 */
  addUrl(url: string) {
    // 判断是否存在于缓存中，如果存在则直接返回
    if (crawlerCache.queryCrawler(url)) {
      return crawlerCache.queryCrawler(url);
    }

    // 不存在则直接创建，压入队列
    this.urlQueue.push(url);
    this.runNext();

    // 返回正在执行
    return {
      isFinished: false
    };
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

    const url = this.urlQueue.shift();

    if (url) {
      const crawler = new Crawler(this.browser, {
        onFinish: this.onFinish
      });

      crawler.start(url);

      this.runningCrawlerCount++;
    }
  }

  /** 爬虫执行完毕的回调 */
  onFinish = async () => {
    this.runningCrawlerCount--;
    this.finishedCrawlerCount++;

    // 如果已经超过阈值，则准备重启浏览器
    if (this.finishedCrawlerCount > defaultScheduleOption.resetThreshold) {
      this.waitingForReset = true;

      // 判断当前正在运行的爬虫数目
      if (this.runningCrawlerCount < 1) {
        logger.info(
          `>>>scheduler>>>reset browser>>>(${this.runningCrawlerCount},${
            this.finishedCrawlerCount
          })`
        );

        // 重启浏览器
        await this.browser.close();
        this.browser = await initPuppeteer();

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
