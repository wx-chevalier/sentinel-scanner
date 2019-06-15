/** 类型定义 */

export type SerializedResponse = {
  status: number;
  content: string;
};

export type ViewportDimensions = {
  width: number;
  height: number;
};

export const MOBILE_USERAGENT =
  'Mozilla/5.0 (Linux; Android 8.0.0; Pixel 2 XL Build/OPD1.170816.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Mobile Safari/537.36';

export type ErrorType = 'Forbidden' | 'NoResponse';

export class ScreenshotError extends Error {
  type: ErrorType;

  constructor(type: ErrorType) {
    super(type);

    this.name = this.constructor.name;

    this.type = type;
  }
}

export interface ParsedUrl {
  host: string;
  pathname: string;
  query: object;
}

export interface SpiderResult {
  // 请求的路径与标识信息
  url: string;
  parsedUrl: ParsedUrl;
  hash: string;

  // 资源类型
  resourceType?: string;

  // 请求方法
  method?: string;

  // 请求体
  postData?: string | undefined;
}

/** 爬虫的响应结果 */
/** 爬虫的响应结果 */
export interface CrawlerResult {
  // 是否结束
  isFinished: boolean;

  // 性能度量
  metrics?: {
    // 执行时间
    executionDuration: number;

    // 爬虫总数目
    spiderCount: number;

    // 爬取的深度
    depth: number;
  };

  // 结果映射
  spiderMap?: { [key: string]: SpiderResult[] };
}
