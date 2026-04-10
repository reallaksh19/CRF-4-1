const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  await page.goto(`file://${path.resolve(__dirname, 'viewer/index.html')}`);
  await page.waitForTimeout(1000);

  const glbTabBtn = page.locator('button.tab-btn:has-text("GLB Export")');
  await glbTabBtn.click();
  await page.waitForTimeout(1000);

  const fileInput = await page.$('#pcf-file-input');
  await fileInput.setInputFiles('/home/jules/verification/STEAM_SISO.pcf');
  await page.waitForTimeout(500);

  await page.locator('#btn-run-pipeline').click();

  await page.waitForFunction(() => {
      const el = document.getElementById('pipeline-status');
      return el && (el.innerText.includes('Ready') || el.innerText.includes('Failed'));
  }, { timeout: 15000 });

  // take screenshot of preview container
  const box = await page.locator('#preview-container').boundingBox();
  await page.screenshot({ path: '/home/jules/verification/preview_after_fix.png', clip: box });
  console.log("Screenshot taken of preview container");

  await browser.close();
})();
