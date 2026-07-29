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

export interface Point2D {
  x: number;
  y: number;
}

export interface PointInPolygonInput {
  polygon: Point2D[];
  point: Point2D;
}

export const PYTHON_POINT_IN_POLYGON_CODE = `class Solution:
    def __init__(self):
        pass

    def isBoomerang(self, points: list[list[int]]) -> bool:
        p1, p2, p3 = points[0], points[1], points[2]
        return (p2[0] - p1[0]) * (p3[1] - p1[1]) != (p2[1] - p1[1]) * (p3[0] - p1[0])`;

export const DEFAULT_POINT_IN_POLYGON_INPUT: PointInPolygonInput = {
  polygon: [
    { x: 100, y: 100 },
    { x: 400, y: 100 },
    { x: 400, y: 400 },
    { x: 100, y: 400 },
  ],
  point: { x: 250, y: 250 },
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Point-in-Polygon problem tests whether a query point P lies inside, outside, or on the boundary of a 2D polygon.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "v0", label: "V0 (100,100)", x: 100, y: 100, state: "default" },
        { id: "v1", label: "V1 (400,100)", x: 400, y: 100, state: "default" },
        { id: "v2", label: "V2 (400,400)", x: 400, y: 400, state: "default" },
        { id: "v3", label: "V3 (100,400)", x: 100, y: 400, state: "default" },
        { id: "P", label: "P (250,250)", x: 250, y: 250, state: "active" },
      ],
      edges: [
        { from: "v0", to: "v1", isPath: true },
        { from: "v1", to: "v2", isPath: true },
        { from: "v2", to: "v3", isPath: true },
        { from: "v3", to: "v0", isPath: true },
      ],
    },
  },
  {
    narrative:
      "Ray Casting Algorithm (Even-Odd Rule): cast an infinite horizontal ray from P towards the positive X direction.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "P", label: "P (250,250)", x: 250, y: 250, state: "active" },
        { id: "ray", label: "Ray +X -> ∞", x: 500, y: 250, state: "compare" },
      ],
      edges: [{ from: "P", to: "ray", isTraversed: true }],
    },
  },
  {
    narrative:
      "Crossing parity principle: each boundary edge crossing toggles the spatial state between outside and inside.",
    primarySnapshot: {
      kind: "array",
      name: "parity_rule",
      mode: "box",
      elements: [
        { id: "pr1", value: 1, label: "Odd crossings = INSIDE", state: "sorted" },
        { id: "pr2", value: 0, label: "Even crossings = OUTSIDE", state: "visited" },
      ],
    },
  },
  {
    narrative:
      "Edge straddle test: an edge (V1, V2) crosses the ray if P.y lies vertically between V1.y and V2.y.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "v1", label: "V1 (400,100)", x: 400, y: 100, state: "active" },
        { id: "v2", label: "V2 (400,400)", x: 400, y: 400, state: "active" },
        { id: "P", label: "P (250,250)", x: 250, y: 250, state: "compare" },
      ],
      edges: [{ from: "v1", to: "v2", isPath: true }],
    },
  },
  {
    narrative:
      "X-intersection computation: solve for the X-coordinate where the edge crosses line y = P.y: x_int = V1.x + (P.y - V1.y)(V2.x - V1.x) / (V2.y - V1.y).",
    primarySnapshot: {
      kind: "array",
      name: "x_intersection_formula",
      mode: "box",
      elements: [{ id: "xi", value: 400, label: "x_int = 400 > P.x (250)", state: "sorted" }],
    },
  },
  {
    narrative:
      "Intersection count: if x_int > P.x, the ray intersects the edge, toggling the boolean inside state.",
    primarySnapshot: {
      kind: "array",
      name: "toggle_state",
      mode: "box",
      elements: [{ id: "ts", value: 1, label: "inside = true (1 crossing)", state: "sorted" }],
    },
  },
  {
    narrative:
      "Vertex degeneracy handling: half-open vertical interval check ((V1.y > P.y) != (V2.y > P.y)) prevents double counting when ray passes directly through a vertex.",
    primarySnapshot: {
      kind: "array",
      name: "vertex_safety",
      mode: "box",
      elements: [
        {
          id: "vs",
          value: 1,
          label: "Half-open intervals avoid vertex double-counting",
          state: "sorted",
        },
      ],
    },
  },
  {
    narrative:
      "Winding Number alternative: evaluates total signed turns around P, handling self-intersecting polygons.",
    primarySnapshot: {
      kind: "array",
      name: "winding_number",
      mode: "box",
      elements: [{ id: "wn", value: 1, label: "Winding Number != 0 -> INSIDE", state: "sorted" }],
    },
  },
  {
    narrative:
      "Ray Casting completes in optimal O(N) linear time over N polygon vertices using O(1) space.",
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

export function generatePointInPolygonSteps(input: PointInPolygonInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIdx++, phase, narrative, primarySnapshot }));
  };

  const rawPolygon =
    input && Array.isArray(input.polygon) && input.polygon.length >= 3
      ? input.polygon
      : DEFAULT_POINT_IN_POLYGON_INPUT.polygon;
  const testPoint = input?.point || DEFAULT_POINT_IN_POLYGON_INPUT.point;

  const isDefaultInput =
    !input ||
    (Array.isArray(input.polygon) &&
      input.polygon.length === DEFAULT_POINT_IN_POLYGON_INPUT.polygon.length &&
      input.point.x === DEFAULT_POINT_IN_POLYGON_INPUT.point.x &&
      input.point.y === DEFAULT_POINT_IN_POLYGON_INPUT.point.y);

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const n = rawPolygon.length;

  const makeGraphSnapshot = (activeEdgeIdx?: number, isInside = false): GraphVisualSnapshot => {
    const nodes: GraphNodeItem[] = rawPolygon.map((pt, idx) => ({
      id: `V${idx}`,
      label: `V${idx}(${pt.x},${pt.y})`,
      x: pt.x,
      y: pt.y,
      state: "default",
    }));

    nodes.push({
      id: "P",
      label: `P (${testPoint.x},${testPoint.y})`,
      x: testPoint.x,
      y: testPoint.y,
      state: isInside ? "sorted" : "active",
    });

    const edges: GraphEdgeItem[] = rawPolygon.map((_, idx) => ({
      from: `V${idx}`,
      to: `V${(idx + 1) % n}`,
      isTraversed: activeEdgeIdx === idx,
      isPath: true,
    }));

    return { kind: "graph", nodes, edges };
  };

  addStep(
    `Initialize Ray Casting test for query point P(${testPoint.x}, ${testPoint.y}) against ${n}-vertex polygon.`,
    makeGraphSnapshot(),
  );

  let inside = false;
  let intersectionsCount = 0;

  for (let i = 0; i < n; i++) {
    const v1 = rawPolygon[i];
    const v2 = rawPolygon[(i + 1) % n];

    const straddlesY = v1.y > testPoint.y !== v2.y > testPoint.y;

    if (straddlesY) {
      const xInt = v1.x + ((testPoint.y - v1.y) * (v2.x - v1.x)) / (v2.y - v1.y);
      if (testPoint.x < xInt) {
        inside = !inside;
        intersectionsCount++;
        addStep(
          `Edge V${i} -> V${(i + 1) % n} crosses horizontal ray at x_int = ${xInt.toFixed(1)} > P.x (${testPoint.x}). Toggled inside state = ${inside} (Total crossings = ${intersectionsCount}).`,
          makeGraphSnapshot(i, inside),
        );
      }
    }
  }

  addStep(
    `Ray Casting complete! Total edge crossings = ${intersectionsCount} (${intersectionsCount % 2 !== 0 ? "ODD" : "EVEN"}). Point P(${testPoint.x},${testPoint.y}) is ${inside ? "INSIDE" : "OUTSIDE"} the polygon.`,
    makeGraphSnapshot(undefined, inside),
  );

  return steps;
}

export const POINT_IN_POLYGON_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The <strong>Point-in-Polygon Ray Casting algorithm</strong> tests whether a point lies inside a 2D polygon by counting horizontal ray crossings in <code>O(N)</code> time.</p>",
  sections: [
    {
      heading: "Ray Casting Parity",
      body: "<p>Casting an infinite ray from query point P along +X axis toggles inside/outside state on each edge intersection.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Ray Casting",
      definition: "Counting edge intersections along an infinite directional ray.",
    },
  ],
};

export const POINT_IN_POLYGON_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines point_in_polygon function signature.",
    2: "Sweeps polygon edges testing ray straddle and x_int > px.",
    3: "Returns boolean inside state.",
  },
};

export const pointInPolygon: AlgorithmDefinition<PointInPolygonInput> = {
  id: "point-in-polygon",
  title: "Point-in-Polygon Ray Casting",
  topicIds: ["geometry_and_sweep_line"],
  difficulty: "Hard",
  description:
    "<p>Given a simple 2D polygon and a query point P, determine whether P lies inside or outside the polygon in O(N) time using Ray Casting.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "  <li><code>polygon</code>: Array of 2D vertex objects <code>{ x: number, y: number }</code> where <code>3 &le; N &le; 1000</code>.</li>" +
    "  <li><code>point</code>: Query point object <code>{ x: number, y: number }</code>.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<p>Returns a boolean value (<code>true</code> if point is inside, <code>false</code> otherwise).</p>",
  constraints: ["3 <= polygon.length <= 1000", "-1000 <= x, y <= 1000"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Point Inside Square",
      input: DEFAULT_POINT_IN_POLYGON_INPUT,
      output: "true",
      explanation: "Point P(250,250) is inside 300x300 square.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Point Outside Non-Convex Polygon",
      input: {
        polygon: [
          { x: 100, y: 100 },
          { x: 300, y: 100 },
          { x: 300, y: 300 },
          { x: 200, y: 200 },
          { x: 100, y: 300 },
        ],
        point: { x: 200, y: 250 },
      },
      output: "false",
      explanation: "Point P(200,250) is in the exterior notch of the non-convex polygon.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Point Far Outside",
      input: {
        polygon: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ],
        point: { x: 500, y: 500 },
      },
      output: "false",
      explanation: "Point P(500,500) is far outside the bounding box.",
    },
  ],
  code: PYTHON_POINT_IN_POLYGON_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Linear traversal over N polygon edges evaluates edge straddle and X-intersection in O(N) time.",
    space: "Requires O(1) auxiliary space.",
  },
  topicGuide: POINT_IN_POLYGON_TOPIC_GUIDE,
  trivia: POINT_IN_POLYGON_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 29,
      label: "Competitive Programmer's Handbook, Ch 29",
    },
  ],
  defaultInput: DEFAULT_POINT_IN_POLYGON_INPUT,
  generateSteps: generatePointInPolygonSteps,
};

export default pointInPolygon;
