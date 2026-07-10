import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { scrapeReddit } from '../services/redditScraper.js';
import { generateIntelligenceReport } from '../services/llmService.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/marketmind';
const TEST_QUERY = 'Docker Deployment Test';

const pass = (label) => console.log(`  [PASS] ${label}`);
const fail = (label, err) => console.log(`  [FAIL] ${label} — ${err}`);
const header = (title) => {
  console.log('');
  console.log(`  ${'─'.repeat(50)}`);
  console.log(`  ${title}`);
  console.log(`  ${'─'.repeat(50)}`);
};

async function verifyDatabase() {
  header('CHECKPOINT 1: MongoDB Connectivity');
  try {
    await mongoose.connect(MONGO_URI);
    const state = mongoose.connection.readyState;
    if (state === 1) {
      pass(`Connected to ${MONGO_URI}`);
      return true;
    }
    fail('Database connection', `Unexpected readyState: ${state}`);
    return false;
  } catch (err) {
    fail('Database connection', err.message);
    return false;
  }
}

async function verifyOutboundNetwork() {
  header('CHECKPOINT 2: Outbound Network (Reddit API)');
  try {
    const results = await scrapeReddit(TEST_QUERY, 5);
    if (results.length > 0) {
      pass(`Reddit API returned ${results.length} posts`);
      pass(`Sample: "${results[0].rawText.slice(0, 80)}..."`);
      return results;
    }
    fail('Reddit API', 'Returned 0 results (may be rate-limited)');
    return [];
  } catch (err) {
    fail('Reddit API', err.message);
    return [];
  }
}

async function verifyLLM(reviews) {
  header('CHECKPOINT 3: Ollama LLM Inference');

  const mockReviews = reviews.length > 0
    ? reviews
    : [
        { platform: 'AMAZON', rawText: 'Battery drains fast. Overheats during gaming.', metadata: {} },
        { platform: 'REDDIT', rawText: 'Display is stuck at 60Hz. Feels outdated.', metadata: { upvotes: 50 } },
        { platform: 'FLIPKART', rawText: 'Camera quality in low light is terrible.', metadata: { verified: true } },
      ];

  const progressLogs = [];
  const onProgress = (msg) => {
    progressLogs.push(msg);
  };

  try {
    console.log('  [....] Sending prompt to Ollama (this may take 30-120s)...');
    const start = Date.now();
    const report = await generateIntelligenceReport(mockReviews, TEST_QUERY, onProgress);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    if (report.executiveSummary && report.coreComplaints && report.productBlueprint) {
      pass(`LLM responded in ${elapsed}s`);
      pass(`Vulnerability Index: ${report.executiveSummary.vulnerabilityIndex}/100`);
      pass(`Core Complaints: ${report.coreComplaints.length} identified`);
      pass(`Engineering Solutions: ${report.productBlueprint.engineeringSolutions?.length || 0} proposed`);
      pass('JSON schema validation passed');
      return true;
    }
    fail('LLM JSON structure', 'Missing required top-level keys');
    return false;
  } catch (err) {
    fail('LLM inference', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.log('  [INFO] Ensure Ollama is running: ollama serve');
    }
    return false;
  }
}

async function run() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════╗');
  console.log('  ║     MARKETMIND AI — PIPELINE VERIFICATION       ║');
  console.log('  ╚══════════════════════════════════════════════════╝');

  const results = { db: false, network: false, llm: false };

  results.db = await verifyDatabase();
  const reviews = await verifyOutboundNetwork();
  results.network = reviews.length > 0;
  results.llm = await verifyLLM(reviews);

  header('VERIFICATION SUMMARY');
  console.log(`  Database Connectivity:  ${results.db ? '[PASS]' : '[FAIL]'}`);
  console.log(`  Outbound Networking:    ${results.network ? '[PASS]' : '[FAIL]'}`);
  console.log(`  LLM JSON Inference:     ${results.llm ? '[PASS]' : '[FAIL]'}`);
  console.log('');

  const allPassed = results.db && results.network && results.llm;
  console.log(`  Overall: ${allPassed ? '✓ ALL SYSTEMS OPERATIONAL' : '✗ ISSUES DETECTED — SEE ABOVE'}`);
  console.log('');

  await mongoose.disconnect();
  process.exit(allPassed ? 0 : 1);
}

run();
