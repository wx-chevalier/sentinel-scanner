const OSS = require('ali-oss').Wrapper;
const config = require('./config');

module.exports = function(context) {
  const accessKeyId =
    config.remoteChromeOSSAccessKeyId || context.credentials.accessKeyId;
  const accessKeySecret =
    config.remoteChromeOSSAccessKeySecret ||
    context.credentials.accessKeySecret;
  const stsToken = config.remoteChromeOSSAccessKeySecret
    ? ''
    : context.credentials.securityToken;
  return new OSS({
    region: config.remoteChromeOSSRegion,
    accessKeyId: accessKeyId,
    accessKeySecret: accessKeySecret,
    stsToken: stsToken,
    bucket: config.remoteChromeOSSBucket,
    internal: !config.local
  });
};
