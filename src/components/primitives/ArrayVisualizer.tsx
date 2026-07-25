import React from 'react';
import { ArrayElement, ElementState } from '../../types/dsa';

export interface ArrayVisualizerProps {
  elements: ArrayElement[];
  mode?: 'bar' | 'box';
  maxHeight?: number;
  title?: string;
}

/* ElementState names map 1:1 onto the --state-* token names in theme.css. */
const stateColor = (state: ElementState): string => `var(--state-${state})`;
const stateBg = (state: ElementState): string => `var(--state-${state}-bg)`;

interface PointerChipsProps {
  pointers: string[];
  centerX: number;
  baseY: number;
}

/* Small mono accent chips stacked above an element for pointer labels (i, j, mid…). */
const PointerChips: React.FC<PointerChipsProps> = ({ pointers, centerX, baseY }) => (
  <g>
    {pointers.map((ptr, pIdx) => {
      const chipWidth = ptr.length * 7 + 10;
      const chipY = baseY - 18 - (pointers.length - 1 - pIdx) * 18;
      return (
        <g key={`${ptr}-${pIdx}`}>
          <rect
            x={centerX - chipWidth / 2}
            y={chipY}
            width={chipWidth}
            height={15}
            rx={4}
            fill="var(--accent-soft)"
            stroke="var(--border-accent)"
            strokeWidth={1}
          />
          <text
            x={centerX}
            y={chipY + 7.5}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--accent)"
            fontSize="10"
            fontFamily="var(--font-code)"
            fontWeight="600"
          >
            {ptr}
          </text>
        </g>
      );
    })}
  </g>
);

export const ArrayVisualizer: React.FC<ArrayVisualizerProps> = ({
  elements,
  mode = 'bar',
  maxHeight = 220,
  title,
}) => {
  const maxVal = Math.max(...elements.map((el) => el.value), 1);
  const n = Math.max(elements.length, 1);
  const barWidth = Math.min(Math.max(700 / n, 32), 60);
  const gap = 8;
  const paddingX = 16;

  const isBoxMode = mode === 'box';
  const barAreaHeight = isBoxMode ? Math.min(barWidth, 48) : Math.min(maxHeight, 220);
  const topPadding = 40;
  const bottomPadding = 32;

  const viewBoxWidth = n * barWidth + (n - 1) * gap + paddingX * 2;
  const viewBoxHeight = topPadding + barAreaHeight + bottomPadding;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        minHeight: 'var(--panel-min-h)',
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
          border: '1px solid var(--border-default)',
        }}
      >
        {elements.map((item, index) => {
          const x = paddingX + index * (barWidth + gap);
          const fill = stateBg(item.state);
          const stroke = stateColor(item.state);
          // Touched elements get a heavier outline instead of a glow, so an
          // untouched navy element stays visibly inactive next to an active one.
          const strokeWidth = item.state === 'default' ? 1 : 2;

          if (mode === 'bar') {
            const heightPct = Math.max((item.value / maxVal) * 100, 12);
            const barHeight = Math.max(Math.round((heightPct * barAreaHeight) / 100), 16);
            const y = topPadding + (barAreaHeight - barHeight);
            const valueInside = barHeight >= 22;

            return (
              <g key={item.id || `arr-node-${index}`}>
                {item.pointers && item.pointers.length > 0 && (
                  <PointerChips
                    pointers={item.pointers}
                    centerX={x + barWidth / 2}
                    baseY={valueInside ? y : y - 16}
                  />
                )}

                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={6}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
                <text
                  x={x + barWidth / 2}
                  y={valueInside ? y + barHeight / 2 : y - 10}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--text-primary)"
                  fontFamily="var(--font-code)"
                  fontWeight="600"
                  fontSize={elements.length > 20 ? 10 : 13}
                >
                  {item.value}
                </text>

                <text
                  x={x + barWidth / 2}
                  y={topPadding + barAreaHeight + 18}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--text-faint)"
                  fontFamily="var(--font-code)"
                  fontSize="11"
                >
                  [{index}]
                </text>
              </g>
            );
          } else {
            const boxSize = Math.min(barWidth, 48);
            const y = topPadding + (barAreaHeight - boxSize) / 2;

            return (
              <g key={item.id || `arr-node-${index}`}>
                {item.pointers && item.pointers.length > 0 && (
                  <PointerChips
                    pointers={item.pointers}
                    centerX={x + barWidth / 2}
                    baseY={y}
                  />
                )}

                <rect
                  x={x + (barWidth - boxSize) / 2}
                  y={y}
                  width={boxSize}
                  height={boxSize}
                  rx={8}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
                <text
                  x={x + barWidth / 2}
                  y={y + boxSize / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--text-primary)"
                  fontFamily="var(--font-code)"
                  fontWeight="600"
                  fontSize="14"
                >
                  {item.value}
                </text>

                <text
                  x={x + barWidth / 2}
                  y={topPadding + barAreaHeight + 18}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--text-faint)"
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
