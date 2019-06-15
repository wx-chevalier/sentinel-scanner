/** 通用模型类型 */
import * as parse from 'url-parse';

import { ParsedUrl } from '../crawler/types';
import { maybeUUID } from './validator';

/**
 * 获取某个 URL 的 HASH 标识
 * @param param0
 */
export function hashUrl({
  url,
  parsedUrl
}: { url?: string; parsedUrl?: ParsedUrl } = {}): string {
  // 将 URL 进行格式化提取
  let _parsedUrl: ParsedUrl | null = null;

  if (parsedUrl) {
    _parsedUrl = parsedUrl;
  }

  if (url) {
    const { host, pathname, query } = parse(url, url, true);
    _parsedUrl = { host, pathname, query };
  }

  let hash = '';

  if (!_parsedUrl) {
    return hash;
  }

  // 提取出 URL 中的各个部分
  const { host, pathname, query } = _parsedUrl;

  // 判断是否存在查询参数
  const queryKeys = Object.keys(query).sort((k1, k2) => (k1 > k2 ? 1 : -1));

  if (queryKeys.length > 0) {
    // 如果存在查询参数，则默认全路径加查询参数进行解析
    hash = `${host}#${pathname}#${queryKeys.join('')}`;
  } else {
    // 如果不存在查询参数，则去除 pathname 的最后一位，并且添加进来
    const pathFragments = pathname.split('/');

    // 判断路径是否包含多个项目，如果包含，则将所有疑似 UUID 的替换为 ID
    if (pathFragments.length > 1) {
      hash = `${host}#${pathFragments
        .map(frag => (maybeUUID(frag) ? 'id' : frag))
        .join('')}`;
    } else {
      hash = `${host}#${pathname}`;
    }
  }

  return hash;
}
