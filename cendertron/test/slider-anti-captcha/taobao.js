const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1366, height: 768 }
  });
  const page = await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false
    });
  });

  await page.goto('https://world.taobao.com/markets/all/sea/register');

  let frame = page.frames()[1];
  await frame.waitForSelector('.nc_iconfont.btn_slide');

  const sliderElement = await frame.$('.slidetounlock');
  const slider = await sliderElement.boundingBox();

  const sliderHandle = await frame.$('.nc_iconfont.btn_slide');
  const handle = await sliderHandle.boundingBox();
  await page.mouse.move(
    handle.x + handle.width / 2,
    handle.y + handle.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(handle.x + slider.width, handle.y + handle.height / 2, {
    steps: 50
  });
  await page.mouse.up();

  await page.waitFor(3000);

  // success!

  await browser.close();
}

run();
