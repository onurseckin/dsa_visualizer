import React from 'react';
import { GridCellNode, ElementState } from '../../types/dsa';

export interface GridVisualizerProps {
  grid: GridCellNode[][];
  cellSize?: number;
  showDistance?: boolean;
  onCellClick?: (row: number, col: number) => void;
  title?: string;
}

const getCellAppearance = (cell: GridCellNode) => {
  if (cell.isStart) {
    return {
      bg: 'rgba(0, 255, 157, 0.25)',
      border: 'var(--accent-emerald)',
      color: 'var(--accent-emerald)',
      shadow: '0 0 10px rgba(0, 255, 157, 0.6)',
      symbol: 'S',
    };
  }
  if (cell.isEnd) {
    return {
      bg: 'rgba(239, 68, 68, 0.25)',
      border: '#ef4444',
      color: '#ef4444',
      shadow: '0 0 10px rgba(239, 68, 68, 0.6)',
      symbol: 'E',
    };
  }
  if (cell.isWall) {
    return {
      bg: '#040d0a',
      border: '#0a1c16',
      color: '#334155',
      shadow: 'none',
      symbol: '',
    };
  }
  if (cell.isPath) {
    return {
      bg: 'rgba(245, 158, 11, 0.35)',
      border: '#f59e0b',
      color: '#ffffff',
      shadow: '0 0 12px rgba(245, 158, 11, 0.7)',
      symbol: '',
    };
  }
  if (cell.isVisited) {
    return {
      bg: 'rgba(6, 182, 212, 0.25)',
      border: '#06b6d4',
      color: '#a7f3d0',
      shadow: '0 0 6px rgba(6, 182, 212, 0.3)',
      symbol: '',
    };
  }

  // Handle explicit ElementState fallback
  const state: ElementState = cell.state || 'default';
  switch (state) {
    case 'compare':
      return {
        bg: 'var(--state-compare-bg)',
        border: 'var(--state-compare)',
        color: 'var(--state-compare)',
        shadow: '0 0 8px rgba(245, 158, 11, 0.5)',
        symbol: '',
      };
    case 'active':
      return {
        bg: 'var(--state-active-bg)',
        border: 'var(--state-active)',
        color: 'var(--state-active)',
        shadow: '0 0 8px rgba(59, 130, 246, 0.5)',
        symbol: '',
      };
    case 'default':
    default:
      return {
        bg: 'var(--bg-surface)',
        border: 'var(--border-muted)',
        color: 'var(--text-dim)',
        shadow: 'none',
        symbol: '',
      };
  }
};

export const GridVisualizer: React.FC<GridVisualizerProps> = ({
  grid,
  cellSize = 36,
  showDistance = false,
  onCellClick,
  title,
}) => {
  if (!grid || grid.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflow: 'auto',
      }}
    >
      {title && (
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--accent-mint)',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${grid[0].length}, ${cellSize}px)`,
          gap: '4px',
          background: 'var(--bg-darkest)',
          padding: '8px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {grid.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            const appearance = getCellAppearance(cell);
            const distLabel =
              showDistance && cell.distance !== undefined && cell.distance !== Infinity
                ? cell.distance
                : '';

            return (
              <div
                key={`grid-cell-${rIdx}-${cIdx}`}
                onClick={() => onCellClick?.(rIdx, cIdx)}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  backgroundColor: appearance.bg,
                  border: `1px solid ${appearance.border}`,
                  borderRadius: '4px',
                  boxShadow: appearance.shadow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: onCellClick ? 'pointer' : 'default',
                  userSelect: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-code)',
                  color: appearance.color,
                  transition: 'all 0.2s ease-in-out',
                }}
                title={`Row ${rIdx}, Col ${cIdx}${
                  cell.distance !== undefined ? ` | Dist: ${cell.distance}` : ''
                }`}
              >
                {appearance.symbol ? appearance.symbol : distLabel}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GridVisualizer;
