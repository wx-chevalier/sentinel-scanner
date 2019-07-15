/** 通用模型类型 */
import * as parse from 'url-parse';

import { maybeUUID } from './validator';
import { parseUrl } from './transformer';

/**
 * 获取某个 URL 的 HASH 标识
 * @param param0
 */
export function hashUrl(url: string, method: string): string {
  // 将 URL 进行格式化提取
  const _parsedUrl = parse(url, url, true);

  let urlHash = '';

  if (!_parsedUrl) {
    return urlHash;
  }

  // 提取出 URL 中的各个部分
  const { host, pathname, query, hash } = _parsedUrl;

  // 判断是否存在查询参数
  const queryKeys = Object.keys(query).sort((k1, k2) => (k1 > k2 ? 1 : -1));

  if (queryKeys.length > 0) {
    // 如果存在查询参数，则默认全路径加查询参数进行解析
    urlHash = `${host}#${pathname}#${queryKeys.join('')}`;
  } else {
    // 如果不存在查询参数，则去除 pathname 的最后一位，并且添加进来
    const pathFragments = pathname.split('/');

    // 判断路径是否包含多个项目，如果包含，则将所有疑似 UUID 的替换为 ID
    if (pathFragments.length > 1) {
      urlHash = `${host}#${pathFragments
        .filter(frag => frag.length > 0)
        .map(frag => (maybeUUID(frag) ? 'id' : frag))
        .join('')}`;
    } else {
      urlHash = `${host}#${pathname}`;
    }
  }

  if (hash) {
    const hashQueryString = hash.replace('#', '');
    const queryObj = parseQuery(hashQueryString);
    Object.keys(queryObj).forEach(n => {
      if (n) {
        urlHash += n;
      }
    });
  }

  return `${urlHash}-${method.toUpperCase()}`;
}

/** 解析 Cookie 字符串 */
export function parseCookieStr(cookieStr: string = '', url: string) {
  const parsedUrl = parseUrl(url);

  return cookieStr
    .split(';')
    .reduce(
      (
        cookieArray: { name: string; value: string; domain: string }[],
        cookieString
      ) => {
        const splitCookie = cookieString
          .split('=')
          .map(cookiePart => cookiePart.trim());

        const name = splitCookie[0];
        let value;

        // 这里将 value 转化为字符串
        value = `${splitCookie[1]}`;
        cookieArray.push({ name, value, domain: parsedUrl.host });
        return cookieArray;
      },
      []
    );
}

/** 判断是否可能为目录 */
export function isDir(pathname: string) {
  const frags = (pathname || '').split('/');

  const lastFrag = frags[frags.length - 1];

  return lastFrag === '' || lastFrag.indexOf('.') === -1;
}

export function parseQuery(queryString: string) {
  const query: any = {};
  const pairs: any = (queryString[0] === '?'
    ? queryString.substr(1)
    : queryString
  ).split('&');
  for (let i = 0; i < pairs.length; i += 1) {
    const pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}
