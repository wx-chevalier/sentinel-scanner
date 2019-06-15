import { nodeCache } from '../server/datastore-cache';
import { CrawlerResult, SpiderResult } from './types';

type SpiderCache = {
  saved: Date;
  expires: Date;
  requestMap: string;
};

const spiderKey = (urlHash: string) => ['Spider', urlHash].join('#');
const crawlerKey = (url: string) => ['Crawler', url].join('#');

export class CrawlerCache {
  /** 缓存蜘蛛的执行结果 */
  async cacheSpider(urlHash: string, requestMap: SpiderResult[]) {
    // 默认缓存 24 小时
    const cacheDurationMinutes = 60 * 24;
    const key = spiderKey(urlHash);

    const now = new Date();

    const entity = {
      saved: now,
      expires: new Date(now.getTime() + cacheDurationMinutes * 60 * 1000),
      requestMap: JSON.stringify(requestMap)
    };
    nodeCache.set(key, entity);
  }

  /** 查询蜘蛛的执行结果 */
  async querySpiderCache(urlHash: string): Promise<SpiderResult[] | null> {
    const key = spiderKey(urlHash);
    const result = nodeCache.get(key) as SpiderCache;

    if (result !== undefined) {
      // 执行反序列化操作
      return JSON.parse(result.requestMap);
    }

    return null;
  }

  /** 缓存某个爬虫的最终执行结果，复写之前的缓存结果 */
  async cacheCrawler(url: string, crawlerResult: CrawlerResult) {
    const key = crawlerKey(url);

    nodeCache.set(key, crawlerResult);
  }

  /**
   * 查询爬虫结果
   * @param url
   */
  queryCrawler(url: string) {
    const key = crawlerKey(url);

    return nodeCache.get(key) as CrawlerResult;
  }
}

export const crawlerCache = new CrawlerCache();
