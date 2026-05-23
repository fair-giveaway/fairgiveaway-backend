import type { Browser, Page, HTTPResponse } from 'puppeteer-core';
import { ScrapeResult } from './types';
import { extractScreenNames, buildApiFilter, buildTabPath } from './utils';
import { launchBrowser, setCookiesAndHeaders, blockHeavyAssets, scrollToCollect } from './browser';

interface ScrapeContext {
  hostUsername: string;
  hostAvatarUrl: string | undefined;
  usernames: Set<string>;
}

function setupInterception(page: Page, apiFilter: string, ctx: ScrapeContext): void {
  page.on('response', async (response: HTTPResponse) => {
    const url = response.url();
    if (url.includes(apiFilter)) {
      try {
        const json = await response.json();
        const names = extractScreenNames(json);
        for (const name of names) ctx.usernames.add(name);
      } catch {}
    } else if (url.includes('TweetDetail') || url.includes('TweetResultByRestId')) {
      try {
        const text = await response.text();
        const match = text.match(/"profile_image_url_https":"(https:\/\/pbs\.twimg\.com\/profile_images\/[^"]+)"/);
        if (match && match[1]) {
          ctx.hostAvatarUrl = match[1].replace('_normal', '_400x400');
        }
      } catch {}
    }
  });
}

async function extractHostAvatarFallback(page: Page, hostUsername: string): Promise<string | undefined> {
  if (hostUsername === 'unknown') return undefined;
  
  try {
    await page.goto(`https://x.com/${hostUsername}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(`a[href$="/photo"] img[src*="profile_images"]`, { timeout: 4000 }).catch(() => {});
    const domAvatar = await page.evaluate(() => {
      const img = document.querySelector(`a[href$="/photo"] img[src*="profile_images"]`) || 
                  document.querySelector('img[src*="profile_images"]:not([src*="default_profile"])');
      return img ? img.getAttribute('src') : null;
    });
    
    if (domAvatar) {
      return domAvatar.replace('_normal', '_400x400');
    }
  } catch {}
  return undefined;
}

/**
 * Scrapes participant usernames from a tweet's likes or reposts tab
 * by intercepting X's GraphQL API responses.
 */
export async function scrapeTweet(
  tweetId: string,
  mode: 'likes' | 'reposts',
  clientHost?: string,
  customCookie?: { authToken: string; ct0: string }
): Promise<ScrapeResult> {
  const authToken = customCookie?.authToken || process.env.X_AUTH_TOKEN || '';
  const ct0 = customCookie?.ct0 || process.env.X_CT0 || '';
  const ctx: ScrapeContext = { hostUsername: clientHost || 'unknown', hostAvatarUrl: undefined, usernames: new Set() };
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await setCookiesAndHeaders(page, authToken, ct0);
    await blockHeavyAssets(page);
    
    setupInterception(page, buildApiFilter(mode), ctx);

    const tabUrl = `https://x.com/i/status/${tweetId}${buildTabPath(mode)}`;
    await page.goto(tabUrl, { waitUntil: 'domcontentloaded' });
    
    try { await page.waitForSelector('main', { timeout: 10000 }); } catch {}

    try {
      const pathParts = new URL(page.url()).pathname.split('/');
      if (pathParts.length > 1 && pathParts[1] !== 'i') ctx.hostUsername = pathParts[1];
    } catch {}

    await scrollToCollect(page);

    if (ctx.hostUsername !== 'unknown' && !ctx.hostAvatarUrl) {
      ctx.hostAvatarUrl = await extractHostAvatarFallback(page, ctx.hostUsername);
    }

    return { participants: Array.from(ctx.usernames), hostUsername: ctx.hostUsername, hostAvatarUrl: ctx.hostAvatarUrl };
  } catch (error) {
    console.error(`[scraper] Failed to scrape ${mode} for tweet ${tweetId}:`, error);
    return { participants: [], hostUsername: 'unknown' };
  } finally {
    if (browser) await browser.close();
  }
}
