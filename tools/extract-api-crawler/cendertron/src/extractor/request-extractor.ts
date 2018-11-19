import * as puppeteer from 'puppeteer';

import { Api } from './../shared/constants';

/** 从记录的 Requests 中提取出 APIs 信息 */
export function extractApisFromRequests(
  requests: puppeteer.Request[],
  existedUrls: Set<string>
): Api[] {
  const apis: Api[] = [];

  for (const request of requests) {
    const url = request.url();
    if (existedUrls.has(url) || url.endsWith('js') || url.endsWith('css')) {
      continue;
    }

    apis.push({ url, params: request.postData });
    existedUrls.add(url);
  }

  return apis;
}
