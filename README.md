# ChaosScanner

> 混沌守望者，凛冬在侧，长夜将至，我为你持剑而立，守望四方！

ChaosScanner 是模块化安全扫描解决方案，包含了漏洞分析、碎片化安全扫描工具、定向验证(POCs)、资产管理与调度器等多个部分。

**WIP**: 项目正处在闭源开发测试中，如果有商业合作需要请联系 QQ 384924552

# Modules | 模块

- [cendertron](./cendertron): Cendertron 是基于 Puppeteer 的 Web 2.0 动态爬虫与敏感信息泄露检测工具。其依托于 xe-crawler 的通用爬虫、调度与缓存模型，新增了 Monkey Test 以及 Request Intercept 等特性，以期尽可能多地挖掘页面与请求。同时针对渗透测试的场景，Cendertron 内置了目录扫描、敏感文件扫描的能力，能够模拟用户实际在浏览器登录状态下的自定义字典爆破。Cendertron 在大量实践的基础上设置了自身的去重策略，能够尽可能地避免重复爬取，加快扫描速度。

- [vulns | 漏洞库]()

- [pocs | 漏洞验证与执行]()

* [assets-admin | 数字资产管理](./assets-admin)

* [tools | 工具](./tools)

  - sub-domain: 子域名扫描
  - weak-files: 敏感文件扫描
  - weak-pwds: 弱口令扫描
  - sql-injection: SQL 注入检测

- [scheduler | 调度]()

# Preface | 前言

![](https://i.postimg.cc/Y2TqgSZj/image.png)

# About | 关于

## Motivation & Credits

- [w3af #Project#](https://github.com/andresriancho/w3af): w3af: web application attack and audit framework, the open source web vulnerability scanner.
