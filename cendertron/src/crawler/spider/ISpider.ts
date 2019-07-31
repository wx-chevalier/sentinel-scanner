export interface ISpider {}

export interface SpiderOption {
  allowRedirect: boolean;
  depth: number;
  // 页面插件
  monkies?: {
    sliderCaptcha: {
      sliderElementSelector: string;
      sliderHandleSelector: string;
    };
  };
}

export const defaultSpiderOption: SpiderOption = {
  allowRedirect: false,
  depth: 1
};
