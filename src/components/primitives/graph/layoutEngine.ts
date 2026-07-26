import { GraphNodeItem, GraphEdgeItem } from "../../../types/dsa";
import {
  componentTintingAddsInformation,
  deriveConnectedComponents,
  vizSlotColor,
} from "../vizPalette";
import { Point, Size, clamp, ellipsePoints, minPointSpacing, spreadToBox } from "../vizGeometry";
import {
  PositionedNode,
  LegendEntry,
  MIN_NODE_R,
  MAX_NODE_R,
  SPACING_SHARE,
  GROUP_RING_GAP,
  EDGE_MARGIN,
} from "./graphTypes";

export interface GraphMetrics {
  nodeRadius: number;
  positioned: PositionedNode[];
  nodeMap: Map<string, PositionedNode>;
  groupOf: (id: string) => number | undefined;
  edgeGroupOf: (edge: GraphEdgeItem) => number | undefined;
  labelFont: number;
  weightFont: number;
  weightW: number;
  weightH: number;
  plainStroke: number;
  traversedStroke: number;
  pathStroke: number;
  dash: number;
  nodeStroke: number;
  arrowW: number;
  arrowH: number;
  arrowRefX: number;
  legend: LegendEntry[];
}

export const computeGraphLayout = (
  nodes: GraphNodeItem[],
  edges: GraphEdgeItem[],
  box: Size,
): GraphMetrics => {
  const needsAutoLayout = nodes.some((node) => node.x === undefined || node.y === undefined);
  const authored: Point[] = nodes.map((node) => ({
    x: node.x ?? Number.NaN,
    y: node.y ?? Number.NaN,
  }));

  const place = (radius: number): Point[] => {
    const pad = radius + GROUP_RING_GAP + EDGE_MARGIN;
    return spreadToBox(
      needsAutoLayout ? ellipsePoints(nodes.length, box, pad) : authored,
      box,
      pad,
    );
  };

  let radius = MAX_NODE_R;
  for (let pass = 0; pass < 4; pass += 1) {
    const spacing = minPointSpacing(place(radius), Math.min(box.width, box.height));
    const supported = clamp(spacing * SPACING_SHARE, MIN_NODE_R, MAX_NODE_R);
    if (supported >= radius) break;
    radius = supported;
  }
  const nodeRadius = radius;
  const positions = place(nodeRadius);

  const nodeMap = new Map<string, PositionedNode>();
  nodes.forEach((node, index) => {
    const point = positions[index] ?? { x: box.width / 2, y: box.height / 2 };
    nodeMap.set(node.id, { ...node, x: point.x, y: point.y });
  });

  const positioned = Array.from(nodeMap.values());

  const hasExplicitGroups = positioned.some((node) => node.group !== undefined);
  const derived = hasExplicitGroups
    ? null
    : deriveConnectedComponents(
        positioned.map((n) => n.id),
        edges,
      );
  const useDerivedGroups = derived !== null && componentTintingAddsInformation(derived);

  const groupOf = (id: string): number | undefined => {
    if (hasExplicitGroups) return nodeMap.get(id)?.group;
    if (useDerivedGroups && derived) return derived.componentOf.get(id);
    return undefined;
  };

  const edgeGroupOf = (edge: GraphEdgeItem): number | undefined => {
    if (edge.group !== undefined) return edge.group;
    const from = groupOf(edge.from);
    const to = groupOf(edge.to);
    return from !== undefined && from === to ? from : undefined;
  };

  const longestLabel = nodes.reduce(
    (longest, node) => Math.max(longest, String(node.label || node.id).length),
    1,
  );
  const longestWeight = edges.reduce(
    (longest, edge) =>
      Math.max(longest, edge.weight === undefined ? 0 : String(edge.weight).length),
    1,
  );
  const labelFont = clamp(Math.min(nodeRadius * 0.55, (nodeRadius * 2.83) / longestLabel), 9, 40);
  const weightFont = clamp(nodeRadius * 0.4, 9, 18);
  const weightW = weightFont * (0.62 * longestWeight + 1.1);
  const weightH = weightFont * 1.7;
  const plainStroke = clamp(nodeRadius * 0.06, 1.6, 3);
  const traversedStroke = clamp(nodeRadius * 0.09, 2.5, 4.5);
  const pathStroke = clamp(nodeRadius * 0.13, 4, 7);
  const dash = clamp(nodeRadius * 0.18, 5, 10);
  const nodeStroke = clamp(nodeRadius * 0.07, 2, 3.6);

  const arrowW = clamp(nodeRadius * 0.34, 9, 18);
  const arrowH = arrowW * 0.72;
  const arrowRefX = arrowW;

  const groupSlots = Array.from(
    new Set(
      positioned
        .map((node) => groupOf(node.id))
        .filter((slot): slot is number => slot !== undefined),
    ),
  ).sort((a, b) => a - b);

  const hasTraversed = edges.some((edge) => edge.isTraversed && !edge.isPath);
  const hasPath = edges.some((edge) => edge.isPath);
  const hasPlainEdges = edges.some((edge) => !edge.isTraversed && !edge.isPath);

  const legend: LegendEntry[] = [
    ...groupSlots.map((slot) => ({
      key: `group-${slot}`,
      label: useDerivedGroups ? `Component ${slot + 1}` : `Group ${slot + 1}`,
      color: vizSlotColor(slot),
      kind: "group" as const,
    })),
  ];
  if ((hasTraversed || hasPath) && hasPlainEdges) {
    legend.push({
      key: "edge-plain",
      label: "Unexplored",
      color: "var(--border-default)",
      kind: "edge",
    });
  }
  if (hasTraversed) {
    legend.push({
      key: "edge-traversed",
      label: "Traversed",
      color: "var(--state-active)",
      kind: "edge",
    });
  }
  if (hasPath) {
    legend.push({
      key: "edge-path",
      label: "Final path",
      color: "var(--state-path)",
      kind: "edge",
    });
  }

  return {
    nodeRadius,
    positioned,
    nodeMap,
    groupOf,
    edgeGroupOf,
    labelFont,
    weightFont,
    weightW,
    weightH,
    plainStroke,
    traversedStroke,
    pathStroke,
    dash,
    nodeStroke,
    arrowW,
    arrowH,
    arrowRefX,
    legend,
  };
};
