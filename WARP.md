# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **PDF Document Search Application** built with SvelteKit and TypeScript that allows users to search through PDF documents stored in MongoDB Atlas. The application extracts text from PDFs and provides full-text search capabilities across multiple documents organized by subject categories.

### Key Features
- PDF text extraction and indexing via Node.js script
- MongoDB Atlas integration with text search
- Subject-based PDF organization (ProgramLanguages, NonFiction, Jung)
- Full-text search with sentence extraction and highlighting
- Bulk PDF selection and search result downloading
- Responsive UI with tabbed interface (PDFs/Results)

## Architecture

### Frontend (SvelteKit)
- **Main Route**: `/src/routes/+page.svelte` - Primary search interface with tabs
- **Components**: 
  - `SearchBar.svelte` - Handles search input and PDF selection
  - `PdfBlock.svelte` - Displays individual search results
  - `Mermaid.svelte` - Diagram visualization component
- **Store**: Global reactive state management in `src/lib/store.ts`
- **Types**: Comprehensive TypeScript interfaces in `src/lib/types.ts`

### Backend Architecture
- **Database Models**: 
  - `src/db/models/book.ts` - Book metadata operations
  - `src/db/models/page.ts` - Page content and search operations
- **API Routes**:
  - `src/routes/api/searchquery/+server.ts` - Main search endpoint
  - Server-side data loading via `+page.server.ts`
- **MongoDB Connection**: Cached connection pattern in `src/db/mongodb.ts`

### Data Import System
- **PDF Processing**: `scripts/import-pdfs.js` - Extracts text from PDFs using pdf.js
- **Storage Structure**: PDFs organized in subject folders at project root
- **Database**: Two collections - `books` (metadata) and `pages` (text content)

### Configuration
- **SvelteKit**: Uses Node.js adapter for server deployment
- **Build Tool**: Vite with TypeScript support
- **Testing**: Vitest with separate client/server test environments
- **Styling**: SCSS with W3.CSS framework

## Development Commands

### Essential Commands
```bash
# Install dependencies
pnpm install

# Development server
pnpm run dev
# or with browser auto-open
pnpm run dev -- --open

# Production build
pnpm run build

# Preview production build
pnpm run preview

# Type checking
pnpm run check
# Watch mode type checking
pnpm run check:watch
```

### Code Quality
```bash
# Format code
pnpm run format

# Lint code (format + ESLint)
pnpm run lint
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:unit

# Run tests with UI
pnpm exec vitest --ui
```

### Database Operations
```bash
# Import PDFs to MongoDB (requires PDF files in subject folders)
node scripts/import-pdfs.js
```

### Single Test Execution
```bash
# Run specific test file
pnpm exec vitest src/routes/page.svelte.test.ts

# Run tests matching pattern
pnpm exec vitest --run demo
```

## MongoDB Atlas Configuration

The application uses MongoDB Atlas. Currently, the connection strings are temporarily hardcoded in:
- `src/db/mongodb.ts` (main app)
- `scripts/import-pdfs.js` (import script)

### Development vs Production Setup
- **Development**: MongoDB connection is hardcoded for quick iteration and testing
- **Production**: Uncomment the `process.env.MONGODB_URI` usage in `mongodb.ts` and use environment variables from `.env.example`
- Before deployment, revert the hardcoded values to use `process.env.MONGODB_URI` and `process.env.MONGODB_DATABASE`

### Expected Collections
- `books`: Store PDF metadata (subject, bookTitle, fileName, importedAt)
- `pages`: Store extracted text (subject, bookTitle, pageNum, text, importedAt)

### Required Indexes
- Pages collection: Compound index on `{subject, bookTitle, pageNum}` (unique)
- Pages collection: Text index on `text` field for search

## Project Structure Requirements

### PDF Organization
PDFs should be organized in subject folders at project root:
```
/ProgramLanguages/
/NonFiction/
/Jung/
```

### Environment Variables
The `.env.example` shows the expected environment variables for production deployment:
```
VITE_API_URL_GETPDFTITLES=http://localhost:3001/api/pdf-titles
VITE_API_URL_SEARCHQUERY=http://localhost:3001/api/searchquery
VITE_API_URL_GETSUBJECTS=http://localhost:3001/api/subjects
```

## Important Implementation Notes

### State Management
- Uses Svelte 5 runes (`$state`, `$derived`, `$effect`) for reactive state
- Global search query managed via Svelte stores
- Complex parent-child component communication via custom events

### Search Flow
1. User selects subject → loads available PDF titles
2. User checks desired PDFs → enables search
3. Search executes → extracts relevant sentences from matching pages
4. Results displayed in blocks with full page text available on click
5. Users can select results for bulk download

### PDF Processing Limitations
- PDF import script requires specific folder structure
- Uses pdf.js for text extraction (Node.js compatible configuration)
- Limited to 25 PDFs per search for performance

## Testing Strategy

### Vitest Configuration
- **Client tests**: Run in jsdom environment for Svelte components
- **Server tests**: Run in Node.js environment for API routes and database operations
- **Setup**: Custom client setup in `vitest-setup-client.ts`

### Test File Patterns
- Component tests: `*.svelte.{test,spec}.{js,ts}`
- Server tests: `*.{test,spec}.{js,ts}` (excluding Svelte files)
- Demo test: `src/demo.spec.ts`