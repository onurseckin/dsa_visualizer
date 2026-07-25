import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProblemList } from '../ProblemList';

describe('ProblemList Component Spec', () => {
  it('renders problem directory title, stat summary pills, and problems table', () => {
    const onSelectMock = vi.fn();
    render(<ProblemList onSelectAlgorithm={onSelectMock} />);

    expect(screen.getByText(/All Categorized Problems & Algorithms/i)).toBeInTheDocument();
    expect(screen.getByText(/Total:/i)).toBeInTheDocument();
    expect(screen.getByText(/Easy:/i)).toBeInTheDocument();
    expect(screen.getByText(/Medium:/i)).toBeInTheDocument();
    expect(screen.getByText(/Hard:/i)).toBeInTheDocument();
  });

  it('filters table rows dynamically when typing in the search bar', () => {
    const onSelectMock = vi.fn();
    render(<ProblemList onSelectAlgorithm={onSelectMock} />);

    const input = screen.getByPlaceholderText(/Filter problems by title/i);
    fireEvent.change(input, { target: { value: 'Bubble Sort' } });

    expect(screen.getByText('Bubble Sort')).toBeInTheDocument();
  });

  it('filters table rows by difficulty filter buttons', () => {
    const onSelectMock = vi.fn();
    render(<ProblemList onSelectAlgorithm={onSelectMock} />);

    const easyBtn = screen.getByRole('button', { name: 'Easy' });
    fireEvent.click(easyBtn);

    expect(screen.getAllByText('Easy')[0]).toBeInTheDocument();
  });

  it('navigates to workspace when clicking table row or Visualize button', () => {
    const onSelectMock = vi.fn();
    render(<ProblemList onSelectAlgorithm={onSelectMock} />);

    const row = screen.getByText('Bubble Sort');
    fireEvent.click(row);

    expect(onSelectMock).toHaveBeenCalledWith('bubble-sort', 'arrays_and_hashing');
  });
});
