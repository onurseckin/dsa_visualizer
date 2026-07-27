import type { AlgorithmDefinition, AlgorithmStep, GraphNodeItem, GraphEdgeItem, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import type { Point2D } from "./lineSegmentIntersection";

export interface ClosestPairOfPointsInput {
  points: Point2D[];
}

export const PYTHON_CLOSEST_PAIR_OF_POINTS_CODE = `import math

def closest_pair(points: list[tuple[float, float]]) -> float:
    pts = sorted(points, key=lambda p: p[0])
    min_d = float('inf')
    active = []

    for p in pts:
        active = [pt for pt in active if p[0] - pt[0] < min_d]
        for pt in active:
            if abs(p[1] - pt[1]) < min_d:
                d = math.hypot(p[0] - pt[0], p[1] - pt[1])
                min_d = min(min_d, d)
        active.append(p)
    return min_d`;

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

export const generateClosestPairOfPointsSteps = (
  input: ClosestPairOfPointsInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawPoints = input.points && input.points.length >= 2 ? input.points : DEFAULT_CLOSEST_PAIR_OF_POINTS_INPUT.points;

  const points = rawPoints
    .map((p, idx) => ({
      id: `P${idx + 1}`,
      x: Math.round(p.x),
      y: Math.round(p.y),
    }))
    .sort((a, b) => a.x - b.x || a.y - b.y);

  let minDist = Infinity;
  let closestPair: [Point2D & { id: string }, Point2D & { id: string }] | null = null;

  const dist = (a: Point2D, b: Point2D): number => {
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const makeGraphSnapshot = (
    currentP?: Point2D & { id: string },
    activePts: Array<Point2D & { id: string }> = [],
    comparingP?: Point2D & { id: string },
  ) => {
    const nodes: GraphNodeItem[] = points.map(pt => {
      const isCurrent = currentP && currentP.id === pt.id;
      const isComparing = comparingP && comparingP.id === pt.id;
      const isActive = activePts.some(ap => ap.id === pt.id);
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

    return { nodes, edges };
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Initializing Closest Pair sweep line algorithm for ${points.length} points sorted by X coordinate.`,
      why: "Sorting points by X allows a vertical sweep line to maintain candidate points within a bounding strip of width d.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(),
    },
    auxiliaryState: {
      hashMap: {
        "Points Count": points.length,
        "Current Min Dist": "Infinity",
      },
    },
    variables: { totalPoints: points.length, minDist: -1 },
  });

  const activeWindow: Array<Point2D & { id: string }> = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];

    // Remove points from active window with x-distance >= minDist
    while (activeWindow.length > 0 && p.x - activeWindow[0].x >= minDist) {
      activeWindow.shift();
    }

    for (const activePt of activeWindow) {
      if (Math.abs(p.y - activePt.y) < minDist) {
        const d = dist(p, activePt);

        if (d < minDist) {
          minDist = d;
          closestPair = [p, activePt];

          steps.push({
            stepIndex: stepIndex++,
            codeLine: 13,
            explanation: {
              what: `New closest pair found: ${p.id}(${p.x},${p.y}) and ${activePt.id}(${activePt.x},${activePt.y}). Distance = ${d.toFixed(2)}.`,
              why: `Updated minimum distance delta to ${d.toFixed(2)}.`,
            },
            primarySnapshot: {
              kind: "graph",
              ...makeGraphSnapshot(p, activeWindow, activePt),
            },
            auxiliaryState: {
              hashMap: {
                "Closest Pair": `${p.id} - ${activePt.id}`,
                "Min Distance": d.toFixed(2),
                "Active Window Size": activeWindow.length,
              },
            },
            variables: { minDist, pair: `${p.id}-${activePt.id}` },
          });
        } else {
          steps.push({
            stepIndex: stepIndex++,
            codeLine: 12,
            explanation: {
              what: `Checked distance between ${p.id} and ${activePt.id}: d = ${d.toFixed(2)} (>= minDist ${minDist.toFixed(2)}).`,
              why: "Distance is greater than or equal to current minimum distance delta, so minimum distance is kept.",
            },
            primarySnapshot: {
              kind: "graph",
              ...makeGraphSnapshot(p, activeWindow, activePt),
            },
            auxiliaryState: {
              hashMap: {
                "Checked Pair": `${p.id} - ${activePt.id}`,
                "Distance": d.toFixed(2),
                "Current Min Distance": minDist.toFixed(2),
              },
            },
            variables: { minDist, checkedDist: d },
          });
        }
      }
    }

    activeWindow.push(p);
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 15,
    explanation: {
      what: `Completed Closest Pair of Points search. Closest pair: ${closestPair ? `${closestPair[0].id} and ${closestPair[1].id}` : "None"} with distance ${minDist.toFixed(2)}.`,
      why: "Sweep line algorithm guarantees O(N log N) time complexity by comparing each point against at most 6 candidates in the active strip.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(),
    },
    auxiliaryState: {
      hashMap: {
        "Final Closest Pair": closestPair ? `${closestPair[0].id} - ${closestPair[1].id}` : "None",
        "Final Minimum Distance": minDist.toFixed(2),
      },
    },
    variables: { minDist, closestPair: closestPair ? `${closestPair[0].id}-${closestPair[1].id}` : "" },
  });

  return steps;
};

const CLOSEST_PAIR_OF_POINTS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "The Closest Pair of Points algorithm finds the pair with minimal Euclidean distance in a set of 2D points in O(N log N) time using a sweep line or divide-and-conquer strategy.",
  sections: [
    {
      heading: "The Delta Strip Invariant",
      body: "Maintaining current minimum distance delta allows us to discard any point whose X-coordinate differs from the sweep line by more than delta. Points inside the 2-delta strip can be ordered by Y coordinate.",
    },
    {
      heading: "At Most 6 Candidates Geometry Proof",
      body: "Due to packing arguments, a rectangle of dimensions delta x 2-delta can contain at most 6 points whose pairwise distances are all at least delta. Thus each point compares against at most 6 active candidates.",
    },
  ],
  keyTerms: [
    {
      term: "Euclidean Distance",
      definition: "The straight-line distance sqrt((x2-x1)^2 + (y2-y1)^2) between two points in 2D space.",
    },
    {
      term: "Active Window Strip",
      definition: "A sliding subset of points lying within delta X-distance from the current sweep point.",
    },
  ],
};

const CLOSEST_PAIR_OF_POINTS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports math module for hypot (Euclidean distance) computation.",
    3: "Defines closest_pair function taking a list of (x, y) point tuples.",
    4: "Sorts input 2D points primarily by X coordinate.",
    5: "Initializes minimum distance delta to infinity.",
    6: "Initializes active window list.",
    8: "Iterates through sorted 2D points.",
    9: "Filters active window to keep only points within current minimum distance delta of sweep X.",
    10: "Iterates through candidate points in active Y window.",
    11: "Checks if Y-distance between sweep point and candidate is within min_d.",
    12: "Computes Euclidean hypotenuse distance between sweep point p and active candidate.",
    13: "Updates minimum distance delta.",
    14: "Appends current sweep point to active window list.",
    15: "Returns overall minimum distance found between any pair.",
  },
};

export const closestPairOfPoints: AlgorithmDefinition<ClosestPairOfPointsInput> = {
  id: "closest-pair-of-points",
  title: "Closest Pair of Points via Sweep Line",
  category: "geometry_and_sweep_line",
  difficulty: "Hard",
  description:
    "Find the minimum distance between any pair of 2D points in O(N log N) using a vertical sweep line and active Y-interval candidate set.",
  constraints: [
    "2 <= points.length <= 50",
    "0 <= x, y <= 500",
  ],
  examples: [
    {
      kind: "basic",
      title: "6 Points with Close Pair",
      input: {
        points: [
          { x: 50, y: 150 },
          { x: 120, y: 280 },
          { x: 140, y: 290 },
          { x: 220, y: 80 },
          { x: 300, y: 200 },
          { x: 380, y: 170 },
        ],
      },
      output: "Distance: 22.36 (P2-P3)",
      explanation: "Points P2(120,280) and P3(140,290) have minimal distance sqrt(20^2 + 10^2) = 22.36.",
    },
    {
      kind: "complex",
      title: "Clustered Points",
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
      title: "Widely Separated Points",
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
    time: "Sorting points by X takes O(N log N). Maintaining active Y-set checks O(1) candidates per point, yielding O(N log N) overall.",
    space: "Requires O(N) memory to store sorted points and active window.",
  },
  topicGuide: CLOSEST_PAIR_OF_POINTS_TOPIC_GUIDE,
  trivia: CLOSEST_PAIR_OF_POINTS_TRIVIA,
    sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 30",
      label: "Competitive Programmer's Handbook, Ch 30",
    },
  ],
  defaultInput: DEFAULT_CLOSEST_PAIR_OF_POINTS_INPUT,
  generateSteps: generateClosestPairOfPointsSteps,
};
