import React from 'react';
import { ArrayElement, ElementState } from '../../types/dsa';
import { Size, boxViewBox, clamp, fitSlots, useCanvasBox, viewBoxAttr } from './vizGeometry';

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
/* Width the bar cap leaves over widens the gaps, up to a quarter of the bar:
   past that the bars stop reading as one series and become unrelated islands. */
const MAX_GAP_RATIO = 0.25;
const PAD_X = 6;
const MIN_BAR_W = 10;
const MAX_BAR_W = 160;
/* Bar width the unmeasured fallback box is built from, so an unmeasured canvas
   (jsdom, first paint) still produces a sane layout. */
const FALLBACK_BAR_W = 60;

interface BarRun {
  size: number;
  gap: number;
  span: number;
}

/**
 * Bar geometry for one measured canvas width. Two things it must guarantee, since
 * the viewBox is now the box and nothing downstream can rescale the drawing
 * (DESIGN.md R6.1): the run never overflows the canvas, and leftover width is
 * spent on the bars and then the gaps before any of it is left as margin.
 */
const barRun = (count: number, avail: number): BarRun => {
  const gaps = Math.max(count - 1, 0);
  const roomy = fitSlots(count, avail, GAP, MIN_BAR_W, MAX_BAR_W);

  if (roomy.span > avail) {
    // A dense array gives up its gap first and only then goes under the bar
    // floor, because clipping bars off the canvas edge loses data outright.
    const gap = gaps > 0 ? Math.min(GAP, avail / (count * 4)) : 0;
    const size = Math.max((avail - gap * gaps) / count, 1);
    return { size, gap, span: size * count + gap * gaps };
  }

  const maxGap = Math.max(GAP, roomy.size * MAX_GAP_RATIO);
  const gap = gaps > 0 ? clamp((avail - roomy.span) / gaps + roomy.gap, GAP, maxGap) : 0;
  return { size: roomy.size, gap, span: roomy.size * count + gap * gaps };
};

interface PointerChipsProps {
  pointers: string[];
  centerX: number;
  baseY: number;
  rowHeight: number;
  fontSize: number;
}

/* Small mono accent chips stacked above an element for pointer labels (i, j, mid…). */
const PointerChips: React.FC<PointerChipsProps> = ({
  pointers,
  centerX,
  baseY,
  rowHeight,
  fontSize,
}) => {
  // The stack grows upward, so it is the TOP that has to be pinned inside the
  // canvas: a short bar wants its chips lower than the reserved inset allows.
  const top = Math.max(baseY - pointers.length * rowHeight, 1);

  return (
    <g>
      {pointers.map((ptr, pIdx) => {
        const chipHeight = rowHeight - 4;
        const chipWidth = ptr.length * fontSize * 0.68 + fontSize;
        const chipY = top + pIdx * rowHeight;
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
};

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

  const fallbackBox: Size = {
    width: count * FALLBACK_BAR_W + (count - 1) * GAP + PAD_X * 2,
    height: maxHeight + 48,
  };
  const { ref, box } = useCanvasBox(fallbackBox);

  const run = barRun(count, Math.max(box.width - PAD_X * 2, 1));
  const barWidth = run.size;
  /* Type sizes come off the bar width, so a wide panel gets bigger numbers rather
     than the same small ones with more air around them. */
  const valueFont = clamp(barWidth * 0.34, 9, 30);
  const indexFont = clamp(barWidth * 0.24, 8, 16);
  const pointerFont = clamp(barWidth * 0.24, 9, 15);
  const pointerRowH = pointerFont * 1.55;

  /* Both insets are capped as a share of the height so the bar band still owns
     most of a short canvas instead of being squeezed out by the label rows. */
  const topPad = Math.min(pointerRows > 0 ? pointerRows * pointerRowH + 4 : 4, box.height * 0.32);
  const bottomPad = Math.min(indexFont * 1.6, box.height * 0.18);
  /* The band is every pixel between the insets and the tallest bar is the band,
     so the drawing touches both the top inset and the baseline: no vertical slack
     to letterbox, move outside the svg, or tune away. */
  const bandHeight = Math.max(box.height - topPad - bottomPad, 1);
  const baselineY = topPad + bandHeight;

  const isBoxMode = mode === 'box';
  /* One row of squares cannot consume an arbitrary height without distorting, so
     box mode is the single place slack is unavoidable — it is centred in the band
     rather than dropped at the bottom. */
  const boxSize = Math.min(barWidth, bandHeight);
  const boxY = topPad + (bandHeight - boxSize) / 2;

  const startX = (box.width - run.span) / 2;
  const minBarHeight = Math.max(bandHeight * 0.04, 4);
  const barRadius = clamp(barWidth * 0.12, 3, 10);
  const labelY = Math.min(baselineY + bottomPad / 2, box.height - indexFont * 0.6);

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
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={viewBoxAttr(boxViewBox(box))}
          style={{ display: 'block' }}
        >
          {elements.map((item, index) => {
            const x = startX + index * (barWidth + run.gap);
            const fill = stateBg(item.state);
            const stroke = stateColor(item.state);
            // Touched elements get a heavier outline instead of a glow, so an
            // untouched carbon element stays visibly inactive next to an active one.
            const strokeWidth = item.state === 'default' ? 1.25 : 2.5;
            const pointers = item.pointers;

            if (!isBoxMode) {
              const barHeight = Math.max((item.value / maxVal) * bandHeight, minBarHeight);
              const y = baselineY - barHeight;
              const valueInside = barHeight >= valueFont * 1.9;

              return (
                <g key={item.id || `arr-node-${index}`}>
                  {pointers && pointers.length > 0 && (
                    <PointerChips
                      pointers={pointers}
                      centerX={x + barWidth / 2}
                      baseY={valueInside ? y : y - valueFont * 1.4}
                      rowHeight={pointerRowH}
                      fontSize={pointerFont}
                    />
                  )}

                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={barRadius}
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

            return (
              <g key={item.id || `arr-node-${index}`}>
                {pointers && pointers.length > 0 && (
                  <PointerChips
                    pointers={pointers}
                    centerX={x + barWidth / 2}
                    baseY={boxY}
                    rowHeight={pointerRowH}
                    fontSize={pointerFont}
                  />
                )}

                <rect
                  x={x + (barWidth - boxSize) / 2}
                  y={boxY}
                  width={boxSize}
                  height={boxSize}
                  rx={barRadius}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
                <text
                  x={x + barWidth / 2}
                  y={boxY + boxSize / 2}
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
