import type { Browser, Page, HTTPResponse } from "puppeteer-core";
import { ScrapeResult } from "./types";
import { extractScreenNames, buildApiFilter, buildTabPath } from "./utils";
import { launchBrowser, setCookiesAndHeaders, blockHeavyAssets, scrollToCollect } from "./browser";

interface ScrapeContext {
  hostUsername: string;
  hostAvatarUrl: string | undefined;
  usernames: Set<string>;
}

interface InterceptedData {
  url: string;
  headers: Record<string, string>;
  initialJson: unknown;
}

function setupInterception(page: Page, apiFilter: string, ctx: ScrapeContext, onIntercept: (data: InterceptedData) => void): void {
  let intercepted = false;
  page.on("response", async (response: HTTPResponse) => {
    const url = response.url();
    if (url.includes("TweetDetail") || url.includes("TweetResultByRestId")) {
      try {
        const text = await response.text();
        const avatarMatch = text.match(/"profile_image_url_https":"(https:\/\/pbs\.twimg\.com\/profile_images\/[^"]+)"/);
        if (avatarMatch && avatarMatch[1]) ctx.hostAvatarUrl = avatarMatch[1].replace("_normal", "_400x400");
      } catch {}
    }
    if (url.includes(apiFilter)) {
      try {
        const json = await response.json();
        const names = extractScreenNames(json);
        for (const name of names) ctx.usernames.add(name);
        if (!intercepted) {
          intercepted = true;
          const reqHeaders = response.request().headers();
          const allowedHeaders = ["authorization", "x-csrf-token", "x-twitter-active-user", "x-twitter-auth-type", "x-twitter-client-language"];
          const fetchHeaders: Record<string, string> = {};
          for (const [k, v] of Object.entries(reqHeaders)) {
            if (allowedHeaders.includes(k.toLowerCase())) fetchHeaders[k] = v;
          }
          onIntercept({ url, headers: fetchHeaders, initialJson: json });
        }
      } catch {}
    }
  });
}

async function extractHostAvatarFallback(page: Page, hostUsername: string): Promise<string | undefined> {
  if (hostUsername === "unknown") return undefined;
  try {
    await page.goto(`https://x.com/${hostUsername}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(`a[href$="/photo"] img[src*="profile_images"]`, { timeout: 4000 }).catch(() => {});
    const domAvatar = await page.evaluate(() => {
      const img = document.querySelector(`a[href$="/photo"] img[src*="profile_images"]`) || document.querySelector('img[src*="profile_images"]:not([src*="default_profile"])');
      return img ? img.getAttribute("src") : null;
    });
    if (domAvatar) return domAvatar.replace("_normal", "_400x400");
  } catch {}
  return undefined;
}

async function fetchAdditionalNames(page: Page, interceptedData: InterceptedData): Promise<string[]> {
  return await page.evaluate(async (url, hdrs, jsonStr) => {
    const names: string[] = [];
    function getCursor(o: unknown): string | null {
      if (!o || typeof o !== "object") return null;
      const rec = o as Record<string, unknown>;
      if (rec.cursorType === "Bottom" && rec.value) return rec.value as string;
      if (Array.isArray(o)) { for (const i of o) { const c = getCursor(i); if (c) return c; } return null; }
      for (const k in rec) { const c = getCursor(rec[k]); if (c) return c; }
      return null;
    }
    function extract(o: unknown) {
      const res: string[] = [];
      function recurse(obj: unknown) {
        if (!obj || typeof obj !== "object") return;
        if (Array.isArray(obj)) { for (const i of obj) recurse(i); return; }
        const r = obj as Record<string, unknown>;
        for (const k in r) { if (k === "screen_name" && typeof r[k] === "string") res.push(r[k] as string); else recurse(r[k]); }
      }
      recurse(o);
      return res;
    }
    let cur = getCursor(JSON.parse(jsonStr));
    const u = new URL(url);
    for (let i = 0; i < 300 && cur; i++) {
      const vStr = u.searchParams.get("variables");
      if (!vStr) break;
      const vars = JSON.parse(vStr);
      vars.cursor = cur;
      if (vars.count !== undefined) vars.count = 200;
      u.searchParams.set("variables", JSON.stringify(vars));
      try {
        const res = await fetch(u.toString(), { headers: hdrs as Record<string, string>, credentials: "include" });
        if (!res.ok) break;
        const json = await res.json();
        const n = extract(json);
        if (!n.length) break;
        names.push(...n);
        const nextCur = getCursor(json);
        if (!nextCur || nextCur === cur) break;
        cur = nextCur;
        await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));
      } catch { break; }
    }
    return names;
  }, interceptedData.url, interceptedData.headers, JSON.stringify(interceptedData.initialJson));
}

async function handlePageLoad(page: Page, tweetId: string, mode: "likes" | "reposts", ctx: ScrapeContext) {
  const tabUrl = `https://x.com/i/status/${tweetId}${buildTabPath(mode)}`;
  await page.goto(tabUrl, { waitUntil: "domcontentloaded" });
  try { await page.waitForSelector("main", { timeout: 10000 }); } catch {}
  try {
    const pathParts = new URL(page.url()).pathname.split("/");
    if (pathParts.length > 1 && pathParts[1] !== "i") ctx.hostUsername = pathParts[1];
  } catch {}
}

export async function scrapeTweet(tweetId: string, mode: "likes" | "reposts", clientHost?: string, customCookie?: { authToken: string; ct0: string }): Promise<ScrapeResult> {
  const authToken = customCookie?.authToken || process.env.X_AUTH_TOKEN || "";
  const ct0 = customCookie?.ct0 || process.env.X_CT0 || "";
  const ctx: ScrapeContext = { hostUsername: clientHost || "unknown", hostAvatarUrl: undefined, usernames: new Set() };
  let browser: Browser | null = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await setCookiesAndHeaders(page, authToken, ct0);
    await blockHeavyAssets(page);
    let interceptResolve: (data: InterceptedData | null) => void = () => {};
    const interceptPromise = new Promise<InterceptedData | null>((resolve) => { interceptResolve = resolve; });
    setupInterception(page, buildApiFilter(mode), ctx, interceptResolve);
    await handlePageLoad(page, tweetId, mode, ctx);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
    const interceptedData = await Promise.race([interceptPromise, timeoutPromise]);
    if (interceptedData) {
      const additionalNames = await fetchAdditionalNames(page, interceptedData);
      for (const name of additionalNames) ctx.usernames.add(name);
    } else {
      console.warn(`[scraper] Interception timed out for ${tweetId}. Falling back to scrolling.`);
      await scrollToCollect(page);
    }
    if (ctx.hostUsername !== "unknown" && !ctx.hostAvatarUrl) ctx.hostAvatarUrl = await extractHostAvatarFallback(page, ctx.hostUsername);
    return { participants: Array.from(ctx.usernames), hostUsername: ctx.hostUsername, hostAvatarUrl: ctx.hostAvatarUrl };
  } catch (error) {
    console.error(`[scraper] Failed to scrape ${mode} for tweet ${tweetId}:`, error);
    return { participants: [], hostUsername: "unknown" };
  } finally {
    if (browser) await browser.close();
  }
}
