import { nodeCache } from '../../server/datastore-cache';
import { CrawlerResult, SpiderResult } from '../types';
import { redisClient } from './db';

type SpiderCache = {
  saved: Date;
  expires: Date;
  requestMap: string;
};

const spiderKey = (urlHash: string) => ['Spider', urlHash].join('#');
const crawlerKey = (url: string) => ['Crawler', url].join('#');
const redisCendertronKey = 'cendertron:cache:crawler';

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

    if (redisClient) {
      await redisClient.hset(
        redisCendertronKey,
        key,
        JSON.stringify(crawlerResult)
      );
    } else {
      nodeCache.set(key, crawlerResult);
    }
  }

  /** 查询全部爬虫的数据 */
  async queryAllCrawler() {
    if (redisClient) {
      const data = await redisClient.hkeys(redisCendertronKey);
      return data;
    } else {
      return nodeCache.keys();
    }
  }

  /** 查询爬虫结果 */
  async queryCrawler(url: string) {
    const key = crawlerKey(url);

    if (redisClient) {
      const resp = await redisClient.hget(redisCendertronKey, key);

      try {
        return JSON.parse(resp || '') as CrawlerResult;
      } catch (e) {
        return null;
      }
    } else {
      return nodeCache.get(key) as CrawlerResult;
    }
  }

  /** 清空全部的响应缓存 */
  async clear(
    type: 'Page' | 'Spider' | 'Crawler' = 'Crawler',
    urlOrHash?: string
  ) {
    if (redisClient) {
      if (urlOrHash) {
        const key = crawlerKey(urlOrHash);

        redisClient.hdel(redisCendertronKey, key);
      } else {
        redisClient.del(redisCendertronKey);
      }
    } else {
      const mykeys = nodeCache.keys();

      nodeCache.del(
        mykeys.filter(key =>
          urlOrHash
            ? key.indexOf(type) > -1 && key.indexOf(urlOrHash) > -1
            : key.indexOf(type) > -1
        )
      );
    }
  }
}

export const crawlerCache = new CrawlerCache();
