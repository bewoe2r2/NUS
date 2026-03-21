const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const filePath = 'file:///' + path.resolve('slides/nusslides.html').split('\\').join('/');
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  // Navigate to slide 1 first (Home key)
  await page.keyboard.press('Home');
  await new Promise(r => setTimeout(r, 500));

  const targets = [3, 8, 15]; // 1-indexed slide numbers
  for (const target of targets) {
    // Go to slide 1 first
    await page.keyboard.press('Home');
    await new Promise(r => setTimeout(r, 300));
    // Press right arrow (target-1) times
    for (let i = 0; i < target - 1; i++) {
      await page.keyboard.press('ArrowRight');
      await new Promise(r => setTimeout(r, 100));
    }
    await new Promise(r => setTimeout(r, 1500));
    const filename = 'slide_captures/slide_' + String(target).padStart(2, '0') + '.png';
    await page.screenshot({ path: filename, fullPage: false });
    console.log('Captured: ' + filename);
  }

  await browser.close();
  console.log('Done');
})();
