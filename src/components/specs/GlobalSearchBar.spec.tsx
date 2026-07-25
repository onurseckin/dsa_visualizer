import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GlobalSearchBar } from '../GlobalSearchBar';

describe('GlobalSearchBar Component Spec', () => {
  it('renders search input field with ARIA combobox attributes', () => {
    const onSelectMock = vi.fn();
    render(<GlobalSearchBar onSelectAlgorithm={onSelectMock} />);

    const input = screen.getByRole('combobox', { name: /Search problems, topics, and algorithms/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-haspopup', 'listbox');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters results and displays autocomplete dropdown with ARIA listbox and option roles', () => {
    const onSelectMock = vi.fn();
    render(<GlobalSearchBar onSelectAlgorithm={onSelectMock} />);

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'kruskal' } });

    expect(input).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox', { name: /Algorithm Search Results/i });
    expect(listbox).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Kruskal's Minimum Spanning Tree/i)).toBeInTheDocument();
  });

  it('supports phonetic and alias search (e.g., "crew skull" -> Kruskal)', () => {
    const onSelectMock = vi.fn();
    render(<GlobalSearchBar onSelectAlgorithm={onSelectMock} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'crew skull' } });

    expect(screen.getByText(/Kruskal's Minimum Spanning Tree/i)).toBeInTheDocument();
  });

  it('triggers onSelectAlgorithm callback when clicking a search result', () => {
    const onSelectMock = vi.fn();
    render(<GlobalSearchBar onSelectAlgorithm={onSelectMock} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'dijkstra' } });

    const resultItem = screen.getByText(/Dijkstra's Shortest Path Algorithm/i);
    fireEvent.click(resultItem);

    expect(onSelectMock).toHaveBeenCalledWith('dijkstra-shortest-path', 'graph_shortest_paths');
    expect(input).toHaveValue('');
  });

  it('supports keyboard navigation via ArrowDown, ArrowUp, Enter, and Escape', () => {
    const onSelectMock = vi.fn();
    render(<GlobalSearchBar onSelectAlgorithm={onSelectMock} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'binary' } });

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Navigate down
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Navigate up
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    // Press enter
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelectMock).toHaveBeenCalled();

    // Re-open and test Escape
    fireEvent.change(input, { target: { value: 'bfs' } });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('focuses search input when pressing "/" or "⌘K"', () => {
    const onSelectMock = vi.fn();
    render(<GlobalSearchBar onSelectAlgorithm={onSelectMock} />);

    const input = screen.getByRole('combobox');
    expect(document.activeElement).not.toBe(input);

    // Press '/' key
    fireEvent.keyDown(window, { key: '/' });
    expect(document.activeElement).toBe(input);

    // Blur input and press Cmd+K
    input.blur();
    expect(document.activeElement).not.toBe(input);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(document.activeElement).toBe(input);
  });

  it('triggers onOpenDrawer when clicking ListFilter drawer trigger button', () => {
    const onOpenDrawerMock = vi.fn();
    render(<GlobalSearchBar onSelectAlgorithm={vi.fn()} onOpenDrawer={onOpenDrawerMock} />);

    const drawerBtn = screen.getByRole('button', { name: /Open full problem directory sidebar/i });
    fireEvent.click(drawerBtn);

    expect(onOpenDrawerMock).toHaveBeenCalledTimes(1);
  });

  it('clears search input when clicking clear button', () => {
    render(<GlobalSearchBar onSelectAlgorithm={vi.fn()} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'graph' } });
    expect(input).toHaveValue('graph');

    const clearBtn = screen.getByTitle('Clear search');
    fireEvent.click(clearBtn);

    expect(input).toHaveValue('');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

