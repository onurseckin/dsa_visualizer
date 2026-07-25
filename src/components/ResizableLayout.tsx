import React from 'react';

/* Resizable workspace primitives (DESIGN.md R3.3).

   ResizableLayout splits a stage horizontally (left/right columns);
   ResizableRows stacks any number of rows vertically with a handle between
   each adjacent visible pair. Both are controlled: the owner holds the sizes
   so they can be persisted, and both report a live `change` during a drag plus
   a single `commit` when the drag ends (persisting on every mousemove would
   hammer localStorage). */

const KEYBOARD_STEP_PERCENT = 2;
const HANDLE_THICKNESS_PX = 8;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

type HandleOrientation = 'vertical' | 'horizontal';

interface DragHandleProps {
  /** Orientation of the separator line itself, per the ARIA separator role. */
  orientation: HandleOrientation;
  label: string;
  valueNow: number;
  valueMin: number;
  valueMax: number;
  dragging: boolean;
  onDragStart: () => void;
  /** Positive delta grows the leading panel (left / top) by that many percent. */
  onNudge: (deltaPercent: number) => void;
  onRestoreDefault: () => void;
}

const DragHandle: React.FC<DragHandleProps> = ({
  orientation,
  label,
  valueNow,
  valueMin,
  valueMax,
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
    const shrinkKey = isVertical ? 'ArrowLeft' : 'ArrowUp';
    const growKey = isVertical ? 'ArrowRight' : 'ArrowDown';
    if (event.key === shrinkKey) {
      event.preventDefault();
      onNudge(-KEYBOARD_STEP_PERCENT);
    } else if (event.key === growKey) {
      event.preventDefault();
      onNudge(KEYBOARD_STEP_PERCENT);
    }
  };

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      aria-valuenow={Math.round(valueNow)}
      aria-valuemin={Math.round(valueMin)}
      aria-valuemax={Math.round(valueMax)}
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
const usePointerDrag = (
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
  defaultSplitPercent = 60,
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
  /** Used in the aria-label of the handle above this row. */
  label: string;
  content: React.ReactNode;
  /** Relative flex weight; absolute scale is irrelevant, ratios are what matter. */
  weight: number;
  /** Double-clicking a handle restores the default weights of its two rows. */
  defaultWeight: number;
  /** Hidden rows render nothing at all — no gap, no handle. */
  visible?: boolean;
  /** True for rows whose content does not scroll itself. */
  scroll?: boolean;
}

export interface ResizableRowsProps {
  rows: ResizableRow[];
  /** Weight floor per row; matches the persistence floor so drags stay storable. */
  minRowWeight?: number;
  onWeightsChange: (weights: Record<string, number>) => void;
  onWeightsCommit?: (weights: Record<string, number>) => void;
}

export const ResizableRows: React.FC<ResizableRowsProps> = ({
  rows,
  minRowWeight = 4,
  onWeightsChange,
  onWeightsCommit,
}) => {
  const [dragPair, setDragPair] = React.useState<[string, string] | null>(null);
  const rowElementsRef = React.useRef<Map<string, HTMLDivElement>>(new Map());

  const visibleRows = rows.filter((row) => row.visible !== false);

  const weightsRef = React.useRef<Record<string, number>>({});
  const nextWeights: Record<string, number> = {};
  for (const row of rows) {
    nextWeights[row.id] = Number.isFinite(row.weight) && row.weight > 0 ? row.weight : row.defaultWeight;
  }
  weightsRef.current = nextWeights;

  const applyPair = React.useCallback(
    (topId: string, bottomId: string, topWeight: number, commit: boolean) => {
      const current = weightsRef.current;
      const sum = current[topId] + current[bottomId];
      if (sum <= minRowWeight * 2) return;
      const nextTop = clamp(topWeight, minRowWeight, sum - minRowWeight);
      const updated: Record<string, number> = {
        ...current,
        [topId]: nextTop,
        [bottomId]: sum - nextTop,
      };
      weightsRef.current = updated;
      onWeightsChange(updated);
      if (commit) onWeightsCommit?.(updated);
    },
    [minRowWeight, onWeightsChange, onWeightsCommit],
  );

  const onMove = React.useCallback(
    (_clientX: number, clientY: number) => {
      if (!dragPair) return;
      const [topId, bottomId] = dragPair;
      const topElement = rowElementsRef.current.get(topId);
      const bottomElement = rowElementsRef.current.get(bottomId);
      if (!topElement || !bottomElement) return;
      const topRect = topElement.getBoundingClientRect();
      const bottomRect = bottomElement.getBoundingClientRect();
      const span = bottomRect.bottom - topRect.top;
      if (!(span > 0)) return;
      const ratio = (clientY - topRect.top) / span;
      const sum = weightsRef.current[topId] + weightsRef.current[bottomId];
      applyPair(topId, bottomId, sum * ratio, false);
    },
    [dragPair, applyPair],
  );

  const onEnd = React.useCallback(() => {
    setDragPair(null);
    onWeightsCommit?.(weightsRef.current);
  }, [onWeightsCommit]);

  usePointerDrag(dragPair !== null, onMove, onEnd);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 0,
        userSelect: dragPair ? 'none' : 'auto',
      }}
    >
      {visibleRows.map((row, index) => {
        const previous = index > 0 ? visibleRows[index - 1] : null;
        const pairSum = previous ? nextWeights[previous.id] + nextWeights[row.id] : 0;
        const dragging =
          previous !== null && dragPair !== null && dragPair[0] === previous.id && dragPair[1] === row.id;

        return (
          <React.Fragment key={row.id}>
            {previous && (
              <DragHandle
                orientation="horizontal"
                label={`Resize ${previous.label} and ${row.label} rows`}
                valueNow={(nextWeights[previous.id] / pairSum) * 100}
                valueMin={(minRowWeight / pairSum) * 100}
                valueMax={100 - (minRowWeight / pairSum) * 100}
                dragging={dragging}
                onDragStart={() => setDragPair([previous.id, row.id])}
                onNudge={(delta) =>
                  applyPair(
                    previous.id,
                    row.id,
                    nextWeights[previous.id] + (pairSum * delta) / 100,
                    true,
                  )
                }
                onRestoreDefault={() => {
                  const updated: Record<string, number> = {
                    ...weightsRef.current,
                    [previous.id]: previous.defaultWeight,
                    [row.id]: row.defaultWeight,
                  };
                  weightsRef.current = updated;
                  onWeightsChange(updated);
                  onWeightsCommit?.(updated);
                }}
              />
            )}
            <div
              ref={(element) => {
                if (element) rowElementsRef.current.set(row.id, element);
                else rowElementsRef.current.delete(row.id);
              }}
              data-row={row.id}
              style={{
                flexGrow: nextWeights[row.id],
                flexShrink: 1,
                flexBasis: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflowY: row.scroll ? 'auto' : 'hidden',
                overflowX: 'hidden',
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
