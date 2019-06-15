/** 执行页面中的请求截获操作 */
import * as puppeteer from 'puppeteer';

import { SpiderResult } from '../../crawler/types';
import { transformInterceptedRequestToRequest } from '../../shared/transformer';
import { isMedia } from './../../shared/validator';

export async function interceptRequestsInSinglePage(
  browser: puppeteer.Browser,
  page: puppeteer.Page,
  cb: (
    requests: SpiderResult[],
    openedUrls: string[],
    listeners: ((...args: any[]) => void)[]
  ) => void
) {
  const requests: SpiderResult[] = [];
  const openedUrls: string[] = [];

  await page.setRequestInterception(true);

  // 设置目标监听
  const targetCreatedListener = (target: puppeteer.Target) => {
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
  };

  // 监听所有当前打开的页面
  browser.on('targetcreated', targetCreatedListener);

  page.on('request', interceptedRequest => {
    // 屏蔽所有的图片
    if (isMedia(interceptedRequest.url())) {
      interceptedRequest.abort();
    } else if (
      interceptedRequest.isNavigationRequest() &&
      interceptedRequest.redirectChain().length !== 0
    ) {
      interceptedRequest.continue();
    } else {
      interceptedRequest.continue();
    }

    requests.push(transformInterceptedRequestToRequest(interceptedRequest));

    // 每次调用时候都会回调函数
    cb(requests, openedUrls, [targetCreatedListener]);
  });
}
