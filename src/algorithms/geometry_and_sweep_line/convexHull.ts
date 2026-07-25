import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
  TopicGuide,
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
        what: 'Check the input points',
        why: 'There are no points to wrap, so we stop — a hull needs at least one point to exist.',
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
      what: `Sort ${points.length} points left to right`,
      why: 'We order the points by x (then y) so we can sweep across the plane once for the lower boundary and once back for the upper — each half of the hull then builds up with a simple stack.',
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
          what: `Pop ${popped.id} from the lower hull`,
          why: `Walking from ${prevO.id} through ${popped.id} to ${p.id} turns clockwise or goes straight (cross product ${crossVal} <= 0), which would dent the boundary inward — so ${popped.id} can't be a corner of the hull.`,
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
        what: `Push ${p.id} onto the lower hull`,
        why: `From here the boundary keeps turning left, so ${p.id} stands as a valid corner of the lower chain — at least until a later point proves otherwise.`,
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
          what: `Pop ${popped.id} from the upper hull`,
          why: `Scanning right to left now, ${p.id} makes a non-left turn through ${popped.id} (cross product ${crossVal} <= 0), so ${popped.id} sits inside the upper boundary and gets discarded.`,
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
        what: `Push ${p.id} onto the upper hull`,
        why: `The turn stays counter-clockwise, so ${p.id} holds a spot on the upper chain for now.`,
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
      what: `Close the hull with ${fullHull.length} vertices`,
      why: 'We drop each chain\'s duplicated endpoint and stitch the lower and upper chains together into the smallest convex polygon enclosing every point. The initial sort dominated the work, at O(N log N).',
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

const CONVEX_HULL_TOPIC_GUIDE: TopicGuide = {
  overview:
    'The convex hull of a set of points is the smallest convex polygon containing all of them, the shape you would get by stretching a rubber band around a scatter of nails and letting it snap tight. Andrew\'s monotone chain finds it by sorting the points once by x coordinate and then sweeping across them twice, holding a stack of candidate corners and discarding any point that would bend the boundary inward. It is the standard opening move for a wide range of geometric work, because the hull captures the extremal shape of a point set and throws away everything hidden inside it.',
  sections: [
    {
      heading: 'Turning geometry into a stack problem',
      body: 'Convexity has a purely local characterization: a polygon traversed in one consistent direction is convex exactly when every consecutive triple of vertices turns the same way. That means you never have to reason about the whole shape at once, only about the last two points you kept and the new one in front of you. Sorting by x makes that local check trustworthy, because processing points in a fixed direction guarantees a kept point can only be invalidated by points still ahead, never by ones already behind. So the algorithm collapses into a simple loop: walk the sorted points, and while the last two survivors plus the new point fail the turn test, throw the middle one away.',
    },
    {
      heading: 'The cross product is the turn test',
      body: 'For three points o, a and b, the expression (a.x - o.x)(b.y - o.y) - (a.y - o.y)(b.x - o.x) is the signed area of the parallelogram they span. Its sign is all you need: one sign means the path from o through a to b turns one way, the other sign means it turns the other, and zero means the three points are collinear. There are no angles, no square roots and no trigonometry anywhere, and on integer coordinates the value is computed exactly. That exactness is why the implementation contains no floating-point comparisons at all, and why it stays robust where an angle-sorting approach would wobble on near-degenerate input.',
    },
    {
      heading: 'Two chains make a hull',
      body: 'A single left-to-right sweep cannot produce the whole boundary, because the boundary doubles back on itself: the hull consists of a lower chain running from the leftmost point to the rightmost and an upper chain returning along the top. So you sweep the sorted points forward to build the lower chain, then sweep them in reverse with identical logic to build the upper chain. Both chains start and end at the same two extreme points, so each drops its final point before the two are concatenated, otherwise the leftmost and rightmost vertices would appear twice. The concatenation already comes out in boundary order, which is why the result can be handed straight to an area, perimeter or rendering routine.',
    },
    {
      heading: 'Why it is correct and why it is fast',
      body: 'The stack invariant is that the points currently held always form a chain whose every consecutive triple turns the correct way, that is, a convex chain. Appending a new point can only violate the invariant at the top of the stack, and popping repairs it, so the invariant survives every single iteration. A discarded point is genuinely not a hull vertex, because it lies on or inside the triangle formed by its two neighbours and the new point, and a point inside such a triangle can never be a corner of the enclosing polygon. The cost argument is amortized rather than per-step: each point is pushed exactly once and popped at most once ever, so both sweeps are linear and the initial sort is the only expensive part.',
    },
    {
      heading: 'Degenerate inputs to think about',
      body: 'With fewer than three points there is no polygon to build, and implementations usually just return the input unchanged. Duplicate points and runs of collinear points are where implementations quietly disagree: a strict comparison keeps collinear points sitting on hull edges, while treating a zero cross product as a failure removes them and returns only true corners. Decide deliberately which behaviour you want, because downstream code often cares; an area computation is indifferent, but a vertex count or a rotating-calipers pass may not be. Watch out for screen coordinates too, where y grows downward and therefore inverts the meaning of a left turn, so the algorithm still works but the labels lower and upper trade places.',
    },
    {
      heading: 'What the hull unlocks',
      body: 'Convex hulls are rarely the final answer; they are the reduction step that makes the real question easy. The diameter of a point set, its minimum-width strip, and the smallest enclosing rectangle all have their answers on the hull, and rotating calipers extracts them in linear time once the hull exists. Hulls also decide whether two point sets can be separated by a straight line, drive collision detection between shapes, and give the geometric picture of a linear program feasible region. The very same orientation primitive that powers this sweep also underlies segment-intersection tests, polygon area and point-in-polygon queries, so the effort you spend understanding it here pays off across the whole geometry toolkit.',
    },
  ],
  keyTerms: [
    {
      term: 'Convex',
      definition:
        'A shape is convex when the straight segment between any two of its points stays entirely inside it. Equivalently, walking its boundary you always turn in the same direction.',
    },
    {
      term: 'Cross product (orientation test)',
      definition:
        'A single arithmetic expression whose sign tells you whether three points turn left, turn right, or lie on one line. It is the only geometric primitive this algorithm needs.',
    },
    {
      term: 'Lower and upper chain',
      definition:
        'The two halves of the hull boundary, split at the leftmost and rightmost points. Monotone chain builds them with the same code run forwards and then backwards.',
    },
    {
      term: 'Collinear degeneracy',
      definition:
        'Three or more points lying on a single line, which makes the cross product exactly zero. Whether those points stay on the hull is a deliberate choice encoded in the comparison operator.',
    },
    {
      term: 'Amortized cost',
      definition:
        'Reasoning about total work across a whole run rather than the worst single step. Here a point can be popped only once ever, so the inner loop is cheap overall even when one iteration pops many points.',
    },
  ],
};

export const convexHull: AlgorithmDefinition<ConvexHullInput> = {
  id: 'convex-hull',
  title: 'Convex Hull (Monotone Chain)',
  category: 'geometry_and_sweep_line',
  difficulty: 'Hard',
  description:
    'Finds the smallest convex polygon enclosing a set of 2D points using Andrew\'s Monotone Chain algorithm. After sorting the points by x (then y), it sweeps once left-to-right to build the lower boundary and once right-to-left for the upper, using cross-product turn tests to discard any point that would bend the boundary inward.',
  constraints: [
    '1 <= points.length <= 1000',
    '-1000 <= x, y <= 1000',
  ],
  examples: [
    {
      input: 'points = [{x:0, y:0}, {x:0, y:4}, {x:4, y:0}, {x:2, y:2}]',
      output: '3 vertices: [(0,0), (4,0), (0,4)]',
      explanation: 'Point (2, 2) is strictly inside the triangle formed by (0,0), (4,0), (0,4) and is eliminated.',
    },
  ],
  code: PYTHON_CONVEX_HULL_CODE,
  timeComplexity: {
    best: 'O(N log N)',
    average: 'O(N log N)',
    worst: 'O(N log N)',
  },
  spaceComplexity: 'O(N)',
  complexityAnalysis: {
    time: 'The dominant cost is sorting the points by x (then y), which takes O(N log N) comparisons. The two hull-building sweeps afterward are linear: each point is pushed onto a stack exactly once and can be popped at most once, so both passes together cost O(N). That leaves the sort as the bottleneck, making the whole algorithm O(N log N) in every case.',
    space: 'The sorted copy of the points and the two hull stacks each hold at most all N points, so extra memory grows linearly — O(N).',
  },
  topicGuide: CONVEX_HULL_TOPIC_GUIDE,
  defaultInput: DEFAULT_CONVEX_HULL_INPUT,
  generateSteps: generateConvexHullSteps,
};
