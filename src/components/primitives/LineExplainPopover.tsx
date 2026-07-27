import { useEffect, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactElement } from "react";
import { createPortal } from "react-dom";

export interface HoveredLine {
  line: number;
  rect: DOMRect;
}

export interface RowHoverHandlers {
  onMouseEnter: (event: ReactMouseEvent<HTMLElement>) => void;
  onMouseLeave: () => void;
}

export function useHoveredCodeLine(): {
  hovered: HoveredLine | null;
  rowHoverHandlers: (line: number) => RowHoverHandlers;
} {
  const [hovered, setHovered] = useState<HoveredLine | null>(null);

  useEffect(() => {
    const dismissOnScroll = (): void => setHovered(null);
    window.addEventListener("scroll", dismissOnScroll, true);
    return () => window.removeEventListener("scroll", dismissOnScroll, true);
  }, []);

  const rowHoverHandlers = (line: number): RowHoverHandlers => ({
    onMouseEnter: (event: ReactMouseEvent<HTMLElement>) => {
      setHovered({ line, rect: event.currentTarget.getBoundingClientRect() });
    },
    onMouseLeave: () => {
      setHovered((current) => (current !== null && current.line === line ? null : current));
    },
  });

  return { hovered, rowHoverHandlers };
}

export interface LineExplainPopoverProps {
  line: number;
  explanation: string;
  anchorRect: DOMRect;
  side: "left" | "right";
}

const POPOVER_WIDTH = 280;
const POPOVER_GAP = 12;
const POPOVER_ESTIMATED_HEIGHT = 168;
const VIEWPORT_MARGIN = 12;

function popoverPlacementStyle(anchorRect: DOMRect, side: "left" | "right"): CSSProperties {
  const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight;
  const viewportWidth = typeof window === "undefined" ? 0 : window.innerWidth;
  const verticalCenter = anchorRect.top + anchorRect.height / 2;
  const minCenter = POPOVER_ESTIMATED_HEIGHT / 2 + VIEWPORT_MARGIN;
  const maxCenter = Math.max(
    minCenter,
    viewportHeight - POPOVER_ESTIMATED_HEIGHT / 2 - VIEWPORT_MARGIN,
  );
  const top = Math.min(Math.max(verticalCenter, minCenter), maxCenter);

  const style: CSSProperties = {
    position: "fixed",
    top,
    transform: "translateY(-50%)",
    width: POPOVER_WIDTH,
    maxWidth: `min(${POPOVER_WIDTH}px, calc(100vw - ${VIEWPORT_MARGIN * 2}px))`,
    zIndex: 80,
    pointerEvents: "none",
  };

  if (side === "left") {
    style.right = Math.max(VIEWPORT_MARGIN, viewportWidth - anchorRect.left + POPOVER_GAP);
  } else {
    style.left = anchorRect.right + POPOVER_GAP;
  }

  return style;
}

function connectorStyle(side: "left" | "right"): CSSProperties {
  const shared: CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 0,
    height: 0,
    borderTop: "6px solid transparent",
    borderBottom: "6px solid transparent",
  };
  return side === "left"
    ? { ...shared, right: -6, borderLeft: "6px solid var(--border-strong)" }
    : { ...shared, left: -6, borderRight: "6px solid var(--border-strong)" };
}

export function LineExplainPopover({
  line,
  explanation,
  anchorRect,
  side,
}: LineExplainPopoverProps): ReactElement | null {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="tooltip"
      data-testid={`line-explain-popover-${line}`}
      data-side={side}
      className="p-3 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-lg font-[var(--font-ui)]"
      style={popoverPlacementStyle(anchorRect, side)}
    >
      <span
        aria-hidden="true"
        data-testid={`line-explain-connector-${line}`}
        style={connectorStyle(side)}
      />
      <div className="font-mono text-xs font-semibold text-[var(--accent)] mb-1">Line {line}</div>
      <div className="text-xs leading-normal text-[var(--text-secondary)] normal-case">
        {explanation}
      </div>
    </div>,
    document.body,
  );
}
