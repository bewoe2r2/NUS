import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const OUT = path.join(__dirname, 'screenshots', 'steps');

async function main() {
    fs.mkdirSync(OUT, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto('http://localhost:3000/judge', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Screenshot every step from 0 to 10
    for (let i = 0; i <= 10; i++) {
        await page.screenshot({ path: path.join(OUT, `step-${String(i).padStart(2, '0')}.png`) });
        console.log(`Step ${i} captured`);

        // Click Next if available
        const nextBtn = page.locator('button:has-text("Next")');
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            // If there's an action button, click it first
            const actionBtn = page.locator('button:has-text("Inject"), button:has-text("Translate"), button:has-text("Send Live"), button:has-text("Load ")');
            if (await actionBtn.first().isVisible({ timeout: 500 }).catch(() => false)) {
                const btn = actionBtn.first();
                if (!(await btn.isDisabled())) {
                    await btn.click();
                    await page.waitForTimeout(3000);
                    await page.screenshot({ path: path.join(OUT, `step-${String(i).padStart(2, '0')}-action.png`) });
                }
            }

            await nextBtn.click();
            await page.waitForTimeout(1500);
        } else {
            console.log('No Next button found, stopping');
            break;
        }
    }

    await browser.close();
    console.log(`Done — screenshots in ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
