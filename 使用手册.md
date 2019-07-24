# Chaos Scanner，多策略（爬虫 & POC 扫描）、模块化、分布式扫描器

在 [Awesome InfoSecurity List](https://ngte-al.gitbook.io/i/infosecurity) 中就列举了很多开源的扫描器以及安全工具。但是，即使像 w3af 这样著名的开源扫描器，其也存在扫描不稳定、无法进行大规模分布式扫描、无法进行人机协作的半自动化扫描等问题，也无法完美地解决笔者的问题。因此我们打算自己从零开始开发一款尽可能贴近商业级扫描器要求的、模块化、弹性可伸缩的扫描器，我们最初只是从简单的分布式 POC 执行框架开始，逐步完善漏洞库与 POC 库；再逐步用自己实现的 SQL 注入、命令执行、XSS、CSRF 等经典的基础扫描模块替换 SQLMap 等。

# 本地部署与配置

# 资产的全生命周期管理

# 综合扫描与 POC 扫描

# 人机协作、可编排的半自动化扫描

![](https://zeebe.io/img/blog/bpmn-primer-1/sequence-decisions-parallel-exclusive.png)
