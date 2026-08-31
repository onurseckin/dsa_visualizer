/**
 * Interactive DSA Visualizer Canvas Geometry & Layout Builder
 *
 * Provides high-fidelity 2D geometric calculators, Reingold-Tilford tree layouts,
 * Fruchterman-Reingold force-directed graph physics, array memory grid overlays,
 * and SVG path generators for in-canvas algorithm animations.
 */

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface BinaryTreeNodeInput {
  readonly id: string;
  readonly val: string | number;
  readonly left?: BinaryTreeNodeInput;
  readonly right?: BinaryTreeNodeInput;
  readonly balanceFactor?: number;
}

export interface TreeNodeLayout {
  readonly id: string;
  readonly val: string | number;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly depth: number;
  readonly leftId?: string;
  readonly rightId?: string;
  readonly balanceFactor?: number;
}

export interface TreeLayoutEdge {
  readonly fromId: string;
  readonly toId: string;
  readonly from: Point2D;
  readonly to: Point2D;
  readonly pathD: string;
}

export interface TreeLayoutResult {
  readonly nodes: readonly TreeNodeLayout[];
  readonly edges: readonly TreeLayoutEdge[];
  readonly width: number;
  readonly height: number;
}

export interface GraphNodeInput {
  readonly id: string;
  readonly label?: string;
  readonly x?: number;
  readonly y?: number;
  readonly radius?: number;
  readonly color?: string;
}

export interface GraphEdgeInput {
  readonly source: string;
  readonly target: string;
  readonly weight?: number;
  readonly capacity?: number;
  readonly flow?: number;
  readonly isBackEdge?: boolean;
}

export interface GraphNodeLayout {
  readonly id: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly color?: string;
}

export interface GraphEdgeLayout extends GraphEdgeInput {
  readonly sourcePoint: Point2D;
  readonly targetPoint: Point2D;
  readonly pathD: string;
}

export interface GraphLayoutResult {
  readonly nodes: readonly GraphNodeLayout[];
  readonly edges: readonly GraphEdgeLayout[];
  readonly bounds: {
    readonly minX: number;
    readonly maxX: number;
    readonly minY: number;
    readonly maxY: number;
  };
}

export interface ArrayGridPointer {
  readonly name: string;
  readonly index: number;
  readonly position?: "top" | "bottom";
  readonly color?: string;
}

export interface ArrayCellLayout {
  readonly index: number;
  readonly value: string | number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly isCacheLineStart: boolean;
  readonly pointers: readonly string[];
  readonly highlighted?: boolean;
}

export interface ArrayGridLayoutResult {
  readonly cells: readonly ArrayCellLayout[];
  readonly width: number;
  readonly height: number;
  readonly cacheLinesCount: number;
}

export interface ConvexHullPolygonResult {
  readonly vertices: readonly Point2D[];
  readonly svgPoints: string;
  readonly pathD: string;
  readonly area: number;
  readonly perimeter: number;
}

export interface CurvedArrowOptions {
  readonly curvature?: number;
  readonly arrowHeadSize?: number;
  readonly offsetFromCenter?: number;
}

/**
 * Computes SVG cubic bezier curved path between two 2D points.
 */
export function generateCurvedArrow(
  source: Point2D,
  target: Point2D,
  options: CurvedArrowOptions = {},
): string {
  const { curvature = 0.2, offsetFromCenter = 0 } = options;

  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) {
    return `M ${source.x} ${source.y}`;
  }

  const uX = dx / dist;
  const uY = dy / dist;

  const startX = source.x + uX * offsetFromCenter;
  const startY = source.y + uY * offsetFromCenter;
  const endX = target.x - uX * offsetFromCenter;
  const endY = target.y - uY * offsetFromCenter;

  // Perpendicular vector for curvature
  const perpX = -uY;
  const perpY = uX;
  const controlDist = dist * curvature;

  const midX = (startX + endX) / 2 + perpX * controlDist;
  const midY = (startY + endY) / 2 + perpY * controlDist;

  return `M ${startX.toFixed(2)} ${startY.toFixed(2)} Q ${midX.toFixed(2)} ${midY.toFixed(2)}, ${endX.toFixed(2)} ${endY.toFixed(2)}`;
}

/**
 * Calculates (x, y) coordinates for binary trees and AVL trees using Reingold-Tilford hierarchy.
 */
export function layoutBinaryTree(
  root: BinaryTreeNodeInput | null | undefined,
  canvasWidth: number = 800,
  canvasHeight: number = 500,
  nodeRadius: number = 22,
): TreeLayoutResult {
  if (!root) {
    return { nodes: [], edges: [], width: canvasWidth, height: canvasHeight };
  }

  interface InternalNode {
    id: string;
    val: string | number;
    left?: InternalNode;
    right?: InternalNode;
    depth: number;
    x: number;
    y: number;
    balanceFactor?: number;
  }

  let maxDepth = 0;
  let nextXIndex = 0;

  function buildInternal(n: BinaryTreeNodeInput, d: number): InternalNode {
    if (d > maxDepth) maxDepth = d;
    const internal: InternalNode = {
      id: n.id,
      val: n.val,
      depth: d,
      x: 0,
      y: 0,
      balanceFactor: n.balanceFactor,
    };
    if (n.left) internal.left = buildInternal(n.left, d + 1);
    if (n.right) internal.right = buildInternal(n.right, d + 1);
    return internal;
  }

  const internalRoot = buildInternal(root, 0);

  // In-order traversal assigns monotonically increasing horizontal positions
  function assignInorder(n: InternalNode): void {
    if (n.left) assignInorder(n.left);
    n.x = nextXIndex++;
    if (n.right) assignInorder(n.right);
  }

  assignInorder(internalRoot);

  const totalCols = Math.max(1, nextXIndex);
  const totalRows = Math.max(1, maxDepth + 1);

  const paddingX = nodeRadius * 2.5;
  const paddingY = nodeRadius * 2.5;
  const usableWidth = canvasWidth - 2 * paddingX;
  const usableHeight = canvasHeight - 2 * paddingY;

  const colWidth = usableWidth / Math.max(1, totalCols - 1);
  const rowHeight = usableHeight / Math.max(1, totalRows - 1);

  const layoutNodes: TreeNodeLayout[] = [];
  const layoutEdges: TreeLayoutEdge[] = [];

  function mapCoordinates(n: InternalNode): void {
    const screenX = totalCols === 1 ? canvasWidth / 2 : paddingX + n.x * colWidth;
    const screenY = totalRows === 1 ? canvasHeight / 2 : paddingY + n.depth * rowHeight;

    layoutNodes.push({
      id: n.id,
      val: n.val,
      x: Math.round(screenX),
      y: Math.round(screenY),
      radius: nodeRadius,
      depth: n.depth,
      leftId: n.left?.id,
      rightId: n.right?.id,
      balanceFactor: n.balanceFactor,
    });

    if (n.left) {
      const leftX = totalCols === 1 ? canvasWidth / 2 : paddingX + n.left.x * colWidth;
      const leftY = paddingY + n.left.depth * rowHeight;
      const pathD = generateCurvedArrow(
        { x: screenX, y: screenY },
        { x: leftX, y: leftY },
        { curvature: 0, offsetFromCenter: nodeRadius },
      );
      layoutEdges.push({
        fromId: n.id,
        toId: n.left.id,
        from: { x: Math.round(screenX), y: Math.round(screenY) },
        to: { x: Math.round(leftX), y: Math.round(leftY) },
        pathD,
      });
      mapCoordinates(n.left);
    }

    if (n.right) {
      const rightX = totalCols === 1 ? canvasWidth / 2 : paddingX + n.right.x * colWidth;
      const rightY = paddingY + n.right.depth * rowHeight;
      const pathD = generateCurvedArrow(
        { x: screenX, y: screenY },
        { x: rightX, y: rightY },
        { curvature: 0, offsetFromCenter: nodeRadius },
      );
      layoutEdges.push({
        fromId: n.id,
        toId: n.right.id,
        from: { x: Math.round(screenX), y: Math.round(screenY) },
        to: { x: Math.round(rightX), y: Math.round(rightY) },
        pathD,
      });
      mapCoordinates(n.right);
    }
  }

  mapCoordinates(internalRoot);

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    width: canvasWidth,
    height: canvasHeight,
  };
}

/**
 * Computes 2D graph layout using the Fruchterman-Reingold Force-Directed physical simulation.
 */
export function layoutGraphForceDirected(
  nodes: readonly GraphNodeInput[],
  edges: readonly GraphEdgeInput[],
  canvasWidth: number = 800,
  canvasHeight: number = 600,
  iterations: number = 100,
): GraphLayoutResult {
  const nodeCount = nodes.length;
  if (nodeCount === 0) {
    return {
      nodes: [],
      edges: [],
      bounds: { minX: 0, maxX: canvasWidth, minY: 0, maxY: canvasHeight },
    };
  }

  const area = canvasWidth * canvasHeight;
  const k = Math.sqrt(area / Math.max(1, nodeCount)) * 0.75;
  let temperature = canvasWidth / 10;

  // Initialize node positions in a circle if unassigned
  const pos: { [id: string]: { x: number; y: number; dx: number; dy: number; radius: number } } =
    {};

  for (let i = 0; i < nodeCount; i++) {
    const n = nodes[i];
    const angle = (2 * Math.PI * i) / nodeCount;
    const initialX =
      n.x !== undefined ? n.x : canvasWidth / 2 + (canvasWidth / 3) * Math.cos(angle);
    const initialY =
      n.y !== undefined ? n.y : canvasHeight / 2 + (canvasHeight / 3) * Math.sin(angle);
    pos[n.id] = {
      x: initialX,
      y: initialY,
      dx: 0,
      dy: 0,
      radius: n.radius ?? 20,
    };
  }

  // Simulation loop
  for (let iter = 0; iter < iterations; iter++) {
    // 1. Calculate repulsive forces between all pairs
    for (let i = 0; i < nodeCount; i++) {
      const u = nodes[i].id;
      for (let j = i + 1; j < nodeCount; j++) {
        const v = nodes[j].id;
        const dx = pos[u].x - pos[v].x;
        const dy = pos[u].y - pos[v].y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));

        const repForce = (k * k) / dist;
        const fx = (dx / dist) * repForce;
        const fy = (dy / dist) * repForce;

        pos[u].dx += fx;
        pos[u].dy += fy;
        pos[v].dx -= fx;
        pos[v].dy -= fy;
      }
    }

    // 2. Calculate attractive forces along edges
    for (const edge of edges) {
      const u = edge.source;
      const v = edge.target;
      if (!pos[u] || !pos[v]) continue;

      const dx = pos[u].x - pos[v].x;
      const dy = pos[u].y - pos[v].y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));

      const attForce = (dist * dist) / k;
      const fx = (dx / dist) * attForce;
      const fy = (dy / dist) * attForce;

      pos[u].dx -= fx;
      pos[u].dy -= fy;
      pos[v].dx += fx;
      pos[v].dy += fy;
    }

    // 3. Apply displacement clamped by temperature
    for (const node of nodes) {
      const p = pos[node.id];
      const dispDist = Math.max(1, Math.sqrt(p.dx * p.dx + p.dy * p.dy));
      const clampedDisp = Math.min(dispDist, temperature);

      p.x += (p.dx / dispDist) * clampedDisp;
      p.y += (p.dy / dispDist) * clampedDisp;

      // Constrain within canvas boundaries
      const pad = p.radius + 10;
      p.x = Math.max(pad, Math.min(canvasWidth - pad, p.x));
      p.y = Math.max(pad, Math.min(canvasHeight - pad, p.y));

      p.dx = 0;
      p.dy = 0;
    }

    // Cool temperature
    temperature *= 0.95;
  }

  const resultNodes: GraphNodeLayout[] = nodes.map((n) => ({
    id: n.id,
    label: n.label ?? n.id,
    x: Math.round(pos[n.id].x),
    y: Math.round(pos[n.id].y),
    radius: pos[n.id].radius,
    color: n.color,
  }));

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const n of resultNodes) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  }

  const resultEdges: GraphEdgeLayout[] = edges.map((e) => {
    const s = pos[e.source];
    const t = pos[e.target];
    const srcPt = s ? { x: Math.round(s.x), y: Math.round(s.y) } : { x: 0, y: 0 };
    const tgtPt = t ? { x: Math.round(t.x), y: Math.round(t.y) } : { x: 0, y: 0 };
    const radius = s ? s.radius : 20;

    const pathD = generateCurvedArrow(srcPt, tgtPt, {
      curvature: e.isBackEdge ? 0.3 : 0.05,
      offsetFromCenter: radius,
    });

    return {
      ...e,
      sourcePoint: srcPt,
      targetPoint: tgtPt,
      pathD,
    };
  });

  return {
    nodes: resultNodes,
    edges: resultEdges,
    bounds: {
      minX: minX === Infinity ? 0 : minX,
      maxX: maxX === -Infinity ? canvasWidth : maxX,
      minY: minY === Infinity ? 0 : minY,
      maxY: maxY === -Infinity ? canvasHeight : maxY,
    },
  };
}

/**
 * Computes 1D/2D array memory grid layouts with cache line boundaries and multi-pointer overlays.
 */
export function layoutArrayGrid(
  array: readonly (string | number)[],
  cellWidth: number = 55,
  cellHeight: number = 45,
  startX: number = 30,
  startY: number = 80,
  pointers: readonly ArrayGridPointer[] = [],
  highlightedIndices: readonly number[] = [],
  cacheLineSizeElements: number = 16, // 16 x 4-byte integers = 64-byte L1 cache line
): ArrayGridLayoutResult {
  const cells: ArrayCellLayout[] = [];
  const pointerMap: { [idx: number]: string[] } = {};

  for (const ptr of pointers) {
    if (!pointerMap[ptr.index]) pointerMap[ptr.index] = [];
    pointerMap[ptr.index].push(ptr.name);
  }

  for (let i = 0; i < array.length; i++) {
    const cellX = startX + i * cellWidth;
    const isCacheLine = i % cacheLineSizeElements === 0;

    cells.push({
      index: i,
      value: array[i],
      x: cellX,
      y: startY,
      width: cellWidth,
      height: cellHeight,
      isCacheLineStart: isCacheLine,
      pointers: pointerMap[i] ?? [],
      highlighted: highlightedIndices.includes(i),
    });
  }

  const totalWidth = startX * 2 + array.length * cellWidth;
  const totalHeight = startY + cellHeight + 60;
  const cacheLinesCount = Math.ceil(array.length / cacheLineSizeElements);

  return {
    cells,
    width: totalWidth,
    height: totalHeight,
    cacheLinesCount,
  };
}

/**
 * Calculates convex hull polygon geometry (SVG points, path, area, and perimeter).
 */
export function generateConvexHullGeometry(vertices: readonly Point2D[]): ConvexHullPolygonResult {
  if (vertices.length === 0) {
    return { vertices: [], svgPoints: "", pathD: "", area: 0, perimeter: 0 };
  }

  const svgPoints = vertices.map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(" ");
  const pathD = `M ${vertices.map((v) => `${v.x.toFixed(1)} ${v.y.toFixed(1)}`).join(" L ")} Z`;

  // Shoelace formula for polygon area
  let area = 0;
  let perimeter = 0;
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;

    const dx = vertices[j].x - vertices[i].x;
    const dy = vertices[j].y - vertices[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }

  area = Math.abs(area) / 2;

  return {
    vertices,
    svgPoints,
    pathD,
    area,
    perimeter,
  };
}
