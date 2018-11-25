/** 插入 Gremlins 脚本并且执行 */
import * as puppeteer from 'puppeteer';

// 声明页面内变量 gremlins
declare var gremlins: any;
declare var window: { $: any };

/** 初始化 Germlins */
function initGermlins() {
  gremlins
    .createHorde()
    .gremlin(gremlins.species.formFiller())
    .gremlin(gremlins.species.clicker().clickTypes(['click']))
    .gremlin(gremlins.species.toucher())
    .gremlin(gremlins.species.scroller())
    .gremlin(function() {
      if ('$' in window) {
        window.$ = function() {};
      }
    })
    .unleash();
}

/** 执行 Gremlins Monkey Test */
export async function evaluateGremlins(page: puppeteer.Page) {
  try {
    await page.addScriptTag({
      url:
        'https://cdnjs.cloudflare.com/ajax/libs/gremlins.js/0.1.0/gremlins.min.js'
    });

    await page.evaluate(initGermlins);
  } catch (e) {}
}
