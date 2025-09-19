// scripts/import-pdfs.js
const ATLAS_URI = 'mongodb+srv://damon5185:gxq6uwm3U2fnMR1o@clustersearchpdf.37gzhel.mongodb.net/?retryWrites=true&w=majority&appName=ClusterSearchPdf';
const fs = require('fs').promises;
const path = require('path');
const pdfjsLib = require('pdfjs-dist');
const { MongoClient } = require('mongodb');

let client;
let db;

// Configure PDF.js for Node environment
pdfjsLib.GlobalWorkerOptions.workerSrc = ''; 

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
    // Connect to MongoDB Atlas
    await connect();
    
    // Create necessary indexes
    await pageModel.createIndexes();
    
    // Get all directories (subjects)
    const baseDir = path.join(__dirname, '..');
    
    // Specify the subject folders we're looking for
    const subjectFolders = ['ProgramLanguages'];
   // const subjectFolders = ['Jung', 'ProgramLanguages', 'NonFiction'];
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
        
        // Store book information
        await bookModel.upsertBook({
          subject,
          bookTitle,
          fileName: pdfFile,
          importedAt: new Date()
        });
        
        // Process the PDF pages
        try {
          const pdfPath = path.join(subjectPath, pdfFile);
          const dataBuffer = await fs.readFile(pdfPath);
          
          // Configure PDF.js with Node.js friendly options
          const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(dataBuffer),
            canvasFactory: NodeCanvasFactory,
            disableFontFace: true,
            nativeImageDecoderSupport: 'none'
          });
          
          // Load the PDF
          const pdf = await loadingTask.promise;
          const numPages = pdf.numPages;
          
          console.log(`PDF has ${numPages} pages. Extracting text...`);
          
          // Process each page
          for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            try {
              // Get the page
              const page = await pdf.getPage(pageNum);
              
              // Extract text content
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => item.str).join(' ');
              
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