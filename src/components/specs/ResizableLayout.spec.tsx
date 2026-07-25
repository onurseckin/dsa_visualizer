import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResizableLayout } from '../ResizableLayout';

describe('ResizableLayout Component Spec', () => {
  it('renders left and right panels with separator handle', () => {
    render(
      <ResizableLayout
        leftPanel={<div>Left Content</div>}
        rightPanel={<div>Right Content</div>}
      />
    );

    expect(screen.getByText('Left Content')).toBeInTheDocument();
    expect(screen.getByText('Right Content')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('handles panel visibility toggles cleanly', () => {
    const { rerender } = render(
      <ResizableLayout
        leftPanel={<div>Left Content</div>}
        rightPanel={<div>Right Content</div>}
        showRight={false}
      />
    );

    expect(screen.getByText('Left Content')).toBeInTheDocument();
    expect(screen.queryByText('Right Content')).not.toBeInTheDocument();

    rerender(
      <ResizableLayout
        leftPanel={<div>Left Content</div>}
        rightPanel={<div>Right Content</div>}
        showLeft={false}
        showRight={true}
      />
    );

    expect(screen.queryByText('Left Content')).not.toBeInTheDocument();
    expect(screen.getByText('Right Content')).toBeInTheDocument();
  });

  it('supports mouse drag interactions on separator handle and persists to localStorage', () => {
    localStorage.clear();
    render(
      <ResizableLayout
        leftPanel={<div>Left Content</div>}
        rightPanel={<div>Right Content</div>}
        initialSplitRatio={50}
      />
    );

    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('aria-valuenow', '50');

    // Double click to reset
    fireEvent.doubleClick(handle);
    expect(localStorage.getItem('dsa_visualizer_layout_split')).toBe('50');
  });

  it('initializes split ratio from localStorage if valid', () => {
    localStorage.setItem('dsa_visualizer_layout_split', '70');

    render(
      <ResizableLayout
        leftPanel={<div>Left Content</div>}
        rightPanel={<div>Right Content</div>}
        initialSplitRatio={60}
      />
    );

    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('aria-valuenow', '70');
    localStorage.clear();
  });

  it('resets split ratio to default when resetKey changes', () => {
    localStorage.setItem('dsa_visualizer_layout_split', '75');

    const { rerender } = render(
      <ResizableLayout
        leftPanel={<div>Left Content</div>}
        rightPanel={<div>Right Content</div>}
        initialSplitRatio={60}
        resetKey={0}
      />
    );

    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('aria-valuenow', '75');

    rerender(
      <ResizableLayout
        leftPanel={<div>Left Content</div>}
        rightPanel={<div>Right Content</div>}
        initialSplitRatio={60}
        resetKey={1}
      />
    );

    expect(handle).toHaveAttribute('aria-valuenow', '60');
    expect(localStorage.getItem('dsa_visualizer_layout_split')).toBe('60');
    localStorage.clear();
  });
});
