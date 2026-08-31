import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";

export interface DinicNode {
  readonly id: string | number;
  readonly label?: string;
  readonly level: number;
  readonly isSource?: boolean;
  readonly isSink?: boolean;
  readonly inCutS?: boolean;
}

export interface DinicEdge {
  readonly source: string | number;
  readonly target: string | number;
  readonly capacity: number;
  readonly flow: number;
  readonly isAugmentingPath?: boolean;
  readonly isBackEdge?: boolean;
}

const DEFAULT_DINIC_NODES: readonly DinicNode[] = [
  { id: "S", label: "Source (S)", level: 0, isSource: true, inCutS: true },
  { id: "A", label: "A", level: 1, inCutS: true },
  { id: "B", label: "B", level: 1, inCutS: false },
  { id: "C", label: "C", level: 2, inCutS: false },
  { id: "T", label: "Sink (T)", level: 3, isSink: true, inCutS: false },
];

const DEFAULT_DINIC_EDGES: readonly DinicEdge[] = [
  { source: "S", target: "A", capacity: 10, flow: 10 },
  { source: "S", target: "B", capacity: 5, flow: 4 },
  { source: "A", target: "C", capacity: 8, flow: 8 },
  { source: "B", target: "C", capacity: 4, flow: 4 },
  { source: "A", target: "B", capacity: 4, flow: 2 },
  { source: "C", target: "T", capacity: 15, flow: 14 },
];

export interface DinicFlowVisualizerProps {
  readonly nodes?: readonly DinicNode[];
  readonly edges?: readonly DinicEdge[];
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly maxFlow?: number;
  readonly minCutCapacity?: number;
  readonly activeAugmentingPath?: readonly (string | number)[];
  readonly showMinCutPartition?: boolean;
}

export const DinicFlowVisualizer: React.FC<DinicFlowVisualizerProps> = ({
  nodes = DEFAULT_DINIC_NODES,
  edges = DEFAULT_DINIC_EDGES,
  width = 860,
  height = 520,
  title = "Dinic Algorithm: BFS Level Graph & Blocking Flows",
  maxFlow,
  minCutCapacity,
  activeAugmentingPath = [],
  showMinCutPartition = true,
}) => {
  const { ref, box } = useCanvasBox({ width, height });

  // 1. Group nodes by level column
  const levelsMap = new Map<number, DinicNode[]>();
  let maxLevel = 0;

  for (const node of nodes) {
    if (node.level > maxLevel) maxLevel = node.level;
    if (!levelsMap.has(node.level)) levelsMap.set(node.level, []);
    levelsMap.get(node.level)!.push(node);
  }

  const numLevels = Math.max(1, maxLevel + 1);
  const padX = 70;
  const padY = 80;
  const usableW = box.width - 2 * padX;
  const colW = numLevels > 1 ? usableW / (numLevels - 1) : usableW / 2;

  // Node position map
  const nodePos = new Map<string | number, { x: number; y: number; node: DinicNode }>();

  for (let l = 0; l <= maxLevel; l++) {
    const colNodes = levelsMap.get(l) ?? [];
    const count = colNodes.length;
    const colX = padX + l * colW;

    for (let idx = 0; idx < count; idx++) {
      const node = colNodes[idx];
      const usableH = box.height - 2 * padY;
      const stepY = count > 1 ? usableH / (count - 1) : usableH / 2;
      const posY = count === 1 ? box.height / 2 : padY + idx * stepY;
      nodePos.set(node.id, { x: colX, y: posY, node });
    }
  }

  // Identify cut boundary X position
  let cutBoundaryX = 0;
  if (showMinCutPartition && nodes.length > 0) {
    let maxSx = 0;
    let minTx = box.width;
    for (const node of nodes) {
      const p = nodePos.get(node.id);
      if (!p) continue;
      if (node.inCutS) {
        if (p.x > maxSx) maxSx = p.x;
      } else {
        if (p.x < minTx) minTx = p.x;
      }
    }
    cutBoundaryX = (maxSx + minTx) / 2;
  }

  // Augmenting path set for rapid lookups
  const pathEdgeSet = new Set<string>();
  for (let i = 0; i < activeAugmentingPath.length - 1; i++) {
    pathEdgeSet.add(`${activeAugmentingPath[i]}->${activeAugmentingPath[i + 1]}`);
  }

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
      {/* Header Badges */}
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
          {maxFlow !== undefined && (
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
              Max Flow: {maxFlow}
            </span>
          )}
          {minCutCapacity !== undefined && (
            <span
              style={{
                fontSize: "12px",
                padding: "2px 8px",
                borderRadius: "12px",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.4)",
              }}
            >
              Min-Cut Capacity: {minCutCapacity}
            </span>
          )}
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div
        ref={ref}
        style={{
          flex: "1 1 auto",
          width: "100%",
          minHeight: 0,
          position: "relative",
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
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
            </marker>
            <marker
              id="arrow-path"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            <marker
              id="arrow-saturated"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* Level Column Background Strips */}
          {Array.from({ length: numLevels }).map((_, l) => {
            const colX = padX + l * colW;
            return (
              <g key={`level-col-${l}`}>
                <line
                  x1={colX}
                  y1={20}
                  x2={colX}
                  y2={box.height - 20}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={colX}
                  y={40}
                  textAnchor="middle"
                  fill="rgba(148, 163, 184, 0.6)"
                  fontSize="12"
                  fontWeight="500"
                >
                  {l === 0
                    ? "Level 0 (Source)"
                    : l === maxLevel
                      ? `Level ${l} (Sink)`
                      : `Level ${l}`}
                </text>
              </g>
            );
          })}

          {/* Min-Cut S-T Partition Cut Boundary */}
          {showMinCutPartition && cutBoundaryX > 0 && (
            <g>
              <line
                x1={cutBoundaryX}
                y1={30}
                x2={cutBoundaryX}
                y2={box.height - 30}
                stroke="#f43f5e"
                strokeWidth="2.5"
                strokeDasharray="6 6"
              />
              <rect
                x={cutBoundaryX - 45}
                y={box.height - 45}
                width={90}
                height={22}
                rx={11}
                fill="rgba(244, 63, 94, 0.2)"
                stroke="#f43f5e"
              />
              <text
                x={cutBoundaryX}
                y={box.height - 30}
                textAnchor="middle"
                fill="#fda4af"
                fontSize="11"
                fontWeight="600"
              >
                Min-Cut Boundary
              </text>
            </g>
          )}

          {/* Edges */}
          {edges.map((e, idx) => {
            const src = nodePos.get(e.source);
            const tgt = nodePos.get(e.target);
            if (!src || !tgt) return null;

            const isPath = pathEdgeSet.has(`${e.source}->${e.target}`);
            const isSaturated = e.capacity > 0 && e.flow === e.capacity;
            const strokeColor = isPath ? "#38bdf8" : isSaturated ? "#ef4444" : "#64748b";
            const markerId = isPath
              ? "arrow-path"
              : isSaturated
                ? "arrow-saturated"
                : "arrow-default";

            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2 - (e.isBackEdge ? 18 : 6);

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={strokeColor}
                  strokeWidth={isPath ? 3 : 1.5}
                  markerEnd={`url(#${markerId})`}
                  opacity={e.isBackEdge ? 0.4 : 0.85}
                  strokeDasharray={e.isBackEdge ? "4 3" : undefined}
                />
                {/* Flow / Capacity Badge */}
                <rect
                  x={midX - 22}
                  y={midY - 10}
                  width={44}
                  height={18}
                  rx={4}
                  fill="rgba(15, 23, 42, 0.85)"
                  stroke={strokeColor}
                  strokeWidth="0.75"
                />
                <text
                  x={midX}
                  y={midY + 3}
                  textAnchor="middle"
                  fill={isPath ? "#38bdf8" : isSaturated ? "#f87171" : "#cbd5e1"}
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {e.flow}/{e.capacity}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {Array.from(nodePos.values()).map(({ x, y, node }) => {
            const isSource = node.isSource || node.level === 0;
            const isSink = node.isSink || node.level === maxLevel;
            const nodeFill = isSource
              ? "#0284c7"
              : isSink
                ? "#e11d48"
                : node.inCutS
                  ? "#1e293b"
                  : "#334155";
            const nodeStroke = isSource ? "#38bdf8" : isSink ? "#fb7185" : "#94a3b8";

            return (
              <g key={`node-${node.id}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={20}
                  fill={nodeFill}
                  stroke={nodeStroke}
                  strokeWidth="2"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
                />
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {node.label ?? String(node.id)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
