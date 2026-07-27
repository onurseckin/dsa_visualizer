import type { AlgorithmDefinition, AlgorithmStep, GraphNodeItem, GraphEdgeItem, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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

export const PYTHON_LINE_SEGMENT_INTERSECTION_CODE = `class Point:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

def cross_product(p1: Point, p2: Point, p3: Point) -> float:
    return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x)

def on_segment(p: Point, q: Point, r: Point) -> bool:
    return min(p.x, r.x) <= q.x <= max(p.x, r.x) and min(p.y, r.y) <= q.y <= max(p.y, r.y)

def do_intersect(p1: Point, q1: Point, p2: Point, q2: Point) -> bool:
    d1 = cross_product(p2, q2, p1)
    d2 = cross_product(p2, q2, q1)
    d3 = cross_product(p1, q1, p2)
    d4 = cross_product(p1, q1, q2)
    if ((d1 > 0 and d2 < 0) or (d1 < 0 and d2 > 0)) and ((d3 > 0 and d4 < 0) or (d3 < 0 and d4 > 0)):
        return True
    if d1 == 0 and on_segment(p2, p1, q2): return True
    if d2 == 0 and on_segment(p2, q1, q2): return True
    if d3 == 0 and on_segment(p1, p2, q1): return True
    if d4 == 0 and on_segment(p1, q2, q1): return True
    return False`;

export const DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT: LineSegmentIntersectionInput = {
  segment1: { p1: { x: 50, y: 50 }, p2: { x: 350, y: 350 } },
  segment2: { p1: { x: 50, y: 350 }, p2: { x: 350, y: 50 } },
};

export const generateLineSegmentIntersectionSteps = (
  input: LineSegmentIntersectionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const p1 = input.segment1?.p1 || { x: 50, y: 50 };
  const q1 = input.segment1?.p2 || { x: 350, y: 350 };
  const p2 = input.segment2?.p1 || { x: 50, y: 350 };
  const q2 = input.segment2?.p2 || { x: 350, y: 50 };

  const crossProduct = (a: Point2D, b: Point2D, c: Point2D): number => {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  };

  const onSegment = (p: Point2D, q: Point2D, r: Point2D): boolean => {
    return (
      q.x >= Math.min(p.x, r.x) &&
      q.x <= Math.max(p.x, r.x) &&
      q.y >= Math.min(p.y, r.y) &&
      q.y <= Math.max(p.y, r.y)
    );
  };

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

  const d1 = crossProduct(p2, q2, p1);
  const d2 = crossProduct(p2, q2, q1);
  const d3 = crossProduct(p1, q1, p2);
  const d4 = crossProduct(p1, q1, q2);

  let intersects = false;
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    intersects = true;
  } else if (d1 === 0 && onSegment(p2, p1, q2)) intersects = true;
  else if (d2 === 0 && onSegment(p2, q1, q2)) intersects = true;
  else if (d3 === 0 && onSegment(p1, p2, q1)) intersects = true;
  else if (d4 === 0 && onSegment(p1, q2, q1)) intersects = true;

  const intPoint = intersects ? computeIntersectionPoint() : null;

  const makeGraphSnapshot = (highlightIntersection: boolean = false) => {
    const nodes: GraphNodeItem[] = [
      { id: "P1", label: `P1 (${p1.x},${p1.y})`, x: p1.x, y: p1.y, state: "active" },
      { id: "Q1", label: `Q1 (${q1.x},${q1.y})`, x: q1.x, y: q1.y, state: "active" },
      { id: "P2", label: `P2 (${p2.x},${p2.y})`, x: p2.x, y: p2.y, state: "compare" },
      { id: "Q2", label: `Q2 (${q2.x},${q2.y})`, x: q2.x, y: q2.y, state: "compare" },
    ];

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
      { from: "P1", to: "Q1", isPath: true, weight: 1 },
      { from: "P2", to: "Q2", isTraversed: true, weight: 2 },
    ];

    return { nodes, edges };
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 12,
    explanation: {
      what: `Initializing segment intersection test for Segment 1 [P1(${p1.x},${p1.y}) -> Q1(${q1.x},${q1.y})] and Segment 2 [P2(${p2.x},${p2.y}) -> Q2(${q2.x},${q2.y})].`,
      why: "Two 2D line segments intersect if and only if endpoints of each segment straddle the line containing the other segment, or if an endpoint lies on the other segment.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(false),
    },
    auxiliaryState: {
      hashMap: {
        "Segment 1": `P1(${p1.x},${p1.y}) -> Q1(${q1.x},${q1.y})`,
        "Segment 2": `P2(${p2.x},${p2.y}) -> Q2(${q2.x},${q2.y})`,
      },
    },
    variables: { d1: 0, d2: 0, d3: 0, d4: 0 },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 13,
    explanation: {
      what: `Computed cross product orientation tests: d1=${d1}, d2=${d2}, d3=${d3}, d4=${d4}.`,
      why: "d1 & d2 test orientation of Segment 1 endpoints relative to Segment 2 line; d3 & d4 test Segment 2 endpoints relative to Segment 1 line.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(false),
    },
    auxiliaryState: {
      hashMap: {
        "d1 = (Q2-P2) x (P1-P2)": d1,
        "d2 = (Q2-P2) x (Q1-P2)": d2,
        "d3 = (Q1-P1) x (P2-P1)": d3,
        "d4 = (Q1-P1) x (Q2-P1)": d4,
        "Straddle Condition": (d1 * d2 < 0 && d3 * d4 < 0) ? "SATISFIED" : "NOT SATISFIED",
      },
    },
    variables: { d1, d2, d3, d4 },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 17,
    explanation: {
      what: `Segment Intersection Result: Segments ${intersects ? "DO INTERSECT" : "DO NOT INTERSECT"}.`,
      why: intersects
        ? intPoint
          ? `General straddle condition met. Intersection point at (${intPoint.x}, ${intPoint.y}).`
          : "Collinear / endpoint overlap detected."
        : "Endpoints do not straddle each other's supporting lines.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(intersects),
    },
    auxiliaryState: {
      hashMap: {
        "Intersects": intersects ? "YES" : "NO",
        "Intersection Point": intPoint ? `(${intPoint.x}, ${intPoint.y})` : "N/A",
      },
    },
    variables: { intersects, intersectionX: intPoint?.x ?? -1, intersectionY: intPoint?.y ?? -1 },
  });

  return steps;
};

const LINE_SEGMENT_INTERSECTION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Line Segment Intersection uses 2D vector cross products to determine whether two segments cross without requiring floating-point slope division.",
  sections: [
    {
      heading: "Cross Product Orientation Primitive",
      body: "The 2D cross product of vectors AB and AC, (B.x - A.x)*(C.y - A.y) - (B.y - A.y)*(C.x - A.x), determines whether point C lies to the left (>0), to the right (<0), or collinear (=0) with directed line AB.",
    },
    {
      heading: "The Straddle Test",
      body: "Two segments AB and CD intersect if and only if C and D lie on opposite sides of line AB (d1 and d2 have opposite signs) AND A and B lie on opposite sides of line CD (d3 and d4 have opposite signs).",
    },
  ],
  keyTerms: [
    {
      term: "Cross Product",
      definition: "Signed scalar indicating orientation and relative direction of turning between two 2D vectors.",
    },
    {
      term: "Collinear Overlap",
      definition: "Special case where cross products equal zero, requiring bounding box interval check.",
    },
  ],
};

const LINE_SEGMENT_INTERSECTION_TRIVIA: TriviaMeta = {
  lineExplanations: {
    6: "Defines 2D cross product of vector (p1->p2) with vector (p1->p3).",
    9: "Checks whether point q lies within bounding box of segment pr.",
    12: "Defines main segment intersection check using 4 cross product orientation tests.",
    13: "Computes orientation tests d1, d2, d3, d4.",
    17: "Checks general straddle condition: opposite signs for both pairs.",
    19: "Handles special collinear degenerate cases.",
    23: "Returns False if segments do not intersect.",
  },
};

export const lineSegmentIntersection: AlgorithmDefinition<LineSegmentIntersectionInput> = {
  id: "line-segment-intersection",
  title: "Line Segment Intersection & Cross Product",
  category: "geometry_and_sweep_line",
  difficulty: "Easy",
  description:
    "Determine whether two 2D line segments intersect using cross products and bounding box orientation tests.",
  constraints: [
    "0 <= x, y <= 1000",
  ],
  examples: [
    {
      kind: "basic",
      title: "Perpendicular Intersecting Segments",
      input: {
        segment1: { p1: { x: 50, y: 50 }, p2: { x: 350, y: 350 } },
        segment2: { p1: { x: 50, y: 350 }, p2: { x: 350, y: 50 } },
      },
      output: "Intersects at (200, 200)",
      explanation: "Segments cross near center of bounding box.",
    },
    {
      kind: "complex",
      title: "Non-intersecting diagonal segments",
      input: {
        segment1: { p1: { x: 0, y: 0 }, p2: { x: 100, y: 100 } },
        segment2: { p1: { x: 50, y: 0 }, p2: { x: 150, y: 50 } },
      },
      output: "Does Not Intersect",
      explanation: "Segment lines do not straddle each other.",
    },
    {
      kind: "negative",
      title: "Collinear Non-overlapping Segments",
      input: {
        segment1: { p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } },
        segment2: { p1: { x: 20, y: 20 }, p2: { x: 30, y: 30 } },
      },
      output: "Does Not Intersect",
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
    space: "Requires O(1) auxiliary variables.",
  },
  topicGuide: LINE_SEGMENT_INTERSECTION_TOPIC_GUIDE,
  trivia: LINE_SEGMENT_INTERSECTION_TRIVIA,
    sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 29",
      label: "Competitive Programmer's Handbook, Ch 29",
    },
  ],
  defaultInput: DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT,
  generateSteps: generateLineSegmentIntersectionSteps,
};
