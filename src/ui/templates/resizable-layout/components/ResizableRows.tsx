import React from "react";
import { DragHandle } from "./DragHandle";
import { usePointerDrag } from "../hooks/usePointerDrag";

const KEYBOARD_STEP_PX = 16;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

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
    nextHeights[row.id] =
      typeof row.height === "number" && Number.isFinite(row.height) ? row.height : null;
  }
  heightsRef.current = nextHeights;

  /* A pinned row may never eat the whole column: the remainder has to stay
     large enough for its neighbours to be grabbable. */
  const clampRowHeight = React.useCallback(
    (value: number): number => {
      const available = containerRef.current!.getBoundingClientRect().height;
      const ceiling =
        available > minRowHeight * 2
          ? Math.min(maxRowHeight, available - minRowHeight)
          : maxRowHeight;
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
      const element = rowElementsRef.current.get(dragRowId!);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      if (!(rect.height > 0)) return;
      applyHeight(dragRowId!, clampRowHeight(clientY - rect.top), false);
    },
    [dragRowId, applyHeight, clampRowHeight],
  );

  const onEnd = React.useCallback(() => {
    setDragRowId(null);
    onHeightsCommit?.(heightsRef.current);
  }, [onHeightsCommit]);

  usePointerDrag(dragRowId !== null, onMove, onEnd);

  const nudge = React.useCallback(
    (id: string, delta: number) => {
      const stored = heightsRef.current[id];
      const element = rowElementsRef.current.get(id);
      const base = stored ?? element!.getBoundingClientRect().height;
      applyHeight(id, clampRowHeight(base + delta), true);
    },
    [applyHeight, clampRowHeight],
  );

  const hasPinnedRow = visibleRows.some((row) => row.height !== null);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: hasPinnedRow ? "100%" : "auto",
        minHeight: 0,
        overflowY: hasPinnedRow ? "auto" : "visible",
        overflowX: "hidden",
        userSelect: dragRowId !== null ? "none" : "auto",
      }}
    >
      {visibleRows.map((row, index) => {
        const previous = index > 0 ? visibleRows[index - 1] : null;
        const targetHeight = previous ? heightsRef.current[previous.id] : null;
        const height = nextHeights[row.id];
        const mode = height !== null ? "pinned" : row.greedy === true ? "greedy" : "hug";

        return (
          <React.Fragment key={row.id}>
            {previous && (
              <DragHandle
                orientation="horizontal"
                label={`Resize ${previous.label} and ${row.label} rows`}
                valueNow={targetHeight ?? minRowHeight}
                valueMin={minRowHeight}
                valueMax={maxRowHeight}
                valueText={targetHeight === null ? "Automatic, sized to content" : undefined}
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
                display: "flex",
                flexDirection: "column",
                flexGrow: mode === "greedy" ? 1 : 0,
                flexShrink: mode === "greedy" ? 1 : 0,
                flexBasis: height !== null ? `${height}px` : mode === "greedy" ? "0%" : "auto",
                height: height !== null ? `${height}px` : undefined,
                minHeight: mode === "greedy" ? "var(--panel-min-h)" : undefined,
                overflowX: mode === "hug" ? "visible" : "hidden",
                overflowY: mode === "pinned" ? "auto" : mode === "greedy" ? "hidden" : "visible",
                background: row.id === "code" ? "var(--bg-inset)" : undefined,
              }}
              className={row.id === "code" ? "bg-[var(--bg-inset)]" : undefined}
            >
              {row.content}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
