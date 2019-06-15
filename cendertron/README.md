# Cendertron

> Cendertron = Crawler + cendertron

Crawl AJAX-heavy client-side Single Page Applications (SPAs), deploying with docker, focusing on scraping requests(page urls, apis, etc.), followed by pentest tools(Sqlmap, etc.).

Cendertron can be used for extracting requests(page urls, apis, etc.) from your Web 2.0 page, view in [demo](http://47.99.50.115:5000/) page, or [result](http://47.99.50.115:5000/apis/http://testphp.vulnweb.com/AJAX/) page.

Cendertron 是基于 Puppeteer 的 Web 2.0 动态爬虫与敏感信息泄露检测工具。其依托于 [xe-crawler](https://github.com/wx-chevalier/xe-crawler) 的通用爬虫、调度与缓存模型，新增了 Monkey Test 以及 Request Intercept 等特性，以期尽可能多地挖掘页面与请求。同时针对渗透测试的场景，Cendertron 内置了目录扫描、敏感文件扫描的能力，能够模拟用户实际在浏览器登录状态下的自定义字典爆破。Cendertron 在大量实践的基础上设置了自身的去重策略，能够尽可能地避免重复爬取，加快扫描速度。Cendertron 同时也是正在内部开发的 [Chaos-Scanner](https://github.com/wx-chevalier/Chaos-Scanner) 模块化安全扫描解决方案的一部分，为基础扫描与智能扫描提供前置输入。

# Deploy

- Run locally

```sh
$ git clone ...
$ yarn install
$ npm run dev
```

- Deploy in Docker

```sh
# build image
$ docker build -t cendertron .

# run as contaner
$ docker run -it --rm -p 3000:3000 --name cendertron-instance cendertron

# run as container, fix with Jessie Frazelle seccomp profile for Chrome.
$ wget https://raw.githubusercontent.com/jfrazelle/dotfiles/master/etc/docker/seccomp/chrome.json -O ~/chrome.json
$ docker run -it -p 3000:3000 --security-opt seccomp=$HOME/chrome.json --name cendertron-instance cendertron

# or
$ docker run -it -p 3000:3000 --cap-add=SYS_ADMIN --name cendertron-instance cendertron

# use network and mapping logs
$ docker run -d -p 5000:3000 --cap-add=SYS_ADMIN --name cendertron-instance --network wsat-network cendertron
```

## Deploy as FC

Install cendertron from NPM:

```sh
# set not downloading chromium
$ PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

$ yarn add cendertron
# or
$ npm install cendertron -S
```

Import `Crawler` and use in your code:

```js
const crawler = new Crawler(browser, {
  onFinish: () => {
    callback(crawler.spidersRequestMap);
  }
});

let pageUrl =
  evtStr.length !== 0 && evtStr.indexOf('{') !== 0
    ? evtStr
    : 'https://www.aliyun.com';

crawler.start(pageUrl);
```

If you want to use it in Alibaba Function Computing Service, [cendertron-fc](./deploy/fc) provides simple template.

## Test Urls

- http://testphp.vulnweb.com/AJAX/#
- http://demo.aisec.cn/demo/
- https://jsonplaceholder.typicode.com/

# Strategy | 策略

# About

## Roadmap

- [x] 将自定义参数的爬虫全部划归到 POST 中，POST 请求会进行 Body 存储与匹配
- [x] 引入自定义的 BrowserEventEmitter，全局仅注册单个 Browser 监听器
- [x] add https://github.com/winstonjs/winston as logger
- https://123.125.98.210/essframe
- [ ] 分别添加调度器级别与爬虫级别的监控

## Motivation & Credits

- [gremlins.js](https://github.com/marmelab/gremlins.js/): Monkey testing library for web apps and Node.js

- [weakfilescan](https://github.com/ring04h/weakfilescan): 基于爬虫，动态收集扫描目标相关信息后进行二次整理形成字典规则，利用动态规则的多线程敏感信息泄露检测工具，支持多种个性化定制选项。
