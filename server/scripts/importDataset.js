import mongoose from 'mongoose';
import fs from 'fs';
import zlib from 'zlib';
import readline from 'readline';
import AmazonProduct from '../models/AmazonProduct.js';
import AmazonDatasetReview from '../models/AmazonDatasetReview.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/marketmind';

async function importDataset(filePath, type) {
  if (type !== 'meta' && type !== 'review') {
    console.error("Type must be 'meta' or 'review'.");
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  console.log(`Starting stream from local file ${filePath}...`);

  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    const gunzip = zlib.createGunzip();
    fileStream.pipe(gunzip);

    const rl = readline.createInterface({
      input: gunzip,
      crlfDelay: Infinity,
    });

    let batch = [];
    const BATCH_SIZE = 5000;
    let totalInserted = 0;
    let totalProcessed = 0;

    rl.on('line', async (line) => {
      totalProcessed++;
      
      try {
        const rawObj = JSON.parse(line);
        
        if (type === 'meta') {
          // Some objects might be missing parent_asin, skip them
          if (!rawObj.parent_asin || !rawObj.title) return;
          
          batch.push({
            parent_asin: rawObj.parent_asin,
            title: rawObj.title,
            main_category: rawObj.main_category,
            categories: rawObj.categories || [],
            average_rating: rawObj.average_rating,
            rating_number: rawObj.rating_number,
          });
        } else {
          if (!rawObj.parent_asin || !rawObj.text) return;
          
          batch.push({
            parent_asin: rawObj.parent_asin,
            rating: rawObj.rating,
            title: rawObj.title,
            text: rawObj.text,
            helpful_vote: rawObj.helpful_vote || 0,
            verified_purchase: rawObj.verified_purchase || false,
          });
        }

        if (batch.length >= BATCH_SIZE) {
          rl.pause(); // Pause stream while writing to DB
          const currentBatch = [...batch];
          batch = [];
          
          try {
            if (type === 'meta') {
              // Using unordered bulk write to ignore duplicate ASINs efficiently
              await AmazonProduct.insertMany(currentBatch, { ordered: false }).catch(err => {
                 // Ignore duplicate key errors (code 11000)
                 if (err.code !== 11000) throw err;
              });
            } else {
              await AmazonDatasetReview.insertMany(currentBatch, { ordered: false });
            }
            
            totalInserted += currentBatch.length;
            process.stdout.write(`\rProcessed: ${totalProcessed} | Inserted: ${totalInserted}`);
          } catch (err) {
            console.error('\nBatch insert error:', err.message);
          }
          
          rl.resume();
        }
      } catch (err) {
        // Ignore parse errors for individual lines
      }
    });

    rl.on('close', async () => {
      // Process final batch
      if (batch.length > 0) {
        try {
          if (type === 'meta') {
            await AmazonProduct.insertMany(batch, { ordered: false }).catch(err => {
               if (err.code !== 11000) throw err;
            });
          } else {
            await AmazonDatasetReview.insertMany(batch, { ordered: false });
          }
          totalInserted += batch.length;
        } catch (err) {
          console.error('\nFinal batch insert error:', err.message);
        }
      }
      console.log(`\n\nDone! Total lines processed: ${totalProcessed}, Total successfully inserted: ${totalInserted}`);
      mongoose.disconnect();
      resolve();
    });
    
    gunzip.on('error', (err) => {
      console.error('\nGunzip error:', err);
      mongoose.disconnect();
      reject(err);
    });
  });
}

const filePath = process.argv[2];
const type = process.argv[3];

if (!filePath || !type) {
  console.log("Usage: node importDataset.js <LOCAL_FILE_PATH_TO_JSONL_GZ> <meta|review>");
  console.log("Example:");
  console.log("node importDataset.js C:\\Downloads\\meta_All_Beauty.jsonl.gz meta");
  process.exit(1);
}

importDataset(filePath, type);
