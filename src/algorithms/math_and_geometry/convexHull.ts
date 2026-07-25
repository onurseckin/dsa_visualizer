import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
} from '../../types/dsa';

export interface Point2D {
  x: number;
  y: number;
  id?: string;
  label?: string;
}

export interface ConvexHullInput {
  points: Point2D[];
}

export const DEFAULT_CONVEX_HULL_INPUT: ConvexHullInput = {
  points: [
    { x: 100, y: 300, id: 'P0', label: 'P0' },
    { x: 150, y: 150, id: 'P1', label: 'P1' },
    { x: 250, y: 100, id: 'P2', label: 'P2' },
    { x: 300, y: 250, id: 'P3', label: 'P3' },
    { x: 400, y: 350, id: 'P4', label: 'P4' },
    { x: 200, y: 400, id: 'P5', label: 'P5' },
    { x: 350, y: 180, id: 'P6', label: 'P6' },
  ],
};

export const CONVEX_HULL_CODE = `function convexHull(points: Point2D[]): Point2D[] {
  if (points.length <= 3) return points;
  const sorted = [...points].sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y));
  const cross = (o: Point2D, a: Point2D, b: Point2D) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: Point2D[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Point2D[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}`;

export const generateConvexHullSteps = (
  input: ConvexHullInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const rawPoints = input?.points || DEFAULT_CONVEX_HULL_INPUT.points;
  let stepIndex = 0;

  if (!rawPoints || rawPoints.length === 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 2,
      explanation: {
        what: 'No points provided for Convex Hull.',
        why: 'Convex Hull requires points.',
      },
      primarySnapshot: { kind: 'graph', nodes: [], edges: [] },
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

  const sorted = [...points].sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y));

  const cross = (o: Point2D, a: Point2D, b: Point2D): number =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const createGraphSnapshot = (
    activePointId?: string,
    hullPoints: Required<Point2D>[] = [],
    isFinal = false
  ): GraphVisualSnapshot => {
    const hullSet = new Set(hullPoints.map((p) => p.id));
    const nodes: GraphNodeItem[] = points.map((p) => {
      let state: ElementState = 'default';
      if (p.id === activePointId) state = 'active';
      else if (hullSet.has(p.id)) state = isFinal ? 'sorted' : 'in-stack';
      return {
        id: p.id,
        label: p.label,
        x: p.x,
        y: p.y,
        state,
      };
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

    return { kind: 'graph', nodes, edges };
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Sorted ${points.length} points lexicographically by X, then Y coordinate.`,
      why: "Monotone Chain (Andrew's algorithm) scans points left-to-right to construct lower and upper hulls.",
    },
    primarySnapshot: createGraphSnapshot(),
    auxiliaryState: {
      stack: [],
      visited: sorted.map((p) => p.id),
      customState: { phase: 'Start' },
    },
    variables: { totalPoints: points.length },
  });

  const lower: Required<Point2D>[] = [];
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      const popped = lower.pop()!;
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 10,
        explanation: {
          what: `Popped point ${popped.id} from lower hull stack.`,
          why: `Point ${p.id} creates a clockwise or flat turn relative to previous points.`,
        },
        primarySnapshot: createGraphSnapshot(p.id, [...lower, p]),
        auxiliaryState: {
          stack: lower.map((lp) => lp.id),
          customState: { phase: 'Lower Hull', action: 'Pop', poppedPoint: popped.id },
        },
        variables: { currentPoint: p.id, lowerHullSize: lower.length },
      });
    }
    lower.push(p);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `Pushed point ${p.id} onto lower hull stack.`,
        why: 'Point forms a valid left turn for the lower perimeter.',
      },
      primarySnapshot: createGraphSnapshot(p.id, lower),
      auxiliaryState: {
        stack: lower.map((lp) => lp.id),
        customState: { phase: 'Lower Hull', action: 'Push', currentPoint: p.id },
      },
      variables: { currentPoint: p.id, lowerHullSize: lower.length },
    });
  }

  const upper: Required<Point2D>[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      const popped = upper.pop()!;
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 19,
        explanation: {
          what: `Popped point ${popped.id} from upper hull stack.`,
          why: `Point ${p.id} creates a non-left turn during right-to-left scan.`,
        },
        primarySnapshot: createGraphSnapshot(p.id, [...upper, p]),
        auxiliaryState: {
          stack: upper.map((up) => up.id),
          customState: { phase: 'Upper Hull', action: 'Pop', poppedPoint: popped.id },
        },
        variables: { currentPoint: p.id, upperHullSize: upper.length },
      });
    }
    upper.push(p);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 21,
      explanation: {
        what: `Pushed point ${p.id} onto upper hull stack.`,
        why: 'Point forms a valid left turn for the upper perimeter.',
      },
      primarySnapshot: createGraphSnapshot(p.id, upper),
      auxiliaryState: {
        stack: upper.map((up) => up.id),
        customState: { phase: 'Upper Hull', action: 'Push', currentPoint: p.id },
      },
      variables: { currentPoint: p.id, upperHullSize: upper.length },
    });
  }

  lower.pop();
  upper.pop();
  const fullHull = [...lower, ...upper];

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 26,
    explanation: {
      what: `Convex Hull construction complete. Total hull vertices: ${fullHull.length}.`,
      why: 'Combined lower and upper hulls into closed convex polygon perimeter.',
    },
    primarySnapshot: createGraphSnapshot(undefined, fullHull, true),
    auxiliaryState: {
      stack: fullHull.map((hp) => hp.id),
      customState: { phase: 'Complete', hullVerticesCount: fullHull.length },
    },
    variables: { hullVerticesCount: fullHull.length },
  });

  return steps;
};

export const convexHull: AlgorithmDefinition<ConvexHullInput> = {
  id: 'convex-hull',
  title: 'Convex Hull (Monotone Chain)',
  category: 'advanced',
  difficulty: 'Hard',
  description:
    'Finds the smallest convex polygon containing a set of 2D points using Monotone Chain (Andrew algorithm).',
  constraints: ['1 <= points.length <= 100', '0 <= x, y <= 1000'],
  examples: [
    {
      input: 'points = [{x:0, y:0}, {x:0, y:4}, {x:4, y:0}, {x:2, y:2}]',
      output: '3 vertices (triangle perimeter)',
    },
  ],
  code: CONVEX_HULL_CODE,
  timeComplexity: {
    best: 'O(N log N)',
    average: 'O(N log N)',
    worst: 'O(N log N)',
  },
  spaceComplexity: 'O(N)',
  defaultInput: DEFAULT_CONVEX_HULL_INPUT,
  generateSteps: generateConvexHullSteps,
};
