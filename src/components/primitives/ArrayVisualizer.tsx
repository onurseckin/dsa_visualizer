import React from 'react';
import { ArrayElement, ElementState } from '../../types/dsa';
import { Size, clamp, fitBox, fitSlots, useCanvasBox, viewBoxAttr } from './vizGeometry';

export interface ArrayVisualizerProps {
  elements: ArrayElement[];
  mode?: 'bar' | 'box';
  maxHeight?: number;
  title?: string;
}

/* ElementState names map 1:1 onto the --state-* token names in theme.css. */
const stateColor = (state: ElementState): string => `var(--state-${state})`;
const stateBg = (state: ElementState): string => `var(--state-${state}-bg)`;

const GAP = 8;
const PAD_X = 6;
const POINTER_ROW_H = 18;
const INDEX_ROW_H = 20;
const MIN_BAR_W = 10;
const MAX_BAR_W = 96;
const MAX_BOX = 92;
const MIN_BAND_H = 48;
/* Bar width the unmeasured fallback box is built from, so an unmeasured canvas
   (jsdom, first paint) reproduces the layout the old fixed viewBox produced. */
const FALLBACK_BAR_W = 60;

interface PointerChipsProps {
  pointers: string[];
  centerX: number;
  baseY: number;
  fontSize: number;
}

/* Small mono accent chips stacked above an element for pointer labels (i, j, mid…). */
const PointerChips: React.FC<PointerChipsProps> = ({ pointers, centerX, baseY, fontSize }) => (
  <g>
    {pointers.map((ptr, pIdx) => {
      const chipHeight = POINTER_ROW_H - 4;
      const chipWidth = ptr.length * fontSize * 0.68 + fontSize;
      const chipY = baseY - POINTER_ROW_H - (pointers.length - 1 - pIdx) * POINTER_ROW_H;
      return (
        <g key={`${ptr}-${pIdx}`}>
          <rect
            x={centerX - chipWidth / 2}
            y={chipY}
            width={chipWidth}
            height={chipHeight}
            rx={4}
            fill="var(--accent-soft)"
            stroke="var(--border-accent)"
            strokeWidth={1}
          />
          <text
            x={centerX}
            y={chipY + chipHeight / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--accent)"
            fontSize={fontSize}
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
  const count = Math.max(elements.length, 1);
  const pointerRows = elements.reduce(
    (rows, element) => Math.max(rows, element.pointers?.length ?? 0),
    0
  );

  const topPad = pointerRows > 0 ? pointerRows * POINTER_ROW_H + 4 : 4;
  const bottomPad = INDEX_ROW_H;

  const fallbackBox: Size = {
    width: count * FALLBACK_BAR_W + (count - 1) * GAP + PAD_X * 2,
    height: topPad + Math.max(maxHeight, MIN_BAND_H) + bottomPad,
  };
  const { ref, box } = useCanvasBox(fallbackBox);

  /* Bars are laid out in the measured box's own pixels: the run stretches across
     the real width and the band takes every pixel of leftover height, so the
     content ratio matches the canvas ratio and nothing is left to letterbox. */
  const run = fitSlots(count, box.width - PAD_X * 2, GAP, MIN_BAR_W, MAX_BAR_W);
  const barWidth = run.size;
  const bandHeight = Math.max(box.height - topPad - bottomPad, MIN_BAND_H);

  const isBoxMode = mode === 'box';
  const boxSize = Math.min(barWidth, bandHeight, MAX_BOX);
  /* Squares cannot use leftover height without distorting, so the band collapses
     to the square and the inset well hugs the row instead of framing dead space. */
  const bandUsed = isBoxMode ? boxSize : bandHeight;

  const contentWidth = run.span + PAD_X * 2;
  const contentHeight = topPad + bandUsed + bottomPad;
  const svgSize = fitBox({ width: contentWidth, height: contentHeight }, box);

  const valueFont = clamp(barWidth * 0.3, 8, 22);
  const indexFont = clamp(barWidth * 0.22, 7, 13);
  const pointerFont = clamp(barWidth * 0.22, 8, 12);
  const minBarHeight = Math.max(bandHeight * 0.05, 6);
  const labelY = topPad + bandUsed + INDEX_ROW_H * 0.5;

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
          {elements.map((item, index) => {
            const x = PAD_X + index * (barWidth + run.gap);
            const fill = stateBg(item.state);
            const stroke = stateColor(item.state);
            // Touched elements get a heavier outline instead of a glow, so an
            // untouched carbon element stays visibly inactive next to an active one.
            const strokeWidth = item.state === 'default' ? 1 : 2;
            const pointers = item.pointers;

            if (!isBoxMode) {
              const barHeight = Math.max((item.value / maxVal) * bandHeight, minBarHeight);
              const y = topPad + (bandHeight - barHeight);
              const valueInside = barHeight >= valueFont * 1.9;

              return (
                <g key={item.id || `arr-node-${index}`}>
                  {pointers && pointers.length > 0 && (
                    <PointerChips
                      pointers={pointers}
                      centerX={x + barWidth / 2}
                      baseY={valueInside ? y : y - valueFont * 1.4}
                      fontSize={pointerFont}
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
                    y={valueInside ? y + barHeight / 2 : y - valueFont * 0.8}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="var(--text-primary)"
                    fontFamily="var(--font-code)"
                    fontWeight="600"
                    fontSize={valueFont}
                  >
                    {item.value}
                  </text>

                  <text
                    x={x + barWidth / 2}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="var(--text-muted)"
                    fontFamily="var(--font-code)"
                    fontSize={indexFont}
                  >
                    [{index}]
                  </text>
                </g>
              );
            }

            const y = topPad;

            return (
              <g key={item.id || `arr-node-${index}`}>
                {pointers && pointers.length > 0 && (
                  <PointerChips
                    pointers={pointers}
                    centerX={x + barWidth / 2}
                    baseY={y}
                    fontSize={pointerFont}
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
                  fontSize={valueFont}
                >
                  {item.value}
                </text>

                <text
                  x={x + barWidth / 2}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--text-muted)"
                  fontFamily="var(--font-code)"
                  fontSize={indexFont}
                >
                  [{index}]
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default ArrayVisualizer;
