import { launchBrowser } from './src/scraper/browser';

async function run() {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  page.on('response', async (res) => {
    if (res.url().includes('UserByScreenName') || res.url().includes('UserByRestId')) {
      try {
        const json = await res.json();
        const legacy = json?.data?.user?.result?.legacy;
        console.log("Intercepted UserData legacy:", JSON.stringify(legacy, null, 2));
      } catch {}
    }
  });
  await page.goto('https://x.com/AbdulKhaann', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
}
run().catch(console.error);
