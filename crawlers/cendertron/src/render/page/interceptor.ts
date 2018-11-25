/** 执行页面中的请求截获操作 */
import * as puppeteer from 'puppeteer';

import { Request } from '../../shared/constants';
import { transformInterceptedRequestToRequest } from '../../shared/transformer';
import { isMedia } from './../../shared/validator';

export async function interceptUrlsInSinglePage(
  browser: puppeteer.Browser,
  page: puppeteer.Page,
  cb: (requests: Request[], openedUrls: string[]) => void
) {
  const requests: Request[] = [];
  const openedUrls: string[] = [];

  await page.setRequestInterception(true);

  // 监听所有当前打开的页面
  browser.on('targetcreated', target => {
    const opener = target.opener();

    if (!opener) {
      return;
    }

    // 记录所有新打开的界面
    opener.page().then(_page => {
      if (_page === page) {
        target.page().then(_p => {
          if (!_p.isClosed()) {
            openedUrls.push(target.url());
            _p.close();
          }
        });
      }
    });
  });

  page.on('request', interceptedRequest => {
    // 屏蔽所有的图片和重定向
    if (isMedia(interceptedRequest.url())) {
      interceptedRequest.abort();
      return;
    } else {
      interceptedRequest.continue();
    }

    requests.push(transformInterceptedRequestToRequest(interceptedRequest));

    // 每次调用时候都会回调函数
    cb(requests, openedUrls);
  });
}
