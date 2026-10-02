const { chromium } = require('/workspace/StudioCar-AI/node_modules/@playwright/test');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    const home = await page.goto('http://localhost:3200/');
    const text = await page.locator('body').innerText();
    const quota = { finding: 'BUG-008', httpStatus: home.status(), workflowAdvertisesThree: text.includes('Free: 3 images'), pricingAdvertisesFive: text.includes('Maximum 5 images per batch') };
    await page.screenshot({ path: '/tmp/studiocar-razorpay-homepage.png', fullPage: true });
    const missing = await page.goto('http://localhost:3200/no-such-certification-route');
    const notFound = { finding: 'BUG-009', httpStatus: missing.status(), renderedText: await page.locator('body').innerText() };
    await page.screenshot({ path: '/tmp/studiocar-razorpay-not-found.png' });
    fs.writeFileSync('/tmp/studiocar-razorpay-public-inspection.json', JSON.stringify([quota, notFound], null, 2));
    console.log(JSON.stringify([quota, notFound], null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
