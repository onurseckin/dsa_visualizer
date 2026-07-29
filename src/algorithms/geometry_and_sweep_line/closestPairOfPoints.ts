import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";
import type { Point2D } from "./lineSegmentIntersection";

export interface ClosestPairOfPointsInput {
  points: Point2D[];
}

export const PYTHON_CLOSEST_PAIR_OF_POINTS_CODE = `
import math

def closest_pair_of_points(points: list[tuple[float, float]]) -> float:
    pts = sorted(points, key=lambda p: (p[0], p[1]))
    min_dist = float('inf')
    active_window = []

    for p in pts:
        while active_window and p[0] - active_window[0][0] >= min_dist:
            active_window.pop(0)

        for active_pt in active_window:
            if abs(p[1] - active_pt[1]) < min_dist:
                d = math.hypot(p[0] - active_pt[0], p[1] - active_pt[1])
                if d < min_dist:
                    min_dist = d

        active_window.append(p)

    return min_dist
`;

export const DEFAULT_CLOSEST_PAIR_OF_POINTS_INPUT: ClosestPairOfPointsInput = {
  points: [
    { x: 50, y: 150 },
    { x: 120, y: 280 },
    { x: 140, y: 290 },
    { x: 220, y: 80 },
    { x: 300, y: 200 },
    { x: 380, y: 170 },
  ],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Closest Pair of Points problem finds the pair of 2D points with the minimum Euclidean distance d.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p1", label: "P1", x: 50, y: 150, state: "default" },
        { id: "p2", label: "P2", x: 120, y: 280, state: "default" },
        { id: "p3", label: "P3", x: 140, y: 290, state: "default" },
      ],
      edges: [],
    },
  },
  {
    narrative:
      "Brute force evaluates all N × (N - 1) / 2 point pairs, running in quadratic O(N²) time.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p1", label: "P1", x: 50, y: 150, state: "compare" },
        { id: "p2", label: "P2", x: 120, y: 280, state: "compare" },
        { id: "p3", label: "P3", x: 140, y: 290, state: "compare" },
      ],
      edges: [
        { from: "p1", to: "p2", isTraversed: true },
        { from: "p2", to: "p3", isTraversed: true },
        { from: "p1", to: "p3", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Plane sweep strategy: sort all points by X-coordinate to process them in left-to-right order.",
    primarySnapshot: {
      kind: "array",
      name: "x_sorted_points",
      mode: "box",
      elements: [
        { id: "x1", value: 50, label: "P1 (x:50)", state: "sorted" },
        { id: "x2", value: 120, label: "P2 (x:120)", state: "sorted" },
        { id: "x3", value: 140, label: "P3 (x:140)", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Maintain a dynamic active window of points whose horizontal distance to the sweep line is strictly less than current minimum d.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p2", label: "P2 (Active)", x: 120, y: 280, state: "visited" },
        { id: "p3", label: "P3 (Current)", x: 140, y: 290, state: "active" },
      ],
      edges: [],
    },
  },
  {
    narrative:
      "Active window eviction: when sweep line reaches point P, evict any prior point Q with dx = (P.x - Q.x) ≥ d.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p1", label: "P1 (Evicted dx >= d)", x: 50, y: 150, state: "default" },
        { id: "p3", label: "P3", x: 140, y: 290, state: "active" },
      ],
      edges: [],
    },
  },
  {
    narrative:
      "Vertical filtering: among active window points, only test candidates whose vertical distance dy = |P.y - Q.y| < d.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p2", label: "P2 (dy < d)", x: 120, y: 280, state: "compare" },
        { id: "p3", label: "P3", x: 140, y: 290, state: "active" },
      ],
      edges: [{ from: "p2", to: "p3", isPath: true }],
    },
  },
  {
    narrative:
      "Geometric packing proof: a rectangle of size d × 2d can contain at most 6 points separated by at least d.",
    primarySnapshot: {
      kind: "array",
      name: "packing_bound",
      mode: "box",
      elements: [
        {
          id: "pb1",
          value: 6,
          label: "At most 6 candidate comparisons per point",
          state: "sorted",
        },
      ],
    },
  },
  {
    narrative:
      "Because each point tests at most 6 active candidates, the sweep pass executes in linear O(N) time.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p2", label: "P2", x: 120, y: 280, state: "sorted" },
        { id: "p3", label: "P3", x: 140, y: 290, state: "sorted" },
      ],
      edges: [{ from: "p2", to: "p3", isPath: true, weight: 22.36 }],
    },
  },
  {
    narrative:
      "The entire algorithm completes in O(N log N) total time dominated by initial sorting, requiring O(N) space.",
    primarySnapshot: {
      kind: "array",
      name: "complexity_summary",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "Time: O(N log N)", state: "sorted" },
        { id: "c2", value: 2, label: "Space: O(N)", state: "sorted" },
      ],
    },
  },
];

export function generateClosestPairOfPointsSteps(input: ClosestPairOfPointsInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIdx++, phase, narrative, primarySnapshot }));
  };

  const rawPoints =
    input && Array.isArray(input.points) && input.points.length >= 2
      ? input.points
      : DEFAULT_CLOSEST_PAIR_OF_POINTS_INPUT.points;

  const isDefaultInput =
    !input ||
    (Array.isArray(input.points) &&
      input.points.length === DEFAULT_CLOSEST_PAIR_OF_POINTS_INPUT.points.length &&
      input.points[0].x === DEFAULT_CLOSEST_PAIR_OF_POINTS_INPUT.points[0].x &&
      input.points[0].y === DEFAULT_CLOSEST_PAIR_OF_POINTS_INPUT.points[0].y);

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const points = rawPoints
    .map((p, idx) => ({
      id: `P${idx + 1}`,
      x: Math.round(p.x),
      y: Math.round(p.y),
    }))
    .sort((a, b) => a.x - b.x || a.y - b.y);

  let minDist = Infinity;
  let closestPair: [Point2D & { id: string }, Point2D & { id: string }] | null = null;

  const dist = (a: Point2D, b: Point2D): number => Math.hypot(a.x - b.x, a.y - b.y);

  const makeGraphSnapshot = (
    currentP?: Point2D & { id: string },
    activePts: Array<Point2D & { id: string }> = [],
    comparingP?: Point2D & { id: string },
  ): GraphVisualSnapshot => {
    const nodes: GraphNodeItem[] = points.map((pt) => {
      const isCurrent = currentP && currentP.id === pt.id;
      const isComparing = comparingP && comparingP.id === pt.id;
      const isActive = activePts.some((ap) => ap.id === pt.id);
      const isClosest = closestPair && (closestPair[0].id === pt.id || closestPair[1].id === pt.id);

      return {
        id: pt.id,
        label: `${pt.id}(${pt.x},${pt.y})`,
        x: pt.x,
        y: pt.y,
        state: isComparing
          ? "swap"
          : isCurrent
            ? "active"
            : isClosest
              ? "sorted"
              : isActive
                ? "visited"
                : "default",
      };
    });

    const edges: GraphEdgeItem[] = [];
    if (closestPair) {
      edges.push({
        from: closestPair[0].id,
        to: closestPair[1].id,
        weight: Math.round(minDist * 100) / 100,
        isPath: true,
      });
    }

    if (currentP && comparingP) {
      edges.push({
        from: currentP.id,
        to: comparingP.id,
        weight: Math.round(dist(currentP, comparingP) * 100) / 100,
        isTraversed: true,
      });
    }

    return { kind: "graph", nodes, edges };
  };

  addStep(
    `Initialize Closest Pair plane sweep for ${points.length} points sorted by X-coordinate: ${points.map((p) => p.id).join(", ")}.`,
    makeGraphSnapshot(),
  );

  const activeWindow: Array<Point2D & { id: string }> = [];

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];

    addStep(
      `Sweep line advances to point ${pt.id}(${pt.x},${pt.y}). Current min_dist = ${minDist === Infinity ? "∞" : minDist.toFixed(2)}.`,
      makeGraphSnapshot(pt, activeWindow),
    );

    while (activeWindow.length > 0 && pt.x - activeWindow[0].x >= minDist) {
      const evicted = activeWindow.shift()!;
      addStep(
        `Evict point ${evicted.id}(${evicted.x},${evicted.y}) from active window (dx = ${pt.x - evicted.x} ≥ d = ${minDist.toFixed(2)}).`,
        makeGraphSnapshot(pt, activeWindow),
      );
    }

    for (const activePt of activeWindow) {
      const dy = Math.abs(pt.y - activePt.y);

      if (dy < minDist) {
        const dVal = dist(pt, activePt);
        if (dVal < minDist) {
          minDist = dVal;
          closestPair = [pt, activePt];
          addStep(
            `New minimum distance found! min_dist updated to ${minDist.toFixed(2)} between ${pt.id} and ${activePt.id}.`,
            makeGraphSnapshot(pt, activeWindow, activePt),
          );
        }
      }
    }

    activeWindow.push(pt);
  }

  addStep(
    `Plane sweep complete! Minimum Euclidean distance = ${minDist.toFixed(2)}${closestPair ? ` between ${closestPair[0].id} and ${closestPair[1].id}` : ""}.`,
    makeGraphSnapshot(),
  );

  return steps;
}

export const CLOSEST_PAIR_OF_POINTS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The <strong>Closest Pair of Points algorithm</strong> finds the pair of 2D points with minimal Euclidean distance <code>d</code> in optimal <code>O(N log N)</code> time.</p>",
  sections: [
    {
      heading: "The Delta Strip Invariant",
      body: "<p>Maintaining current minimum distance d allows us to discard any point whose X-coordinate differs from the sweep line by more than d.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Euclidean Distance",
      definition: "Straight line distance between two 2D points.",
    },
  ],
};

export const CLOSEST_PAIR_OF_POINTS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines closest_pair_of_points function signature.",
    2: "Sorts points by X-coordinate.",
    3: "Initializes min_dist to infinity.",
  },
};

export const closestPairOfPoints: AlgorithmDefinition<ClosestPairOfPointsInput> = {
  id: "closest-pair-of-points",
  title: "Closest Pair of Points via Sweep Line",
  topicIds: ["geometry_and_sweep_line"],
  difficulty: "Hard",
  description:
    "<p>Given a set of 2D points, find the minimum Euclidean distance between any pair of points in O(N log N) time using a vertical sweep line.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "  <li><code>points</code>: An array of 2D point objects <code>{ x: number, y: number }</code> where <code>2 &le; N &le; 50</code>.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<p>Returns a floating-point number representing the minimum Euclidean distance between any pair of points.</p>",
  constraints: ["2 <= points.length <= 50", "0 <= x, y <= 500"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "6 Points with Close Pair",
      input: DEFAULT_CLOSEST_PAIR_OF_POINTS_INPUT,
      output: "Distance: 22.36",
      explanation:
        "Points P2(120,280) and P3(140,290) have minimal distance sqrt(20^2 + 10^2) = 22.36.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Clustered Point Distribution",
      input: {
        points: [
          { x: 10, y: 10 },
          { x: 15, y: 15 },
          { x: 100, y: 100 },
          { x: 200, y: 200 },
          { x: 205, y: 201 },
        ],
      },
      output: "Distance: 5.10",
      explanation: "Points (200,200) and (205,201) are closest with distance 5.10.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Widely Separated Diagonal Points",
      input: {
        points: [
          { x: 0, y: 0 },
          { x: 200, y: 200 },
          { x: 400, y: 400 },
        ],
      },
      output: "Distance: 282.84",
      explanation: "Uniform diagonal points have minimal distance 282.84.",
    },
  ],
  code: PYTHON_CLOSEST_PAIR_OF_POINTS_CODE,
  timeComplexity: {
    best: "O(N log N)",
    average: "O(N log N)",
    worst: "O(N log N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Sorting points by X takes O(N log N) time. Maintaining active Y-set checks O(1) candidates per point (at most 6 points per strip), yielding O(N log N) overall runtime.",
    space: "Requires O(N) auxiliary memory to store sorted points and active window.",
  },
  topicGuide: CLOSEST_PAIR_OF_POINTS_TOPIC_GUIDE,
  trivia: CLOSEST_PAIR_OF_POINTS_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 30,
      label: "Competitive Programmer's Handbook, Ch 30",
    },
  ],
  defaultInput: DEFAULT_CLOSEST_PAIR_OF_POINTS_INPUT,
  generateSteps: generateClosestPairOfPointsSteps,
};

export default closestPairOfPoints;
