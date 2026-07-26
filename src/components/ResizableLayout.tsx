import React from 'react';

/* Resizable workspace primitives (DESIGN.md R5.2 / R5.4).

   ResizableLayout splits a stage horizontally (left/right columns);
   ResizableRows stacks the rows of one column with a handle between each
   adjacent visible pair. Both are controlled: the owner holds the sizes so they
   can be persisted, and both report a live `change` during a drag plus a single
   `commit` when the drag ends (persisting on every mousemove would hammer
   localStorage).

   Rows have no imposed height by default. A row either hugs its content, or is
   the column's single greedy row that absorbs the leftover space, or was pinned
   to an explicit pixel height by a drag. That is what keeps a short panel from
   rendering blank filler.

   R5.2 moved the tutorial and working-data strips inside the visualizer panel,
   so the left column is now a single greedy row and the only row handle left is
   the one between the code and complexity rows. A handle therefore always
   resizes the row ABOVE it, whose top edge is anchored — dragging the row below
   instead would chase an edge that moves as the row grows. */

const KEYBOARD_STEP_PERCENT = 2;
const KEYBOARD_STEP_PX = 16;
const HANDLE_THICKNESS_PX = 8;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

type HandleOrientation = 'vertical' | 'horizontal';

export interface DragHandleProps {
  /** Orientation of the separator line itself, per the ARIA separator role. */
  orientation: HandleOrientation;
  label: string;
  valueNow: number;
  valueMin: number;
  valueMax: number;
  /** Announced in place of the raw number when it is not a real size (automatic rows). */
  valueText?: string;
  /** One arrow-key nudge, in the owner's own unit (percent for columns, px for rows). */
  step: number;
  dragging: boolean;
  onDragStart: () => void;
  /** Positive delta moves the handle down / right. */
  onNudge: (delta: number) => void;
  onRestoreDefault: () => void;
}

export const DragHandle: React.FC<DragHandleProps> = ({
  orientation,
  label,
  valueNow,
  valueMin,
  valueMax,
  valueText,
  step,
  dragging,
  onDragStart,
  onNudge,
  onRestoreDefault,
}) => {
  const [hovered, setHovered] = React.useState<boolean>(false);
  const [focused, setFocused] = React.useState<boolean>(false);
  const isVertical = orientation === 'vertical';
  const active = dragging || hovered || focused;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const backKey = isVertical ? 'ArrowLeft' : 'ArrowUp';
    const forwardKey = isVertical ? 'ArrowRight' : 'ArrowDown';
    if (event.key === backKey) {
      event.preventDefault();
      onNudge(-step);
    } else if (event.key === forwardKey) {
      event.preventDefault();
      onNudge(step);
    }
  };

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      aria-valuenow={Math.round(valueNow)}
      aria-valuemin={Math.round(valueMin)}
      aria-valuemax={Math.round(valueMax)}
      aria-valuetext={valueText}
      aria-label={label}
      tabIndex={0}
      onMouseDown={(event) => {
        event.preventDefault();
        onDragStart();
      }}
      onTouchStart={onDragStart}
      onDoubleClick={onRestoreDefault}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        flexShrink: 0,
        width: isVertical ? `${HANDLE_THICKNESS_PX}px` : '100%',
        height: isVertical ? '100%' : `${HANDLE_THICKNESS_PX}px`,
        cursor: isVertical ? 'col-resize' : 'row-resize',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        touchAction: 'none',
        zIndex: 1,
      }}
    >
      <div
        style={{
          width: isVertical ? '2px' : '100%',
          height: isVertical ? '100%' : '2px',
          background: active ? 'var(--accent)' : 'var(--border-default)',
          borderRadius: 'var(--radius-full)',
          transition: 'background var(--transition-fast)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

/* Shared window-level drag wiring: pointer events must be tracked on the window
   so a fast drag that leaves the 8px handle keeps resizing. */
export const usePointerDrag = (
  dragging: boolean,
  onMove: (clientX: number, clientY: number) => void,
  onEnd: () => void,
): void => {
  React.useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (event: MouseEvent) => onMove(event.clientX, event.clientY);
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 0) return;
      onMove(event.touches[0].clientX, event.touches[0].clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [dragging, onMove, onEnd]);
};

export interface ResizableLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  /** Left column width as a percentage of the container. */
  splitPercent: number;
  /** Double-clicking the handle restores this value. */
  defaultSplitPercent?: number;
  minLeftPercent?: number;
  maxLeftPercent?: number;
  showLeft?: boolean;
  showRight?: boolean;
  onSplitChange: (percent: number) => void;
  onSplitCommit?: (percent: number) => void;
  handleLabel?: string;
}

export const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  leftPanel,
  rightPanel,
  splitPercent,
  defaultSplitPercent = 70,
  minLeftPercent = 25,
  maxLeftPercent = 80,
  showLeft = true,
  showRight = true,
  onSplitChange,
  onSplitCommit,
  handleLabel = 'Resize visualizer and code columns',
}) => {
  const [dragging, setDragging] = React.useState<boolean>(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const percentRef = React.useRef<number>(splitPercent);
  percentRef.current = splitPercent;

  const apply = React.useCallback(
    (next: number, commit: boolean) => {
      const clamped = clamp(next, minLeftPercent, maxLeftPercent);
      percentRef.current = clamped;
      onSplitChange(clamped);
      if (commit) onSplitCommit?.(clamped);
    },
    [minLeftPercent, maxLeftPercent, onSplitChange, onSplitCommit],
  );

  const handleMove = React.useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (!(rect.width > 0)) return;
      apply(((clientX - rect.left) / rect.width) * 100, false);
    },
    [apply],
  );

  const onEnd = React.useCallback(() => {
    setDragging(false);
    onSplitCommit?.(percentRef.current);
  }, [onSplitCommit]);

  usePointerDrag(dragging, handleMove, onEnd);

  if (!showLeft && !showRight) {
    return <div style={{ width: '100%', height: '100%' }} />;
  }
  if (!showLeft) {
    return <div style={{ width: '100%', height: '100%', minHeight: 0 }}>{rightPanel}</div>;
  }
  if (!showRight) {
    return <div style={{ width: '100%', height: '100%', minHeight: 0 }}>{leftPanel}</div>;
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        minHeight: 0,
        position: 'relative',
        userSelect: dragging ? 'none' : 'auto',
      }}
    >
      <div
        style={{
          width: `${splitPercent}%`,
          height: '100%',
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {leftPanel}
      </div>

      <DragHandle
        orientation="vertical"
        label={handleLabel}
        valueNow={splitPercent}
        valueMin={minLeftPercent}
        valueMax={maxLeftPercent}
        step={KEYBOARD_STEP_PERCENT}
        dragging={dragging}
        onDragStart={() => setDragging(true)}
        onNudge={(delta) => apply(percentRef.current + delta, true)}
        onRestoreDefault={() => apply(defaultSplitPercent, true)}
      />

      <div
        style={{
          width: `${100 - splitPercent}%`,
          height: '100%',
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
};

export interface ResizableRow {
  id: string;
  /** Used in the aria-label of the handle next to this row. */
  label: string;
  content: React.ReactNode;
  /** null = automatic (exactly as tall as its content); a number pins the row. */
  height: number | null;
  /** The one row per column that absorbs leftover space while it is automatic. */
  greedy?: boolean;
  /** Hidden rows render nothing at all — no wrapper, no gap, no handle. */
  visible?: boolean;
}

export type PanelHeightMap = Record<string, number | null>;

export interface ResizableRowsProps {
  rows: ResizableRow[];
  /** Floor for a pinned row; matches the persistence floor so drags stay storable. */
  minRowHeight?: number;
  maxRowHeight?: number;
  onHeightsChange: (heights: PanelHeightMap) => void;
  onHeightsCommit?: (heights: PanelHeightMap) => void;
}

export const ResizableRows: React.FC<ResizableRowsProps> = ({
  rows,
  minRowHeight = 64,
  maxRowHeight = 2000,
  onHeightsChange,
  onHeightsCommit,
}) => {
  /** The id of the row being resized, i.e. the row directly above the handle. */
  const [dragRowId, setDragRowId] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rowElementsRef = React.useRef<Map<string, HTMLDivElement>>(new Map());

  const visibleRows = rows.filter((row) => row.visible !== false);

  /* Hidden rows keep their stored height so toggling a panel off and on again
     does not silently discard the size the user dragged it to. */
  const heightsRef = React.useRef<PanelHeightMap>({});
  const nextHeights: PanelHeightMap = {};
  for (const row of rows) {
    nextHeights[row.id] = typeof row.height === 'number' && Number.isFinite(row.height) ? row.height : null;
  }
  heightsRef.current = nextHeights;

  /* A pinned row may never eat the whole column: the remainder has to stay
     large enough for its neighbours to be grabbable. */
  const clampRowHeight = React.useCallback(
    (value: number): number => {
      const container = containerRef.current;
      const available = container ? container.getBoundingClientRect().height : 0;
      const ceiling =
        available > minRowHeight * 2 ? Math.min(maxRowHeight, available - minRowHeight) : maxRowHeight;
      return clamp(value, minRowHeight, ceiling);
    },
    [minRowHeight, maxRowHeight],
  );

  const applyHeight = React.useCallback(
    (id: string, height: number | null, commit: boolean) => {
      const updated: PanelHeightMap = { ...heightsRef.current, [id]: height };
      heightsRef.current = updated;
      onHeightsChange(updated);
      if (commit) onHeightsCommit?.(updated);
    },
    [onHeightsChange, onHeightsCommit],
  );

  const onMove = React.useCallback(
    (_clientX: number, clientY: number) => {
      if (dragRowId === null) return;
      const element = rowElementsRef.current.get(dragRowId);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      // jsdom and a not-yet-laid-out stage both measure 0; there is nothing to drag against.
      if (!(rect.height > 0)) return;
      /* The handle rides the row's bottom edge while its top edge stays put, so
         the pointer's distance from that top edge is the row's new height. */
      applyHeight(dragRowId, clampRowHeight(clientY - rect.top), false);
    },
    [dragRowId, applyHeight, clampRowHeight],
  );

  const onEnd = React.useCallback(() => {
    setDragRowId(null);
    onHeightsCommit?.(heightsRef.current);
  }, [onHeightsCommit]);

  usePointerDrag(dragRowId !== null, onMove, onEnd);

  /* An automatic row has no stored height, so a keyboard nudge starts from what
     the row currently measures and pins it from there. */
  const nudge = React.useCallback(
    (id: string, delta: number) => {
      const stored = heightsRef.current[id];
      const element = rowElementsRef.current.get(id);
      const base = stored ?? (element ? element.getBoundingClientRect().height : 0);
      applyHeight(id, clampRowHeight(base + delta), true);
    },
    [applyHeight, clampRowHeight],
  );

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 0,
        // Hugging rows never shrink, so a column that outgrows the stage scrolls.
        overflowY: 'auto',
        overflowX: 'hidden',
        userSelect: dragRowId !== null ? 'none' : 'auto',
      }}
    >
      {visibleRows.map((row, index) => {
        const previous = index > 0 ? visibleRows[index - 1] : null;
        const targetHeight = previous ? heightsRef.current[previous.id] : null;
        const height = nextHeights[row.id];
        const mode = height !== null ? 'pinned' : row.greedy === true ? 'greedy' : 'hug';

        return (
          <React.Fragment key={row.id}>
            {previous && (
              <DragHandle
                orientation="horizontal"
                label={`Resize ${previous.label} and ${row.label} rows`}
                valueNow={targetHeight ?? minRowHeight}
                valueMin={minRowHeight}
                valueMax={maxRowHeight}
                valueText={targetHeight === null ? 'Automatic, sized to content' : undefined}
                step={KEYBOARD_STEP_PX}
                dragging={dragRowId === previous.id}
                onDragStart={() => setDragRowId(previous.id)}
                onNudge={(delta) => nudge(previous.id, delta)}
                onRestoreDefault={() => applyHeight(previous.id, null, true)}
              />
            )}
            <div
              ref={(element) => {
                if (element) rowElementsRef.current.set(row.id, element);
                else rowElementsRef.current.delete(row.id);
              }}
              data-row={row.id}
              data-height-mode={mode}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: mode === 'greedy' ? 1 : 0,
                flexShrink: mode === 'greedy' ? 1 : 0,
                flexBasis: height !== null ? `${height}px` : mode === 'greedy' ? '0%' : 'auto',
                height: height !== null ? `${height}px` : undefined,
                // A pinned row keeps its size and scrolls; the greedy row hands
                // its overflow to the panel inside it; a hugging row cannot overflow.
                minHeight: mode === 'greedy' ? 'var(--panel-min-h)' : undefined,
                overflowX: mode === 'hug' ? 'visible' : 'hidden',
                overflowY: mode === 'pinned' ? 'auto' : mode === 'greedy' ? 'hidden' : 'visible',
              }}
            >
              {row.content}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
