import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const OUT = path.join(__dirname, 'screenshots', 'all-steps');

async function main() {
    fs.mkdirSync(OUT, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('http://localhost:3000/judge', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);

    for (let i = 0; i <= 26; i++) {
        await page.screenshot({ path: path.join(OUT, `step-${String(i).padStart(2, '0')}.png`) });
        console.log(`Step ${i} captured`);

        // If there's an action button that's not disabled, click it
        const actionBtns = [
            page.locator('button:has-text("Inject Days")'),
            page.locator('button:has-text("Inject Recovery")'),
            page.locator('button:has-text("Translate with")'),
            page.locator('button:has-text("Send Live")'),
            page.locator('button:has-text("Load Caregiver")'),
            page.locator('button:has-text("Load Live")'),
        ];
        for (const btn of actionBtns) {
            if (await btn.isVisible({ timeout: 200 }).catch(() => false)) {
                if (!(await btn.isDisabled().catch(() => true))) {
                    await btn.click();
                    await page.waitForTimeout(35000);
                    await page.screenshot({ path: path.join(OUT, `step-${String(i).padStart(2, '0')}-after-action.png`) });
                    break;
                }
            }
        }

        // Click Next
        const nextBtn = page.locator('button:has-text("Next")');
        if (await nextBtn.isVisible({ timeout: 500 }).catch(() => false)) {
            if (!(await nextBtn.isDisabled().catch(() => true))) {
                await nextBtn.click();
                await page.waitForTimeout(1200);
            } else {
                // Next is disabled — check for Skip
                const skipBtn = page.locator('button:has-text("Skip")');
                if (await skipBtn.isVisible({ timeout: 300 }).catch(() => false)) {
                    await skipBtn.click();
                    await page.waitForTimeout(500);
                    await nextBtn.click();
                    await page.waitForTimeout(1200);
                } else {
                    console.log(`Step ${i}: Next disabled, no skip available`);
                    break;
                }
            }
        } else {
            // Last step — click "Explore Freely"
            const exploreBtn = page.locator('button:has-text("Explore")');
            if (await exploreBtn.isVisible({ timeout: 300 }).catch(() => false)) {
                console.log(`Step ${i}: Last step (Explore Freely)`);
            }
            break;
        }
    }

    await browser.close();
    console.log(`Done — ${fs.readdirSync(OUT).length} screenshots in ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
