import { Request, RequestMap } from '../../shared/constants';
import { transformUrlToRequest } from '../../shared/transformer';

/** 从记录的 Requests 中提取出 APIs 信息 */
export function extractRequestsInSinglePage(
  pageUrl: string,
  existedUrlsHash: Set<string>,
  requests: Request[],
  openedUrls: string[]
): RequestMap {
  const apis: Request[] = [];
  const pages: Request[] = [];

  debugger;

  // 将 URL 转化为内置的请求格式
  const pageUrlRequest = transformUrlToRequest(pageUrl);

  openedUrls.forEach(openedUrl => {
    const r = transformUrlToRequest(openedUrl);

    if (
      pageUrlRequest.parsedUrl.host === r.parsedUrl.host &&
      !existedUrlsHash.has(r.hash)
    ) {
      pages.push(r);
      existedUrlsHash.add(r.hash);
    }
  });

  for (const request of requests) {
    const { url, hash, resourceType, parsedUrl } = request;
    if (
      pageUrlRequest.parsedUrl.host !== parsedUrl.host ||
      existedUrlsHash.has(hash) ||
      url.indexOf('.js') > -1 ||
      url.indexOf('.css') > -1
    ) {
      continue;
    }

    if (resourceType === 'document') {
      pages.push(request);
    } else {
      apis.push(request);
    }

    existedUrlsHash.add(request.hash);
  }

  return { apis, pages };
}
