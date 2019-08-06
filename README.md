![](https://i.postimg.cc/vHMJtwd4/image.png)

# Chaos Scanner

> 混沌守望者，凛冬在侧，长夜将至，我为你持剑而立，守望四方！

Chaos Scanner 是模块化、分布式、多维度安全扫描解决方案，包含了漏洞分析、碎片化安全扫描工具、定向验证(POCs)、资产管理与调度器等多个部分。对于 Chaos Scanner 的部署、测试与使用手册，请参考 [使用手册](./使用手册.md) 一文。Chaos Scanner 也是笔者[信息安全与渗透测试](https://ngte-be.gitbook.io/i/xin-xi-an-quan-yu-shen-tou-ce-shi/xin-xi-an-quan-yu-shen-tou-ce-shi)系列文章的理论实践。

**WIP**: 项目正处在闭源开发测试中，我们即将发布社区预览版（Community Preview），如有其它需要请提 Issue。

# Modules | 模块

- [cendertron](./cendertron): Cendertron 是基于 Puppeteer 的 Web 2.0 动态爬虫与敏感信息泄露检测工具。其依托于 [xe-crawler](https://github.com/wx-chevalier/xe-crawler) 的通用爬虫、调度与缓存模型，新增了 Monkey Test 以及 Request Intercept 等特性，以期尽可能多地挖掘页面与请求。同时针对渗透测试的场景，Cendertron 内置了目录扫描、敏感文件扫描的能力，能够模拟用户实际在浏览器登录状态下的自定义字典爆破。Cendertron 在大量实践的基础上设置了自身的去重策略，能够尽可能地避免重复爬取，加快扫描速度。

- [vulns | 漏洞库]()

- [pocs | 漏洞验证与执行]()

* [assets-admin | 数字资产管理](./assets-admin)

* [tools | 工具](./tools)

  - sub-domain: 子域名扫描
  - weak-files: 敏感文件扫描
  - weak-pwds: 弱口令扫描
  - sql-injection: SQL 注入检测

- [scheduler | 调度]()

# About | 关于

在 [Awesome InfoSecurity List](https://ngte-al.gitbook.io/i/infosecurity) 中就列举了很多开源的扫描器以及安全工具。但是，即使像 w3af 这样著名的开源扫描器，其也存在扫描不稳定、无法进行大规模分布式扫描、无法进行人机协作的半自动化扫描等问题，也无法完美地解决笔者的问题。因此我们打算自己从零开始开发一款尽可能贴近商业级扫描器要求的、模块化、弹性可伸缩的扫描器，我们最初只是从简单的分布式 POC 执行框架开始，逐步完善漏洞库与 POC 库；再逐步用自己实现的 SQL 注入、命令执行、XSS、CSRF 等经典的基础扫描模块替换 SQLMap 等。

## Motivation & Credits

- [w3af #Project#](https://github.com/andresriancho/w3af): w3af: web application attack and audit framework, the open source web vulnerability scanner.
