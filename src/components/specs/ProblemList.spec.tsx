import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProblemList } from '../ProblemList';

describe('ProblemList Component Spec', () => {
  it('renders problem directory title, stat count badges, and problems table', () => {
    const onSelectMock = vi.fn();
    render(<ProblemList onSelectAlgorithm={onSelectMock} />);

    expect(screen.getByText(/All Categorized Problems & Algorithms/i)).toBeInTheDocument();

    const totalBadge = screen.getByText(/Total:/i);
    expect(totalBadge).toHaveClass('ui-badge', 'ui-badge--neutral');
    expect(screen.getByText(/Easy:/i)).toHaveClass('ui-badge--success');
    expect(screen.getByText(/Medium:/i)).toHaveClass('ui-badge--warning');
    expect(screen.getByText(/Hard:/i)).toHaveClass('ui-badge--danger');
  });

  it('filters table rows dynamically when typing in the ui search input', () => {
    const onSelectMock = vi.fn();
    render(<ProblemList onSelectAlgorithm={onSelectMock} />);

    const input = screen.getByPlaceholderText(/Filter problems by title/i);
    expect(input).toHaveClass('ui-input__field');
    fireEvent.change(input, { target: { value: 'Bubble Sort' } });

    expect(screen.getByText('Bubble Sort')).toBeInTheDocument();

    // Clear button resets the search
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(input).toHaveValue('');
  });

  it('marks the difficulty filter button as selected and filters rows', () => {
    const onSelectMock = vi.fn();
    render(<ProblemList onSelectAlgorithm={onSelectMock} />);

    const easyBtn = screen.getByRole('button', { name: 'Easy' });
    expect(easyBtn).toHaveClass('ui-btn', 'ui-btn--sm');
    fireEvent.click(easyBtn);

    expect(easyBtn).toHaveClass('ui-btn--selected');
    expect(easyBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText('Easy')[0]).toBeInTheDocument();
  });

  it('filters rows via category chip buttons with selected treatment', () => {
    const onSelectMock = vi.fn();
    render(<ProblemList onSelectAlgorithm={onSelectMock} />);

    const allChip = screen.getByRole('button', { name: 'All categories' });
    expect(allChip).toHaveClass('ui-btn--selected');

    const arraysChip = screen.getByRole('button', { name: 'Arrays & Hashing' });
    fireEvent.click(arraysChip);

    expect(arraysChip).toHaveClass('ui-btn--selected');
    expect(allChip).not.toHaveClass('ui-btn--selected');
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

    expect(screen.getByRole('button', { name: 'Two Pointers' })).toHaveClass('ui-btn--selected');
    expect(screen.getByRole('button', { name: 'All categories' })).not.toHaveClass('ui-btn--selected');
    expect(screen.queryByText('Bubble Sort')).not.toBeInTheDocument();
  });

  it('reports chip clicks through onCategoryChange without mutating its own selection', () => {
    const onCategoryChange = vi.fn();
    render(
      <ProblemList onSelectAlgorithm={vi.fn()} category="All" onCategoryChange={onCategoryChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Arrays & Hashing' }));
    expect(onCategoryChange).toHaveBeenCalledWith('arrays_and_hashing');

    fireEvent.click(screen.getByRole('button', { name: 'All categories' }));
    expect(onCategoryChange).toHaveBeenCalledWith('All');

    // Selection stays put until the parent feeds a new category prop back in.
    expect(screen.getByRole('button', { name: 'All categories' })).toHaveClass('ui-btn--selected');
    expect(screen.getByRole('button', { name: 'Arrays & Hashing' })).not.toHaveClass('ui-btn--selected');
  });

  it('re-renders the filter when the controlled category prop changes', () => {
    const { rerender } = render(
      <ProblemList onSelectAlgorithm={vi.fn()} category="All" onCategoryChange={vi.fn()} />,
    );
    expect(screen.getByText('Bubble Sort')).toBeInTheDocument();

    rerender(
      <ProblemList onSelectAlgorithm={vi.fn()} category="backtracking" onCategoryChange={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Backtracking' })).toHaveClass('ui-btn--selected');
    expect(screen.queryByText('Bubble Sort')).not.toBeInTheDocument();
  });
});
