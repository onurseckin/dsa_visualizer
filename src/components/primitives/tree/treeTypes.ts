import { TreeNodeItem, ElementState } from "../../../types/dsa";

export interface TreeVisualizerProps {
  nodes: TreeNodeItem[];
  rootId?: string;
  width?: number;
  height?: number;
  title?: string;
  groups?: Record<string, number>;
}

export interface ComputedTreeNode extends TreeNodeItem {
  cx: number;
  cy: number;
  isPath?: boolean;
  isTraversed?: boolean;
}

export interface TreeLayout {
  nodes: ComputedTreeNode[];
  nodeRadius: number;
}

export const stateColor = (state: ElementState): string => `var(--state-${state})`;
export const stateBg = (state: ElementState): string => `var(--state-${state}-bg)`;

export const MIN_NODE_R = 26;
export const MAX_NODE_R = 46;
export const SPACING_SHARE = 0.45;
export const GROUP_RING_GAP = 5;
export const EDGE_MARGIN = 3;

export const SHAPE_TRANSITION =
  "fill var(--transition-normal), stroke var(--transition-normal), stroke-width var(--transition-normal), opacity var(--transition-normal)";
export const MOVE_TRANSITION = `transform var(--transition-normal), ${SHAPE_TRANSITION}`;

export const layoutPad = (radius: number): number => radius + GROUP_RING_GAP + EDGE_MARGIN;

export interface TreeLegendEntry {
  key: string;
  label: string;
  color: string;
}
