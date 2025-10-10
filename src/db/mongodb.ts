// src/db/mongodb.ts - Serverless MongoDB Connection
import { MongoClient, Db, Collection } from 'mongodb';

const MONGODB_URI = "mongodb+srv://damon5185:D27934GvIkHalIef@clustersearchpdf.37gzhel.mongodb.net/?retryWrites=true&w=majority&appName=ClusterSearchPdf";
const MONGODB_DATABASE = "pdf_search_db";

/**
 * Cached MongoDB client instance for connection reuse
 */
let cachedClient: MongoClient | null = null;

/**
 * Cached MongoDB database instance for connection reuse
 */
let cachedDb: Db | null = null;

/**
 * Connect to MongoDB with connection caching for serverless
 * @returns MongoDB database instance
 * @throws When MONGODB_URI environment variable is not defined
 * @throws When connection to MongoDB fails
 */
async function connect(): Promise<Db> {
  // if (cachedDb && process.env.MONGODB_URI) {
  //   console.log('Reusing cached MongoDB connection');
  //   return cachedDb;
  // }

  // if (!process.env.MONGODB_URI) {
  //   throw new Error('MONGODB_URI is not defined in environment variables');
  // }

  //const client = new MongoClient(process.env.MONGODB_URI);
 const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    // Use the database from environment variable
    //const db = client.db(process.env.MONGODB_DATABASE);
    const db = client.db(MONGODB_DATABASE);

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
    console.error('MongoDB connection error:', error);
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