# Chaos-Scanner/extract-api-crawler

Chaos-Scanner/api-crawler 是自动递归抓取网页中潜在 GET/POST/PUT/DELETE 等 API 请求地址与参数，并将其传入下游的 SQL 注入等测试工具。

# 设计理念

爬虫最终应该生成 URL 格式或者 JSON 格式的结果，以输出给下游的 sqlmap 或者 RabbitMQ 等监听者。

```json
// url - https://example.com/path?key1=1#/hash-path/??key2=2
{
  "host": "",
  "path": "",
  "hash": "",
  "method": "POST",
  "queries": [
    {
      "name": "",
      "value": ""
    }
  ]
}
```

## 页面抓取

- 基础渲染：

  - 使用 HTTP Client 抓取 Web 1.0 页面
  - 使用 Headless Chrome 抓取 Web 2.0 页面

- 抓取策略：

  - 引入部分的自动化交互，以保证更贴近真实的页面渲染
  - 根据预设的爬取深度，自动针对子链接页面进行递归爬取

- 请求监听
  - 使用 Puppeteer Intercept Ajax Request, 简要流程如下:

```js
const puppeteer = require('puppeteer');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', interceptedRequest => {
    if (
      interceptedRequest.url().endsWith('.png') ||
      interceptedRequest.url().endsWith('.jpg')
    )
      interceptedRequest.abort();
    else interceptedRequest.continue();
  });
  await page.goto('https://example.com');
  await browser.close();
});
```

## 地址提取

- 抓取所有 a 标签中的 URL，忽略所有以 htm, html 结尾的静态界面
- 识别出 action 中的值为所提交的地址，提取 input 标签中的 name 和 value 作为参数，最终生成出 `post_link.php?id=1&msg=abc` 这个 url。

## URL 去重

- 使用全局 BloomFilter 对 URL 特征串进行存储与重复性检测
- 对于无查询参数的字符串，移除尾部文件名，将路径中的数字串统一替换为 d，将路径中的 UUID 统一替换为 u，作为 URL 特征串
- 对于包含查询参数的 URL，保留完整路径，将查询参数键名按字符序排序，连接到路径中作为特征串
