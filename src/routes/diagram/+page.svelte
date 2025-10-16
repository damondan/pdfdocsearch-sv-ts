<script lang="ts">
  import Mermaid from '$lib/components/Mermaid.svelte';
  
  // Define your diagrams
  const componentDiagramDef = `
  graph TB
     subgraph "GitHub Pages"
         PORT[Portfolio Website<br/>portfolioDD76JS] 
     end

     subgraph "Railway Hosting"
         subgraph "SvelteKit App (pdfdocsearch-sv-ts)"
             A[SearchBar.svelte] --> B[+page.svelte]
             C[PdfBlock.svelte] --> B
             P[PdfBookResult.js] --> B
             ST[store.js] --> A
             ST --> B
             
             subgraph "API Routes"
                 API1["api/searchquery/+server.ts"]
                 API2["api/pdf-titles/+server.ts"] 
                 API3["api/subjects/+server.ts"]
             end
             
             subgraph "Database Models"
                 H[db/models/book.ts]
                 I[db/models/page.ts]
                 CONN[db/mongodb.ts]
             end
         end
     end
 
     subgraph "MongoDB Atlas"
         J[(Database<br/>books & pages collections)]
     end
 
     subgraph "Setup Process"
         ADMIN[Admin runs:<br/>node scripts/import-pdfs.js]
         K[scripts/import-pdfs.js]
     end

     PORT --"User clicks link"--> B
     B --"Internal requests"--> API1
     B --"Internal requests"--> API2
     B --"Internal requests"--> API3
     API1 --> CONN
     API2 --> CONN
     API3 --> CONN
     CONN --> H
     CONN --> I
     H --"Queries"--> J
     I --"Queries"--> J
     ADMIN --> K
     K --"Imports PDF data"--> J
  `;
  // %% Custom Styling
  //   style A fill:#f9f,stroke:#333,stroke-width:2px
  //   style B fill:#ff9,stroke:#333,stroke-width:2px
  //   style E fill:#9f9,stroke:#333,stroke-width:2px
  //   style J fill:#9ff,stroke:#333,stroke-width:2px
  
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