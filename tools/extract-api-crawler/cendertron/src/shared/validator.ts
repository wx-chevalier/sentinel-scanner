/** 常见的校验 */

const imgSuffix = ['ico', 'jpeg', 'jpg', 'png'];

// 判断是否为图片链接
export const isImg = (url: string) =>
  imgSuffix.reduce((prev, suffix) => prev || url.endsWith(suffix), false);
