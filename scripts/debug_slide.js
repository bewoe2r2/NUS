/**
 * Debug: capture slide 3 with extensive DOM inspection
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const HTML_PATH = path.join(__dirname, '..', 'slides', 'nusslides.html');
const OUT_DIR = path.join(__dirname, '..', 'slide_captures');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const fileUrl = 'file:///' + HTML_PATH.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Navigate to slide 3
  await page.keyboard.press('ArrowRight'); // slide 2
  await page.waitForTimeout(2000);
  await page.keyboard.press('ArrowRight'); // slide 3
  await page.waitForTimeout(2000);

  // Extensive debug
  const debug = await page.evaluate(() => {
    const active = document.querySelector('.slide.active');
    if (!active) return { error: 'no active slide' };

    const result = {
      slideNum: active.getAttribute('data-slide'),
      slideClasses: active.className,
      slideBBox: active.getBoundingClientRect(),
      slideComputed: {},
      children: [],
    };

    const cs = window.getComputedStyle(active);
    result.slideComputed = {
      opacity: cs.opacity,
      visibility: cs.visibility,
      display: cs.display,
      position: cs.position,
      zIndex: cs.zIndex,
      overflow: cs.overflow,
      width: cs.width,
      height: cs.height,
      background: cs.background,
      contain: cs.contain,
    };

    // Check every child element
    const children = active.querySelectorAll('*');
    children.forEach((child, idx) => {
      const cc = window.getComputedStyle(child);
      const bbox = child.getBoundingClientRect();
      if (idx < 30) {
        result.children.push({
          tag: child.tagName,
          class: child.className,
          text: child.textContent?.substring(0, 50),
          opacity: cc.opacity,
          visibility: cc.visibility,
          display: cc.display,
          color: cc.color,
          bbox: { x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height },
        });
      }
    });

    return result;
  });

  console.log(JSON.stringify(debug, null, 2));

  // Also capture the page HTML of the active slide to verify
  const html = await page.evaluate(() => {
    return document.querySelector('.slide.active')?.outerHTML?.substring(0, 500);
  });
  console.log('\n--- Active slide HTML ---');
  console.log(html);

  await browser.close();
})();
