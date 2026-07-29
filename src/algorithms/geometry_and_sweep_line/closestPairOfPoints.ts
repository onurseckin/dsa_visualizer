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
    input && Array.isArray(input.points) && input.points.length >= 2
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
      what: `Initialize Closest Pair of Points plane sweep algorithm for ${points.length} 2D points.`,
      why: "Sorting points by X-coordinate transforms spatial 2D proximity search into a 1D vertical sweep line pass with a dynamic Y-interval candidate window.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(),
    },
    auxiliaryState: {
      hashMap: {
        "Total Points": points.length,
        Status: "Starting Plane Sweep",
      },
    },
    variables: { totalPoints: points.length, minDist: "infinity" },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Sort ${points.length} points primarily by X-coordinate: [${points.map((p) => `${p.id}(${p.x},${p.y})`).join(", ")}].`,
      why: "X-coordinate sorting allows us to evict points whose horizontal distance exceeds current minimum distance d.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(),
    },
    auxiliaryState: {
      hashMap: {
        "Sorted Points": points.map((p) => p.id).join(", "),
      },
    },
    variables: { sortedCount: points.length },
  });

  const activeWindow: Array<Point2D & { id: string }> = [];

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 9,
      explanation: {
        what: `Sweep line advances to point ${pt.id} at coordinates (${pt.x}, ${pt.y}).`,
        why: "We evaluate point candidate comparisons against active window points within horizontal distance d.",
      },
      primarySnapshot: {
        kind: "graph",
        ...makeGraphSnapshot(pt, activeWindow),
      },
      auxiliaryState: {
        hashMap: {
          "Current Point": `${pt.id}(${pt.x},${pt.y})`,
          "Current min_dist": minDist === Infinity ? "∞" : minDist.toFixed(2),
          "Active Window Size": activeWindow.length,
        },
      },
      variables: { ptId: pt.id, x: pt.x, y: pt.y, minDist },
    });

    // Evict points from active window whose dx >= minDist
    while (activeWindow.length > 0 && pt.x - activeWindow[0].x >= minDist) {
      const evicted = activeWindow.shift()!;
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 11,
        explanation: {
          what: `Evict point ${evicted.id}(${evicted.x},${evicted.y}) from active window (dx = ${pt.x - evicted.x} ≥ d = ${minDist.toFixed(2)}).`,
          why: "Points outside horizontal distance d cannot yield a closer pair distance than current minimum d.",
        },
        primarySnapshot: {
          kind: "graph",
          ...makeGraphSnapshot(pt, activeWindow),
        },
        auxiliaryState: {
          hashMap: {
            "Evicted Point": evicted.id,
            "Horizontal Dist dx": pt.x - evicted.x,
            "Threshold d": minDist.toFixed(2),
          },
        },
        variables: { evictedId: evicted.id, dx: pt.x - evicted.x },
      });
    }

    // Compare with points in active window
    for (const activePt of activeWindow) {
      const dy = Math.abs(pt.y - activePt.y);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 14,
        explanation: {
          what: `Check vertical distance dy = |${pt.y} - ${activePt.y}| = ${dy} against current min_dist d = ${minDist === Infinity ? "∞" : minDist.toFixed(2)}.`,
          why: "Only active points with vertical distance dy < d can potentially decrease overall Euclidean distance.",
        },
        primarySnapshot: {
          kind: "graph",
          ...makeGraphSnapshot(pt, activeWindow, activePt),
        },
        auxiliaryState: {
          hashMap: {
            Comparing: `${pt.id} vs ${activePt.id}`,
            "Vertical Dist dy": dy,
            "Threshold d": minDist === Infinity ? "∞" : minDist.toFixed(2),
            "Eligible dy < d": dy < minDist ? "YES" : "NO",
          },
        },
        variables: { ptId: pt.id, activeId: activePt.id, dy },
      });

      if (dy < minDist) {
        const dVal = dist(pt, activePt);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 15,
          explanation: {
            what: `Compute Euclidean distance d(${pt.id}, ${activePt.id}) = ${dVal.toFixed(2)}. Current min_dist = ${minDist === Infinity ? "∞" : minDist.toFixed(2)}.`,
            why: "Evaluating actual Euclidean distance sqrt(dx² + dy²) for active candidates inside the d-strip.",
          },
          primarySnapshot: {
            kind: "graph",
            ...makeGraphSnapshot(pt, activeWindow, activePt),
          },
          auxiliaryState: {
            hashMap: {
              "Pair Distance": dVal.toFixed(2),
              "Current min_dist": minDist === Infinity ? "∞" : minDist.toFixed(2),
              "Is New Minimum": dVal < minDist ? "YES" : "NO",
            },
          },
          variables: { pairDist: dVal, minDist },
        });

        if (dVal < minDist) {
          minDist = dVal;
          closestPair = [pt, activePt];

          steps.push({
            stepIndex: stepIndex++,
            codeLine: 17,
            explanation: {
              what: `New minimum distance found! min_dist updated to ${minDist.toFixed(2)} between ${pt.id} and ${activePt.id}.`,
              why: "Updating global closest pair record and shrinking active candidate strip width to new d.",
            },
            primarySnapshot: {
              kind: "graph",
              ...makeGraphSnapshot(pt, activeWindow, activePt),
            },
            auxiliaryState: {
              hashMap: {
                "New Closest Pair": `${pt.id} - ${activePt.id}`,
                "New min_dist": minDist.toFixed(2),
              },
            },
            variables: { newMinDist: minDist, pair: [pt.id, activePt.id] },
          });
        }
      }
    }

    activeWindow.push(pt);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 19,
      explanation: {
        what: `Add point ${pt.id}(${pt.x},${pt.y}) to active sweep window. Active count = ${activeWindow.length}.`,
        why: "Point stays active in the Y-interval candidate window until sweep line moves past X + d.",
      },
      primarySnapshot: {
        kind: "graph",
        ...makeGraphSnapshot(pt, activeWindow),
      },
      auxiliaryState: {
        hashMap: {
          "Active Set": activeWindow.map((p) => p.id).join(", "),
        },
      },
      variables: { activeCount: activeWindow.length },
    });
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 21,
    explanation: {
      what: `Closest Pair of Points algorithm complete. Minimum Euclidean distance: ${minDist.toFixed(2)}${closestPair ? ` between ${closestPair[0].id} and ${closestPair[1].id}` : ""}.`,
      why: "The plane sweep algorithm evaluated all candidates in optimal O(N log N) total time.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(),
    },
    auxiliaryState: {
      hashMap: {
        "Final min_dist": minDist.toFixed(2),
        "Closest Pair": closestPair ? `${closestPair[0].id} - ${closestPair[1].id}` : "N/A",
      },
    },
    variables: {
      minDist,
      closestPair: closestPair ? [closestPair[0].id, closestPair[1].id] : null,
    },
  });

  return steps;
};

export const CLOSEST_PAIR_OF_POINTS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The <strong>Closest Pair of Points algorithm</strong> finds the pair of 2D points with minimal Euclidean distance <code>d</code> in optimal <code>O(N log N)</code> time using a vertical sweep line or divide-and-conquer strategy.</p>",
  sections: [
    {
      heading: "The Delta Strip Invariant",
      body: "<p>Maintaining current minimum distance d allows us to discard any point whose X-coordinate differs from the sweep line by more than d. Points inside the 2d strip can be ordered by Y-coordinate.</p>",
    },
    {
      heading: "At Most 6 Candidates Geometry Proof",
      body: "<p>Due to geometric packing arguments, a rectangle of dimensions d × 2d can contain at most 6 points whose pairwise distances are all at least d. Thus each point compares against at most 6 active candidates in the Y-ordered set.</p>",
    },
    {
      heading: "Sweep Line vs Divide-and-Conquer",
      body: "<p>The classical divide-and-conquer algorithm splits points recursively around a median X-coordinate, taking <code>O(N log N)</code> time with merge steps. The sweep line approach achieves the exact same <code>O(N log N)</code> runtime in a single online pass with a dynamic Y-balanced tree or sliding window.</p>",
    },
    {
      heading: "Systems Applications & Collision Detection",
      body: "<p>Finding closest pairs powers spatial databases, air traffic collision avoidance systems, N-body physics simulations, computational chemistry molecular modeling, and spatial clustering algorithms.</p>",
    },
    {
      heading: "Implementation Nuances & Precision",
      body: "<p>Distance comparisons can use squared distance (dx² + dy² &lt; d²) to avoid computing expensive square roots during intermediate loop steps, evaluating square roots only for final output.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Euclidean Distance",
      definition:
        "The straight-line distance d = √((x₂ - x₁)² + (y₂ - y₁)²) between two points in 2D space.",
    },
    {
      term: "Active Window Strip",
      definition:
        "A sliding subset of points lying within d X-distance from the current sweep point.",
    },
    {
      term: "Packing Argument",
      definition:
        "Geometric proof bounding the maximum density of points separated by at least d to at most 6 points per strip box.",
    },
    {
      term: "Divide-and-Conquer Geometry",
      definition:
        "Algorithmic paradigm bisecting point sets by median X-coordinate and merging strip boundaries in linear time.",
    },
    {
      term: "Squared Distance Metric",
      definition:
        "Comparing dx² + dy² < d² to skip square root calculations until the final candidate distance extraction.",
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
    "<p>Find the minimum Euclidean distance between any pair of 2D points in <code>O(N log N)</code> time using a vertical sweep line and active Y-interval candidate set:</p><p><code>d = √((x₂ - x₁)² + (y₂ - y₁)²)</code></p><h3>Graph Snapshot Representation</h3><p>The 2D points, active bounding strip, and current closest pair line are displayed on a coordinate grid.</p><h3>Input Parameters</h3><ul><li><code>points</code> (<code>Point2D[]</code>): Array of 2D coordinate points.</li></ul><h3>Output</h3><ul><li><code>float</code>: Minimum Euclidean distance between any pair.</li></ul><h3>Edge Cases &amp; Constraints</h3><ul><li><strong>Base Case:</strong> N = 2 ⇒ return d(P₁, P₂).</li><li><strong>Duplicate Points:</strong> Yield minimum distance 0.0.</li></ul>",
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
    time: "Sorting points by X takes O(N log N) time. Maintaining active Y-set checks O(1) candidates per point (at most 6 points per strip), yielding O(N log N) overall runtime.",
    space: "Requires O(N) auxiliary memory to store sorted points and active window.",
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
