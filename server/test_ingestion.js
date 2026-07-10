import mongoose from 'mongoose';
import { ingestAmazonDataset } from './services/amazonIngestion.js';

mongoose.connect('mongodb://127.0.0.1:27017/marketmind').then(async () => {
  console.log('Testing amazonIngestion for "shampoo"...');
  const reviews = await ingestAmazonDataset('shampoo');
  console.log('Returned reviews count:', reviews.length);
  process.exit(0);
});
