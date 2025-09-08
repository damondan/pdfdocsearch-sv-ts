import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
    const response = await fetch(env.VITE_API_URL_GETSUBJECTS || 'http://localhost:3001');
    const dataPdfSubjects: string[] = await response.json();
    return {
        dataPdfSubjects
    };
};

