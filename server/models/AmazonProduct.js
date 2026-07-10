import mongoose from 'mongoose';

const amazonProductSchema = new mongoose.Schema({
  parent_asin: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  main_category: {
    type: String,
  },
  categories: [String],
  average_rating: Number,
  rating_number: Number,
}, { timestamps: true });

// Add a full-text search index on the title field so we can instantly search for products
amazonProductSchema.index({ title: 'text' });

export default mongoose.model('AmazonProduct', amazonProductSchema);
