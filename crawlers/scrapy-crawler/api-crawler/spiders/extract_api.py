# -*- coding: utf-8 -*-
import re
import sys
import time
import scrapy
from scrapy.exceptions import CloseSpider

from urlparse import urlparse
from  AKscan.items import AkscanItem



class GetallurlsSpider(scrapy.Spider):
    name = 'getallurls'
    
    def __init__(self, target=None,timeout=None ,*args, **kwargs):
        super(GetallurlsSpider, self).__init__(*args, **kwargs)
        
        # 解析命令
        if target == None or not (target.startswith("http://") or target.startswith("https://")):
            raise CloseSpider("需要参数target; -a target=<url>")
            # 爬取超时 时间 单位秒(默认1800)
        self.spider_timeout = int(timeout) if timeout and timeout.isdigit() else 30*60
        # 初始化spider 必要参数
        self.start_urls = [target]
        self.allowed_domains = [urlparse(target).netloc]
        
        self.scheme = [urlparse(target).scheme]
        # 可保留url后缀
        self.staticResources = ['.asp', '.aspx', '.php', '.jsp', '.action', '.ts']
        self.staticurl = ['.shtml', '.html', '.htm']
        self.url_is_repeat = DuplicatesPipeline()
        # 启动时间戳
        self.start_time = time.time()

    # 过滤静态资源url(除了iterableResources)
    def Filter_static_url(self, url):
        self.staticResources.append(self.staticurl)
        try:
            if "." in url[-8:] and "."+url[-8:].split[1] in self.staticResources:
                return True
            elif not "." in url[-8:]:
                return True
        except:
            pass
        return False

    # 过滤其他站点url
    def Filter_otherWebsite(self, url):
        if self.allowed_domains[0] in url:
            return True
        else:
            return False

    # 过滤条件
    def Filter_condition(self, url):
        if self.Filter_otherWebsite(url) and self.Filter_static_url(url):
            return True
        return False

    # 过滤html等页面
    def Filter_html_url(self, url):
        try:
            if "." in url[-8:] and "."+url[-8:].split[1] in self.staticurl:
                return True
        except:
            pass
        return False

    def Filter_similar_url (self, url):
        '''
        URL相似度过滤
        多个相似url保留一个即可
        '''
        pass

    # 分析表单url
    # def get_from_url(self, response):
    #     tag_from = response.xpath("//form/@action").extract()
    #     if tag_from:
    #         return [self.scheme+ "://" +self.allowed_domains[0]+tag_action for tag_action in tag_from]
    #     else:
    #         return []

    # javascript动态解析
    # 自动交互

    def parse(self, response):
        # 静态页面链接分析
        staticurlpattern = re.compile(r'((https?)://[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|])')
        urls= staticurlpattern.findall(str(response.body))
        # urls + self.get_from_url(response)
        for url in urls:
            url = url[0]

            if self.Filter_condition(url):
                if self.url_is_repeat.process_item(url):
                    item = AkscanItem()
                    item['url'] = url
                    
                    # 超过 spider_timeout 就不在加url加入请求列表了
                    tmpnow_time = time.time()
                    if not tmpnow_time-self.start_time>self.spider_timeout:
                        # 发送新的url请求加入待爬队列，并调用回调函数 self.parse
                        yield scrapy.Request(url, callback = self.parse, dont_filter=False)
                    if not self.Filter_html_url(url) and "?" in url:
                        yield item
