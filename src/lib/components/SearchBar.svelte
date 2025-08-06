<script lang="ts">
	import { browser } from '$app/environment';
	import { createEventDispatcher } from 'svelte';
	import { previousSearchesWritable, searchQueryWritable } from '$lib/store.js';

	let searchQuery: string = $state('');
	let { selectedSubject, pdfBookTitles } = $props();
	let showDropdown = $state(false);
	let loading: boolean = $state(false);
	const pdfLimit: number = 25;
	const dispatch = createEventDispatcher();

	// THis is a dispatch to the parent +page.svelte.
	// Replace the existing handleSearchDispatch function with this updated version:

// Replace the existing handleSearchDispatch function with this updated version:

async function handleSearchDispatch() {
	searchQueryWritable.set(searchQuery);
	
	const normPdfTitles: string[] = [...pdfBookTitles];
	console.log('normPdfTitles:', normPdfTitles, 'length:', normPdfTitles.length);

	// Check if both search query and PDFs are missing
	if (!searchQuery.trim() && normPdfTitles.length == 0) {
		console.error('Both search query and PDFs are missing');
		dispatch('searchResults', 'noSearchTermAndNoPdfs');
		return;
	}
	
	// Check if no PDFs are selected (but search query exists)
	if (normPdfTitles.length == 0) {
		dispatch('searchResults', 'noPdfCheckBoxesChecked');
		return;
	}
	
	// Check if PDFs are selected but no search query is provided
	if (!searchQuery.trim()) {
		console.error('Search query is empty but PDFs are selected');
		dispatch('searchResults', 'noSearchTerm');
		return;
	}

	// Check if too many PDFs are selected
	if (normPdfTitles.length > 25) {
		dispatch('searchResults', 'pdfsOverLimit');
		return;
	}

	updateSearch(searchQuery);

	const payload = {
		selectedSubject,
		searchQuery,
		pdfBookTitles
	};
	console.log('Payload before fetch:', payload);
	console.log('JSON Payload:', JSON.stringify(payload));

	try {
		loading = true;
		dispatch('loadingChange', loading);

		const response = await fetch('http://localhost:3001/api/searchquery', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			console.log('Server error: in response ok false');
			throw new Error(`Server error: ${response.status}`);
		}

		const result: any = await response.json();
		
		console.log('Search results:', result);

		loading = false;
		dispatch('loadingChange', loading);
		dispatch('searchResults', result);

		// Clear input and hide dropdown after successful search
		searchQuery = '';
		showDropdown = false;
	} catch (error) {
		console.error('Error in handleSearch:', error);
		loading = false;
		dispatch('loadingChange', loading);
	}
}

	// Show dropdown if there are previous searches
	const handleInputClick = () => {
		if ($previousSearchesWritable.length > 0) {
			showDropdown = true;
		}
	};

	/**
	 * Handles selecting a search term from the dropdown.
	 * @param {string} term - The search term selected
	 */
	const handleSelectSearch = (term: string) => {
		console.log('Selected:', term);
		searchQuery = term; // Populate input with selected term
		showDropdown = false; // Hide dropdown
	};

	const handleClickOutside = (event: Event) => {
		console.log('nadleCLickOutside');
		const dropdown = document.getElementById('search-dropdn');
		const inputField = document.getElementById('search');
		const target = event.target as Node;
		if (dropdown && inputField && !dropdown.contains(target) && !inputField.contains(target)) {
			showDropdown = false;
		}
	};

	function handleInputKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			console.log('Enter key pressed');
			handleSearchDispatch();
		}
	}

	const handleDelete = (searchTerm: string) => {
		previousSearchesWritable.update((searches) => {
			return searches.filter((term) => term !== searchTerm);
		});
	};

	function updateSearch(searchWord: string): void {
		previousSearchesWritable.update((searches: string[]) => {
			if (!searches.includes(searchWord)) {
				searches = [searchWord, ...searches].slice(0, 10);
			}
			return searches;
		});
		console.log($previousSearchesWritable);
	}

	// Close dropdown if clicked outside
	if (browser) {
		window.addEventListener('click', handleClickOutside);
	}
</script>

<div class="search-bar">
	<!-- Input Field with Click Event -->
	<input
		type="text"
		id="search"
		name="search"
		placeholder="Search..."
		bind:value={searchQuery}
		on:click={handleInputClick}
		on:keydown={handleInputKeydown}
		autocomplete="off"
	/>

	<!-- Search Button -->
	<button on:click={handleSearchDispatch}>Search</button>

	{#if loading}
		<div class="spinner"></div>
	{/if}

	<!-- Dropdown Menu -->
	{#if showDropdown && $previousSearchesWritable.length > 0}
		<ul id="search-dropdn" class="dropdn-menu">
			{#each $previousSearchesWritable as term}
				<li on:click={() => handleSelectSearch(term)}>
					{term}
					<button class="searchquery-delete" on:click|stopPropagation={() => handleDelete(term)}
						>X</button
					>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style lang="scss">
	.search-bar {
		display: flex;
		gap: 5px;
		position: relative; /* Anchor for absolute dropdown */
		width: 40%;
		margin: 0 auto;
		box-shadow: 0 8px 8px rgba(0, 0, 0, 0.2);
		input {
			flex-grow: 1; /* Stretch input to fill space */
			font-family:
				Comic sans MS;
			font-size: 20px;
			padding: 8px;
			border: 1px solid #ccc;
			border-radius: 4px;
		}

		button {
			background-color: #0056b3;
			color: white;
			padding: 8px 16px;
			border: none;
			border-radius: 4px;
			font-family:
				Comic sans MS;
			font-size: 25px;
			box-shadow: 0 8px 8px rgba(0, 0, 0, 0.2);
			&:hover {
				background-color: rgb(15, 41, 175);
			}
			cursor: pointer;
		}

		.dropdn-menu {
			position: absolute;
			background-color: #fff; /* White background */
			top: 100%; /* Position below input */
			left: 0;
			border-radius: 4px;
			width: calc(100% - 5px - 110px); /* Full container width minus gap and button width */
			list-style: none;
			padding: 5px 0; /* Padding around list */
			margin: 0;
			z-index: 10;
			box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
		}

		#search-dropdn li {
			font-size: 20px;
			background-color: #f9f9f9;
			padding: 8px 12px; /* Rectangular padding */
			border: 1px solid #000; /* Black border */
			border-radius: 4px;
			margin: 2px 5px; /* Space between items */
			&:hover {
				background-color: #e0e0e0; /* Hover effect */
			}
			cursor: pointer;

			.searchquery-delete {
				background-color: #ff4d4d;
				color: white;
				float: right;
				padding: 0 4px;
				border: none;
				border-radius: 4px;
				&:hover {
					background-color: #cc0000;
				}
				cursor: pointer;
			}
		}
	}
</style>
