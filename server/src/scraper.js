// server/src/scraper.js - Full image extraction fallback chain
// Priority 1: og:image
// Priority 2: twitter:image
// Priority 3: Largest meaningful content image in HTML
// Priority 4: Puppeteer screenshot
// Priority 5: Branded SVG placeholder card with favicon

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import cache from './cache.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, '..', '..', 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// ─── Priority 5: SVG Branded Placeholder Card ─────────────────────────────────
function generateSvgPlaceholder(domain, favicon) {
  const safeDomain = (domain || 'External Link')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 40);

  // Pick a deterministic gradient based on domain
  const gradients = [
    ['#3B82F6', '#6366F1'], // blue → indigo
    ['#8B5CF6', '#EC4899'], // purple → pink
    ['#10B981', '#0EA5E9'], // emerald → sky
    ['#F59E0B', '#EF4444'], // amber → red
    ['#06B6D4', '#3B82F6'], // cyan → blue
  ];
  const gradientIndex = safeDomain.charCodeAt(0) % gradients.length;
  const [c1, c2] = gradients[gradientIndex];
  const initial = safeDomain.charAt(0).toUpperCase();

  const faviconEl = favicon
    ? `<image href="${favicon.replace(/&/g, '&amp;')}" x="362" y="148" width="76" height="76" clip-path="url(#faviconClip)"/>`
    : `<text x="400" y="210" font-family="Inter, system-ui, sans-serif" font-size="52" font-weight="900" fill="white" text-anchor="middle" opacity="0.9">${initial}</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09090B"/>
      <stop offset="100%" stop-color="#18181B"/>
    </linearGradient>
    <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="35%">
      <stop offset="0%" stop-color="${c1}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${c1}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="faviconClip">
      <circle cx="400" cy="186" r="38"/>
    </clipPath>
  </defs>
  <rect width="800" height="450" fill="url(#bg)"/>
  <rect width="800" height="450" fill="url(#glow)"/>
  <circle cx="400" cy="186" r="72" fill="none" stroke="url(#ring)" stroke-width="3" opacity="0.6"/>
  <circle cx="400" cy="186" r="56" fill="#09090B" stroke="#27272A" stroke-width="1.5"/>
  ${faviconEl}
  <text x="400" y="306" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">${safeDomain}</text>
  <text x="400" y="338" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="600" fill="${c1}" text-anchor="middle" letter-spacing="4">LINKPREVIEW PRO</text>
  <text x="400" y="360" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="400" fill="#52525B" text-anchor="middle">PREMIUM METADATA EXTRACTOR</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// ─── Priority 3: Largest Meaningful HTML Content Image ────────────────────────
function extractLargestPageImage(html, baseUrl) {
  try {
    const $ = cheerio.load(html);
    const base = new URL(baseUrl);
    const images = [];

    $('img').each((_, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
      if (!src || src.startsWith('data:')) return;

      // Resolve relative URLs
      try {
        if (!src.startsWith('http')) {
          src = src.startsWith('//')
            ? `${base.protocol}${src}`
            : src.startsWith('/')
            ? `${base.protocol}//${base.host}${src}`
            : `${base.protocol}//${base.host}/${src}`;
        }
      } catch { return; }

      // Skip junk images
      const isJunk = /pixel|1x1|spacer|spinner|loading|beacon|analytics|tracking|blank|transparent/i.test(src);
      if (isJunk) return;

      const alt = $(el).attr('alt') || '';
      const width = parseInt($(el).attr('width'), 10) || 0;
      const height = parseInt($(el).attr('height'), 10) || 0;

      // Score images — prefer large, content-like images
      let score = 0;
      if (width >= 400 && height >= 200) score += (width * height) / 10000;
      if (width >= 400) score += 50;
      if (height >= 200) score += 30;
      if (alt && alt.length > 5) score += 20;
      if (/icon|logo|avatar|sprite|thumb/i.test(src)) score -= 100;

      if (score > 0) images.push({ src, score });
    });

    images.sort((a, b) => b.score - a.score);
    return images.length > 0 ? images[0].src : null;
  } catch {
    return null;
  }
}

function findSystemBrowser() {
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google/Chrome/Application/chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google/Chrome/Application/chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Microsoft/Edge/Application/msedge.exe'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

const PUPPETEER_PROFILE_DIR = path.join(__dirname, '..', '..', 'puppeteer_profile');

// Ensure puppeteer profile directory exists
if (!fs.existsSync(PUPPETEER_PROFILE_DIR)) {
  fs.mkdirSync(PUPPETEER_PROFILE_DIR, { recursive: true });
}

// ─── Priority 4: Puppeteer Screenshot ─────────────────────────────────────────
async function captureScreenshot(targetUrl, domain) {
  // Check for a cached screenshot file on disk first
  const urlHash = crypto.createHash('md5').update(targetUrl).digest('hex');
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${urlHash}.jpg`);

  if (fs.existsSync(screenshotPath)) {
    console.log(`[Screenshot Cache] Serving cached screenshot for ${domain}`);
    const imgBuffer = fs.readFileSync(screenshotPath);
    return `data:image/jpeg;base64,${imgBuffer.toString('base64')}`;
  }

  const executablePath = findSystemBrowser();
  if (!executablePath) {
    console.warn('[Puppeteer] No system Chrome/Edge browser found — skipping screenshot capture.');
    return null;
  }

  try {
    console.log(`[Puppeteer] Launching headless browser (${executablePath}) for ${domain}...`);
    // Use dynamic import to gracefully handle if puppeteer-core isn't available
    const puppeteerModule = await import('puppeteer-core').catch(() => null);
    if (!puppeteerModule) {
      console.warn('[Puppeteer] puppeteer-core not available — skipping screenshot capture.');
      return null;
    }

    const puppeteer = puppeteerModule.default || puppeteerModule;
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        `--user-data-dir=${PUPPETEER_PROFILE_DIR}`,
        '--no-default-browser-check',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate with a timeout; use domcontentloaded for speed
    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    // Short wait for above-the-fold images to load
    await new Promise((r) => setTimeout(r, 1500));

    const screenshotBuffer = await page.screenshot({
      type: 'jpeg',
      quality: 82,
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });

    await browser.close();

    // Save to disk cache
    fs.writeFileSync(screenshotPath, screenshotBuffer);
    console.log(`[Puppeteer] Screenshot saved for ${domain}`);

    return `data:image/jpeg;base64,${screenshotBuffer.toString('base64')}`;
  } catch (err) {
    console.error(`[Puppeteer] Screenshot failed for ${domain}: ${err.message}`);
    return null;
  }
}

// ─── Resolve relative image URL ───────────────────────────────────────────────
function toAbsolute(src, baseUrl) {
  if (!src || src.startsWith('http') || src.startsWith('data:')) return src;
  try {
    const base = new URL(baseUrl);
    if (src.startsWith('//')) return `${base.protocol}${src}`;
    if (src.startsWith('/')) return `${base.protocol}//${base.host}${src}`;
    return `${base.protocol}//${base.host}/${src}`;
  } catch {
    return src;
  }
}

// ─── Main Scraper Export ───────────────────────────────────────────────────────
export async function scrapeMetadata(url) {
  let domain = 'external.com';
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    domain = url;
  }

  // Full-result cache check
  const cachedResult = cache.get(`meta:${url}`);
  if (cachedResult) {
    console.log(`[Cache Hit] Full metadata for ${domain}`);
    return cachedResult;
  }

  const controller = new AbortController();
  const fetchTimeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    clearTimeout(fetchTimeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const finalUrl = res.url || url; // Resolved URL after redirect
    const html = await res.text();
    const $ = cheerio.load(html);

    // ── Metadata helpers ──
    const og = (prop) =>
      $(`meta[property="og:${prop}"]`).attr('content') ||
      $(`meta[name="og:${prop}"]`).attr('content') ||
      '';
    const tw = (prop) => $(`meta[name="twitter:${prop}"]`).attr('content') || '';

    const title = og('title') || tw('title') || $('title').first().text().trim() || domain;
    const description =
      og('description') ||
      tw('description') ||
      $('meta[name="description"]').attr('content') ||
      '';
    const siteName = og('site_name') || domain;

    // ── Favicon resolution ──
    const rawFavicon =
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      $('link[rel="apple-touch-icon"]').attr('href') ||
      '/favicon.ico';
    const favicon = toAbsolute(rawFavicon, finalUrl);

    // ── Image extraction: Priority 1 → 2 → 3 → 4 → 5 ──
    let ogImage = null;

    // Priority 1: og:image
    const ogRaw = og('image');
    if (ogRaw) {
      ogImage = toAbsolute(ogRaw, finalUrl);
      console.log(`[Image P1] og:image found for ${domain}`);
    }

    // Priority 2: twitter:image
    if (!ogImage) {
      const twRaw = tw('image');
      if (twRaw) {
        ogImage = toAbsolute(twRaw, finalUrl);
        console.log(`[Image P2] twitter:image found for ${domain}`);
      }
    }

    // Priority 3: Largest meaningful content image
    if (!ogImage) {
      const htmlImg = extractLargestPageImage(html, finalUrl);
      if (htmlImg) {
        ogImage = htmlImg;
        console.log(`[Image P3] Largest content image for ${domain}: ${htmlImg.slice(0, 80)}`);
      }
    }

    // Priority 4: Puppeteer screenshot
    if (!ogImage) {
      const screenshot = await captureScreenshot(finalUrl, domain);
      if (screenshot) {
        ogImage = screenshot;
        console.log(`[Image P4] Puppeteer screenshot captured for ${domain}`);
      }
    }

    // Priority 5: Branded SVG placeholder (always succeeds)
    if (!ogImage) {
      ogImage = generateSvgPlaceholder(domain, favicon);
      console.log(`[Image P5] SVG placeholder generated for ${domain}`);
    }

    const result = {
      url: finalUrl,
      domain,
      title: title.slice(0, 300),
      description: description.slice(0, 1000),
      ogImage,
      favicon: favicon || null,
      siteName,
      status: 'Success',
    };

    // Cache the result
    cache.set(`meta:${url}`, result);
    return result;
  } catch (err) {
    clearTimeout(fetchTimeout);
    console.error(`[Scraper] Failed for ${domain}: ${err.message}`);

    const result = {
      url,
      domain,
      title: domain,
      description: 'Unable to extract metadata. The server may have refused the crawler request.',
      ogImage: generateSvgPlaceholder(domain, null),
      favicon: null,
      siteName: domain,
      status: err.name === 'AbortError' ? 'Timeout' : 'Error',
    };
    return result;
  }
}
