/**
 * Capture screenshots of the running Bewo app for pitch deck slides.
 * Requires: frontend on http://localhost:3001, backend on http://localhost:8000
 *
 * Strategy:
 * 1. Go to judge page, run simulation to populate data
 * 2. Capture judge page (with data)
 * 3. Capture nurse page (with data)
 * 4. Capture patient page (with data)
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';
const OUT_DIR = path.join(__dirname, '..', 'slide-deck', 'public', 'app-shots');

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // ── Step 1: Run simulation on judge page ─────────────────────────
  console.log('Step 1: Running simulation on judge page...');
  const judgePage = await browser.newPage();
  await judgePage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  try {
    await judgePage.goto(`${BASE_URL}/judge`, { waitUntil: 'networkidle0', timeout: 30000 });
  } catch (e) {
    console.log('  (networkidle0 timeout, continuing)');
  }
  await new Promise(r => setTimeout(r, 3000));

  // Click "Run Full Simulation" button
  try {
    const simBtn = await judgePage.$('button');
    const buttons = await judgePage.$$('button');
    for (const btn of buttons) {
      const text = await judgePage.evaluate(el => el.textContent, btn);
      if (text && text.includes('Run Full Simulation')) {
        console.log('  Clicking "Run Full Simulation"...');
        await btn.click();
        break;
      }
    }
    // Wait for simulation to complete (it takes a few seconds)
    await new Promise(r => setTimeout(r, 8000));
    console.log('  Simulation complete');
  } catch (e) {
    console.log('  Could not find simulation button, proceeding:', e.message);
  }

  // ── Step 2: Capture judge page views ──────────────────────────────
  console.log('\nCapturing judge views...');

  // Judge overview (post-simulation)
  await judgePage.screenshot({ path: path.join(OUT_DIR, 'judge-overview.png'), fullPage: false });
  console.log('  ✓ judge-overview.png');

  // Scroll down for more content
  await judgePage.evaluate(() => window.scrollBy(0, 600));
  await new Promise(r => setTimeout(r, 1000));
  await judgePage.screenshot({ path: path.join(OUT_DIR, 'judge-details.png'), fullPage: false });
  console.log('  ✓ judge-details.png');

  // Full page
  await judgePage.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await judgePage.screenshot({ path: path.join(OUT_DIR, 'judge-full.png'), fullPage: true });
  console.log('  ✓ judge-full.png');

  // Click on different tabs if they exist
  const tabs = await judgePage.$$('[role="tab"], button[data-state], nav button, nav a');
  const tabNames = [];
  for (const tab of tabs) {
    const text = await judgePage.evaluate(el => el.textContent.trim(), tab);
    tabNames.push(text);
  }
  console.log('  Found tabs:', tabNames.join(', '));

  // Try clicking "Nurse View" tab
  for (const tab of tabs) {
    const text = await judgePage.evaluate(el => el.textContent.trim(), tab);
    if (text.includes('Nurse')) {
      await tab.click();
      await new Promise(r => setTimeout(r, 3000));
      await judgePage.screenshot({ path: path.join(OUT_DIR, 'judge-nurse-view.png'), fullPage: false });
      console.log('  ✓ judge-nurse-view.png');
      break;
    }
  }

  // Try clicking "AI Intelligence" tab
  for (const tab of tabs) {
    const text = await judgePage.evaluate(el => el.textContent.trim(), tab);
    if (text.includes('Intelligence') || text.includes('AI')) {
      await tab.click();
      await new Promise(r => setTimeout(r, 3000));
      await judgePage.screenshot({ path: path.join(OUT_DIR, 'judge-ai-intel.png'), fullPage: false });
      console.log('  ✓ judge-ai-intel.png');
      break;
    }
  }

  // Try clicking "Patient View" tab
  for (const tab of tabs) {
    const text = await judgePage.evaluate(el => el.textContent.trim(), tab);
    if (text.includes('Patient')) {
      await tab.click();
      await new Promise(r => setTimeout(r, 3000));
      await judgePage.screenshot({ path: path.join(OUT_DIR, 'judge-patient-view.png'), fullPage: false });
      console.log('  ✓ judge-patient-view.png');
      break;
    }
  }

  await judgePage.close();

  // ── Step 3: Capture nurse dashboard ───────────────────────────────
  console.log('\nCapturing nurse dashboard...');
  const nursePage = await browser.newPage();
  await nursePage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  try {
    await nursePage.goto(`${BASE_URL}/nurse`, { waitUntil: 'networkidle0', timeout: 30000 });
  } catch (e) {
    console.log('  (networkidle0 timeout)');
  }
  await new Promise(r => setTimeout(r, 5000));

  await nursePage.screenshot({ path: path.join(OUT_DIR, 'nurse-hero.png'), fullPage: false });
  console.log('  ✓ nurse-hero.png');

  await nursePage.screenshot({ path: path.join(OUT_DIR, 'nurse-full.png'), fullPage: true });
  console.log('  ✓ nurse-full.png');

  // Scroll to see charts/heatmap area
  await nursePage.evaluate(() => window.scrollBy(0, 500));
  await new Promise(r => setTimeout(r, 1000));
  await nursePage.screenshot({ path: path.join(OUT_DIR, 'nurse-charts.png'), fullPage: false });
  console.log('  ✓ nurse-charts.png');

  await nursePage.close();

  // ── Step 4: Capture patient dashboard (mobile) ────────────────────
  console.log('\nCapturing patient dashboard...');
  const patientPage = await browser.newPage();
  await patientPage.setViewport({ width: 430, height: 932, deviceScaleFactor: 3 });

  try {
    await patientPage.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
  } catch (e) {
    console.log('  (networkidle0 timeout)');
  }
  await new Promise(r => setTimeout(r, 5000));

  await patientPage.screenshot({ path: path.join(OUT_DIR, 'patient-hero.png'), fullPage: false });
  console.log('  ✓ patient-hero.png');

  await patientPage.screenshot({ path: path.join(OUT_DIR, 'patient-full.png'), fullPage: true });
  console.log('  ✓ patient-full.png');

  // Scroll to chat area
  await patientPage.evaluate(() => window.scrollBy(0, 600));
  await new Promise(r => setTimeout(r, 1000));
  await patientPage.screenshot({ path: path.join(OUT_DIR, 'patient-chat.png'), fullPage: false });
  console.log('  ✓ patient-chat.png');

  // Wider patient view (tablet-like, for slides)
  await patientPage.close();
  const patientWide = await browser.newPage();
  await patientWide.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
  try {
    await patientWide.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
  } catch (e) {}
  await new Promise(r => setTimeout(r, 5000));
  await patientWide.screenshot({ path: path.join(OUT_DIR, 'patient-tablet.png'), fullPage: false });
  console.log('  ✓ patient-tablet.png');
  await patientWide.close();

  await browser.close();

  const files = fs.readdirSync(OUT_DIR);
  console.log(`\nDone! ${files.length} screenshots saved to ${OUT_DIR}`);
  files.forEach(f => {
    const stats = fs.statSync(path.join(OUT_DIR, f));
    console.log(`  ${f} (${Math.round(stats.size/1024)}KB)`);
  });
})();
