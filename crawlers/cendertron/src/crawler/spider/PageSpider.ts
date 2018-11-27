/** 默认页面爬虫 */
import * as puppeteer from 'puppeteer';

import { ISpider } from './ISpider';
import Spider from './Spider';

export class PageSpider extends Spider implements ISpider {
  page?: puppeteer.Page;

  //   constructor(browser, page, crawlerOption = defaultCrawlerOption) {}

  //   private handleException() {}

  /** 复写父类方法 */

  /** 复写父类方法 */
  public async run() {}
}
