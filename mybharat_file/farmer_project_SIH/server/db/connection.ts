import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Global cache interface for Mongoose connection across dev hot-reloads
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export function validateMongoConfig(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: MONGODB_URI environment variable is missing in production. MongoDB Atlas connection string is required.');
    }
    const devFallback = process.env.MONGODB_DEV_URI || 'mongodb://localhost:27017/krishisetu_db';
    console.warn('⚠️ [MongoDB] MONGODB_URI not set. Falling back to local development URI. Do not use this in production.');
    return devFallback;
  }
  return uri;
}

/**
 * Connect to MongoDB Atlas / Local MongoDB using a cached singleton connection
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  const mongoUri = validateMongoConfig();

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(mongoUri, opts).then((m) => {
      console.log(`✅ [MongoDB Atlas] Successfully connected to database: ${m.connection.name}`);
      return m;
    }).catch((err) => {
      cached.promise = null;
      console.error('❌ [MongoDB Atlas] Connection failed to establish. Service degraded.');
      throw new Error(`MongoDB connection failed: ${err.message}`);
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('🔌 [MongoDB] Disconnected from database.');
  }
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
