import React from 'react';
import { GridCellNode, ElementState } from '../../types/dsa';
import { Size, boxViewBox, clamp, fitSlots, useCanvasBox, viewBoxAttr } from './vizGeometry';

export interface GridVisualizerProps {
  grid: GridCellNode[][];
  cellSize?: number;
  showDistance?: boolean;
  onCellClick?: (row: number, col: number) => void;
  title?: string;
}

interface CellAppearance {
  bg: string;
  border: string;
  color: string;
  symbol: string;
  /* Touched cells get a heavier outline (never a glow) so untouched carbon cells
     stay visibly inactive next to active ones. */
  strokeWidth: number;
}

const GAP = 4;
const PAD = 4;
const MIN_CELL = 8;
/* Sanity cap on the height-derived cell: a 1–2 row grid would otherwise mint
   half-panel squares. From 3 rows up in a normal panel the cap never binds, so
   the height is fully spent (see the numbers in DESIGN.md R6.1). */
const MAX_CELL = 180;

interface CellFit {
  cell: number;
  gap: number;
}

/**
 * Square-cell geometry for one measured canvas.
 *
 * The cell comes off the HEIGHT (DESIGN.md R6.1): square cells cannot match an
 * arbitrary canvas ratio, so the axis that must be spent completely is the
 * vertical one — leftover height is the defect being fixed, leftover width is
 * merely centred. The column fit only steps in for a grid wider than the panel's
 * ratio, where honouring the height would push cells off the canvas.
 */
const cellFit = (rows: number, cols: number, box: Size): CellFit => {
  const rowFit = fitSlots(rows, box.height - PAD * 2, GAP, MIN_CELL, MAX_CELL);
  const colFit = fitSlots(cols, box.width - PAD * 2, GAP, MIN_CELL, MAX_CELL);
  const cell = Math.min(rowFit.size, colFit.size);
  const fits =
    cell * cols + Math.max(cols - 1, 0) * GAP <= box.width &&
    cell * rows + Math.max(rows - 1, 0) * GAP <= box.height;
  if (fits) return { cell, gap: GAP };

  /* The cell floor has bound on a grid too big for the canvas. Nothing rescales
     the drawing any more, so the gap goes first and then the floor: a cramped
     grid still shows every cell instead of losing its last rows to the edge. */
  const gap = Math.min(GAP, Math.min(box.width / (cols * 4), box.height / (rows * 4)));
  return {
    cell: Math.max(
      Math.min(
        (box.width - gap * Math.max(cols - 1, 0)) / cols,
        (box.height - gap * Math.max(rows - 1, 0)) / rows
      ),
      1
    ),
    gap,
  };
};

/* ElementState names map 1:1 onto the --state-* token names in theme.css.
   Boolean flags (start/end/wall/path/visited) take priority over the state field. */
const getCellAppearance = (cell: GridCellNode): CellAppearance => {
  if (cell.isStart) {
    return {
      bg: 'var(--state-sorted-bg)',
      border: 'var(--state-sorted)',
      color: 'var(--state-sorted)',
      symbol: 'S',
      strokeWidth: 2,
    };
  }
  if (cell.isEnd) {
    return {
      bg: 'var(--state-swap-bg)',
      border: 'var(--state-swap)',
      color: 'var(--state-swap)',
      symbol: 'E',
      strokeWidth: 2,
    };
  }
  if (cell.isWall) {
    return {
      bg: 'var(--bg-pressed)',
      border: 'var(--border-strong)',
      // Faint/muted tones lose AA on --bg-pressed, so wall labels stay secondary.
      color: 'var(--text-secondary)',
      symbol: '',
      strokeWidth: 1,
    };
  }
  if (cell.isPath) {
    return {
      bg: 'var(--state-path-bg)',
      border: 'var(--state-path)',
      color: 'var(--text-primary)',
      symbol: '',
      strokeWidth: 2,
    };
  }
  if (cell.isVisited) {
    return {
      bg: 'var(--state-visited-bg)',
      border: 'var(--state-visited)',
      color: 'var(--text-secondary)',
      symbol: '',
      strokeWidth: 2,
    };
  }

  const state: ElementState = cell.state || 'default';
  return {
    bg: `var(--state-${state}-bg)`,
    border: `var(--state-${state})`,
    color: state === 'default' ? 'var(--text-muted)' : 'var(--text-primary)',
    symbol: '',
    strokeWidth: state === 'default' ? 1 : 2,
  };
};

export const GridVisualizer: React.FC<GridVisualizerProps> = ({
  grid,
  cellSize = 42,
  showDistance = true,
  onCellClick,
  title,
}) => {
  const rows = grid.length;
  const cols = grid.reduce((widest, row) => Math.max(widest, row.length), 0);

  /* `cellSize` is the ideal cell, so an unmeasured canvas (jsdom, first paint)
     still lays out sensibly; a measured canvas grows the cells past it. */
  const fallbackBox: Size = {
    width: cols * cellSize + Math.max(cols - 1, 0) * GAP + PAD * 2,
    height: rows * cellSize + Math.max(rows - 1, 0) * GAP + PAD * 2,
  };
  const { ref, box } = useCanvasBox(fallbackBox);

  const { cell, gap } = cellFit(rows, cols, box);
  const gridWidth = cols * cell + Math.max(cols - 1, 0) * gap;
  const gridHeight = rows * cell + Math.max(rows - 1, 0) * gap;
  /* Centring the remainder is what makes PAD reappear as the inset when the axis
     is fully spent, and what keeps a shape-constrained remainder symmetric. */
  const originX = Math.max((box.width - gridWidth) / 2, 0);
  const originY = Math.max((box.height - gridHeight) / 2, 0);

  const font = clamp(cell * 0.34, 7, 28);
  const strokeScale = clamp(cell / 48, 1, 1.8);
  const radius = clamp(cell * 0.1, 3, 12);

  if (rows === 0 || cols === 0) return null;

  return (
    // No height of its own: the canvas takes exactly the space the stage hands it.
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        alignSelf: 'stretch',
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: 'var(--space-1)',
            textAlign: 'center',
          }}
        >
          {title}
        </div>
      )}
      {/* The well carries the border and is the measured element: with no padding
          of its own its client box IS the svg viewport, so the viewBox matches it
          exactly and the inset surface reaches every edge of the canvas. */}
      <div
        ref={ref}
        style={{
          flex: '1 1 auto',
          width: '100%',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
          background: 'var(--bg-inset)',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={viewBoxAttr(boxViewBox(box))}
          style={{ display: 'block' }}
        >
          {grid.map((row, rIdx) =>
            row.map((gridCell, cIdx) => {
              const appearance = getCellAppearance(gridCell);
              const distLabel =
                showDistance && gridCell.distance !== undefined && gridCell.distance !== Infinity
                  ? String(gridCell.distance)
                  : '';
              const cellText = appearance.symbol ? appearance.symbol : distLabel;

              const x = originX + cIdx * (cell + gap);
              const y = originY + rIdx * (cell + gap);

              return (
                <g
                  key={`grid-cell-${rIdx}-${cIdx}`}
                  onClick={() => onCellClick?.(rIdx, cIdx)}
                  style={{ cursor: onCellClick ? 'pointer' : 'default' }}
                >
                  <title>
                    {`Row ${rIdx}, Col ${cIdx}${
                      gridCell.distance !== undefined ? ` | Dist: ${gridCell.distance}` : ''
                    }`}
                  </title>
                  <rect
                    x={x}
                    y={y}
                    width={cell}
                    height={cell}
                    rx={radius}
                    fill={appearance.bg}
                    stroke={appearance.border}
                    strokeWidth={appearance.strokeWidth * strokeScale}
                  />
                  {cellText && (
                    <text
                      x={x + cell / 2}
                      y={y + cell / 2}
                      dominantBaseline="central"
                      textAnchor="middle"
                      fill={appearance.color}
                      fontSize={font}
                      fontFamily="var(--font-code)"
                      fontWeight="600"
                    >
                      {cellText}
                    </text>
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
};

export default GridVisualizer;
