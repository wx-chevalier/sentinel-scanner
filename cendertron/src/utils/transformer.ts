import * as puppeteer from 'puppeteer';
import * as parse from 'url-parse';

import { SpiderResult, ParsedUrl } from '../crawler/types';
import { hashUrl } from './model';

export function transformInterceptedRequestToRequest(
  interceptedRequest: puppeteer.Request
): SpiderResult {
  // 获取 url
  const url = stripBackspaceInUrl(interceptedRequest.url());
  const { host, pathname, query, hash } = parseUrl(url);
  const parsedUrl = { host, pathname, query, hash };

  return {
    url,
    parsedUrl,
    postData: interceptedRequest.postData(),
    resourceType: interceptedRequest.resourceType() || 'xhr',

    hash: hashUrl(url)
  };
}

/** 将 url 解析为请求 */
export function transfromUrlToResult(url: string): SpiderResult {
  const strippedUrl = stripBackspaceInUrl(url);
  const { host, pathname, query, hash } = parseUrl(strippedUrl);
  const parsedUrl = { host, pathname, query, hash };

  return {
    url: strippedUrl,
    parsedUrl,
    hash: hashUrl(strippedUrl),
    resourceType: 'document'
  };
}

export function parseUrl(url: string): ParsedUrl {
  try {
    const { host, pathname, query, hash } = parse(url, url, true);
    return { host, pathname, query, hash };
  } catch (e) {
    return { host: url, pathname: '', query: {}, hash: '' };
  }
}

/** 将传入的 url 中的 .. 移除 */
export function stripBackspaceInUrl(url: string): string {
  const frags = url.split('/');

  const strippedFrags: string[] = [];

  frags.forEach((f, i) => {
    if (f === '.') {
      return;
    }

    if (f === '' && i !== 1) {
      return;
    }

    if (f === '..') {
      const lastFrag = strippedFrags.pop();
      if (lastFrag && lastFrag.indexOf('.') > -1) {
        strippedFrags.pop();
      }
      return;
    }

    strippedFrags.push(f);
  });

  return strippedFrags.join('/');
}
