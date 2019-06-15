# cendertron-fc

# Development

```sh
# Install fun cli
$ brew tap vangie/formula
$ brew install fun
$ brew install fcli

# Config fun cli
$ fun config

# Install dependences
$ fun instll

# 如果希望运行时动态地从远端拉取 Puppeteer，则在 https://fc-demo-public.oss-cn-hangzhou.aliyuncs.com/fun/examples/headless_shell.tar.gz 下载 headless_shell.tar.gz，或者使用 scripts/buildChrome.sh 构建；然后上传到 oss://${BUCKET}/headless_shell.tar.gz

# Deployment

# 使用 fun 命令部署
$ fun deploy

# 或者本地手动打包上传，同步打包本地的 Chrome 到远端
$ npm run package
# 不打包 Chrome，动态地从远端拉取
$ npm run package-nochrome
# 在相应 Service 目录下发布 Function
$ fcli shell
>>> mkf/upf cendertron-fc/crawl -h index.handler -f package.zip -t nodejs8

: << !
using region: cn-beijing
using accountId: ***********6367
using accessKeyId: ***********5Kd5
using timeout: 10

Waiting for service cendertron-fc to be deployed...
        Waiting for function crawl to be deployed...
                Waiting for packaging function crawl code...
                package function crawl code done
        function crawl deploy success
service cendertron-fc deploy success
!

# Test crawl
# Invoke remote
$ fcli function invoke -s cendertron-fc -f crawl
$ fcli function invoke -s cendertron-fc -f crawl --event-str 'http://www.baidu.com'

# Local debug
$ fun local invoke crawl <<<'http://www.baidu.com'
```
