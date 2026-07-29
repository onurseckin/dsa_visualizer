import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr, spreadToBox, tidyTreeSlots } from "./vizGeometry";
import {
  elementStateToken,
  TrieNodeItem,
  TrieEdgeItem,
  AuxiliaryState,
  DisplayValue,
} from "../../types/dsa";
import { CanvasAuxiliaryOverlay } from "./CanvasAuxiliaryOverlay";

export interface TrieVisualizerProps {
  nodes: TrieNodeItem[];
  edges?: TrieEdgeItem[];
  rootId?: string;
  activePath?: string[];
  searchWord?: string;
  title?: string;
  auxiliaryState?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

export const TrieVisualizer: React.FC<TrieVisualizerProps> = ({
  nodes = [],
  edges = [],
  rootId,
  activePath = [],
  searchWord,
  title,
  auxiliaryState,
  variables,
}) => {
  const { ref, box } = useCanvasBox({ width: 800, height: 500 });

  if (!nodes || nodes.length === 0) return null;

  // Find root node ID
  const effectiveRootId = rootId || nodes.find((n) => !n.parentId)?.id || nodes[0].id;

  // Build tree layout or use authored coordinates
  const nodePosMap = new Map<string, { x: number; y: number }>();
  const hasAuthoredCoords = nodes.every((n) => n.x !== undefined && n.y !== undefined);

  if (hasAuthoredCoords) {
    const rawPoints = nodes.map((n) => ({ x: n.x ?? 0, y: n.y ?? 0 }));
    const spread = spreadToBox(rawPoints, box, 50);
    nodes.forEach((n, idx) => {
      nodePosMap.set(n.id, spread[idx]);
    });
  } else {
    // Auto-calculate hierarchy using tidyTreeSlots
    const childrenMap = new Map<string, string[]>();
    nodes.forEach((n) => childrenMap.set(n.id, n.children ? [...n.children] : []));

    // Fill in child relationships from parentId if children not explicitly passed
    nodes.forEach((n) => {
      if (n.parentId) {
        const parentKids = childrenMap.get(n.parentId) || [];
        if (!parentKids.includes(n.id)) {
          parentKids.push(n.id);
          childrenMap.set(n.parentId, parentKids);
        }
      }
    });

    const tidy = tidyTreeSlots([effectiveRootId], (id) => childrenMap.get(id) || []);
    const maxDepth = Math.max(tidy.depth, 1);
    const totalSlots = Math.max(tidy.leafCount, 1);

    const topPad = title || searchWord ? 55 : 35;
    const availH = Math.max(box.height - topPad - 50, 100);
    const slotW = box.width / (totalSlots + 1);
    const depthH = availH / (maxDepth + 1);

    tidy.slots.forEach((ts) => {
      const x = slotW * (ts.slot + 1);
      const y = topPad + ts.depth * depthH + 20;
      nodePosMap.set(ts.id, { x, y });
    });
  }

  // Derive edge links if not explicitly passed
  const derivedEdges: { from: string; to: string; state?: string }[] = [];
  if (edges.length > 0) {
    derivedEdges.push(...edges);
  } else {
    nodes.forEach((node) => {
      if (node.children) {
        node.children.forEach((childId) => {
          derivedEdges.push({ from: node.id, to: childId });
        });
      } else if (node.parentId) {
        derivedEdges.push({ from: node.parentId, to: node.id });
      }
    });
  }

  const nodeRadius = 18;

  const getNodeStyle = (node: TrieNodeItem) => {
    const isActiveInPath = activePath.includes(node.id);
    const token = node.state ? elementStateToken(node.state) : "default";

    if (isActiveInPath || token === "active") {
      return {
        fill: "rgba(59, 130, 246, 0.25)",
        stroke: "var(--accent, #3b82f6)",
        text: "var(--text-primary)",
      };
    }
    if (token === "sorted" || token === "pivot") {
      return {
        fill: "rgba(16, 185, 129, 0.25)",
        stroke: "#10b981",
        text: "var(--text-primary)",
      };
    }
    if (token === "compare") {
      return {
        fill: "rgba(245, 158, 11, 0.25)",
        stroke: "#f59e0b",
        text: "var(--text-primary)",
      };
    }

    return {
      fill: "var(--bg-surface)",
      stroke: "var(--border-default)",
      text: "var(--text-primary)",
    };
  };

  const isEdgeInActivePath = (from: string, to: string) => {
    const fromIdx = activePath.indexOf(from);
    const toIdx = activePath.indexOf(to);
    return fromIdx !== -1 && toIdx !== -1 && Math.abs(fromIdx - toIdx) === 1;
  };

  return (
    <div
      data-testid="trie-visualizer"
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
          {/* Search Word Banner */}
          {searchWord && (
            <g transform={`translate(${box.width / 2}, 24)`}>
              <rect
                x={-120}
                y={-14}
                width={240}
                height={28}
                rx={6}
                fill="var(--bg-surface)"
                stroke="var(--border-subtle)"
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="12"
                fontWeight="600"
                fontFamily="var(--font-mono, monospace)"
              >
                Search/Insert: "{searchWord}"
              </text>
            </g>
          )}

          {/* Render Edges */}
          {derivedEdges.map((edge, idx) => {
            const fromPos = nodePosMap.get(edge.from);
            const toPos = nodePosMap.get(edge.to);
            if (!fromPos || !toPos) return null;

            const isActive = isEdgeInActivePath(edge.from, edge.to);

            return (
              <g key={`edge-${edge.from}-${edge.to}-${idx}`}>
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={isActive ? "var(--accent, #3b82f6)" : "var(--border-default)"}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  opacity={isActive ? 1 : 0.6}
                />
              </g>
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const pos = nodePosMap.get(node.id);
            if (!pos) return null;

            const style = getNodeStyle(node);

            return (
              <g key={`trie-node-${node.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                {/* End-of-word outer indicator ring */}
                {node.isEndOfWord && (
                  <circle
                    cx={0}
                    cy={0}
                    r={nodeRadius + 4}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="3,3"
                  />
                )}

                {/* Node Circle */}
                <circle
                  cx={0}
                  cy={0}
                  r={nodeRadius}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={activePath.includes(node.id) ? 2.5 : 1.5}
                />

                {/* Character Label */}
                <text
                  x={0}
                  y={5}
                  textAnchor="middle"
                  fill={style.text}
                  fontSize="14"
                  fontWeight="bold"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {node.char || "^"}
                </text>

                {/* Frequency / End Badge if applicable */}
                {node.isEndOfWord && (
                  <text x={nodeRadius + 6} y={-6} fill="#10b981" fontSize="10" fontWeight="bold">
                    ★
                  </text>
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

export default TrieVisualizer;
