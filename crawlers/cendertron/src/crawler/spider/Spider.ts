import * as parse from 'url-parse';

import Crawler from '../Crawler';
import { RequestMap, ParsedUrl } from '../../shared/constants';

/** 通用的蜘蛛接口 */
export default class Spider {
  // 蜘蛛所属的爬虫对象
  crawler: Crawler;
  pageUrl: string;
  parsedUrl?: ParsedUrl;

  // 某个爬虫的结果集合
  resultMap: RequestMap = {
    apis: [],
    pages: [],
    scripts: [],
    media: []
  };

  constructor(pageUrl: string, crawler: Crawler) {
    this.pageUrl = pageUrl;
    this.crawler = crawler;

    this.parsedUrl = parse(pageUrl, pageUrl, true);
  }

  async init() {
    console.error('Should Implement Run');
  }

  async run() {
    console.error('Should Implement Run');
  }

  // 将单个请求添加到结果集中
  //   private addRequest(request: Request, type = 'apis') {
  //     // 判断是否需要过滤图片
  //     // 判断是否需要过滤非同域请求
  //   }

  // 将某个结果集合并到结果集中
  //   private addRequestMap(requestMap: RequestMap) {}
}
