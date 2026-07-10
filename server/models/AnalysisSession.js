import mongoose from 'mongoose';

const analysisSessionSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  query: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'SCRAPING', 'SYNTHESIZING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  },
  parameters: {
    platforms: {
      type: [String],
      default: ['AMAZON', 'FLIPKART', 'REDDIT'],
    },
    sampleDepth: {
      type: Number,
      default: 100,
    }
  }
}, { timestamps: true });

export default mongoose.model('AnalysisSession', analysisSessionSchema);
