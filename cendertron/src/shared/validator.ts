/** 常见的校验 */

// 资源文件的前缀
const mediaSuffix = [
  // 图片
  'bmp',
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
  'ttf',

  // 音视频
  'mp3',
  'mp4',
  'wov'
];

// 判断是否为图片链接
export const isMedia = (url: string) =>
  mediaSuffix.reduce(
    (prev, suffix) => prev || url.indexOf(`.${suffix}`) > -1,
    false
  );

// 判断是否为有效的 Href Link，即包含地址，不包含 JavaScript 点击等
export const isValidLink = (href: string | null) =>
  href && href !== '#' && href.indexOf('javascript:') < 0;

// 判断某个字符串中是否包含数字，即是否可能为 UUID
export const maybeUUID = (pathFragment: string | null) => {
  if (!pathFragment) {
    return false;
  }

  // 只要有一位为数字，就有可能是 UUID
  return pathFragment
    .split('')
    .reduce((prev, char) => prev || !isNaN(parseInt(char)), false);
};
