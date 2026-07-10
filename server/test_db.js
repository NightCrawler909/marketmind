import mongoose from 'mongoose';
import AmazonProduct from './models/AmazonProduct.js';
import AmazonDatasetReview from './models/AmazonDatasetReview.js';

mongoose.connect('mongodb://127.0.0.1:27017/marketmind').then(async () => {
  const count = await AmazonProduct.countDocuments();
  console.log('Total products:', count);
  const result = await AmazonProduct.find({ $text: { $search: 'shampoo' } }).limit(1).lean();
  console.log('Search result:', result);
  
  if (result.length > 0) {
    const reviews = await AmazonDatasetReview.countDocuments({ parent_asin: result[0].parent_asin });
    console.log('Reviews for this ASIN:', reviews);
  }
  
  process.exit(0);
});
