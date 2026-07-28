import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";
import { elementStateToken, VectorVisualSnapshot } from "../../types/dsa";

export interface VectorVisualizerProps {
  vectors: VectorVisualSnapshot["vectors"];
  origin?: { x: number; y: number };
  planeTitle?: string;
  dimensions?: "2d" | "3d";
}

export const VectorVisualizer: React.FC<VectorVisualizerProps> = ({ vectors, planeTitle }) => {
  const { ref, box } = useCanvasBox({ width: 800, height: 500 });
  const centerX = box.width / 2;
  const centerY = box.height / 2;
  const scale = Math.min(box.width, box.height) / 12;

  const getColor = (vec: VectorVisualSnapshot["vectors"][0]) => {
    if (vec.color) return vec.color;
    switch (vec.state ? elementStateToken(vec.state) : "default") {
      case "active":
        return "var(--accent)";
      case "compare":
        return "#f59e0b";
      case "sorted":
        return "#10b981";
      case "visited":
        return "var(--text-muted)";
      default:
        return "#3b82f6";
    }
  };

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
      {planeTitle && (
        <div
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: "var(--text-muted)",
            marginBottom: "var(--space-1)",
            textAlign: "center",
          }}
        >
          {planeTitle}
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
          padding: "16px",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={viewBoxAttr(boxViewBox(box))}
          style={{ display: "block" }}
        >
          <defs>
            <marker
              id="vector-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent)" />
            </marker>
          </defs>

          {/* Grid lines */}
          {[-4, -3, -2, -1, 1, 2, 3, 4].map((gridIdx) => (
            <React.Fragment key={`grid-${gridIdx}`}>
              <line
                x1={0}
                y1={centerY + gridIdx * scale}
                x2={box.width}
                y2={centerY + gridIdx * scale}
                stroke="var(--border-default)"
                strokeDasharray="4,4"
                opacity="0.3"
              />
              <line
                x1={centerX + gridIdx * scale}
                y1={0}
                x2={centerX + gridIdx * scale}
                y2={box.height}
                stroke="var(--border-default)"
                strokeDasharray="4,4"
                opacity="0.3"
              />
            </React.Fragment>
          ))}

          {/* Axes */}
          <line
            x1={0}
            y1={centerY}
            x2={box.width}
            y2={centerY}
            stroke="var(--text-muted)"
            strokeWidth="1.5"
            opacity="0.7"
          />
          <line
            x1={centerX}
            y1={0}
            x2={centerX}
            y2={box.height}
            stroke="var(--text-muted)"
            strokeWidth="1.5"
            opacity="0.7"
          />

          {/* Origin dot */}
          <circle cx={centerX} cy={centerY} r={4} fill="var(--text-primary)" />

          {/* Vector Arrows */}
          {vectors.map((vec) => {
            const targetX = centerX + vec.x * scale;
            const targetY = centerY - vec.y * scale;
            const color = getColor(vec);

            return (
              <g key={vec.id}>
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={targetX}
                  y2={targetY}
                  stroke={color}
                  strokeWidth="3"
                  markerEnd="url(#vector-arrow)"
                />
                <circle cx={targetX} cy={targetY} r={5} fill={color} />
                <text
                  x={targetX + (vec.x >= 0 ? 10 : -30)}
                  y={targetY + (vec.y >= 0 ? -10 : 20)}
                  fill="var(--text-primary)"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {vec.label} ({vec.x.toFixed(1)}, {vec.y.toFixed(1)})
                </text>
                {vec.subText && (
                  <text
                    x={targetX + (vec.x >= 0 ? 10 : -30)}
                    y={targetY + (vec.y >= 0 ? 6 : 34)}
                    fill="var(--text-muted)"
                    fontSize="10"
                  >
                    {vec.subText}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
