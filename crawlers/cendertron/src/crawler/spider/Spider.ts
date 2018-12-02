import { ISpider } from './ISpider';
import Crawler from '../Crawler';
import { ResultMap, Request } from '../types';
import { transformUrlToRequest } from '../../shared/transformer';

/** 通用的蜘蛛接口 */
export default class Spider implements ISpider {
  // 蜘蛛所属的爬虫对象
  crawler: Crawler;
  pageUrl: string;
  pageRequest?: Request;

  // 蜘蛛所处的深度
  depth: number = 0;

  // 某个爬虫的结果集合
  resultMap: ResultMap = {
    apis: [],
    pages: [],
    scripts: [],
    media: []
  };

  constructor(pageUrl: string, crawler: Crawler, depth: number) {
    this.pageUrl = pageUrl;
    this.crawler = crawler;
    this.depth = depth;

    this.pageRequest = transformUrlToRequest(pageUrl);
  }

  async init() {
    console.error('Should Implement init');
  }

  async run() {
    console.error('Should Implement run');
  }

  async exception() {
    console.error('Should Implement exception');
  }
}
