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

export const PYTHON_CONVEX_HULL_CODE = `def convex_hull(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    """
    Find the convex hull of a set of 2D points using Andrew's Monotone Chain algorithm.
    """
    n = len(points)
    if n <= 3:
        return points

    sorted_pts = sorted(points, key=lambda p: (p[0], p[1]))

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower = []
    for p in sorted_pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)

    upper = []
    for p in reversed(sorted_pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)

    lower.pop()
    upper.pop()
    return lower + upper`;

export const CONVEX_HULL_CODE = PYTHON_CONVEX_HULL_CODE;

export const generateConvexHullSteps = (
  input: ConvexHullInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const rawPoints = input?.points || DEFAULT_CONVEX_HULL_INPUT.points;
  let stepIndex = 0;

  if (!rawPoints || rawPoints.length === 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: 'No points provided for Convex Hull calculation.',
        why: 'Convex Hull algorithm requires at least 1 point to compute a boundary.',
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

  // Step 1: Lexicographical sort step
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 9,
    explanation: {
      what: `Sorted ${points.length} points lexicographically by X coordinate, then Y coordinate.`,
      why: "Andrew's Monotone Chain algorithm requires points sorted left-to-right to scan lower and upper boundaries independently.",
    },
    primarySnapshot: createGraphSnapshot(),
    auxiliaryState: {
      stack: [],
      visited: sorted.map((p) => p.id),
      customState: { phase: 'Start', sortedPoints: sorted.map((p) => p.id).join(', ') },
    },
    variables: { totalPoints: points.length },
  });

  // Step 2: Build lower hull
  const lower: Required<Point2D>[] = [];
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      const popped = lower.pop()!;
      const prevO = lower[lower.length - 1];
      const crossVal = cross(prevO, popped, p);
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 17,
        explanation: {
          what: `Popped point ${popped.id} from lower hull stack.`,
          why: `Point ${p.id} creates a non-left turn (cross product = ${crossVal} <= 0) with ${prevO.id} and ${popped.id}.`,
        },
        primarySnapshot: createGraphSnapshot(p.id, [...lower, p]),
        auxiliaryState: {
          stack: lower.map((lp) => lp.id),
          customState: { phase: 'Lower Hull', action: 'Pop', poppedPoint: popped.id, crossProduct: crossVal },
        },
        variables: { currentPoint: p.id, lowerHullSize: lower.length },
      });
    }
    lower.push(p);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Pushed point ${p.id} onto lower hull stack.`,
        why: 'Point forms a valid left turn for the lower perimeter of the convex hull.',
      },
      primarySnapshot: createGraphSnapshot(p.id, lower),
      auxiliaryState: {
        stack: lower.map((lp) => lp.id),
        customState: { phase: 'Lower Hull', action: 'Push', currentPoint: p.id },
      },
      variables: { currentPoint: p.id, lowerHullSize: lower.length },
    });
  }

  // Step 3: Build upper hull
  const upper: Required<Point2D>[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      const popped = upper.pop()!;
      const prevO = upper[upper.length - 1];
      const crossVal = cross(prevO, popped, p);
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 23,
        explanation: {
          what: `Popped point ${popped.id} from upper hull stack.`,
          why: `Point ${p.id} creates a non-left turn (cross product = ${crossVal} <= 0) during right-to-left scan.`,
        },
        primarySnapshot: createGraphSnapshot(p.id, [...upper, p]),
        auxiliaryState: {
          stack: upper.map((up) => up.id),
          customState: { phase: 'Upper Hull', action: 'Pop', poppedPoint: popped.id, crossProduct: crossVal },
        },
        variables: { currentPoint: p.id, upperHullSize: upper.length },
      });
    }
    upper.push(p);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 24,
      explanation: {
        what: `Pushed point ${p.id} onto upper hull stack.`,
        why: 'Point forms a valid left turn for the upper perimeter of the convex hull.',
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

  // Final Step: Complete Hull
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 28,
    explanation: {
      what: `Convex Hull construction complete. Total hull vertices: ${fullHull.length}.`,
      why: 'Combined lower and upper hull stacks to form the minimal enclosing convex polygon.',
    },
    primarySnapshot: createGraphSnapshot(undefined, fullHull, true),
    auxiliaryState: {
      stack: fullHull.map((hp) => hp.id),
      customState: { phase: 'Complete', hullVerticesCount: fullHull.length },
    },
    variables: { hullVerticesCount: fullHull.length, totalPoints: points.length },
  });

  return steps;
};

export const convexHull: AlgorithmDefinition<ConvexHullInput> = {
  id: 'convex-hull',
  title: 'Convex Hull (Monotone Chain)',
  category: 'geometry_and_sweep_line',
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
  code: PYTHON_CONVEX_HULL_CODE,
  timeComplexity: {
    best: 'O(N log N)',
    average: 'O(N log N)',
    worst: 'O(N log N)',
  },
  spaceComplexity: 'O(N)',
  defaultInput: DEFAULT_CONVEX_HULL_INPUT,
  generateSteps: generateConvexHullSteps,
};
