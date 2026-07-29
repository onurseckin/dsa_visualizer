import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface Point2D {
  x: number;
  y: number;
}

export interface PickTheoremInput {
  points: Point2D[];
}

export const PYTHON_PICK_THEOREM_CODE = `import math

def gcd(a: int, b: int) -> int:
    return math.gcd(abs(a), abs(b))

def pick_theorem(points: list[tuple[int, int]]) -> dict:
    n = len(points)
    if n < 3:
        return {"area": 0, "boundary": 0, "interior": 0}

    # 1. Double Area via Shoelace Formula
    double_area = 0
    boundary_points = 0
    for i in range(n):
        p1 = points[i]
        p2 = points[(i + 1) % n]
        double_area += (p1[0] * p2[1]) - (p2[0] * p1[1])
        dx = abs(p2[0] - p1[0])
        dy = abs(p2[1] - p1[1])
        boundary_points += gcd(dx, dy)

    area = abs(double_area) / 2.0
    interior_points = int(area - boundary_points / 2.0 + 1)
    return {"area": area, "boundary": boundary_points, "interior": interior_points}
`;

export const DEFAULT_PICK_THEOREM_INPUT: PickTheoremInput = {
  points: [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ],
};

const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Pick's Theorem establishes an exact relationship between the area A of a simple 2D lattice polygon and its integer grid points.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p0", label: "(0,0)", x: 0, y: 0, state: "default" },
        { id: "p1", label: "(4,0)", x: 400, y: 0, state: "default" },
        { id: "p2", label: "(4,3)", x: 400, y: 300, state: "default" },
        { id: "p3", label: "(0,3)", x: 0, y: 300, state: "default" },
      ],
      edges: [
        { from: "p0", to: "p1", isPath: true },
        { from: "p1", to: "p2", isPath: true },
        { from: "p2", to: "p3", isPath: true },
        { from: "p3", to: "p0", isPath: true },
      ],
    },
  },
  {
    narrative:
      "Classical formula: A = I + B / 2 - 1, where A is polygon area, B is the number of boundary lattice points, and I is interior points.",
    primarySnapshot: {
      kind: "array",
      name: "pick_formula",
      mode: "box",
      elements: [
        { id: "f1", value: 1, label: "A = I + B / 2 - 1", state: "sorted" },
        { id: "f2", value: 2, label: "I = A - B / 2 + 1", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Step 1: Compute total surface area A using Gauss's Shoelace cross-product formula in linear O(N) time.",
    primarySnapshot: {
      kind: "array",
      name: "shoelace_area",
      mode: "box",
      elements: [
        { id: "a1", value: 12, label: "Area A = 0.5 * |double_area| = 12", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Step 2: Count boundary lattice points B along each directed segment P_i -> P_{i+1} using Greatest Common Divisor: gcd(|dx|, |dy|).",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "p0", label: "P0 (0,0)", x: 0, y: 0, state: "active" },
        { id: "p1", label: "P1 (4,0)", x: 400, y: 0, state: "active" },
      ],
      edges: [{ from: "p0", to: "p1", isTraversed: true, weight: 4 }],
    },
  },
  {
    narrative:
      "Edge summation: sum gcd(|dx|, |dy|) across all N perimeter edges to obtain the total boundary points B.",
    primarySnapshot: {
      kind: "array",
      name: "boundary_sum",
      mode: "box",
      elements: [
        { id: "b1", value: 14, label: "Boundary B = 4 + 3 + 4 + 3 = 14", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Step 3: Solve for interior points I = A - B / 2 + 1 using exact rational arithmetic.",
    primarySnapshot: {
      kind: "array",
      name: "interior_calc",
      mode: "box",
      elements: [{ id: "i1", value: 6, label: "Interior I = 12 - 7 + 1 = 6", state: "sorted" }],
    },
  },
  {
    narrative:
      "Lattice constraint: Pick's Theorem requires all polygon vertices to have integer coordinates and the polygon to be simple (non-self-intersecting).",
    primarySnapshot: {
      kind: "array",
      name: "lattice_constraint",
      mode: "box",
      elements: [
        { id: "l1", value: 1, label: "Vertices must be integers", state: "sorted" },
        { id: "l2", value: 2, label: "Simple non-self-intersecting boundary", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Applications: computational geometry grid algorithms, digital image pixel counting, and lattice geometry proofs.",
    primarySnapshot: {
      kind: "array",
      name: "applications",
      mode: "box",
      elements: [{ id: "ap1", value: 1, label: "Pixel Counting & Rasterization", state: "sorted" }],
    },
  },
  {
    narrative:
      "The algorithm completes in O(N log(max_coord)) time dominated by edge GCD evaluations using O(1) space.",
    primarySnapshot: {
      kind: "array",
      name: "complexity_summary",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "Time: O(N log M)", state: "sorted" },
        { id: "c2", value: 2, label: "Space: O(1)", state: "sorted" },
      ],
    },
  },
];

export function generatePickTheoremSteps(input: PickTheoremInput): AlgorithmStep[] {
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
    input && Array.isArray(input.points) && input.points.length >= 3
      ? input.points
      : DEFAULT_PICK_THEOREM_INPUT.points;

  for (const intro of createIntroSnapshots()) {
    addStep(intro.narrative, intro.primarySnapshot, "intro");
  }

  const n = rawPoints.length;

  const getNodes = (activeEdgeIdx?: number): GraphNodeItem[] =>
    rawPoints.map((pt, idx) => ({
      id: `P${idx}`,
      label: `P${idx} (${pt.x},${pt.y})`,
      x: pt.x * 50 + 50,
      y: pt.y * 50 + 50,
      state: activeEdgeIdx === idx || activeEdgeIdx === (idx + n - 1) % n ? "active" : "default",
    }));

  const getEdges = (activeEdgeIdx?: number): GraphEdgeItem[] =>
    rawPoints.map((_pt, idx) => ({
      from: `P${idx}`,
      to: `P${(idx + 1) % n}`,
      isTraversed: activeEdgeIdx === idx,
      isPath: activeEdgeIdx !== undefined && idx < activeEdgeIdx,
    }));

  addStep(`Initialize Pick's Theorem calculation for ${n}-vertex lattice polygon.`, {
    kind: "graph",
    nodes: getNodes(),
    edges: getEdges(),
  });

  let doubleArea = 0;
  let boundaryPoints = 0;

  for (let i = 0; i < n; i++) {
    const p1 = rawPoints[i];
    const p2 = rawPoints[(i + 1) % n];

    const term = p1.x * p2.y - p2.x * p1.y;
    doubleArea += term;

    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);
    const edgeBoundary = gcd(dx, dy);
    boundaryPoints += edgeBoundary;

    addStep(
      `Edge P${i}(${p1.x},${p1.y}) -> P${(i + 1) % n}(${p2.x},${p2.y}): cross-term = ${term}, edge boundary points = gcd(${dx},${dy}) = ${edgeBoundary}. Running boundary B = ${boundaryPoints}.`,
      { kind: "graph", nodes: getNodes(i), edges: getEdges(i) },
    );
  }

  const area = Math.abs(doubleArea) / 2.0;
  const interiorPoints = Math.round(area - boundaryPoints / 2.0 + 1);

  addStep(
    `Pick's Theorem complete! Polygon Area A = ${area}, Boundary points B = ${boundaryPoints}, Interior points I = A - B / 2 + 1 = ${interiorPoints}.`,
    {
      kind: "array",
      name: "pick_result",
      mode: "box",
      elements: [
        { id: "res-area", value: area, label: `Area A = ${area}`, state: "sorted" },
        {
          id: "res-b",
          value: boundaryPoints,
          label: `Boundary B = ${boundaryPoints}`,
          state: "sorted",
        },
        {
          id: "res-i",
          value: interiorPoints,
          label: `Interior I = ${interiorPoints}`,
          state: "sorted",
        },
      ],
    },
  );

  return steps;
}

export const PICK_THEOREM_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p><strong>Pick's Theorem</strong> relates the enclosed area A of a simple 2D polygon with integer grid vertices to its boundary lattice points B and interior lattice points I: <code>A = I + B / 2 - 1</code>.</p>",
  sections: [
    {
      heading: "Formula & Boundary Calculation",
      body: "<p>Boundary points on edge (x₁, y₁) to (x₂, y₂) equal gcd(|x₂ - x₁|, |y₂ - y₁|). Area A is evaluated via the Shoelace formula.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Lattice Point",
      definition: "A point in 2D space with integer Cartesian coordinates.",
    },
  ],
};

export const PICK_THEOREM_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines pick_theorem function signature.",
    2: "Calculates double area and boundary points.",
    3: "Solves for interior points I = A - B / 2 + 1.",
  },
};

export const pickTheorem: AlgorithmDefinition<PickTheoremInput> = {
  id: "pick-theorem",
  title: "Pick's Theorem & Lattice Polygon Area",
  topicIds: ["math_and_number_theory", "geometry_and_sweep_line"],
  difficulty: "Hard",
  description:
    "<p>Given a simple lattice polygon with integer vertex coordinates, calculate its exact surface area A, boundary lattice points B, and interior lattice points I using Pick's Theorem.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "  <li><code>points</code>: Array of 2D integer vertex objects <code>{ x: number, y: number }</code> where <code>3 &le; N &le; 1000</code>.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<p>Returns an object <code>{ area: number, boundary: number, interior: number }</code>.</p>",
  constraints: ["3 <= points.length <= 1000", "-1000 <= x, y <= 1000"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "4x3 Grid Rectangle",
      input: DEFAULT_PICK_THEOREM_INPUT,
      output: "Area: 12, Boundary: 14, Interior: 6",
      explanation: "Rectangle [0,0] to [4,3] has Area=12, Boundary=14, and Interior=6.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Lattice Triangle",
      input: {
        points: [
          { x: 0, y: 0 },
          { x: 5, y: 0 },
          { x: 0, y: 4 },
        ],
      },
      output: "Area: 10, Boundary: 10, Interior: 6",
      explanation: "Right triangle with legs 5 and 4 has Area=10, Boundary=10, Interior=6.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Unit Square",
      input: {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
      },
      output: "Area: 1, Boundary: 4, Interior: 0",
      explanation: "1x1 unit square has Area=1, Boundary=4, Interior=0.",
    },
  ],
  code: PYTHON_PICK_THEOREM_CODE,
  timeComplexity: {
    best: "O(N log M)",
    average: "O(N log M)",
    worst: "O(N log M)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Shoelace cross product pass takes O(N) time. GCD calculation for each of the N edges takes O(log(max_coord)) time.",
    space: "Requires O(1) auxiliary space for scalar variables.",
  },
  topicGuide: PICK_THEOREM_TOPIC_GUIDE,
  trivia: PICK_THEOREM_TRIVIA,
  sources: [
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 29,
      chapterTitle: "Geometry",
      section: "29.3 Polygon area",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  defaultInput: DEFAULT_PICK_THEOREM_INPUT,
  generateSteps: generatePickTheoremSteps,
};

export default pickTheorem;
