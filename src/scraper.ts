import puppeteer from 'puppeteer-core';

const EXEC_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';
const MAX_SCROLLS = 30;

/**
 * Recursively extracts every `screen_name` value from X's deeply nested
 * GraphQL response objects. Handles arbitrary nesting depth.
 */
function extractScreenNames(obj: unknown): string[] {
  const names: string[] = [];

  if (obj === null || obj === undefined) return names;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      names.push(...extractScreenNames(item));
    }
    return names;
  }

  if (typeof obj === 'object') {
    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (key === 'screen_name' && typeof record[key] === 'string') {
        names.push(record[key] as string);
      } else {
        names.push(...extractScreenNames(record[key]));
      }
    }
  }

  return names;
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildApiFilter(mode: 'likes' | 'reposts'): string {
  return mode === 'likes' ? '/Favoriters' : '/Retweeters';
}

function buildTabPath(mode: 'likes' | 'reposts'): string {
  return mode === 'likes' ? '/likes' : '/retweets';
}

async function setCookiesAndHeaders(
  page: puppeteer.Page,
  authToken: string,
  ct0: string
): Promise<void> {
  await page.setCookie(
    { name: 'auth_token', value: authToken, domain: '.x.com' },
    { name: 'ct0', value: ct0, domain: '.x.com' }
  );
  await page.setExtraHTTPHeaders({ 'x-csrf-token': ct0 });
}

async function scrollToCollect(page: puppeteer.Page): Promise<void> {
  for (let i = 0; i < MAX_SCROLLS; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await randomDelay(1000, 2000);
  }
}

/**
 * Scrapes participant usernames from a tweet's likes or reposts tab
 * by intercepting X's GraphQL API responses.
 */
export async function scrapeTweet(
  tweetId: string,
  mode: 'likes' | 'reposts'
): Promise<string[]> {
  const authToken = process.env.X_AUTH_TOKEN || '';
  const ct0 = process.env.X_CT0 || '';
  const usernames = new Set<string>();
  const apiFilter = buildApiFilter(mode);

  let browser: puppeteer.Browser | null = null;

  try {
    browser = await puppeteer.launch({
      executablePath: EXEC_PATH,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await setCookiesAndHeaders(page, authToken, ct0);

    // Intercept GraphQL responses to extract screen_names
    page.on('response', async (response) => {
      const url = response.url();
      if (!url.includes(apiFilter)) return;

      try {
        const json = await response.json();
        const names = extractScreenNames(json);
        for (const name of names) usernames.add(name);
      } catch {
        // Non-JSON or failed parse — safe to ignore
      }
    });

    // Navigate to the tweet to resolve the full URL path
    await page.goto(`https://x.com/i/status/${tweetId}`, {
      waitUntil: 'networkidle2',
    });

    const resolvedUrl = page.url();
    const tabUrl = `${resolvedUrl}${buildTabPath(mode)}`;

    await page.goto(tabUrl, { waitUntil: 'networkidle2' });
    await scrollToCollect(page);

    return Array.from(usernames);
  } catch (error) {
    console.error(`[scraper] Failed to scrape ${mode} for tweet ${tweetId}:`, error);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}
