import { SpiderPage } from '../types';
import { redisClient } from './db';

let _localQueue: SpiderPage[] = [];

// 这里使用 Sorted Set 去重，使用 List 存放请求相关的信息

const queueListKey = 'cendertron:page-queue:list';
const queueSetKey = 'cendertron:page-queue:set';

export class PageQueue {
  async length() {
    if (redisClient) {
      return await redisClient.zcard(queueSetKey);
    } else {
      return _localQueue.length;
    }
  }

  /** 判断是否存在某个请求 */
  async has(page: SpiderPage) {
    if (redisClient) {
      const resp = await redisClient.zrank(queueSetKey, page.url);

      if (resp) {
        return true;
      } else {
        return false;
      }
    } else {
      return _localQueue.map(s => s.url).indexOf(page.url) > -1;
    }
  }

  /** 添加某个请求 */
  async add(page: SpiderPage) {
    try {
      const isHas = await this.has(page);
      if (isHas) {
        return false;
      }

      if (redisClient) {
        await redisClient.zadd(queueSetKey, `${Date.now()}`, page.url);
        await redisClient.rpush(queueListKey, JSON.stringify(page));
      } else {
        return _localQueue.push(page);
      }
    } catch (e) {
      console.error(e);
    }
  }

  /** 获取某个请求详情 */
  async next(): Promise<SpiderPage | undefined> {
    try {
      if (redisClient) {
        const nextPage = await redisClient.lpop(queueListKey);

        if (nextPage) {
          const pageObj = JSON.parse(nextPage) as SpiderPage;

          // 这里会再次判断下是否存在
          if (this.has(pageObj)) {
            await redisClient.zrem(queueSetKey, pageObj.url);
            return pageObj;
          } else {
            return undefined;
          }
        }
      } else {
        return _localQueue.shift();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async clear() {
    if (redisClient) {
      await redisClient.del(queueListKey);
      await redisClient.del(queueSetKey);
    } else {
      _localQueue = [];
    }
  }
}

export const pageQueue = new PageQueue();
