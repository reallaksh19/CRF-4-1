const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  await page.goto(`http://localhost:8000/viewer/index.html`);
  await page.waitForTimeout(1000);

  const miscTabBtn = page.locator('.tab-btn:has-text("MISC. CALC")');
  if (await miscTabBtn.count() > 0) {
    await miscTabBtn.click();
    console.log("Navigated to MISC. CALC Tab");
    await page.waitForTimeout(500);

    const fcTab = page.locator('.calc-nav-item[data-target="mc-flange-check"]');
    await fcTab.click();
    await page.waitForTimeout(500);

    const calcBtn = page.locator('#btn-calc-flangecheck');
    await calcBtn.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'verification/flangecheck-test.png', fullPage: true });
    console.log('Saved verification/flangecheck-test.png');
  } else {
    console.log("Misc Calc tab not found");
  }

  await browser.close();
})();
