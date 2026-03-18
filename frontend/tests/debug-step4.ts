import { chromium } from 'playwright';
import * as path from 'path';

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('http://localhost:3000/judge', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Navigate to step 4 (click Next 4 times)
    for (let i = 0; i < 4; i++) {
        const next = page.locator('button:has-text("Next")');
        await next.click();
        await page.waitForTimeout(1000);
    }

    console.log('At step 4. Looking for action button...');

    // List all visible buttons
    const allButtons = page.locator('button');
    const count = await allButtons.count();
    for (let i = 0; i < count; i++) {
        const btn = allButtons.nth(i);
        const text = await btn.textContent().catch(() => '');
        const visible = await btn.isVisible().catch(() => false);
        const disabled = await btn.isDisabled().catch(() => false);
        if (visible && text && text.trim().length > 0) {
            console.log(`  Button: "${text.trim().slice(0, 50)}" | disabled=${disabled}`);
        }
    }

    // Click the Translate button
    const translateBtn = page.locator('button:has-text("Translate with SEA-LION")');
    const isVis = await translateBtn.isVisible().catch(() => false);
    console.log(`\nTranslate button visible: ${isVis}`);
    if (isVis) {
        console.log('Clicking Translate...');
        await translateBtn.click();
        console.log('Clicked. Waiting 10s...');
        await page.waitForTimeout(10000);

        // Check Next button state
        const nextBtn = page.locator('button:has-text("Next")');
        const nextDisabled = await nextBtn.isDisabled().catch(() => true);
        console.log(`Next button disabled: ${nextDisabled}`);

        // Check for skip button
        const skipBtn = page.locator('button:has-text("Skip")');
        const skipVis = await skipBtn.isVisible().catch(() => false);
        console.log(`Skip button visible: ${skipVis}`);

        // Check for error message
        const errorMsg = page.locator('text=Pipeline encountered');
        const errorVis = await errorMsg.isVisible().catch(() => false);
        console.log(`Error message visible: ${errorVis}`);

        // Check for "Complete" text
        const completeMsg = page.locator('text=Complete');
        const completeVis = await completeMsg.isVisible().catch(() => false);
        console.log(`Complete message visible: ${completeVis}`);

        await page.screenshot({ path: path.join(__dirname, 'screenshots', 'debug-step4-after.png') });
    }

    await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
