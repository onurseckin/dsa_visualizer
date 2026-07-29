import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphNodeItem,
  GraphVisualSnapshot,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface Point2D {
  x: number;
  y: number;
}

export interface ManhattanDistanceRotationInput {
  points: Point2D[];
}

export const PYTHON_MANHATTAN_DISTANCE_ROTATION_CODE = `def max_manhattan_distance(points: list[tuple[int, int]]) -> int:
    if not points:
        return 0
        
    x_prime = [x + y for x, y in points]
    y_prime = [x - y for x, y in points]
    
    max_x_dist = max(x_prime) - min(x_prime)
    max_y_dist = max(y_prime) - min(y_prime)
    
    return max(max_x_dist, max_y_dist)

def manhattan_distance_rotation(points: list[tuple[int, int]]) -> int:
    return max_manhattan_distance(points)`;

export const DEFAULT_MANHATTAN_DISTANCE_ROTATION_INPUT: ManhattanDistanceRotationInput = {
  points: [
    { x: 1, y: 2 },
    { x: 4, y: 6 },
    { x: 2, y: 8 },
    { x: 7, y: 3 },
  ],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Manhattan Distance (L1 metric) measures grid movement distance between two points: d = |x1 - x2| + |y1 - y2|.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p1", label: "P1 (1,2)", x: 50, y: 100, state: "active" },
        { id: "p2", label: "P2 (4,6)", x: 200, y: 300, state: "compare" },
      ],
      edges: [{ from: "p1", to: "p2", weight: 7, isPath: true }],
    },
  },
  {
    narrative:
      "The Maximum Manhattan Distance problem seeks the maximum Manhattan distance among all pairs in a set of N points.",
    primarySnapshot: {
      kind: "array",
      name: "points_array",
      mode: "box",
      elements: [
        { id: "pt1", value: 1, label: "(1,2)", state: "default" },
        { id: "pt2", value: 2, label: "(4,6)", state: "default" },
        { id: "pt3", value: 3, label: "(2,8)", state: "default" },
        { id: "pt4", value: 4, label: "(7,3)", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Brute force checks all N · (N - 1) / 2 candidate pairs, taking quadratic O(N²) time.",
    primarySnapshot: {
      kind: "array",
      name: "pairwise_comparisons",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "Pair (1,2) vs (4,6)", state: "compare" },
        { id: "c2", value: 2, label: "Pair (1,2) vs (2,8)", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Coordinate Rotation Trick: rotate coordinate axes by 45 degrees using transformation x' = x + y and y' = x - y.",
    primarySnapshot: {
      kind: "array",
      name: "rotation_formula",
      mode: "box",
      elements: [
        { id: "r1", value: 1, label: "x' = x + y", state: "sorted" },
        { id: "r2", value: 2, label: "y' = x - y", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Chebyshev Equivalence: |x1 - x2| + |y1 - y2| = max(|x'1 - x'2|, |y'1 - y'2|). Manhattan distance in 2D transforms into L_infinity distance.",
    primarySnapshot: {
      kind: "array",
      name: "distance_equivalence",
      mode: "box",
      elements: [{ id: "eq", value: 1, label: "L1(P1, P2) == L_inf(P1', P2')", state: "sorted" }],
    },
  },
  {
    narrative:
      "Decoupling property: in rotated coordinates, x' and y' axes become completely independent!",
    primarySnapshot: {
      kind: "array",
      name: "decoupled_axes",
      mode: "box",
      elements: [
        { id: "dx", value: 1, label: "Max dx' = max(x') - min(x')", state: "active" },
        { id: "dy", value: 2, label: "Max dy' = max(y') - min(y')", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Linear time evaluation: Max Manhattan Distance = max(max(x') - min(x'), max(y') - min(y')).",
    primarySnapshot: {
      kind: "array",
      name: "linear_max",
      mode: "box",
      elements: [{ id: "m1", value: 10, label: "Max Distance = max(dx', dy')", state: "sorted" }],
    },
  },
  {
    narrative:
      "Single pass tracking: track min/max of x' and y' across N points in O(N) linear time without comparing pairs.",
    primarySnapshot: {
      kind: "array",
      name: "single_pass",
      mode: "box",
      elements: [{ id: "sp", value: 1, label: "O(N) single pass", state: "sorted" }],
    },
  },
  {
    narrative: "The entire calculation executes in O(N) linear time using O(1) auxiliary space.",
    primarySnapshot: {
      kind: "array",
      name: "complexity_summary",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "Time: O(N)", state: "sorted" },
        { id: "c2", value: 2, label: "Space: O(1)", state: "sorted" },
      ],
    },
  },
];

export function generateManhattanDistanceRotationSteps(
  input: ManhattanDistanceRotationInput,
): AlgorithmStep[] {
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
    input && Array.isArray(input.points) && input.points.length > 0
      ? input.points
      : DEFAULT_MANHATTAN_DISTANCE_ROTATION_INPUT.points;

  const isDefaultInput =
    !input ||
    (Array.isArray(input.points) &&
      input.points.length === DEFAULT_MANHATTAN_DISTANCE_ROTATION_INPUT.points.length &&
      input.points[0].x === DEFAULT_MANHATTAN_DISTANCE_ROTATION_INPUT.points[0].x &&
      input.points[0].y === DEFAULT_MANHATTAN_DISTANCE_ROTATION_INPUT.points[0].y);

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const n = rawPoints.length;

  const makeGraphSnapshot = (activeIdx?: number): GraphVisualSnapshot => {
    const nodes: GraphNodeItem[] = rawPoints.map((pt, idx) => ({
      id: `P${idx}`,
      label: `P${idx}(${pt.x},${pt.y})`,
      x: pt.x * 40 + 40,
      y: pt.y * 40 + 40,
      state: idx === activeIdx ? "active" : "default",
    }));
    return { kind: "graph", nodes, edges: [] };
  };

  addStep(`Initialize Manhattan Distance rotation trick for ${n} 2D points.`, makeGraphSnapshot());

  const xPrime = rawPoints.map((pt) => pt.x + pt.y);
  const yPrime = rawPoints.map((pt) => pt.x - pt.y);

  for (let i = 0; i < n; i++) {
    const pt = rawPoints[i];
    addStep(
      `Transform P${i}(${pt.x},${pt.y}) to 45° rotated coordinates: x' = ${pt.x} + ${pt.y} = ${xPrime[i]}, y' = ${pt.x} - ${pt.y} = ${yPrime[i]}.`,
      makeGraphSnapshot(i),
    );
  }

  const minX = Math.min(...xPrime);
  const maxX = Math.max(...xPrime);
  const minY = Math.min(...yPrime);
  const maxY = Math.max(...yPrime);

  const dx = maxX - minX;
  const dy = maxY - minY;
  const maxDist = Math.max(dx, dy);

  addStep(
    `Max Manhattan Distance complete! Rotated x' range [${minX}, ${maxX}] (span = ${dx}), y' range [${minY}, ${maxY}] (span = ${dy}). Max distance = max(${dx}, ${dy}) = ${maxDist}.`,
    {
      kind: "array",
      name: "rotation_result",
      mode: "box",
      elements: [
        { id: "span-x", value: dx, label: `x' span = ${dx}`, state: "sorted" },
        { id: "span-y", value: dy, label: `y' span = ${dy}`, state: "sorted" },
        { id: "max-dist", value: maxDist, label: `Max Manhattan = ${maxDist}`, state: "active" },
      ],
    },
  );

  return steps;
}

export const MANHATTAN_DISTANCE_ROTATION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The <strong>Manhattan Distance Coordinate Rotation Trick</strong> transforms L1 distance calculations into L_infinity Chebyshev distance via a 45-degree rotation <code>x' = x + y, y' = x - y</code>, allowing max pairwise distance queries in <code>O(N)</code> time.</p>",
  sections: [
    {
      heading: "Rotation Transformation",
      body: "<p>Mapping (x, y) -> (x+y, x-y) decouples the x' and y' dimensions, making max Manhattan distance equal to max(max(x') - min(x'), max(y') - min(y')).</p>",
    },
  ],
  keyTerms: [
    {
      term: "Manhattan Distance",
      definition: "Grid distance d = |x1 - x2| + |y1 - y2|.",
    },
  ],
};

export const MANHATTAN_DISTANCE_ROTATION_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines max_manhattan_distance function.",
    2: "Transforms points using x' = x+y and y' = x-y.",
    3: "Returns max(span(x'), span(y')).",
  },
};

export const manhattanDistanceRotation: AlgorithmDefinition<ManhattanDistanceRotationInput> = {
  id: "manhattan-distance-rotation",
  title: "Manhattan Distance Coordinate Rotation Trick",
  topicIds: ["geometry_and_sweep_line"],
  difficulty: "Hard",
  description:
    "<p>Given a set of 2D points, find the maximum Manhattan distance between any pair of points in O(N) linear time using 45-degree coordinate rotation.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "  <li><code>points</code>: Array of 2D coordinate point objects <code>{ x: number, y: number }</code> where <code>1 &le; N &le; 1000</code>.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<p>Returns an integer representing the maximum pairwise Manhattan distance.</p>",
  constraints: ["1 <= points.length <= 1000", "-1000 <= x, y <= 1000"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "4 Points Grid Search",
      input: DEFAULT_MANHATTAN_DISTANCE_ROTATION_INPUT,
      output: "10",
      explanation: "Max distance occurs between (1,2) and (7,3) or (2,8) and (7,3).",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Wide Diagonal Points",
      input: {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          { x: 20, y: 20 },
        ],
      },
      output: "40",
      explanation: "Max distance between (0,0) and (20,20) is |20-0| + |20-0| = 40.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Single Point",
      input: {
        points: [{ x: 5, y: 5 }],
      },
      output: "0",
      explanation: "Single point distance is 0.",
    },
  ],
  code: PYTHON_MANHATTAN_DISTANCE_ROTATION_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Single linear sweep transforms N points and finds min/max in O(N) time.",
    space: "Requires O(1) auxiliary space.",
  },
  topicGuide: MANHATTAN_DISTANCE_ROTATION_TOPIC_GUIDE,
  trivia: MANHATTAN_DISTANCE_ROTATION_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 29,
      label: "Competitive Programmer's Handbook, Ch 29",
    },
  ],
  defaultInput: DEFAULT_MANHATTAN_DISTANCE_ROTATION_INPUT,
  generateSteps: generateManhattanDistanceRotationSteps,
};

export default manhattanDistanceRotation;
