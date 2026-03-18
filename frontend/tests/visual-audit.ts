import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE = 'http://localhost:3000';
const OUT = path.join(__dirname, 'screenshots');

async function main() {
    fs.mkdirSync(OUT, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await ctx.newPage();

    console.log('1/8 — Judge page (overview, walkthrough auto-open)...');
    await page.goto(`${BASE}/judge`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT, '01-judge-walkthrough-step0.png'), fullPage: false });

    // Click Next to go to step 1 (Patient View)
    console.log('2/8 — Walkthrough step 1 (Patient View)...');
    const nextBtn = page.locator('button:has-text("Next")');
    if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(OUT, '02-walkthrough-step1-patient.png'), fullPage: false });
    }

    // Close walkthrough to see clean overview
    console.log('3/8 — Close walkthrough, overview tab...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    // Switch to overview tab
    const overviewTab = page.locator('button:has-text("Overview")');
    if (await overviewTab.isVisible()) await overviewTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT, '03-overview-empty.png'), fullPage: false });

    // Patient tab
    console.log('4/8 — Patient View tab (phone container)...');
    const patientTab = page.locator('button:has-text("Patient View")');
    if (await patientTab.isVisible()) await patientTab.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, '04-patient-view.png'), fullPage: false });

    // Nurse tab
    console.log('5/8 — Nurse View tab...');
    const nurseTab = page.locator('button:has-text("Nurse View")');
    if (await nurseTab.isVisible()) await nurseTab.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, '05-nurse-view.png'), fullPage: false });

    // Tool Demo tab
    console.log('6/8 — Tool Demo tab...');
    const toolTab = page.locator('button:has-text("Tool Demo")');
    if (await toolTab.isVisible()) await toolTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT, '06-tool-demo.png'), fullPage: false });

    // Intelligence tab
    console.log('7/8 — AI Intelligence tab...');
    const intelTab = page.locator('button:has-text("AI Intelligence")');
    if (await intelTab.isVisible()) await intelTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT, '07-intelligence.png'), fullPage: false });

    // Caregiver tab
    console.log('8/8 — Caregiver tab...');
    const caregiverTab = page.locator('button:has-text("Caregiver")').first();
    if (await caregiverTab.isVisible()) await caregiverTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT, '08-caregiver.png'), fullPage: false });

    await browser.close();
    console.log(`\nDone — ${fs.readdirSync(OUT).length} screenshots saved to ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
