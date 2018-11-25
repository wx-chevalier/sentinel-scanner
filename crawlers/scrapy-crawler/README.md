
# AKscan
## 前期要求

- [x] 支持命令行
- 获取页面有效url
  - - [x] 过滤掉静态资源&&非本站点url
  - - [x] ur去重
  - - [ ] 分析表单响应url
  - - [ ] URL相似度过滤(过滤掉类似文章类的url)
  - - [x] 把html的静态的url请求加入待爬队列, 把其他url，输出到item
  	- - [ ]  html的静态的url也需要进行URL相似度过滤(防止全部访问没有价值的url)
- - [x] 设置最大深度5
- - [x] 超过30分钟需要在停止爬取



## 单独使用
```shell
$ cd CScan-POC/utility/SQLinjectionScan
$ pipenv install --dev

#第一种
cd AKscan/
$ python run.py -h
$ python run.py --target http://sublimetext.iaixue.com/ --json-out-file=./urls.json
$ python run.py --target http://sublimetext.iaixue.com/ --timeout=1800 --depth-limit=5 --json-out-file=./urls.json

#第二种
$ cd AKscan/AKscan/spiders/
$ scrapy crawl getallurls -a target=http://sublimetext.iaixue.com/ -o ./urls.json
$ scrapy crawl getallurls -a target=http://sublimetext.iaixue.com/ -a timeout=1801 -s DEPTH_LIMIT=7 -o ./urls.json
```

## 输出
输出定义: `CScan-POC/utility/SQLinjectionScan/AKscan/AKscan/setting.py` 的参数 `OUTFILE`

```shell
$ cat CScan-POC/utility/SQLinjectionScan/urls.json
#---------------------------------------------------
{"getallurls":
  {"sublimetext.iaixue.com":
    ["http://sublimetext.iaixue.com/archiver/",
    "http://sublimetext.iaixue.com/forum.php?mobile=yes",
    "http://sublimetext.iaixue.com/connect.php?mod=login&op=init&referer=index.php&statfrom=login_simple"
    ...]
  }
}
#---------------------------------------------------
```