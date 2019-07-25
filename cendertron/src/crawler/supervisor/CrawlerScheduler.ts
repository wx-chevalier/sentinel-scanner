import { pool } from './../../render/puppeteer';
import * as uuid from 'uuid/v1';

import { defaultScheduleOption } from './../../config';

import Crawler from '../Crawler';
import { crawlerCache } from '../storage/CrawlerCache';
import { SpiderPage } from '../types';
import { pageQueue } from '../storage/PageQueue';
import { redisClient } from '../storage/db';

import * as puppeteer from 'puppeteer';

/** 默认的爬虫调度器 */
export default class CrawlerScheduler {
  id = uuid();

  /** 正在执行的爬虫 */
  runningCrawler: Record<string, Crawler> = {};

  /** 当前正在执行的爬虫数目 */
  get localRunningCrawlerCount() {
    return Object.keys(this.runningCrawler).length;
  }

  /** 已经执行完毕的爬虫数目 */
  localFinishedCrawlerCount = 0;

  constructor() {
    // 定时器，每 15s 判断下是否有已经完成的爬虫，但是未清除出队列的
    setInterval(() => {
      // 执行爬虫监控
      Object.keys(this.runningCrawler).forEach(url => {
        const c = this.runningCrawler[url];

        if (c.isClosed || Date.now() - c.startTime > c.crawlerOption.timeout) {
          this.onFinish(c);
        }
      });

      // 定期执行下一个目标
      this.next();
      this.report();
    }, 15 * 1000);

    this.report();
  }

  async getStatus() {
    const browserStatus: any[] = [];

    for (const res of (pool as any)._allObjects.keys()) {
      const browser = res.obj as puppeteer.Browser;

      const targets = await browser.targets();

      browserStatus.push({
        targetsCnt: targets.length,
        useCount: (browser as any).useCount,
        urls: targets.map(t => ({
          url: t.url()
        }))
      });
    }

    return {
      id: this.id,
      browserStatus,
      runingCrawlers: Object.keys(this.runningCrawler).map(u =>
        this.runningCrawler[u] ? this.runningCrawler[u]!.status : null
      ),
      localRunningCrawlerCount: this.localRunningCrawlerCount,
      localFinishedCrawlerCount: this.localFinishedCrawlerCount,
      reportTime: new Date().toLocaleString()
    };
  }

  /** 添加某个目标 */
  async addTarget({ request }: { request: SpiderPage }) {
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

    pageQueue.add(request);

    this.next();

    // 返回正在执行
    return resp;
  }

  /** 选取下一个爬虫并且执行 */
  async next() {
    // 判断当前正在执行的爬虫数目，是否超过阈值
    if (
      this.localRunningCrawlerCount >=
      defaultScheduleOption.maxConcurrentCrawler
    ) {
      return;
    }

    const request = await pageQueue.next();

    if (request && request.url) {
      const crawler = new Crawler(request.crawlerOption, {
        onFinish: this.onFinish
      });

      crawler.start(request);

      this.runningCrawler[request.url] = crawler;
    }
  }

  async reset() {
    await pageQueue.clear();
    await crawlerCache.clear('Crawler');
  }

  /** 定期上报爬虫状态 */
  async report() {
    if (redisClient) {
      const status = await this.getStatus();

      redisClient.set(
        `cendertron:status:crawler-scheduler:${this.id}`,
        JSON.stringify(status),
        // 设置过期时间为 30s
        'EX',
        60
      );
    }
  }

  /** 爬虫执行完毕的回调 */
  onFinish = async (crawler: Crawler) => {
    // 如果不在运行，则关闭
    if (!this.runningCrawler[crawler.entryPage!.url]) {
      return;
    }

    this.localFinishedCrawlerCount++;

    // 清除正在的缓存
    delete this.runningCrawler[crawler.entryPage!.url];

    // 否则执行下一个爬虫
    this.next();
  };
}
