import mongoose from 'mongoose';

const amazonDatasetReviewSchema = new mongoose.Schema({
  parent_asin: {
    type: String,
    required: true,
    index: true, // Crucial for instant lookups by ASIN
  },
  rating: {
    type: Number,
    required: true,
  },
  title: String,
  text: {
    type: String,
    required: true,
  },
  helpful_vote: {
    type: Number,
    default: 0,
  },
  verified_purchase: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Compound index to quickly get the most helpful reviews for a specific ASIN
amazonDatasetReviewSchema.index({ parent_asin: 1, helpful_vote: -1 });

export default mongoose.model('AmazonDatasetReview', amazonDatasetReviewSchema);
