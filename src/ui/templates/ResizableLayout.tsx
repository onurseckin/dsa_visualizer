import React from "react";
import { DragHandle } from "./resizable-layout/components/DragHandle";
import { usePointerDrag } from "./resizable-layout/hooks/usePointerDrag";

export { DragHandle } from "./resizable-layout/components/DragHandle";
export type { DragHandleProps, HandleOrientation } from "./resizable-layout/components/DragHandle";
export { usePointerDrag } from "./resizable-layout/hooks/usePointerDrag";
export { ResizableRows } from "./resizable-layout/components/ResizableRows";
export type {
  ResizableRow,
  ResizableRowsProps,
  PanelHeightMap,
} from "./resizable-layout/components/ResizableRows";

const KEYBOARD_STEP_PERCENT = 2;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

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
  handleLabel = "Resize visualizer and code columns",
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
    return <div style={{ width: "100%", height: "100%" }} />;
  }
  if (!showLeft) {
    return <div style={{ width: "100%", height: "100%", minHeight: 0 }}>{rightPanel}</div>;
  }
  if (!showRight) {
    return <div style={{ width: "100%", height: "100%", minHeight: 0 }}>{leftPanel}</div>;
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        minHeight: 0,
        position: "relative",
        userSelect: dragging ? "none" : "auto",
      }}
    >
      <div
        style={{
          width: `${splitPercent}%`,
          height: "100%",
          minHeight: 0,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
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
          height: "100%",
          minHeight: 0,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
};
