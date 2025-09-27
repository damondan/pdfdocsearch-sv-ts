import type { RequestHandler } from './$types';
import { getBookTitlesBySubject } from '../../../../db/models/book';

/**
 * SvelteKit API route handler for getting PDF titles by subject
 * @param params - SvelteKit request parameters
 * @param params.request - Web API Request object
 * @param params.params - Route parameters containing subject
 * @returns Response with PDF titles array or error message
 */
export const GET: RequestHandler = async ({ request, params }) => {
  try {
    const { subject } = params;
    
    if (!subject) {
      return new Response(JSON.stringify({ error: 'Subject parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const pdfTitles = await getBookTitlesBySubject(subject);
    
    return new Response(JSON.stringify(pdfTitles), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error(`API Error fetching PDF titles for ${params.subject}:`, error);
    return new Response(JSON.stringify({ error: 'Failed to fetch PDF titles' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};