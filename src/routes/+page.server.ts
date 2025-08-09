import { env } from '$env/dynamic/private';

export async function load({ fetch }: { fetch: (input: RequestInfo, init?: 
    RequestInit) => Promise<Response> }): Promise<{ dataPdfSubjects: string[] }> {
    //const response = await fetch('http://localhost:3001/api/subjects');
    const response = await fetch(env.VITE_API_URL_GETSUBJECTS || 'http://localhost:3001');
    const dataPdfSubjects: string[] = await response.json();
    return {
      dataPdfSubjects // Directly return the data, no "props" wrapper
    };
  }

