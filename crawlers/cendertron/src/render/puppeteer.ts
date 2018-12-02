/** Puppeteer 操作类 */
import * as puppeteer from 'puppeteer';

import { MOBILE_USERAGENT } from '../crawler/types';

import defaultCrawlerOption, { CrawlerOption } from '../crawler/CrawlerOption';

/** 初始化 Puppeteer */
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
      headless: true,
      args: ['--no-sandbox']
    });
  }

  return browser;
}

/** 初始化页面 */
export async function initPage(
  browser: puppeteer.Browser,
  options: Partial<CrawlerOption> = defaultCrawlerOption
) {
  const page = await browser.newPage();

  // 屏蔽所有弹窗
  page.on('dialog', dialog => {
    dialog.dismiss();
  });

  page.evaluateOnNewDocument('customElements.forcePolyfill = true');
  page.evaluateOnNewDocument('ShadyDOM = {force: true}');
  page.evaluateOnNewDocument('ShadyCSS = {shimcssproperties: true}');

  if (options.isMobile) {
    page.setUserAgent(MOBILE_USERAGENT);
  }

  // 设置页面关闭的超时时间
  setTimeout(() => {
    if (!page.isClosed()) {
      page.close();
    }
  }, options.pageTimeout);

  return page;
}
