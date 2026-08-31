import React, { useState } from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";

export interface Im2ColGEMMVisualizerProps {
  readonly H?: number;
  readonly W?: number;
  readonly K?: number;
  readonly stride?: number;
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
}

export const Im2ColGEMMVisualizer: React.FC<Im2ColGEMMVisualizerProps> = ({
  H = 4,
  W = 4,
  K = 2,
  stride = 1,
  width = 860,
  height = 500,
  title = "Im2Col Spatial Unfolding & BLAS GEMM Convolution Engine",
}) => {
  const { ref, box } = useCanvasBox({ width, height });
  const [currentStep, setCurrentStep] = useState(0);

  // Output feature map dimensions: H_out = (H - K)/stride + 1
  const H_out = Math.floor((H - K) / stride) + 1;
  const W_out = Math.floor((W - K) / stride) + 1;
  const totalPatches = H_out * W_out;

  const activePatchIdx = currentStep % totalPatches;
  const patchRow = Math.floor(activePatchIdx / W_out) * stride;
  const patchCol = (activePatchIdx % W_out) * stride;

  // Grid cell dimensions
  const cellSz = 42;
  const inGridX = 50;
  const inGridY = 90;

  const outColX = 340;
  const outColY = 90;

  const patchElements: { r: number; c: number; valIdx: number }[] = [];
  for (let kr = 0; kr < K; kr++) {
    for (let kc = 0; kc < K; kc++) {
      const r = patchRow + kr;
      const c = patchCol + kc;
      patchElements.push({ r, c, valIdx: r * W + c + 1 });
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#020617",
        borderRadius: "12px",
        border: "1px solid #1e293b",
        overflow: "hidden",
        fontFamily: "monospace",
        color: "#f8fafc",
      }}
    >
      {/* Control Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 18px",
          borderBottom: "1px solid #1e293b",
          backgroundColor: "#090d16",
        }}
      >
        <div>
          <div style={{ fontSize: "14px", fontWeight: "bold", color: "#38bdf8" }}>{title}</div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
            Patch <span style={{ color: "#38bdf8", fontWeight: "bold" }}>{activePatchIdx + 1}</span>{" "}
            of <span style={{ color: "#f59e0b", fontWeight: "bold" }}>{totalPatches}</span> |
            Unfolded Matrix Shape:{" "}
            <span style={{ color: "#10b981" }}>
              ({K * K} $\times$ {totalPatches})
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setCurrentStep((prev) => (prev > 0 ? prev - 1 : totalPatches - 1))}
            style={{
              padding: "5px 12px",
              fontSize: "12px",
              backgroundColor: "#1e293b",
              color: "#cbd5e1",
              border: "1px solid #334155",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ◀ Prev Patch
          </button>
          <button
            onClick={() => setCurrentStep((prev) => (prev + 1) % totalPatches)}
            style={{
              padding: "5px 12px",
              fontSize: "12px",
              backgroundColor: "#0369a1",
              color: "#f8fafc",
              border: "1px solid #38bdf8",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Next Patch ▶
          </button>
        </div>
      </div>

      {/* SVG Stage */}
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
          {/* Section 1: Input Feature Map X (4x4) */}
          <g transform={`translate(${inGridX}, ${inGridY})`}>
            <text x={0} y={-20} fill="#38bdf8" fontSize="13" fontWeight="bold">
              Input Map $X \in \mathbb&#123;R&#125;^&#123;{H} \times {W}&#125;$
            </text>

            {Array.from({ length: H }).map((_, r) =>
              Array.from({ length: W }).map((_, c) => {
                const isInsidePatch =
                  r >= patchRow && r < patchRow + K && c >= patchCol && c < patchCol + K;
                const cellVal = r * W + c + 1;

                return (
                  <g key={`in_${r}_${c}`} transform={`translate(${c * cellSz}, ${r * cellSz})`}>
                    <rect
                      width={cellSz - 2}
                      height={cellSz - 2}
                      rx={4}
                      fill={isInsidePatch ? "rgba(56, 189, 248, 0.25)" : "#0f172a"}
                      stroke={isInsidePatch ? "#38bdf8" : "#334155"}
                      strokeWidth={isInsidePatch ? 2 : 1}
                    />
                    <text
                      x={cellSz / 2 - 1}
                      y={cellSz / 2 + 4}
                      textAnchor="middle"
                      fill={isInsidePatch ? "#38bdf8" : "#94a3b8"}
                      fontSize="12"
                      fontWeight={isInsidePatch ? "bold" : "normal"}
                    >
                      {cellVal}
                    </text>
                  </g>
                );
              }),
            )}

            {/* Kernel Bounding Box Overlay */}
            <rect
              x={patchCol * cellSz - 2}
              y={patchRow * cellSz - 2}
              width={K * cellSz + 2}
              height={K * cellSz + 2}
              rx={6}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={2.5}
              strokeDasharray="4 3"
            />
          </g>

          {/* Section 2: Unfolded Matrix X_col (K^2 x Patches) */}
          <g transform={`translate(${outColX}, ${outColY})`}>
            <text x={0} y={-20} fill="#10b981" fontSize="13" fontWeight="bold">
              Unfolded $X_&#123;\text&#123;col&#125;&#125; \in \mathbb&#123;R&#125;^&#123;{K * K}{" "}
              \times {totalPatches}&#125;$
            </text>

            {Array.from({ length: K * K }).map((_, kr) =>
              Array.from({ length: totalPatches }).map((_, patchIdx) => {
                const isCurrentCol = patchIdx === activePatchIdx;
                const cellW = 32;
                const cellH = 28;

                // Value in column
                const pR = Math.floor(patchIdx / W_out) * stride;
                const pC = (patchIdx % W_out) * stride;
                const localR = Math.floor(kr / K);
                const localC = kr % K;
                const actualVal = (pR + localR) * W + (pC + localC) + 1;

                return (
                  <g
                    key={`col_${kr}_${patchIdx}`}
                    transform={`translate(${patchIdx * cellW}, ${kr * cellH})`}
                  >
                    <rect
                      width={cellW - 2}
                      height={cellH - 2}
                      rx={3}
                      fill={isCurrentCol ? "rgba(16, 185, 129, 0.3)" : "#0f172a"}
                      stroke={isCurrentCol ? "#10b981" : "#1e293b"}
                      strokeWidth={isCurrentCol ? 2 : 1}
                    />
                    <text
                      x={cellW / 2 - 1}
                      y={cellH / 2 + 4}
                      textAnchor="middle"
                      fill={isCurrentCol ? "#a7f3d0" : "#64748b"}
                      fontSize="10"
                      fontWeight={isCurrentCol ? "bold" : "normal"}
                    >
                      {actualVal}
                    </text>
                  </g>
                );
              }),
            )}

            {/* Active Column Highlight Box */}
            <rect
              x={activePatchIdx * 32 - 2}
              y={-2}
              width={32 + 2}
              height={K * K * 28 + 2}
              rx={4}
              fill="none"
              stroke="#10b981"
              strokeWidth={2.5}
            />
          </g>

          {/* Connective Unrolling Vectors */}
          {patchElements.map((elem, idx) => {
            const startX = inGridX + elem.c * cellSz + cellSz / 2;
            const startY = inGridY + elem.r * cellSz + cellSz / 2;
            const endX = outColX + activePatchIdx * 32 + 15;
            const endY = outColY + idx * 28 + 14;

            return (
              <path
                key={`vector_${idx}`}
                d={`M ${startX} ${startY} C ${startX + 60} ${startY}, ${endX - 60} ${endY}, ${endX} ${endY}`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                strokeOpacity={0.8}
              />
            );
          })}

          {/* Bottom GEMM Formula Callout */}
          <g transform={`translate(${inGridX}, ${box.height - 80})`}>
            <rect
              width={box.width - 2 * inGridX}
              height={50}
              rx={8}
              fill="#090d16"
              stroke="#1e293b"
            />
            <text x={20} y={28} fill="#94a3b8" fontSize="12">
              <tspan fill="#38bdf8" fontWeight="bold">
                GEMM Equivalence:
              </tspan>{" "}
              $\text&#123;Conv2D&#125;(W, X) \equiv W_&#123;\text&#123;kernel&#125;&#125; \times
              X_&#123;\text&#123;col&#125;&#125; = Y_&#123;\text&#123;out&#125;&#125;$ | Zero Loop
              Overhead via Tensor Cores.
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
