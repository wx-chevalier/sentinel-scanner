/** 爬虫参数 */
export interface CrawlerOption {
  // 爬取深度，如果设置为 1 就是单页面爬虫
  depth: number;

  // 单页面爬取出的最多的子节点数
  maxPageCount: number;
  // 总站点的总延时
  timeout: number;
  navigationTimeout: number;
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
  // 是否使用模拟操作
  useClickMonkey: boolean;
  // 是否使用弱口令扫描
  useWeakfile: boolean;

  // 页面 Cookie
  cookies?: { name: string; value: string }[];
  // 页面的 localStorage
  localStorage?: Record<string, string>;

  // 忽略的页面
  ignoredRegex?: string;
}

export const defaultCrawlerOption: CrawlerOption = {
  // 爬取深度
  depth: 4,

  // 单爬虫最多爬取页面数
  maxPageCount: 500,
  // 默认超时为 20 分钟
  timeout: 20 * 60 * 1000,
  // 跳转超时为 30s
  navigationTimeout: 30 * 1000,
  // 单页超时为 60s
  pageTimeout: 60 * 1000,

  isSameOrigin: true,
  isIgnoreAssets: true,
  isMobile: false,
  ignoredRegex: '.*logout.*',

  useCache: true,
  useWeakfile: false,
  useClickMonkey: false
};

export default defaultCrawlerOption;
