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

    // Upload the file using correct playwright v1 method
    const fileInput = await page.$('#pcf-file-input');
    await fileInput.setInputFiles('/home/jules/verification/STEAM_SISO.pcf');
    await page.waitForTimeout(500);

    // Run the pipeline
    await page.locator('#btn-run-pipeline').click();

    // Wait for the ready state or a failed state
    await page.waitForFunction(() => {
        const el = document.getElementById('pipeline-status');
        return el && (el.innerText.includes('Ready') || el.innerText.includes('Failed'));
    }, { timeout: 15000 });

    const status = await page.$eval('#pipeline-status', el => el.innerText);
    console.log("Final status:", status);

    const logs = await page.$eval('#pipeline-logs', el => el.innerText);
    console.log("Logs output:");
    console.log(logs);

  } else {
      console.log("GLB Export tab not found");
  }

  await browser.close();
})();
