<script lang="ts">
	let { result, onchange, ondelete } = $props();
	let isExpanded: boolean = $state(false);
	let checked = $derived(result?.isChecked ?? false);

	//If the clicked element is inside the .pdf-checkbox - returns without expansion of the page text
	//Outside of that, the click expands the page text.
	function handleBlockClick(event: MouseEvent) {
		const target = event.target as Element;
		if (target.closest(".pdf-checkbox")) {
			return; // Prevent expansion if clicking on checkbox or delete button
		}
		isExpanded = !isExpanded;
	}

	// This calls the callback prop which returns result && checked to the parent +page.svelte main page.
	function handleCheckboxChange(event: Event) {
		console.log("in handleCheckboxChange");
		const target = event.target as HTMLInputElement;
		result.isChecked = target.checked;
		onchange?.({ result, checked });
	}

	// This calls the callback prop which returns result to the parent +page.svelte main page.
	function handleDelete() {
		ondelete?.(result); // Send the result object to the parent
	}
</script>

<div class="pdf-block grid grid-cols-[auto_1fr_auto] w-full items-center p-3 border-b border-gray-300 hover:bg-gray-100 cursor-pointer" onclick={handleBlockClick}>
	<input
		type="checkbox"
		bind:checked={result.isChecked}
		class="pdf-checkbox w-4 h-4 mx-3 pr-1 scale-150 cursor-pointer"
		onchange={(e) => {
			e.stopPropagation();
			handleCheckboxChange(e);
		}}
	/>
	<p class="m-0 px-3 overflow-hidden break-words whitespace-normal text-base sm:text-lg md:text-xl lg:text-2xl font-bold font-comic tracking-wider2">{result.bookTitle} {result.pageNum} {result.sentence}</p>
	<button
		class="pdf-delete w-5 h-5 p-0 text-xs leading-5 text-center bg-red-500 hover:bg-red-700 text-white border-none rounded cursor-pointer"
		onclick={(e) => {
			e.stopPropagation();
			handleDelete();
		}}>X</button
	>
	{#if isExpanded}
		<div class="pdf-page-text col-span-full w-full mt-3 bg-red-100 p-3">
			<p class="m-0 break-words whitespace-normal overflow-visible text-base sm:text-lg md:text-xl lg:text-2xl font-comic">{result.pageText || "No text available"}</p>
		</div>
	{/if}
</div>

