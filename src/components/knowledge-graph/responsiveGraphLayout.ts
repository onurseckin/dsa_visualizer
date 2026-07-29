import { Size, clamp } from "../primitives/vizGeometry";

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
  canvasHeight: number;
  nodes: readonly ResponsiveGraphNode<T>[];
}

const OUTER_PADDING = 16;
const NODE_HEIGHT = 64;
const NODE_GAP_X = 16;
const NODE_GAP_Y = 36;
const MIN_NODE_WIDTH = 156;
const MAX_NODE_WIDTH = 240;

/**
 * Reflows authored roadmap nodes into a measured canvas. The original x/y
 * positions establish reading order; the layout itself guarantees each card
 * remains inside the canvas and cannot overlap at any viewport width.
 */
export const layoutResponsiveGraph = <T extends GraphNodeSource>(
  placements: readonly T[],
  box: Size,
): ResponsiveGraphLayout<T> => {
  const width = Math.max(box.width, 1);
  const availableWidth = Math.max(width - OUTER_PADDING * 2, 1);
  const columns = Math.max(
    1,
    Math.floor((availableWidth + NODE_GAP_X) / (MIN_NODE_WIDTH + NODE_GAP_X)),
  );
  const nodeWidth = clamp(
    (availableWidth - NODE_GAP_X * (columns - 1)) / columns,
    1,
    MAX_NODE_WIDTH,
  );
  const ordered = [...placements].sort((left, right) => left.y - right.y || left.x - right.x);
  const rows = Math.max(Math.ceil(ordered.length / columns), 1);
  const contentHeight = OUTER_PADDING * 2 + rows * NODE_HEIGHT + (rows - 1) * NODE_GAP_Y;
  const canvasHeight = Math.max(box.height, contentHeight);
  const startY = Math.max(
    OUTER_PADDING + NODE_HEIGHT / 2,
    (canvasHeight - contentHeight) / 2 + OUTER_PADDING + NODE_HEIGHT / 2,
  );

  return {
    canvasHeight,
    nodes: ordered.map((node, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      return {
        ...node,
        x: OUTER_PADDING + nodeWidth / 2 + column * (nodeWidth + NODE_GAP_X),
        y: startY + row * (NODE_HEIGHT + NODE_GAP_Y),
        width: nodeWidth,
        height: NODE_HEIGHT,
      };
    }),
  };
};
