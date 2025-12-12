// src/db/mongodb.ts - Serverless MongoDB Connection
import { MongoClient, Db, Collection } from 'mongodb';

/**
 * Cached MongoDB client instance for connection reuse
 */
let cachedClient: MongoClient | null = null;

/**
 * Cached MongoDB database instance for connection reuse
 */
let cachedDb: Db | null = null;

console.log('📍 REACHED: mongodb.ts - Module loading');
const uri = process.env.MONGODB_URI;

console.log('📍 ENV CHECK: MONGODB_URI exists?', !!uri);
console.log('📍 ENV CHECK: MONGODB_URI length:', uri?.length || 0);
console.log('📍 ENV CHECK: MONGODB_URI masked:', uri ? uri.substring(0, 25) + '...' + uri.substring(uri.length - 20) : 'undefined');
console.log('📍 ENV CHECK: MONGODB_DATABASE exists?', !!process.env.MONGODB_DATABASE);
console.log('📍 ENV CHECK: MONGODB_DATABASE value:', process.env.MONGODB_DATABASE);
if (!uri) {
  console.log('❌ ERROR: MONGODB_URI is not set!');
  throw new Error("MONGODB_URI environment variable is not set!");
}
console.log('📍 REACHED: Creating MongoClient instance');
const client = new MongoClient(uri);

/**
 * Connect to MongoDB with connection caching for serverless
 * @returns MongoDB database instance
 * @throws When MONGODB_URI environment variable is not defined
 * @throws When connection to MongoDB fails
 */
async function connect(): Promise<Db> {
  console.log('📍 REACHED: mongodb.ts connect() - START');
  if (cachedDb && uri) {
    console.log('📍 REACHED: Reusing cached MongoDB connection');
    return cachedDb;
  }

  if (!uri) {
    console.log('❌ ERROR: MONGODB_URI is not defined');
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    console.log('📍 REACHED: Attempting to connect to MongoDB...');
    await client.connect();
    console.log('✅ SUCCESS: Connected to MongoDB Atlas');

    // Use the database from environment variable
    const db = client.db(process.env.MONGODB_DATABASE);
    //const db = client.db(MONGODB_DATABASE);

    // Debug information
    const adminDb = client.db().admin();
    const dbList = await adminDb.listDatabases();
    console.log('Available databases:', dbList.databases.map(database => database.name));
    
    const collections = await db.listCollections().toArray();
    console.log('Collections in MongoDB DB:', collections.map(col => col.name));

    // Cache the connection
    cachedClient = client;
    cachedDb = db;
    
    return db;
  } catch (error) {
    console.error('❌ ERROR: MongoDB connection failed:', error);
    console.error('❌ ERROR: Error message:', error instanceof Error ? error.message : 'Unknown error');
    // Reset cache on error to allow retry
    cachedClient = null;
    cachedDb = null;
    throw error;
  }
}

/**
 * Get collection from cached database connection
 * @param collectionName The name of the collection to retrieve
 * @returns MongoDB collection instance
 * @throws When collection name is not provided
 * @throws When database connection fails
 */
async function getCollection(collectionName: string): Promise<Collection> {
  if (!collectionName) {
    throw new Error('Collection name is required');
  }
  const database = await connect();
  return database.collection(collectionName);
}

/**
 * Close MongoDB connection (mainly for cleanup in non-serverless contexts)
 */
async function close(): Promise<void> {
  console.log('Closing MongoDB connection');
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}

export { connect, getCollection, close };