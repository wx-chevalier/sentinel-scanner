import * as puppeteer from 'puppeteer';
import * as parse from 'url-parse';

import { Request } from './constants';
import { hashUrl } from './model';

export function transformInterceptedRequestToRequest(
  interceptedRequest: puppeteer.Request
): Request {
  // 获取 url
  const url = interceptedRequest.url();
  const { host, pathname, query } = parse(url, url, true);
  const parsedUrl = { host, pathname, query };

  return {
    url,
    parsedUrl,
    postData: interceptedRequest.postData(),
    resourceType: interceptedRequest.resourceType(),

    hash: hashUrl({ parsedUrl })
  };
}

export function transformUrlToRequest(url: string): Request {
  const { host, pathname, query } = parse(url, url, true);
  const parsedUrl = { host, pathname, query };

  return {
    url,
    parsedUrl,
    hash: hashUrl({ parsedUrl })
  };
}
