import mongoose from 'mongoose';

const intelligenceReportSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    ref: 'AnalysisSession',
    required: true,
    unique: true,
  },
  executiveSummary: {
    vulnerabilityIndex: {
      type: Number,
      required: true,
    },
    platformBreakdown: [{
      platform: String,
      positivePercent: Number,
      negativePercent: Number,
    }]
  },
  coreComplaints: [{
    title: String,
    summary: String,
    severity: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
    }
  }],
  productBlueprint: {
    targetWeaknesses: [String],
    engineeringSolutions: [String],
    bomImpact: [String],
  }
}, { timestamps: true });

export default mongoose.model('IntelligenceReport', intelligenceReportSchema);
