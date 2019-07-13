/** 敏感信息泄露 */
import * as puppeteer from 'puppeteer';

import { possibleWeakfiles } from '../../pocs/dicts/weak-files';
import { stripBackspaceInUrl, getDirOfUrl } from '../../utils/transformer';

/** 扫描弱口令文件 */
async function scanWeakfile(filesPath: string[], baseUrl: string) {
  const existedFilesPath: string[] = [];

  for (const filePath of filesPath) {
    const url = filePath[0] === '/' ? filePath : `/${filePath}`;
    try {
      const resp = await fetch(url);
      if (resp.status === 200) {
        existedFilesPath.push(`${baseUrl}/${filePath}`);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return existedFilesPath;
}

/** 执行敏感信息扫描 */
export async function evaluateWeakfileScan(
  page: puppeteer.Page,
  baseUrl: string
): Promise<string[]> {
  try {
    // 过滤掉页面已经关闭的情况
    if (page.isClosed()) {
      return [];
    }

    const urls: string[] = await page.evaluate(
      scanWeakfile,
      possibleWeakfiles,
      getDirOfUrl(baseUrl)
    );

    return urls.map(url => stripBackspaceInUrl(url));
  } catch (e) {
    console.error(e);
    return [];
  }
}
