import type { PageServerLoad } from './$types';
import { getSubjects } from '../db/models/book';

/**
 * Loads PDF subjects data directly from database
 * @returns Object containing the PDF subjects data
 */
export const load: PageServerLoad = async () => {
  try {
    const dataPdfSubjects = await getSubjects();
   
    return { dataPdfSubjects };
  } catch (error) {
    console.error('Load function error:', error);
    return { dataPdfSubjects: [] };
  }
};