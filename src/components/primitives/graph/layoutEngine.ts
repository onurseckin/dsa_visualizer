import type { GraphNodeItem, GraphEdgeItem } from "../../../types/dsa";
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
  /** Badge centres keyed by the edge's authored array position. */
  weightPositions: Map<number, Point>;
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
  layout: "authored" | "weighted" | undefined = "authored",
): GraphMetrics => {
  const needsAutoLayout =
    layout === "weighted" || nodes.some((node) => node.x === undefined || node.y === undefined);
  const authored: Point[] = nodes.map((node) => ({
    x: node.x ?? Number.NaN,
    y: node.y ?? Number.NaN,
  }));

  const placeWeighted = (radius: number): Point[] => {
    const pad = radius + GROUP_RING_GAP + EDGE_MARGIN;
    const weightedDegree = new Map(nodes.map((node) => [node.id, 0]));
    const incidentWeight = new Map(nodes.map((node) => [node.id, 0]));

    edges.forEach((edge) => {
      const weight = Math.abs(edge.weight ?? 1);
      for (const id of [edge.from, edge.to]) {
        weightedDegree.set(id, (weightedDegree.get(id) ?? 0) + 1);
        incidentWeight.set(id, (incidentWeight.get(id) ?? 0) + weight);
      }
    });

    const maximumIncidentWeight = Math.max(...incidentWeight.values(), 1);
    const hash = (value: string): number => {
      let result = 2166136261;
      for (const char of value) {
        result ^= char.charCodeAt(0);
        result = Math.imul(result, 16777619);
      }
      return result >>> 0;
    };
    const ordered = nodes
      .map((node, index) => ({ node, index, hash: hash(node.id) }))
      .sort((left, right) => left.hash - right.hash || left.index - right.index);
    const points = new Map<string, Point>();
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    ordered.forEach(({ node }, order) => {
      const signal = (incidentWeight.get(node.id) ?? 0) / maximumIncidentWeight;
      const degree = weightedDegree.get(node.id) ?? 0;
      const jitter = ((hash(node.id) % 17) - 8) * 0.012;
      // Weight and degree gently vary the radius. They break artificial symmetry
      // without pretending that an edge's drawn length is its exact weight.
      const radial = 0.58 + signal * 0.17 + Math.min(degree, 4) * 0.025 + jitter;
      const angle = -Math.PI / 2 + order * goldenAngle + ((hash(node.id) % 29) - 14) * 0.012;
      points.set(node.id, {
        x: Math.cos(angle) * radial,
        y: Math.sin(angle) * radial,
      });
    });

    return spreadToBox(
      nodes.map((node) => points.get(node.id) ?? { x: 0, y: 0 }),
      box,
      pad,
    );
  };

  const place = (radius: number): Point[] => {
    const pad = radius + GROUP_RING_GAP + EDGE_MARGIN;
    if (needsAutoLayout) {
      if (layout === "weighted") return placeWeighted(radius);
      return spreadToBox(ellipsePoints(nodes.length, box, pad), box, pad);
    }
    const validPts = authored.filter((pt) => !Number.isNaN(pt.x) && !Number.isNaN(pt.y));
    if (validPts.length === 0) {
      return authored.map(() => ({ x: box.width / 2, y: box.height / 2 }));
    }
    const minX = Math.min(...validPts.map((pt) => pt.x));
    const maxX = Math.max(...validPts.map((pt) => pt.x));
    const minY = Math.min(...validPts.map((pt) => pt.y));
    const maxY = Math.max(...validPts.map((pt) => pt.y));

    const spanX = Math.max(maxX - minX, 1);
    const spanY = Math.max(maxY - minY, 1);

    const availW = Math.max(box.width - pad * 2, 100);
    const availH = Math.max(box.height - pad * 2, 100);

    const scaleX = availW / spanX;
    const scaleY = availH / spanY;
    const scale = spanX === 0 || spanY === 0 ? 1 : Math.min(scaleX, scaleY);

    const scaledW = spanX * scale;
    const scaledH = spanY * scale;

    const offsetX = pad + (availW - scaledW) / 2;
    const offsetY = pad + (availH - scaledH) / 2;

    return authored.map((pt) => {
      if (Number.isNaN(pt.x) || Number.isNaN(pt.y)) {
        return { x: box.width / 2, y: box.height / 2 };
      }
      return {
        x: offsetX + (pt.x - minX) * scale,
        y: offsetY + (pt.y - minY) * scale,
      };
    });
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

  const rectsOverlap = (left: { x: number; y: number }, right: { x: number; y: number }): boolean =>
    Math.abs(left.x - right.x) < weightW && Math.abs(left.y - right.y) < weightH;
  const distanceToSegment = (point: Point, start: Point, end: Point): number => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
    const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
    return Math.hypot(point.x - (start.x + dx * t), point.y - (start.y + dy * t));
  };
  const weightPositions = new Map<number, Point>();
  const placedWeightBadges: Point[] = [];

  edges.forEach((edge, edgeIndex) => {
    if (edge.weight === undefined) return;
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (!from || !to) return;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    const normal = distance > 0 ? { x: -dy / distance, y: dx / distance } : { x: 0, y: -1 };
    const midpoint = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    const separation = Math.max(weightH * 0.8, nodeRadius * 0.58, 14);
    const offsets = [0, 1, -1, 2, -2, 3, -3];
    let best = midpoint;
    let bestScore = Number.POSITIVE_INFINITY;

    offsets.forEach((offset, candidateIndex) => {
      const candidate = {
        x: clamp(
          midpoint.x + normal.x * separation * offset,
          weightW / 2 + 2,
          box.width - weightW / 2 - 2,
        ),
        y: clamp(
          midpoint.y + normal.y * separation * offset,
          weightH / 2 + 2,
          box.height - weightH / 2 - 2,
        ),
      };
      const nodeCollision = positioned.some(
        (node) =>
          Math.hypot(candidate.x - node.x, candidate.y - node.y) < nodeRadius + weightH / 2 + 4,
      );
      const badgeCollision = placedWeightBadges.some((badge) => rectsOverlap(candidate, badge));
      const crossesOtherEdge = edges.some((other, otherIndex) => {
        if (otherIndex === edgeIndex) return false;
        const otherFrom = nodeMap.get(other.from);
        const otherTo = nodeMap.get(other.to);
        return (
          otherFrom !== undefined &&
          otherTo !== undefined &&
          distanceToSegment(candidate, otherFrom, otherTo) < weightH / 2 + 2
        );
      });
      const score =
        (nodeCollision ? 1_000_000 : 0) +
        (badgeCollision ? 100_000 : 0) +
        (crossesOtherEdge ? 10_000 : 0) +
        Math.abs(offset) * 100 +
        candidateIndex;
      if (score < bestScore) {
        best = candidate;
        bestScore = score;
      }
    });

    weightPositions.set(edgeIndex, best);
    placedWeightBadges.push(best);
  });
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

  const hasSemanticEdgeStates = edges.some((edge) => edge.state !== undefined);
  const semanticEdgeStates = new Set(
    edges.flatMap((edge) => (edge.state === undefined ? [] : [edge.state])),
  );
  const legacyEdges = edges.filter((edge) => edge.state === undefined);
  const hasLegacyTraversed = legacyEdges.some((edge) => edge.isTraversed && !edge.isPath);
  const hasLegacyPath = legacyEdges.some((edge) => edge.isPath);
  const hasLegacyPlainEdges = legacyEdges.some((edge) => !edge.isTraversed && !edge.isPath);

  const legend: LegendEntry[] = [
    ...groupSlots.map((slot) => ({
      key: `group-${slot}`,
      label: useDerivedGroups ? `Component ${slot + 1}` : `Group ${slot + 1}`,
      color: vizSlotColor(slot),
      kind: "group" as const,
    })),
  ];
  if (hasSemanticEdgeStates) {
    const semanticLegendEntries: Record<
      NonNullable<GraphEdgeItem["state"]>,
      Omit<LegendEntry, "kind">
    > = {
      default: {
        key: "edge-default",
        label: "Unexplored",
        color: "var(--border-default)",
      },
      candidate: {
        key: "edge-candidate",
        label: "Candidate",
        color: "var(--state-compare)",
      },
      selected: {
        key: "edge-selected",
        label: "Selected",
        color: "var(--state-path)",
      },
      rejected: {
        key: "edge-rejected",
        label: "Rejected",
        color: "var(--danger)",
      },
    };

    for (const state of ["default", "candidate", "selected", "rejected"] as const) {
      if (semanticEdgeStates.has(state)) {
        legend.push({ ...semanticLegendEntries[state], kind: "edge" });
      }
    }

    if (
      !semanticEdgeStates.has("default") &&
      (hasLegacyTraversed || hasLegacyPath) &&
      hasLegacyPlainEdges
    ) {
      legend.push({
        key: "edge-plain",
        label: "Unexplored",
        color: "var(--border-default)",
        kind: "edge",
      });
    }
    if (hasLegacyTraversed) {
      legend.push({
        key: "edge-traversed",
        label: "Traversed",
        color: "var(--state-active)",
        kind: "edge",
      });
    }
    if (hasLegacyPath) {
      legend.push({
        key: "edge-path",
        label: "Final path",
        color: "var(--state-path)",
        kind: "edge",
      });
    }
  } else {
    if ((hasLegacyTraversed || hasLegacyPath) && hasLegacyPlainEdges) {
      legend.push({
        key: "edge-plain",
        label: "Unexplored",
        color: "var(--border-default)",
        kind: "edge",
      });
    }
    if (hasLegacyTraversed) {
      legend.push({
        key: "edge-traversed",
        label: "Traversed",
        color: "var(--state-active)",
        kind: "edge",
      });
    }
    if (hasLegacyPath) {
      legend.push({
        key: "edge-path",
        label: "Final path",
        color: "var(--state-path)",
        kind: "edge",
      });
    }
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
    weightPositions,
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
