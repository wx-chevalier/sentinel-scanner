# Cendertron

> Cendertron = Crawler + cendertron

Advanced hosted crawler(in Docker) for Web 2.0 pages, focusing on scraping requests(page urls, apis, etc.), followed by pentest tools(Sqlmap, etc.).

Cendertron can be used for extracting requests(page urls, apis, etc.) from your Web 2.0 page, view in [demo](http://47.99.50.115:5000/) page, or [result](http://47.99.50.115:5000/apis/http://testphp.vulnweb.com/AJAX/) page.

# Usage

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
$ docker run -it -p 3000:3000 -cap-add=SYS_ADMIN --name cendertron-instance cendertron
```

## Test Urls

- http://testphp.vulnweb.com/AJAX/#
- http://demo.aisec.cn/demo/
- https://jsonplaceholder.typicode.com/

# About

## Roadmap

- 将自定义参数的爬虫全部划归到 POST 中，POST 请求会进行 Body 存储与匹配
- 引入自定义的 BrowserEventEmitter，全局仅注册单个 Browser 监听器

## Motivation & Credits

- [gremlins.js](https://github.com/marmelab/gremlins.js/): Monkey testing library for web apps and Node.js
