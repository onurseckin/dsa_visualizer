import React, { useState } from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";

export interface RingAllReduceVisualizerProps {
  numRanks?: number;
  activeRank?: number;
  activeStep?: number;
  phase?: "scatter_reduce" | "all_gather";
  width?: number;
  height?: number;
  title?: string;
}

export const RingAllReduceVisualizer: React.FC<RingAllReduceVisualizerProps> = ({
  numRanks = 4,
  activeRank = 0,
  activeStep: controlledStep,
  phase: controlledPhase,
  width = 900,
  height = 560,
  title = "Ring-AllReduce: Scatter-Reduce & All-Gather Collective Topology",
}) => {
  const { ref, box } = useCanvasBox({ width, height });

  const totalSteps = 2 * (numRanks - 1);
  const [localStep, setLocalStep] = useState(0);

  const step = controlledStep !== undefined ? controlledStep : localStep;
  const isScatterReduce = controlledPhase
    ? controlledPhase === "scatter_reduce"
    : step < numRanks - 1;
  const stepInPhase = isScatterReduce ? step : step - (numRanks - 1);

  const canvasW = Math.max(800, box.width);
  const canvasH = Math.max(500, box.height);

  const centerX = canvasW / 2;
  const centerY = canvasH / 2 + 10;
  const ringRadius = Math.min(canvasW, canvasH) * 0.32;

  // Compute node coordinates
  const nodes = Array.from({ length: numRanks }).map((_, i) => {
    const angle = (i * 2 * Math.PI) / numRanks - Math.PI / 2;
    const x = centerX + ringRadius * Math.cos(angle);
    const y = centerY + ringRadius * Math.sin(angle);
    return { rank: i, x, y, angle };
  });

  const chunkColors = [
    "#38bdf8", // Sky blue (Chunk 0)
    "#34d399", // Emerald (Chunk 1)
    "#f59e0b", // Amber (Chunk 2)
    "#a855f7", // Purple (Chunk 3)
    "#f43f5e", // Rose (Chunk 4)
    "#06b6d4", // Cyan (Chunk 5)
    "#84cc16", // Lime (Chunk 6)
    "#ec4899", // Pink (Chunk 7)
  ];

  return (
    <div
      data-testid="ring-allreduce-visualizer"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        background: "#090d16",
        borderRadius: "12px",
        border: "1px solid rgba(56, 189, 248, 0.2)",
        overflow: "hidden",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          background: "rgba(14, 116, 144, 0.2)",
          borderBottom: "1px solid rgba(56, 189, 248, 0.2)",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#38bdf8" }}>
            {title}
          </h3>
          <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
            {isScatterReduce
              ? `Phase 1: Scatter-Reduce (Step ${stepInPhase + 1} of ${numRanks - 1}) — GPUs accumulate chunk sum`
              : `Phase 2: All-Gather (Step ${stepInPhase + 1} of ${numRanks - 1}) — GPUs replicate fully reduced chunks`}
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
            Prev Step
          </button>
          <button
            onClick={() => setLocalStep((prev) => (prev + 1) % totalSteps)}
            style={{
              padding: "4px 12px",
              background: "#0284c7",
              border: "1px solid #38bdf8",
              color: "#ffffff",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Next Step
          </button>
        </div>
      </div>

      {/* SVG Stage */}
      <div ref={ref} style={{ flex: "1 1 auto", width: "100%", height: "480px" }}>
        <svg
          viewBox={viewBoxAttr(boxViewBox(box))}
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <defs>
            <marker
              id="ringArrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Central Topology Stats Card */}
          <g transform={`translate(${centerX - 120}, ${centerY - 55})`}>
            <rect
              width={240}
              height={110}
              rx={8}
              fill="rgba(15, 23, 42, 0.9)"
              stroke={isScatterReduce ? "#0284c7" : "#059669"}
              strokeWidth={1.5}
            />
            <text x={120} y={24} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight={700}>
              {isScatterReduce ? "Phase 1: Scatter-Reduce" : "Phase 2: All-Gather"}
            </text>
            <text
              x={120}
              y={44}
              textAnchor="middle"
              fill="#38bdf8"
              fontSize={11}
              fontFamily="monospace"
            >
              Transfer: 2(P-1)/P * S bytes
            </text>
            <text x={120} y={64} textAnchor="middle" fill="#94a3b8" fontSize={11}>
              Active Step: {step + 1} / {totalSteps}
            </text>
            <text x={120} y={84} textAnchor="middle" fill="#34d399" fontSize={11} fontWeight={600}>
              Bandwidth Efficiency: {Math.round(((numRanks - 1) / numRanks) * 100)}%
            </text>
          </g>

          {/* Directed Ring Arrows connecting adjacent ranks */}
          {nodes.map((node, i) => {
            const nextNode = nodes[(i + 1) % numRanks];
            // Arc path around circle
            const midAngle =
              (node.angle + nextNode.angle) / 2 + (nextNode.angle < node.angle ? Math.PI : 0);
            const arcRadius = ringRadius * 0.95;
            const midX = centerX + arcRadius * Math.cos(midAngle);
            const midY = centerY + arcRadius * Math.sin(midAngle);

            return (
              <g key={`arrow-${i}`}>
                <path
                  d={`M ${node.x} ${node.y} Q ${midX} ${midY} ${nextNode.x} ${nextNode.y}`}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  markerEnd="url(#ringArrow)"
                  opacity={0.85}
                />
              </g>
            );
          })}

          {/* GPU Node Badges & Chunks */}
          {nodes.map((node) => {
            const isRankActive = node.rank === activeRank;
            const nodeW = 100;
            const nodeH = 74;

            return (
              <g
                key={`gpu-node-${node.rank}`}
                transform={`translate(${node.x - nodeW / 2}, ${node.y - nodeH / 2})`}
              >
                <rect
                  width={nodeW}
                  height={nodeH}
                  rx={8}
                  fill="#0f172a"
                  stroke={isRankActive ? "#38bdf8" : "#334155"}
                  strokeWidth={isRankActive ? 2 : 1.5}
                />
                <text
                  x={nodeW / 2}
                  y={18}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize={11}
                  fontWeight={700}
                >
                  GPU {node.rank}
                </text>

                {/* Sub-chunks distribution */}
                <g transform="translate(10, 26)">
                  {Array.from({ length: numRanks }).map((_, chunkIdx) => {
                    const chunkW = (nodeW - 20) / numRanks;
                    const isFullyReduced =
                      (!isScatterReduce && chunkIdx === (node.rank + stepInPhase) % numRanks) ||
                      (!isScatterReduce && stepInPhase === numRanks - 2);

                    return (
                      <g
                        key={`chunk-${node.rank}-${chunkIdx}`}
                        transform={`translate(${chunkIdx * chunkW}, 0)`}
                      >
                        <rect
                          width={chunkW - 2}
                          height={24}
                          rx={3}
                          fill={chunkColors[chunkIdx % chunkColors.length]}
                          opacity={isFullyReduced ? 1.0 : 0.4 + (chunkIdx % 3) * 0.2}
                          stroke="#090d16"
                          strokeWidth={1}
                        />
                        <text
                          x={(chunkW - 2) / 2}
                          y={16}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize={9}
                          fontWeight={700}
                        >
                          C{chunkIdx}
                        </text>
                      </g>
                    );
                  })}
                </g>

                <text x={nodeW / 2} y={64} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                  {isScatterReduce
                    ? `Sending C${(node.rank - stepInPhase + numRanks) % numRanks}`
                    : `Broadcasting`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
