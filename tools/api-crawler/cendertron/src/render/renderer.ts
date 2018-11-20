import { Api } from './../shared/constants';
import { isImg } from './../shared/validator';
import * as puppeteer from 'puppeteer';
import * as url from 'url';

import {
  ViewportDimensions,
  SerializedResponse,
  ScreenshotError,
  MOBILE_USERAGENT
} from '../shared/constants';
import { initPage } from './puppeteer';
import { injectBaseHref, stripPage } from './page/scripts';
import { evaluateGremlins } from './monky/gremlins';
import { extractApisFromRequests } from '../extractor/request-extractor';
import { monkeyClick } from './monky/click-monkey';

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
      disableImg: true,
      isMobile
    });

    page.setViewport({ width: 1000, height: 1000, isMobile });

    let response: puppeteer.Response | null = null;

    // Capture main frame response. This is used in the case that rendering
    // times out, which results in puppeteer throwing an error. This allows us
    // to return a partial response for what was able to be rendered in that
    // time frame.
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
      console.error(e);
    }

    if (!response) {
      console.error('response does not exist');
      // This should only occur when the page is about:blank. See
      return { status: 400, content: '' };
    }

    // Disable access to compute metadata. See
    // https://cloud.google.com/compute/docs/storing-retrieving-metadata.
    if (response.headers()['metadata-flavor'] === 'Google') {
      return { status: 403, content: '' };
    }

    // Set status to the initial server's response code. Check for a <meta
    // name="render:status_code" content="4xx" /> tag which overrides the status
    // code.
    let statusCode = response.status();
    const newStatusCode = await page
      .$eval('meta[name="render:status_code"]', element =>
        parseInt(element.getAttribute('content') || '')
      )
      .catch(() => undefined);
    // On a repeat visit to the same origin, browser cache is enabled, so we may
    // encounter a 304 Not Modified. Instead we'll treat this as a 200 OK.
    if (statusCode === 304) {
      statusCode = 200;
    }
    // Original status codes which aren't 200 always return with that status
    // code, regardless of meta tags.
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

  /** 执行 API 提取 */
  async extractApis(requestUrl: string): Promise<Api[]> {
    const page = await initPage(this.browser);

    const requests: puppeteer.Request[] = [];

    await page.setRequestInterception(true);

    page.on('request', interceptedRequest => {
      if (isImg(interceptedRequest.url())) interceptedRequest.abort();
      else {
        requests.push(interceptedRequest);
        interceptedRequest.continue();
      }
    });

    await page.goto(requestUrl, {
      timeout: 10000,
      waitUntil: 'networkidle0'
    });

    // 设置请求监听
    await page.setRequestInterception(true);

    // 页面加载完毕后插入 Monkey 脚本
    await Promise.all([monkeyClick(page), evaluateGremlins(page)]);

    // 等待 5 ~ 10s，返回
    await page.close();

    const existedUrls = new Set<string>();

    return extractApisFromRequests(requests, existedUrls);
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
      console.error(e);
    }

    if (!response) {
      throw new ScreenshotError('NoResponse');
    }

    // Disable access to compute metadata. See
    // https://cloud.google.com/compute/docs/storing-retrieving-metadata.
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
