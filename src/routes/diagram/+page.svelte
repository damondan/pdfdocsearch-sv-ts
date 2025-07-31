<script lang="ts">
  import Mermaid from '$lib/components/Mermaid.svelte';
  
  // Define your diagrams
  const componentDiagramDef = `
  graph TB
     subgraph "Frontend (SvelteKit)"
         A[SearchBar.svelte] --> B[+page.svelte]
         C[PdfBlock.svelte] --> B
         P[PdfBookResult.js] --> B
         ST[store.js] --> A
         ST --> B
     end
 
     subgraph "Backend (Node.js)"
         D[server.js] --> E[api.js]
         E --> F[logic.js]
         F --> G[db/connection.js]
         G --> H[db/models/book.js]
         G --> I[db/models/page.js]
     end
 
     subgraph "Database"
         J[(MongoDB)]
     end
 
    DUMMY[Admin - In Terminal load pdfs with command 
    node scripts/import-pdfs.js ] --> K[scripts/import-pdfs.js]

    subgraph "PDF Import"
      K[scripts/import-pdfs.js] --> G
      K --> H
      K --> I
	  end

     B --"HTTP Requests"--> E
     H --"Queries"--> J
     I --"Queries"--> J
  `;
  // %% Custom Styling
  //   style A fill:#f9f,stroke:#333,stroke-width:2px
  //   style B fill:#ff9,stroke:#333,stroke-width:2px
  //   style E fill:#9f9,stroke:#333,stroke-width:2px
  //   style J fill:#9ff,stroke:#333,stroke-width:2px
  const sequenceDiagramDef = `
  sequenceDiagram
     actor User
     participant Frontend as SvelteKit Frontend
     participant API as Node.js API
     participant DB as MongoDB
     
     User->>Frontend: Select Subject
     Frontend->>API: GET /api/pdf-titles/:subject
     API->>DB: Query books by subject
     DB-->>API: Return book titles
     API-->>Frontend: JSON response with titles
     Frontend-->>User: Display PDF titles
     
     User->>Frontend: Select PDF books & enter search term
     User->>Frontend: Click Search
     Frontend->>API: POST /api/searchquery
     API->>DB: Query pages by subject,<br/>book titles, and search term
     DB-->>API: Return matching pages
     API-->>Frontend: JSON response with results
     Frontend-->>User: Display search results
  `;

const entityDiagramDef = `
  %%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#ffffff', 'primaryTextColor': '#000000', 'primaryBorderColor': '#000000', 
  'lineColor': '#000000', 'secondaryColor': '#ffffff', 'tertiaryColor': '#ffffff' }}}%%
classDiagram
	class PdfBookResult {
		+String _bookTitle
		+Number _pageNum
		+String _sentence
		+String _pageText
		+Boolean _isChecked
		+toString()
	}
    
	class Store {
		+Writable searchQueryWritable
		+Writable previousSearchesWritable
	}
    
	class SearchBar {
		+String searchQuery
		+String selectedSubject
		+Array pdfBookTitles
		+Boolean showDropdown
		+Boolean loading
    +Number pdfLimit
		+handleSearchDispatch()
		+handleInputClick()
		+handleSelectSearch()
		+handleInputKeydown()
		+updateSearch()
	}
    
	class PageSvelteMain{
		+String selectedSubject
		+Array setDataPdfSubjects
		+Writable pdfBooksGetFromSubject
		+Array pdfBookCheckFromPdfTab
		+Object mySearchData
		+Boolean isLoading
		+Array pdfBooksRetFromSearch
		+Array pdfBooksAsResultObjects
		+String activeTab
		+Array checkedResults
		+Boolean isCheckAll
    +Number totalCount
    +openTab()
		+handleSubjectChange()
		+handleLoadPdfTitlesFromSubject()
		+handleLoadingChange()
		+handleLoadPdfDataFromPdfTab()
		+handleDownloadPdfsForPdfBlock()
		+findSentenceForPdfPage()
		+handleCheckboxChangeForPdfBlock()
		+handleCheckAll()
    +handleDeleteForPdfBlock()
    +showTotalCount
	}
    
	class PdfBlock {
		+PdfBookResult result
		+Boolean isExpanded
		+Boolean checked
		+handleBlockClick()
		+handleCheckboxChangeDispatch()
		+handleDeleteDispatch()
	}
    
	Store --> SearchBar : provides state
	Store --> PageSvelteMain : provides state
	PageSvelteMain --> SearchBar : passes props
	PageSvelteMain --> PdfBlock : passes props
	PageSvelteMain "1" o-- "many" PdfBookResult : contains
	PdfBlock "1" -- "1" PdfBookResult : displays`;

</script>

<!-- Use a completely independent container -->
<div class="diagram-page">
  <nav class="routing-d">
    <a href="/" data-sveltekit-preload-data="off">home</a>
    <a href="/diagram" data-sveltekit-preload-data="off">diagram</a>
  </nav>
  
  <div class="content">
    <h1>PDF Search Application Architecture</h1>
    
    <section class="diagram-section">
      <h2>Component Diagram</h2>
      <div class="diagram-box">
        <Mermaid definition={componentDiagramDef} type="component"/>
      </div>
    </section>
        <section class="diagram-section">
      <h2>Sequence Diagram</h2>
      <div class="diagram-container">
        <pre class="mermaid">
          <Mermaid definition={sequenceDiagramDef} type="sequence"/>
        </pre>
      </div>
    </section>

    <section class="diagram-section">
      <h2>Entity Diagram</h2>
      <div class="diagram-container">
        <pre class="mermaid">
          <Mermaid definition={entityDiagramDef} type="entity"/>
        </pre>
      </div>
    </section>
  </div>
</div>

<style lang="scss">
/* Reset any inherited styles */
:global(body), :global(html) {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow-x: hidden;
}

/* Independent layout for diagram page */
.diagram-page {
  display: flex;
  flex-direction: column; /* Force a column layout */
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(180deg, #2196f3, #f5f5f5);
  
  /* Change these positioning attributes */
  position: fixed; /* Change from absolute to fixed */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto; /* Allow scrolling within the fixed container */
  
  /* Rest of your styles remain the same */
}
  
  .routing-d {
    width: 100%; /* Force full width */
    padding: 10px;
    box-sizing: border-box;
    a {
      font-family: Comic sans MS;
      font-size: 20px;
      font-weight: 700;
      text-decoration: none;
      color: black;
      padding: 5px;
      transition: all 0.3s ease;
      &:hover {
        color: white;
        background-color: #007bff;
        border-radius: 4px;
      }
    }
  }
  
  .content {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    h1, h2 {
      font-family: Comic sans MS;
      color: #333;
      text-align: center;
    }
    h1 {
      margin-bottom: 30px;
    }
  }
  
  .diagram-section {
    width: 100%;
    max-width: 1000px; /* Control maximum width */
    margin-bottom: 40px;
  }
  
  .diagram-box {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    width: 100%;
    overflow-x: auto;
  }

</style>