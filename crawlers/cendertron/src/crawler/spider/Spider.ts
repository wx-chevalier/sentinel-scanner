import * as puppeteer from 'puppeteer';
import * as parse from 'url-parse';

import defaultCrawlerOption from '../CrawlerOption';
import { RequestMap, ParsedUrl } from '../../shared/constants';
import { initPage } from '../../render/puppeteer';

/** 通用的蜘蛛接口 */

export default class Spider {
  browser: puppeteer.Browser;
  pageUrl: string;
  crawlerOption = defaultCrawlerOption;

  _page?: puppeteer.Page;
  _parsedUrl?: ParsedUrl;

  resultMap: RequestMap = {
    apis: [],
    pages: [],
    scripts: [],
    media: []
  };

  constructor(
    browser: puppeteer.Browser,
    pageUrl: string,
    crawlerOption = defaultCrawlerOption
  ) {
    this.browser = browser;
    this.pageUrl = pageUrl;
    this.crawlerOption = crawlerOption;

    // 执行初始化构造
    this.init();
  }

  async init() {
    this._page = await initPage(this.browser);
    this._parsedUrl = parse(this.pageUrl, this.pageUrl, true);
  }

  // 将单个请求添加到结果集中
  //   private addRequest(request: Request, type = 'apis') {
  //     // 判断是否需要过滤图片
  //     // 判断是否需要过滤非同域请求
  //   }

  // 将某个结果集合并到结果集中
  //   private addRequestMap(requestMap: RequestMap) {}
}
