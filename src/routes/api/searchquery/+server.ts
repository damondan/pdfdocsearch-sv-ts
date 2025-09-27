import type { RequestHandler } from './$types';
import type { SearchRequestBody, SearchResponse, ErrorResponse } from '$lib/types';
import { searchPages } from '../../../db/models/page';

/**
 * SvelteKit API route handler for searching PDFs
 * @param params - SvelteKit request parameters
 * @param params.request - Web API Request object
 * @returns Response with search results or error message
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    console.log("In backend searchquery");
    
    const requestBody: SearchRequestBody = await request.json();
    const { selectedSubject, searchQuery, pdfBookTitles } = requestBody;

    if (!selectedSubject || !searchQuery || !pdfBookTitles) {
      const errorResponse: ErrorResponse = {
        error: 'Missing selectedSubject, searchQuery, or pdfBookTitles'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (pdfBookTitles.length > 40) {
      const errorResponse: ErrorResponse = {
        error: 'Too many titles, max 25 allowed'
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const results = await searchPages(selectedSubject, searchQuery, pdfBookTitles);
    const total = Object.values(results).reduce((sum, pages) => sum + pages.length, 0);

    const response: SearchResponse = {
      message: 'Search completed',
      results,
      total
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('API Error processing search:', error);
    const errorResponse: ErrorResponse = { error: 'Failed to process search' };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};