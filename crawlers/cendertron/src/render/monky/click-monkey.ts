import * as puppeteer from 'puppeteer';
/** 尝试点击全部元素
 * a[href], input[type='submit'], input[type='image'], label[for], select, button, .pointer
 */
function clickElements() {
  // 获取所有的 a 元素
  const clickableEleAs = Array.prototype.filter.call(
    document.querySelectorAll('a'),
    (ele: HTMLElement) =>
      ele.nodeName === 'A' &&
      (ele.getAttribute('href') || ele.getAttribute('onclick'))
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
