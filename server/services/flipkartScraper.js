import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

/**
 * Real Flipkart review scraper.
 * Navigates to the product page and extracts reviews directly from it,
 * then tries the product-reviews URL if more are needed.
 */
export async function scrapeFlipkart(query, maxReviews = 20) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    );

    console.log(`Flipkart: Searching for "${query}"...`);

    // Step 1: Search
    await page.goto(
      `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
      { waitUntil: 'domcontentloaded', timeout: 30000 }
    );

    // Dismiss login popup
    await delay(1500);
    try {
      const closeBtn = await page.$('button._2KpZ6l._2doB4z, button[class*="close"], span[role="button"]');
      if (closeBtn) await closeBtn.click();
    } catch (e) {}

    await delay(1000 + Math.random() * 1000);

    // Step 2: Find first product link with /p/ pattern
    const productInfo = await page.evaluate(() => {
      const allLinks = document.querySelectorAll('a[href*="/p/"]');
      for (const link of allLinks) {
        const href = link.href || '';
        if (href.includes('flipkart.com') && href.includes('/p/')) {
          // Extract the product-reviews base path
          // Product URL: /product-name/p/itmXXXXX?pid=YYYYY
          return { href };
        }
      }
      return null;
    });

    if (!productInfo) {
      console.error('Flipkart: No product link found.');
      return [];
    }

    const fullUrl = productInfo.href.startsWith('http')
      ? productInfo.href
      : `https://www.flipkart.com${productInfo.href}`;

    console.log('Flipkart: Found product, navigating...');

    // Step 3: Go to product page
    await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(2000);

    // Step 4: Scroll down to load reviews
    await autoScroll(page);
    await delay(1500);

    // Step 5: Extract reviews from the product page directly
    let reviews = await extractFlipkartReviews(page, maxReviews);
    console.log(`Flipkart: Extracted ${reviews.length} reviews from product page.`);

    // Step 6: If not enough reviews, try the product-reviews URL
    if (reviews.length < 5) {
      // Build the product-reviews URL from the product URL
      // /product-name/p/itmXXXXX -> /product-name/product-reviews/itmXXXXX
      const currentUrl = page.url();
      const reviewsUrl = currentUrl.replace('/p/', '/product-reviews/');

      if (reviewsUrl !== currentUrl) {
        console.log('Flipkart: Trying product-reviews page...');
        await page.goto(reviewsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await delay(2000);

        // Check if we landed on a valid page (not 404)
        const is404 = await page.evaluate(() => {
          return document.body.innerText.includes('page you are looking for has been moved or deleted');
        });

        if (!is404) {
          await autoScroll(page);
          await delay(1000);
          const moreReviews = await extractFlipkartReviews(page, maxReviews - reviews.length);
          console.log(`Flipkart: Extracted ${moreReviews.length} additional reviews from reviews page.`);
          reviews.push(...moreReviews);
        } else {
          console.log('Flipkart: Product-reviews page returned 404, skipping.');
        }
      }
    }

    // Map to expected format
    return reviews.map((r) => ({
      platform: 'FLIPKART',
      rawText: r.title ? `${r.title}. ${r.text}` : r.text,
      sentimentScore: r.rating ? parseFloat(((r.rating - 3) / 2).toFixed(2)) : undefined,
      metadata: {
        verified: true,
        rating: r.rating,
      },
    }));
  } catch (error) {
    console.error('Flipkart scrape failed:', error.message);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Extract reviews from a Flipkart page (works on both product page and reviews page).
 * Uses a broad approach: find all substantial text blocks that look like reviews.
 */
async function extractFlipkartReviews(page, maxReviews) {
  return await page.evaluate((max) => {
    const results = [];
    const seen = new Set();

    // Strategy 1: Look for review containers using known class patterns
    // Flipkart uses obfuscated class names that change, so we try many
    const containerSelectors = [
      '.t-ZTKy',
      '.ZmyHeo',
      '._6K-7Co',
      'div._27M-vq',
      '.qwjRop div',
    ];

    for (const sel of containerSelectors) {
      if (results.length >= max) break;
      const elements = document.querySelectorAll(sel);
      for (const el of elements) {
        if (results.length >= max) break;
        const text = el.innerText?.trim();
        if (!text || text.length < 20 || seen.has(text)) continue;
        seen.add(text);

        // Try to find a rating near this element
        let rating = null;
        const parent = el.closest('div[class]');
        if (parent) {
          const ratingEl = parent.querySelector('._3LWZlK, .XQDdHH, [class*="rating"]');
          if (ratingEl) {
            const match = ratingEl.innerText?.match(/([\d.]+)/);
            if (match) rating = parseFloat(match[1]);
          }
        }

        results.push({ text, rating, title: '' });
      }
    }

    // Removed Strategy 2 (Heuristic fallback)
    // The previous heuristic grabbed ANY long text on the page, which resulted in pulling
    // SEO spam, ads, and product descriptions into the LLM context when actual reviews weren't found.
    // In AI pipelines, returning 0 reviews is always better than returning 20 pieces of pure noise.
    
    return results;
  }, maxReviews);
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight || totalHeight > 8000) {
          clearInterval(timer);
          resolve();
        }
      }, 150);
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
