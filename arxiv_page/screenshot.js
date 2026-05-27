import playwright from 'playwright';

(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/metrics', { waitUntil: 'networkidle' });

  // Wait for page to fully load
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: 'metrics-page.png', fullPage: true });

  console.log('Screenshot saved as metrics-page.png');
  await browser.close();
})();
