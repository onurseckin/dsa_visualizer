import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphNodeItem,
  GraphEdgeItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
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

export const generateClosestPairOfPointsSteps = (
  input: ClosestPairOfPointsInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawPoints =
    input.points && input.points.length >= 2
      ? input.points
      : DEFAULT_CLOSEST_PAIR_OF_POINTS_INPUT.points;

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
    const isComparingClosestPair =
      closestPair &&
      currentP &&
      comparingP &&
      ((closestPair[0].id === currentP.id && closestPair[1].id === comparingP.id) ||
        (closestPair[0].id === comparingP.id && closestPair[1].id === currentP.id));

    if (closestPair && !isComparingClosestPair) {
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
        isPath: Boolean(isComparingClosestPair),
      });
    }

    return { nodes, edges };
  };

  // Step 0: Entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Initializing Closest Pair of Points algorithm for ${points.length} points.`,
      why: "A vertical sweep line will maintain candidate points within a dynamic 2D strip of width d.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(),
    },
    auxiliaryState: {
      hashMap: {
        "Total Points": points.length,
        Status: "Starting Sweep Line",
      },
    },
    variables: { totalPoints: points.length },
  });

  // Step 1: Sort points
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Sorted ${points.length} points primarily by X-coordinate.`,
      why: "Sorting points left-to-right enables linear X-axis sweep processing.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(),
    },
    auxiliaryState: {
      hashMap: {
        "Sorted Points": points.map((p) => `${p.id}(${p.x},${p.y})`).join(", "),
      },
    },
    variables: { sortedCount: points.length },
  });

  // Step 2: Init min_dist
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Initialized min_dist = Infinity.`,
      why: "Will track the smallest Euclidean distance delta found so far.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(),
    },
    auxiliaryState: {
      hashMap: { min_dist: "Infinity" },
    },
    variables: { minDist: -1 },
  });

  // Step 3: Init active window
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: `Initialized active_window = [].`,
      why: "Active window holds points currently within X-distance delta from sweep position.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(),
    },
    auxiliaryState: {
      hashMap: { active_window: "[]" },
    },
    variables: { activeWindowSize: 0 },
  });

  const activeWindow: Array<Point2D & { id: string }> = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];

    // Step 4: Process current point p
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 9,
      explanation: {
        what: `Processing point ${p.id} at (${p.x}, ${p.y}).`,
        why: "Advancing sweep line to next point in X-sorted order.",
      },
      primarySnapshot: {
        kind: "graph",
        ...makeGraphSnapshot(p, activeWindow),
      },
      auxiliaryState: {
        hashMap: {
          "Current Point": `${p.id} (${p.x}, ${p.y})`,
          "Active Window": activeWindow.map((ap) => ap.id).join(", ") || "Empty",
        },
      },
      variables: { currentId: p.id, px: p.x, py: p.y },
    });

    // Remove points from active window with x-distance >= minDist
    while (activeWindow.length > 0 && p.x - activeWindow[0].x >= minDist) {
      const removed = activeWindow.shift()!;
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 11,
        explanation: {
          what: `Evicted point ${removed.id}(${removed.x},${removed.y}) from active window: X-diff = ${p.x - removed.x} >= min_dist ${minDist.toFixed(2)}.`,
          why: "Points outside the X-strip of width delta cannot form a closer pair.",
        },
        primarySnapshot: {
          kind: "graph",
          ...makeGraphSnapshot(p, activeWindow),
        },
        auxiliaryState: {
          hashMap: {
            "Evicted Point": removed.id,
            "Remaining Active": activeWindow.map((ap) => ap.id).join(", ") || "Empty",
          },
        },
        variables: { evictedId: removed.id },
      });
    }

    // Check candidates in active window
    for (const activePt of activeWindow) {
      const yDiff = Math.abs(p.y - activePt.y);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 14,
        explanation: {
          what: `Comparing ${p.id}(${p.x},${p.y}) with candidate ${activePt.id}(${activePt.x},${activePt.y}): Y-diff = ${yDiff} vs min_dist ${minDist.toFixed(2)}.`,
          why: "Only test candidates whose vertical distance is strictly less than current min_dist.",
        },
        primarySnapshot: {
          kind: "graph",
          ...makeGraphSnapshot(p, activeWindow, activePt),
        },
        auxiliaryState: {
          hashMap: {
            "Testing Pair": `${p.id} vs ${activePt.id}`,
            "Y Difference": yDiff,
            "Min Dist": minDist.toFixed(2),
          },
        },
        variables: { currentId: p.id, activeId: activePt.id, yDiff },
      });

      if (yDiff < minDist) {
        const d = dist(p, activePt);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 15,
          explanation: {
            what: `Calculated Euclidean distance d(${p.id}, ${activePt.id}) = sqrt((${p.x}-${activePt.x})^2 + (${p.y}-${activePt.y})^2) = ${d.toFixed(2)}.`,
            why: "Evaluating hypotenuse distance between sweep point and candidate.",
          },
          primarySnapshot: {
            kind: "graph",
            ...makeGraphSnapshot(p, activeWindow, activePt),
          },
          auxiliaryState: {
            hashMap: {
              "Calculated Distance": d.toFixed(2),
              "Current Min Dist": minDist.toFixed(2),
            },
          },
          variables: { dist: d, minDist },
        });

        if (d < minDist) {
          minDist = d;
          closestPair = [p, activePt];

          steps.push({
            stepIndex: stepIndex++,
            codeLine: 17,
            explanation: {
              what: `New closest pair found: ${p.id}(${p.x},${p.y}) and ${activePt.id}(${activePt.x},${activePt.y}) with distance = ${d.toFixed(2)}.`,
              why: `Updated minimum distance delta to ${d.toFixed(2)}.`,
            },
            primarySnapshot: {
              kind: "graph",
              ...makeGraphSnapshot(p, activeWindow, activePt),
            },
            auxiliaryState: {
              hashMap: {
                "NEW Closest Pair": `${p.id} - ${activePt.id}`,
                "Updated Min Distance": d.toFixed(2),
              },
            },
            variables: { minDist, pair: `${p.id}-${activePt.id}` },
          });
        }
      }
    }

    activeWindow.push(p);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 19,
      explanation: {
        what: `Appended ${p.id}(${p.x},${p.y}) to active window.`,
        why: "Point is now eligible to serve as a candidate for future sweep points.",
      },
      primarySnapshot: {
        kind: "graph",
        ...makeGraphSnapshot(p, activeWindow),
      },
      auxiliaryState: {
        hashMap: {
          "Active Window Set": activeWindow.map((ap) => ap.id).join(", "),
        },
      },
      variables: { windowSize: activeWindow.length },
    });
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 21,
    explanation: {
      what: `Completed Closest Pair search. Closest pair: ${closestPair ? `${closestPair[0].id} and ${closestPair[1].id}` : "None"} with distance ${minDist.toFixed(2)}.`,
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
    variables: {
      minDist,
      closestPair: closestPair ? `${closestPair[0].id}-${closestPair[1].id}` : "",
    },
  });

  return steps;
};

export const CLOSEST_PAIR_OF_POINTS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "The Closest Pair of Points algorithm finds the pair of 2D points with minimal Euclidean distance $d$ in optimal $\\mathcal{O}(N \\log N)$ time using a vertical sweep line or divide-and-conquer strategy.",
  sections: [
    {
      heading: "The Delta Strip Invariant",
      body: "Maintaining current minimum distance $\\delta$ allows us to discard any point whose X-coordinate differs from the sweep line by more than $\\delta$. Points inside the $2\\delta$ strip can be ordered by Y-coordinate.",
    },
    {
      heading: "At Most 6 Candidates Geometry Proof",
      body: "Due to geometric packing arguments, a rectangle of dimensions $\\delta \\times 2\\delta$ can contain at most 6 points whose pairwise distances are all at least $\\delta$. Thus each point compares against at most 6 active candidates in the Y-ordered set.",
    },
    {
      heading: "Sweep Line vs Divide-and-Conquer",
      body: "The classical divide-and-conquer algorithm splits points recursively around a median X-coordinate, taking $\\mathcal{O}(N \\log N)$ time with merge steps. The sweep line approach achieves the exact same $\\mathcal{O}(N \\log N)$ runtime in a single online pass with a dynamic Y-balanced tree or sliding window.",
    },
    {
      heading: "Systems Applications & Collision Detection",
      body: "Finding closest pairs powers spatial databases, air traffic collision avoidance systems, N-body physics simulations, computational chemistry molecular modeling, and clustering algorithms.",
    },
    {
      heading: "Implementation Nuances & Precision",
      body: "Distance comparisons can use squared distance ($dx^2 + dy^2 < \\delta^2$) to avoid computing expensive square roots during intermediate loop steps, evaluating square roots only for final output.",
    },
  ],
  keyTerms: [
    {
      term: "Euclidean Distance",
      definition:
        "The straight-line distance $d = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$ between two points in 2D space.",
    },
    {
      term: "Active Window Strip",
      definition:
        "A sliding subset of points lying within $\\delta$ X-distance from the current sweep point.",
    },
    {
      term: "Packing Argument",
      definition:
        "Geometric proof bounding the maximum density of points separated by at least $\\delta$ to at most 6 points per strip box.",
    },
    {
      term: "Divide-and-Conquer Geometry",
      definition:
        "Algorithmic paradigm bisecting point sets by median X-coordinate and merging strip boundaries in linear time.",
    },
    {
      term: "Squared Distance Metric",
      definition:
        "Comparing $dx^2 + dy^2 < \\delta^2$ to skip square root calculations until the final candidate distance extraction.",
    },
  ],
};

export const CLOSEST_PAIR_OF_POINTS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Empty leading line for code formatting.",
    2: "Imports math module for sqrt/hypot calculations.",
    3: "Empty line for formatting.",
    4: "Defines closest_pair_of_points function signature taking point array.",
    5: "Sorts 2D points primarily by X coordinate.",
    6: "Initializes minimum distance delta to infinity.",
    7: "Initializes active window array for X-strip candidates.",
    8: "Empty line for formatting.",
    9: "Loops through each point p in X-sorted order.",
    10: "Checks while loop condition to evict points outside delta X-strip.",
    11: "Pops expired point from active window.",
    12: "Empty line for formatting.",
    13: "Loops through candidate points in active window.",
    14: "Checks if Y-difference is strictly less than min_dist delta.",
    15: "Computes Euclidean hypotenuse distance d.",
    16: "Checks if calculated distance d is strictly less than min_dist.",
    17: "Updates minimum distance delta.",
    18: "Empty line for formatting.",
    19: "Appends current point p to active window array.",
    20: "Empty line for formatting.",
    21: "Returns overall minimum Euclidean distance found.",
    22: "Empty trailing line for code formatting.",
  },
};

export const closestPairOfPoints: AlgorithmDefinition<ClosestPairOfPointsInput> = {
  id: "closest-pair-of-points",
  title: "Closest Pair of Points via Sweep Line",
  topicIds: ["geometry_and_sweep_line"],
  difficulty: "Hard",
  description:
    "Find the minimum Euclidean distance between any pair of 2D points in $\\mathcal{O}(N \\log N)$ time using a vertical sweep line and active Y-interval candidate set:\n\n$$d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$\n\n### Graph Snapshot Representation\nThe 2D points, active bounding strip, and current closest pair line are displayed on a coordinate grid.\n\n### Input Parameters\n- `points` (`Point2D[]`): Array of 2D coordinate points.\n\n### Output\n- `float`: Minimum Euclidean distance between any pair.\n\n### Edge Cases & Constraints\n- Base Case: $N = 2 \\implies \\text{return } d(P_1, P_2)$.\n- Duplicate Points: Yield minimum distance 0.0.",
  constraints: ["2 <= points.length <= 50", "0 <= x, y <= 500"],
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
      explanation:
        "Points P2(120,280) and P3(140,290) have minimal distance sqrt(20^2 + 10^2) = 22.36.",
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
    time: "Sorting points by X takes $\\mathcal{O}(N \\log N)$ time. Maintaining active Y-set checks $\\mathcal{O}(1)$ candidates per point (at most 6 points per strip), yielding $\\mathcal{O}(N \\log N)$ overall runtime.",
    space: "Requires $\\mathcal{O}(N)$ auxiliary memory to store sorted points and active window.",
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
