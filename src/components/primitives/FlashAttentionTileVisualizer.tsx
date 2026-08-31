import React, { useState } from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";

export interface FlashAttentionTileVisualizerProps {
  numBlocksRow?: number;
  numBlocksCol?: number;
  blockSizeRow?: number;
  blockSizeCol?: number;
  currentBlockRow?: number;
  currentBlockCol?: number;
  runningMax?: number[];
  runningSum?: number[];
  headDim?: number;
  width?: number;
  height?: number;
  title?: string;
}

export const FlashAttentionTileVisualizer: React.FC<FlashAttentionTileVisualizerProps> = ({
  numBlocksRow = 4,
  numBlocksCol = 4,
  blockSizeRow = 64,
  blockSizeCol = 64,
  currentBlockRow: controlledRow,
  currentBlockCol: controlledCol,
  runningMax,
  runningSum,
  headDim = 128,
  width = 900,
  height = 560,
  title = "FlashAttention-2: Dual-Buffer SRAM Tiling & Online Rescaling",
}) => {
  const { ref, box } = useCanvasBox({ width, height });

  const [localStep, setLocalStep] = useState(0);
  const totalSteps = numBlocksRow * numBlocksCol;

  const step =
    controlledRow !== undefined && controlledCol !== undefined
      ? controlledRow * numBlocksCol + controlledCol
      : localStep;

  const activeRow = Math.min(numBlocksRow - 1, Math.floor(step / numBlocksCol));
  const activeCol = Math.min(numBlocksCol - 1, step % numBlocksCol);

  // Mock running stats if not provided
  const maxVals =
    runningMax ||
    Array.from({ length: numBlocksRow }, (_, i) =>
      i <= activeRow ? Math.round((2.4 + (i + 1) * 0.85) * 100) / 100 : 0,
    );
  const sumVals =
    runningSum ||
    Array.from({ length: numBlocksRow }, (_, i) =>
      i <= activeRow ? Math.round((14.2 + (i + 1) * 6.3) * 10) / 10 : 0,
    );

  const padding = 24;
  const topPad = 60;
  const canvasW = Math.max(800, box.width);
  const canvasH = Math.max(500, box.height);

  const leftPaneW = (canvasW - padding * 3) * 0.48;
  const rightPaneW = (canvasW - padding * 3) * 0.48;
  const paneH = canvasH - topPad - 70;

  const gridCellW = (leftPaneW - 60) / numBlocksCol;
  const gridCellH = (paneH - 80) / numBlocksRow;

  return (
    <div
      data-testid="flash-attention-tile-visualizer"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        background: "#090d16",
        borderRadius: "12px",
        border: "1px solid rgba(16, 185, 129, 0.2)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          background: "rgba(6, 78, 59, 0.25)",
          borderBottom: "1px solid rgba(16, 185, 129, 0.2)",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 700,
              color: "#34d399",
              letterSpacing: "0.02em",
            }}
          >
            {title}
          </h3>
          <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
            Step {activeRow * numBlocksCol + activeCol + 1} of {totalSteps}: Processing Q-Tile [
            {activeRow}] with K/V-Tile [{activeCol}]
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setLocalStep((prev) => (prev > 0 ? prev - 1 : totalSteps - 1))}
            style={{
              padding: "4px 12px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#e2e8f0",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Prev Tile
          </button>
          <button
            onClick={() => setLocalStep((prev) => (prev + 1) % totalSteps)}
            style={{
              padding: "4px 12px",
              background: "#059669",
              border: "1px solid #10b981",
              color: "#ffffff",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Next Tile
          </button>
        </div>
      </div>

      <div ref={ref} style={{ flex: "1 1 auto", width: "100%", height: "480px" }}>
        <svg
          viewBox={viewBoxAttr(boxViewBox(box))}
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          {/* Background Gradients & Defs */}
          <defs>
            <linearGradient id="sramGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#064e3b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#022c22" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="activeTileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="hbmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Left Pane: HBM Attention Matrix Tiling */}
          <g transform={`translate(${padding}, ${topPad})`}>
            <rect
              width={leftPaneW}
              height={paneH}
              rx={8}
              fill="url(#hbmGrad)"
              stroke="#334155"
              strokeWidth={1.5}
            />
            <text x={16} y={24} fill="#e2e8f0" fontSize={13} fontWeight={700}>
              Global HBM Attention Grid (N x N)
            </text>
            <text x={16} y={40} fill="#94a3b8" fontSize={11}>
              Outer Loop: Q-Tiles ({blockSizeRow} rows) | Inner Loop: K,V-Tiles ({blockSizeCol}{" "}
              cols)
            </text>

            {/* Grid of tiles */}
            <g transform="translate(30, 60)">
              {Array.from({ length: numBlocksRow }).map((_, r) =>
                Array.from({ length: numBlocksCol }).map((_, c) => {
                  const isActive = r === activeRow && c === activeCol;
                  const isPast = r < activeRow || (r === activeRow && c < activeCol);
                  const isCausalMasked = c > r; // Causal mask

                  let fill = "#0f172a";
                  let stroke = "#1e293b";
                  let textColor = "#64748b";

                  if (isCausalMasked) {
                    fill = "#090d16";
                    stroke = "#1e293b";
                    textColor = "#334155";
                  } else if (isActive) {
                    fill = "url(#activeTileGrad)";
                    stroke = "#34d399";
                    textColor = "#ffffff";
                  } else if (isPast) {
                    fill = "rgba(16, 185, 129, 0.15)";
                    stroke = "rgba(16, 185, 129, 0.4)";
                    textColor = "#6ee7b7";
                  }

                  return (
                    <g
                      key={`tile-${r}-${c}`}
                      transform={`translate(${c * gridCellW}, ${r * gridCellH})`}
                    >
                      <rect
                        width={gridCellW - 6}
                        height={gridCellH - 6}
                        rx={4}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={isActive ? 2 : 1}
                      />
                      <text
                        x={(gridCellW - 6) / 2}
                        y={(gridCellH - 6) / 2 + 4}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize={10}
                        fontWeight={isActive ? 700 : 500}
                      >
                        {isCausalMasked ? "MASK" : `S[${r},${c}]`}
                      </text>
                    </g>
                  );
                }),
              )}
            </g>
          </g>

          {/* Right Pane: On-Chip SRAM & Register State */}
          <g transform={`translate(${padding * 2 + leftPaneW}, ${topPad})`}>
            <rect
              width={rightPaneW}
              height={paneH}
              rx={8}
              fill="url(#sramGrad)"
              stroke="#059669"
              strokeWidth={1.5}
            />
            <text x={16} y={24} fill="#34d399" fontSize={13} fontWeight={700}>
              On-Chip Fast SRAM (SMEM) State
            </text>
            <text x={16} y={40} fill="#a7f3d0" fontSize={11}>
              Zero HBM writes for S, P. Online streaming softmax rescale in registers.
            </text>

            {/* SRAM Block Buffers */}
            <g transform="translate(16, 55)">
              {/* Q Block */}
              <rect
                x={0}
                y={0}
                width={rightPaneW * 0.42}
                height={46}
                rx={4}
                fill="#065f46"
                stroke="#34d399"
                strokeWidth={1}
              />
              <text x={10} y={18} fill="#6ee7b7" fontSize={11} fontWeight={700}>
                Q_tile [{activeRow}]
              </text>
              <text x={10} y={34} fill="#e2e8f0" fontSize={10}>
                {blockSizeRow} x {headDim} (FP16 in SRAM)
              </text>

              {/* K Block */}
              <rect
                x={rightPaneW * 0.46}
                y={0}
                width={rightPaneW * 0.42}
                height={46}
                rx={4}
                fill="#065f46"
                stroke="#34d399"
                strokeWidth={1}
              />
              <text x={rightPaneW * 0.46 + 10} y={18} fill="#6ee7b7" fontSize={11} fontWeight={700}>
                K_tile [{activeCol}]
              </text>
              <text x={rightPaneW * 0.46 + 10} y={34} fill="#e2e8f0" fontSize={10}>
                {blockSizeCol} x {headDim} (FP16 in SRAM)
              </text>

              {/* V Block */}
              <rect
                x={rightPaneW * 0.46}
                y={54}
                width={rightPaneW * 0.42}
                height={46}
                rx={4}
                fill="#047857"
                stroke="#34d399"
                strokeWidth={1}
              />
              <text x={rightPaneW * 0.46 + 10} y={72} fill="#6ee7b7" fontSize={11} fontWeight={700}>
                V_tile [{activeCol}]
              </text>
              <text x={rightPaneW * 0.46 + 10} y={88} fill="#e2e8f0" fontSize={10}>
                {blockSizeCol} x {headDim} (FP16 in SRAM)
              </text>

              {/* Running Accumulators (Registers) */}
              <g transform="translate(0, 115)">
                <text x={0} y={14} fill="#fbbf24" fontSize={12} fontWeight={700}>
                  Fast Register Accumulators (Row {activeRow})
                </text>

                {/* Running Max m_i */}
                <rect
                  x={0}
                  y={24}
                  width={rightPaneW * 0.42}
                  height={52}
                  rx={4}
                  fill="#1e293b"
                  stroke="#f59e0b"
                  strokeWidth={1}
                />
                <text x={10} y={42} fill="#fbbf24" fontSize={10} fontWeight={600}>
                  Running Max (m_{activeRow})
                </text>
                <text x={10} y={62} fill="#ffffff" fontSize={14} fontWeight={700}>
                  {maxVals[activeRow] ?? 2.4}
                </text>

                {/* Running Normalizer l_i */}
                <rect
                  x={rightPaneW * 0.46}
                  y={24}
                  width={rightPaneW * 0.42}
                  height={52}
                  rx={4}
                  fill="#1e293b"
                  stroke="#f59e0b"
                  strokeWidth={1}
                />
                <text
                  x={rightPaneW * 0.46 + 10}
                  y={42}
                  fill="#fbbf24"
                  fontSize={10}
                  fontWeight={600}
                >
                  Running Sum (l_{activeRow})
                </text>
                <text
                  x={rightPaneW * 0.46 + 10}
                  y={62}
                  fill="#ffffff"
                  fontSize={14}
                  fontWeight={700}
                >
                  {sumVals[activeRow] ?? 14.2}
                </text>

                {/* Online Rescale Math Card */}
                <g transform="translate(0, 86)">
                  <rect
                    x={0}
                    y={0}
                    width={rightPaneW * 0.88}
                    height={58}
                    rx={6}
                    fill="rgba(15, 23, 42, 0.9)"
                    stroke="#334155"
                  />
                  <text x={12} y={20} fill="#38bdf8" fontSize={11} fontWeight={700}>
                    Online Rescaling Invariant:
                  </text>
                  <text x={12} y={36} fill="#cbd5e1" fontSize={10} fontFamily="monospace">
                    m_new = max(m_old, m_tile)
                  </text>
                  <text x={12} y={50} fill="#cbd5e1" fontSize={10} fontFamily="monospace">
                    l_new = l_old * exp(m_old - m_new) + l_tile * exp(m_tile - m_new)
                  </text>
                </g>
              </g>
            </g>
          </g>

          {/* Bottom Summary Bar */}
          <g transform={`translate(${padding}, ${height - 42})`}>
            <rect width={width - padding * 2} height={34} rx={6} fill="#0f172a" stroke="#1e293b" />
            <circle cx={16} cy={17} r={4} fill="#10b981" />
            <text x={28} y={21} fill="#94a3b8" fontSize={11}>
              <tspan fill="#34d399" fontWeight={700}>
                SRAM Arithmetic Intensity:{" "}
              </tspan>
              O(N d) HBM memory transfers vs O(N²) for standard attention. 10x-20x reduction in
              memory traffic.
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
