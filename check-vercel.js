const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  console.log('Navigating to https://monetarz.vercel.app...');
  await page.goto('https://monetarz.vercel.app', { waitUntil: 'networkidle0' });
  
  console.log('Done.');
  await browser.close();
})();
