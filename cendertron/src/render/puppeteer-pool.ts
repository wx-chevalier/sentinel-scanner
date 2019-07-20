import * as puppeteer from 'puppeteer';
import * as genericPool from 'generic-pool';

export const createPuppeteerPool = ({
  max = 5,
  // optional. if you set this, make sure to drain() (see step 3)
  min = 5,
  // specifies how long a resource can stay idle in pool before being removed
  idleTimeoutMillis = 30000,
  // specifies the maximum number of times a resource can be reused before being destroyed
  maxUses = 50,
  testOnBorrow = true,
  puppeteerArgs = [],
  validator = (_instance: any) => Promise.resolve(true),
  ...otherConfig
} = {}) => {
  // TODO: randomly destroy old instances to avoid resource leak?
  const factory = {
    create: () =>
      puppeteer.launch(...puppeteerArgs).then((instance: any) => {
        instance.useCount = 0;
        return instance;
      }),
    destroy: (instance: any) => {
      instance.close();
    },
    validate: (instance: any) => {
      return validator(instance).then(valid =>
        Promise.resolve(valid && (maxUses <= 0 || instance.useCount < maxUses))
      );
    }
  };
  const config = {
    max,
    min,
    idleTimeoutMillis,
    testOnBorrow,
    ...otherConfig
  };
  const pool = genericPool.createPool<puppeteer.Browser>(
    factory as any,
    config
  );
  const genericAcquire = pool.acquire.bind(pool);
  pool.acquire = () =>
    genericAcquire().then((instance: any) => {
      instance.useCount += 1;
      return instance;
    });

  pool.use = (fn: any) => {
    let resource: any;
    return pool
      .acquire()
      .then(r => {
        resource = r;
        return resource;
      })
      .then(fn)
      .then(
        result => {
          pool.release(resource);
          return result;
        },
        err => {
          pool.release(resource);
          throw err;
        }
      );
  };

  return pool;
};
