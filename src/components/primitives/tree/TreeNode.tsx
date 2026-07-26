import React from "react";
import { vizSlotBg, vizSlotColor } from "../vizPalette";
import {
  ComputedTreeNode,
  stateBg,
  stateColor,
  GROUP_RING_GAP,
  MOVE_TRANSITION,
  SHAPE_TRANSITION,
} from "./treeTypes";

export interface TreeNodeProps {
  node: ComputedTreeNode;
  nodeRadius: number;
  nodeStroke: number;
  labelFont: number;
  slot?: number;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  nodeRadius,
  nodeStroke,
  labelFont,
  slot,
}) => {
  const hasGroup = slot !== undefined;
  const inSemanticState = node.state !== "default";

  const fill = inSemanticState || !hasGroup ? stateBg(node.state) : vizSlotBg(slot);
  const stroke = inSemanticState || !hasGroup ? stateColor(node.state) : vizSlotColor(slot);
  const showGroupRing = hasGroup && inSemanticState;

  return (
    <g transform={`translate(${node.cx}, ${node.cy})`} style={{ transition: MOVE_TRANSITION }}>
      {showGroupRing && (
        <circle
          r={nodeRadius + GROUP_RING_GAP}
          fill="none"
          stroke={vizSlotColor(slot)}
          strokeWidth={nodeStroke}
          strokeOpacity="0.9"
          style={{ transition: SHAPE_TRANSITION }}
        />
      )}
      <circle
        r={nodeRadius}
        fill={fill}
        stroke={stroke}
        strokeWidth={inSemanticState ? nodeStroke * 1.25 : nodeStroke}
        style={{ transition: SHAPE_TRANSITION }}
      />
      <text
        x="0"
        y="0"
        dominantBaseline="central"
        textAnchor="middle"
        fill="var(--text-primary)"
        fontSize={labelFont}
        fontFamily="var(--font-code)"
        fontWeight="600"
      >
        {node.val}
      </text>
    </g>
  );
};
