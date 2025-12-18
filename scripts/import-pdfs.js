// scripts/import-pdfs.js
const ATLAS_URI = 'mongodb+srv://damon5185:d4a1m13o15n14@clustersearchpdf.37gzhel.mongodb.net/?appName=ClusterSearchPdf';
// ES Module imports (changed from require)
import fs from 'fs/promises';
import path from 'path';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { MongoClient } from 'mongodb';
import readline from 'readline';
// CHANGED: Added ES module imports for __dirname replacement
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// CHANGED: ES module replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let client;
let db;

// Configure PDF.js for Node environment
GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs'; 

// Create a custom Node.js compatible document loader
const NodeCanvasFactory = {
  create: function(width, height) {
    return {
      width,
      height,
      getContext: function() {
        return {
          // Stub methods that might be called but aren't needed for text extraction
          scale: function() {},
          translate: function() {},
          transform: function() {},
          beginPath: function() {},
          moveTo: function() {},
          lineTo: function() {},
          closePath: function() {},
          stroke: function() {},
          fill: function() {},
          measureText: function() { return { width: 0 }; },
          fillText: function() {},
          restore: function() {},
          save: function() {},
          rect: function() {},
          clip: function() {}
        };
      },
      toBuffer: function() { return null; }
    };
  }
};

// Atlas connection function
async function connect() {
  if (db) return db;
  
  client = new MongoClient(ATLAS_URI);
  await client.connect();
  console.log('Connected to MongoDB Atlas');
  
  db = client.db('pdf_search_db');
  return db;
}

// Close connection function
async function close() {
  console.log("Closing MongoDB Atlas connection");
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

// Function to prompt user for input
function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toUpperCase());
    });
  });
}

// Function to clear existing data from collections
async function clearCollections() {
  const database = await connect();
  const booksCollection = database.collection('books');
  const pagesCollection = database.collection('pages');
  
  console.log('\nClearing existing data...');
  
  const booksResult = await booksCollection.deleteMany({});
  const pagesResult = await pagesCollection.deleteMany({});
  
  console.log(`Deleted ${booksResult.deletedCount} books and ${pagesResult.deletedCount} pages.`);
}

// Function to extract table of contents from multiple pages
// Returns array of TOC entries
function extractTableOfContents(allPageTexts) {
  const tocEntries = [];
  let tocReached = false;
  
  console.log(`  🔍 Scanning ${allPageTexts.length} pages for TOC...`);
  
  // Roman numeral pattern (i, ii, iii, iv, v, vi, vii, viii, ix, x, etc.)
  const romanNumeralPattern = /\b([ivxlcdm]+)\b/i;
  
  for (let pageIdx = 0; pageIdx < allPageTexts.length; pageIdx++) {
    const pageText = allPageTexts[pageIdx];
    const lines = pageText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log(`\n  📖 Page ${pageIdx + 1}: Checking ${lines.length} lines...`);
    
    // Check if this page has TOC marker, dot leader pattern, or roman numerals
    let hasTocMarker = false;
    let hasDotLeaderPattern = false;
    let hasValidRomanNumerals = false;
    
    for (const line of lines) {
      // Check for TOC marker
      if (/table\s+of\s+contents|^contents$/i.test(line)) {
        hasTocMarker = true;
        tocReached = true;
        console.log(`  ✅ Found TOC marker: "${line}"`);
        break;
      }
      
      // Check for dot leader pattern: 2+ dots followed by number
      // Pattern: text ... (dots) ... number
      if (/\.{2,}\s*\d+\s*$/.test(line)) {
        hasDotLeaderPattern = true;
        break;
      }
    }
    
    // Check for valid roman numerals (only if on multiple lines or with dots/numbers)
    if (tocReached && !hasTocMarker) {
      // Count how many lines have roman numerals
      let romanNumeralCount = 0;
      let hasRomanWithDotsOrNumbers = false;
      
      for (const line of lines) {
        if (romanNumeralPattern.test(line)) {
          romanNumeralCount++;
          
          // Check if this line also has dots or ends with a number (TOC format)
          if (/\.{2,}/.test(line) || /\d+\s*$/.test(line)) {
            hasRomanWithDotsOrNumbers = true;
          }
        }
      }
      
      // Valid if: multiple roman numerals OR roman numerals with dots/page numbers
      hasValidRomanNumerals = romanNumeralCount > 1 || hasRomanWithDotsOrNumbers;
      
      if (hasValidRomanNumerals) {
        console.log(`  ✅ Found valid roman numerals (count: ${romanNumeralCount}, withDots: ${hasRomanWithDotsOrNumbers})`);
      }
      
      // Also check for dot leader pattern
      hasDotLeaderPattern = lines.some(line => /\.{2,}\s*\d+\s*$/.test(line));
    }
    
    // Add all lines from this page if it has TOC marker, dot leader pattern, or valid roman numerals
    if (hasTocMarker || (tocReached && (hasDotLeaderPattern || hasValidRomanNumerals))) {
      console.log(`  ✅ Page ${pageIdx + 1} is TOC page (marker: ${hasTocMarker}, dots: ${hasDotLeaderPattern}, roman: ${hasValidRomanNumerals})`);
      
      for (const line of lines) {
        // Skip the "Table of Contents" header itself and page numbers alone
        if (!/^table\s+of\s+contents$|^contents$|^\d+$/i.test(line) && line.length > 2) {
          tocEntries.push(line);
          console.log(`    📄 Added: "${line.substring(0, 60)}..."`);
        }
      }
    } else if (tocReached && !hasDotLeaderPattern && !hasValidRomanNumerals) {
      // TOC has ended if we were in TOC but no dot pattern or valid roman numerals found
      console.log(`  🛑 TOC ended at page ${pageIdx + 1}`);
      break;
    }
  }
  
  console.log(`\n  📊 Total TOC entries collected: ${tocEntries.length}`);
  return tocEntries;
}

// Direct database operations (replacing model calls)
const bookModel = {
  async upsertBook(bookData) {
    const database = await connect();
    const collection = database.collection('books');
    
    const { subject, bookTitle } = bookData;
    
    return collection.updateOne(
      { subject, bookTitle },
      { $set: { ...bookData, updatedAt: new Date() } },
      { upsert: true }
    );
  }
};

const pageModel = {
  async upsertPage(pageData) {
    const database = await connect();
    const collection = database.collection('pages');
    
    const { subject, bookTitle, pageNum } = pageData;
    
    return collection.updateOne(
      { subject, bookTitle, pageNum },
      { $set: { ...pageData, updatedAt: new Date() } },
      { upsert: true }
    );
  },

  async createIndexes() {
    const database = await connect();
    const pagesCollection = database.collection('pages');
    
    // Create compound index for quick lookups
    await pagesCollection.createIndex({ subject: 1, bookTitle: 1, pageNum: 1 }, { unique: true });
    
    // Create text index for efficient searching
    await pagesCollection.createIndex({ text: 1 });
    
    console.log('Page indexes created');
  }
};

// Main import function
async function importPdfs() {
  try {
    // Prompt user for append or clear mode
    const response = await promptUser('Will this DB data be appended? (Y/N): ');
    
    // Connect to MongoDB Atlas
    await connect();
    
    // If user chose 'N', clear existing data
    if (response === 'N') {
      await clearCollections();
    } else if (response === 'Y') {
      console.log('\nAppending to existing data...');
    } else {
      console.log('\nInvalid response. Defaulting to append mode.');
    }
    
    // Create necessary indexes
    await pageModel.createIndexes();
    
    // Get all directories (subjects)
    // CHANGED: Now uses ES module __dirname replacement
    const baseDir = path.join(__dirname, '..');
    
    // Specify the subject folders we're looking for
    const subjectFolders = ['ProgramLanguages', 'Philosophy', 'Art', 'Psychology'];
    const subjects = [];
    
    // Check if each subject folder exists
    for (const folder of subjectFolders) {
      const folderPath = path.join(baseDir, folder);
      try {
        const stat = await fs.stat(folderPath);
        if (stat.isDirectory()) {
          subjects.push(folder);
        }
      } catch (error) {
        console.log(`Subject folder "${folder}" not found, skipping.`);
      }
    }
    
    console.log(`Found ${subjects.length} subjects: ${subjects.join(', ')}`);
    
    // Process each subject
    for (const subject of subjects) {
      console.log(`\nProcessing subject: ${subject}`);
      const subjectPath = path.join(baseDir, subject);
      
      // Get all PDF files in the subject folder
      const files = await fs.readdir(subjectPath);
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
      
      console.log(`Found ${pdfFiles.length} PDF files in ${subject}`);
      
      // Process each PDF file
      for (const pdfFile of pdfFiles) {
        const bookTitle = path.basename(pdfFile, '.pdf');
        console.log(`\nProcessing book: ${bookTitle}`);
        
        // Process the PDF pages
        try {
          const pdfPath = path.join(subjectPath, pdfFile);
          const dataBuffer = await fs.readFile(pdfPath);
          
          // Configure PDF.js with Node.js friendly options
          // CHANGED: Updated to use getDocument from named import
          const loadingTask = getDocument({
            data: new Uint8Array(dataBuffer),
            canvasFactory: NodeCanvasFactory,
            disableFontFace: true,
            nativeImageDecoderSupport: 'none'
          });
          
          // Load the PDF
          const pdf = await loadingTask.promise;
          const numPages = pdf.numPages;
          
          console.log(`PDF has ${numPages} pages. Extracting text...`);
          
          // Store all page texts for TOC extraction
          const allPageTexts = [];
          
          // Process each page
          for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            try {
              // Get the page
              const page = await pdf.getPage(pageNum);
              
              // Extract text content
              const textContent = await page.getTextContent();
              
              // For regular search: join with spaces
              const pageText = textContent.items.map(item => item.str).join(' ');
              
              // For TOC extraction: preserve line breaks based on Y-coordinates
              if (pageNum <= 30) {
                let pageTextWithLines = '';
                let lastY = null;
                
                for (const item of textContent.items) {
                  const currentY = item.transform[5]; // Y-coordinate
                  
                  // If Y changed significantly, it's a new line
                  if (lastY !== null && Math.abs(currentY - lastY) > 2) {
                    pageTextWithLines += '\n';
                  }
                  
                  pageTextWithLines += item.str + ' ';
                  lastY = currentY;
                }
                
                allPageTexts.push(pageTextWithLines);
              }
              
              // Store page in MongoDB
              await pageModel.upsertPage({
                subject,
                bookTitle,
                pageNum,
                text: pageText,
                importedAt: new Date()
              });
              
              if (pageNum % 10 === 0 || pageNum === numPages) {
                console.log(`Processed ${pageNum}/${numPages} pages of ${bookTitle}`);
              }
            } catch (error) {
              console.error(`Error processing page ${pageNum} of ${bookTitle}:`, error);
            }
          }
          
          // Extract table of contents from the collected pages
          console.log('\n📚 Extracting table of contents...');
          const tableOfContents = extractTableOfContents(allPageTexts);
          
          if (tableOfContents.length > 0) {
            console.log(`\n✅ Found TOC with ${tableOfContents.length} entries!`);
          } else {
            console.log(`\n⚠️  No TOC found in first 20 pages`);
          }
          
          // Store book information with TOC (if found)
          if (tableOfContents.length > 0) {
            console.log(`💾 Saving book with TOC to database...`);
            await bookModel.upsertBook({
              subject,
              bookTitle,
              fileName: pdfFile,
              tableOfContents,
              importedAt: new Date()
            });
            console.log(`✅ Book saved with ${tableOfContents.length} TOC entries`);
          } else {
            console.log(`⚠️  No TOC found, saving book without TOC...`);
            await bookModel.upsertBook({
              subject,
              bookTitle,
              fileName: pdfFile,
              importedAt: new Date()
            });
            console.log(`✅ Book saved without TOC`);
          }
        } catch (error) {
          console.error(`Error processing PDF ${pdfFile}:`, error);
        }
      }
    }
    
    console.log('\nImport completed successfully!');
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    // Close MongoDB connection
    await close();
  }
}

// Run the import
importPdfs().catch(console.error);