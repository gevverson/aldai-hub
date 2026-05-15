import mongoose from 'mongoose';

const MAX_RETRIES = 3;
const RETRY_DELAY = 5_000; // ms

const connectDB = async (attempt = 1) => {
  // Read MONGO_URI lazily here — NOT at module load time — so that
  // dotenv.config() in the caller (seed_db.js / server.js) runs first.
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/macho-ya-mwananchi';

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10_000, // fail fast if server unreachable
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host} (attempt ${attempt})`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);

    if (attempt < MAX_RETRIES) {
      console.log(`   Retrying in ${RETRY_DELAY / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return connectDB(attempt + 1);
    }

    console.error('   All connection attempts exhausted. Shutting down.');
    process.exit(1);
  }
};

// Graceful disconnect helper (used in seed script + tests)
export const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log('MongoDB disconnected.');
};

export default connectDB;
