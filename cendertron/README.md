![](https://i.postimg.cc/6pYfMBv7/image.png)

# Cendertron

> Cendertron = Crawler + cendertron

Crawl AJAX-heavy client-side Single Page Applications (SPAs), deploying with docker, focusing on scraping requests(page urls, apis, etc.), followed by pentest tools(Sqlmap, etc.). Cendertron can be used for extracting requests(page urls, apis, etc.) from your Web 2.0 page.

[Cendertron](https://url.wx-coder.cn/HinPM) 是基于 Puppeteer 的 Web 2.0 动态爬虫与敏感信息泄露检测工具。其依托于 [xe-crawler](https://github.com/wx-chevalier/xe-crawler) 的通用爬虫、调度与缓存模型，新增了 Monkey Test 以及 Request Intercept 等特性，以期尽可能多地挖掘页面与请求。同时针对渗透测试的场景，Cendertron 内置了目录扫描、敏感文件扫描的能力，能够模拟用户实际在浏览器登录状态下的自定义字典爆破。Cendertron 在大量实践的基础上设置了自身的去重策略，能够尽可能地避免重复爬取，加快扫描速度。Cendertron 同时也是正在闭源开发的 [Chaos-Scanner](https://github.com/wx-chevalier/Chaos-Scanner) 模块化安全扫描解决方案的一部分，为基础扫描与智能扫描提供前置输入。

![](https://i.postimg.cc/8PcCmt6t/image.png)

# Usage | 使用

## Locally Development | 本地开发

在本地开发中，我们只需要如正常的 Node 项目一样启动，其会使用 Puppeteer 内置的 Headless Chrome 来执行界面渲染操作：

```sh
$ git clone https://github.com/wx-chevalier/Chaos-Scanner
$ cd cendertron
$ yarn install
$ npm run dev
```

启动之后可以按提示打开浏览器界面：

![](https://i.postimg.cc/Tw8Y2cKc/image.png)

这里我们可以以 [DVWA](http://www.dvwa.co.uk/) 作为测试目标，在输入框内输入 `http://localhost:8082/` 然后执行爬取，即可得到如下结果：

```json
{
  "isFinished": true,
  "metrics": {
    "executionDuration": 116177,
    "spiderCount": 51,
    "depth": 4
  },
  "spiderMap": {
    "http://localhost:8082/vulnerabilities/csrf/": [
      {
        "url": "http://localhost:8082/vulnerabilities/view_source.php?id=csrf&security=low",
        "parsedUrl": {
          "host": "localhost:8082",
          "pathname": "/vulnerabilities/view_source.php",
          "query": {
            "id": "csrf",
            "security": "low"
          }
        },
        "hash": "localhost:8082#/vulnerabilities/view_source.php#idsecurity",
        "resourceType": "document"
      }
      // ...
    ]
  }
}
```

需要说明的是，因为 DVWA 是需要登录后爬取，因此如果想进行完整的测试请参考下文的 POST 方式创建任务。

## Deploy in Docker | 部署在 Docker 中

```sh
# build image
$ docker build -t cendertron .

# run as contaner
$ docker run -it --rm -p 3033:3000 --name cendertron-instance cendertron

# run as container, fix with Jessie Frazelle seccomp profile for Chrome.
$ wget https://raw.githubusercontent.com/jfrazelle/dotfiles/master/etc/docker/seccomp/chrome.json -O ~/chrome.json
$ docker run -it -p 3033:3000 --security-opt seccomp=$HOME/chrome.json --name cendertron-instance cendertron

# or
$ docker run -it -p 3033:3000 --cap-add=SYS_ADMIN --name cendertron-instance cendertron

# use network and mapping logs
$ docker run -d -p 3033:3000 --cap-add=SYS_ADMIN --name cendertron-instance --network wsat-network cendertron
```

## Deploy as FC | 以函数式计算方式部署

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

## Deploy as Cluster | 分布式集群模式部署

```yml
version: '3'
services:
  crawlers:
    image: cendertron
    ports:
      - '${CENDERTRON_PORT}:3000'
    deploy:
      replicas: 2
    volumes:
      - wsat_etc:/etc/wsat

volumes:
  wsat_etc:
    driver: local
    driver_opts:
      o: bind
      type: none
      device: /etc/wsat/
```

```json
{
    "redis": {
      "host": "x.x.x.x",
      "port": 6379,
      "password": "xx-xx-xx-xx"
    }
  }
}
```

```sh
# 创建服务
> docker stack deploy wsat --compose-file docker-compose.yml --resolve-image=changed

# 指定实例
> docker service scale wsat_crawlers=5
```

# Strategy | 策略

Cendertron 的内部架构如下所示：

![](https://i.postimg.cc/LsPNxSzM/image.png)

Crawler Scheduler 会负责定期重启 Headless Chrome 以控制缓存，并且针对待爬取的请求返回已缓存的内容。Crawler Scheduler 会为每个无缓存的目标创建 Crawler，Crawler 会根据策略创建不同的 Spider，每个 Spider 依次执行并且将结果推送到 Crawler 中；Crawler 在全部 Spider 执行完毕后会将结果推送到缓存并且通知 Crawler Scheduler。

## 模拟操作

![](https://i.postimg.cc/0Qp5zJm1/image.png)

Cendertron 内置了 Click Monkey, Gremlins 等多种随机执行器，会点击按钮并且执行一些随机操作：

```js
function initGermlins() {
  gremlins
    .createHorde()
    .gremlin(gremlins.species.formFiller())
    .gremlin(gremlins.species.toucher())
    .gremlin(gremlins.species.scroller())
    .gremlin(function() {
      if ('$' in window) {
        window.$ = function() {};
      }
    })
    .unleash();
}
```

## 请求监听与提取

Cendertron 会监听打开的页面与所有的 Ajax 请求：

```js
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
```

## URL 归一化与过滤

所谓的 URL 归一化，就是将同一资源下被随机串处理的 Path 们泛化成同一个 Pattern，从而减少重复爬取的数目；当然，在安全扫描的场景下我们需要进行尽可能地去重，而在数据爬取的场景下，则往往不需要进行过多的过滤。目前 Cendertron 只是采取了简单的 UTL 归一化算法，并且使用 Set 进行过滤，如果你想了解更复杂的 URL 归一化与聚类算法，可以参考[自然语言处理 https://url.wx-coder.cn/JcINy](https://url.wx-coder.cn/JcINy) 或者[哈希表实战 https://url.wx-coder.cn/WfdWP](https://url.wx-coder.cn/WfdWP) 中的关联章节。

```js
export function hashUrl(url: string): string {
  // 将 URL 进行格式化提取
  const _parsedUrl = parse(url, url, true);

  let urlHash = '';

  if (!_parsedUrl) {
    return urlHash;
  }

  // 提取出 URL 中的各个部分
  const { host, pathname, query, hash } = _parsedUrl;

  // 判断是否存在查询参数
  const queryKeys = Object.keys(query).sort((k1, k2) => (k1 > k2 ? 1 : -1));

  if (queryKeys.length > 0) {
    // 如果存在查询参数，则默认全路径加查询参数进行解析
    urlHash = `${host}#${pathname}#${queryKeys.join('')}`;
  } else {
    // 如果不存在查询参数，则去除 pathname 的最后一位，并且添加进来
    const pathFragments = pathname.split('/');

    // 判断路径是否包含多个项目，如果包含，则将所有疑似 UUID 的替换为 ID
    if (pathFragments.length > 1) {
      urlHash = `${host}#${pathFragments
        .filter(frag => frag.length > 0)
        .map(frag => (maybeUUID(frag) ? 'id' : frag))
        .join('')}`;
    } else {
      urlHash = `${host}#${pathname}`;
    }
  }

  if (hash) {
    const hashQueryString = hash.replace('#', '');
    const queryObj = parseQuery(hashQueryString);
    Object.keys(queryObj).forEach(n => {
      if (n) {
        urlHash += n;
      }
    });
  }

  return urlHash;
}
```

## 权限认证

以 DVWA 为例，可以用 Docker 快速开启测试环境：`docker run --rm -it -p 8082:80 vulnerables/web-dvwa`，然后向 `/scrape` 提交 POST 请求：

```json
{
  "url": "http://localhost:8082/vulnerabilities/csrf/",
  "cookies": "tid=xx; PHPSESSID=xx; security=low",
  "ignoredRegex": ".*logout.*"
}
```

在 Cendertron 中，其会使用如下方式设置 Cookie：

```js
const puppeteer = require('puppeteer');

let rockIt = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  var cookie = [
    // cookie exported by google chrome plugin editthiscookie
    {
      domain: 'httpbin.org',
      expirationDate: 1597288045,
      hostOnly: false,
      httpOnly: false,
      name: 'key',
      path: '/',
      sameSite: 'no_restriction',
      secure: false,
      session: false,
      storeId: '0',
      value: 'value!',
      id: 1
    }
  ];
  await page.setCookie(...cookie);
  await page.goto('https://httpbin.org/headers');
  console.log(await page.content());
  await page.close();
  await browser.close();
};
rockIt();
```

未来也会支持 localStorage 等存储方式：

```js
await page.evaluate(() => {
  localStorage.setItem('token', 'example-token');
});
```
# 集群与调优

## 基于 Docker Swarm 的弹性化集群部署

在 [Docker 实战](https://ngte-infras.gitbook.io/i/xu-ni-hua-yu-bian-pai/docker)系列中，我们详细介绍了 Docker 及 Docker Swarm 的概念与配置、这里我们也是使用 Docker 提供的 Route Mesh 机制，将多个节点以相同端口暴露出去，这也就要求我们将各个爬虫节点的部分状态集中化存储，这里以 Redis 为中心化存储。

实际上，Chaos Scanner 中的 POC 节点与爬虫节点都遵循该调度方式，不过 POC 扫描节点主要是依赖于 RabbitMQ 进行任务分发：

![](https://i.postimg.cc/Cxp9YMmS/image.png)

整体爬虫在扫描调度中的逻辑流如下：

![](https://i.postimg.cc/Z5P2qkM3/image.png)

这里我们可以基于基础镜像编辑 Compose 文件，即 docker-compose.yml:

```yml
version: '3'
services:
  crawlers:
    image: cendertron
    ports:
      - '${CENDERTRON_PORT}:3000'
    deploy:
      replicas: 2
    volumes:
      - wsat_etc:/etc/wsat

volumes:
  wsat_etc:
    driver: local
    driver_opts:
      o: bind
      type: none
      device: /etc/wsat/
```

这里我们将 Redis 的配置以卷方式挂载进容器，在 Chaos Scanner 好，不同设备的统一注册中心即简化为了这个统一的配置文件：

```json
{
  "db": {
    "redis": {
      "host": "x.x.x.x",
      "port": 6379,
      "password": "xx-xx-xx-xx"
    }
  }
}
```

Redis 配置完毕之后，我们可以通过如下的命令创建服务：

```sh
# 创建服务
> docker stack deploy wsat --compose-file docker-compose.yml --resolve-image=changed

# 指定实例
> docker service scale wsat_crawlers=5
```

这里我们提供了同时扫描多个目标的创建方式，不同的 URL 之间以 `|` 作为分隔符：

```yml
POST /scrape

{
"urls":"http://baidu.com|http://google.com"
}
```

在集群运行之后，通过 `ctop` 命令我们能看到单机上启动的容器状态：

![](https://i.postimg.cc/SK2k9vCV/image.png)

使用 `htop` 命令可以发现整个系统的 CPU 调用非常饱满：

![](https://i.postimg.cc/9QNXMNLX/image.png)

## 面向失败的设计与监控优先

在[测试与高可用保障](https://ngte-be.gitbook.io/i/?q=测试与高可用保障)系列文章中，我们特地讨论过在高可用架构设计中的面向失败的设计原则：

![](https://i.postimg.cc/zDK3YzGQ/image.png)

这些原则中极重要的一条就是监控覆盖原则，我们在设计阶段，就假设线上系统会出问题，从而在管控系统添加相应措施来防止一旦系统出现某种情况，可以及时补救。而在爬虫这样业务场景多样性的情况下，我们更是需要能够及时审视系统的现状，以随时了解当前策略、参数的不恰当的地方。

在集群背景下，爬虫的状态信息是存放在了 Redis 中，每个爬虫会定期上报。上报的爬虫信息会自动 Expire，如果查看系统当前状态时，发现某个节点的状态信息不存在，即表示该爬虫在本事件窗口内已经假死：

![](https://i.postimg.cc/ydSV9b4s/image.png)

我们依然通过 `GET /_ah/health` 端口来查看整个系统的状态，如下所示：

```json
{
  "success": true,
  "mode": "cluster",
  "schedulers": [
    {
      "id": "a8621dc0-afb3-11e9-94e5-710fb88b1291",
      "browserStatus": [
        {
          "targetsCnt": 4,
          "useCount": 153,
          "urls": [
            {
              "url": ""
            },
            {
              "url": "about:blank"
            },
            {
              "url": ""
            },
            {
              "url": "http://180.100.134.161:8091/xygjitv-web/#/enter_index_db/film"
            }
          ]
        }
      ],
      "runingCrawlers": [
        {
          "id": "dabd6260-b216-11e9-94e5-710fb88b1291",
          "entryPage": "http://180.100.134.161:8091/xygjitv-web/",
          "progress": "0.44",
          "startedAt": 1564414684039,
          "option": {
            "depth": 4,
            "maxPageCount": 500,
            "timeout": 1200000,
            "navigationTimeout": 30000,
            "pageTimeout": 60000,
            "isSameOrigin": true,
            "isIgnoreAssets": true,
            "isMobile": false,
            "ignoredRegex": ".*logout.*",
            "useCache": true,
            "useWeakfile": false,
            "useClickMonkey": false,
            "cookies": [
              {
                "name": "PHPSESSID",
                "value": "fbk4vjki3qldv1os2v9m8d2nc4",
                "domain": "180.100.134.161:8091"
              },
              {
                "name": "security",
                "value": "low",
                "domain": "180.100.134.161:8091"
              }
            ]
          },
          "spiders": [
            {
              "url": "http://180.100.134.161:8091/xygjitv-web/",
              "type": "page",
              "option": {
                "allowRedirect": false,
                "depth": 1
              },
              "isClosed": true,
              "currentStep": "Finished"
            }
          ]
        }
      ],
      "localRunningCrawlerCount": 1,
      "localFinishedCrawlerCount": 96,
      "reportTime": "2019-7-29 23:38:34"
    }
  ],
  "cache": ["Crawler#http://baidu.com"],
  "pageQueueLen": 31
}
```

## 参数调优

因为网络震荡等诸多原因，Cendertron 很难保障绝对的稳定性与一致性，更多的也还是在效率与性能之间的权衡。最后我们还是再列举下目前 Cendertron 内置的参数配置，在 `src/config.ts` 中包含了所有的配置：

```ts
export interface ScheduleOption {
  // 并发爬虫数
  maxConcurrentCrawler: number;
}

export const defaultScheduleOption: ScheduleOption = {
  maxConcurrentCrawler: 1
};

export const defaultCrawlerOption: CrawlerOption = {
  // 爬取深度
  depth: 4,

  // 单爬虫最多爬取页面数
  maxPageCount: 500,
  // 默认超时为 20 分钟
  timeout: 20 * 60 * 1000,
  // 跳转超时为 30s
  navigationTimeout: 30 * 1000,
  // 单页超时为 60s
  pageTimeout: 60 * 1000,

  isSameOrigin: true,
  isIgnoreAssets: true,
  isMobile: false,
  ignoredRegex: '.*logout.*',

  // 是否使用缓存
  useCache: true,
  // 是否进行敏感文件扫描
  useWeakfile: false,
  // 是否使用模拟操作
  useClickMonkey: false
};

export const defaultPuppeteerPoolConfig = {
  max: 1, // default
  min: 1, // default
  // how long a resource can stay idle in pool before being removed
  idleTimeoutMillis: Number.MAX_VALUE, // default.
  // maximum number of times an individual resource can be reused before being destroyed; set to 0 to disable
  acquireTimeoutMillis: defaultCrawlerOption.pageTimeout * 2,
  maxUses: 0, // default
  // function to validate an instance prior to use; see https://github.com/coopernurse/node-pool#createpool
  validator: () => Promise.resolve(true), // defaults to always resolving true
  // validate resource before borrowing; required for `maxUses and `validator`
  testOnBorrow: true // default
  // For all opts, see opts at https://github.com/coopernurse/node-pool#createpool
};
```



# About

## Test Target

- http://testphp.vulnweb.com/AJAX/#
- http://demo.aisec.cn/demo/
- https://jsonplaceholder.typicode.com/
- [DVWA](http://www.dvwa.co.uk/)

## Roadmap

- [x] 将自定义参数的爬虫全部划归到 POST 中，POST 请求会进行 Body 存储与匹配
- [x] 引入自定义的 BrowserEventEmitter，全局仅注册单个 Browser 监听器
- [x] add https://github.com/winstonjs/winston as logger
- https://123.125.98.210/essframe
- [ ] 分别添加调度器级别与爬虫级别的监控

## Motivation & Credits

- [gremlins.js](https://github.com/marmelab/gremlins.js/): Monkey testing library for web apps and Node.js

- [weakfilescan](https://github.com/ring04h/weakfilescan): 基于爬虫，动态收集扫描目标相关信息后进行二次整理形成字典规则，利用动态规则的多线程敏感信息泄露检测工具，支持多种个性化定制选项。

- [Retire.js #Project#](https://github.com/RetireJS/retire.js): Scanner detecting the use of JavaScript libraries with known vulnerabilities.

- [Awesome Node.js for pentesters #Project#](https://github.com/jesusprubio/awesome-nodejs-pentest): ☠️ Delightful Node.js packages useful for penetration testing, exploiting, reverse engineer, cryptography ...

- [pentest-tool-lite #Project#](https://github.com/juffalow/pentest-tool-lite): Test your page against basic security, html, wordpress, ... check lists
