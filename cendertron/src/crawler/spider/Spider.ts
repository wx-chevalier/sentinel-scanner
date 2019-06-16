import { ISpider, SpiderOption, defaultSpiderOption } from './ISpider';
import Crawler from '../Crawler';

import { SpiderResult } from './../types';
import { transformUrlToResult } from '../../shared/transformer';
import { logger } from '../supervisor/logger';
import { SpiderPage } from '../types';

/** 通用的蜘蛛接口 */
export default class Spider implements ISpider {
  // 蜘蛛所属的爬虫对象
  crawler: Crawler;
  spiderPage: SpiderPage;
  pageUrl: string;
  pageResult?: SpiderResult;

  // 蜘蛛配置
  spiderOption: SpiderOption = defaultSpiderOption;

  // 某个爬虫的结果集合
  result = [];

  constructor(
    spiderPage: SpiderPage,
    crawler: Crawler,
    spiderOption: Partial<SpiderOption>
  ) {
    this.spiderPage = spiderPage;
    this.pageUrl = spiderPage.url;
    this.crawler = crawler;
    this.spiderOption = { ...defaultSpiderOption, ...spiderOption };

    this.pageResult = transformUrlToResult(spiderPage.url);
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
