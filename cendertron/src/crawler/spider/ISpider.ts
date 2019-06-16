export interface ISpider {}

export interface SpiderOption {
  allowRedirect: boolean;
  depth: number;

  // 执行敏感文件扫描
  useWeakfile: boolean;
}

export const defaultSpiderOption: SpiderOption = {
  allowRedirect: false,
  depth: 1,
  useWeakfile: false
};
