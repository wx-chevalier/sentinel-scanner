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

export interface Request {
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

/** 提取出来的数据 */
export interface ResultMap {
  pages?: Request[];
  apis?: Request[];
  scripts?: Request[];
  media?: Request[];
}

/** 爬虫的响应结果 */
export interface CrawlerResult {
  isFinished: boolean;
  resultMap?: ResultMap;
}
