import Crawler from './Crawler';

/** 爬虫参数 */
export interface CrawlerOption {
  // 爬取深度，如果设置为 1 就是单页面爬虫
  depth: number;
  // 爬虫的唯一编号
  uuid?: string;
  // 爬虫执行完成之后的回调
  onFinish?: (crawler: Crawler) => void;

  // 单页面爬取出的最多的子节点数
  maxPageCount: number;
  // 总站点的总延时
  timeout: number;
  // 单页面的延时
  pageTimeout: number;

  // 是否仅爬取同站内容
  isSameOrigin: boolean;
  // 是否忽略媒体资源
  isIgnoreAssets: boolean;
  // 是否设置为移动模式
  isMobile: boolean;
  // 是否开启缓存
  useCache: boolean;

  // 页面 Cookie
  cookie: string;
  // 页面的 localStorage
  localStorage: object;
}

export const defaultCrawlerOption: CrawlerOption = {
  // 爬取深度
  depth: 4,
  onFinish: undefined,

  // 单爬虫最多爬取页面数
  maxPageCount: 50,
  // 默认超时为 5 分钟
  timeout: 5 * 60 * 1000,
  pageTimeout: 30 * 1000,

  isSameOrigin: true,
  isIgnoreAssets: true,
  isMobile: false,
  useCache: true,

  cookie: '',
  localStorage: {}
};

export default defaultCrawlerOption;
