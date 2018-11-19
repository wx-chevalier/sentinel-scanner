/** Puppeteer 操作类 */
import * as puppeteer from 'puppeteer';

import { MOBILE_USERAGENT } from '../shared/constants';
import { isImg } from '../shared/validator';

export async function initPuppeteer() {
  let browser;

  if (process.env.NODE_ENV === 'production') {
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--headless',
        '--disable-gpu',
        '--remote-debugging-port=9222'
      ]
    });
  } else {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox']
    });
  }

  return browser;
}

export type PageOptions = {
  disableImg?: boolean;
  isMobile?: boolean;
};

/** 初始化页面 */
export async function initPage(
  browser: puppeteer.Browser,
  options: PageOptions = {}
) {
  const page = await browser.newPage();

  page.on('dialog', dialog => {
    dialog.accept();
  });

  // 是否过滤所有图片
  if (options.disableImg) {
    page.evaluateOnNewDocument('customElements.forcePolyfill = true');
    page.evaluateOnNewDocument('ShadyDOM = {force: true}');
    page.evaluateOnNewDocument('ShadyCSS = {shimcssproperties: true}');

    await page.setRequestInterception(true);

    page.on('request', interceptedRequest => {
      if (isImg(interceptedRequest.url())) interceptedRequest.abort();
      else interceptedRequest.continue();
    });
  }

  if (options.isMobile) {
    page.setUserAgent(MOBILE_USERAGENT);
  }

  return page;
}
