import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GlobalSearchBar } from '../GlobalSearchBar';

describe('GlobalSearchBar Component Spec', () => {
  it('renders search input field cleanly', () => {
    const onSelectMock = vi.fn();
    render(<GlobalSearchBar onSelectAlgorithm={onSelectMock} />);

    expect(
      screen.getByPlaceholderText(/Search problems.../i)
    ).toBeInTheDocument();
  });

  it('filters results and displays autocomplete dropdown on input focus and typing', () => {
    const onSelectMock = vi.fn();
    render(<GlobalSearchBar onSelectAlgorithm={onSelectMock} />);

    const input = screen.getByPlaceholderText(/Search problems.../i);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'kruskal' } });

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText(/Kruskal's Minimum Spanning Tree/i)).toBeInTheDocument();
  });

  it('supports phonetic and alias search (e.g., "crew skull" -> Kruskal)', () => {
    const onSelectMock = vi.fn();
    render(<GlobalSearchBar onSelectAlgorithm={onSelectMock} />);

    const input = screen.getByPlaceholderText(/Search problems.../i);
    fireEvent.change(input, { target: { value: 'crew skull' } });

    expect(screen.getByText(/Kruskal's Minimum Spanning Tree/i)).toBeInTheDocument();
  });

  it('triggers onSelectAlgorithm callback when clicking a search result', () => {
    const onSelectMock = vi.fn();
    render(<GlobalSearchBar onSelectAlgorithm={onSelectMock} />);

    const input = screen.getByPlaceholderText(/Search problems.../i);
    fireEvent.change(input, { target: { value: 'dijkstra' } });

    const resultItem = screen.getByText(/Dijkstra's Shortest Path Algorithm/i);
    fireEvent.click(resultItem);

    expect(onSelectMock).toHaveBeenCalledWith('dijkstra-shortest-path', 'graph_shortest_paths');
  });

  it('supports keyboard navigation via ArrowDown, ArrowUp, and Enter', () => {
    const onSelectMock = vi.fn();
    render(<GlobalSearchBar onSelectAlgorithm={onSelectMock} />);

    const input = screen.getByPlaceholderText(/Search problems.../i);
    fireEvent.change(input, { target: { value: 'binary' } });

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSelectMock).toHaveBeenCalled();
  });
});
