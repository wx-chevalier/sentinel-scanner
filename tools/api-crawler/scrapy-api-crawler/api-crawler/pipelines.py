# -*- coding: utf-8 -*-

# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://doc.scrapy.org/en/latest/topics/item-pipeline.html

import os
import json
from settings import OUTFILE
from urlparse import urlparse

class AkscanPipeline(object):
    def __init__(self):
        self.outfile = OUTFILE
        self.file = open(self.outfile, 'w')

    def changing_data_structure(self):
        self.file = open(self.outfile, 'r')
        domain = ''
        url_result = {'getallurls':{}}
        urls = {domain:[]}
        url_lists = []

        for oneline in self.file:
            dict_oneline = eval(oneline.split('\n')[0])
            if not domain:
                domain = urlparse(dict_oneline['url']).netloc
                urls = {domain:[]}
            url_lists.append(dict_oneline['url'])
        urls[domain] = url_lists
        url_result['getallurls']= urls
        self.file.close()

        self.file = open(self.outfile, 'w')
        content = str(json.dumps(url_result, separators=(',', ':')))
        self.file.write(content)
        self.file.close()

    def process_item(self, item, spider):
        content = json.dumps(dict(item), ensure_ascii=False) + "\n"
        self.file.write(content)
        return item

    def close_spider(self, spider):
        self.file.close()
        # self.changing_data_structure()
