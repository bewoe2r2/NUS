const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const URL = 'http://localhost:3002';
const OUT_DIR = path.join(__dirname, '..', 'slide_captures');
const NUM_SLIDES = 10;
const WIDTH = 1920;
const HEIGHT = 1080;

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // Clean old captures
  for (let i = 1; i <= 20; i++) {
    const f = path.join(OUT_DIR, `slide_${i}.png`);
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for fonts and initial render
  await new Promise(r => setTimeout(r, 3000));

  // Capture slide 1 (already showing)
  console.log('Capturing slide 1...');
  await page.screenshot({
    path: path.join(OUT_DIR, 'slide_1.png'),
    fullPage: false,
  });
  console.log('  ✓ slide_1.png');

  // Navigate through remaining slides with arrow key
  for (let i = 2; i <= NUM_SLIDES; i++) {
    await page.keyboard.press('ArrowRight');
    // Wait for transition animation to complete
    await new Promise(r => setTimeout(r, 1500));

    console.log(`Capturing slide ${i}...`);
    await page.screenshot({
      path: path.join(OUT_DIR, `slide_${i}.png`),
      fullPage: false,
    });
    console.log(`  ✓ slide_${i}.png`);
  }

  await browser.close();
  console.log(`\nDone! ${NUM_SLIDES} slides captured in ${OUT_DIR}`);
})();
