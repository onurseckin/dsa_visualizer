const puppeteer = require('puppeteer');

(async () => {
  const fileArg = process.argv[2];
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: fileArg, fullPage: true });
  await browser.close();
})();
