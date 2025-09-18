// api/subjects/+server.js - GET /api/subjects endpoint
import { getSubjects } from '../../../db/models/book.js';

/**
 * SvelteKit API route handler to get all subjects
 * @param {Object} params - SvelteKit request parameters
 * @param {Request} params.request - Web API Request object
 */
export async function GET({ request }) {
  try {
    const subjects = await getSubjects();
    
    return new Response(JSON.stringify(subjects), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('API Error fetching subjects:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch subjects' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}