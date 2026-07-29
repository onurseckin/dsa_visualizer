import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr, spreadToBox, tidyTreeSlots } from "./vizGeometry";
import {
  elementStateToken,
  StateSpaceNodeItem,
  StateSpaceEdgeItem,
  AuxiliaryState,
  DisplayValue,
} from "../../types/dsa";
import { CanvasAuxiliaryOverlay } from "./CanvasAuxiliaryOverlay";
import { vizSlotBg, vizSlotColor } from "./vizPalette";

export interface StateSpaceVisualizerProps {
  nodes: StateSpaceNodeItem[];
  edges?: StateSpaceEdgeItem[];
  activeNodeId?: string;
  path?: string[];
  title?: string;
  auxiliaryState?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

export const StateSpaceVisualizer: React.FC<StateSpaceVisualizerProps> = ({
  nodes,
  edges = [],
  activeNodeId,
  path = [],
  title,
  auxiliaryState,
  variables,
}) => {
  const { ref, box } = useCanvasBox({ width: 900, height: 560 });

  if (!nodes || nodes.length === 0) return null;

  // 1. Position calculation
  const nodePosMap = new Map<string, { x: number; y: number }>();
  const hasAuthoredCoords = nodes.every((n) => n.x !== undefined && n.y !== undefined);

  if (hasAuthoredCoords) {
    const rawPoints = nodes.map((n) => ({ x: n.x ?? 0, y: n.y ?? 0 }));
    const spread = spreadToBox(rawPoints, box, 60);
    nodes.forEach((n, idx) => {
      nodePosMap.set(n.id, spread[idx]);
    });
  } else {
    // Build tree/DAG layout automatically
    const childrenMap = new Map<string, string[]>();
    nodes.forEach((n) => childrenMap.set(n.id, []));

    const inDegreeMap = new Map<string, number>();
    nodes.forEach((n) => inDegreeMap.set(n.id, 0));

    edges.forEach((e) => {
      const kids = childrenMap.get(e.from);
      if (kids) kids.push(e.to);
      inDegreeMap.set(e.to, (inDegreeMap.get(e.to) || 0) + 1);
    });

    const roots = nodes.filter((n) => (inDegreeMap.get(n.id) || 0) === 0).map((n) => n.id);
    const fallbackRoots = roots.length > 0 ? roots : [nodes[0].id];

    const tidy = tidyTreeSlots(fallbackRoots, (id) => childrenMap.get(id) || []);
    const maxDepth = Math.max(tidy.depth, 1);
    const totalSlots = Math.max(tidy.leafCount, 1);

    const topPad = title ? 40 : 25;
    const availH = Math.max(box.height - topPad - 60, 120);
    const slotW = box.width / (totalSlots + 1);
    const depthH = availH / (maxDepth + 1);

    tidy.slots.forEach((ts) => {
      const x = slotW * (ts.slot + 1);
      const y = topPad + ts.depth * depthH + 25;
      nodePosMap.set(ts.id, { x, y });
    });
  }

  const isCurrent = (id: string): boolean =>
    id === activeNodeId || nodes.find((n) => n.id === id)?.isCurrent === true;
  const isInPath = (id: string): boolean => path.includes(id);

  const getNodeFill = (item: StateSpaceNodeItem): string => {
    if (item.isPruned) return "rgba(239, 68, 68, 0.25)";
    if (item.isGoal) return "rgba(16, 185, 129, 0.35)";
    if (isCurrent(item.id)) return "rgba(59, 130, 246, 0.35)";
    if (isInPath(item.id)) return "rgba(168, 85, 247, 0.25)";
    if (item.group !== undefined) return vizSlotBg(item.group, 25);

    const token = item.state ? elementStateToken(item.state) : "default";
    switch (token) {
      case "active":
        return "rgba(59, 130, 246, 0.35)";
      case "compare":
        return "rgba(245, 158, 11, 0.35)";
      case "sorted":
      case "pivot":
        return "rgba(16, 185, 129, 0.35)";
      default:
        return "var(--bg-surface)";
    }
  };

  const getNodeStroke = (item: StateSpaceNodeItem): string => {
    if (item.isPruned) return "#ef4444";
    if (item.isGoal) return "#10b981";
    if (isCurrent(item.id)) return "var(--accent)";
    if (isInPath(item.id)) return "#a855f7";
    if (item.group !== undefined) return vizSlotColor(item.group);

    const token = item.state ? elementStateToken(item.state) : "default";
    switch (token) {
      case "active":
        return "var(--accent)";
      case "compare":
        return "#f59e0b";
      case "sorted":
      case "pivot":
        return "#10b981";
      default:
        return "var(--border-default)";
    }
  };

  const nodeW = 100;
  const nodeH = 44;

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
          <defs>
            <marker
              id="statespace-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--text-muted)" />
            </marker>
            <marker
              id="statespace-arrow-path"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#a855f7" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((e, idx) => {
            const pFrom = nodePosMap.get(e.from);
            const pTo = nodePosMap.get(e.to);
            if (!pFrom || !pTo) return null;

            const isPathEdge =
              e.isPath ||
              (isInPath(e.from) &&
                isInPath(e.to) &&
                Math.abs(path.indexOf(e.from) - path.indexOf(e.to)) === 1);

            const midX = (pFrom.x + pTo.x) / 2;
            const midY = (pFrom.y + pTo.y) / 2;

            return (
              <g key={`ss-edge-${e.from}-${e.to}-${idx}`}>
                <line
                  x1={pFrom.x}
                  y1={pFrom.y}
                  x2={pTo.x}
                  y2={pTo.y}
                  stroke={isPathEdge ? "#a855f7" : "var(--border-default)"}
                  strokeWidth={isPathEdge ? 2.5 : 1.5}
                  strokeDasharray={e.state === "compare" ? "3 3" : undefined}
                  markerEnd={isPathEdge ? "url(#statespace-arrow-path)" : "url(#statespace-arrow)"}
                />
                {(e.action || e.label || e.cost !== undefined) && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x={-24}
                      y={-10}
                      width={48}
                      height={16}
                      rx={3}
                      fill="var(--bg-surface)"
                      stroke="var(--border-subtle)"
                      strokeWidth={1}
                    />
                    <text
                      y={2}
                      fill="var(--text-muted)"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="var(--font-mono, monospace)"
                    >
                      {e.action || e.label || (e.cost !== undefined ? `c:${e.cost}` : "")}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* State Decision Nodes */}
          {nodes.map((n) => {
            const pos = nodePosMap.get(n.id);
            if (!pos) return null;

            const current = isCurrent(n.id);

            return (
              <g key={`ss-node-${n.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                {/* Active Glowing Outer Ring */}
                {current && (
                  <rect
                    x={-nodeW / 2 - 4}
                    y={-nodeH / 2 - 4}
                    width={nodeW + 8}
                    height={nodeH + 8}
                    rx={10}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                  />
                )}

                {/* Node Box */}
                <rect
                  x={-nodeW / 2}
                  y={-nodeH / 2}
                  width={nodeW}
                  height={nodeH}
                  rx={8}
                  fill={getNodeFill(n)}
                  stroke={getNodeStroke(n)}
                  strokeWidth={n.isGoal || n.isPruned || current ? 2 : 1}
                />

                {/* Node Label */}
                <text
                  y={n.score !== undefined ? -3 : 4}
                  fill="var(--text-primary)"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {n.label}
                </text>

                {/* Score / Cost Badge */}
                {n.score !== undefined && (
                  <text
                    y={12}
                    fill="var(--text-muted)"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="var(--font-mono, monospace)"
                  >
                    score: {String(n.score)}
                  </text>
                )}

                {/* Goal Tag */}
                {n.isGoal && (
                  <g transform={`translate(${nodeW / 2 - 8}, ${-nodeH / 2 - 4})`}>
                    <circle r={7} fill="#10b981" />
                    <text y={3} fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
                      ✓
                    </text>
                  </g>
                )}

                {/* Pruned Tag */}
                {n.isPruned && (
                  <g transform={`translate(${nodeW / 2 - 8}, ${-nodeH / 2 - 4})`}>
                    <circle r={7} fill="#ef4444" />
                    <text y={3} fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
                      ✕
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

export default StateSpaceVisualizer;
