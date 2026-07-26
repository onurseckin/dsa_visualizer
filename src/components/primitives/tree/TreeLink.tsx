import React from "react";
import { ComputedTreeNode, SHAPE_TRANSITION } from "./treeTypes";

export interface TreeLinkProps {
  parent: ComputedTreeNode;
  child: ComputedTreeNode;
  nodeRadius: number;
  linkStroke: number;
  pathStroke: number;
}

export const TreeLink: React.FC<TreeLinkProps> = ({
  parent,
  child,
  nodeRadius,
  linkStroke,
  pathStroke,
}) => {
  const dx = child.cx - parent.cx;
  const dy = child.cy - parent.cy;
  const dist = Math.hypot(dx, dy);
  const ux = dist > 0 ? dx / dist : 0;
  const uy = dist > 0 ? dy / dist : 0;

  const x1 = parent.cx + ux * nodeRadius;
  const y1 = parent.cy + uy * nodeRadius;
  const x2 = child.cx - ux * nodeRadius;
  const y2 = child.cy - uy * nodeRadius;

  const isPath = (parent.isPath || parent.isTraversed) && (child.isPath || child.isTraversed);

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={isPath ? "var(--state-active)" : "var(--border-default)"}
      strokeWidth={isPath ? pathStroke : linkStroke}
      strokeDasharray={isPath ? undefined : `${linkStroke * 2} ${linkStroke * 2}`}
      strokeOpacity={isPath ? 1 : 0.7}
      strokeLinecap="round"
      style={{ transition: SHAPE_TRANSITION }}
    />
  );
};
