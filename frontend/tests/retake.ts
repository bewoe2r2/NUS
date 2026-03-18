import { chromium } from 'playwright';
import * as path from 'path';

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('http://localhost:3000/judge', { waitUntil: 'networkidle', timeout: 30000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const patientTab = page.locator('button:has-text("Patient View")');
    await patientTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(__dirname, 'screenshots', '04-patient-view-v2.png') });
    await browser.close();
    console.log('Done');
}
main().catch(e => { console.error(e); process.exit(1); });
