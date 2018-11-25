# url 数据去重
class DistinctPipeline(object):
    def __init__(self):
        #set为集合，集合为数据不重复无排序的
        self.existedUrls = set()

    def is_similar(self, sourceUrl, targetUrl):
        '''
        判断两个 Url 是否相似，如果相似则忽略，否则保留
        '''
        pass

    def process_item(self, url):

        # 如果数据已经存在，则返回 False，忽略
        if url in self.existedUrls:
            return False

        # 不存在时，就添加数据
        self.existedUrls.add(url)
        return True
