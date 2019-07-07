import { pool } from './render/puppeteer';
import { ScreenshotError } from './crawler/types';
import * as fse from 'fs-extra';
import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as koaCompress from 'koa-compress';
import * as route from 'koa-route';
import * as koaSend from 'koa-send';
import * as path from 'path';
import * as url from 'url';
import { DatastoreCache, nodeCache } from './server/datastore-cache';

import { Renderer } from './render/renderer';
import defaultCrawlerOption from './crawler/CrawlerOption';
import { CrawlerOption } from './crawler/CrawlerOption';
import { logger } from './crawler/supervisor/logger';
import CrawlerScheduler from './crawler/supervisor/CrawlerScheduler';
import { parseCookieStr } from './utils/model';
import * as puppeteer from 'puppeteer';
import { stripBackspaceInUrl } from './utils/transformer';

const CONFIG_PATH = path.resolve(__dirname, '../config.json');

export type CendertronConfig = {
  parallelNum: 1;
};

/**
 * Cendertron rendering service. This runs the server which routes rendering
 * requests through to the renderer.
 */
export class Cendertron {
  app: Koa = new Koa();
  config: CrawlerOption = defaultCrawlerOption;
  private renderer: Renderer | undefined;
  private crawlerScheduler: CrawlerScheduler | undefined;
  private datastoreCache = new DatastoreCache();
  private port = process.env.PORT || '3000';

  async initialize() {
    // Load config.json if it exists.
    if (fse.pathExistsSync(CONFIG_PATH)) {
      this.config = Object.assign(this.config, await fse.readJson(CONFIG_PATH));
    }

    pool.use(async (browser: puppeteer.Browser) => {
      this.renderer = new Renderer(browser);
      return;
    });

    this.crawlerScheduler = new CrawlerScheduler();

    this.app.use(koaCompress());

    this.app.use(bodyParser());

    this.app.use(
      route.get('/', async ctx => {
        await koaSend(ctx, 'index.html', {
          root: path.resolve(__dirname, '../src/public')
        });
      })
    );

    this.app.use(
      route.get('/_ah/health', async ctx => {
        await pool.use(async (browser: puppeteer.Browser) => {
          const targets = await browser!.targets();

          ctx.body = {
            success: true,
            browser: {
              targetsCnt: targets.length,
              targets: targets.map(t => ({
                url: t.url(),
                opener: t.opener()
              }))
            },
            scheduler: this.crawlerScheduler
              ? this.crawlerScheduler.status
              : {},
            cache: nodeCache.keys()
          };
        });
      })
    );

    // Optionally enable cache for rendering requests.
    if (this.config.useCache) {
      this.app.use(this.datastoreCache.middleware());
    }

    this.app.use(
      route.get('/render/:url(.*)', this.handleRenderRequest.bind(this))
    );

    this.app.use(
      route.get('/screenshot/:url(.*)', this.handleScreenshotRequest.bind(this))
    );

    this.app.use(
      route.post(
        '/screenshot/:url(.*)',
        this.handleScreenshotRequest.bind(this)
      )
    );

    this.app.use(
      route.get('/scrape/clear', ctx => {
        this.datastoreCache.clearCache();

        ctx.body = {
          success: true
        };
      })
    );

    /** 清除某个特定链接的结果 */
    this.app.use(
      route.get('/scrape/clear/:url(.*)', (ctx: any, url: string) => {
        this.datastoreCache.clearCache('Crawler', url);

        ctx.body = {
          success: true
        };
      })
    );

    this.app.use(route.post('/scrape', this.handleScrapePost.bind(this)));

    this.app.use(route.get('/scrape/:url(.*)', this.handleScrape.bind(this)));

    this.app.use(
      route.get('/_ah/reset', async ctx => {
        ctx.body = {
          success: true
        };
      })
    );

    return this.app.listen(this.port, () => {
      logger.info(`Listening on port ${this.port}`);
    });
  }

  /**
   * Checks whether or not the URL is valid. For example, we don't want to allow
   * the requester to read the file system via Chrome.
   */
  restricted(href: string): boolean {
    const parsedUrl = url.parse(href);
    const protocol = parsedUrl.protocol || '';

    if (!protocol.match(/^https?/)) {
      return true;
    }

    return false;
  }

  async handleRenderRequest(ctx: any, url: string) {
    if (!this.renderer) {
      throw new Error('No renderer initalized yet.');
    }

    if (this.restricted(url)) {
      ctx.status = 403;
      return;
    }

    const mobileVersion = 'mobile' in ctx.query ? true : false;

    const serialized = await this.renderer.serialize(url, mobileVersion);
    // Mark the response as coming from Cendertron.
    ctx.set('x-renderer', 'cendertron');
    ctx.status = serialized.status;
    ctx.body = serialized.content;
  }

  /** 处理爬虫的请求 */
  async handleScrape(ctx: any, url: string) {
    if (!this.renderer) {
      throw new Error('No renderer initalized yet.');
    }
    let finalUrl = url;

    // 如果是受限的地址，譬如 IP，则添加 HTTP 协议头
    if (this.restricted(url)) {
      finalUrl = `http://${url}`;
    }

    finalUrl = stripBackspaceInUrl(finalUrl);

    try {
      ctx.set('x-renderer', 'cendertron');
      ctx.body = this.crawlerScheduler!.addTarget({ url: finalUrl });
    } catch (e) {
      logger.error(`>>>scrape>>>${e.message}`);
      ctx.body = e.message;
    }
  }

  /** 处理爬虫的请求，POST 形式，会携带 Cookie、localStorage 等信息 */
  async handleScrapePost(ctx: any) {
    if (!this.renderer) {
      throw new Error('No renderer initalized yet.');
    }
    const { url, cookie, ignoredRegex = '.*logout.*', localStorage } =
      ctx.request.body || ({} as any);

    let finalUrl = url;

    // 如果是受限的地址，譬如 IP，则添加 HTTP 协议头
    if (this.restricted(url)) {
      finalUrl = `http://${url}`;
    }

    finalUrl = stripBackspaceInUrl(finalUrl);

    try {
      ctx.set('x-renderer', 'cendertron');
      ctx.body = this.crawlerScheduler!.addTarget({
        request: {
          url: finalUrl
        },
        crawlerOption: {
          cookies: parseCookieStr(cookie, finalUrl),
          localStorage,
          ignoredRegex
        }
      });
    } catch (e) {
      logger.error(`>>>scrape>>>${e.message}`);
      ctx.body = e.message;
    }
  }

  async handleScreenshotRequest(ctx: any, url: string) {
    if (!this.renderer) {
      throw new Error('No renderer initalized yet.');
    }

    if (this.restricted(url)) {
      ctx.status = 403;
      return;
    }

    let options = undefined;
    if (ctx.method === 'POST' && ctx.request.body) {
      options = ctx.request.body;
    }

    const dimensions = {
      width: Number(ctx.query['width']) || 1000,
      height: Number(ctx.query['height']) || 1000
    };

    const mobileVersion = 'mobile' in ctx.query ? true : false;

    try {
      const img = await this.renderer.screenshot(
        url,
        mobileVersion,
        dimensions,
        options
      );
      ctx.set('Content-Type', 'image/jpeg');
      ctx.set('Content-Length', img.length.toString());
      ctx.body = img;
    } catch (error) {
      const err = error as ScreenshotError;
      ctx.status = err.type === 'Forbidden' ? 403 : 500;
    }
  }
}

async function logUncaughtError(error: Error) {
  logger.error(`Uncaught exception>>>${error.message}>>>${error.stack}`);
}

// Start cendertron if not running inside tests.
if (!module.parent) {
  const cendertron = new Cendertron();
  cendertron.initialize();

  process.on('uncaughtException', logUncaughtError);
  process.on('unhandledRejection', logUncaughtError);
}
