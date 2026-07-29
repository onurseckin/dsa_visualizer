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

export interface LineSegment {
  p1: Point2D;
  p2: Point2D;
}

export interface LineSegmentIntersectionInput {
  segment1: LineSegment;
  segment2: LineSegment;
}

export const PYTHON_LINE_SEGMENT_INTERSECTION_CODE = `class Solution:
    def __init__(self):
        pass

    def computeArea(self, ax1: int, ay1: int, ax2: int, ay2: int, bx1: int, by1: int, bx2: int, by2: int) -> int:
        area1 = (ax2 - ax1) * (ay2 - ay1)
        area2 = (bx2 - bx1) * (by2 - by1)
        overlap_w = max(0, min(ax2, bx2) - max(ax1, bx1))
        overlap_h = max(0, min(ay2, by2) - max(ay1, by1))
        return area1 + area2 - (overlap_w * overlap_h)`;

export const DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT: LineSegmentIntersectionInput = {
  segment1: { p1: { x: 50, y: 50 }, p2: { x: 350, y: 350 } },
  segment2: { p1: { x: 50, y: 350 }, p2: { x: 350, y: 50 } },
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Line segment intersection asks whether two 2D segments S1=(P1, Q1) and S2=(P2, Q2) share at least one common point.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "P1", label: "P1", x: 50, y: 50, state: "default" },
        { id: "Q1", label: "Q1", x: 350, y: 350, state: "default" },
        { id: "P2", label: "P2", x: 50, y: 350, state: "default" },
        { id: "Q2", label: "Q2", x: 350, y: 50, state: "default" },
      ],
      edges: [
        { from: "P1", to: "Q1", isPath: true },
        { from: "P2", to: "Q2", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Slope-based algebraic equations (y = mx + b) fail on vertical lines due to division by zero and floating-point drift.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "P1", label: "Vertical P1", x: 200, y: 50, state: "active" },
        { id: "Q1", label: "Vertical Q1", x: 200, y: 350, state: "active" },
      ],
      edges: [{ from: "P1", to: "Q1", isPath: true }],
    },
  },
  {
    narrative:
      "Robust approach: 2D vector cross-product orientation tests determine spatial relationships using exact integer arithmetic.",
    primarySnapshot: {
      kind: "array",
      name: "orientation_primitive",
      mode: "box",
      elements: [
        {
          id: "o1",
          value: 1,
          label: "cross(A, B, C) = (Bx-Ax)(Cy-Ay) - (By-Ay)(Cx-Ax)",
          state: "sorted",
        },
      ],
    },
  },
  {
    narrative:
      "Orientation sign: positive cross product indicates a left turn, negative indicates a right turn, and zero indicates collinearity.",
    primarySnapshot: {
      kind: "array",
      name: "cross_sign_meanings",
      mode: "box",
      elements: [
        { id: "s1", value: 1, label: "cross > 0 (Left)", state: "sorted" },
        { id: "s2", value: -1, label: "cross < 0 (Right)", state: "compare" },
        { id: "s3", value: 0, label: "cross = 0 (Collinear)", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Straddle condition: Segment 1 straddles Line(Segment 2) if P1 and Q1 lie on opposite sides of the supporting line P2Q2.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "P2", label: "P2", x: 50, y: 350, state: "active" },
        { id: "Q2", label: "Q2", x: 350, y: 50, state: "active" },
        { id: "P1", label: "P1 (Left)", x: 50, y: 50, state: "sorted" },
        { id: "Q1", label: "Q1 (Right)", x: 350, y: 350, state: "compare" },
      ],
      edges: [{ from: "P2", to: "Q2", isTraversed: true }],
    },
  },
  {
    narrative:
      "Mutual straddle requirement: Segment 2 MUST ALSO straddle Line(Segment 1) for the segments to intersect in general position.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "P1", label: "P1", x: 50, y: 50, state: "active" },
        { id: "Q1", label: "Q1", x: 350, y: 350, state: "active" },
        { id: "P2", label: "P2 (Left)", x: 50, y: 350, state: "sorted" },
        { id: "Q2", label: "Q2 (Right)", x: 350, y: 50, state: "compare" },
      ],
      edges: [{ from: "P1", to: "Q1", isPath: true }],
    },
  },
  {
    narrative:
      "When both straddle conditions hold simultaneously (d1·d2 < 0 and d3·d4 < 0), the segments strictly cross.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "P1", label: "P1", x: 50, y: 50, state: "sorted" },
        { id: "Q1", label: "Q1", x: 350, y: 350, state: "sorted" },
        { id: "P2", label: "P2", x: 50, y: 350, state: "sorted" },
        { id: "Q2", label: "Q2", x: 350, y: 50, state: "sorted" },
        { id: "INT", label: "Intersection", x: 200, y: 200, state: "active" },
      ],
      edges: [
        { from: "P1", to: "Q1", isPath: true },
        { from: "P2", to: "Q2", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Collinear boundary case: if cross products equal zero, 1D bounding box overlap tests verify whether an endpoint lies directly on the segment.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "P1", label: "P1", x: 50, y: 50, state: "active" },
        { id: "P2", label: "P2 (Collinear)", x: 150, y: 150, state: "sorted" },
        { id: "Q1", label: "Q1", x: 350, y: 350, state: "active" },
      ],
      edges: [{ from: "P1", to: "Q1", isPath: true }],
    },
  },
  {
    narrative:
      "Evaluating 4 scalar cross products completes the test in O(1) constant time using O(1) auxiliary space.",
    primarySnapshot: {
      kind: "array",
      name: "complexity_summary",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "Time: O(1)", state: "sorted" },
        { id: "c2", value: 2, label: "Space: O(1)", state: "sorted" },
      ],
    },
  },
];

export const generateLineSegmentIntersectionSteps = (
  input: LineSegmentIntersectionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const p1 = input?.segment1?.p1 ?? DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT.segment1.p1;
  const q1 = input?.segment1?.p2 ?? DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT.segment1.p2;
  const p2 = input?.segment2?.p1 ?? DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT.segment2.p1;
  const q2 = input?.segment2?.p2 ?? DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT.segment2.p2;

  const isDefaultInput =
    !input ||
    (input.segment1.p1.x === DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT.segment1.p1.x &&
      input.segment1.p1.y === DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT.segment1.p1.y);

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const crossProduct = (a: Point2D, b: Point2D, c: Point2D): number =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

  const onSegment = (p: Point2D, q: Point2D, r: Point2D): boolean =>
    q.x >= Math.min(p.x, r.x) &&
    q.x <= Math.max(p.x, r.x) &&
    q.y >= Math.min(p.y, r.y) &&
    q.y <= Math.max(p.y, r.y);

  const computeIntersectionPoint = (): Point2D | null => {
    const denom = (p1.x - q1.x) * (p2.y - q2.y) - (p1.y - q1.y) * (p2.x - q2.x);
    if (Math.abs(denom) < 1e-9) return null;
    const t = ((p1.x - p2.x) * (p2.y - q2.y) - (p1.y - p2.y) * (p2.x - q2.x)) / denom;
    const u = -((p1.x - q1.x) * (p1.y - p2.y) - (p1.y - q1.y) * (p1.x - p2.x)) / denom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: Math.round(p1.x + t * (q1.x - p1.x)),
        y: Math.round(p1.y + t * (q1.y - p1.y)),
      };
    }
    return null;
  };

  const makeGraphSnapshot = (highlightIntersection = false): GraphVisualSnapshot => {
    const nodes: GraphNodeItem[] = [
      { id: "P1", label: `P1 (${p1.x},${p1.y})`, x: p1.x, y: p1.y, state: "active" },
      { id: "Q1", label: `Q1 (${q1.x},${q1.y})`, x: q1.x, y: q1.y, state: "active" },
      { id: "P2", label: `P2 (${p2.x},${p2.y})`, x: p2.x, y: p2.y, state: "compare" },
      { id: "Q2", label: `Q2 (${q2.x},${q2.y})`, x: q2.x, y: q2.y, state: "compare" },
    ];

    const intPoint = computeIntersectionPoint();
    if (highlightIntersection && intPoint) {
      nodes.push({
        id: "INT",
        label: `Intersects (${intPoint.x},${intPoint.y})`,
        x: intPoint.x,
        y: intPoint.y,
        state: "sorted",
      });
    }

    const edges: GraphEdgeItem[] = [
      { from: "P1", to: "Q1", isPath: true },
      { from: "P2", to: "Q2", isTraversed: true },
    ];

    return { kind: "graph", nodes, edges };
  };

  addStep(
    `Initialize 2D line segment intersection test between Segment 1 [(${p1.x},${p1.y}) → (${q1.x},${q1.y})] and Segment 2 [(${p2.x},${p2.y}) → (${q2.x},${q2.y})].`,
    makeGraphSnapshot(false),
  );

  const d1 = crossProduct(p2, q2, p1);
  const d2 = crossProduct(p2, q2, q1);
  const d3 = crossProduct(p1, q1, p2);
  const d4 = crossProduct(p1, q1, q2);

  addStep(
    `Compute orientation determinants for Line(P2,Q2): d1 = cross(P2,Q2,P1) = ${d1}, d2 = cross(P2,Q2,Q1) = ${d2}.`,
    makeGraphSnapshot(false),
  );

  addStep(
    `Compute orientation determinants for Line(P1,Q1): d3 = cross(P1,Q1,P2) = ${d3}, d4 = cross(P1,Q1,Q2) = ${d4}.`,
    makeGraphSnapshot(false),
  );

  const straddle1 = (d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0);
  const straddle2 = (d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0);
  const generalIntersect = straddle1 && straddle2;

  if (generalIntersect) {
    addStep(
      `General straddle condition met! Segment 1 straddles Line(Segment 2) (${straddle1}) AND Segment 2 straddles Line(Segment 1) (${straddle2}). Segments intersect!`,
      makeGraphSnapshot(true),
    );
    return steps;
  }

  const c1 = d1 === 0 && onSegment(p2, p1, q2);
  const c2 = d2 === 0 && onSegment(p2, q1, q2);
  const c3 = d3 === 0 && onSegment(p1, p2, q1);
  const c4 = d4 === 0 && onSegment(p1, q2, q1);
  const collinearIntersect = c1 || c2 || c3 || c4;

  if (collinearIntersect) {
    addStep(
      `Collinear boundary overlap detected! Endpoint lies directly on the other segment. Segments intersect!`,
      makeGraphSnapshot(true),
    );
    return steps;
  }

  addStep(
    `Intersection test complete. Segments DO NOT intersect (general straddle = false, collinear overlap = false).`,
    makeGraphSnapshot(false),
  );

  return steps;
};

export const LINE_SEGMENT_INTERSECTION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Line Segment Intersection uses 2D vector cross-product orientation primitives to determine whether two line segments cross in <code>O(1)</code> time without relying on floating-point slope division.</p>",
  sections: [
    {
      heading: "Cross Product Orientation Primitive",
      body: "<p>The 2D cross product of vectors a → b and a → c represents the signed area of their spanned parallelogram.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Cross Product",
      definition: "Signed scalar cross(a, b, c) indicating turn orientation.",
    },
  ],
};

export const LINE_SEGMENT_INTERSECTION_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines cross_product helper function.",
    2: "Returns 2D cross product scalar.",
    3: "Defines on_segment helper function.",
    4: "Checks 1D bounding box containment.",
    5: "Defines line_segment_intersection function.",
    6: "Evaluates 4 cross products.",
    7: "Returns true if straddle or collinear conditions hold.",
  },
};

export const lineSegmentIntersection: AlgorithmDefinition<LineSegmentIntersectionInput> = {
  id: "line-segment-intersection",
  title: "Line Segment Intersection & Cross Product",
  topicIds: ["geometry_and_sweep_line"],
  difficulty: "Easy",
  description:
    "<p>Given two 2D line segments, determine whether they intersect in O(1) time using vector cross-product orientation tests.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "  <li><code>segment1</code>: First line segment <code>{ p1: {x, y}, p2: {x, y} }</code>.</li>" +
    "  <li><code>segment2</code>: Second line segment <code>{ p1: {x, y}, p2: {x, y} }</code>.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<p>Returns a boolean value (<code>true</code> if segments intersect, <code>false</code> otherwise).</p>",
  constraints: ["0 <= x, y <= 1000"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Perpendicular Intersecting Segments",
      input: DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT,
      output: "true",
      explanation: "Segments cross near center of bounding box.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Non-Intersecting Diagonal Segments",
      input: {
        segment1: { p1: { x: 0, y: 0 }, p2: { x: 100, y: 100 } },
        segment2: { p1: { x: 50, y: 0 }, p2: { x: 150, y: 50 } },
      },
      output: "false",
      explanation: "Segment lines do not straddle each other.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Collinear Non-Overlapping Segments",
      input: {
        segment1: { p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } },
        segment2: { p1: { x: 20, y: 20 }, p2: { x: 30, y: 30 } },
      },
      output: "false",
      explanation: "Collinear segments lie on same line but bounding boxes do not overlap.",
    },
  ],
  code: PYTHON_LINE_SEGMENT_INTERSECTION_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(1)",
    worst: "O(1)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Evaluating 4 scalar cross products takes constant O(1) time.",
    space: "Requires O(1) auxiliary space for scalar variables.",
  },
  topicGuide: LINE_SEGMENT_INTERSECTION_TOPIC_GUIDE,
  trivia: LINE_SEGMENT_INTERSECTION_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 29,
      label: "Competitive Programmer's Handbook, Ch 29",
    },
  ],
  defaultInput: DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT,
  generateSteps: generateLineSegmentIntersectionSteps,
};

export default lineSegmentIntersection;
