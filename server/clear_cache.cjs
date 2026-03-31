const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const SimilarityCache = require('./models/SimilarityCache');

async function clearCache() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'cineverse' });
    console.log('Connected to MongoDB');
    
    const res = await SimilarityCache.deleteMany({});
    console.log(`Successfully cleared ${res.deletedCount} cached entries.`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error clearing cache:', err);
    process.exit(1);
  }
}

clearCache();
