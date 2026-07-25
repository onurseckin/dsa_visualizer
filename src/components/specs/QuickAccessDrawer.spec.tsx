import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuickAccessDrawer } from '../QuickAccessDrawer';

describe('QuickAccessDrawer Component Spec', () => {
  it('does not render when isOpen is false', () => {
    render(
      <QuickAccessDrawer
        isOpen={false}
        onClose={vi.fn()}
        onSelectAlgorithm={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders drawer header, categories, algorithms, and search bar when isOpen is true', () => {
    render(
      <QuickAccessDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSelectAlgorithm={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Quick Problems/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search problems or categories.../i)).toBeInTheDocument();
    expect(screen.getByText(/1. Arrays & Hashing/i)).toBeInTheDocument();
  });

  it('filters algorithms and categories dynamically when typing in search input', () => {
    render(
      <QuickAccessDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSelectAlgorithm={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search problems or categories.../i);
    fireEvent.change(searchInput, { target: { value: 'dijkstra' } });

    expect(screen.getByText(/Dijkstra's Shortest Path Algorithm/i)).toBeInTheDocument();
    expect(screen.queryByText(/1. Arrays & Hashing/i)).not.toBeInTheDocument();
  });

  it('displays difficulty badges for algorithms', () => {
    render(
      <QuickAccessDrawer
        isOpen={true}
        onClose={vi.fn()}
        onSelectAlgorithm={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search problems or categories.../i);
    fireEvent.change(searchInput, { target: { value: 'bubble' } });

    expect(screen.getAllByText(/Easy/i).length).toBeGreaterThan(0);
  });

  it('invokes onSelectAlgorithm and onClose when an algorithm item is clicked', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <QuickAccessDrawer
        isOpen={true}
        onClose={handleClose}
        onSelectAlgorithm={handleSelect}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search problems or categories.../i);
    fireEvent.change(searchInput, { target: { value: 'dijkstra' } });

    const algoItem = screen.getByText(/Dijkstra's Shortest Path Algorithm/i);
    fireEvent.click(algoItem);

    expect(handleSelect).toHaveBeenCalledWith('dijkstra-shortest-path', 'graph_shortest_paths');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking close button, backdrop, or pressing Escape key', () => {
    const handleClose = vi.fn();

    render(
      <QuickAccessDrawer
        isOpen={true}
        onClose={handleClose}
        onSelectAlgorithm={vi.fn()}
      />
    );

    const closeBtn = screen.getByTitle('Close drawer');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const backdrop = screen.getByTestId('drawer-backdrop');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(3);
  });
});
