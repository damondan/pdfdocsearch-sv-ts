import { describe, test, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';
import { vi } from 'vitest';

vi.mock('$layout', () => ({
	load: vi.fn().mockResolvedValue({
	  dataPdfSubjects: ['Codoh', 'Jung']
	})
  }));

  describe('Page Component', () => {
	it('should render h1 and handle onMount', async () => {
	  render(Page);
  
	  // Check that the h1 is rendered
	  const h1 = await screen.findByText('Pdf Search');
	  expect(h1).toBeInTheDocument();
  
	  // Check that the data is being displayed in a list (assuming it's part of the render)
	  const listItems = await screen.findAllByRole('listitem');
	  expect(listItems).toHaveLength(2); // Assuming two subjects
	});
  });