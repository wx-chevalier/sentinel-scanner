import * as puppeteer from 'puppeteer';
import * as parse from 'url-parse';

import { SpiderResult, ParsedUrl } from '../crawler/types';
import { hashUrl } from './model';

export function transformInterceptedRequestToRequest(
  interceptedRequest: puppeteer.Request
): SpiderResult {
  // 获取 url
  const url = interceptedRequest.url();
  const { host, pathname, query } = parseUrl(url);
  const parsedUrl = { host, pathname, query };

  return {
    url,
    parsedUrl,
    postData: interceptedRequest.postData(),
    resourceType: interceptedRequest.resourceType() || 'xhr',

    hash: hashUrl({ parsedUrl })
  };
}

/** 将 url 解析为请求 */
export function transformUrlToResult(url: string): SpiderResult {
  const strippedUrl = stripBackspaceInUrl(url);
  const { host, pathname, query } = parseUrl(strippedUrl);
  const parsedUrl = { host, pathname, query };

  return {
    url: strippedUrl,
    parsedUrl,
    hash: hashUrl({ parsedUrl }),
    resourceType: 'document'
  };
}

export function parseUrl(url: string): ParsedUrl {
  try {
    const { host, pathname, query } = parse(url, url, true);
    return { host, pathname, query };
  } catch (e) {
    return { host: url, pathname: '', query: {} };
  }
}

/** 将传入的 url 中的 .. 移除 */
export function stripBackspaceInUrl(url: string): string {
  const frags = url.split('/');

  const strippedFrags: string[] = [];

  frags.forEach(f => {
    if (f === '.') {
      return;
    }

    if (f === '..') {
      strippedFrags.pop();
      return;
    }

    strippedFrags.push(f);
  });

  return strippedFrags.join('/');
}
