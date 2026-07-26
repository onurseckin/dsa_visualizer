import React from "react";
import { GraphEdgeItem } from "../../../types/dsa";
import { vizSlotColor } from "../vizPalette";
import { PositionedNode, MOVE_TRANSITION, SHAPE_TRANSITION } from "./graphTypes";

export interface GraphEdgeProps {
  edge: GraphEdgeItem;
  fromNode: PositionedNode;
  toNode: PositionedNode;
  edgeGroup?: number;
  nodeRadius: number;
  isDirected: boolean;
  markerScope: string;
  plainStroke: number;
  traversedStroke: number;
  pathStroke: number;
  dash: number;
  weightFont: number;
  weightW: number;
  weightH: number;
}

export const GraphEdge: React.FC<GraphEdgeProps> = ({
  edge,
  fromNode,
  toNode,
  edgeGroup,
  nodeRadius,
  isDirected,
  markerScope,
  plainStroke,
  traversedStroke,
  pathStroke,
  dash,
  weightFont,
  weightW,
  weightH,
}) => {
  const restColor = edgeGroup !== undefined ? vizSlotColor(edgeGroup) : "var(--border-default)";

  const strokeColor = edge.isPath
    ? "var(--state-path)"
    : edge.isTraversed
      ? "var(--state-active)"
      : restColor;

  const strokeWidth = edge.isPath ? pathStroke : edge.isTraversed ? traversedStroke : plainStroke;
  const strokeDasharray = edge.isTraversed || edge.isPath ? undefined : `${dash} ${dash}`;
  const strokeOpacity = edge.isTraversed || edge.isPath ? 1 : 0.75;
  const markerId = edge.isPath
    ? `url(#arrowhead-path-${markerScope})`
    : edge.isTraversed
      ? `url(#arrowhead-traversed-${markerScope})`
      : `url(#arrowhead-${markerScope})`;

  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const dist = Math.hypot(dx, dy);
  const ux = dist > 0 ? dx / dist : 0;
  const uy = dist > 0 ? dy / dist : 0;

  const lineX1 = fromNode.x + ux * nodeRadius;
  const lineY1 = fromNode.y + uy * nodeRadius;
  const lineX2 = toNode.x - ux * nodeRadius;
  const lineY2 = toNode.y - uy * nodeRadius;

  const midX = (fromNode.x + toNode.x) / 2;
  const midY = (fromNode.y + toNode.y) / 2;

  return (
    <g>
      <line
        x1={lineX1}
        y1={lineY1}
        x2={lineX2}
        y2={lineY2}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeOpacity={strokeOpacity}
        strokeLinecap="round"
        markerEnd={isDirected ? markerId : undefined}
        style={{ transition: SHAPE_TRANSITION }}
      />
      {edge.weight !== undefined && (
        <g transform={`translate(${midX}, ${midY})`} style={{ transition: MOVE_TRANSITION }}>
          <rect
            x={-weightW / 2}
            y={-weightH / 2}
            width={weightW}
            height={weightH}
            rx={6}
            fill="var(--bg-surface)"
            stroke={edge.isPath || edge.isTraversed ? strokeColor : "var(--border-default)"}
            strokeWidth="1"
            style={{ transition: SHAPE_TRANSITION }}
          />
          <text
            x="0"
            y="0"
            dominantBaseline="central"
            textAnchor="middle"
            fill={edge.isPath || edge.isTraversed ? strokeColor : "var(--text-secondary)"}
            fontSize={weightFont}
            fontFamily="var(--font-code)"
            fontWeight="600"
            style={{ transition: SHAPE_TRANSITION }}
          >
            {edge.weight}
          </text>
        </g>
      )}
    </g>
  );
};
