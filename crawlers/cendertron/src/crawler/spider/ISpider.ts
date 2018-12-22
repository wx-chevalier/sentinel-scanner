export interface ISpider {}

export interface SpiderOption {
  allowRedirect: boolean;
  depth: number;
}

export const defaultSpiderOption: SpiderOption = {
  allowRedirect: false,
  depth: 1
};
