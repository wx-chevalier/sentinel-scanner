/*
 * Copyright 2018 Google Inc. All rights reserved.
 * Copyright 2018 王下邀月熊. All rights reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 not
 * use this file except in compliance with the License. You may obtain a copy
 of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 under
 * the License.
 */

'use strict';

import { DatastoreKey } from '@google-cloud/datastore/entity';
import * as Koa from 'koa';

import Datastore = require('@google-cloud/datastore');
import { RequestMap } from '../shared/constants';

type ResponseCache = {
  saved: Date;
  expires: Date;
  headers: string;
  payload: string;
};

type SpiderCache = {
  saved: Date;
  expires: Date;
  requestMap: RequestMap;
};

type DatastoreObject = {
  [Datastore.KEY]: DatastoreKey;
};

export class DatastoreCache {
  datastore: Datastore = new Datastore();

  /** 缓存爬虫的执行结果 */
  async cacheSpider(urlHash: string, requestMap: RequestMap) {
    // 默认缓存 24 小时
    const cacheDurationMinutes = 60 * 24;
    const key = this.datastore.key(['Page', urlHash]);

    const now = new Date();
    const entity = {
      key,
      data: [
        { name: 'saved', value: now },
        {
          name: 'expires',
          value: new Date(now.getTime() + cacheDurationMinutes * 60 * 1000)
        },
        {
          name: 'requestMap',
          value: JSON.stringify(requestMap),
          excludeFromIndexes: true
        }
      ]
    };
    await this.datastore.save(entity);
  }

  /** 查询爬虫的执行结果 */
  async querySpiderCache(urlHash: string): Promise<SpiderCache | null> {
    const key = this.datastore.key(['Page', urlHash]);
    const results = await this.datastore.get(key);

    if (results.length && results[0] !== undefined) {
      return results[0] as SpiderCache;
    }

    return null;
  }

  /** 清空全部的响应缓存 */
  async clearCache(type: 'Page' | 'Spider' = 'Page') {
    const query = this.datastore.createQuery(type);
    const data = await query.run();
    const entities = data[0];

    const entityKeys = entities.map(
      entity => (entity as DatastoreObject)[this.datastore.KEY]
    );

    console.log(`Removing ${entities.length} items from the cache`);

    await this.datastore.delete(entityKeys);
  }

  /** 缓存响应结果 */
  async cacheResponse(key: DatastoreKey, headers: {}, payload: Buffer) {
    // 默认缓存 24 小时
    const cacheDurationMinutes = 60 * 24;
    const now = new Date();
    const entity = {
      key: key,
      data: [
        { name: 'saved', value: now },
        {
          name: 'expires',
          value: new Date(now.getTime() + cacheDurationMinutes * 60 * 1000)
        },
        {
          name: 'headers',
          value: JSON.stringify(headers),
          excludeFromIndexes: true
        },
        {
          name: 'payload',
          value: JSON.stringify(payload),
          excludeFromIndexes: true
        }
      ]
    };
    await this.datastore.save(entity);
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
      // 这里是以完整的参数作为
      const key = this.datastore.key(['Page', ctx.url]);
      const results = await this.datastore.get(key);

      if (results.length && results[0] !== undefined) {
        const content = results[0] as ResponseCache;

        // 如果请求存在并且尚未过期，则直接返回结果
        if (content.expires.getTime() >= new Date().getTime()) {
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
            console.log(
              'Erroring parsing cache contents, falling back to normal render'
            );
          }
        }
      }

      await next();

      if (ctx.status === 200) {
        cacheContent(key, ctx.response.headers, ctx.body);
      }
    }.bind(this);
  }
}
