import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

puppeteer.use(StealthPlugin());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUERY = process.argv[2] || 'rasasi hawas';

async function debugAmazon() {
  console.log('\n=== DEBUGGING AMAZON ===');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');

  // Search
  const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(QUERY)}`;
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(__dirname, 'debug_amazon_search.png'), fullPage: false });
  console.log('Saved: debug_amazon_search.png');

  // Find product link
  const productLink = await page.evaluate(() => {
    const allLinks = document.querySelectorAll('a[href*="/dp/"]');
    const links = [];
    for (const l of allLinks) {
      links.push({ href: l.href, text: l.innerText?.substring(0, 80) });
    }
    return { count: allLinks.length, links: links.slice(0, 5), firstHref: allLinks[0]?.href || null };
  });
  console.log('Product links found:', JSON.stringify(productLink, null, 2));

  if (productLink.firstHref) {
    await page.goto(productLink.firstHref, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(__dirname, 'debug_amazon_product.png'), fullPage: false });
    console.log('Saved: debug_amazon_product.png');

    // Dump review-related HTML
    const reviewInfo = await page.evaluate(() => {
      const info = {};
      
      // Check for review section
      const reviewSection = document.querySelector('#cm-cr-dp-review-list, #reviewsMedley, [data-hook="review"]');
      info.hasReviewSection = !!reviewSection;
      
      // Get all elements with "review" in their attributes
      const reviewEls = document.querySelectorAll('[data-hook*="review"], [class*="review"], [id*="review"]');
      info.reviewElementCount = reviewEls.length;
      info.reviewSelectors = [];
      for (let i = 0; i < Math.min(reviewEls.length, 10); i++) {
        const el = reviewEls[i];
        info.reviewSelectors.push({
          tag: el.tagName,
          id: el.id || '',
          class: el.className?.toString()?.substring(0, 100) || '',
          dataHook: el.getAttribute('data-hook') || '',
          textPreview: el.innerText?.substring(0, 100) || '',
        });
      }

      // Check for "See all reviews" link
      const allReviewLinks = document.querySelectorAll('a[href*="product-reviews"], a[href*="reviewerType"]');
      info.allReviewLinks = [];
      for (const l of allReviewLinks) {
        info.allReviewLinks.push({ href: l.href, text: l.innerText?.substring(0, 50) });
      }

      return info;
    });
    console.log('Review info on product page:', JSON.stringify(reviewInfo, null, 2));

    // Try navigating to all reviews page
    if (reviewInfo.allReviewLinks.length > 0) {
      await page.goto(reviewInfo.allReviewLinks[0].href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: path.join(__dirname, 'debug_amazon_reviews.png'), fullPage: false });
      console.log('Saved: debug_amazon_reviews.png');

      const reviewsPageInfo = await page.evaluate(() => {
        const info = {};
        const reviewDivs = document.querySelectorAll('[data-hook="review"]');
        info.reviewDivCount = reviewDivs.length;
        info.reviews = [];
        for (let i = 0; i < Math.min(reviewDivs.length, 3); i++) {
          const div = reviewDivs[i];
          const bodyEl = div.querySelector('[data-hook="review-body"] span, .review-text-content span');
          const titleEl = div.querySelector('[data-hook="review-title"] span');
          const ratingEl = div.querySelector('[data-hook="review-star-rating"] .a-icon-alt, i.a-icon .a-icon-alt');
          info.reviews.push({
            body: bodyEl?.innerText?.substring(0, 120) || 'NOT FOUND',
            title: titleEl?.innerText?.substring(0, 80) || 'NOT FOUND',
            rating: ratingEl?.innerText || 'NOT FOUND',
            divClasses: div.className?.substring(0, 100) || '',
            divHTML: div.innerHTML?.substring(0, 300) || '',
          });
        }
        return info;
      });
      console.log('Reviews page info:', JSON.stringify(reviewsPageInfo, null, 2));
    }
  }

  await browser.close();
}

async function debugFlipkart() {
  console.log('\n=== DEBUGGING FLIPKART ===');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');

  await page.goto(`https://www.flipkart.com/search?q=${encodeURIComponent(QUERY)}`, {
    waitUntil: 'domcontentloaded', timeout: 30000
  });
  await new Promise(r => setTimeout(r, 3000));

  // Dismiss login popup
  try {
    const closeBtn = await page.$('button._2KpZ6l._2doB4z, button[class*="close"], span[role="button"]');
    if (closeBtn) await closeBtn.click();
  } catch (e) {}

  await page.screenshot({ path: path.join(__dirname, 'debug_flipkart_search.png'), fullPage: false });
  console.log('Saved: debug_flipkart_search.png');

  // Find product link
  const productLink = await page.evaluate(() => {
    const allLinks = document.querySelectorAll('a[href*="/p/"]');
    const links = [];
    for (const l of allLinks) {
      links.push({ href: l.href, text: l.innerText?.substring(0, 80), class: l.className?.substring(0, 80) });
    }
    return { count: allLinks.length, links: links.slice(0, 5), firstHref: allLinks[0]?.href || null };
  });
  console.log('Product links found:', JSON.stringify(productLink, null, 2));

  if (productLink.firstHref) {
    const fullUrl = productLink.firstHref.startsWith('http')
      ? productLink.firstHref
      : `https://www.flipkart.com${productLink.firstHref}`;

    await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(__dirname, 'debug_flipkart_product.png'), fullPage: false });
    console.log('Saved: debug_flipkart_product.png');

    // Dump review HTML
    const reviewInfo = await page.evaluate(() => {
      const info = {};
      
      // Get all divs that might contain reviews
      const allDivs = document.querySelectorAll('div');
      const reviewDivs = [];
      for (const div of allDivs) {
        const text = div.innerText || '';
        const cls = div.className || '';
        if (text.length > 50 && text.length < 2000 && (
          cls.includes('review') || cls.includes('_27M-vq') || cls.includes('t-ZTKy') || cls.includes('ZmyHeo')
        )) {
          reviewDivs.push({
            class: cls.substring(0, 100),
            text: text.substring(0, 150),
            children: div.children.length,
          });
        }
      }
      info.reviewDivs = reviewDivs.slice(0, 5);
      info.reviewDivCount = reviewDivs.length;

      // Find any link to all reviews
      const allLinks = document.querySelectorAll('a');
      const reviewLinks = [];
      for (const l of allLinks) {
        const text = l.innerText?.toLowerCase() || '';
        const href = l.href || '';
        if (text.includes('review') || href.includes('review')) {
          reviewLinks.push({ href, text: l.innerText?.substring(0, 80), class: l.className?.substring(0, 80) });
        }
      }
      info.reviewLinks = reviewLinks.slice(0, 5);

      // Look at the page source for review-related class names
      const body = document.body.innerHTML;
      const classMatches = body.match(/class="[^"]*review[^"]*"/gi) || [];
      info.reviewClassPatterns = [...new Set(classMatches)].slice(0, 10);

      return info;
    });
    console.log('Flipkart review info:', JSON.stringify(reviewInfo, null, 2));

    // Try review links
    if (reviewInfo.reviewLinks.length > 0) {
      const reviewUrl = reviewInfo.reviewLinks[0].href.startsWith('http')
        ? reviewInfo.reviewLinks[0].href
        : `https://www.flipkart.com${reviewInfo.reviewLinks[0].href}`;
      
      await page.goto(reviewUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: path.join(__dirname, 'debug_flipkart_reviews.png'), fullPage: false });
      console.log('Saved: debug_flipkart_reviews.png');

      const reviewsPageInfo = await page.evaluate(() => {
        // Dump all elements with substantial text content that could be reviews
        const candidates = [];
        const allEls = document.querySelectorAll('div, p, span');
        for (const el of allEls) {
          const text = el.innerText?.trim() || '';
          const cls = el.className || '';
          if (text.length > 40 && text.length < 1500 && el.children.length < 5) {
            candidates.push({
              tag: el.tagName,
              class: cls.substring(0, 100),
              text: text.substring(0, 150),
            });
          }
        }
        return { candidates: candidates.slice(0, 15) };
      });
      console.log('Flipkart reviews page candidates:', JSON.stringify(reviewsPageInfo, null, 2));
    }
  }

  await browser.close();
}

async function debugReddit() {
  console.log('\n=== DEBUGGING REDDIT (via Google) ===');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent('site:reddit.com ' + QUERY + ' review')}&num=20`;
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(__dirname, 'debug_google_reddit.png'), fullPage: false });
  console.log('Saved: debug_google_reddit.png');

  const googleInfo = await page.evaluate(() => {
    const results = [];
    const containers = document.querySelectorAll('div.g, div[data-sokoban-container], div.MjjYud');
    for (const c of containers) {
      const titleEl = c.querySelector('h3');
      const linkEl = c.querySelector('a');
      const snippetEl = c.querySelector('.VwiC3b, .IsZvec, span.st, div[data-sncf]');
      results.push({
        title: titleEl?.innerText?.substring(0, 100) || 'NO TITLE',
        href: linkEl?.href?.substring(0, 100) || 'NO LINK',
        snippet: snippetEl?.innerText?.substring(0, 150) || 'NO SNIPPET',
        containerClass: c.className?.substring(0, 80) || '',
      });
    }
    
    // Also check for consent/captcha page
    const bodyText = document.body.innerText?.substring(0, 500) || '';
    return { resultCount: results.length, results: results.slice(0, 8), pagePreview: bodyText };
  });
  console.log('Google results:', JSON.stringify(googleInfo, null, 2));

  await browser.close();
}

(async () => {
  try {
    await debugAmazon();
    await debugFlipkart();
    await debugReddit();
    console.log('\n=== ALL DEBUG COMPLETE ===');
  } catch (e) {
    console.error('Debug script error:', e);
  }
})();
