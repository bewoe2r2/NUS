/**
 * Capture all 15 slides from nusslides.html using Playwright.
 * Opens the HTML file directly (no server needed).
 * Navigates using ArrowRight, waits for animations.
 * Fixes position:relative override from bg-*-glow classes by
 * forcing position:absolute on the active slide.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const HTML_PATH = path.join(__dirname, '..', 'slides', 'nusslides.html');
const OUT_DIR = path.join(__dirname, '..', 'slide_captures');
const NUM_SLIDES = 15;
const WIDTH = 1920;
const HEIGHT = 1080;

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // Clean old captures
  for (let i = 1; i <= 20; i++) {
    const f = path.join(OUT_DIR, `slide_${i}.png`);
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const fileUrl = 'file:///' + HTML_PATH.replace(/\\/g, '/');
  console.log('Opening:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'load', timeout: 30000 });

  // Wait for fonts and initial render + slide 1 animations
  await page.waitForTimeout(4000);

  // Fix: ensure all slides with glow classes keep position:absolute
  // The bg-*-glow classes override position to relative, pushing
  // non-first slides below the viewport.
  await page.addStyleTag({
    content: `
      .slide.bg-glow,
      .slide.bg-red-glow,
      .slide.bg-green-glow {
        position: absolute !important;
        inset: 0 !important;
      }
    `
  });

  // Capture slide 1 (already showing)
  console.log('Capturing slide 1...');
  await page.screenshot({
    path: path.join(OUT_DIR, 'slide_1.png'),
    fullPage: false,
  });
  console.log('  done slide_1.png');

  // Navigate through remaining slides with ArrowRight
  for (let i = 2; i <= NUM_SLIDES; i++) {
    await page.keyboard.press('ArrowRight');
    // Wait for transition + staggered animations
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(OUT_DIR, `slide_${i}.png`),
      fullPage: false,
    });
    console.log(`Captured slide ${i} / ${NUM_SLIDES}`);
  }

  await browser.close();
  console.log(`\nDone! ${NUM_SLIDES} slides captured in ${OUT_DIR}`);
})();
