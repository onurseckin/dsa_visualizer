import { useEffect, useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { IconButton } from '../../ui';

/* -------------------------------------------------------------------------
 * CodeExplainToggle — the single header/actions-row control that replaces
 * the old per-line inline Info-icon-per-row pattern. Purely controlled: the
 * host owns `enabled` state (and therefore its own default — CodeBlockViewer
 * defaults it on, CodePuzzle's trivia surface defaults it off) and this just
 * renders the button and reports clicks back up.
 * ---------------------------------------------------------------------- */

export interface CodeExplainToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function CodeExplainToggle({ enabled, onToggle }: CodeExplainToggleProps): ReactElement {
  return (
    <IconButton
      icon={<Info />}
      variant="ghost"
      size="sm"
      selected={enabled}
      title="Toggle line explanations (hover a line to preview)"
      aria-label="Toggle line explanations"
      onClick={onToggle}
    />
  );
}

/* -------------------------------------------------------------------------
 * useHoveredCodeLine — shared hover-tracking primitive. A row opts in by
 * spreading `rowHoverHandlers(lineNumber)` onto itself; the hook measures
 * the row's own `getBoundingClientRect()` on enter (so the popover can be
 * anchored with `position: fixed` outside any scrolling ancestor) and clears
 * on leave. Deliberately holds a single `hovered` value (not a set/stack) so
 * rapid hovering across many lines can only ever resolve to one popover —
 * the newest enter always wins, and a leave is only honored if it still
 * matches the currently-hovered line (guards against a stale leave landing
 * after a newer enter already replaced it). When `enabled` is false, enters
 * are no-ops and any currently-open popover is torn down immediately so
 * flipping the toggle off always suppresses hover popovers regardless of
 * mouse position. Also torn down on scroll (capture-phase listener, since
 * the code well scrolls internally and a plain bubbling listener on window
 * would never see it) rather than repositioned, per the design brief.
 * ---------------------------------------------------------------------- */

export interface HoveredLine {
  line: number;
  rect: DOMRect;
}

export interface RowHoverHandlers {
  onMouseEnter: (event: ReactMouseEvent<HTMLElement>) => void;
  onMouseLeave: () => void;
}

export function useHoveredCodeLine(enabled: boolean): {
  hovered: HoveredLine | null;
  rowHoverHandlers: (line: number) => RowHoverHandlers;
} {
  const [hovered, setHovered] = useState<HoveredLine | null>(null);

  useEffect(() => {
    if (!enabled) setHovered(null);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const dismissOnScroll = (): void => setHovered(null);
    window.addEventListener('scroll', dismissOnScroll, true);
    return () => window.removeEventListener('scroll', dismissOnScroll, true);
  }, [enabled]);

  const rowHoverHandlers = (line: number): RowHoverHandlers => ({
    onMouseEnter: (event: ReactMouseEvent<HTMLElement>) => {
      if (!enabled) return;
      setHovered({ line, rect: event.currentTarget.getBoundingClientRect() });
    },
    onMouseLeave: () => {
      setHovered((current) => (current !== null && current.line === line ? null : current));
    },
  });

  return { hovered, rowHoverHandlers };
}

/* -------------------------------------------------------------------------
 * LineExplainPopover — the floating panel itself. Deliberately generic: it
 * takes a line number, its explanation text, the hovered row's measured
 * DOMRect, and a `side` ('left' | 'right') rather than assuming which side
 * of the code section it belongs on, so CodePuzzle.tsx can reuse this
 * unchanged mirrored to the right. Rendered through a portal to
 * document.body and positioned with `position: fixed` from the anchor rect
 * so it always escapes the code well's own `overflow: auto` clipping,
 * whatever DOM depth it's hovered from. `pointer-events: none` so the panel
 * never itself becomes a hover/click target that could steal the mouse away
 * from the row that opened it (or block whatever sits underneath it once
 * placed outside the code card).
 * ---------------------------------------------------------------------- */

export interface LineExplainPopoverProps {
  line: number;
  explanation: string;
  anchorRect: DOMRect;
  side: 'left' | 'right';
}

const POPOVER_WIDTH = 280;
const POPOVER_GAP = 12;
const POPOVER_ESTIMATED_HEIGHT = 168;
const VIEWPORT_MARGIN = 12;

function popoverPlacementStyle(anchorRect: DOMRect, side: 'left' | 'right'): CSSProperties {
  const viewportHeight = typeof window === 'undefined' ? 0 : window.innerHeight;
  const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth;
  const verticalCenter = anchorRect.top + anchorRect.height / 2;
  const minCenter = POPOVER_ESTIMATED_HEIGHT / 2 + VIEWPORT_MARGIN;
  const maxCenter = Math.max(minCenter, viewportHeight - POPOVER_ESTIMATED_HEIGHT / 2 - VIEWPORT_MARGIN);
  const top = Math.min(Math.max(verticalCenter, minCenter), maxCenter);

  const style: CSSProperties = {
    position: 'fixed',
    top,
    transform: 'translateY(-50%)',
    width: POPOVER_WIDTH,
    maxWidth: `min(${POPOVER_WIDTH}px, calc(100vw - ${VIEWPORT_MARGIN * 2}px))`,
    zIndex: 80,
    pointerEvents: 'none',
  };

  if (side === 'left') {
    style.right = Math.max(VIEWPORT_MARGIN, viewportWidth - anchorRect.left + POPOVER_GAP);
  } else {
    style.left = anchorRect.right + POPOVER_GAP;
  }

  return style;
}

const PANEL_STYLE: CSSProperties = {
  padding: 'var(--space-3)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-strong)',
  background: 'var(--bg-elevated)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
  fontFamily: 'var(--font-ui)',
};

const HEADER_STYLE: CSSProperties = {
  fontFamily: 'var(--font-code)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--accent)',
  marginBottom: 'var(--space-1)',
};

const BODY_STYLE: CSSProperties = {
  fontSize: 'var(--text-xs)',
  lineHeight: 1.5,
  color: 'var(--text-secondary)',
  whiteSpace: 'normal',
};

/* Connector: a CSS-border triangle glued to the edge of the panel nearest
   the anchor row, tip pointing back at it — the "visible connector/
   indicator tying it unambiguously to the line being hovered" the design
   calls for, on top of the "Line N" header text inside the panel itself. */
function connectorStyle(side: 'left' | 'right'): CSSProperties {
  const shared: CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 0,
    height: 0,
    borderTop: '6px solid transparent',
    borderBottom: '6px solid transparent',
  };
  return side === 'left'
    ? { ...shared, right: -6, borderLeft: '6px solid var(--border-strong)' }
    : { ...shared, left: -6, borderRight: '6px solid var(--border-strong)' };
}

export function LineExplainPopover({
  line,
  explanation,
  anchorRect,
  side,
}: LineExplainPopoverProps): ReactElement | null {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="tooltip"
      data-testid={`line-explain-popover-${line}`}
      data-side={side}
      style={{ ...PANEL_STYLE, ...popoverPlacementStyle(anchorRect, side) }}
    >
      <span aria-hidden="true" data-testid={`line-explain-connector-${line}`} style={connectorStyle(side)} />
      <div style={HEADER_STYLE}>Line {line}</div>
      <div style={BODY_STYLE}>{explanation}</div>
    </div>,
    document.body,
  );
}
