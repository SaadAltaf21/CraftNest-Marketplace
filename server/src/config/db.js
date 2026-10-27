const mongoose = require('mongoose');
let memoryServer = null;
let cached = null;

async function connectDB() {
  if (cached && mongoose.connection.readyState === 1) return cached;
  if (cached) return cached;
  let uri = process.env.MONGO_URI;
  if (!uri) {
    // Local testing only. Production MUST set MONGO_URI (Atlas).
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log('[craftnest] No MONGO_URI set - using in-memory MongoDB (temporary, local only)');
  }
  cached = mongoose.connect(uri);
  await cached;
  console.log('[craftnest] MongoDB connected');
  return cached;
}

module.exports = { connectDB };
