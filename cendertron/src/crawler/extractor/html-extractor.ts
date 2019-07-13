/** 页面中潜在 API 提取器 */
import * as puppeteer from 'puppeteer';
import { SpiderResult } from '../types';
import { isValidLink } from '../../utils/validator';
import { logger } from '../supervisor/logger';
import { transfromUrlToResult } from '../../utils/transformer';

/** 从 HTML 中提取出有效信息 */
export async function extractRequestsFromHTMLInSinglePage(
  page: puppeteer.Page
): Promise<SpiderResult[]> {
  const requests: SpiderResult[] = [];

  try {
    if (page.isClosed()) {
      return [];
    }
    // 提取所有的 a 元素
    const aHrefs: string[] = await page.evaluate(async () => {
      const maybeUrls: string[] = [
        ...Array.from(document.querySelectorAll('a')),
        ...Array.from(document.querySelectorAll('area'))
      ].map($ele => {
        const href = $ele.href;

        if (!href) {
          return '';
        }

        if (href.indexOf('http') > -1 || href.indexOf('https') > -1) {
          return href;
        }

        // 如果是绝对路径，则直接以根路径起始处理，绝对路径即以开头非 . 开始的
        if (href[0] === '.') {
          // 否则追加到相对路径
          return `${window.location.href}/${href}`;
        }

        if (href[0] === '/') {
          return `${window.location.protocol}//${window.location.host}${href}`;
        }

        return `${window.location.protocol}//${window.location.host}/${href}`;
      });

      const availableUrls = maybeUrls;

      return availableUrls;
    });

    // 提取所有的 form 表单
    const formRequests = await page.evaluate(() => {
      // 提取所有的表单
      const $forms = Array.from(document.querySelectorAll('form'));

      return Array.from($forms).map($form => {
        const params: any[] = [];

        [
          ...Array.from($form.querySelectorAll('input')),
          ...Array.from($form.querySelectorAll('textarea')),
          ...Array.from($form.querySelectorAll('select'))
        ]
          .filter($input => $input.name)
          .forEach($input => {
            params.push({
              name: $input.name,
              type: $input.type,
              value: $input.value
            });
          });

        return { url: `${$form.action}`, method: $form.method, params };
      });
    });

    // 处理所有的 Href
    (aHrefs || [])
      .filter(aHref => isValidLink(aHref))
      .forEach((href: string) => {
        requests.push({
          ...transfromUrlToResult(href, 'GET'),
          resourceType: 'document'
        });
      });

    // 处理所有的 Form 表单
    formRequests.forEach((r: any) => {
      requests.push({
        ...transfromUrlToResult(r.url, 'FORM'),
        resourceType: 'form',
        method: r.method,
        params: r.params
      });
    });
  } catch (e) {
    logger.error(`>>>spider>>>html-extractor>>>${page.url()}>>>${e.message}`);
  }

  return requests;
}
