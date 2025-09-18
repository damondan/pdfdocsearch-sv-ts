// api/test-hardcoded/+server.js
import { MongoClient } from 'mongodb';

/**
 * SvelteKit API route handler for testing hardcoded MongoDB connection
 * @param {Object} params - SvelteKit request parameters
 * @param {Request} params.request - Web API Request object
 */
export async function GET({ request }) {
  // TEMPORARILY hardcode the working connection string
  const uri = "mongodb+srv://damon5185:YOUR_ACTUAL_PASSWORD@clustersearchpdf.37gzhel.mongodb.net/pdf_search_db?retryWrites=true&w=majority";
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('pdf_search_db');
    const collections = await db.listCollections().toArray();
    await client.close();
    
    return new Response(JSON.stringify({ 
      success: true, 
      collections: collections.length 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (err) {
    // Handle unknown error type
    let errorMessage = 'Unknown error occurred';
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}