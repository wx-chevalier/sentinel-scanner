import * as IORedis from 'ioredis';
const Redis = require('ioredis');

import { getLocalConfig } from '../../config';
import { logger } from '../supervisor/logger';

// 设置 Redis 实例，如果存在 Redis 实例，则使用 Redis 作为中心化的缓存
export let redisClient: IORedis.Redis | undefined = undefined;
const localConfig = getLocalConfig();

if (localConfig && localConfig.db && localConfig.db.redis) {
  redisClient = new Redis({ ...localConfig.db.redis, maxRetriesPerRequest: 1 });

  redisClient!.time().then(serverTimes => {
    const dateTime = new Date(
      Number(String(serverTimes[0]) + String(serverTimes[1]).substring(0, 3))
    );

    logger.info(
      `>>>CrawlerCache>>>[redis] instance status OK, redis server currentTime: ${dateTime}`
    );
  });

  redisClient!.on('error', err => {
    // 断开当前连接
    redisClient!.quit();
    redisClient = undefined;

    logger.error('>>>CrawlerCache>>>Init>>>' + err);
  });
}
