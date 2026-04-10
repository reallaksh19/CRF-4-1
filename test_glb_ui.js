const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  // Navigate to local index
  await page.goto(`file://${path.resolve(__dirname, 'viewer/index.html')}`);

  // Wait for load
  await page.waitForTimeout(1000);

  const glbTabBtn = page.locator('button.tab-btn:has-text("GLB Export")');
  if (await glbTabBtn.count() > 0) {
    await glbTabBtn.click();
    console.log("Navigated to GLB Export Tab");
    await page.waitForTimeout(1000);

    // Check if new layout elements exist
    const fileInput = await page.locator('#pcf-file-input').count();
    const btnRun = await page.locator('#btn-run-pipeline').count();
    const previewContainer = await page.locator('#preview-container').count();

    if (fileInput > 0 && btnRun > 0 && previewContainer > 0) {
        console.log("GLB Export UI detected successfully.");
    } else {
        console.log("GLB UI missing regions", {fileInput, btnRun, previewContainer});
    }

  } else {
      console.log("GLB Export tab not found");
  }

  await browser.close();
})();
