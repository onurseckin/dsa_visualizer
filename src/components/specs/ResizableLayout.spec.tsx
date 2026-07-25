import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import type { ComponentProps } from 'react';
import { ResizableLayout, ResizableRow, ResizableRows } from '../ResizableLayout';

/* jsdom measures every element as 0x0, so drag paths are exercised by stubbing
   getBoundingClientRect; everything else is asserted on attributes and callbacks. */
const stubRects = (rects: Record<string, DOMRect>): void => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ): DOMRect {
    const key = this.getAttribute('data-row') ?? this.getAttribute('data-rect') ?? 'container';
    return rects[key] ?? rects.container;
  });
};

const rect = (top: number, bottom: number, left = 0, right = 1000): DOMRect =>
  ({
    top,
    bottom,
    left,
    right,
    width: right - left,
    height: bottom - top,
    x: left,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ResizableLayout (horizontal split)', () => {
  const renderLayout = (overrides: Partial<ComponentProps<typeof ResizableLayout>> = {}) => {
    const onSplitChange = vi.fn();
    const onSplitCommit = vi.fn();
    const utils = render(
      <ResizableLayout
        leftPanel={<div>Left Content</div>}
        rightPanel={<div>Right Content</div>}
        splitPercent={60}
        defaultSplitPercent={60}
        onSplitChange={onSplitChange}
        onSplitCommit={onSplitCommit}
        {...overrides}
      />,
    );
    return { ...utils, onSplitChange, onSplitCommit };
  };

  it('renders both panels with a vertical separator carrying range semantics', () => {
    renderLayout();

    expect(screen.getByText('Left Content')).toBeInTheDocument();
    expect(screen.getByText('Right Content')).toBeInTheDocument();

    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    expect(handle).toHaveAttribute('aria-valuenow', '60');
    expect(handle).toHaveAttribute('aria-valuemin', '25');
    expect(handle).toHaveAttribute('aria-valuemax', '80');
    expect(handle).toHaveAttribute('tabindex', '0');
    expect(handle).toHaveAccessibleName('Resize visualizer and code columns');
  });

  it('reflects the controlled split percent in the column widths', () => {
    const { container } = renderLayout({ splitPercent: 35 });

    const columns = container.firstElementChild?.children;
    expect((columns?.[0] as HTMLElement).style.width).toBe('35%');
    expect((columns?.[2] as HTMLElement).style.width).toBe('65%');
  });

  it('nudges the split by 2% with ArrowLeft / ArrowRight and commits each nudge', () => {
    const onSplitCommit = vi.fn();
    const Harness = () => {
      const [percent, setPercent] = useState(60);
      return (
        <ResizableLayout
          leftPanel={<div>Left Content</div>}
          rightPanel={<div>Right Content</div>}
          splitPercent={percent}
          onSplitChange={setPercent}
          onSplitCommit={onSplitCommit}
        />
      );
    };
    render(<Harness />);
    const handle = screen.getByRole('separator');

    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(handle).toHaveAttribute('aria-valuenow', '62');

    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(handle).toHaveAttribute('aria-valuenow', '64');

    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(handle).toHaveAttribute('aria-valuenow', '62');

    expect(onSplitCommit).toHaveBeenCalledTimes(3);
    expect(onSplitCommit).toHaveBeenLastCalledWith(62);
  });

  it('ignores unrelated keys', () => {
    const { onSplitChange } = renderLayout();

    fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowUp' });

    expect(onSplitChange).not.toHaveBeenCalled();
  });

  it('clamps keyboard nudges to the allowed range', () => {
    const { onSplitChange } = renderLayout({ splitPercent: 80 });

    fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowRight' });

    expect(onSplitChange).toHaveBeenLastCalledWith(80);
  });

  it('restores the default split on double-click', () => {
    const { onSplitChange, onSplitCommit } = renderLayout({ splitPercent: 40 });

    fireEvent.doubleClick(screen.getByRole('separator'));

    expect(onSplitChange).toHaveBeenLastCalledWith(60);
    expect(onSplitCommit).toHaveBeenLastCalledWith(60);
  });

  it('tracks a mouse drag and commits once on release', () => {
    stubRects({ container: rect(0, 500, 0, 1000) });
    const { onSplitChange, onSplitCommit } = renderLayout();
    const handle = screen.getByRole('separator');

    fireEvent.mouseDown(handle);
    fireEvent.mouseMove(window, { clientX: 300 });
    fireEvent.mouseMove(window, { clientX: 450 });

    expect(onSplitChange).toHaveBeenNthCalledWith(1, 30);
    expect(onSplitChange).toHaveBeenNthCalledWith(2, 45);
    expect(onSplitCommit).not.toHaveBeenCalled();

    fireEvent.mouseUp(window);

    expect(onSplitCommit).toHaveBeenCalledTimes(1);
    expect(onSplitCommit).toHaveBeenLastCalledWith(45);
  });

  it('renders a single panel with no separator when a side is hidden', () => {
    const { rerender } = renderLayout({ showRight: false });

    expect(screen.getByText('Left Content')).toBeInTheDocument();
    expect(screen.queryByText('Right Content')).not.toBeInTheDocument();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();

    rerender(
      <ResizableLayout
        leftPanel={<div>Left Content</div>}
        rightPanel={<div>Right Content</div>}
        splitPercent={60}
        showLeft={false}
        onSplitChange={vi.fn()}
      />,
    );

    expect(screen.queryByText('Left Content')).not.toBeInTheDocument();
    expect(screen.getByText('Right Content')).toBeInTheDocument();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });
});

describe('ResizableRows (vertical split)', () => {
  const buildRows = (overrides: Partial<Record<string, boolean>> = {}): ResizableRow[] => [
    { id: 'top', label: 'visualizer', content: <div>Top Row</div>, weight: 60, defaultWeight: 60 },
    {
      id: 'middle',
      label: 'tutorial',
      content: <div>Middle Row</div>,
      weight: 40,
      defaultWeight: 40,
      visible: overrides.middle !== false,
    },
    {
      id: 'bottom',
      label: 'auxiliary data',
      content: <div>Bottom Row</div>,
      weight: 20,
      defaultWeight: 20,
      visible: overrides.bottom !== false,
    },
  ];

  const renderRows = (rows: ResizableRow[]) => {
    const onWeightsChange = vi.fn();
    const onWeightsCommit = vi.fn();
    const utils = render(
      <ResizableRows
        rows={rows}
        onWeightsChange={onWeightsChange}
        onWeightsCommit={onWeightsCommit}
      />,
    );
    return { ...utils, onWeightsChange, onWeightsCommit };
  };

  it('renders one horizontal separator between each adjacent visible pair', () => {
    renderRows(buildRows());

    const handles = screen.getAllByRole('separator');
    expect(handles).toHaveLength(2);
    handles.forEach((handle) => {
      expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
      expect(handle).toHaveAttribute('tabindex', '0');
    });
    expect(handles[0]).toHaveAccessibleName('Resize visualizer and tutorial rows');
    expect(handles[1]).toHaveAccessibleName('Resize tutorial and auxiliary data rows');
  });

  it('reports each row share as the separator value', () => {
    renderRows(buildRows());

    const handles = screen.getAllByRole('separator');
    expect(handles[0]).toHaveAttribute('aria-valuenow', '60');
    expect(handles[0]).toHaveAttribute('aria-valuemin', '4');
    expect(handles[0]).toHaveAttribute('aria-valuemax', '96');
  });

  it('applies weights as flex-grow so rows share the stage height', () => {
    const { container } = renderRows(buildRows());

    const top = container.querySelector('[data-row="top"]') as HTMLElement;
    const middle = container.querySelector('[data-row="middle"]') as HTMLElement;
    expect(top.style.flexGrow).toBe('60');
    expect(top.style.minHeight).toBe('0');
    expect(middle.style.flexGrow).toBe('40');
  });

  it('leaves no row, gap or dead handle for a hidden row', () => {
    renderRows(buildRows({ middle: false, bottom: false }));

    expect(screen.getByText('Top Row')).toBeInTheDocument();
    expect(screen.queryByText('Middle Row')).not.toBeInTheDocument();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('keeps the pair sum constant when nudging with ArrowUp / ArrowDown', () => {
    const { onWeightsChange, onWeightsCommit } = renderRows(buildRows({ bottom: false }));
    const handle = screen.getByRole('separator');

    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(onWeightsChange).toHaveBeenLastCalledWith({ top: 62, middle: 38, bottom: 20 });
    expect(onWeightsCommit).toHaveBeenLastCalledWith({ top: 62, middle: 38, bottom: 20 });

    fireEvent.keyDown(handle, { key: 'ArrowUp' });
    expect(onWeightsChange).toHaveBeenLastCalledWith({ top: 58, middle: 42, bottom: 20 });
  });

  it('keeps hidden rows at their stored weight while resizing visible ones', () => {
    const { onWeightsChange } = renderRows(buildRows({ middle: false }));

    fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowDown' });

    expect(onWeightsChange).toHaveBeenLastCalledWith({ top: 61.6, middle: 40, bottom: 18.4 });
  });

  it('restores both default weights of a pair on double-click', () => {
    const rows = buildRows({ bottom: false });
    rows[0].weight = 20;
    rows[1].weight = 80;
    const { onWeightsChange, onWeightsCommit } = renderRows(rows);

    fireEvent.doubleClick(screen.getByRole('separator'));

    expect(onWeightsChange).toHaveBeenLastCalledWith({ top: 60, middle: 40, bottom: 20 });
    expect(onWeightsCommit).toHaveBeenLastCalledWith({ top: 60, middle: 40, bottom: 20 });
  });

  it('converts a vertical drag into pair weights and commits on release', () => {
    stubRects({
      container: rect(0, 400),
      top: rect(0, 240),
      middle: rect(248, 400),
    });
    const { onWeightsChange, onWeightsCommit } = renderRows(buildRows({ bottom: false }));

    const handle = screen.getByRole('separator');
    fireEvent.mouseDown(handle);
    // Pair spans 0..400px and holds 100 weight, so 100px maps to 25 weight.
    fireEvent.mouseMove(window, { clientY: 100 });

    expect(onWeightsChange).toHaveBeenLastCalledWith({ top: 25, middle: 75, bottom: 20 });
    expect(onWeightsCommit).not.toHaveBeenCalled();

    fireEvent.mouseUp(window);
    expect(onWeightsCommit).toHaveBeenCalledTimes(1);
  });

  it('clamps a drag past the edge to the minimum row weight', () => {
    stubRects({
      container: rect(0, 400),
      top: rect(0, 240),
      middle: rect(248, 400),
    });
    const { onWeightsChange } = renderRows(buildRows({ bottom: false }));

    fireEvent.mouseDown(screen.getByRole('separator'));
    fireEvent.mouseMove(window, { clientY: -500 });

    expect(onWeightsChange).toHaveBeenLastCalledWith({ top: 4, middle: 96, bottom: 20 });
  });

  it('ignores drag movement while the stage has no measurable height', () => {
    const { onWeightsChange } = renderRows(buildRows({ bottom: false }));

    fireEvent.mouseDown(screen.getByRole('separator'));
    fireEvent.mouseMove(window, { clientY: 120 });

    expect(onWeightsChange).not.toHaveBeenCalled();
  });
});
