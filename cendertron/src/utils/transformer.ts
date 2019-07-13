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
    method: interceptedRequest.method(),
    hash: hashUrl(url, interceptedRequest.method())
  };
}

/** 将 url 解析为请求 */
export function transfromUrlToResult(
  url: string,
  method: string
): SpiderResult {
  const strippedUrl = stripBackspaceInUrl(url);
  const { host, pathname, query, hash } = parseUrl(strippedUrl);
  const parsedUrl = { host, pathname, query, hash };

  return {
    url: strippedUrl,
    parsedUrl,
    hash: hashUrl(strippedUrl, method),
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
    if (f === '' && i !== 1) {
      return;
    }

    if (f === '..' || f === '.') {
      const lastFrag = strippedFrags.pop();
      if (lastFrag && lastFrag.indexOf('.') > -1) {
        strippedFrags.pop();
      }
      return;
    }

    strippedFrags.push(f);
  });

  const finalUrl = strippedFrags.join('/');

  if (url[url.length - 1] === '/') {
    return `${finalUrl}/`;
  } else {
    return finalUrl;
  }
}

export function getDirOfUrl(url: string) {
  const frags = url.split('/');

  if (frags.length > 3 && frags[frags.length - 1].indexOf('.') > -1) {
    frags.pop();
  }

  return frags.join('/');
}
