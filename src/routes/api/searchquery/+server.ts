import { env } from '$env/dynamic/private';
import { json, error, type RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
    try {
        // Get the request body from SearchBar
        const payload = await request.json();
        
        // Forward to your Node.js API
        const response = await fetch(`${env.VITE_API_URL_SEARCHQUERY || 'http://localhost:3001/api/searchquery'}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw error(response.status, `External API error: ${response.status}`);
        }

        const data = await response.json();
        return json(data);
        
    } catch (err) {
        console.error('Error in search API route:', err);
        throw error(500, 'Search request failed');
    }
}