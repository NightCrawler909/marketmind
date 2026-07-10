import AnalysisSession from '../models/AnalysisSession.js';
import RawReview from '../models/RawReview.js';
import { scrapeReddit } from '../services/redditScraper.js';
import { scrapeFlipkart } from '../services/flipkartScraper.js';
import { ingestAmazonDataset } from '../services/amazonIngestion.js';

export async function runScoutAgent(req, res) {
  const { query, sessionId } = req.body;

  if (!query || !sessionId) {
    return res.status(400).json({ error: 'Missing query or sessionId' });
  }

  try {
    await AnalysisSession.findOneAndUpdate(
      { _id: sessionId },
      { query, status: 'SCRAPING' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const results = await Promise.allSettled([
      scrapeReddit(query),
      scrapeFlipkart(query),
      ingestAmazonDataset(query),
    ]);

    const platformLabels = ['REDDIT', 'FLIPKART', 'AMAZON'];
    const allReviews = [];
    const counts = {};

    results.forEach((result, index) => {
      const label = platformLabels[index];
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        const reviews = result.value.map((r) => ({ ...r, sessionId }));
        allReviews.push(...reviews);
        counts[label] = result.value.length;
      } else {
        console.error(`${label} scrape rejected:`, result.reason?.message || 'Unknown error');
        counts[label] = 0;
      }
    });

    // Clear any stale reviews from a previous attempt with the same session
    await RawReview.deleteMany({ sessionId });

    if (allReviews.length > 0) {
      await RawReview.insertMany(allReviews);
    }

    await AnalysisSession.findByIdAndUpdate(sessionId, { status: 'SYNTHESIZING' });

    return res.status(200).json({
      message: 'Scout Agent completed successfully.',
      totalReviews: allReviews.length,
      breakdown: counts,
    });
  } catch (error) {
    console.error('Scout Agent pipeline error:', error);
    await AnalysisSession.findByIdAndUpdate(sessionId, { status: 'FAILED' });
    return res.status(500).json({ error: 'Scout Agent pipeline failed.', details: error.message });
  }
}
