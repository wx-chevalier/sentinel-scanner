const path = require('path');

const launchOptionForFC = [
  // error when launch(); No usable sandbox! Update your kernel
  '--no-sandbox',
  // error when launch(); Failed to load libosmesa.so
  '--disable-gpu',
  // freeze when newPage()
  '--single-process'
];

const localChromePath = path.join('headless_shell.tar.gz');
const remoteChromeOSSBucket = process.env.CHROME_BUCKET;
const remoteChromeOSSRegion = process.env.CHROME_REGION;
const remoteChromeOSSKey = process.env.CHROME_KEY || 'headless_shell.tar.gz';
const remoteChromeOSSAccessKeyId = process.env.CHROME_ACCESS_KEY_ID;
const remoteChromeOSSAccessKeySecret = process.env.CHROME_ACCESS_KEY_SECRET;

const setupChromePath = path.join(path.sep, 'tmp');
const executablePath = path.join(setupChromePath, 'headless_shell');

const DEBUG = process.env.DEBUG;
const local = !!process.env.local;

module.exports = {
  launchOptionForFC,
  localChromePath,
  remoteChromeOSSBucket,
  remoteChromeOSSKey,
  setupChromePath,
  executablePath,
  remoteChromeOSSAccessKeyId,
  remoteChromeOSSAccessKeySecret,
  remoteChromeOSSRegion,
  DEBUG,
  local
};
