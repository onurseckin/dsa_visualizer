import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphNodeItem,
  GraphEdgeItem,
  TopicGuide,
} from "../../types/dsa";
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

export const PYTHON_LINE_SEGMENT_INTERSECTION_CODE = `
def cross_product(a: tuple[float, float], b: tuple[float, float], c: tuple[float, float]) -> float:
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

def on_segment(p: tuple[float, float], q: tuple[float, float], r: tuple[float, float]) -> bool:
    return (q[0] >= min(p[0], r[0]) and q[0] <= max(p[0], r[0]) and
            q[1] >= min(p[1], r[1]) and q[1] <= max(p[1], r[1]))

def line_segment_intersection(seg1: tuple[tuple[float, float], tuple[float, float]],
                               seg2: tuple[tuple[float, float], tuple[float, float]]) -> bool:
    """
    Determines if two line segments seg1=(p1, q1) and seg2=(p2, q2) intersect.
    """
    p1, q1 = seg1
    p2, q2 = seg2

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
    return False
`;

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

  const makeGraphSnapshot = (highlightIntersection = false) => {
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
      { from: "P1", to: "Q1", isPath: true, weight: 1 },
      { from: "P2", to: "Q2", isTraversed: true, weight: 2 },
    ];

    return { nodes, edges };
  };

  // Step 0: Entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 9,
    explanation: {
      what: `Initializing 2D line segment intersection test.`,
      why: "We will compute four 2D cross product orientation tests to determine if segments straddle each other's supporting lines.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: {
        "Segment 1": `P1(${p1.x},${p1.y}) -> Q1(${q1.x},${q1.y})`,
        "Segment 2": `P2(${p2.x},${p2.y}) -> Q2(${q2.x},${q2.y})`,
      },
    },
    variables: {},
  });

  // Step 1: Unpack seg1
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 14,
    explanation: {
      what: `Unpacking Segment 1 endpoints: P1(${p1.x}, ${p1.y}), Q1(${q1.x}, ${q1.y}).`,
      why: "Segment 1 defined by vector Q1 - P1.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { "P1": `(${p1.x},${p1.y})`, "Q1": `(${q1.x},${q1.y})` },
    },
    variables: { p1_x: p1.x, p1_y: p1.y, q1_x: q1.x, q1_y: q1.y },
  });

  // Step 2: Unpack seg2
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 15,
    explanation: {
      what: `Unpacking Segment 2 endpoints: P2(${p2.x}, ${p2.y}), Q2(${q2.x}, ${q2.y}).`,
      why: "Segment 2 defined by vector Q2 - P2.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { "P2": `(${p2.x},${p2.y})`, "Q2": `(${q2.x},${q2.y})` },
    },
    variables: { p2_x: p2.x, p2_y: p2.y, q2_x: q2.x, q2_y: q2.y },
  });

  // Step 3: Compute d1 step 1
  const dx2 = q2.x - p2.x;
  const dy2 = q2.y - p2.y;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 17,
    explanation: {
      what: `Evaluating direction vector for Segment 2: (Q2 - P2) = (${dx2}, ${dy2}).`,
      why: "Preparing base vector for orientation tests d1 and d2.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { "Vector Q2-P2": `(${dx2}, ${dy2})` },
    },
    variables: { dx2, dy2 },
  });

  // Step 4: Compute d1 step 2
  const d1 = crossProduct(p2, q2, p1);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 17,
    explanation: {
      what: `Computed d1 = cross(P2, Q2, P1) = ${d1}.`,
      why: `Sign of d1 (${d1 > 0 ? "positive / left" : d1 < 0 ? "negative / right" : "collinear"}) indicates turn direction from Line(P2, Q2) to P1.`,
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { "d1 = cross(P2, Q2, P1)": d1 },
    },
    variables: { d1 },
  });

  // Step 5: Compute d2
  const d2 = crossProduct(p2, q2, q1);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 18,
    explanation: {
      what: `Computed d2 = cross(P2, Q2, Q1) = ${d2}.`,
      why: `Sign of d2 (${d2 > 0 ? "positive / left" : d2 < 0 ? "negative / right" : "collinear"}) indicates turn direction from Line(P2, Q2) to Q1.`,
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { "d1": d1, "d2 = cross(P2, Q2, Q1)": d2 },
    },
    variables: { d1, d2 },
  });

  // Step 6: Test straddle of Seg1 across Line2
  const straddle1 = (d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 18,
    explanation: {
      what: `Check Segment 1 straddle: d1 * d2 < 0 is ${straddle1 ? "TRUE" : "FALSE"}.`,
      why: straddle1
        ? "Endpoints P1 and Q1 lie on opposite sides of Line(P2, Q2)."
        : "Endpoints P1 and Q1 lie on the same side of Line(P2, Q2).",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { "Straddle Seg1 across Line2": straddle1 ? "YES" : "NO" },
    },
    variables: { d1, d2, straddle1 },
  });

  // Step 7: Compute d3 vector
  const dx1 = q1.x - p1.x;
  const dy1 = q1.y - p1.y;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: `Evaluating direction vector for Segment 1: (Q1 - P1) = (${dx1}, ${dy1}).`,
      why: "Preparing base vector for orientation tests d3 and d4.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { "Vector Q1-P1": `(${dx1}, ${dy1})` },
    },
    variables: { dx1, dy1 },
  });

  // Step 8: Compute d3
  const d3 = crossProduct(p1, q1, p2);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: `Computed d3 = cross(P1, Q1, P2) = ${d3}.`,
      why: `Sign of d3 (${d3 > 0 ? "positive / left" : d3 < 0 ? "negative / right" : "collinear"}) indicates turn direction from Line(P1, Q1) to P2.`,
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { "d1": d1, "d2": d2, "d3 = cross(P1, Q1, P2)": d3 },
    },
    variables: { d1, d2, d3 },
  });

  // Step 9: Compute d4
  const d4 = crossProduct(p1, q1, q2);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 20,
    explanation: {
      what: `Computed d4 = cross(P1, Q1, Q2) = ${d4}.`,
      why: `Sign of d4 (${d4 > 0 ? "positive / left" : d4 < 0 ? "negative / right" : "collinear"}) indicates turn direction from Line(P1, Q1) to Q2.`,
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { "d1": d1, "d2": d2, "d3": d3, "d4 = cross(P1, Q1, Q2)": d4 },
    },
    variables: { d1, d2, d3, d4 },
  });

  // Step 10: Test straddle of Seg2 across Line1
  const straddle2 = (d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 20,
    explanation: {
      what: `Check Segment 2 straddle: d3 * d4 < 0 is ${straddle2 ? "TRUE" : "FALSE"}.`,
      why: straddle2
        ? "Endpoints P2 and Q2 lie on opposite sides of Line(P1, Q1)."
        : "Endpoints P2 and Q2 lie on the same side of Line(P1, Q1).",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { "Straddle Seg2 across Line1": straddle2 ? "YES" : "NO" },
    },
    variables: { d3, d4, straddle2 },
  });

  // Step 11: Evaluate general intersection condition
  const generalIntersect = straddle1 && straddle2;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 22,
    explanation: {
      what: `Evaluating general straddle condition: (straddle1 && straddle2) is ${generalIntersect ? "TRUE" : "FALSE"}.`,
      why: generalIntersect
        ? "Both segments mutually straddle each other's supporting lines — segments intersect!"
        : "General straddle condition not satisfied. Checking collinear boundary cases.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { "General Intersection": generalIntersect ? "YES" : "NO" },
    },
    variables: { generalIntersect },
  });

  // Step 12: Collinear check d1 == 0
  const c1 = d1 === 0 && onSegment(p2, p1, q2);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 24,
    explanation: {
      what: `Checking collinear case 1: d1 == 0 && on_segment(P2, P1, Q2) -> ${c1 ? "TRUE" : "FALSE"}.`,
      why: "P1 is collinear with Segment 2 and lies within its bounding box.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { "Collinear Case 1": c1 ? "YES" : "NO" },
    },
    variables: { c1 },
  });

  // Step 13: Collinear check d2 == 0
  const c2 = d2 === 0 && onSegment(p2, q1, q2);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 25,
    explanation: {
      what: `Checking collinear case 2: d2 == 0 && on_segment(P2, Q1, Q2) -> ${c2 ? "TRUE" : "FALSE"}.`,
      why: "Q1 is collinear with Segment 2 and lies within its bounding box.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { "Collinear Case 2": c2 ? "YES" : "NO" },
    },
    variables: { c2 },
  });

  // Step 14: Collinear check d3 == 0
  const c3 = d3 === 0 && onSegment(p1, p2, q1);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 26,
    explanation: {
      what: `Checking collinear case 3: d3 == 0 && on_segment(P1, P2, Q1) -> ${c3 ? "TRUE" : "FALSE"}.`,
      why: "P2 is collinear with Segment 1 and lies within its bounding box.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { "Collinear Case 3": c3 ? "YES" : "NO" },
    },
    variables: { c3 },
  });

  // Step 15: Collinear check d4 == 0
  const c4 = d4 === 0 && onSegment(p1, q2, q1);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 27,
    explanation: {
      what: `Checking collinear case 4: d4 == 0 && on_segment(P1, Q2, Q1) -> ${c4 ? "TRUE" : "FALSE"}.`,
      why: "Q2 is collinear with Segment 1 and lies within its bounding box.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { "Collinear Case 4": c4 ? "YES" : "NO" },
    },
    variables: { c4 },
  });

  const intersects = generalIntersect || c1 || c2 || c3 || c4;
  const intPoint = intersects ? computeIntersectionPoint() : null;

  // Step 16: Parametric t computation
  const denom = (p1.x - q1.x) * (p2.y - q2.y) - (p1.y - q1.y) * (p2.x - q2.x);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 22,
    explanation: {
      what: `Evaluating parametric system determinant: denom = ${denom}.`,
      why: "Parametric ray equations yield non-zero denominator when lines are not parallel.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { "Determinant Denom": denom },
    },
    variables: { denom },
  });

  // Step 17: Solve intersection coordinates
  if (intPoint) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 23,
      explanation: {
        what: `Solved parametric intersection coordinates: (${intPoint.x}, ${intPoint.y}).`,
        why: "Point of intersection calculated via vector interpolation P1 + t*(Q1 - P1).",
      },
      primarySnapshot: { kind: "graph", ...makeGraphSnapshot(true) },
      auxiliaryState: {
        hashMap: { "Intersection Point": `(${intPoint.x}, ${intPoint.y})` },
      },
      variables: { intX: intPoint.x, intY: intPoint.y },
    });
  } else {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 28,
      explanation: {
        what: "No intersection point found.",
        why: "Segments are disjoint or parallel with no overlap.",
      },
      primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
      auxiliaryState: {
        hashMap: { "Intersection Point": "None" },
      },
      variables: {},
    });
  }

  // Step 18: Final result
  steps.push({
    stepIndex: stepIndex++,
    codeLine: intersects ? 23 : 28,
    explanation: {
      what: `Final Result: Line segments ${intersects ? "INTERSECT" : "DO NOT INTERSECT"}.`,
      why: intersects
        ? "Line segment intersection confirmed by exact orientation tests."
        : "Segments fail both general straddle condition and collinear boundary checks.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(intersects) },
    auxiliaryState: {
      hashMap: {
        Result: intersects ? "INTERSECT" : "NO INTERSECTION",
        "Point": intPoint ? `(${intPoint.x}, ${intPoint.y})` : "N/A",
      },
    },
    variables: { intersects, intersectionX: intPoint?.x ?? -1, intersectionY: intPoint?.y ?? -1 },
  });

  return steps;
};

export const LINE_SEGMENT_INTERSECTION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Line Segment Intersection uses 2D vector cross-product orientation primitives to determine whether two line segments cross in $\\mathcal{O}(1)$ time without relying on floating-point slope division.",
  sections: [
    {
      heading: "Cross Product Orientation Primitive",
      body: "The 2D cross product of vectors $\\mathbf{a} \\to \\mathbf{b}$ and $\\mathbf{a} \\to \\mathbf{c}$ represents the signed area of their spanned parallelogram:\n$$\\text{cross}(\\mathbf{a}, \\mathbf{b}, \\mathbf{c}) = (b_x - a_x)(c_y - a_y) - (b_y - a_y)(c_x - a_x)$$\n1. $\\text{cross} > 0$: Point $C$ lies to the left (counter-clockwise turn).\n2. $\\text{cross} < 0$: Point $C$ lies to the right (clockwise turn).\n3. $\\text{cross} = 0$: Points $A, B, C$ are collinear.",
    },
    {
      heading: "The Straddle Test Condition",
      body: "Two line segments $S_1 = (P_1, Q_1)$ and $S_2 = (P_2, Q_2)$ intersect in general position if and only if:\n1. Endpoints $P_1, Q_1$ lie on opposite sides of line $P_2 Q_2$ ($d_1 \\cdot d_2 < 0$).\n2. Endpoints $P_2, Q_2$ lie on opposite sides of line $P_1 Q_1$ ($d_3 \\cdot d_4 < 0$).",
    },
    {
      heading: "Handling Collinear Degeneracies",
      body: "When cross product equals zero, the points are collinear. Two collinear segments intersect if and only if their 1D bounding box projections along both $X$ and $Y$ axes overlap ($\text{on\\_segment}$).",
    },
    {
      heading: "Parametric Intersection Point Computation",
      body: "When segments straddle, the exact intersection point $\\mathbf{P}(t) = P_1 + t(Q_1 - P_1)$ is derived by solving linear parameter system $t, u \\in [0, 1]$, avoiding division by zero for vertical lines.",
    },
    {
      heading: "Robust Exact Arithmetic Engine",
      body: "Testing signs of integer cross products avoids floating-point precision drift and epsilon tolerances, forming the core primitive of computational geometry engines (CGAL, GEOS).",
    },
  ],
  keyTerms: [
    {
      term: "Cross Product",
      definition:
        "Signed scalar $\\text{cross}(\\mathbf{a}, \\mathbf{b}, \\mathbf{c})$ indicating turn orientation.",
    },
    {
      term: "Straddle Condition",
      definition:
        "Logical predicate ensuring each line segment straddles the supporting line of the other segment.",
    },
    {
      term: "Collinear Overlap",
      definition:
        "Special case where cross products equal zero, requiring 1D bounding box projection checks.",
    },
    {
      term: "Orientation Primitive",
      definition:
        "Basic geometric operation returning left, right, or collinear turn direction.",
    },
  ],
};

export const LINE_SEGMENT_INTERSECTION_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Empty leading line for code formatting.",
    2: "Defines cross_product helper function calculating (b.x-a.x)*(c.y-a.y) - (b.y-a.y)*(c.x-a.x).",
    3: "Returns 2D cross product scalar.",
    4: "Empty line for formatting.",
    5: "Defines on_segment helper function for 1D bounding box containment check.",
    6: "Checks if point q x-coordinate lies within bounding box of segment pr.",
    7: "Checks if point q y-coordinate lies within bounding box of segment pr.",
    8: "Empty line for formatting.",
    9: "Defines line_segment_intersection function signature taking two segments.",
    10: "Function signature continued.",
    11: "Opening docstring tag.",
    12: "Docstring describing line segment intersection algorithm.",
    13: "Closing docstring tag.",
    14: "Unpacks endpoints p1, q1 from first segment.",
    15: "Unpacks endpoints p2, q2 from second segment.",
    16: "Empty line for formatting.",
    17: "Computes orientation d1 of p1 relative to Line(p2, q2).",
    18: "Computes orientation d2 of q1 relative to Line(p2, q2).",
    19: "Computes orientation d3 of p2 relative to Line(p1, q1).",
    20: "Computes orientation d4 of q2 relative to Line(p1, q1).",
    21: "Empty line for formatting.",
    22: "Checks general straddle condition: opposite signs for both pairs.",
    23: "Returns True if general straddle condition is met.",
    24: "Checks collinear case for p1 on segment (p2, q2).",
    25: "Checks collinear case for q1 on segment (p2, q2).",
    26: "Checks collinear case for p2 on segment (p1, q1).",
    27: "Checks collinear case for q2 on segment (p1, q1).",
    28: "Returns False if segments do not intersect.",
    29: "Empty trailing line for code formatting.",
  },
};

export const lineSegmentIntersection: AlgorithmDefinition<LineSegmentIntersectionInput> = {
  id: "line-segment-intersection",
  title: "Line Segment Intersection & Cross Product",
  category: "geometry_and_sweep_line",
  categories: ["geometry_and_sweep_line"],
  difficulty: "Easy",
  description:
    "Determine whether two 2D line segments $S_1 = (P_1, Q_1)$ and $S_2 = (P_2, Q_2)$ intersect in $\\mathcal{O}(1)$ time using vector cross-product orientation tests:\n\n$$\\text{cross}(\\mathbf{a}, \\mathbf{b}, \\mathbf{c}) = (b_x - a_x)(c_y - a_y) - (b_y - a_y)(c_x - a_x)$$\n\n### Graph Snapshot Representation\nThe line segments and active orientation vectors are rendered on a 2D graph coordinate plane.\n\n### Input Parameters\n- `segment1` (`LineSegment`): First 2D line segment $(P_1, Q_1)$.\n- `segment2` (`LineSegment`): Second 2D line segment $(P_2, Q_2)$.\n\n### Output\n- `bool`: `true` if segments intersect, `false` otherwise.\n\n### Edge Cases & Constraints\n- Collinear Overlap: Handled via bounding box interval tests.\n- Parallel Disjoint Segments: Return `false`.",
  constraints: ["0 <= x, y <= 1000"],
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
    time: "Evaluating 4 scalar cross products takes constant $\\mathcal{O}(1)$ time.",
    space: "Requires $\\mathcal{O}(1)$ auxiliary space for scalar variables.",
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
