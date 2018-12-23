/** 页面中潜在 API 提取器 */
import * as puppeteer from 'puppeteer';
import { SpiderResult } from '../types';
import { transformUrlToRequest } from '../../shared/transformer';
import { isValidLink } from '../../shared/validator';
import { logger } from '../supervisor/logger';

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
    const aHrefs: string[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a')).map($ele => {
        const href = $ele.getAttribute('href');

        if (!href) {
          return href;
        }
        if (href.indexOf('http') > -1 || href.indexOf('https') > -1) {
          return href;
        }

        return `${window.location.href}${href}`;
      })
    );

    // 提取所有的 form 表单
    const formUrls = await page.evaluate(() => {
      // 提取所有的表单
      const $forms = Array.from(document.querySelectorAll('form'));

      return Array.from($forms).map($form => {
        const params = new URLSearchParams();

        Array.from($form.querySelectorAll('input'))
          .filter($input => $input.name && $input.type !== 'submit')
          .forEach($input => {
            params.set($input.name, 'a');
          });

        return `${$form.action}?${params.toString()}`;
      });
    });

    // 处理所有的 Href
    (aHrefs || [])
      .filter(aHref => isValidLink(aHref))
      .forEach((href: string) => {
        requests.push({
          ...transformUrlToRequest(href),
          resourceType: 'document'
        });
      });

    // 处理所有的 Form 表单
    formUrls.forEach((url: string) => {
      requests.push({ ...transformUrlToRequest(url), resourceType: 'form' });
    });
  } catch (e) {
    logger.error(`>>>spider>>>html-extractor>>>${page.url()}>>>${e.message}`);
  }

  return requests;
}
