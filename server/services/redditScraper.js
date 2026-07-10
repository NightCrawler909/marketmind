import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

/**
 * Real Reddit scraper using multiple strategies:
 * 1. Try old.reddit.com with realistic headers
 * 2. Fall back to DuckDuckGo HTML scraping (no CAPTCHA unlike Google)
 * 3. Fall back to Puppeteer-based DuckDuckGo scraping
 * 2. Fall back to DuckDuckGo via Puppeteer
 * 3. Fall back to DuckDuckGo HTML scraping
 */
export async function scrapeReddit(query, limit = 30) {
  // Strategy 1: old.reddit.com
  const oldRedditResults = await scrapeOldReddit(query, limit);
  if (oldRedditResults.length > 0) return oldRedditResults;

  console.log('Reddit: old.reddit.com failed. Trying DuckDuckGo via Puppeteer...');

  // Strategy 2: DuckDuckGo with Puppeteer (renders JS and infinite scrolls for 30+ results)
  const ddgPuppeteerResults = await scrapeDuckDuckGoPuppeteer(query, limit);
  if (ddgPuppeteerResults.length > 0) return ddgPuppeteerResults;

  console.log('Reddit: DuckDuckGo Puppeteer failed. Trying DuckDuckGo HTML fallback...');

  // Strategy 3: DuckDuckGo HTML (no CAPTCHA, but limited to ~10 results on first page)
  const ddgResults = await scrapeDuckDuckGoHtml(query, limit);
  if (ddgResults.length > 0) return ddgResults;

  console.log('Reddit: All strategies failed. Returning empty.');
  return [];
}

/**
 * Strategy 1: old.reddit.com HTML scraping
 */
async function scrapeOldReddit(query, limit) {
  try {
    const url = `https://old.reddit.com/search?q=${encodeURIComponent(query + ' review')}&sort=relevance&t=all&limit=${limit}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    const reviews = [];

    // old.reddit.com uses .thing for each post
    $('div.thing, .search-result').each((i, el) => {
      if (reviews.length >= limit) return;
      const $el = $(el);

      const title = $el.find('a.title, a.search-title, a.search-link').first().text().trim();
      const snippet = $el.find('.search-result-body, .expando .md, .entry .md').first().text().trim();
      const subreddit = $el.attr('data-subreddit') || $el.find('.subreddit, .search-subreddit-link').first().text().trim();
      const scoreText = $el.find('.score.unvoted, .search-score').first().attr('title') || $el.find('.score').first().text();
      const scoreMatch = (scoreText || '').match(/([\d,]+)/);
      const score = scoreMatch ? parseInt(scoreMatch[1].replace(',', '')) : 0;

      const text = [title, snippet].filter(Boolean).join('. ');
      if (!text || text.length < 15) return;

      reviews.push({
        platform: 'REDDIT',
        rawText: text,
        metadata: { upvotes: score, subreddit: subreddit ? `r/${subreddit.replace(/^r\//, '')}` : '' },
      });
    });

    console.log(`Reddit (old.reddit.com): Extracted ${reviews.length} results.`);
    return reviews;
  } catch (error) {
    console.error('Reddit old.reddit.com scrape failed:', error.message);
    return [];
  }
}

/**
 * Strategy 2: DuckDuckGo HTML scraping (no CAPTCHA)
 * Searches for: site:reddit.com {query} review
 */
async function scrapeDuckDuckGoHtml(query, limit) {
  try {
    const searchQuery = `site:reddit.com ${query} review`;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const reviews = [];

    // DuckDuckGo HTML version uses .result for each search result
    $('.result, .web-result').each((i, el) => {
      if (reviews.length >= limit) return;
      const $el = $(el);

      const title = $el.find('.result__title, .result__a, h2 a').first().text().trim();
      const snippet = $el.find('.result__snippet, .result__body').first().text().trim();
      const link = $el.find('.result__url, .result__extras__url').first().text().trim()
        || $el.find('a').first().attr('href') || '';

      // Only include Reddit results
      if (!link.includes('reddit.com') && !title.toLowerCase().includes('reddit')) return;

      const subredditMatch = link.match(/reddit\.com\/r\/([^/]+)/);
      const subreddit = subredditMatch ? `r/${subredditMatch[1]}` : '';

      const text = [title, snippet].filter(Boolean).join('. ');
      if (!text || text.length < 15) return;

      reviews.push({
        platform: 'REDDIT',
        rawText: text,
        metadata: { upvotes: 0, subreddit },
      });
    });

    console.log(`Reddit (DuckDuckGo HTML): Extracted ${reviews.length} results.`);
    return reviews;
  } catch (error) {
    console.error('Reddit DuckDuckGo HTML scrape failed:', error.message);
    return [];
  }
}

/**
 * Strategy 3: DuckDuckGo via Puppeteer (JS-rendered version)
 */
async function scrapeDuckDuckGoPuppeteer(query, limit) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    );

    const searchQuery = `site:reddit.com ${query} review`;
    await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    
    // Auto-scroll to load more than the first 10 results (infinite scroll)
    console.log('Reddit: Scrolling DuckDuckGo to load more results...');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 800;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= 12000) { // Scroll deep enough to get ~30-50 results
            clearInterval(timer);
            resolve();
          }
        }, 300);
      });
    });
    await new Promise(r => setTimeout(r, 2000));

    const reviews = await page.evaluate((max) => {
      const results = [];
      // DuckDuckGo JS version uses article[data-nrn] or li[data-layout]
      const containers = document.querySelectorAll(
        'article[data-nrn], li[data-layout="organic"], .react-results--main ol li'
      );

      for (const c of containers) {
        if (results.length >= max) break;

        const titleEl = c.querySelector('h2 a span, h2 a, [data-testid="result-title-a"] span');
        const snippetEl = c.querySelector('[data-result="snippet"], .OvQOHe, span[class]');
        const linkEl = c.querySelector('a[href*="reddit.com"]') || c.querySelector('a');

        const title = titleEl?.innerText?.trim() || '';
        const snippet = snippetEl?.innerText?.trim() || '';
        const link = linkEl?.href || '';

        if (!link.includes('reddit.com')) continue;

        const subredditMatch = link.match(/reddit\.com\/r\/([^/]+)/);
        const subreddit = subredditMatch ? `r/${subredditMatch[1]}` : '';

        const text = [title, snippet].filter(Boolean).join('. ');
        if (!text || text.length < 15) continue;

        results.push({
          platform: 'REDDIT',
          rawText: text,
          metadata: { upvotes: 0, subreddit },
        });
      }

      return results;
    }, limit);

    console.log(`Reddit (DuckDuckGo Puppeteer): Extracted ${reviews.length} results.`);
    return reviews;
  } catch (error) {
    console.error('Reddit DuckDuckGo Puppeteer scrape failed:', error.message);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}
