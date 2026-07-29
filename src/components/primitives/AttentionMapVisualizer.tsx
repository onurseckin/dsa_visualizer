import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";
import { AuxiliaryState, DisplayValue } from "../../types/dsa";
import { CanvasAuxiliaryOverlay } from "./CanvasAuxiliaryOverlay";

export interface AttentionMapVisualizerProps {
  queryTokens: string[];
  keyTokens: string[];
  weights: number[][]; // [queryIdx][keyIdx] -> value between 0 and 1
  activeQueryIndex?: number;
  activeKeyIndex?: number;
  title?: string;
  auxiliaryState?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

export const AttentionMapVisualizer: React.FC<AttentionMapVisualizerProps> = ({
  queryTokens = [],
  keyTokens = [],
  weights = [],
  activeQueryIndex,
  activeKeyIndex,
  title,
  auxiliaryState,
  variables,
}) => {
  const { ref, box } = useCanvasBox({ width: 800, height: 500 });

  const numQueries = queryTokens.length;
  const numKeys = keyTokens.length;

  if (numQueries === 0 || numKeys === 0) {
    return null;
  }

  // Layout math for matrix grid:
  const leftHeaderWidth = 80;
  const topHeaderHeight = 40;
  const topTitlePad = title ? 30 : 10;
  const paddingRight = 40;
  const paddingBottom = 40;

  const availW = Math.max(100, box.width - leftHeaderWidth - paddingRight - 40);
  const availH = Math.max(100, box.height - topHeaderHeight - topTitlePad - paddingBottom);

  const cellWidth = Math.max(32, Math.min(70, availW / numKeys));
  const cellHeight = Math.max(28, Math.min(50, availH / numQueries));

  const startX = (box.width - (leftHeaderWidth + numKeys * cellWidth)) / 2 + leftHeaderWidth;
  const startY = topTitlePad + topHeaderHeight;

  return (
    <div
      data-testid="attentionmap-visualizer"
      style={{
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        alignSelf: "stretch",
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: "var(--text-muted)",
            marginBottom: "var(--space-1)",
            textAlign: "center",
          }}
        >
          {title}
        </div>
      )}
      <div
        ref={ref}
        data-testid="canvas-container"
        style={{
          flex: "1 1 auto",
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
          background: "var(--bg-inset)",
          padding: 0,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={viewBoxAttr(boxViewBox(box))}
          style={{ display: "block" }}
        >
          {/* Top Column Headers (Key Tokens) */}
          {keyTokens.map((kToken, cIdx) => {
            const cx = startX + cIdx * cellWidth + cellWidth / 2;
            const isKeyActive = cIdx === activeKeyIndex;
            return (
              <g key={`key-header-${cIdx}`}>
                <text
                  x={cx}
                  y={startY - 10}
                  textAnchor="middle"
                  fill={isKeyActive ? "var(--accent, #3b82f6)" : "var(--text-secondary)"}
                  fontSize="12"
                  fontWeight={isKeyActive ? "bold" : "600"}
                  fontFamily="var(--font-mono, monospace)"
                >
                  {kToken}
                </text>
              </g>
            );
          })}

          {/* Left Row Headers (Query Tokens) */}
          {queryTokens.map((qToken, rIdx) => {
            const ry = startY + rIdx * cellHeight + cellHeight / 2;
            const isQueryActive = rIdx === activeQueryIndex;
            return (
              <g key={`query-header-${rIdx}`}>
                <text
                  x={startX - 12}
                  y={ry + 4}
                  textAnchor="end"
                  fill={isQueryActive ? "var(--accent, #3b82f6)" : "var(--text-secondary)"}
                  fontSize="12"
                  fontWeight={isQueryActive ? "bold" : "600"}
                  fontFamily="var(--font-mono, monospace)"
                >
                  {qToken}
                </text>
              </g>
            );
          })}

          {/* Matrix Cells */}
          {queryTokens.map((_, rIdx) =>
            keyTokens.map((_, cIdx) => {
              const x = startX + cIdx * cellWidth;
              const y = startY + rIdx * cellHeight;

              const weight =
                weights[rIdx] && weights[rIdx][cIdx] !== undefined ? weights[rIdx][cIdx] : 0;

              const isActiveCell = rIdx === activeQueryIndex && cIdx === activeKeyIndex;
              const isQueryRowActive = rIdx === activeQueryIndex;

              // Color mix using accent for attention intensity
              const fillOpacity = Math.max(0.05, Math.min(1.0, weight));

              return (
                <g key={`cell-${rIdx}-${cIdx}`}>
                  {/* Cell Background */}
                  <rect
                    x={x + 2}
                    y={y + 2}
                    width={cellWidth - 4}
                    height={cellHeight - 4}
                    rx={4}
                    fill="var(--accent, #3b82f6)"
                    fillOpacity={fillOpacity * 0.75}
                    stroke={
                      isActiveCell
                        ? "#f59e0b"
                        : isQueryRowActive
                          ? "var(--accent, #3b82f6)"
                          : "var(--border-subtle)"
                    }
                    strokeWidth={isActiveCell ? 2.5 : isQueryRowActive ? 1.5 : 1}
                  />

                  {/* Weight Label Text */}
                  <text
                    x={x + cellWidth / 2}
                    y={y + cellHeight / 2 + 4}
                    textAnchor="middle"
                    fill={fillOpacity > 0.4 ? "var(--text-primary)" : "var(--text-secondary)"}
                    fontSize={cellWidth < 40 ? "10" : "11"}
                    fontWeight={isActiveCell || fillOpacity > 0.5 ? "bold" : "normal"}
                    fontFamily="var(--font-mono, monospace)"
                  >
                    {weight.toFixed(2)}
                  </text>
                </g>
              );
            }),
          )}

          {/* Legend / Axis labels */}
          <text
            x={startX - 12}
            y={startY - 26}
            textAnchor="end"
            fill="var(--text-muted)"
            fontSize="10"
            fontWeight="bold"
          >
            Queries ↓ / Keys →
          </text>

          <CanvasAuxiliaryOverlay box={box} state={auxiliaryState} variables={variables} />
        </svg>
      </div>
    </div>
  );
};

export default AttentionMapVisualizer;
