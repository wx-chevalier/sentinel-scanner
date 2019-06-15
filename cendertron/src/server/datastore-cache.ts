import * as Koa from 'koa';
import * as NodeCache from 'node-cache';
import { logger } from '../crawler/supervisor/logger';

type ResponseCache = {
  saved: Date;
  expires: Date;
  headers: string;
  payload: string;
};

export const nodeCache = new NodeCache();

export class DatastoreCache {
  /** 缓存响应结果 */
  async cacheResponse(key: string, headers: {}, payload: Buffer | object) {
    // 默认缓存 1 小时
    const cacheDurationMinutes = 1 * 60;
    const now = new Date();
    const entity = {
      saved: now,
      expires: new Date(now.getTime() + cacheDurationMinutes * 60 * 1000),
      headers: JSON.stringify(headers),
      payload: JSON.stringify(payload)
    };

    // 默认缓存 1 小时
    await nodeCache.set(key, entity, cacheDurationMinutes * 60);
  }

  /** 清空全部的响应缓存 */
  async clearCache(
    type: 'Page' | 'Spider' | 'Crawler' = 'Crawler',
    urlOrHash?: string
  ) {
    const mykeys = nodeCache.keys();
    nodeCache.del(
      mykeys.filter(key =>
        urlOrHash
          ? key.indexOf(type) > -1 && key.indexOf(urlOrHash) > -1
          : key.indexOf(type) > -1
      )
    );
  }

  /**
   * Returns middleware function.
   */
  middleware() {
    const cacheContent = this.cacheResponse.bind(this);

    return async function(
      this: DatastoreCache,
      ctx: Koa.Context,
      next: () => Promise<unknown>
    ) {
      // 这里是以完整的请求路径作为参数
      const key = ['Page', ctx.url].join('#');
      const content = nodeCache.get(key) as ResponseCache;

      if (content !== undefined) {
        // 如果请求存在并且尚未过期，则直接返回结果
        if (
          content.expires.getTime() >= new Date().getTime() &&
          ctx.url.indexOf('/scrape') < 0
        ) {
          const headers = JSON.parse(content.headers);
          ctx.set(headers);
          ctx.set('x-cendertron-cached', content.saved.toUTCString());
          try {
            let payload = JSON.parse(content.payload);
            if (
              payload &&
              typeof payload === 'object' &&
              payload.type === 'Buffer'
            ) {
              payload = new Buffer(payload);
            }
            ctx.body = payload;
            return;
          } catch (error) {
            logger.error(
              'Erroring parsing cache contents, falling back to normal render'
            );
          }
        }
      }

      await next();

      if (ctx.status === 200) {
        // 缓存内容
        cacheContent(key, ctx.response.headers, ctx.body);
      }
    }.bind(this);
  }
}
