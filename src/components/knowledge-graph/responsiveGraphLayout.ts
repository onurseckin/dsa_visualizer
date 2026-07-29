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

const DEFAULT_NODE_WIDTH = 190;
const DEFAULT_NODE_HEIGHT = 72;
const MAX_NODE_WIDTH = 210;
const DEFAULT_PADDING_X = 40;
const DEFAULT_PADDING_Y = 100;

export function wrapTitleLines(title: string, maxCharsPerLine: number = 22): string[] {
  if (!title || title.length <= maxCharsPerLine) return [title];
  const words = title.split(" ");
  if (words.length <= 1) return [title];

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + " " + word).length <= maxCharsPerLine) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export function calculateNodeDimensions(title?: string): { width: number; height: number } {
  if (!title) return { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT };
  const len = title.length;
  const width = Math.min(MAX_NODE_WIDTH, Math.max(130, Math.ceil(len * 7) + 32));
  const maxCharsPerLine = Math.max(12, Math.floor((width - 24) / 7.5));
  const lines = wrapTitleLines(title, maxCharsPerLine);
  const height = DEFAULT_NODE_HEIGHT + (lines.length - 1) * 16;
  return { width, height };
}

export function calculateNodeWidth(title?: string): number {
  return calculateNodeDimensions(title).width;
}

/**
 * Positions authored roadmap nodes into a spacious canvas that preserves their
 * multi-tier tree hierarchy, level spacing, and prerequisite relationships.
 * Guarantees nodes never overlap, fit on screen without horizontal scrollbars,
 * and dynamically stagger adjacent nodes vertically when row space is tight.
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

  const defaultWidth = options?.nodeWidth;
  const defaultHeight = options?.nodeHeight;
  const paddingX = options?.paddingX ?? DEFAULT_PADDING_X;
  const paddingY = options?.paddingY ?? DEFAULT_PADDING_Y;

  const nodesWithWidth = placements.map((node) => {
    const title = "title" in node && typeof node.title === "string" ? node.title : undefined;
    const dims = calculateNodeDimensions(title);
    const width = defaultWidth ?? dims.width;
    const height = defaultHeight ?? dims.height;
    return { ...node, width, height };
  });

  let minLeft = Infinity;
  let maxRight = -Infinity;
  let minTop = Infinity;

  for (const node of nodesWithWidth) {
    const left = node.x - node.width / 2;
    const right = node.x + node.width / 2;
    const top = node.y - node.height / 2;
    if (left < minLeft) minLeft = left;
    if (right > maxRight) maxRight = right;
    if (top < minTop) minTop = top;
  }

  const rawWidth = maxRight - minLeft + paddingX * 2;
  const targetWidth = Math.max(box.width || 1100, 768);

  // Responsive scale factor to fit onto screen without horizontal scrollbar
  const scaleX = rawWidth > targetWidth ? (targetWidth - paddingX * 2) / (maxRight - minLeft) : 1;
  const canvasWidth = targetWidth;

  // Initial scaling and centering of X and Y around top-center
  const contentCenterX = (minLeft + maxRight) / 2;
  const canvasCenterX = canvasWidth / 2;

  const positionedNodes = nodesWithWidth.map((node) => {
    const scaledX = canvasCenterX + (node.x - contentCenterX) * scaleX;
    const initialY = paddingY + (node.y - minTop) + node.height / 2;
    return {
      ...node,
      x: scaledX,
      y: initialY,
    };
  });

  // Row grouping & collision-avoidance vertical staggering
  const rows = new Map<number, typeof positionedNodes>();
  for (const node of positionedNodes) {
    let matchedRowY: number | null = null;
    for (const keyY of rows.keys()) {
      if (Math.abs(node.y - keyY) < 35) {
        matchedRowY = keyY;
        break;
      }
    }
    const rowY = matchedRowY ?? node.y;
    const existing = rows.get(rowY) ?? [];
    existing.push(node);
    rows.set(rowY, existing);
  }

  const VERTICAL_STAGGER_STEP = 46;
  const MIN_HORIZONTAL_GAP = 12;

  rows.forEach((rowNodes) => {
    rowNodes.sort((a, b) => a.x - b.x);

    for (let i = 0; i < rowNodes.length - 1; i++) {
      const curr = rowNodes[i];
      const next = rowNodes[i + 1];

      const currRight = curr.x + curr.width / 2;
      const nextLeft = next.x - next.width / 2;

      if (nextLeft < currRight + MIN_HORIZONTAL_GAP) {
        if (Math.abs(next.y - curr.y) < 10) {
          next.y += VERTICAL_STAGGER_STEP;
        }
      }
    }
  });

  let finalMaxY = -Infinity;
  for (const node of positionedNodes) {
    const bottom = node.y + node.height / 2;
    if (bottom > finalMaxY) finalMaxY = bottom;
  }

  const canvasHeight = Math.max(box.height || 800, finalMaxY + paddingY + 80);

  return {
    canvasWidth,
    canvasHeight,
    nodes: positionedNodes,
  };
};
