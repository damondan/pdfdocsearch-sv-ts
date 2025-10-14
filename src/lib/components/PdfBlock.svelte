<script lang="ts">
	import { createEventDispatcher } from "svelte";

	let { result } = $props();
	let isExpanded: boolean = $state(false);
	const dispatch = createEventDispatcher();
	let checked = $derived(result?.isChecked ?? false);

	//If the clicked element is inside the .pdf-checkbox - returns without expansion of the page text
	//Outside of that, the click expands the page text.
	function handleBlockClick(event: CustomEvent) {
		const target = event.target as Element;
		if (target.closest(".pdf-checkbox")) {
			return; // Prevent expansion if clicking on checkbox or delete button
		}
		isExpanded = !isExpanded;
	}

	// This is a dispatch which returns result && checked to the parent +page.svelte main page.
	function handleCheckboxChangeDispatch(event: CustomEvent) {
		console.log("in handleCheckboxChangeDispatch");
		const target = event.target as HTMLInputElement;
		result.isChecked = target.checked;
		dispatch("change", { result, checked });
	}

	// This is a dispatch which returns result to the parent +page.svelte main page.
	function handleDeleteDispatch() {
		dispatch("delete", result); // Send the result object to the parent
	}
</script>

<div class="pdf-block" onclick={handleBlockClick}>
	<input
		type="checkbox"
		bind:checked={result.isChecked}
		class="pdf-checkbox"
		onchange={(e) => {
			e.stopPropagation();
			handleCheckboxChangeDispatch(e);
		}}
	/>
	<p>{result.bookTitle} {result.pageNum} {result.sentence}</p>
	<button
		class="pdf-delete"
		onclick={(e) => {
			e.stopPropagation();
			handleDeleteDispatch();
		}}>X</button
	>
	{#if isExpanded}
		<div class="pdf-page-text">
			<p>{result.pageText || "No text available"}</p>
		</div>
	{/if}
</div>

<style>
	.pdf-block {
		display: grid;
		grid-template-columns: auto 1fr auto; /* Checkbox, content, button */
		width: 100%;
		align-items: center;
		padding: 10px;
		border-bottom: 1px solid #ccc;
		box-sizing: border-box;
		&:hover {
			background-color: #f5f5f5; /* Hover feedback */
		}
		cursor: pointer;
	}
	.pdf-checkbox {
		width: 15px;
		height: 15px;
		margin: 0 10px;
		padding-right: 4px;
		transform: scale(1.5);
		cursor: pointer;
	}

	p {
		margin: 0;
		padding: 0 10px;
		overflow: hidden;
		word-wrap: break-word; /* Allows long words to break */
		white-space: normal; /* Enables natural wrapping */
		font-size: 18px;
		font-weight: 700;
		font-family: Comic sans MS;
		letter-spacing: 2px;
	}

	.pdf-delete {
		width: 20px;
		height: 20px;
		padding: 0;
		font-size: 10px;
		line-height: 20px;
		text-align: center;
		background-color: #ff4d4d;
		color: white;
		border: none;
		border-radius: 3px;
		cursor: pointer;

		&:hover {
			background-color: #cc0000;
		}
	}

	.pdf-page-text {
		grid-column: 1 / -1;
		width: 100%;
		margin-top: 10px;
		background-color: #f0e3e3;
		padding: 10px;
	}

	p {
		margin: 0;
		word-wrap: break-word;
		white-space: normal; /* Allows full text to wrap */
		overflow: visible; /* Ensures no clipping */
		text-overflow: clip; /* Removes ellipsis for expanded text */
	}
</style>
