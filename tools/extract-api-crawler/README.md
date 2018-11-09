# Chaos-Scanner/extract-api-crawler

[Chaos-Scanner/extract-api-crawler](https://parg.co/0Me) 是自动递归抓取网页中潜在 GET/POST/PUT/DELETE 等 API 请求地址与参数，并将其传入下游的 SQL 注入等测试工具。为了更好地兼容不同的需求场景，extract-api-crawler 也是拆分为了多个不同语言/工具构成的碎片化模块，可自由组合。

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

可以使用[常见漏洞扫描器测试平台](http://demo.aisec.cn/demo/)作为基准测试场景。

## 页面抓取

- 基础渲染：

  - 使用 HTTP Client 抓取 Web 1.0 页面，可以动态切换不同的 [User Agent](https://github.com/lorien/user_agent)
  - 使用 Headless Chrome 渲染并抓取 Web 2.0 单页面，引入部分的自动化交互(Monkey Test, etc.)，以保证更贴近真实的页面渲染

- 抓取策略：

  - 外部执行器模块负责提取中需要进入的子级 URL，交付爬取器进行爬取
  - 根据预设的爬取深度，自动针对子链接页面进行递归爬取

- 请求监听
  - 使用 Puppeteer Intercept Ajax Request

## 地址提取

- 抓取所有 a 标签中的 URL，忽略所有以 htm, html 结尾的静态界面
- 识别出 action 中的值为所提交的地址，提取 input 标签中的 name 和 value 作为参数，最终生成出 `post_endpoint?id=1&msg=abc` 这个 url 及对应的 JSON 请求描述

## URL 去重

- 使用全局 BloomFilter 对 URL 特征串进行存储与重复性检测
- 对于无查询参数的字符串，移除尾部文件名，将路径中的数字串统一替换为 d，将路径中的 UUID 统一替换为 u，作为 URL 特征串
- 对于包含查询参数的 URL，保留完整路径，将查询参数键名按字符序排序，连接到路径中作为特征串

# cendertron

> cendertron = crawler + rendertron
