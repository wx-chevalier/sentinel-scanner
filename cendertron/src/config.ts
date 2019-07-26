import * as fs from 'fs-extra';

import { CrawlerOption } from './crawler/CrawlerOption';

const globalConfigPath = '/etc/wsat/config.json';

/** 获取本地配置，这里随用随取，方便响应变化 */
export function getLocalConfig() {
  const configObj = fs.readJsonSync(globalConfigPath, { throws: false });

  return configObj;
}

export interface ScheduleOption {
  // 并发爬虫数
  maxConcurrentCrawler: number;
}

export const defaultScheduleOption: ScheduleOption = {
  maxConcurrentCrawler: 1
};

export const defaultCrawlerOption: CrawlerOption = {
  // 爬取深度
  depth: 4,

  // 单爬虫最多爬取页面数
  maxPageCount: 500,
  // 默认超时为 20 分钟
  timeout: 20 * 60 * 1000,
  // 跳转超时为 30s
  navigationTimeout: 30 * 1000,
  // 单页超时为 60s
  pageTimeout: 60 * 1000,

  isSameOrigin: true,
  isIgnoreAssets: true,
  isMobile: false,
  ignoredRegex: '.*logout.*',

  useCache: true,
  useWeakfile: false,
  useClickMonkey: false
};

export const defaultPuppeteerPoolConfig = {
  max: 1, // default
  min: 1, // default
  // how long a resource can stay idle in pool before being removed
  idleTimeoutMillis: Number.MAX_VALUE, // default.
  // maximum number of times an individual resource can be reused before being destroyed; set to 0 to disable
  acquireTimeoutMillis: defaultCrawlerOption.pageTimeout * 2,
  maxUses: 0, // default
  // function to validate an instance prior to use; see https://github.com/coopernurse/node-pool#createpool
  validator: () => Promise.resolve(true), // defaults to always resolving true
  // validate resource before borrowing; required for `maxUses and `validator`
  testOnBorrow: true // default
  // For all opts, see opts at https://github.com/coopernurse/node-pool#createpool
};
