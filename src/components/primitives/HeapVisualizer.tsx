import React from "react";
import { boxViewBox, useCanvasBox, viewBoxAttr } from "./vizGeometry";
import { elementStateToken, HeapItem, AuxiliaryState, DisplayValue } from "../../types/dsa";
import { CanvasAuxiliaryOverlay } from "./CanvasAuxiliaryOverlay";

export interface HeapVisualizerProps {
  heap: (HeapItem | number | string)[];
  heapType?: "min" | "max";
  swapPair?: [number, number];
  title?: string;
  auxiliaryState?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

export const HeapVisualizer: React.FC<HeapVisualizerProps> = ({
  heap,
  heapType = "min",
  swapPair,
  title,
  auxiliaryState,
  variables,
}) => {
  const { ref, box } = useCanvasBox({ width: 850, height: 520 });

  const normHeap: HeapItem[] = heap.map((item, idx) => {
    if (typeof item === "object" && item !== null && "val" in item) {
      return {
        id: item.id || `heap-node-${idx}`,
        val: item.val,
        state: item.state,
        label: item.label,
      };
    }
    return { id: `heap-node-${idx}`, val: item, state: "default" };
  });

  const count = normHeap.length;

  const isSwapping = (idx: number): boolean => {
    return swapPair !== undefined && (swapPair[0] === idx || swapPair[1] === idx);
  };

  const getNodeFill = (item: HeapItem, idx: number): string => {
    if (isSwapping(idx)) return "rgba(236, 72, 153, 0.35)";
    const token = item.state ? elementStateToken(item.state) : "default";
    switch (token) {
      case "active":
        return "rgba(59, 130, 246, 0.35)";
      case "compare":
        return "rgba(245, 158, 11, 0.35)";
      case "sorted":
      case "pivot":
        return "rgba(16, 185, 129, 0.35)";
      case "swap":
        return "rgba(236, 72, 153, 0.35)";
      default:
        return "var(--bg-surface)";
    }
  };

  const getNodeStroke = (item: HeapItem, idx: number): string => {
    if (isSwapping(idx)) return "#ec4899";
    const token = item.state ? elementStateToken(item.state) : "default";
    switch (token) {
      case "active":
        return "var(--accent)";
      case "compare":
        return "#f59e0b";
      case "sorted":
      case "pivot":
        return "#10b981";
      case "swap":
        return "#ec4899";
      default:
        return "var(--border-default)";
    }
  };

  // 1. Calculate Tree Node Positions for Binary Heap
  const maxLevel = count > 0 ? Math.floor(Math.log2(count)) : 0;

  // Split canvas height into Tree area (upper 65%) and Array area (lower 35%)
  const topPad = title ? 40 : 20;
  const availTreeH = Math.max(box.height * 0.58 - topPad, 120);

  const nodeRadius = Math.max(14, Math.min(24, box.width / (Math.pow(2, maxLevel) * 2.5)));
  const levelH = maxLevel > 0 ? availTreeH / maxLevel : availTreeH;

  const nodePositions: { x: number; y: number }[] = [];

  normHeap.forEach((_, idx) => {
    const level = Math.floor(Math.log2(idx + 1));
    const posInLevel = idx - (Math.pow(2, level) - 1);
    const nodesInLevel = Math.pow(2, level);
    const stepX = box.width / (nodesInLevel + 1);
    const x = stepX * (posInLevel + 1);
    const y = topPad + level * levelH + nodeRadius;
    nodePositions.push({ x, y });
  });

  // 2. Array representation layout (bottom section)
  const arrayY = box.height - 75;
  const cellW = Math.max(28, Math.min(56, (box.width - 80) / Math.max(count, 1)));
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
          {/* Header Heap Type Badge */}
          <g transform="translate(20, 20)">
            <rect
              width={90}
              height={22}
              rx={4}
              fill="var(--bg-surface)"
              stroke="var(--border-default)"
              strokeWidth={1}
            />
            <text
              x={45}
              y={15}
              fill="var(--accent)"
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
            >
              {heapType === "min" ? "Min-Heap" : "Max-Heap"}
            </text>
          </g>

          {/* Tree Edges */}
          {normHeap.map((_, idx) => {
            if (idx === 0) return null;
            const parentIdx = Math.floor((idx - 1) / 2);
            const parentPos = nodePositions[parentIdx];
            const childPos = nodePositions[idx];
            if (!parentPos || !childPos) return null;

            const isSwapEdge =
              swapPair !== undefined &&
              ((swapPair[0] === parentIdx && swapPair[1] === idx) ||
                (swapPair[1] === parentIdx && swapPair[0] === idx));

            return (
              <line
                key={`edge-${parentIdx}-${idx}`}
                x1={parentPos.x}
                y1={parentPos.y}
                x2={childPos.x}
                y2={childPos.y}
                stroke={isSwapEdge ? "#ec4899" : "var(--border-default)"}
                strokeWidth={isSwapEdge ? 3 : 1.5}
                strokeDasharray={isSwapEdge ? "4 2" : undefined}
              />
            );
          })}

          {/* Swap Arc Curve (if swapping non-adjacent or adjacent) */}
          {swapPair !== undefined && nodePositions[swapPair[0]] && nodePositions[swapPair[1]] && (
            <path
              d={`M ${nodePositions[swapPair[0]].x} ${nodePositions[swapPair[0]].y} Q ${(nodePositions[swapPair[0]].x + nodePositions[swapPair[1]].x) / 2} ${Math.min(nodePositions[swapPair[0]].y, nodePositions[swapPair[1]].y) - 30} ${nodePositions[swapPair[1]].x} ${nodePositions[swapPair[1]].y}`}
              fill="none"
              stroke="#ec4899"
              strokeWidth={2.5}
              strokeDasharray="4 3"
            />
          )}

          {/* Tree Nodes */}
          {normHeap.map((item, idx) => {
            const pos = nodePositions[idx];
            if (!pos) return null;
            return (
              <g key={`tree-node-${idx}`} transform={`translate(${pos.x}, ${pos.y})`}>
                <circle
                  r={nodeRadius}
                  fill={getNodeFill(item, idx)}
                  stroke={getNodeStroke(item, idx)}
                  strokeWidth={
                    isSwapping(idx) || (item.state && item.state !== "default") ? 2.5 : 1.5
                  }
                />
                <text
                  y={4}
                  fill="var(--text-primary)"
                  fontSize={Math.max(10, nodeRadius * 0.7)}
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {String(item.val)}
                </text>
                <text
                  y={nodeRadius + 14}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="var(--font-mono, monospace)"
                >
                  [{idx}]
                </text>
              </g>
            );
          })}

          {/* Array Representation Section Divider Line */}
          <line
            x1={40}
            y1={arrayY - 30}
            x2={box.width - 40}
            y2={arrayY - 30}
            stroke="var(--border-subtle)"
            strokeDasharray="3 3"
          />

          <text x={40} y={arrayY - 38} fill="var(--text-muted)" fontSize="11" fontWeight="600">
            Array Storage [0..{count - 1}]:
          </text>

          {/* Array Cells */}
          {normHeap.map((item, idx) => {
            const cx = arrayStartX + idx * cellW;
            const cy = arrayY;
            const cellH = 34;

            return (
              <g key={`arr-cell-${idx}`}>
                {/* Index Label Above */}
                <text
                  x={cx + cellW / 2}
                  y={cy - 6}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {idx}
                </text>

                <rect
                  x={cx}
                  y={cy}
                  width={cellW - 3}
                  height={cellH}
                  rx={4}
                  fill={getNodeFill(item, idx)}
                  stroke={getNodeStroke(item, idx)}
                  strokeWidth={isSwapping(idx) || (item.state && item.state !== "default") ? 2 : 1}
                />

                <text
                  x={cx + (cellW - 3) / 2}
                  y={cy + cellH / 2 + 4}
                  fill="var(--text-primary)"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {String(item.val)}
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

export default HeapVisualizer;
