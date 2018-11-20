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

export interface Api {
  url: string;
  params?: { [key: string]: any } | string;
}
