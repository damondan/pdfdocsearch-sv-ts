<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import type { Writable } from "svelte/store";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import PdfBlock from "$lib/components/PdfBlock.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import { PdfBookResult } from "$lib/classes/PdfBookResult";
  import { searchQueryWritable } from "$lib/store";
  import type { ISearchData } from "$lib";
  import type { BookWithTOC } from '$lib/types.ts';

  let selectedSubject = $state("");
  let { data }: { data: { dataPdfSubjects: string[] } } = $props();
  let setDataPdfSubjects: string[] = $state(data.dataPdfSubjects);
  let pdfBooksGetFromSubject: Writable<BookWithTOC[]> = writable([]);
  let pdfBookCheckFromPdfTab: string[] = $state([]);
  let mySearchData = $state<ISearchData | string>({
    message: "",
    results: null,
    total: 0,
  });
  let isLoading: boolean = $state(false);
  let pagesReturned_pdfBookResults: (PdfBookResult | null)[] = $state([]);
  let pagesReturnedFromSearch_pdfBookResults: (PdfBookResult | null)[] = $state(
    [],
  );
  let activeTab: string = $state("pdfs");
  let checkedResultsGroup: PdfBookResult[] = $state([]);
  let isCheckAllResults: boolean = $state(false);
  let isCheckAll: boolean = $state(false);
  let pdfLimit: number = 25;
  let expandedBookTitle: string | null = $state(null);
  let totalCount = $derived(pagesReturned_pdfBookResults.length / 3);

  function getCarouselGroupForMatch(
    allResults: (PdfBookResult | null)[],
    matchIndex: number,
  ): (PdfBookResult | null)[] {
    //was PdfBookResult
    return [
      allResults[matchIndex - 1] || null,
      allResults[matchIndex],
      allResults[matchIndex + 1] || null,
    ];
  }

  // onMount - receives passed { data } = $props(); from +page.server.js - setDataPdfSubjects
  // - these are Pdf subjects and the first in the array is chosen to call the async
  // function handleLoadPdfTitlesFromSubject(selectedSubject)
  onMount(() => {
    if (setDataPdfSubjects.length > 0) {
      console.log("In onMount");
      setDataPdfSubjects = [...setDataPdfSubjects].reverse();
      console.log("setDataPdfSubjects is " + setDataPdfSubjects);
      selectedSubject = setDataPdfSubjects[0]; // Set default to the first subject

      // Automatically trigger the fetch for the first subject
      handleLoadPdfTitlesFromSubject(selectedSubject);
    }
  });

  function openTab(tabName: string): void {
    console.log("Open tab:", tabName);
    activeTab = tabName;
  }

  function handleSubjectChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const subject: string = target.value;
    selectedSubject = subject;

    if (subject) {
      // Trigger fetching based on subject
      handleLoadPdfTitlesFromSubject(subject);
    } else {
      pdfBooksGetFromSubject.set([]); // Clear the PDF books if no subject is selected
    }
  }

  //handleLoadPdfTitlesFromSubject - takes a subject as argument and calls the node.js
  //docker container api to return just the titles of those pdf books by subject which
  //is the folder name.
  async function handleLoadPdfTitlesFromSubject(
    subject: string,
  ): Promise<void> {
    try {
      pagesReturned_pdfBookResults = [];
      const response = await fetch(`/api/pdf-titles/${subject}`);
      // Assuming the response is an array of BookWithTOC
      const data: BookWithTOC[] = await response.json();

      pdfBooksGetFromSubject.set(data || []);
    } catch (error) {
      console.error("Error fetching PDF titles:", error);
    }
  }

  //This refers to the spinner - it is a callback function passed to the SearchBar component
  //SearchBar component calls - onloadingChange?.(loading); loading is a boolean.
  //Below there is an - if isLoading is true or false which displays the spinner.
  function handleLoadingChange(loading: boolean): void {
    isLoading = loading;
  }

  function cleanTextSpacing(text: string): string {
    if (!text) return text;

    let cleaned = text.replace(
      /\b(\w)\s+(?=\w)/g,
      (match, char, offset, string) => {
        const nextChar = string[offset + match.length];
        if (
          nextChar &&
          nextChar === nextChar.toLowerCase() &&
          char.length === 1
        ) {
          return char; // Remove the space
        }
        return match; // Keep the space (it's a normal word boundary)
      },
    );

    // Second, collapse multiple consecutive spaces into a single space
    cleaned = cleaned.replace(/\s{2,}/g, " ");

    return cleaned.trim();
  }

  //This is a callback function passed to the SearchBar child component.
  //In SearchBar component - onsearchResults?.(result);
  //The result is passed as an argument and when that variable is set with the results,
  //it executes the below function with the data in results. mySearchData, being json data,
  //is taken in by mySearchData, which uses 2 interfaces to configure with the json data.
  //Lastly, it steps through the array to input the pdf attributes into creating a
  //PdfBookResult object that is than stored into a pdfBooksAsResultObjects array.
  function handleLoadPdfBlockData(data: ISearchData | string): void {
    mySearchData = data;
    //console.log('Received search results in parent(mySearchData):', mySearchData);

    // Clear checkedResults when a new search is performed
    checkedResultsGroup = [];
    isCheckAllResults = false;
    //console.log('Cleared checkedResults for new search');

    // Type guard to check if it's a string
    if (typeof mySearchData === "string") {
      // Handle string cases
      if (mySearchData === "noSearchTermAndNoPdfs") {
        //console.log('Both search term and PDFs are missing');
        alert("Add a Search Word and choose a Pdf book/books");
      } else if (mySearchData === "noPdfCheckBoxesChecked") {
        //console.log('NO Pdfs chosen');
        alert("Choose a Pdf.");
      } else if (mySearchData === "pdfsOverLimit") {
        alert("Pdf book search limit is " + pdfLimit);
      } else if (mySearchData === "noSearchTerm") {
        //console.log('No search term provided');
        alert("Add a Search Term");
      }
      return;
    }

    if (
      mySearchData.results != null &&
      Object.keys(mySearchData.results).length > 0
    ) {
      let pagesReturned_arrayISearchData: any = undefined;
      pagesReturned_arrayISearchData = Object.keys(mySearchData.results);
      pagesReturned_pdfBookResults = [];
      if (pagesReturned_arrayISearchData != null) {
        for (let i = 0; i < pagesReturned_arrayISearchData.length; i++) {
          const carouselItems =
            mySearchData.results[pagesReturned_arrayISearchData[i]];
          const bookTitle = pagesReturned_arrayISearchData[i];

          // Iterate through carousel array which may contain null values
          for (const item of carouselItems) {
            if (item === null) {
              // Add null placeholder to maintain carousel structure
              pagesReturned_pdfBookResults.push(null as any);
            } else {
              const { pageNum, text } = item;
              //const cleanedText = cleanTextSpacing(text);
              const sentence = findSentenceForPdfPage(
                text,
                $searchQueryWritable,
              );
              //console.log('Book title strings ' + bookTitle);
              pagesReturned_pdfBookResults.push(
                new PdfBookResult(bookTitle, pageNum, sentence, text),
              );
            }
          }
        }
      } else {
        pagesReturned_pdfBookResults = [];
        //console.log('clearing pdfBooksAsResultObjects - else is null');
      }
    } else {
      alert("Search returned 0 for " + $searchQueryWritable);
    }
    pagesReturnedFromSearch_pdfBookResults =
      pagesReturned_pdfBookResults.filter((page, idx) => idx % 3 == 1);
  }

  //In clicking the Download button displayed in the Results tab, this function is executed. The checkedResults
  //data is initialized through the handleCheckboxChangeForPdfBlock function below. handleCheckboxChangeForPdfBlock is
  //an event listener for the +page.svelte component or parent to the PdfBlock component or child.
  //Below -> <PdfBlock {result} on:delete={handleDeleteForPdfBlock} on:change={(e) => handleCheckboxChangeForPdfBlock(result, e)}
  //checkedResults is formatted below to set the downloaded text in a more readable manner.
  async function handleDownloadPdfsForPdfBlock(): Promise<void> {
    console.log("In handleDownloadPdfsForPdfBlock");
    console.log("Checked Results length is " + checkedResultsGroup.length);
    if (checkedResultsGroup.length === 0) {
      alert("Please select at least one PDF block to download");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const defaultFilename = `${$searchQueryWritable}-${today}-docsveltedwnld.txt`;

    const checkedPages: Array<{
      bookTitle: string;
      pageNum: number;
      text: string;
    }> = [];

    // Get references to all PdfBlock components and collect checked pages from their carousels
    const pdfBlockElements = document.querySelectorAll(".pdf-block");
    let blockIdx = 0;
    console.log("checkedBlocks is length " + pdfBlockElements.length);
    console.log(
      "pdfBooksAsResultObjects.length is " +
        pagesReturned_pdfBookResults.length,
    );

    // Iterate through all results to find match pages and get their carousel checked state
    for (let idx = 0; idx < pagesReturned_pdfBookResults.length; idx++) {
      if (idx % 3 === 1) {
        // This is a match page
        const matchResult = pagesReturned_pdfBookResults[idx];

        // Skip if matchResult is null
        if (matchResult === null) continue;

        // Check if the match result itself is in checkedResultsGroup
        console.log(
          "checkedResultsGroup length is " + checkedResultsGroup.length,
        );
        if (checkedResultsGroup.includes(matchResult)) {
          const carouselGroup = getCarouselGroupForMatch(
            pagesReturned_pdfBookResults,
            idx,
          );

          // Add all non-null pages from this carousel group
          for (const page of carouselGroup) {
            if (page) {
              checkedPages.push({
                bookTitle: matchResult.bookTitle,
                pageNum: page.pageNum,
                text: page.pageText,
              });
            }
          }
        }
      }
    }

    // Sort checked pages by pageNum and bookTitle to maintain order
    checkedPages.sort((a, b) => {
      if (a.bookTitle === b.bookTitle) {
        return a.pageNum - b.pageNum;
      }
      return a.bookTitle.localeCompare(b.bookTitle);
    });

    // Remove duplicates
    const uniqueCheckedPages = checkedPages.filter((page, index, array) => {
      if (index === 0) return true;
      const previous = array[index - 1];
      if (
        page.bookTitle === previous.bookTitle &&
        page.pageNum === previous.pageNum
      ) {
        return false;
      }
      return true;
    });

    const checkedResultsContent = uniqueCheckedPages
      .map(
        (page) => `${page.bookTitle}, Page ${page.pageNum}\n\n${page.text}\n`,
      )
      .join("\n");

    // Browser-based download (no Tauri)
    const blob = new Blob([checkedResultsContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    alert("File downloaded successfully!");
  }

  //handleCheckboxChangeForResults(result: PdfBookResult, checked: boolean): void
  //Callback from PdfBlock when individual checkbox is toggled.
  function handleCheckboxChangeForResults(
    result: PdfBookResult,
    checked: boolean,
  ): void {
    result.isChecked = checked;

    if (checked) {
      if (!checkedResultsGroup.includes(result)) {
        checkedResultsGroup = [...checkedResultsGroup, result];
      }
    } else {
      checkedResultsGroup = checkedResultsGroup.filter((r) => r !== result);
      if (isCheckAllResults) {
        isCheckAllResults = false;
      }
    }
  }

  //handleCheckAllResults(event: Event): void
	//Handles checking/unchecking all PdfBlock results in the Results tab.
	function handleCheckAllResults(event: Event): void {
		const target = event.target as HTMLInputElement;
		const checked = target.checked;

		// Update each result's checked state
		pagesReturned_pdfBookResults.forEach((result) => {
			if (result !== null) {
				result.isChecked = checked;
			}
		});

		// Force reactivity by reassigning the entire array with spread
		pagesReturned_pdfBookResults = [...pagesReturned_pdfBookResults];

		// Update checkedResultsGroup based on checked state
		if (checked) {
			checkedResultsGroup = pagesReturned_pdfBookResults.filter(
				(result) => result !== null
			) as PdfBookResult[];
		} else {
			checkedResultsGroup = [];
		}
	}

  //Used in handleLoadPdfDataFromPdfTab(event) to return the sentence within the page which
  //holds the searchQuery term. The sentence is placed initially in the PdfBlock as a quick
  //reference and in wanting to look further, can click on the block to open the full page.
  const findSentenceForPdfPage = (text: string, subject: string): string => {
    if (!text || !subject) return "No page text or sentence found";

    const errSubject = subject.toLowerCase();
    const sub = `\\b${subject}\\b`;

    const sentenceRegex = new RegExp(`[^.?!]*${sub}[^.?!]*(?:[.?!]|$)`, "gi");
    const match = sentenceRegex.exec(text);

    if (match) {
      return match[0].trim();
    } else {
      return `No sentence found containing "${errSubject}".`;
    }
  };

  //This checks all of the pdf book titles from the pdf tab.
  //<input type="checkbox" id="checkall-id" bind:checked={isCheckAll}
  //onchange={handleCheckAll}/>
  // If the Pdf tab is open, this checkbox will appear. isCheckAll is initialized on
  //change from a $derived rune functionality. If there is equality in the derived
  //attributes, the isAllChecked is updated to true, to than execute and update the
  //isCheckAll to true.
  function handleCheckAll(event: Event): void {
    const target = event.target as HTMLInputElement;

    isCheckAll = target.checked;

    if (isCheckAll) {
      pdfBookCheckFromPdfTab = $pdfBooksGetFromSubject.map(book => book.bookTitle);
    } else {
      pdfBookCheckFromPdfTab = [];
    }
  }

  function toggleBookExpansion(bookTitle: string): void {
    console.log('🔵 Toggle clicked for:', bookTitle);
    console.log('🔵 Current expandedBookTitle:', expandedBookTitle);
    console.log('🔵 All books:', $pdfBooksGetFromSubject);
    expandedBookTitle = expandedBookTitle === bookTitle ? null : bookTitle;
    console.log('🔵 New expandedBookTitle:', expandedBookTitle);
  }

  let isAllChecked = $derived(
    pdfBookCheckFromPdfTab.length === $pdfBooksGetFromSubject.length &&
      $pdfBooksGetFromSubject.length > 0,
  );
  $effect(() => {
    isCheckAll = isAllChecked;
  });

	function handleDeleteForPdfBlock(result: PdfBookResult): void {
		const idx = pagesReturned_pdfBookResults.indexOf(result);

		if (idx === -1 || idx % 3 !== 1) {
			return;
		}

		// Remove [previous, matched, next]
		pagesReturned_pdfBookResults.splice(idx - 1, 3);

		// Rebuild list containing only matched/current pages
		pagesReturnedFromSearch_pdfBookResults = pagesReturned_pdfBookResults.filter(
			(page, index): page is PdfBookResult => index % 3 === 1 && page !== null
		);
	}
</script>

<svelte:head>
  <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css" />
</svelte:head>

<div
  class="grid grid-cols-3 grid-rows-[auto_auto_auto_1fr_auto] gap-1 bg-gradient-to-b from-primary to-secondary p-1
min-h-screen relative [grid-template-areas:'routing_routing_routing'_'header_header_header'_'download-r-checkall-buttons_tab-bar_pdfsubjects-dropdnlist'_'tab-content_tab-content_tab-content'_'footer_footer_footer']"
>
  <!--If activeTab is results, show Download button and show Total Count for PdfBlock Results, else show the check all button for pdfs tab-->
  {#if activeTab == "results"}
   <div
			class="ml-[15%] flex flex-col items-start justify-start gap-2 pb-2 [grid-area:download-r-checkall-buttons] sm:flex-row sm:items-end"
		>
			<input
				type="checkbox"
				id="checkall-results-id"
				bind:checked={isCheckAllResults}
				onchange={handleCheckAllResults}
				class="shadow-soft mb-2 ml-5 h-5 w-5 scale-150 cursor-pointer"
			/>
      <input
        type="button"
        id="download-id"
        value="Download"
        onclick={handleDownloadPdfsForPdfBlock}
        class="text-base sm:text-lg md:text-xl lg:text-2xl text-white px-4 py-2 cursor-pointer border-[#333333]
        bg-[#3e228c] hover:bg-[#3206de] rounded-md ml-5 mb-1 font-comic shadow-soft"
      />
      <!-- <div
        class="total-count w-auto sm:w-36 h-auto sm:h-10 ml-5 sm:ml-0 rounded-md"
      >
        <p
          class="w-full text-black font-comic font-light text-base sm:text-lg md:text-xl lg:text-2xl text-left sm:text-center
           overflow-visible whitespace-nowrap m-0"
        >
          Results {totalCount}
        </p>
      </div> -->
    </div>
  {:else}
    <div
      class="[grid-area:download-r-checkall-buttons] flex justify-start items-end ml-[15%] pb-2"
    >
      <input
        type="checkbox"
        id="checkall-id"
        bind:checked={isCheckAll}
        onchange={handleCheckAll}
        class="w-5 h-5 scale-150 cursor-pointer ml-5 mb-2 shadow-soft"
      />
    </div>
  {/if}

  <!--If activeTab does not equal results and thus in pdfs tab, show Pdf Subject options-->
  {#if activeTab !== "results"}
    <div
      class="pdfsubjects-dropdnlist [grid-area:pdfsubjects-dropdnlist] text-base flex
       flex-col items-end justify-end mr-[15%] w-50 ml-auto"
    >
      <label
        for="pdf-options"
        id="pdf-label"
        class="pdf-label self-start mb-1 text-center w-full text-xl font-black
           font-comic tracking-wider2 text-gray-900">PDF Subjects:</label
      >
      <select
        onchange={handleSubjectChange}
        class="w-full p-1 border border-gray-300 rounded-md bg-gray-100 text-base sm:text-lg md:text-xl lg:text-2xl font-comic"
      >
        {#each setDataPdfSubjects as pdfSubject}
          <option
            id="pdfsubject"
            class="pdfsubject font-comic"
            value={pdfSubject}>{pdfSubject}</option
          >
        {/each}
      </select>
    </div>
    {:else}
		<div class="mb-4 flex w-full justify-end [grid-area:pdfsubjects-dropdnlist]">
			<div class="total-count mr-20 h-auto w-auto rounded-md sm:ml-0 sm:h-10 sm:w-36">
				<p
					class="font-comic text-red m-0 w-full overflow-visible text-right !text-base font-light whitespace-nowrap sm:text-center
           sm:!text-lg md:!text-xl lg:!text-2xl"
				>
					Results {totalCount}
				</p>
			</div>
		</div>
  {/if}

  <!--Title of App - Pdf Search TS, with SearchBar and spinner-->
  <div class="header [grid-area:header] text-blue-500 text-center">
    <h1
      class="font-comic text-6xl text-white tracking-wider font-normal"
      style="text-shadow: 0px 8px 8px rgba(0, 0, 0, 0.3);"
    >
      Pdf Search TS
    </h1>
    <SearchBar
      {selectedSubject}
      pdfBookTitles={pdfBookCheckFromPdfTab}
      onsearchResults={handleLoadPdfBlockData}
      onloadingChange={handleLoadingChange}
    />
    {#if isLoading}
      <div class="spinner-overlay tw-spinner-overlay">
        <div class="spinner custom-spinner"></div>
      </div>
    {/if}
  </div>

  <!--Tab bar with tab choices of Pdfs and Results-->
  <div
    class="tab-bar [grid-area:tab-bar] w-full flex justify-center bg-white
       h-10 rounded-md mt-2"
  >
    <div class="w3-row w-full rounded-md">
      <a href="javascript:void(0)" onclick={() => openTab("pdfs")}>
        <div
          class="w3-half tablink w3-bottombar w3-hover-light-grey w3-padding
          w-1/2 rounded-md text-base sm:text-lg md:text-xl lg:text-2xl font-comic tracking-wider2 font-normal bg-white
          text-center {activeTab === 'pdfs' ? 'active w3-border-green' : ''}"
        >
          Pdfs
        </div>
      </a>
      <a href="javascript:void(0)" onclick={() => openTab("results")}>
        <div
          class="w3-half tablink w3-bottombar w3-hover-light-grey w3-padding
          w-1/2 rounded-md text-base sm:text-lg md:text-xl lg:text-2xl font-comic tracking-wider2 font-normal bg-white
          text-center {activeTab === 'results' ? 'active w3-border-green' : ''}"
        >
          Results
        </div>
      </a>
    </div>
  </div>
  <!--Tab content area or either Pdfs or Results-->
  <div
    class="tab-content [grid-area:tab-content] w-[90%] ml-[5%] mr-[5%] bg-white p-2 rounded-lg mt-3"
  >
    <div
      id="pdfs"
      class="w3-container tab w-full max-w-full overflow-hidden"
      style:display={activeTab === "pdfs" ? "block" : "none"}
    >
      {#if $pdfBooksGetFromSubject.length > 0}
        <ul class="pdf-titles-list list-none p-0 m-0 text-left w-full">
          {#each $pdfBooksGetFromSubject as book}
            <li class="pdf-title-block mb-2 border-b border-gray-300 w-full max-w-full">
              <!-- DEBUG: Book data -->
              <!-- {JSON.stringify(book)} -->
              <div 
                class="flex items-start gap-2 pb-1 hover:bg-gray-100 w-full max-w-full cursor-pointer"
                onclick={() => toggleBookExpansion(book.bookTitle)}
                role="button"
                tabindex="0"
                style="color: {expandedBookTitle === book.bookTitle ? 'blue' : 'inherit'};"
              >
                <input
                  type="checkbox"
                  id={book.bookTitle}
                  class="pdf-title-item w-4 h-4 mt-1 scale-150 cursor-pointer flex-shrink-0"
                  bind:group={pdfBookCheckFromPdfTab}
                  value={book.bookTitle}
                  onclick={(e) => e.stopPropagation()}
                />
                <span
                  class="pdf-title-label text-base sm:text-lg md:text-xl lg:text-2xl font-bold
                font-comic tracking-wider2 break-words overflow-wrap-anywhere leading-tight flex-1
                min-w-0 max-w-full overflow-hidden"
                >{book.bookTitle}</span
                >
              </div>
              
              <!-- Expandable Table of Contents -->
              {#if expandedBookTitle === book.bookTitle && book.tableOfContents && book.tableOfContents.length > 0}
                <div class="toc-expansion bg-gray-50 p-4 mt-2 rounded border border-gray-200">
                  <h3 class="text-lg font-bold mb-2 font-comic">Book Context</h3>
                  <ul class="list-none p-0 m-0">
                    {#each book.tableOfContents as entry}
                      <li class="py-1 text-sm sm:text-base font-comic">{entry}</li>
                    {/each}
                  </ul>
                </div>
              {:else if expandedBookTitle === book.bookTitle && (!book.tableOfContents || book.tableOfContents.length === 0)}
                <div class="toc-expansion bg-gray-50 p-4 mt-2 rounded border border-gray-200">
                  <p class="text-gray-500 italic font-comic">No table of contents available for this book.</p>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <div
      id="results"
      class="w3-container tab w-full max-w-full overflow-hidden"
      style:display={activeTab === "results" ? "block" : "none"}
    >
      {#each pagesReturned_pdfBookResults as result, idx}
        <!-- Only show match pages (at indices 1, 4, 7... which is where idx % 3 === 1) and skip nulls -->
        {#if result !== null && idx % 3 === 1 && !result.sentence.includes("No sentence found containing")}
          {@const carouselGroup = getCarouselGroupForMatch(
            pagesReturned_pdfBookResults,
            idx,
          )}
          <PdfBlock
            {result}
            isChecked={checkedResultsGroup.includes(result)}
            oncheckchange={handleCheckboxChangeForResults}
            ondelete={handleDeleteForPdfBlock}
            {carouselGroup}
          />
        {/if}
      {/each}
    </div>
  </div>

  <div class="footer [grid-area:footer]">
    <Footer />
  </div>
</div>
