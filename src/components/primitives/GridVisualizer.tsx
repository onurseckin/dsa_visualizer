import React from 'react';
import { GridCellNode, ElementState } from '../../types/dsa';
import { Size, clamp, fitBox, fitSlots, useCanvasBox, viewBoxAttr } from './vizGeometry';

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
const MAX_CELL = 160;

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
     reproduces the layout the old fixed viewBox produced; a measured canvas grows
     the cells past it instead. */
  const fallbackBox: Size = {
    width: cols * cellSize + Math.max(cols - 1, 0) * GAP + PAD * 2,
    height: rows * cellSize + Math.max(rows - 1, 0) * GAP + PAD * 2,
  };
  const { ref, box } = useCanvasBox(fallbackBox);

  /* Square cells cannot match an arbitrary canvas ratio, so the cell grows until
     it fills the limiting axis and the inset well is then sized to the grid's own
     ratio — the drawing is as large as geometry allows with no dead band inside. */
  const colFit = fitSlots(cols, box.width - PAD * 2, GAP, MIN_CELL, MAX_CELL);
  const rowFit = fitSlots(rows, box.height - PAD * 2, GAP, MIN_CELL, MAX_CELL);
  const cell = Math.min(colFit.size, rowFit.size);

  const contentWidth = cols * cell + Math.max(cols - 1, 0) * GAP + PAD * 2;
  const contentHeight = rows * cell + Math.max(rows - 1, 0) * GAP + PAD * 2;
  const svgSize = fitBox({ width: contentWidth, height: contentHeight }, box);
  const font = clamp(cell * 0.34, 7, 20);

  if (rows === 0 || cols === 0) return null;

  return (
    // No height of its own: the canvas takes exactly the space the stage hands it.
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
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
          }}
        >
          {title}
        </div>
      )}
      <div
        ref={ref}
        style={{
          flex: '1 1 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <svg
          width={Math.round(svgSize.width)}
          height={Math.round(svgSize.height)}
          viewBox={viewBoxAttr({ minX: 0, minY: 0, width: contentWidth, height: contentHeight })}
          preserveAspectRatio="xMidYMid meet"
          style={{
            display: 'block',
            background: 'var(--bg-inset)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          {grid.map((row, rIdx) =>
            row.map((gridCell, cIdx) => {
              const appearance = getCellAppearance(gridCell);
              const distLabel =
                showDistance && gridCell.distance !== undefined && gridCell.distance !== Infinity
                  ? String(gridCell.distance)
                  : '';
              const cellText = appearance.symbol ? appearance.symbol : distLabel;

              const x = PAD + cIdx * (cell + GAP);
              const y = PAD + rIdx * (cell + GAP);

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
                    rx={4}
                    fill={appearance.bg}
                    stroke={appearance.border}
                    strokeWidth={appearance.strokeWidth}
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
