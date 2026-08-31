import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";
import { generateConvexHullGeometry, Point2D } from "../../curriculum/canvasGeometry";

export interface HullPoint {
  readonly x: number;
  readonly y: number;
  readonly label?: string;
  readonly isHighlighted?: boolean;
}

const DEFAULT_HULL_POINTS: readonly HullPoint[] = [
  { x: 0, y: 0, label: "P1" },
  { x: 1, y: 2, label: "P2" },
  { x: 2, y: 1, label: "P3" },
  { x: 3, y: 3, label: "P4" },
];

export interface ConvexHullSweepVisualizerProps {
  readonly points?: readonly HullPoint[];
  readonly lowerHull?: readonly HullPoint[];
  readonly upperHull?: readonly HullPoint[];
  readonly activeCandidatePoint?: HullPoint;
  readonly lastCrossProduct?: number;
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
}

export const ConvexHullSweepVisualizer: React.FC<ConvexHullSweepVisualizerProps> = ({
  points = DEFAULT_HULL_POINTS,
  lowerHull = [],
  upperHull = [],
  activeCandidatePoint,
  lastCrossProduct,
  width = 860,
  height = 520,
  title = "Andrew's Monotone Chain Convex Hull Sweep Visualizer",
}) => {
  const { ref, box } = useCanvasBox({ width, height });

  // 1. Calculate bounding box of all points for screen normalization
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const allPts = [...points, ...(activeCandidatePoint ? [activeCandidatePoint] : [])];
  for (const p of allPts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  if (minX === Infinity) {
    minX = 0;
    maxX = 10;
    minY = 0;
    maxY = 10;
  }

  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);

  const padX = 70;
  const padY = 70;
  const usableW = box.width - 2 * padX;
  const usableH = box.height - 2 * padY;

  // Transform model coordinates to screen pixel coordinates (invert Y for cartesian)
  function toScreen(p: Point2D): Point2D {
    const sx = padX + ((p.x - minX) / spanX) * usableW;
    const sy = box.height - padY - ((p.y - minY) / spanY) * usableH;
    return { x: sx, y: sy };
  }

  const screenPoints = points.map((p) => ({ ...p, screen: toScreen(p) }));
  const screenLower = lowerHull.map((p) => toScreen(p));
  const screenUpper = upperHull.map((p) => toScreen(p));

  // Build full closed polygon if both lower and upper hulls exist
  let fullHullScreen: Point2D[] = [];
  if (lowerHull.length > 0 && upperHull.length > 0) {
    fullHullScreen = [...screenLower.slice(0, -1), ...screenUpper.slice(0, -1)];
  }

  const hullGeo = generateConvexHullGeometry(fullHullScreen);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 0,
        background: "var(--bg-inset, #0d1117)",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid var(--border-default, #30363d)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: "rgba(22, 27, 34, 0.8)",
          borderBottom: "1px solid var(--border-default, #30363d)",
        }}
      >
        <div style={{ fontWeight: 600, color: "var(--text-primary, #e6edf3)", fontSize: "14px" }}>
          {title}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {lastCrossProduct !== undefined && (
            <span
              style={{
                fontSize: "12px",
                padding: "2px 8px",
                borderRadius: "12px",
                background:
                  lastCrossProduct > 0 ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                color: lastCrossProduct > 0 ? "#4ade80" : "#f87171",
                border: `1px solid ${lastCrossProduct > 0 ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
              }}
            >
              Cross: {lastCrossProduct.toFixed(1)} (
              {lastCrossProduct > 0 ? "CCW Turn (Valid)" : "CW Turn (Violation - Pop)"})
            </span>
          )}
          {hullGeo.area > 0 && (
            <span
              style={{
                fontSize: "12px",
                padding: "2px 8px",
                borderRadius: "12px",
                background: "rgba(168, 85, 247, 0.15)",
                color: "#c084fc",
                border: "1px solid rgba(168, 85, 247, 0.4)",
              }}
            >
              Hull Area: {hullGeo.area.toFixed(1)} px²
            </span>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={ref}
        style={{ flex: "1 1 auto", width: "100%", minHeight: 0, position: "relative" }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={viewBoxAttr(boxViewBox(box))}
          style={{ display: "block" }}
        >
          {/* Closed Convex Hull Polygon Fill */}
          {hullGeo.pathD && (
            <path
              d={hullGeo.pathD}
              fill="rgba(56, 189, 248, 0.08)"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {/* Lower Hull Chain (Green) */}
          {screenLower.length > 1 && (
            <polyline
              points={screenLower.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
            />
          )}

          {/* Upper Hull Chain (Purple) */}
          {screenUpper.length > 1 && (
            <polyline
              points={screenUpper.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
              fill="none"
              stroke="#a855f7"
              strokeWidth="3"
            />
          )}

          {/* Candidate Vector from Hull Top to Active Point */}
          {activeCandidatePoint && lowerHull.length > 0 && (
            <g>
              <line
                x1={toScreen(lowerHull[lowerHull.length - 1]).x}
                y1={toScreen(lowerHull[lowerHull.length - 1]).y}
                x2={toScreen(activeCandidatePoint).x}
                y2={toScreen(activeCandidatePoint).y}
                stroke={lastCrossProduct && lastCrossProduct > 0 ? "#22c55e" : "#ef4444"}
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            </g>
          )}

          {/* Input Scatter Points */}
          {screenPoints.map((p, idx) => {
            const isLower = lowerHull.some((h) => h.x === p.x && h.y === p.y);
            const isUpper = upperHull.some((h) => h.x === p.x && h.y === p.y);
            const isCandidate =
              activeCandidatePoint &&
              activeCandidatePoint.x === p.x &&
              activeCandidatePoint.y === p.y;

            const circleFill = isCandidate
              ? "#eab308"
              : isLower
                ? "#22c55e"
                : isUpper
                  ? "#a855f7"
                  : "#475569";
            const radius = isCandidate || isLower || isUpper ? 7 : 5;

            return (
              <g key={`pt-${idx}`}>
                <circle
                  cx={p.screen.x}
                  cy={p.screen.y}
                  r={radius}
                  fill={circleFill}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x={p.screen.x}
                  y={p.screen.y - 10}
                  textAnchor="middle"
                  fill="#cbd5e1"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {p.label ?? `(${p.x},${p.y})`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
