import * as puppeteer from 'puppeteer';
import * as url from 'url';

import {
  ViewportDimensions,
  SerializedResponse,
  ScreenshotError,
  MOBILE_USERAGENT
} from '../crawler/types';
import { initPage } from './puppeteer';
import { injectBaseHref, stripPage } from './page/scripts';
import { logger } from '../crawler/supervisor/logger';

/**
 * Wraps Puppeteer's interface to Headless Chrome to expose high level rendering
 * APIs that are able to handle web components and PWAs.
 */
export class Renderer {
  private browser: puppeteer.Browser;

  constructor(browser: puppeteer.Browser) {
    this.browser = browser;
  }

  /** 执行内容的序列化提取 */
  async serialize(
    requestUrl: string,
    isMobile: boolean
  ): Promise<SerializedResponse> {
    // 构建页面
    const page = await initPage(this.browser, {
      isIgnoreAssets: true,
      isMobile
    });

    page.setViewport({ width: 1000, height: 1000, isMobile });

    let response: puppeteer.Response | null = null;

    page.addListener('response', (r: puppeteer.Response) => {
      if (!response) {
        response = r;
      }
    });

    try {
      // Navigate to page. Wait until there are no oustanding network requests.
      response = await page.goto(requestUrl, {
        timeout: 10000,
        waitUntil: 'networkidle0'
      });
    } catch (e) {
      logger.error('render-error>>>', e.message);
    }

    if (!response) {
      logger.error('response does not exist');
      // This should only occur when the page is about:blank. See
      return { status: 400, content: '' };
    }

    if (response.headers()['metadata-flavor'] === 'Google') {
      return { status: 403, content: '' };
    }

    let statusCode = response.status();
    const newStatusCode = await page
      .$eval('meta[name="render:status_code"]', element =>
        parseInt(element.getAttribute('content') || '')
      )
      .catch(() => undefined);

    if (statusCode === 304) {
      statusCode = 200;
    }

    if (statusCode === 200 && newStatusCode) {
      statusCode = newStatusCode;
    }

    // Remove script & import tags.
    await page.evaluate(stripPage);

    // Inject <base> tag with the origin of the request (ie. no path).
    const parsedUrl = url.parse(requestUrl);
    await page.evaluate(
      injectBaseHref,
      `${parsedUrl.protocol}//${parsedUrl.host}`
    );

    // Serialize page.
    const result = await page.evaluate('document.firstElementChild.outerHTML');

    await page.close();
    return { status: statusCode, content: result };
  }

  /** 执行截屏 */
  async screenshot(
    url: string,
    isMobile: boolean,
    dimensions: ViewportDimensions,
    options?: object
  ): Promise<Buffer> {
    const page = await this.browser.newPage();

    page.setViewport({
      width: dimensions.width,
      height: dimensions.height,
      isMobile
    });

    if (isMobile) {
      page.setUserAgent(MOBILE_USERAGENT);
    }

    let response: puppeteer.Response | null = null;

    try {
      // Navigate to page. Wait until there are no oustanding network requests.
      response = await page.goto(url, {
        timeout: 10 * 1000,
        waitUntil: 'networkidle0'
      });
    } catch (e) {
      logger.error(e);
    }

    if (!response) {
      throw new ScreenshotError('NoResponse');
    }

    if (response!.headers()['metadata-flavor'] === 'Google') {
      throw new ScreenshotError('Forbidden');
    }

    // Must be jpeg & binary format.
    const screenshotOptions = Object.assign({}, options, {
      type: 'jpeg',
      encoding: 'binary'
    });

    // Screenshot returns a buffer based on specified encoding above.
    const buffer = (await page.screenshot(screenshotOptions)) as Buffer;
    return buffer;
  }
}
