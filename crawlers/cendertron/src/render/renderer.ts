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
import { extractRequestsInSinglePage } from '../crawler//extractor/request-extractor';
import { monkeyClick } from './monky/click-monkey';
import { interceptUrlsInSinglePage } from './page/interceptor';
import { RequestMap, Request } from '../shared/constants';
import { transformUrlToRequest } from '../shared/transformer';
import { extractRequestsFromHTMLInSinglePage } from '../crawler/extractor/html-extractor';

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
      console.error(e);
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

  /** 执行 API 提取 */
  async extractApis(requestUrl: string): Promise<RequestMap> {
    const page = await initPage(this.browser);

    let requests: Request[] = [];
    let openedUrls: string[] = [];

    // 设置关闭页面超时
    setTimeout(() => {
      if (!page.isClosed()) {
        page.close();
      }
    }, 30 * 1000);

    // 设置请求监听
    await interceptUrlsInSinglePage(this.browser, page, (_r, _o) => {
      requests = _r;
      openedUrls = _o;
    });

    // 页面跳转
    await page.goto(requestUrl, {
      timeout: 20 * 1000,

      // 等待到页面加载完毕
      waitUntil: 'domcontentloaded'
    });

    // 禁止页面跳转
    await page.evaluate(`
      (Array.from(document.querySelectorAll("a"))).forEach(($ele)=>$ele.setAttribute("target","_blank"))
    `);

    // 页面加载完毕后插入 Monkey 脚本
    await Promise.all([monkeyClick(page), evaluateGremlins(page)]);

    await page.waitFor(5 * 1000);

    const existedUrlsHash = new Set<string>();
    existedUrlsHash.add(transformUrlToRequest(requestUrl).hash);

    // 解析页面中生成的元素
    const requestsFromHTML = await extractRequestsFromHTMLInSinglePage(
      page,
      existedUrlsHash
    );

    // 等待 5 ~ 10s，返回
    if (!page.isClosed()) {
      page.close();
    }

    // 从请求中获取到所有的 API
    const map = extractRequestsInSinglePage(
      requestUrl,
      existedUrlsHash,
      requests,
      openedUrls
    );

    return { ...map, apis: [...(map.apis || []), ...requestsFromHTML] };
  }
}
