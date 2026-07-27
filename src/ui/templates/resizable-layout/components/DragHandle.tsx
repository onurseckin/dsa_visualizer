import React from "react";

const HANDLE_THICKNESS_PX = 8;

export type HandleOrientation = "vertical" | "horizontal";

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
  const isVertical = orientation === "vertical";
  const active = dragging || hovered || focused;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const backKey = isVertical ? "ArrowLeft" : "ArrowUp";
    const forwardKey = isVertical ? "ArrowRight" : "ArrowDown";
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
        width: isVertical ? `${HANDLE_THICKNESS_PX}px` : "100%",
        height: isVertical ? "100%" : `${HANDLE_THICKNESS_PX}px`,
        cursor: isVertical ? "col-resize" : "row-resize",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        touchAction: "none",
        zIndex: 1,
      }}
    >
      <div
        style={{
          width: isVertical ? "2px" : "100%",
          height: isVertical ? "100%" : "2px",
          background: active ? "var(--accent)" : "transparent",
          borderRadius: "var(--radius-full)",
          transition: "background var(--transition-fast)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
