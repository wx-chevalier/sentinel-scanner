/** 常见的校验 */

const mediaSuffix = [
  // 图片
  'ico',
  'jpeg',
  'jpg',
  'png',
  'gif',
  'webp',
  'svg',

  // 字体
  'font',
  'woff',

  // 音视频
  'mp3',
  'mp4',
  'wov'
];

// 判断是否为图片链接
export const isMedia = (url: string) =>
  mediaSuffix.reduce((prev, suffix) => prev || url.endsWith(suffix), false);

// 判断是否为有效的 Href，即包含地址，不包含 JavaScript 点击等
export const isValidHref = (href: string | null) =>
  href && href !== '#' && href.indexOf('javascript:') < 0;

// 判断某个字符串中是否包含数字，即是否可能为 UUID
export const maybeUUID = (url: string | null) => {
  if (!url) {
    return false;
  }

  // 只要有一位为数字，就有可能是 UUID
  return url
    .split('')
    .reduce((prev, char) => prev || !isNaN(parseInt(char)), false);
};
