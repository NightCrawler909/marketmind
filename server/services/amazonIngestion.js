import mongoose from 'mongoose';
import AmazonProduct from '../models/AmazonProduct.js';
import AmazonDatasetReview from '../models/AmazonDatasetReview.js';
import fs from 'fs';
import path from 'path';

/**
 * Amazon Data Lake Ingestion Strategy
 * 1. Fast local check (for hardcoded test queries to avoid MongoDB setup overhead during initial tests)
 * 2. MongoDB Full-Text Search on AmazonProduct collection
 * 3. Fetch reviews from AmazonDatasetReview
 */
export async function ingestAmazonDataset(query, maxReviews = 30) {
  const normalizedQuery = query.toLowerCase().trim();

  // Strategy 1: Check fast local dataset cache first (for our hardcoded mock tests)
  try {
    const datasetPath = path.resolve(process.cwd(), '../dataset/amazon_reviews/popular_products.json');
    if (fs.existsSync(datasetPath)) {
      const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
      if (data[normalizedQuery]) {
        console.log(`Amazon: Loaded ${data[normalizedQuery].length} reviews from fast local test cache.`);
        return data[normalizedQuery];
      }
    }
  } catch (err) {
    console.error('Amazon local test cache read error:', err.message);
  }

  // Strategy 2: Use MongoDB Data Lake
  console.log(`Amazon: Searching Data Lake for "${query}"...`);
  
  try {
    // Check if models are registered (in case this is called before Mongoose is fully initialized)
    if (mongoose.connection.readyState !== 1) {
      console.log('Amazon: MongoDB not connected, cannot query Data Lake.');
      return [];
    }

    // Perform a full-text search to find the product ASIN
    const products = await AmazonProduct.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" }, rating_number: -1 }) // Sort by relevance and popularity
    .limit(1)
    .lean();

    if (products.length === 0) {
      console.log(`Amazon: No products found in Data Lake for "${query}".`);
      return [];
    }

    const matchedProduct = products[0];
    console.log(`Amazon: Found product in Data Lake - ${matchedProduct.title} (ASIN: ${matchedProduct.parent_asin})`);

    // Fetch the most helpful reviews for this ASIN
    const rawReviews = await AmazonDatasetReview.find({ parent_asin: matchedProduct.parent_asin })
      .sort({ helpful_vote: -1 })
      .limit(maxReviews)
      .lean();

    console.log(`Amazon: Extracted ${rawReviews.length} reviews from Data Lake for ASIN ${matchedProduct.parent_asin}.`);

    // Map to our standard pipeline format
    return rawReviews.map(r => ({
      platform: 'AMAZON',
      rawText: r.text,
      sentimentScore: undefined, // Leave undefined so our fallback math works natively
      metadata: {
        verifiedPurchase: r.verified_purchase,
        rating: r.rating,
        helpfulVotes: r.helpful_vote,
      }
    }));

  } catch (error) {
    console.error('Amazon Data Lake query failed:', error.message);
    return [];
  }
}
