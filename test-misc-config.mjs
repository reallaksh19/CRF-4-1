import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  // Go directly to viewer/index.html
  await page.goto(`file://${path.resolve(process.cwd(), 'viewer/index.html')}`);

  await page.waitForTimeout(1000);

  // Switch to config tab
  const tabBtn = page.locator('button.tab-btn:has-text("CONFIG")');
  await tabBtn.click();

  // Wait for config tab content
  await page.waitForSelector('#cfg-caesar-match-attr');

  // Set CAESAR match attribute
  await page.fill('#cfg-caesar-match-attr', 'testCustomAttr');

  // Setup listener for alert to accept it automatically
  page.on('dialog', dialog => dialog.accept());

  await page.click('#save-match-attr-btn');

  // Wait a bit to ensure it saved
  await page.waitForTimeout(500);

  // Check localstorage via page.evaluate
  const attr = await page.evaluate(() => window.localStorage.getItem('caesarMatchAttribute'));
  console.log('Saved attribute:', attr);

  if (attr !== 'testCustomAttr') {
      console.error('Failed to save config attribute');
      process.exit(1);
  }

  console.log('Test passed.');
  await browser.close();
})();
