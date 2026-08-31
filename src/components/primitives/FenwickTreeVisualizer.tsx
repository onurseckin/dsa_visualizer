import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";

const DEFAULT_ARRAY: readonly number[] = [3, 2, -1, 6, 5, 4, -3, 3, 7, 2, 3];
const DEFAULT_TREE: readonly number[] = [0, 3, 5, -1, 10, 5, 9, -3, 19, 7, 9, 3];

export interface FenwickTreeVisualizerProps {
  readonly array?: readonly number[];
  readonly tree?: readonly number[]; // 1-indexed BIT array
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly activeUpdateIndex?: number;
  readonly activeQueryIndex?: number;
  readonly updateDelta?: number;
  readonly prefixSumResult?: number;
}

export const FenwickTreeVisualizer: React.FC<FenwickTreeVisualizerProps> = ({
  array = DEFAULT_ARRAY,
  tree = DEFAULT_TREE,
  width = 860,
  height = 500,
  title = "Fenwick Tree (Binary Indexed Tree) Dyadic Range Visualizer",
  activeUpdateIndex,
  activeQueryIndex,
  updateDelta,
  prefixSumResult,
}) => {
  const { ref, box } = useCanvasBox({ width, height });
  const n = Math.max(1, array.length);

  // Compute update path: i += i & -i
  const updatePath: number[] = [];
  if (activeUpdateIndex && activeUpdateIndex > 0) {
    let idx = activeUpdateIndex;
    while (idx <= n) {
      updatePath.push(idx);
      idx += idx & -idx;
    }
  }

  // Compute query path: i -= i & -i
  const queryPath: number[] = [];
  if (activeQueryIndex && activeQueryIndex > 0) {
    let idx = activeQueryIndex;
    while (idx > 0) {
      queryPath.push(idx);
      idx -= idx & -idx;
    }
  }

  const padX = 50;
  const padBottom = 60;
  const arrayY = box.height - padBottom;
  const usableW = box.width - 2 * padX;
  const cellW = usableW / n;
  const levelHeight = 55;

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
          {activeUpdateIndex !== undefined && (
            <span
              style={{
                fontSize: "12px",
                padding: "2px 8px",
                borderRadius: "12px",
                background: "rgba(234, 179, 8, 0.15)",
                color: "#eab308",
                border: "1px solid rgba(234, 179, 8, 0.4)",
              }}
            >
              Update Path: {updatePath.join(" → ")} ({updateDelta ? `+${updateDelta}` : ""})
            </span>
          )}
          {activeQueryIndex !== undefined && (
            <span
              style={{
                fontSize: "12px",
                padding: "2px 8px",
                borderRadius: "12px",
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.4)",
              }}
            >
              Prefix Sum [{activeQueryIndex}]: {queryPath.join(" + ")} = {prefixSumResult ?? ""}
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
          {/* Base Array Label */}
          <text
            x={padX - 10}
            y={arrayY + 22}
            textAnchor="end"
            fill="#94a3b8"
            fontSize="11"
            fontWeight="600"
          >
            Array A[i]
          </text>

          {/* Base Array Cells */}
          {array.map((val, idx) => {
            const i1 = idx + 1;
            const x = padX + idx * cellW;
            const isUpdateTarget = i1 === activeUpdateIndex;
            const isQueryTarget = i1 === activeQueryIndex;

            return (
              <g key={`base-cell-${i1}`}>
                <rect
                  x={x + 2}
                  y={arrayY}
                  width={cellW - 4}
                  height={35}
                  rx={4}
                  fill={
                    isUpdateTarget
                      ? "rgba(234, 179, 8, 0.25)"
                      : isQueryTarget
                        ? "rgba(56, 189, 248, 0.25)"
                        : "#1e293b"
                  }
                  stroke={isUpdateTarget ? "#eab308" : isQueryTarget ? "#38bdf8" : "#475569"}
                  strokeWidth="1.5"
                />
                <text
                  x={x + cellW / 2}
                  y={arrayY + 22}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {val}
                </text>
                <text
                  x={x + cellW / 2}
                  y={arrayY + 48}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                >
                  i={i1}
                </text>
              </g>
            );
          })}

          {/* Dyadic Tree Intervals */}
          {Array.from({ length: n }).map((_, idx) => {
            const i = idx + 1;
            const lsb = i & -i;
            const level = Math.round(Math.log2(lsb));
            const rangeStart = i - lsb + 1;
            const rangeEnd = i;

            const startX = padX + (rangeStart - 1) * cellW + 4;
            const endX = padX + rangeEnd * cellW - 4;
            const barWidth = endX - startX;
            const barY = arrayY - 40 - level * levelHeight;

            const isUpdateActive = updatePath.includes(i);
            const isQueryActive = queryPath.includes(i);

            const fillColor = isUpdateActive
              ? "rgba(234, 179, 8, 0.25)"
              : isQueryActive
                ? "rgba(56, 189, 248, 0.25)"
                : "rgba(51, 65, 85, 0.5)";
            const strokeColor = isUpdateActive ? "#eab308" : isQueryActive ? "#38bdf8" : "#64748b";

            const treeVal = tree[i] !== undefined ? tree[i] : "-";

            return (
              <g key={`tree-interval-${i}`}>
                {/* Vertical Drop Line to Base Array */}
                <line
                  x1={endX - (cellW - 8) / 2}
                  y1={barY + 30}
                  x2={endX - (cellW - 8) / 2}
                  y2={arrayY}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeDasharray="2 2"
                />

                {/* Dyadic Interval Bar */}
                <rect
                  x={startX}
                  y={barY}
                  width={barWidth}
                  height={30}
                  rx={6}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isUpdateActive || isQueryActive ? 2 : 1}
                />
                <text
                  x={startX + barWidth / 2}
                  y={barY + 19}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="600"
                >
                  T[{i}] = {treeVal} (Span [{rangeStart}..{rangeEnd}])
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
