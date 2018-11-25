/** 通用模型类型 */
import * as parse from 'url-parse';

import { ParsedUrl } from './constants';
import { maybeUUID } from './validator';

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

    // 判断路径是否包含多个项目
    if (pathFragments.length > 1) {
      // 默认排除最后一位
      let excludedIndex = pathFragments.length - 1;

      // 判断是否存在数字项，如果存在则认为该位为变量项，将其排除
      pathFragments.forEach((f, i) => {
        if (!isNaN(parseInt(f))) {
          excludedIndex = i;
        }
      });

      // 判断最后一位是否包含数字，如果不包含则不跳过
      hash = maybeUUID(pathFragments[excludedIndex])
        ? `${host}#${pathFragments
            .filter((_, i) => i !== excludedIndex)
            .join('')}`
        : `${host}#${pathname}`;
    } else {
      hash = `${host}#${pathname}`;
    }
  }

  return hash;
}
