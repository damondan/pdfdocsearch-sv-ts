import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { PdfBookResult } from './classes/PdfBookResult';

// Create the store in a separate file
export const searchQueryWritable: Writable<string> = writable('');
export let checkedResultsWritable: Writable<any> = writable();
export const previousSearchesWritable = writable<string[]>([]);