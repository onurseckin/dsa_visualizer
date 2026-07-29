import React from "react";
import { GraphEdgeItem } from "../../../types/dsa";
import { vizSlotColor } from "../vizPalette";
import type { Point } from "../vizGeometry";
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
  weightPosition?: Point;
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
  weightPosition,
}) => {
  const restColor = edgeGroup !== undefined ? vizSlotColor(edgeGroup) : "var(--border-default)";
  const semanticState = edge.state;
  const usesSemanticState = semanticState !== undefined;

  const strokeColor = usesSemanticState
    ? semanticState === "candidate"
      ? "var(--state-compare)"
      : semanticState === "selected"
        ? "var(--state-path)"
        : semanticState === "rejected"
          ? "var(--danger)"
          : "var(--border-default)"
    : edge.isPath
      ? "var(--state-path)"
      : edge.isTraversed
        ? "var(--state-active)"
        : restColor;
  const strokeWidth = usesSemanticState
    ? semanticState === "selected"
      ? pathStroke
      : semanticState === "candidate"
        ? traversedStroke
        : plainStroke
    : edge.isPath
      ? pathStroke
      : edge.isTraversed
        ? traversedStroke
        : plainStroke;
  const strokeDasharray = usesSemanticState
    ? semanticState === "default" || semanticState === "rejected"
      ? `${dash} ${dash}`
      : undefined
    : edge.isTraversed || edge.isPath
      ? undefined
      : `${dash} ${dash}`;
  const strokeOpacity = usesSemanticState
    ? semanticState === "default"
      ? 0.75
      : semanticState === "rejected"
        ? 0.6
        : 1
    : edge.isTraversed || edge.isPath
      ? 1
      : 0.75;
  const markerId = usesSemanticState
    ? semanticState === "candidate"
      ? `url(#arrowhead-candidate-${markerScope})`
      : semanticState === "selected"
        ? `url(#arrowhead-path-${markerScope})`
        : semanticState === "rejected"
          ? `url(#arrowhead-rejected-${markerScope})`
          : `url(#arrowhead-${markerScope})`
    : edge.isPath
      ? `url(#arrowhead-path-${markerScope})`
      : edge.isTraversed
        ? `url(#arrowhead-traversed-${markerScope})`
        : `url(#arrowhead-${markerScope})`;
  const isEmphasized = usesSemanticState
    ? semanticState !== "default"
    : edge.isPath || edge.isTraversed;

  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const dist = Math.hypot(dx, dy);
  const ux = dist > 0 ? dx / dist : 0;
  const uy = dist > 0 ? dy / dist : 0;

  const lineX1 = fromNode.x + ux * nodeRadius;
  const lineY1 = fromNode.y + uy * nodeRadius;
  const lineX2 = toNode.x - ux * nodeRadius;
  const lineY2 = toNode.y - uy * nodeRadius;

  const weightX = weightPosition?.x ?? (fromNode.x + toNode.x) / 2;
  const weightY = weightPosition?.y ?? (fromNode.y + toNode.y) / 2;

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
        <g transform={`translate(${weightX}, ${weightY})`} style={{ transition: MOVE_TRANSITION }}>
          <rect
            x={-weightW / 2}
            y={-weightH / 2}
            width={weightW}
            height={weightH}
            rx={6}
            fill="var(--bg-surface)"
            stroke={isEmphasized ? strokeColor : "var(--border-default)"}
            strokeWidth="1"
            style={{ transition: SHAPE_TRANSITION }}
          />
          <text
            x="0"
            y="0"
            dominantBaseline="central"
            textAnchor="middle"
            fill={isEmphasized ? strokeColor : "var(--text-secondary)"}
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
