/** 默认页面爬虫 */
import * as puppeteer from 'puppeteer';

import { ISpider } from './ISpider';
import Spider from './Spider';
import { SpiderResult } from '../types';
import { initPage } from '../../render/puppeteer';
import { interceptRequestsInSinglePage } from '../../render/page/interceptor';
import { monkeyClick } from '../../render/monky/click-monkey';
import { evaluateGremlins } from '../../render/monky/gremlins';
import { extractRequestsFromHTMLInSinglePage } from '../extractor/html-extractor';

import { transformUrlToRequest } from '../../shared/transformer';
import { logger } from '../supervisor/logger';

export class PageSpider extends Spider implements ISpider {
  // 目标页面
  page?: puppeteer.Page;

  // 参数设置

  // 捕获的请求
  requests: SpiderResult[] = [];

  // 打开的新界面
  openedUrls: string[] = [];

  // 创建的监听器
  listeners?: ((...args: any[]) => void)[];

  // 蜘蛛内页面去重
  existedUrlsHash = new Set<string>();

  /** 初始化蜘蛛 */
  async init() {
    if (!this.crawler.browser) {
      logger.error('Crawler context is not readdy!');
      return;
    }

    this.page = await initPage(this.crawler.browser);

    // 如果创建失败，则直接返回
    if (!this.page) {
      this.finish();
      return;
    }

    // 设置页面关闭的超时时间
    const intl = setTimeout(() => {
      if (this.page && !this.page.isClosed()) {
        this.page.close().catch(_ => {});
      }
      this.finish();
      clearTimeout(intl);
    }, this.crawler.crawlerOption.pageTimeout);

    // 设置请求监听
    await interceptRequestsInSinglePage(
      this.crawler.browser,
      this.page,
      (_r, _o, listeners) => {
        this.requests = _r;
        this.openedUrls = _o;
        this.listeners = listeners;
      }
    );

    this.existedUrlsHash.add(this.pageRequest!.hash);
  }

  /** 复写父类方法 */
  public async run() {
    if (!this.page) {
      throw new Error('Please init this spider!');
    }

    try {
      // 页面跳转
      const resp = await this.page!.goto(this.pageUrl, {
        timeout: this.crawler.crawlerOption.pageTimeout,

        // 等待到页面加载完毕
        waitUntil: 'domcontentloaded'
      });

      // 如果是 404 界面，则直接返回
      if (resp && resp.status() === 404) {
        this.finish();

        return;
      }

      // 禁止页面跳转
      await this.page.evaluate(`
        (Array.from(document.querySelectorAll("a"))).forEach(($ele)=>$ele.setAttribute("target","_blank"))
      `);

      // 判断是否允许跳转
      if (!this.spiderOption.allowRedirect) {
        // 劫持所有的页内跳转事件
        await this.page.evaluate(`
          window.onbeforeunload = function() { 
            return "XXX";
          }
      `);
      }

      await this._monkeyDance();
    } catch (e) {
      if (e.message.indexOf('navigation') > -1) {
        // 如果是因为重新导航导致的，则将导航后界面加入到下一次处理中
        this.openedUrls.push(this.page.url());
      } else {
        logger.error(`spider-error>>>${e.message}>>>${this.pageUrl}`);
      }
    }

    // 在外部执行解析
    await this._parse();

    this.finish();
  }

  /** 执行 Monkey 操作 */
  public async _monkeyDance() {
    if (!this.page) {
      throw new Error('Please init this spider!');
    }

    // 页面加载完毕后插入 Monkey 脚本
    await Promise.all([monkeyClick(this.page), evaluateGremlins(this.page)]);

    await this.page.waitFor(5 * 1000);
  }

  /** 解析执行结果 */
  public async _parse() {
    if (!this.page) {
      throw new Error('Please init this spider!');
    }

    // 判断 URL 路径是否发生变化
    const currentUrl = this.page.url();

    if (currentUrl !== this.pageUrl) {
      this.pageUrl = currentUrl;
    }

    // 将所有打开的页面加入
    this.openedUrls.forEach(url => {
      const r = transformUrlToRequest(url);
      r.resourceType = 'document';

      if (!this.existedUrlsHash.has(r.hash)) {
        this.crawler._SPIDER_addRequest(this, r);
        this.existedUrlsHash.add(r.hash);
      }
    });

    // 将所有请求加入
    for (const r of this.requests) {
      if (!this.existedUrlsHash.has(r.hash)) {
        this.existedUrlsHash.add(r.hash);
      } else {
        continue;
      }

      this.crawler._SPIDER_addRequest(this, r);
    }

    // 解析页面中生成的元素，最后解析
    (await extractRequestsFromHTMLInSinglePage(this.page)).forEach(r => {
      if (!this.existedUrlsHash.has(r.hash)) {
        this.crawler._SPIDER_addRequest(this, r);
        this.existedUrlsHash.add(r.hash);
      }
    });
  }

  /** 执行结束时候操作 */
  private finish() {
    if (!this.page) {
      return;
    }

    try {
      // 清除本次注册的监听器
      if (this.listeners) {
        this.listeners.forEach(l => {
          this.crawler.browser.removeListener('targetcreated', l);
        });
      }

      // 确保页面关闭
      if (!this.page.isClosed()) {
        this.page.close().catch(_ => {});
      }
    } catch (_) {
      // 这里忽略异常
    }

    this.crawler.next();
  }
}
