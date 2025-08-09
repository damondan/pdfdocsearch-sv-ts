import { env } from '$env/dynamic/private';
import { json, type RequestEvent } from '@sveltejs/kit';

export async function GET({ params, fetch }: RequestEvent) {
    const { subject } = params;
    
    try {
        const response = await fetch(`${env.VITE_API_URL_GETPDFTITLES || 'http://localhost:3001/api/pdf-titles'}/${subject}`);
        const data: string[] = await response.json();
        return json(data || []);
    } catch (error) {
        console.error('Error fetching PDF titles:', error);
        return json([], { status: 500 });
    }
}