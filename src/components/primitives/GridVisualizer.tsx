import React from 'react';
import { GridCellNode, ElementState } from '../../types/dsa';

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
}

/* ElementState names map 1:1 onto the --state-* token names in theme.css.
   Boolean flags (start/end/wall/path/visited) take priority over the state field. */
const getCellAppearance = (cell: GridCellNode): CellAppearance => {
  if (cell.isStart) {
    return {
      bg: 'var(--state-sorted-bg)',
      border: 'var(--state-sorted)',
      color: 'var(--state-sorted)',
      symbol: 'S',
    };
  }
  if (cell.isEnd) {
    return {
      bg: 'var(--state-swap-bg)',
      border: 'var(--state-swap)',
      color: 'var(--state-swap)',
      symbol: 'E',
    };
  }
  if (cell.isWall) {
    return {
      bg: 'var(--bg-pressed)',
      border: 'var(--border-strong)',
      color: 'var(--text-faint)',
      symbol: '',
    };
  }
  if (cell.isPath) {
    return {
      bg: 'var(--state-path-bg)',
      border: 'var(--state-path)',
      color: 'var(--text-primary)',
      symbol: '',
    };
  }
  if (cell.isVisited) {
    return {
      bg: 'var(--state-visited-bg)',
      border: 'var(--state-visited)',
      color: 'var(--text-secondary)',
      symbol: '',
    };
  }

  const state: ElementState = cell.state || 'default';
  return {
    bg: `var(--state-${state}-bg)`,
    border: `var(--state-${state})`,
    color: state === 'default' ? 'var(--text-muted)' : 'var(--text-primary)',
    symbol: '',
  };
};

export const GridVisualizer: React.FC<GridVisualizerProps> = ({
  grid,
  cellSize = 42,
  showDistance = true,
  onCellClick,
  title,
}) => {
  if (!grid || grid.length === 0) return null;

  const rows = grid.length;
  const cols = grid[0].length;
  const gap = 4;
  const padding = 8;
  const viewBoxWidth = cols * cellSize + (cols - 1) * gap + padding * 2;
  const viewBoxHeight = rows * cellSize + (rows - 1) * gap + padding * 2;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        minHeight: '300px',
        padding: 0,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: 'var(--space-2)',
          }}
        >
          {title}
        </div>
      )}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          background: 'var(--bg-inset)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {grid.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            const appearance = getCellAppearance(cell);
            const distLabel =
              showDistance && cell.distance !== undefined && cell.distance !== Infinity
                ? String(cell.distance)
                : '';
            const cellText = appearance.symbol ? appearance.symbol : distLabel;

            const x = padding + cIdx * (cellSize + gap);
            const y = padding + rIdx * (cellSize + gap);

            return (
              <g
                key={`grid-cell-${rIdx}-${cIdx}`}
                onClick={() => onCellClick?.(rIdx, cIdx)}
                style={{ cursor: onCellClick ? 'pointer' : 'default' }}
              >
                <title>
                  {`Row ${rIdx}, Col ${cIdx}${
                    cell.distance !== undefined ? ` | Dist: ${cell.distance}` : ''
                  }`}
                </title>
                <rect
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  rx={4}
                  fill={appearance.bg}
                  stroke={appearance.border}
                  strokeWidth={1}
                />
                {cellText && (
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2}
                    dominantBaseline="central"
                    textAnchor="middle"
                    fill={appearance.color}
                    fontSize="12"
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
  );
};

export default GridVisualizer;
