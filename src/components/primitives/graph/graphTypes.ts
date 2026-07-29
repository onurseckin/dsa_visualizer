import {
  GraphNodeItem,
  GraphEdgeItem,
  ElementState,
  AuxiliaryState,
  DisplayValue,
} from "../../../types/dsa";

export interface GraphVisualizerProps {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
  width?: number;
  height?: number;
  isDirected?: boolean;
  layout?: "authored" | "weighted";
  name?: string;
  /** @deprecated Use `name` for primitive identity. */
  title?: string;
  auxiliaryState?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

export interface NodePosition {
  x: number;
  y: number;
}

export type PositionedNode = GraphNodeItem & { x: number; y: number };

export const stateColor = (state: ElementState): string => `var(--state-${state})`;
export const stateBg = (state: ElementState): string => `var(--state-${state}-bg)`;

export const MIN_NODE_R = 22;
export const MAX_NODE_R = 32;
export const SPACING_SHARE = 0.38;
export const GROUP_RING_GAP = 5;
export const EDGE_MARGIN = 24;

export const SHAPE_TRANSITION =
  "fill var(--transition-normal), stroke var(--transition-normal), stroke-width var(--transition-normal), opacity var(--transition-normal)";
export const MOVE_TRANSITION = `transform var(--transition-normal), ${SHAPE_TRANSITION}`;

export interface LegendEntry {
  key: string;
  label: string;
  color: string;
  kind: "group" | "edge";
}
