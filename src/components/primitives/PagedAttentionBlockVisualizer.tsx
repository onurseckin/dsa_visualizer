import React, { useState } from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";

export interface PagedAttentionSequence {
  id: string;
  name: string;
  logicalTokens: number;
  blockIds: number[];
  color: string;
}

export interface PagedAttentionBlockVisualizerProps {
  sequences?: PagedAttentionSequence[];
  numPhysicalBlocks?: number;
  tokensPerBlock?: number;
  width?: number;
  height?: number;
  title?: string;
}

export const PagedAttentionBlockVisualizer: React.FC<PagedAttentionBlockVisualizerProps> = ({
  sequences: initialSequences,
  numPhysicalBlocks = 12,
  tokensPerBlock = 16,
  width = 900,
  height = 560,
  title = "PagedAttention: Block Table Virtual Memory & Copy-On-Write (COW)",
}) => {
  const { ref, box } = useCanvasBox({ width, height });

  const [cowForkActive, setCowForkActive] = useState(false);

  const defaultSequences: PagedAttentionSequence[] = [
    {
      id: "seq_A",
      name: "Request A (Prompt + Generation)",
      logicalTokens: 42,
      blockIds: [2, 5, 8],
      color: "#38bdf8", // Sky blue
    },
    {
      id: "seq_B",
      name: cowForkActive ? "Request B (Beam Fork from A)" : "Request B (Independent)",
      logicalTokens: cowForkActive ? 43 : 28,
      blockIds: cowForkActive ? [2, 5, 11] : [3, 7], // In fork, shares blocks 2 & 5 (COW), own block 11
      color: "#a855f7", // Purple
    },
  ];

  const sequences = initialSequences || defaultSequences;

  const canvasW = Math.max(800, box.width);
  const canvasH = Math.max(500, box.height);
  const padding = 24;
  const topPad = 60;

  const leftPaneW = (canvasW - padding * 3) * 0.46;
  const rightPaneW = (canvasW - padding * 3) * 0.5;
  const paneH = canvasH - topPad - 60;

  return (
    <div
      data-testid="paged-attention-block-visualizer"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        background: "#090d16",
        borderRadius: "12px",
        border: "1px solid rgba(168, 85, 247, 0.25)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          background: "rgba(88, 28, 135, 0.25)",
          borderBottom: "1px solid rgba(168, 85, 247, 0.2)",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#c084fc" }}>
            {title}
          </h3>
          <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
            Virtual Memory Block Tables eliminating internal memory fragmentation (&lt;4% waste vs
            70% in contiguous allocation)
          </p>
        </div>
        <button
          onClick={() => setCowForkActive((prev) => !prev)}
          style={{
            padding: "6px 14px",
            background: cowForkActive ? "#7e22ce" : "#1e293b",
            border: "1px solid #a855f7",
            color: "#ffffff",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {cowForkActive ? "Reset Independent Seqs" : "Simulate Beam Fork (COW)"}
        </button>
      </div>

      {/* SVG Canvas */}
      <div ref={ref} style={{ flex: "1 1 auto", width: "100%", height: "480px" }}>
        <svg
          viewBox={viewBoxAttr(boxViewBox(box))}
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          {/* Left Pane: Logical Token Sequences & Block Tables */}
          <g transform={`translate(${padding}, ${topPad})`}>
            <rect
              width={leftPaneW}
              height={paneH}
              rx={8}
              fill="#0f172a"
              stroke="#334155"
              strokeWidth={1.5}
            />
            <text x={16} y={24} fill="#e2e8f0" fontSize={13} fontWeight={700}>
              Logical KV-Cache Token Sequences
            </text>
            <text x={16} y={40} fill="#94a3b8" fontSize={11}>
              Tokens partitioned into virtual {tokensPerBlock}-token pages
            </text>

            {sequences.map((seq, seqIdx) => {
              const cardY = 55 + seqIdx * 125;
              return (
                <g key={`seq-card-${seq.id}`} transform={`translate(16, ${cardY})`}>
                  <rect
                    width={leftPaneW - 32}
                    height={110}
                    rx={6}
                    fill="#1e293b"
                    stroke={seq.color}
                    strokeWidth={1.5}
                  />
                  <text x={12} y={20} fill={seq.color} fontSize={12} fontWeight={700}>
                    {seq.name}
                  </text>
                  <text x={12} y={36} fill="#94a3b8" fontSize={10}>
                    Length: {seq.logicalTokens} tokens | {seq.blockIds.length} blocks allocated
                  </text>

                  {/* Logical Block Slots */}
                  <g transform="translate(12, 48)">
                    {seq.blockIds.map((physId, bIdx) => {
                      const isShared = cowForkActive && (physId === 2 || physId === 5);
                      return (
                        <g
                          key={`block-slot-${seq.id}-${bIdx}`}
                          transform={`translate(${bIdx * 82}, 0)`}
                        >
                          <rect
                            width={74}
                            height={48}
                            rx={4}
                            fill="#0f172a"
                            stroke={isShared ? "#34d399" : seq.color}
                            strokeWidth={isShared ? 2 : 1}
                          />
                          <text
                            x={37}
                            y={16}
                            textAnchor="middle"
                            fill="#e2e8f0"
                            fontSize={9}
                            fontWeight={600}
                          >
                            Logical [{bIdx}]
                          </text>
                          <text
                            x={37}
                            y={32}
                            textAnchor="middle"
                            fill={isShared ? "#34d399" : seq.color}
                            fontSize={10}
                            fontWeight={700}
                          >
                            → Phys #{physId}
                          </text>
                          {isShared && (
                            <text
                              x={37}
                              y={44}
                              textAnchor="middle"
                              fill="#34d399"
                              fontSize={8}
                              fontWeight={700}
                            >
                              [COW ref=2]
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                </g>
              );
            })}
          </g>

          {/* Right Pane: Physical Memory Block Pool */}
          <g transform={`translate(${padding * 2 + leftPaneW}, ${topPad})`}>
            <rect
              width={rightPaneW}
              height={paneH}
              rx={8}
              fill="rgba(30, 27, 75, 0.4)"
              stroke="#7e22ce"
              strokeWidth={1.5}
            />
            <text x={16} y={24} fill="#c084fc" fontSize={13} fontWeight={700}>
              Physical HBM Memory Block Pool
            </text>
            <text x={16} y={40} fill="#e9d5ff" fontSize={11}>
              Non-contiguous 16-token physical blocks with Copy-On-Write reference tracking
            </text>

            {/* 4x3 Grid of Physical Blocks */}
            <g transform="translate(20, 55)">
              {Array.from({ length: numPhysicalBlocks }).map((_, blockId) => {
                const cols = 3;
                const r = Math.floor(blockId / cols);
                const c = blockId % cols;
                const bW = (rightPaneW - 60) / cols;
                const bH = (paneH - 90) / 4;

                const isSeqA = [2, 5, 8].includes(blockId);
                const isSeqB = cowForkActive
                  ? [2, 5, 11].includes(blockId)
                  : [3, 7].includes(blockId);
                const isShared = isSeqA && isSeqB;
                const isAllocated = isSeqA || isSeqB;

                let fill = "#0f172a";
                let stroke = "#334155";
                let badgeText = "FREE";
                let badgeColor = "#64748b";

                if (isShared) {
                  fill = "rgba(16, 185, 129, 0.2)";
                  stroke = "#10b981";
                  badgeText = "COW (ref=2)";
                  badgeColor = "#34d399";
                } else if (isSeqA) {
                  fill = "rgba(56, 189, 248, 0.15)";
                  stroke = "#38bdf8";
                  badgeText = "Seq A (ref=1)";
                  badgeColor = "#38bdf8";
                } else if (isSeqB) {
                  fill = "rgba(168, 85, 247, 0.15)";
                  stroke = "#a855f7";
                  badgeText = "Seq B (ref=1)";
                  badgeColor = "#c084fc";
                }

                return (
                  <g key={`phys-block-${blockId}`} transform={`translate(${c * bW}, ${r * bH})`}>
                    <rect
                      width={bW - 8}
                      height={bH - 8}
                      rx={6}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isAllocated ? 1.5 : 1}
                    />
                    <text x={10} y={18} fill="#e2e8f0" fontSize={11} fontWeight={700}>
                      Block #{blockId}
                    </text>
                    <text x={10} y={32} fill="#94a3b8" fontSize={9}>
                      Capacity: {tokensPerBlock} tokens
                    </text>
                    <rect
                      x={10}
                      y={bH - 26}
                      width={bW - 28}
                      height={16}
                      rx={3}
                      fill="#090d16"
                      stroke={stroke}
                      strokeWidth={0.5}
                    />
                    <text
                      x={10 + (bW - 28) / 2}
                      y={bH - 14}
                      textAnchor="middle"
                      fill={badgeColor}
                      fontSize={9}
                      fontWeight={700}
                    >
                      {badgeText}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>

          {/* Bottom Summary Bar */}
          <g transform={`translate(${padding}, ${height - 38})`}>
            <rect width={width - padding * 2} height={32} rx={6} fill="#0f172a" stroke="#1e293b" />
            <circle cx={16} cy={16} r={4} fill="#a855f7" />
            <text x={28} y={20} fill="#94a3b8" fontSize={11}>
              <tspan fill="#c084fc" fontWeight={700}>
                PagedAttention Gain:{" "}
              </tspan>
              Memory waste drops from ~70% down to &lt;4%. Enables 2x-4x higher batch concurrency on
              identical GPU memory.
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
