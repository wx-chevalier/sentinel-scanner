import * as puppeteer from 'puppeteer';

/** 尝试点击全部元素
 * a[href], input[type='submit'], input[type='image'], label[for], select, button, .pointer
 */
function clickElements() {
  // 获取所有的 a 元素
  const clickableEleAs = Array.prototype.filter.call(
    document.querySelectorAll('a'),
    (ele: HTMLElement) => {
      const href = ele.getAttribute('href');

      return (
        ele.nodeName === 'A' &&
        // 这里避免点击那些打开新窗口的 a 标签
        (!href ||
          (href && href.indexOf('javascript') > -1) ||
          ele.getAttribute('onclick'))
      );
    }
  );

  for (const eleA of clickableEleAs) {
    eleA.click();
  }

  Array.from(document.querySelectorAll('button')).forEach($ele => {
    $ele.click();
  });

  Array.from(document.querySelectorAll('input[type=button]')).forEach(
    ($ele: Element) => {
      ($ele as HTMLElement).click();
    }
  );
}

export async function monkeyClick(page: puppeteer.Page) {
  await page.evaluate(clickElements);
}
