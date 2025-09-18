import { getCollection } from '../mongodb.js';
import type { PageResult, PageData } from '$lib/types.js';

const COLLECTION = 'pages';

/**
 * @typedef {Object} PageResult
 * @property {number} pageNum - The page number
 * @property {string} text - The page text content
 */

/**
 * Search pages for a query within specified books and subject
 * @param {string} subject The subject to search within
 * @param {string} searchQuery The text to search for
 * @param {string[]} bookTitles Array of book titles to search
 * @returns {Promise<Object.<string, PageResult[]>>} Results grouped by book title
 */
export async function searchPages(subject:string, searchQuery: string, bookTitles: string[]): Promise<Record<string, PageResult[]>> {
  const collection = await getCollection(COLLECTION);
  
  const wordRegex = new RegExp(`\\b${searchQuery}\\b`, 'i');
  
  const query = {
    subject: subject,
    bookTitle: { $in: bookTitles },
    text: wordRegex
  };
  
  const pages = await collection.find(query).toArray();
  
  /** @type {Record<string, PageResult[]>} */
  const results: Record<string, PageResult[]> = {};
  
  for (const page of pages) {
    const { bookTitle, pageNum, text } = page;
    
    if (!results[bookTitle]) {
      results[bookTitle] = [];
    }
    
    results[bookTitle].push({ pageNum, text });
  }
  
  const firstText = Object.values(results)[0][0].text;
  console.log("First text of book one is " + firstText);
  return results;
}

/**
 * Create database indexes for efficient searching
 * @returns {Promise<void>}
 */
export async function createIndexes() {
  const collection = await getCollection(COLLECTION);
  
  await collection.createIndex({ subject: 1, bookTitle: 1, pageNum: 1 }, { unique: true });
  
  await collection.createIndex({ text: 1 });
  
  console.log('Page indexes created');
}

/**
 * Insert or update a page document
 * @param {Object} pageData The page data object
 * @param {string} pageData.subject The subject/category
 * @param {string} pageData.bookTitle The book title
 * @param {number} pageData.pageNum The page number
 * @param {string} pageData.text The extracted text content
 * @param {Date} pageData.importedAt When the page was imported
 * @returns {Promise<Object>} MongoDB update result
 */
export async function upsertPage(pageData: PageData) {
  const collection = await getCollection(COLLECTION);
  
  const { subject, bookTitle, pageNum } = pageData;
  
  return collection.updateOne(
    { subject, bookTitle, pageNum },
    { $set: { ...pageData, updatedAt: new Date() } },
    { upsert: true }
  );
}

