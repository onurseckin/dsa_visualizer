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

  it('supports mouse drag interactions on separator handle', () => {
    render(
      <ResizableLayout
        leftPanel={<div>Left Content</div>}
        rightPanel={<div>Right Content</div>}
        initialSplitRatio={50}
      />
    );

    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('aria-valuenow', '50');

    // Mouse down on handle
    fireEvent.mouseDown(handle, { clientX: 500 });
    fireEvent.mouseMove(window, { clientX: 600 });
    fireEvent.mouseUp(window);
  });
});
