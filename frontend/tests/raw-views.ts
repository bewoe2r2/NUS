import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const OUT = path.join(__dirname, 'screenshots', 'raw');

async function main() {
    fs.mkdirSync(OUT, { recursive: true });
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('http://localhost:3000/judge', { waitUntil: 'networkidle', timeout: 30000 });

    // Close walkthrough immediately
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // 1. Overview
    const tabs = ['Overview', 'Patient View', 'Nurse View', 'Caregiver', 'AI Intelligence', 'Tool Demo'];
    for (let i = 0; i < tabs.length; i++) {
        const tab = page.locator(`button:has-text("${tabs[i]}")`).first();
        if (await tab.isVisible()) await tab.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(OUT, `${i + 1}-${tabs[i].toLowerCase().replace(/\s+/g, '-')}.png`) });
        console.log(`${i + 1}. ${tabs[i]} captured`);

        // For patient view, scroll down to see more
        if (tabs[i] === 'Patient View') {
            const phoneDiv = page.locator('[class*="rounded-[40px]"]').first();
            if (await phoneDiv.isVisible()) {
                await phoneDiv.evaluate(el => el.scrollTo(0, 400));
                await page.waitForTimeout(500);
                await page.screenshot({ path: path.join(OUT, `${i + 1}b-patient-scrolled.png`) });
                console.log(`${i + 1}b. Patient scrolled captured`);
                await phoneDiv.evaluate(el => el.scrollTo(0, 1200));
                await page.waitForTimeout(500);
                await page.screenshot({ path: path.join(OUT, `${i + 1}c-patient-chat.png`) });
                console.log(`${i + 1}c. Patient chat captured`);
            }
        }
    }

    await browser.close();
    console.log(`Done — ${fs.readdirSync(OUT).length} screenshots`);
}
main().catch(e => { console.error(e); process.exit(1); });
