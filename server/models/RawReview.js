import mongoose from 'mongoose';

const rawReviewSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    ref: 'AnalysisSession',
    required: true,
  },
  platform: {
    type: String,
    enum: ['AMAZON', 'FLIPKART', 'REDDIT'],
    required: true,
  },
  rawText: {
    type: String,
    required: true,
  },
  sentimentScore: {
    type: Number,
    min: -1,
    max: 1,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  }
}, { timestamps: true });

export default mongoose.model('RawReview', rawReviewSchema);
