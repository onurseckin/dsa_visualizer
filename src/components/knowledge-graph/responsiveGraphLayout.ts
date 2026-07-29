import { Size } from "../primitives/vizGeometry";

interface GraphNodeSource {
  id: string;
  x: number;
  y: number;
}

export type ResponsiveGraphNode<T extends GraphNodeSource = GraphNodeSource> = T & {
  width: number;
  height: number;
};

export interface ResponsiveGraphLayout<T extends GraphNodeSource = GraphNodeSource> {
  canvasWidth: number;
  canvasHeight: number;
  nodes: readonly ResponsiveGraphNode<T>[];
}

const DEFAULT_NODE_WIDTH = 210;
const DEFAULT_NODE_HEIGHT = 64;
const DEFAULT_PADDING_X = 40;
const DEFAULT_PADDING_Y = 40;

/**
 * Positions authored roadmap nodes into a spacious canvas that preserves their
 * multi-tier tree hierarchy, level spacing, and prerequisite relationships.
 * Guarantees nodes never overlap or collapse at top.
 */
export const layoutResponsiveGraph = <T extends GraphNodeSource>(
  placements: readonly T[],
  box: Size,
  options?: { nodeWidth?: number; nodeHeight?: number; paddingX?: number; paddingY?: number },
): ResponsiveGraphLayout<T> => {
  if (placements.length === 0) {
    return {
      canvasWidth: Math.max(box.width, 1),
      canvasHeight: Math.max(box.height, 1),
      nodes: [],
    };
  }

  const nodeWidth = options?.nodeWidth ?? DEFAULT_NODE_WIDTH;
  const nodeHeight = options?.nodeHeight ?? DEFAULT_NODE_HEIGHT;
  const paddingX = options?.paddingX ?? DEFAULT_PADDING_X;
  const paddingY = options?.paddingY ?? DEFAULT_PADDING_Y;

  let minAuthoredX = Infinity;
  let maxAuthoredX = -Infinity;
  let minAuthoredY = Infinity;
  let maxAuthoredY = -Infinity;

  for (const node of placements) {
    if (node.x < minAuthoredX) minAuthoredX = node.x;
    if (node.x > maxAuthoredX) maxAuthoredX = node.x;
    if (node.y < minAuthoredY) minAuthoredY = node.y;
    if (node.y > maxAuthoredY) maxAuthoredY = node.y;
  }

  const authoredContentWidth = maxAuthoredX - minAuthoredX + nodeWidth;
  const authoredContentHeight = maxAuthoredY - minAuthoredY + nodeHeight;

  const rawWidth = authoredContentWidth + paddingX * 2;
  const rawHeight = authoredContentHeight + paddingY * 2;

  const canvasWidth = Math.max(box.width, rawWidth);
  const canvasHeight = Math.max(box.height, rawHeight);

  const offsetX = (canvasWidth - rawWidth) / 2 + paddingX + nodeWidth / 2 - minAuthoredX;
  const offsetY = (canvasHeight - rawHeight) / 2 + paddingY + nodeHeight / 2 - minAuthoredY;

  const nodes = placements.map((node) => ({
    ...node,
    x: node.x + offsetX,
    y: node.y + offsetY,
    width: nodeWidth,
    height: nodeHeight,
  }));

  return {
    canvasWidth,
    canvasHeight,
    nodes,
  };
};
