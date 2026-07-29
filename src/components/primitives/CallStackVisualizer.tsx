import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";
import {
  elementStateToken,
  CallStackFrameItem,
  AuxiliaryState,
  DisplayValue,
} from "../../types/dsa";
import { CanvasAuxiliaryOverlay } from "./CanvasAuxiliaryOverlay";

export interface CallStackVisualizerProps {
  frames: CallStackFrameItem[];
  activeFrameIndex?: number;
  title?: string;
  auxiliaryState?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

export const CallStackVisualizer: React.FC<CallStackVisualizerProps> = ({
  frames = [],
  activeFrameIndex,
  title,
  auxiliaryState,
  variables,
}) => {
  const { ref, box } = useCanvasBox({ width: 800, height: 500 });

  const frameCount = frames.length;
  const effectiveActiveIndex =
    activeFrameIndex !== undefined
      ? activeFrameIndex
      : frames.findIndex((f) => f.isCurrent) !== -1
        ? frames.findIndex((f) => f.isCurrent)
        : frameCount - 1;

  // Layout math inside box: vertical stack from bottom to top or top to bottom.
  // Standard call stack visualization: base frame at bottom, growing upward.
  const paddingX = 40;
  const topHeaderH = title ? 40 : 20;
  const availHeight = box.height - topHeaderH - 40;
  const maxCardHeight = 65;
  const minCardHeight = 36;
  const cardHeight =
    frameCount === 0
      ? 50
      : Math.max(
          minCardHeight,
          Math.min(maxCardHeight, (availHeight - (frameCount - 1) * 8) / frameCount),
        );
  const cardGap = 8;
  const stackWidth = Math.min(box.width - paddingX * 2, 540);
  const startX = (box.width - stackWidth) / 2;

  const getFrameColor = (frame: CallStackFrameItem, index: number) => {
    if (index === effectiveActiveIndex || frame.isCurrent) {
      return {
        fill: "rgba(59, 130, 246, 0.2)",
        stroke: "var(--accent, #3b82f6)",
        text: "var(--text-primary)",
      };
    }
    const token = frame.state ? elementStateToken(frame.state) : "default";
    switch (token) {
      case "active":
        return { fill: "rgba(59, 130, 246, 0.15)", stroke: "#3b82f6", text: "var(--text-primary)" };
      case "compare":
        return { fill: "rgba(245, 158, 11, 0.15)", stroke: "#f59e0b", text: "var(--text-primary)" };
      case "sorted":
        return { fill: "rgba(16, 185, 129, 0.15)", stroke: "#10b981", text: "var(--text-primary)" };
      case "visited":
        return { fill: "rgba(107, 114, 128, 0.15)", stroke: "#6b7280", text: "var(--text-muted)" };
      default:
        return {
          fill: "var(--bg-surface)",
          stroke: "var(--border-default)",
          text: "var(--text-primary)",
        };
    }
  };

  return (
    <div
      data-testid="callstack-visualizer"
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
          {/* Empty stack message */}
          {frameCount === 0 && (
            <text
              x={box.width / 2}
              y={box.height / 2}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="14"
            >
              [Call Stack Empty]
            </text>
          )}

          {/* Stack Frames (Bottom-up: index 0 is base, index N-1 is top) */}
          {frames.map((frame, idx) => {
            // Render from bottom of canvas going up
            const cardY = box.height - 30 - (idx + 1) * cardHeight - idx * cardGap;
            const style = getFrameColor(frame, idx);
            const isTop = idx === effectiveActiveIndex;

            const argsText = frame.args
              ? Object.entries(frame.args)
                  .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                  .join(", ")
              : "";

            return (
              <g key={frame.id || `frame-${idx}`}>
                {/* Frame Outer Card */}
                <rect
                  x={startX}
                  y={cardY}
                  width={stackWidth}
                  height={cardHeight}
                  rx={6}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={isTop ? 2 : 1}
                />

                {/* Depth Badge */}
                <rect
                  x={startX + 8}
                  y={cardY + (cardHeight - 20) / 2}
                  width={24}
                  height={20}
                  rx={4}
                  fill="var(--bg-inset)"
                  stroke="var(--border-subtle)"
                />
                <text
                  x={startX + 20}
                  y={cardY + (cardHeight - 20) / 2 + 14}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="11"
                  fontWeight="bold"
                >
                  #{idx}
                </text>

                {/* Frame Function Name */}
                <text
                  x={startX + 40}
                  y={
                    cardY + (argsText || frame.returnValue !== undefined ? 22 : cardHeight / 2 + 5)
                  }
                  fill={style.text}
                  fontSize="13"
                  fontWeight="600"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {frame.name}
                </text>

                {/* Arguments / Return detail */}
                {(argsText || frame.returnValue !== undefined) && (
                  <text
                    x={startX + 40}
                    y={cardY + cardHeight - 12}
                    fill="var(--text-secondary)"
                    fontSize="11"
                    fontFamily="var(--font-mono, monospace)"
                  >
                    {argsText ? `(${argsText})` : ""}
                    {frame.returnValue !== undefined
                      ? ` → ${JSON.stringify(frame.returnValue)}`
                      : ""}
                  </text>
                )}

                {/* Active Indicator Arrow / Badge */}
                {isTop && (
                  <g transform={`translate(${startX - 28}, ${cardY + cardHeight / 2})`}>
                    <path d="M 0 0 L 12 -6 L 12 6 Z" fill="var(--accent, #3b82f6)" />
                    <text
                      x={-6}
                      y={4}
                      textAnchor="end"
                      fill="var(--accent, #3b82f6)"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      TOP
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          <CanvasAuxiliaryOverlay box={box} state={auxiliaryState} variables={variables} />
        </svg>
      </div>
    </div>
  );
};

export default CallStackVisualizer;
