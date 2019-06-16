/** 敏感信息泄露 */
import * as puppeteer from 'puppeteer';

/** 扫描弱口令文件 */
function scanWeakfile(filesPath: string[]) {
  const existedFilesPath: string[] = [];

  alert(1);

  return existedFilesPath;
}

/** 执行敏感信息扫描 */
export async function evaluateWeakfileScan(page: puppeteer.Page) {
  try {
    return await page.evaluate(scanWeakfile);
  } catch (e) {
    console.error(e);
  }
}
