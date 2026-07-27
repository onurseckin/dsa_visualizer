import type {
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
} from "../../../types/dsa";

export interface Point2D {
  x: number;
  y: number;
  id?: string;
  label?: string;
}

export interface ConvexHullInput {
  points: Point2D[];
}

const FALLBACK_POINTS: Required<Point2D>[] = [
  { x: 100, y: 300, id: "P0", label: "P0" },
  { x: 150, y: 150, id: "P1", label: "P1" },
  { x: 250, y: 100, id: "P2", label: "P2" },
  { x: 300, y: 250, id: "P3", label: "P3" },
  { x: 400, y: 350, id: "P4", label: "P4" },
  { x: 200, y: 400, id: "P5", label: "P5" },
  { x: 350, y: 180, id: "P6", label: "P6" },
];

export const generateConvexHullSteps = (input: ConvexHullInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const rawPoints = input?.points || FALLBACK_POINTS;
  let stepIndex = 0;

  if (!rawPoints || rawPoints.length === 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 3,
      explanation: {
        what: "Check the input points",
        why: "There are no points to wrap, so we stop — a hull needs at least one point to exist.",
      },
      primarySnapshot: { kind: "graph", nodes: [], edges: [] },
      auxiliaryState: { stack: [], visited: [] },
      variables: { totalPoints: 0, hullSize: 0 },
    });
    return steps;
  }

  const points: Required<Point2D>[] = rawPoints.map((p, idx) => ({
    x: p.x,
    y: p.y,
    id: p.id || `P${idx}`,
    label: p.label || `P${idx}`,
  }));

  const createGraphSnapshot = (
    activePointId?: string,
    hullPoints: Required<Point2D>[] = [],
    isFinal = false,
  ): GraphVisualSnapshot => {
    const hullSet = new Set(hullPoints.map((p) => p.id));
    const nodes: GraphNodeItem[] = points.map((p) => {
      let state: ElementState = "default";
      if (p.id === activePointId) state = "active";
      else if (hullSet.has(p.id)) state = isFinal ? "sorted" : "in-stack";
      return { id: p.id, label: p.label, x: p.x, y: p.y, state };
    });

    const edges: GraphEdgeItem[] = [];
    for (let i = 0; i < hullPoints.length - 1; i++) {
      edges.push({
        from: hullPoints[i].id,
        to: hullPoints[i + 1].id,
        isPath: true,
        isTraversed: true,
      });
    }

    if (isFinal && hullPoints.length > 2) {
      edges.push({
        from: hullPoints[hullPoints.length - 1].id,
        to: hullPoints[0].id,
        isPath: true,
        isTraversed: true,
      });
    }

    return { kind: "graph", nodes, edges };
  };

  if (points.length <= 3) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 3,
      explanation: {
        what: `Check if point count (${points.length}) <= 3`,
        why: "A set of 3 or fewer points is trivially convex; all points lie on the hull.",
      },
      primarySnapshot: createGraphSnapshot(undefined, points, true),
      auxiliaryState: {
        stack: points.map((p) => p.id),
        visited: points.map((p) => p.id),
        customState: { phase: "Base Case", count: points.length },
      },
      variables: { totalPoints: points.length, hullSize: points.length },
    });
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 4,
      explanation: {
        what: `Return all ${points.length} points as the hull`,
        why: "With 3 or fewer points, no interior points need to be eliminated.",
      },
      primarySnapshot: createGraphSnapshot(undefined, points, true),
      auxiliaryState: {
        stack: points.map((p) => p.id),
        visited: points.map((p) => p.id),
        customState: { phase: "Complete", count: points.length },
      },
      variables: { totalPoints: points.length, hullVerticesCount: points.length },
    });
    return steps;
  }

  const sorted = [...points].sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y));

  const cross = (o: Point2D, a: Point2D, b: Point2D): number =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Sort ${points.length} points left to right`,
      why: "We order the points by x (then y) so we can sweep across the plane once for the lower boundary and once back for the upper — each half of the hull then builds up with a simple stack.",
    },
    primarySnapshot: createGraphSnapshot(),
    auxiliaryState: {
      stack: [],
      visited: sorted.map((p) => p.id),
      customState: { phase: "Start", sortedPoints: sorted.map((p) => p.id).join(", ") },
    },
    variables: { totalPoints: points.length },
  });

  const lower: Required<Point2D>[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      const popped = lower.pop()!;
      const prevO = lower[lower.length - 1];
      const crossVal = cross(prevO, popped, p);
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 14,
        explanation: {
          what: `Pop ${popped.id} from the lower hull`,
          why: `Walking from ${prevO.id} through ${popped.id} to ${p.id} turns clockwise or goes straight (cross product ${crossVal} <= 0), which would dent the boundary inward — so ${popped.id} can't be a corner of the hull.`,
        },
        primarySnapshot: createGraphSnapshot(p.id, [...lower, p]),
        auxiliaryState: {
          stack: lower.map((lp) => lp.id),
          customState: {
            phase: "Lower Hull",
            action: "Pop",
            poppedPoint: popped.id,
            crossProduct: crossVal,
          },
        },
        variables: { currentPoint: p.id, lowerHullSize: lower.length },
      });
    }
    lower.push(p);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 15,
      explanation: {
        what: `Push ${p.id} onto the lower hull`,
        why: `From here the boundary keeps turning left, so ${p.id} stands as a valid corner of the lower chain — at least until a later point proves otherwise.`,
      },
      primarySnapshot: createGraphSnapshot(p.id, lower),
      auxiliaryState: {
        stack: lower.map((lp) => lp.id),
        customState: { phase: "Lower Hull", action: "Push", currentPoint: p.id },
      },
      variables: { currentPoint: p.id, lowerHullSize: lower.length },
    });
  }

  const upper: Required<Point2D>[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      const popped = upper.pop()!;
      const prevO = upper[upper.length - 1];
      const crossVal = cross(prevO, popped, p);
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 20,
        explanation: {
          what: `Pop ${popped.id} from the upper hull`,
          why: `Scanning right to left now, ${p.id} makes a non-left turn through ${popped.id} (cross product ${crossVal} <= 0), so ${popped.id} sits inside the upper boundary and gets discarded.`,
        },
        primarySnapshot: createGraphSnapshot(p.id, [...upper, p]),
        auxiliaryState: {
          stack: upper.map((up) => up.id),
          customState: {
            phase: "Upper Hull",
            action: "Pop",
            poppedPoint: popped.id,
            crossProduct: crossVal,
          },
        },
        variables: { currentPoint: p.id, upperHullSize: upper.length },
      });
    }
    upper.push(p);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 21,
      explanation: {
        what: `Push ${p.id} onto the upper hull`,
        why: `The turn stays counter-clockwise, so ${p.id} holds a spot on the upper chain for now.`,
      },
      primarySnapshot: createGraphSnapshot(p.id, upper),
      auxiliaryState: {
        stack: upper.map((up) => up.id),
        customState: { phase: "Upper Hull", action: "Push", currentPoint: p.id },
      },
      variables: { currentPoint: p.id, upperHullSize: upper.length },
    });
  }

  lower.pop();
  upper.pop();
  const fullHull = [...lower, ...upper];

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 25,
    explanation: {
      what: `Close the hull with ${fullHull.length} vertices`,
      why: "We drop each chain's duplicated endpoint and stitch the lower and upper chains together into the smallest convex polygon enclosing every point. The initial sort dominated the work, at O(N log N).",
    },
    primarySnapshot: createGraphSnapshot(undefined, fullHull, true),
    auxiliaryState: {
      stack: fullHull.map((hp) => hp.id),
      customState: { phase: "Complete", hullVerticesCount: fullHull.length },
    },
    variables: { hullVerticesCount: fullHull.length, totalPoints: points.length },
  });

  return steps;
};
