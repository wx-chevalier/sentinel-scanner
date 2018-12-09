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
export function transformUrlToRequest(url: string): SpiderResult {
  const { host, pathname, query } = parseUrl(url);
  const parsedUrl = { host, pathname, query };

  return {
    url,
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
