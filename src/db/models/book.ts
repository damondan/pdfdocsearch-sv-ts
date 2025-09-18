import { getCollection } from '../../db/mongodb.js';
import type { BookData }  from '$lib/types.js'

const COLLECTION = 'books';

/**
 * Get all distinct subjects from the books collection
 * @returns {Promise<string[]>} Array of subject names
 */
export async function getSubjects():Promise<string[]> {
  const collection = await getCollection(COLLECTION);
  console.log("In getSubjects and returns distinct subject" +
    "which is a field in books table");
  return collection.distinct('subject');
}

/**
 * Get book titles by subject
 * @param {string} subject The subject to filter by
 * @returns {Promise<string[]>} Array of book titles
 */
export async function getBookTitlesBySubject(subject: string): Promise<string[]> {
  const collection = await getCollection(COLLECTION);
  const books = await collection.find({ subject }, { projection: { bookTitle: 1 } }).toArray();
  return books.map(book => book.bookTitle);
}

/**
 * Get all books by subject
 * @param {string} subject The subject to filter by
 * @returns {Promise<Object[]>} Array of book documents
 */
export async function getBooksBySubject(subject: string): Promise<Object[]> {
  const collection = await getCollection(COLLECTION);
  return collection.find({ subject }).toArray();
}

/**
 * Insert or update a book document
 * @param {Object} bookData The book data object
 * @param {string} bookData.subject The subject/category of the book
 * @param {string} bookData.bookTitle The title of the book
 * @param {string} bookData.fileName The PDF filename
 * @param {Date} bookData.importedAt When the book was imported
 * @returns {Promise<Object>} MongoDB update result
 */
export async function upsertBook(bookData: BookData): Promise<Object> {
  const collection = await getCollection(COLLECTION);
  
  const { subject, bookTitle } = bookData;
  
  return collection.updateOne(
    { subject, bookTitle },
    { $set: { ...bookData, updatedAt: new Date() } },
    { upsert: true }
  );
}
