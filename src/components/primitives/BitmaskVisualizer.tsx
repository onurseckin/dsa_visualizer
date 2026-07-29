import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";
import { elementStateToken, BitmaskItem, AuxiliaryState, DisplayValue } from "../../types/dsa";
import { CanvasAuxiliaryOverlay } from "./CanvasAuxiliaryOverlay";

export interface BitmaskVisualizerProps {
  bits: BitmaskItem[];
  value?: number | string;
  label?: string;
  bitWidth?: number;
  operation?: {
    name: string;
    operand?: number | string;
    result?: number | string;
  };
  title?: string;
  auxiliaryState?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

export const BitmaskVisualizer: React.FC<BitmaskVisualizerProps> = ({
  bits = [],
  value,
  label,
  bitWidth,
  operation,
  title,
  auxiliaryState,
  variables,
}) => {
  const { ref, box } = useCanvasBox({ width: 800, height: 500 });

  const totalBits = bits.length > 0 ? bits.length : bitWidth || 8;
  const bitArray: BitmaskItem[] =
    bits.length > 0
      ? bits
      : Array.from({ length: totalBits }, (_, i) => ({
          index: totalBits - 1 - i,
          value: 0,
        }));

  // Group bit cells: max bit cell width 50, min 24
  const paddingX = 40;
  const availW = box.width - paddingX * 2;
  const cellGap = totalBits > 16 ? 3 : 6;
  const cellWidth = Math.max(24, Math.min(48, (availW - (totalBits - 1) * cellGap) / totalBits));
  const cellHeight = Math.min(54, cellWidth * 1.3);
  const totalRowW = totalBits * cellWidth + (totalBits - 1) * cellGap;
  const startX = (box.width - totalRowW) / 2;
  const startY = box.height / 2 - cellHeight / 2 - 20;

  const getBitFill = (item: BitmaskItem) => {
    const isOne = String(item.value) === "1" || item.value === 1;
    const token = item.state ? elementStateToken(item.state) : "default";

    if (item.group === "sign") return "rgba(239, 68, 68, 0.25)";
    if (item.group === "exponent") return "rgba(168, 85, 247, 0.25)";
    if (item.group === "mantissa") return "rgba(59, 130, 246, 0.25)";

    switch (token) {
      case "active":
        return "rgba(59, 130, 246, 0.35)";
      case "compare":
        return "rgba(245, 158, 11, 0.35)";
      case "sorted":
        return "rgba(16, 185, 129, 0.35)";
      case "visited":
        return "rgba(107, 114, 128, 0.2)";
      default:
        return isOne ? "rgba(59, 130, 246, 0.18)" : "var(--bg-surface)";
    }
  };

  const getBitStroke = (item: BitmaskItem) => {
    const isOne = String(item.value) === "1" || item.value === 1;
    const token = item.state ? elementStateToken(item.state) : "default";

    switch (token) {
      case "active":
        return "var(--accent, #3b82f6)";
      case "compare":
        return "#f59e0b";
      case "sorted":
        return "#10b981";
      default:
        return isOne ? "var(--accent, #3b82f6)" : "var(--border-default)";
    }
  };

  return (
    <div
      data-testid="bitmask-visualizer"
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
          {/* Operation banner if specified */}
          {operation && (
            <g transform={`translate(${box.width / 2}, ${startY - 45})`}>
              <rect
                x={-180}
                y={-14}
                width={360}
                height={28}
                rx={6}
                fill="var(--bg-surface)"
                stroke="var(--border-subtle)"
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="12"
                fontWeight="600"
                fontFamily="var(--font-mono, monospace)"
              >
                Op: {operation.name}
                {operation.operand !== undefined ? ` with ${operation.operand}` : ""}
                {operation.result !== undefined ? ` → ${operation.result}` : ""}
              </text>
            </g>
          )}

          {/* Bit cells */}
          {bitArray.map((bit, idx) => {
            const x = startX + idx * (cellWidth + cellGap);
            const isOne = String(bit.value) === "1" || bit.value === 1;

            return (
              <g key={`bit-${bit.index ?? idx}`}>
                {/* Index label above */}
                <text
                  x={x + cellWidth / 2}
                  y={startY - 8}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="11"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {bit.index ?? totalBits - 1 - idx}
                </text>

                {/* Bit Cell Rect */}
                <rect
                  x={x}
                  y={startY}
                  width={cellWidth}
                  height={cellHeight}
                  rx={4}
                  fill={getBitFill(bit)}
                  stroke={getBitStroke(bit)}
                  strokeWidth={isOne || bit.state === "active" ? 2 : 1}
                />

                {/* Value inside cell */}
                <text
                  x={x + cellWidth / 2}
                  y={startY + cellHeight / 2 + 5}
                  textAnchor="middle"
                  fill={isOne ? "var(--text-primary)" : "var(--text-secondary)"}
                  fontSize={totalBits > 16 ? "13" : "16"}
                  fontWeight="bold"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {String(bit.value)}
                </text>

                {/* Custom bit label below if provided */}
                {bit.label && (
                  <text
                    x={x + cellWidth / 2}
                    y={startY + cellHeight + 16}
                    textAnchor="middle"
                    fill="var(--text-muted)"
                    fontSize="10"
                  >
                    {bit.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Numeric Value summary badge below */}
          {(value !== undefined || label) && (
            <g transform={`translate(${box.width / 2}, ${startY + cellHeight + 45})`}>
              <text
                x={0}
                y={0}
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize="13"
                fontFamily="var(--font-mono, monospace)"
              >
                {label ? `${label}: ` : "Value: "}
                <tspan fontWeight="bold" fill="var(--text-primary)">
                  {value !== undefined ? String(value) : ""}
                </tspan>
              </text>
            </g>
          )}

          <CanvasAuxiliaryOverlay box={box} state={auxiliaryState} variables={variables} />
        </svg>
      </div>
    </div>
  );
};

export default BitmaskVisualizer;
