import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";
import { QuantizationVisualSnapshot, AuxiliaryState, DisplayValue } from "../../types/dsa";
import { CanvasAuxiliaryOverlay } from "./CanvasAuxiliaryOverlay";

export interface QuantizationVisualizerProps {
  originalValue?: number | string;
  quantizedValue?: number | string;
  scale?: number | string;
  zeroPoint?: number | string;
  bits: QuantizationVisualSnapshot["bits"];
  title?: string;
  auxiliaryState?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

export const QuantizationVisualizer: React.FC<QuantizationVisualizerProps> = ({
  originalValue,
  quantizedValue,
  scale,
  zeroPoint,
  bits,
  title,
  auxiliaryState,
  variables,
}) => {
  const { ref, box } = useCanvasBox({ width: 800, height: 450 });

  const getBitFill = (state?: string) => {
    switch (state) {
      case "sign":
        return "rgba(239, 68, 68, 0.25)";
      case "exponent":
        return "rgba(59, 130, 246, 0.25)";
      case "mantissa":
        return "rgba(16, 185, 129, 0.25)";
      case "active":
      case "quantized":
        return "rgba(245, 158, 11, 0.25)";
      default:
        return "var(--bg-surface)";
    }
  };

  const getBitStroke = (state?: string) => {
    switch (state) {
      case "sign":
        return "#ef4444";
      case "exponent":
        return "var(--accent)";
      case "mantissa":
        return "#10b981";
      case "active":
      case "quantized":
        return "#f59e0b";
      default:
        return "var(--border-default)";
    }
  };

  const numBits = Math.max(bits.length, 1);
  const bitW = Math.min(60, Math.max(28, (box.width - 80) / numBits));
  const startX = (box.width - numBits * bitW) / 2;

  return (
    <div
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
          {/* Metadata Cards Header */}
          <g transform="translate(40, 30)">
            {originalValue !== undefined && (
              <g transform="translate(0, 0)">
                <text fill="var(--text-muted)" fontSize="11" fontWeight="bold">
                  Original Float:
                </text>
                <text fill="var(--text-primary)" fontSize="14" fontWeight="bold" y="20">
                  {originalValue}
                </text>
              </g>
            )}
            {scale !== undefined && (
              <g transform="translate(200, 0)">
                <text fill="var(--text-muted)" fontSize="11" fontWeight="bold">
                  Scale (S):
                </text>
                <text fill="var(--accent)" fontSize="14" fontWeight="bold" y="20">
                  {scale}
                </text>
              </g>
            )}
            {zeroPoint !== undefined && (
              <g transform="translate(380, 0)">
                <text fill="var(--text-muted)" fontSize="11" fontWeight="bold">
                  Zero-Point (Z):
                </text>
                <text fill="#f59e0b" fontSize="14" fontWeight="bold" y="20">
                  {zeroPoint}
                </text>
              </g>
            )}
            {quantizedValue !== undefined && (
              <g transform="translate(560, 0)">
                <text fill="var(--text-muted)" fontSize="11" fontWeight="bold">
                  Quantized Int:
                </text>
                <text fill="#10b981" fontSize="14" fontWeight="bold" y="20">
                  {quantizedValue}
                </text>
              </g>
            )}
          </g>

          {/* Bit Boxes */}
          <g transform="translate(0, 140)">
            {bits.map((bit, idx) => {
              const bx = startX + idx * bitW;
              return (
                <g key={`bit-${idx}`}>
                  <rect
                    x={bx}
                    y={0}
                    width={bitW - 4}
                    height={50}
                    rx={6}
                    fill={getBitFill(bit.state)}
                    stroke={getBitStroke(bit.state)}
                    strokeWidth={2}
                  />
                  <text
                    x={bx + (bitW - 4) / 2}
                    y={30}
                    fill="var(--text-primary)"
                    fontSize="18"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {bit.value}
                  </text>
                  <text
                    x={bx + (bitW - 4) / 2}
                    y={68}
                    fill="var(--text-muted)"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {bit.label || `b${numBits - 1 - idx}`}
                  </text>
                </g>
              );
            })}
          </g>
          <CanvasAuxiliaryOverlay box={box} state={auxiliaryState} variables={variables} />
        </svg>
      </div>
    </div>
  );
};
