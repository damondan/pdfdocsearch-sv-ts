import { getCollection } from '../mongodb';
import type { PageResult, PageData } from '$lib/types.ts';

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
export async function searchPages(subject:string, searchQuery: string, bookTitles: string[]): Promise<Record<string, (PageResult | null)[]>> {
  const collection = await getCollection(COLLECTION);
  
  const wordRegex = new RegExp(`\\b${searchQuery}\\b`, 'i');
  
  const query = {
    subject: subject,
    bookTitle: { $in: bookTitles },
    text: wordRegex
  };
  
  const matchedPages = await collection.find(query).toArray();
  
  const results: Record<string, (PageResult | null)[]> = {};
  
  // Step 2: For each match, fetch adjacent pages
  for (const match of matchedPages) {
    const { bookTitle, pageNum, text } = match;
    
    if (!results[bookTitle]) {
      results[bookTitle] = [];
    }
    
    // Fetch previous page (pageNum - 1)
    const prevPage = await collection.findOne({
      subject: subject,
      bookTitle: bookTitle,
      pageNum: pageNum - 1
    });
    
    // Fetch next page (pageNum + 1)
    const nextPage = await collection.findOne({
      subject: subject,
      bookTitle: bookTitle,
      pageNum: pageNum + 1
    });
    
    // Add carousel group: [prev, match, next]
    results[bookTitle].push(
      prevPage ? { pageNum: prevPage.pageNum, text: prevPage.text } : null,
      { pageNum, text },
      nextPage ? { pageNum: nextPage.pageNum, text: nextPage.text } : null
    );
  }
  
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

