import React from 'react';
import { ArrayElement, ElementState } from '../../types/dsa';

export interface ArrayVisualizerProps {
  elements: ArrayElement[];
  mode?: 'bar' | 'box';
  maxHeight?: number;
  title?: string;
}

const getStateStyles = (state: ElementState) => {
  switch (state) {
    case 'compare':
      return {
        bg: 'var(--state-compare-bg)',
        border: 'var(--state-compare)',
        color: 'var(--state-compare)',
        shadow: '0 0 12px rgba(245, 158, 11, 0.5)',
      };
    case 'swap':
      return {
        bg: 'var(--state-swap-bg)',
        border: 'var(--state-swap)',
        color: 'var(--state-swap)',
        shadow: '0 0 14px rgba(239, 68, 68, 0.6)',
      };
    case 'sorted':
      return {
        bg: 'var(--state-sorted-bg)',
        border: 'var(--state-sorted)',
        color: 'var(--state-sorted)',
        shadow: '0 0 12px rgba(0, 255, 157, 0.5)',
      };
    case 'active':
      return {
        bg: 'var(--state-active-bg)',
        border: 'var(--state-active)',
        color: 'var(--state-active)',
        shadow: '0 0 12px rgba(59, 130, 246, 0.5)',
      };
    case 'pivot':
      return {
        bg: 'var(--state-pivot-bg)',
        border: 'var(--state-pivot)',
        color: 'var(--state-pivot)',
        shadow: '0 0 12px rgba(168, 85, 247, 0.5)',
      };
    case 'visited':
      return {
        bg: 'rgba(6, 182, 212, 0.2)',
        border: '#06b6d4',
        color: '#06b6d4',
        shadow: '0 0 10px rgba(6, 182, 212, 0.4)',
      };
    case 'queued':
      return {
        bg: 'rgba(234, 179, 8, 0.2)',
        border: '#eab308',
        color: '#eab308',
        shadow: '0 0 10px rgba(234, 179, 8, 0.4)',
      };
    case 'in-stack':
      return {
        bg: 'rgba(236, 72, 153, 0.2)',
        border: '#ec4899',
        color: '#ec4899',
        shadow: '0 0 10px rgba(236, 72, 153, 0.4)',
      };
    case 'path':
      return {
        bg: 'rgba(16, 185, 129, 0.25)',
        border: '#10b981',
        color: '#10b981',
        shadow: '0 0 12px rgba(16, 185, 129, 0.5)',
      };
    case 'default':
    default:
      return {
        bg: 'var(--state-default)',
        border: 'var(--border-subtle)',
        color: 'var(--state-default-text)',
        shadow: 'none',
      };
  }
};

export const ArrayVisualizer: React.FC<ArrayVisualizerProps> = ({
  elements,
  mode = 'bar',
  maxHeight = 240,
  title,
}) => {
  const maxVal = Math.max(...elements.map((el) => el.value), 1);
  const n = Math.max(elements.length, 1);
  const barWidth = Math.min(Math.max(600 / n, 28), 54);
  const gap = 8;
  const paddingX = 16;
  const paddingY = 40;
  const viewBoxWidth = n * barWidth + (n - 1) * gap + paddingX * 2;
  const viewBoxHeight = maxHeight + paddingY + 40;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: 0,
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
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--bg-darkest)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {elements.map((item, index) => {
          const style = getStateStyles(item.state);
          const x = paddingX + index * (barWidth + gap);

          if (mode === 'bar') {
            const heightPct = Math.max((item.value / maxVal) * 100, 15);
            const barHeight = Math.round((heightPct * maxHeight) / 100);
            const y = paddingY + (maxHeight - barHeight);

            return (
              <g key={item.id || `arr-node-${index}`}>
                {/* Pointer labels above */}
                {item.pointers && item.pointers.length > 0 && (
                  <g>
                    {item.pointers.map((ptr, pIdx) => (
                      <text
                        key={`${ptr}-${pIdx}`}
                        x={x + barWidth / 2}
                        y={y - 8 - (item.pointers!.length - 1 - pIdx) * 14}
                        textAnchor="middle"
                        fill="var(--accent-emerald)"
                        fontSize="11"
                        fontFamily="var(--font-code)"
                        fontWeight="700"
                      >
                        {ptr}
                      </text>
                    ))}
                  </g>
                )}

                {/* Element bar body */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={6}
                  fill={style.bg}
                  stroke={style.border}
                  strokeWidth={2}
                />
                <text
                  x={x + barWidth / 2}
                  y={y + barHeight - 8}
                  textAnchor="middle"
                  fill={style.color}
                  fontFamily="var(--font-code)"
                  fontWeight="700"
                  fontSize={elements.length > 20 ? 10 : 13}
                >
                  {item.value}
                </text>

                {/* Index label below */}
                <text
                  x={x + barWidth / 2}
                  y={paddingY + maxHeight + 24}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontFamily="var(--font-code)"
                  fontSize="11"
                >
                  [{index}]
                </text>
              </g>
            );
          } else {
            const boxSize = Math.min(barWidth, 48);
            const y = paddingY + (maxHeight - boxSize) / 2;

            return (
              <g key={item.id || `arr-node-${index}`}>
                {/* Pointer labels above */}
                {item.pointers && item.pointers.length > 0 && (
                  <g>
                    {item.pointers.map((ptr, pIdx) => (
                      <text
                        key={`${ptr}-${pIdx}`}
                        x={x + barWidth / 2}
                        y={y - 8 - (item.pointers!.length - 1 - pIdx) * 14}
                        textAnchor="middle"
                        fill="var(--accent-emerald)"
                        fontSize="11"
                        fontFamily="var(--font-code)"
                        fontWeight="700"
                      >
                        {ptr}
                      </text>
                    ))}
                  </g>
                )}

                {/* Element box body */}
                <rect
                  x={x + (barWidth - boxSize) / 2}
                  y={y}
                  width={boxSize}
                  height={boxSize}
                  rx={8}
                  fill={style.bg}
                  stroke={style.border}
                  strokeWidth={2}
                />
                <text
                  x={x + barWidth / 2}
                  y={y + boxSize / 2 + 5}
                  textAnchor="middle"
                  fill={style.color}
                  fontFamily="var(--font-code)"
                  fontWeight="700"
                  fontSize="14"
                >
                  {item.value}
                </text>

                {/* Index label below */}
                <text
                  x={x + barWidth / 2}
                  y={paddingY + maxHeight + 24}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontFamily="var(--font-code)"
                  fontSize="11"
                >
                  [{index}]
                </text>
              </g>
            );
          }
        })}
      </svg>
    </div>
  );
};

export default ArrayVisualizer;
