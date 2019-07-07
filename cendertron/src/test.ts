/** Puppeteer 操作类 */
import * as puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  console.log(page.target);
})();
