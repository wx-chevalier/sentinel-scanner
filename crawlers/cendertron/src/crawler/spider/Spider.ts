import { SpiderResult } from './../types';
import { ISpider } from './ISpider';
import Crawler from '../Crawler';

import { transformUrlToRequest } from '../../shared/transformer';
import { logger } from '../supervisor/logger';

/** 通用的蜘蛛接口 */
export default class Spider implements ISpider {
  // 蜘蛛所属的爬虫对象
  crawler: Crawler;
  pageUrl: string;
  pageRequest?: SpiderResult;

  // 蜘蛛所处的深度
  depth: number = 0;

  // 某个爬虫的结果集合
  result = [];

  constructor(pageUrl: string, crawler: Crawler, depth: number) {
    this.pageUrl = pageUrl;
    this.crawler = crawler;
    this.depth = depth;

    this.pageRequest = transformUrlToRequest(pageUrl);
  }

  async init() {
    logger.error('Should Implement init');
  }

  async run() {
    logger.error('Should Implement run');
  }

  async exception() {
    logger.error('Should Implement exception');
  }
}
