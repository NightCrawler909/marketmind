import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { runScoutAgent } from './controllers/scoutController.js';
import { runSynthesizerAgent } from './controllers/synthesizerController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const connectDB = async () => {
  try {
    mongoose.connection.on('connected', () => console.log('MongoDB connection established successfully.'));
    mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
    mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected.'));

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/marketmind');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/scout', runScoutAgent);
app.post('/api/synthesize', runSynthesizerAgent);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`MarketMind AI backend running on port ${PORT}`);
  });
});
