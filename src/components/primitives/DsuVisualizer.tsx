import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr, tidyTreeSlots } from "./vizGeometry";
import { elementStateToken, DsuNodeItem, AuxiliaryState, DisplayValue } from "../../types/dsa";
import { CanvasAuxiliaryOverlay } from "./CanvasAuxiliaryOverlay";
import { vizSlotBg, vizSlotColor } from "./vizPalette";

export interface DsuVisualizerProps {
  nodes: DsuNodeItem[];
  activeIds?: string[];
  title?: string;
  auxiliaryState?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

export const DsuVisualizer: React.FC<DsuVisualizerProps> = ({
  nodes,
  activeIds = [],
  title,
  auxiliaryState,
  variables,
}) => {
  const { ref, box } = useCanvasBox({ width: 850, height: 540 });

  if (!nodes || nodes.length === 0) return null;

  // 1. Build node lookup & forest hierarchy
  const nodeMap = new Map<string, DsuNodeItem>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const childrenMap = new Map<string, string[]>();
  nodes.forEach((n) => childrenMap.set(n.id, []));

  const roots: string[] = [];
  const componentMap = new Map<string, number>();

  nodes.forEach((n) => {
    if (!n.parentId || n.parentId === n.id || !nodeMap.has(n.parentId)) {
      roots.push(n.id);
    } else {
      const list = childrenMap.get(n.parentId);
      if (list) list.push(n.id);
    }
  });

  // Assign component indices to roots
  roots.forEach((rootId, rIdx) => {
    const queue = [rootId];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      componentMap.set(curr, rIdx);
      const kids = childrenMap.get(curr) || [];
      queue.push(...kids);
    }
  });

  // Layout tree forest using tidyTreeSlots
  const tidy = tidyTreeSlots(roots, (id) => childrenMap.get(id) || []);
  const maxDepth = Math.max(tidy.depth, 1);
  const totalSlots = Math.max(tidy.leafCount, 1);

  const topPad = title ? 40 : 25;
  const availH = Math.max(box.height * 0.55 - topPad, 120);

  const slotW = box.width / (totalSlots + 1);
  const depthH = availH / (maxDepth + 1);
  const nodeRadius = Math.max(14, Math.min(22, slotW * 0.35));

  const treePosMap = new Map<string, { x: number; y: number }>();
  tidy.slots.forEach((ts) => {
    const x = slotW * (ts.slot + 1);
    const y = topPad + ts.depth * depthH + nodeRadius + 10;
    treePosMap.set(ts.id, { x, y });
  });

  const isActive = (id: string): boolean => activeIds.includes(id);

  const getNodeFill = (item: DsuNodeItem): string => {
    const compIdx = item.group !== undefined ? item.group : (componentMap.get(item.id) ?? 0);
    if (isActive(item.id)) return vizSlotBg(compIdx, 45);
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
        return vizSlotBg(compIdx, 20);
    }
  };

  const getNodeStroke = (item: DsuNodeItem): string => {
    const compIdx = item.group !== undefined ? item.group : (componentMap.get(item.id) ?? 0);
    if (isActive(item.id)) return "var(--accent)";
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
        return vizSlotColor(compIdx);
    }
  };

  // 2. Parent & Rank / Size Array Representation (Bottom Section)
  const arrayY = box.height - 110;
  const count = nodes.length;
  const cellW = Math.max(36, Math.min(60, (box.width - 80) / Math.max(count, 1)));
  const arrayStartX = (box.width - count * cellW) / 2;

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
              id="dsu-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--text-muted)" />
            </marker>
          </defs>

          {/* Forest Parent Pointer Edges (Child -> Parent) */}
          {nodes.map((n) => {
            if (!n.parentId || n.parentId === n.id) return null;
            const childPos = treePosMap.get(n.id);
            const parentPos = treePosMap.get(n.parentId);
            if (!childPos || !parentPos) return null;

            return (
              <line
                key={`edge-${n.id}-${n.parentId}`}
                x1={childPos.x}
                y1={childPos.y - nodeRadius}
                x2={parentPos.x}
                y2={parentPos.y + nodeRadius}
                stroke={
                  isActive(n.id) || isActive(n.parentId) ? "var(--accent)" : "var(--text-muted)"
                }
                strokeWidth={isActive(n.id) ? 2.5 : 1.5}
                markerEnd="url(#dsu-arrow)"
              />
            );
          })}

          {/* Forest Tree Nodes */}
          {nodes.map((n) => {
            const pos = treePosMap.get(n.id);
            if (!pos) return null;
            const isRoot = !n.parentId || n.parentId === n.id;

            return (
              <g key={`dsu-tree-${n.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                <circle
                  r={nodeRadius}
                  fill={getNodeFill(n)}
                  stroke={getNodeStroke(n)}
                  strokeWidth={isRoot || isActive(n.id) ? 2.5 : 1.5}
                />
                <text
                  y={4}
                  fill="var(--text-primary)"
                  fontSize={Math.max(10, nodeRadius * 0.7)}
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {n.label || n.id}
                </text>
                {isRoot && (
                  <text
                    y={-nodeRadius - 6}
                    fill="var(--accent)"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ROOT
                  </text>
                )}
              </g>
            );
          })}

          {/* Section Divider */}
          <line
            x1={40}
            y1={arrayY - 24}
            x2={box.width - 40}
            y2={arrayY - 24}
            stroke="var(--border-subtle)"
            strokeDasharray="3 3"
          />

          {/* Table Headers */}
          <text
            x={arrayStartX - 45}
            y={arrayY + 18}
            fill="var(--text-muted)"
            fontSize="10"
            fontWeight="bold"
          >
            id:
          </text>
          <text
            x={arrayStartX - 45}
            y={arrayY + 44}
            fill="var(--text-muted)"
            fontSize="10"
            fontWeight="bold"
          >
            parent:
          </text>
          <text
            x={arrayStartX - 45}
            y={arrayY + 70}
            fill="var(--text-muted)"
            fontSize="10"
            fontWeight="bold"
          >
            rank/size:
          </text>

          {/* Disjoint Set Arrays (ID / Parent / Rank or Size) */}
          {nodes.map((n, idx) => {
            const cx = arrayStartX + idx * cellW;
            const compIdx = n.group !== undefined ? n.group : (componentMap.get(n.id) ?? 0);

            return (
              <g key={`dsu-arr-${n.id}`}>
                {/* ID Header Row */}
                <rect
                  x={cx}
                  y={arrayY}
                  width={cellW - 2}
                  height={24}
                  rx={3}
                  fill={vizSlotBg(compIdx, 15)}
                  stroke={vizSlotColor(compIdx)}
                  strokeWidth={1}
                />
                <text
                  x={cx + (cellW - 2) / 2}
                  y={arrayY + 16}
                  fill="var(--text-primary)"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {n.id}
                </text>

                {/* Parent Row */}
                <rect
                  x={cx}
                  y={arrayY + 26}
                  width={cellW - 2}
                  height={24}
                  rx={3}
                  fill={isActive(n.id) ? "rgba(59, 130, 246, 0.25)" : "var(--bg-surface)"}
                  stroke={isActive(n.id) ? "var(--accent)" : "var(--border-default)"}
                  strokeWidth={1}
                />
                <text
                  x={cx + (cellW - 2) / 2}
                  y={arrayY + 42}
                  fill="var(--text-primary)"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {n.parentId ?? n.id}
                </text>

                {/* Rank / Size Row */}
                <rect
                  x={cx}
                  y={arrayY + 52}
                  width={cellW - 2}
                  height={24}
                  rx={3}
                  fill="var(--bg-surface)"
                  stroke="var(--border-default)"
                  strokeWidth={1}
                />
                <text
                  x={cx + (cellW - 2) / 2}
                  y={arrayY + 68}
                  fill="var(--text-muted)"
                  fontSize="10"
                  fontWeight="500"
                  textAnchor="middle"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {n.rank !== undefined
                    ? `r:${n.rank}`
                    : n.size !== undefined
                      ? `s:${n.size}`
                      : "-"}
                </text>
              </g>
            );
          })}

          <CanvasAuxiliaryOverlay box={box} state={auxiliaryState} variables={variables} />
        </svg>
      </div>
    </div>
  );
};

export default DsuVisualizer;
