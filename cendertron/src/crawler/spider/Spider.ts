import { ISpider, SpiderOption, defaultSpiderOption } from './ISpider';
import Crawler from '../Crawler';

import { SpiderResult } from './../types';
import {
  transfromUrlToResult,
  stripBackspaceInUrl
} from '../../utils/transformer';
import { logger } from '../supervisor/logger';
import { SpiderPage } from '../types';

/** 通用的蜘蛛接口 */
export default class Spider implements ISpider {
  type: string = 'base';

  // 蜘蛛所属的爬虫对象
  crawler: Crawler;
  spiderPage: SpiderPage;
  pageUrl: string;
  pageResult?: SpiderResult;

  // 蜘蛛配置
  spiderOption: SpiderOption = defaultSpiderOption;
  // 是否关闭
  isClosed: boolean = false;

  // 某个爬虫的结果集合
  result = [];

  constructor(
    spiderPage: SpiderPage,
    crawler: Crawler,
    spiderOption: Partial<SpiderOption>
  ) {
    this.spiderPage = spiderPage;

    this.pageUrl = stripBackspaceInUrl(spiderPage.url);
    this.crawler = crawler;
    this.spiderOption = { ...defaultSpiderOption, ...spiderOption };

    this.pageResult = transfromUrlToResult(spiderPage.url, 'GET');
  }

  /** 启动爬虫 */
  public async start() {
    logger.error('Should Implement init');
    Promise.resolve().then(() => {
      this.run();
    });
  }

  /** 执行爬取操作 */
  protected async run() {
    logger.error('Should Implement run');
  }

  async exception() {
    logger.error('Should Implement exception');
  }
}
