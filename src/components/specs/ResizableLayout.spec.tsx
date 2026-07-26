import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import type { ComponentProps } from 'react';
import {
  PanelHeightMap,
  ResizableLayout,
  ResizableRow,
  ResizableRows,
} from '../ResizableLayout';

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
        splitPercent={70}
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
    expect(handle).toHaveAttribute('aria-valuenow', '70');
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
      const [percent, setPercent] = useState(70);
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
    expect(handle).toHaveAttribute('aria-valuenow', '72');

    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(handle).toHaveAttribute('aria-valuenow', '74');

    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(handle).toHaveAttribute('aria-valuenow', '72');

    expect(onSplitCommit).toHaveBeenCalledTimes(3);
    expect(onSplitCommit).toHaveBeenLastCalledWith(72);
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

  it('restores the graph-focused 70% default split on double-click', () => {
    const { onSplitChange, onSplitCommit } = renderLayout({ splitPercent: 40 });

    fireEvent.doubleClick(screen.getByRole('separator'));

    expect(onSplitChange).toHaveBeenLastCalledWith(70);
    expect(onSplitCommit).toHaveBeenLastCalledWith(70);
  });

  it('restores an explicitly provided default split on double-click', () => {
    const { onSplitChange } = renderLayout({ splitPercent: 40, defaultSplitPercent: 55 });

    fireEvent.doubleClick(screen.getByRole('separator'));

    expect(onSplitChange).toHaveBeenLastCalledWith(55);
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
        splitPercent={70}
        showLeft={false}
        onSplitChange={vi.fn()}
      />,
    );

    expect(screen.queryByText('Left Content')).not.toBeInTheDocument();
    expect(screen.getByText('Right Content')).toBeInTheDocument();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });
});

describe('ResizableRows (content-hugging rows)', () => {
  /* The right column after R5.4: two rows, neither greedy, so the code panel is
     exactly as tall as the solution and the complexity card follows it. */
  const buildRows = (
    heights: PanelHeightMap = {},
    visibility: Partial<Record<string, boolean>> = {},
  ): ResizableRow[] => [
    {
      id: 'code',
      label: 'code',
      content: <div>Code Content</div>,
      height: heights.code ?? null,
      visible: visibility.code !== false,
    },
    {
      id: 'complexity',
      label: 'complexity',
      content: <div>Complexity Content</div>,
      height: heights.complexity ?? null,
      visible: visibility.complexity !== false,
    },
  ];

  const renderRows = (rows: ResizableRow[]) => {
    const onHeightsChange = vi.fn();
    const onHeightsCommit = vi.fn();
    const utils = render(
      <ResizableRows
        rows={rows}
        onHeightsChange={onHeightsChange}
        onHeightsCommit={onHeightsCommit}
      />,
    );
    return { ...utils, onHeightsChange, onHeightsCommit };
  };

  const row = (container: HTMLElement, id: string): HTMLElement =>
    container.querySelector(`[data-row="${id}"]`) as HTMLElement;

  it('renders one horizontal separator between each adjacent visible pair', () => {
    renderRows(buildRows());

    const handles = screen.getAllByRole('separator');
    expect(handles).toHaveLength(1);
    expect(handles[0]).toHaveAttribute('aria-orientation', 'horizontal');
    expect(handles[0]).toHaveAttribute('tabindex', '0');
    expect(handles[0]).toHaveAccessibleName('Resize code and complexity rows');
  });

  it('gives both rows no imposed height so each hugs its content', () => {
    const { container } = renderRows(buildRows());

    for (const id of ['code', 'complexity']) {
      const element = row(container, id);
      expect(element).toHaveAttribute('data-height-mode', 'hug');
      expect(element.style.flexGrow).toBe('0');
      expect(element.style.flexShrink).toBe('0');
      expect(element.style.flexBasis).toBe('auto');
      expect(element.style.height).toBe('');
      expect(element.style.minHeight).toBe('');
      // Overflow belongs to the column, never to a hugging panel (R5.4).
      expect(element.style.overflowY).toBe('visible');
    }
  });

  it('scrolls the column itself when its hugging rows outgrow it', () => {
    const { container } = renderRows(buildRows());

    const column = row(container, 'code').parentElement as HTMLElement;
    expect(column.style.overflowY).toBe('auto');
    expect(column.style.height).toBe('100%');
    expect(column.style.flexDirection).toBe('column');
  });

  it('lets a single greedy row absorb the whole column', () => {
    const { container } = renderRows([
      {
        id: 'visualizer',
        label: 'visualizer',
        content: <div>Visualizer Content</div>,
        greedy: true,
        height: null,
      },
    ]);

    const visualizer = row(container, 'visualizer');
    expect(visualizer).toHaveAttribute('data-height-mode', 'greedy');
    expect(visualizer.style.flexGrow).toBe('1');
    expect(visualizer.style.flexBasis).toBe('0%');
    expect(visualizer.style.minHeight).toBe('var(--panel-min-h)');
    // One row means no neighbour to resize against.
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('pins a dragged row to an explicit pixel height with its own scroll', () => {
    const { container } = renderRows(buildRows({ code: 180 }));

    const code = row(container, 'code');
    expect(code).toHaveAttribute('data-height-mode', 'pinned');
    expect(code.style.height).toBe('180px');
    expect(code.style.flexBasis).toBe('180px');
    expect(code.style.flexGrow).toBe('0');
    expect(code.style.overflowY).toBe('auto');

    // The panel that was not dragged keeps hugging.
    expect(row(container, 'complexity')).toHaveAttribute('data-height-mode', 'hug');
  });

  it('reports the height of the row above on the separator', () => {
    const { unmount } = renderRows(buildRows({ code: 180 }));

    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '180');
    expect(screen.getByRole('separator')).not.toHaveAttribute('aria-valuetext');

    unmount();
    renderRows(buildRows());

    expect(screen.getByRole('separator')).toHaveAttribute(
      'aria-valuetext',
      'Automatic, sized to content',
    );
  });

  it('leaves no row, gap or dead handle for a hidden row', () => {
    const { container } = renderRows(buildRows({}, { complexity: false }));

    expect(screen.getByText('Code Content')).toBeInTheDocument();
    expect(screen.queryByText('Complexity Content')).not.toBeInTheDocument();
    expect(container.querySelector('[data-row="complexity"]')).toBeNull();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('resizes the row above the handle, whose top edge is the drag anchor', () => {
    stubRects({
      container: rect(0, 600),
      code: rect(0, 300),
      complexity: rect(308, 600),
    });
    const { onHeightsChange, onHeightsCommit } = renderRows(buildRows());

    fireEvent.mouseDown(screen.getByRole('separator'));
    fireEvent.mouseMove(window, { clientY: 420 });

    expect(onHeightsChange).toHaveBeenLastCalledWith({ code: 420, complexity: null });
    expect(onHeightsCommit).not.toHaveBeenCalled();

    fireEvent.mouseUp(window);
    expect(onHeightsCommit).toHaveBeenCalledTimes(1);
  });

  it('clamps a drag so a pinned row can never swallow the whole column', () => {
    stubRects({ container: rect(0, 600), code: rect(0, 300), complexity: rect(308, 600) });
    const { onHeightsChange } = renderRows(buildRows());

    fireEvent.mouseDown(screen.getByRole('separator'));
    fireEvent.mouseMove(window, { clientY: 1200 });

    // 600px column minus the 64px floor left for the neighbour.
    expect(onHeightsChange).toHaveBeenLastCalledWith({ code: 536, complexity: null });
  });

  it('clamps a drag above the row top to the row floor', () => {
    stubRects({ container: rect(0, 600), code: rect(0, 300), complexity: rect(308, 600) });
    const { onHeightsChange } = renderRows(buildRows());

    fireEvent.mouseDown(screen.getByRole('separator'));
    fireEvent.mouseMove(window, { clientY: -200 });

    expect(onHeightsChange).toHaveBeenLastCalledWith({ code: 64, complexity: null });
  });

  it('ignores drag movement while the row has no measurable height', () => {
    const { onHeightsChange } = renderRows(buildRows());

    fireEvent.mouseDown(screen.getByRole('separator'));
    fireEvent.mouseMove(window, { clientY: 120 });

    expect(onHeightsChange).not.toHaveBeenCalled();
  });

  it('pins the row above with an arrow-key nudge and commits it', () => {
    stubRects({ container: rect(0, 600), code: rect(0, 300), complexity: rect(308, 600) });
    const { onHeightsChange, onHeightsCommit } = renderRows(buildRows());

    // ArrowDown pushes the handle down, which grows the row above it from its
    // 300px content height.
    fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowDown' });

    expect(onHeightsChange).toHaveBeenLastCalledWith({ code: 316, complexity: null });
    expect(onHeightsCommit).toHaveBeenLastCalledWith({ code: 316, complexity: null });
  });

  it('shrinks the row above when the handle is nudged up', () => {
    stubRects({ container: rect(0, 600), code: rect(0, 300), complexity: rect(308, 600) });
    const { onHeightsCommit } = renderRows(buildRows());

    fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowUp' });

    expect(onHeightsCommit).toHaveBeenLastCalledWith({ code: 284, complexity: null });
  });

  it('nudges a pinned row from its stored height', () => {
    stubRects({ container: rect(0, 600), code: rect(0, 300), complexity: rect(308, 600) });
    const { onHeightsCommit } = renderRows(buildRows({ code: 180 }));

    fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowDown' });

    expect(onHeightsCommit).toHaveBeenLastCalledWith({ code: 196, complexity: null });
  });

  it('restores the row above to automatic on double-click', () => {
    const { onHeightsChange, onHeightsCommit } = renderRows(buildRows({ code: 180 }));

    fireEvent.doubleClick(screen.getByRole('separator'));

    expect(onHeightsChange).toHaveBeenLastCalledWith({ code: null, complexity: null });
    expect(onHeightsCommit).toHaveBeenLastCalledWith({ code: null, complexity: null });
  });

  it('keeps a hidden row at its stored height while resizing the visible ones', () => {
    /* Rows are a generic list, so a hidden one must keep its pin: toggling a panel
       off and on again may not discard the size the user dragged it to. */
    stubRects({ container: rect(0, 600), code: rect(0, 300) });
    const onHeightsChange = vi.fn();
    render(
      <ResizableRows
        rows={[
          ...buildRows(),
          {
            id: 'scratch',
            label: 'scratch',
            content: <div>Scratch Content</div>,
            height: 220,
            visible: false,
          },
        ]}
        onHeightsChange={onHeightsChange}
      />,
    );

    fireEvent.mouseDown(screen.getByRole('separator'));
    fireEvent.mouseMove(window, { clientY: 420 });

    expect(onHeightsChange).toHaveBeenLastCalledWith({
      code: 420,
      complexity: null,
      scratch: 220,
    });
  });
});
