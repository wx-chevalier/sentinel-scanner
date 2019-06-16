/** 敏感信息泄露 */
import * as puppeteer from 'puppeteer';
import { possibleWeakfiles } from '../../pocs/dicts/weak-files';

/** 扫描弱口令文件 */
function scanWeakfile(filesPath: string[], baseUrl: string) {
  const existedFilesPath: string[] = [];

  filesPath.forEach(filePath => {
    const url = filePath[0] === '/' ? filePath : `/${filePath}`;

    fetch(url).then(resp => {
      if (resp.status !== 404) {
        existedFilesPath.push(`${baseUrl}${filePath}`);
      }
    });
  });

  return existedFilesPath;
}

/** 执行敏感信息扫描 */
export async function evaluateWeakfileScan(
  page: puppeteer.Page,
  baseUrl: string
): Promise<string[]> {
  try {
    return await page.evaluate(scanWeakfile, possibleWeakfiles, baseUrl);
  } catch (e) {
    console.error(e);
    return [];
  }
}
