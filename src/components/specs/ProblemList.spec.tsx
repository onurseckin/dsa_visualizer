import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProblemList } from '../ProblemList';

describe('ProblemList Component Spec', () => {
  it('renders filter controls and problems table', () => {
    const onSelectMock = vi.fn();
    render(<ProblemList onSelectAlgorithm={onSelectMock} />);

    expect(screen.getByRole('textbox', { name: /Filter problems/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Filter by Category/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Filter by Difficulty/i })).toBeInTheDocument();
  });

  it('gives every panel a visible border and recesses the sort strip', () => {
    const { container } = render(<ProblemList onSelectAlgorithm={vi.fn()} />);

    const cards = Array.from(container.querySelectorAll<HTMLElement>('.ui-card'));
    expect(cards.length).toBe(2);
    cards.forEach((card) => {
      expect(card.style.borderColor).toBe('var(--border-default)');
    });

    const headerRow = container.querySelector<HTMLElement>('thead tr');
    expect(headerRow?.style.background).toBe('var(--bg-inset)');
    expect(headerRow?.style.borderBottom).toBe('1px solid var(--border-default)');

    const rows = Array.from(container.querySelectorAll<HTMLElement>('tbody tr'));
    expect(rows.length).toBeGreaterThan(10);
  });

  it('filters table rows dynamically when typing in the ui search input', () => {
    const onSelectMock = vi.fn();
    render(<ProblemList onSelectAlgorithm={onSelectMock} />);

    const input = screen.getByPlaceholderText(/Search problems by title/i);
    expect(input).toHaveClass('ui-input__field');
    fireEvent.change(input, { target: { value: 'Bubble Sort' } });

    expect(screen.getByText('Bubble Sort')).toBeInTheDocument();

    // Clear button resets the search
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(input).toHaveValue('');
  });

  it('filters rows via category select dropdown', () => {
    const onSelectMock = vi.fn();
    render(<ProblemList onSelectAlgorithm={onSelectMock} />);

    const select = screen.getByRole('combobox', { name: /Filter by Category/i });
    fireEvent.change(select, { target: { value: 'arrays_and_hashing' } });

    expect(screen.getByText('Bubble Sort')).toBeInTheDocument();
  });

  it('navigates to workspace when clicking table row or Visualize button', () => {
    const onSelectMock = vi.fn();
    render(<ProblemList onSelectAlgorithm={onSelectMock} />);

    const row = screen.getByText('Bubble Sort');
    fireEvent.click(row);

    expect(onSelectMock).toHaveBeenCalledWith('bubble-sort', 'arrays_and_hashing');
  });

  it('drives the category filter from the controlled category prop', () => {
    render(
      <ProblemList onSelectAlgorithm={vi.fn()} category="two_pointers" onCategoryChange={vi.fn()} />,
    );

    const select = screen.getByRole('combobox', { name: /Filter by Category/i }) as HTMLSelectElement;
    expect(select.value).toBe('two_pointers');
    expect(screen.queryByText('Bubble Sort')).not.toBeInTheDocument();
  });
});
