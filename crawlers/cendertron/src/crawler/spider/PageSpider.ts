/** 默认页面爬虫 */
import * as puppeteer from 'puppeteer';

import { ISpider } from './ISpider';
import Spider from './Spider';
import { Request } from '../types';
import { initPage } from '../../render/puppeteer';
import { interceptRequestsInSinglePage } from '../../render/page/interceptor';
import { monkeyClick } from '../../render/monky/click-monkey';
import { evaluateGremlins } from '../../render/monky/gremlins';
import { extractRequestsFromHTMLInSinglePage } from '../extractor/html-extractor';

import { transformUrlToRequest } from '../../shared/transformer';

export class PageSpider extends Spider implements ISpider {
  page?: puppeteer.Page;

  // 捕获的请求
  requests: Request[] = [];

  // 打开的新界面
  openedUrls: string[] = [];

  // 创建的监听器
  listeners?: ((...args: any[]) => void)[];

  // 蜘蛛内页面去重
  existedUrlsHash = new Set<string>();

  async init() {
    if (!this.crawler.browser) {
      console.error('Crawler context is not readdy!');
      return;
    }

    this.page = await initPage(this.crawler.browser);

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
      await this.page!.goto(this.pageUrl, {
        timeout: 20 * 1000,

        // 等待到页面加载完毕
        waitUntil: 'domcontentloaded'
      });

      // 禁止页面跳转
      await this.page.evaluate(`
        (Array.from(document.querySelectorAll("a"))).forEach(($ele)=>$ele.setAttribute("target","_blank"))
      `);

      await this.page.evaluate(`
          window.onbeforeunload = function() { 
            return "XXX";
          }
      `);

      await this._monkeyDance();

      await this._parse();
    } catch (_) {}

    // 确保页面关闭
    if (!this.page.isClosed()) {
      this.page.close();
    }

    this.crawler.next();
  }

  public async _monkeyDance() {
    if (!this.page) {
      throw new Error('Please init this spider!');
    }

    // 页面加载完毕后插入 Monkey 脚本
    await Promise.all([monkeyClick(this.page), evaluateGremlins(this.page)]);

    await this.page.waitFor(5 * 1000);
  }

  public async _parse() {
    if (!this.page) {
      throw new Error('Please init this spider!');
    }

    // 将所有打开的页面加入
    this.openedUrls.forEach(url => {
      const r = transformUrlToRequest(url);
      if (!this.existedUrlsHash.has(r.hash)) {
        this.crawler._SPIDER_addRequest(this, r, 'apis');
        this.existedUrlsHash.add(r.hash);
      }
    });

    // 将所有请求加入
    for (const r of this.requests) {
      const { resourceType } = r;

      if (!this.existedUrlsHash.has(r.hash)) {
        this.existedUrlsHash.add(r.hash);
      } else {
        continue;
      }

      if (resourceType === 'document') {
        this.crawler._SPIDER_addRequest(this, r, 'pages');
      } else {
        this.crawler._SPIDER_addRequest(this, r, 'apis');
      }
    }

    // 解析页面中生成的元素，最后解析
    (await extractRequestsFromHTMLInSinglePage(this.page)).forEach(r => {
      if (!this.existedUrlsHash.has(r.hash)) {
        this.crawler._SPIDER_addRequest(
          this,
          r,
          r.resourceType ? 'apis' : 'pages'
        );
        this.existedUrlsHash.add(r.hash);
      }
    });
  }
}
