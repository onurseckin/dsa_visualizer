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

  const p1 =
    input && input.segment1 && input.segment1.p1
      ? input.segment1.p1
      : DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT.segment1.p1;
  const q1 =
    input && input.segment1 && input.segment1.p2
      ? input.segment1.p2
      : DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT.segment1.p2;
  const p2 =
    input && input.segment2 && input.segment2.p1
      ? input.segment2.p1
      : DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT.segment2.p1;
  const q2 =
    input && input.segment2 && input.segment2.p2
      ? input.segment2.p2
      : DEFAULT_LINE_SEGMENT_INTERSECTION_INPUT.segment2.p2;

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

  // Step 0: Entry into line_segment_intersection
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 9,
    explanation: {
      what: `Initialize 2D line segment intersection test for Segment 1 [(${p1.x},${p1.y}) → (${q1.x},${q1.y})] and Segment 2 [(${p2.x},${p2.y}) → (${q2.x},${q2.y})].`,
      why: "We compute 2D cross-product orientation determinants to test if each segment straddles the supporting line of the other.",
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

  // Step 1: Unpack seg1 (line 11)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: `Unpack Segment 1 endpoint coordinates: P1(${p1.x}, ${p1.y}), Q1(${q1.x}, ${q1.y}).`,
      why: "Establishing vector endpoints for the first line segment.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { P1: `(${p1.x},${p1.y})`, Q1: `(${q1.x},${q1.y})` },
    },
    variables: { "P1.x": p1.x, "P1.y": p1.y, "Q1.x": q1.x, "Q1.y": q1.y },
  });

  // Step 2: Unpack seg2 (line 12)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 12,
    explanation: {
      what: `Unpack Segment 2 endpoint coordinates: P2(${p2.x}, ${p2.y}), Q2(${q2.x}, ${q2.y}).`,
      why: "Establishing vector endpoints for the second line segment.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: { P2: `(${p2.x},${p2.y})`, Q2: `(${q2.x},${q2.y})` },
    },
    variables: { "P2.x": p2.x, "P2.y": p2.y, "Q2.x": q2.x, "Q2.y": q2.y },
  });

  const d1 = crossProduct(p2, q2, p1);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 14,
    explanation: {
      what: `Compute orientation determinant d1 = cross(P2, Q2, P1) = ${d1}.`,
      why: "The 2D cross product sign reveals whether P1 lies to the left (positive), right (negative), or collinear (zero) relative to directed line P2 → Q2.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: {
        d1: d1.toString(),
        "P1 Orientation": d1 > 0 ? "Left (+)" : d1 < 0 ? "Right (-)" : "Collinear (0)",
      },
    },
    variables: { d1 },
  });

  const d2 = crossProduct(p2, q2, q1);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 15,
    explanation: {
      what: `Compute orientation determinant d2 = cross(P2, Q2, Q1) = ${d2}.`,
      why: "Evaluates the orientation of Q1 relative to directed line P2 → Q2.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: {
        d2: d2.toString(),
        "Q1 Orientation": d2 > 0 ? "Left (+)" : d2 < 0 ? "Right (-)" : "Collinear (0)",
      },
    },
    variables: { d2 },
  });

  const d3 = crossProduct(p1, q1, p2);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: `Compute orientation determinant d3 = cross(P1, Q1, P2) = ${d3}.`,
      why: "Evaluates the orientation of P2 relative to directed line P1 → Q1.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: {
        d3: d3.toString(),
        "P2 Orientation": d3 > 0 ? "Left (+)" : d3 < 0 ? "Right (-)" : "Collinear (0)",
      },
    },
    variables: { d3 },
  });

  const d4 = crossProduct(p1, q1, q2);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 17,
    explanation: {
      what: `Compute orientation determinant d4 = cross(P1, Q1, Q2) = ${d4}.`,
      why: "Evaluates the orientation of Q2 relative to directed line P1 → Q1.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: {
        d4: d4.toString(),
        "Q2 Orientation": d4 > 0 ? "Left (+)" : d4 < 0 ? "Right (-)" : "Collinear (0)",
      },
    },
    variables: { d4 },
  });

  const straddle1 = (d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0);
  const straddle2 = (d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0);
  const generalIntersect = straddle1 && straddle2;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: `Evaluate general straddle condition: Seg1 straddles Line(Seg2): ${straddle1}, Seg2 straddles Line(Seg1): ${straddle2}. Result = ${generalIntersect}.`,
      why: "Two non-collinear segments intersect if and only if endpoints of each segment lie on opposite sides of the other segment's supporting line.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(generalIntersect) },
    auxiliaryState: {
      hashMap: {
        "d1, d2 Opposite Signs": straddle1 ? "YES" : "NO",
        "d3, d4 Opposite Signs": straddle2 ? "YES" : "NO",
        "General Intersection": generalIntersect ? "YES" : "NO",
      },
    },
    variables: { d1, d2, d3, d4, straddle1, straddle2, generalIntersect },
  });

  if (generalIntersect) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 20,
      explanation: {
        what: "General straddle condition met! Returning True.",
        why: "Both segments cross each other's supporting lines in general 2D position.",
      },
      primarySnapshot: { kind: "graph", ...makeGraphSnapshot(true) },
      auxiliaryState: {
        hashMap: { Result: "INTERSECT (General Position)" },
      },
      variables: { intersects: true, d1, d2, d3, d4 },
    });
    return steps;
  }

  // Collinear boundary tests
  const c1 = d1 === 0 && onSegment(p2, p1, q2);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 21,
    explanation: {
      what: `Test collinear boundary case for P1: d1 == 0 (${d1 === 0}) and P1 on Segment 2 (${c1}).`,
      why: "If P1 is collinear with Segment 2, verify 1D bounding box inclusion.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(c1) },
    auxiliaryState: {
      hashMap: { "d1 == 0 & P1 on Seg2": c1 ? "YES" : "NO" },
    },
    variables: { d1, c1 },
  });

  if (c1) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 21,
      explanation: {
        what: `Collinear overlap detected at P1 (${p1.x}, ${p1.y})! Returning True.`,
        why: "Endpoint P1 lies directly on Segment 2.",
      },
      primarySnapshot: { kind: "graph", ...makeGraphSnapshot(true) },
      auxiliaryState: {
        hashMap: { Result: "INTERSECT (Collinear P1)" },
      },
      variables: { intersects: true, d1, d2, d3, d4 },
    });
    return steps;
  }

  const c2 = d2 === 0 && onSegment(p2, q1, q2);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 22,
    explanation: {
      what: `Test collinear boundary case for Q1: d2 == 0 (${d2 === 0}) and Q1 on Segment 2 (${c2}).`,
      why: "If Q1 is collinear with Segment 2, verify 1D bounding box inclusion.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(c2) },
    auxiliaryState: {
      hashMap: { "d2 == 0 & Q1 on Seg2": c2 ? "YES" : "NO" },
    },
    variables: { d2, c2 },
  });

  if (c2) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 22,
      explanation: {
        what: `Collinear overlap detected at Q1 (${q1.x}, ${q1.y})! Returning True.`,
        why: "Endpoint Q1 lies directly on Segment 2.",
      },
      primarySnapshot: { kind: "graph", ...makeGraphSnapshot(true) },
      auxiliaryState: {
        hashMap: { Result: "INTERSECT (Collinear Q1)" },
      },
      variables: { intersects: true, d1, d2, d3, d4 },
    });
    return steps;
  }

  const c3 = d3 === 0 && onSegment(p1, p2, q1);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 23,
    explanation: {
      what: `Test collinear boundary case for P2: d3 == 0 (${d3 === 0}) and P2 on Segment 1 (${c3}).`,
      why: "If P2 is collinear with Segment 1, verify 1D bounding box inclusion.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(c3) },
    auxiliaryState: {
      hashMap: { "d3 == 0 & P2 on Seg1": c3 ? "YES" : "NO" },
    },
    variables: { d3, c3 },
  });

  if (c3) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 23,
      explanation: {
        what: `Collinear overlap detected at P2 (${p2.x}, ${p2.y})! Returning True.`,
        why: "Endpoint P2 lies directly on Segment 1.",
      },
      primarySnapshot: { kind: "graph", ...makeGraphSnapshot(true) },
      auxiliaryState: {
        hashMap: { Result: "INTERSECT (Collinear P2)" },
      },
      variables: { intersects: true, d1, d2, d3, d4 },
    });
    return steps;
  }

  const c4 = d4 === 0 && onSegment(p1, q2, q1);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 24,
    explanation: {
      what: `Test collinear boundary case for Q2: d4 == 0 (${d4 === 0}) and Q2 on Segment 1 (${c4}).`,
      why: "If Q2 is collinear with Segment 1, verify 1D bounding box inclusion.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(c4) },
    auxiliaryState: {
      hashMap: { "d4 == 0 & Q2 on Seg1": c4 ? "YES" : "NO" },
    },
    variables: { d4, c4 },
  });

  if (c4) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 24,
      explanation: {
        what: `Collinear overlap detected at Q2 (${q2.x}, ${q2.y})! Returning True.`,
        why: "Endpoint Q2 lies directly on Segment 1.",
      },
      primarySnapshot: { kind: "graph", ...makeGraphSnapshot(true) },
      auxiliaryState: {
        hashMap: { Result: "INTERSECT (Collinear Q2)" },
      },
      variables: { intersects: true, d1, d2, d3, d4 },
    });
    return steps;
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 25,
    explanation: {
      what: "Final Result: Line segments DO NOT intersect. Returning False.",
      why: "Segments fail both general straddle condition and all collinear boundary overlap tests.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot(false) },
    auxiliaryState: {
      hashMap: {
        Result: "NO INTERSECTION",
      },
    },
    variables: { intersects: false, d1, d2, d3, d4 },
  });

  return steps;
};

export const LINE_SEGMENT_INTERSECTION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Line Segment Intersection uses 2D vector cross-product orientation primitives to determine whether two line segments cross in <code>O(1)</code> time without relying on floating-point slope division.</p>",
  sections: [
    {
      heading: "Cross Product Orientation Primitive",
      body: "<p>The 2D cross product of vectors a → b and a → c represents the signed area of their spanned parallelogram: <code>cross(a, b, c) = (b_x - a_x)(c_y - a_y) - (b_y - a_y)(c_x - a_x)</code>. Positive cross product indicates point C lies to the left (counter-clockwise turn), negative indicates right turn, and zero indicates collinear points.</p>",
    },
    {
      heading: "The Straddle Test Condition",
      body: "<p>Two line segments S₁ = (P₁, Q₁) and S₂ = (P₂, Q₂) intersect in general position if and only if endpoints P₁, Q₁ lie on opposite sides of line P₂Q₂ (d₁ · d₂ &lt; 0) and endpoints P₂, Q₂ lie on opposite sides of line P₁Q₁ (d₃ · d₄ &lt; 0).</p>",
    },
    {
      heading: "Handling Collinear Degeneracies",
      body: "<p>When cross product equals zero, the points are collinear. Two collinear segments intersect if and only if their 1D bounding box projections along both X and Y axes overlap.</p>",
    },
    {
      heading: "Parametric Intersection Point Computation",
      body: "<p>When segments straddle, the exact intersection point P(t) = P₁ + t(Q₁ - P₁) is derived by solving the linear parameter system for t, u ∈ [0, 1], avoiding division by zero for vertical lines.</p>",
    },
    {
      heading: "Robust Exact Arithmetic Engine",
      body: "<p>Testing signs of integer cross products avoids floating-point precision drift and epsilon tolerances, forming the core primitive of computational geometry engines.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Cross Product",
      definition: "Signed scalar cross(a, b, c) indicating turn orientation.",
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
      definition: "Basic geometric operation returning left, right, or collinear turn direction.",
    },
  ],
};

export const LINE_SEGMENT_INTERSECTION_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Empty leading line for code formatting.",
    2: "Defines cross_product helper function calculating (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]).",
    3: "Returns 2D cross product scalar.",
    4: "Empty line for formatting.",
    5: "Defines on_segment helper function for 1D bounding box containment check.",
    6: "Checks if point q x-coordinate lies within bounding box of segment pr.",
    7: "Checks if point q y-coordinate lies within bounding box of segment pr.",
    8: "Empty line for formatting.",
    9: "Defines line_segment_intersection function signature taking two segments.",
    10: "Function signature continued.",
    11: "Unpacks endpoints p1, q1 from first segment.",
    12: "Unpacks endpoints p2, q2 from second segment.",
    13: "Empty line for formatting.",
    14: "Computes orientation d1 of p1 relative to Line(p2, q2).",
    15: "Computes orientation d2 of q1 relative to Line(p2, q2).",
    16: "Computes orientation d3 of p2 relative to Line(p1, q1).",
    17: "Computes orientation d4 of q2 relative to Line(p1, q1).",
    18: "Empty line for formatting.",
    19: "Checks general straddle condition: opposite signs for both pairs.",
    20: "Returns True if general straddle condition is met.",
    21: "Checks collinear case for p1 on segment (p2, q2).",
    22: "Checks collinear case for q1 on segment (p2, q2).",
    23: "Checks collinear case for p2 on segment (p1, q1).",
    24: "Checks collinear case for q2 on segment (p1, q1).",
    25: "Returns False if segments do not intersect.",
    26: "Empty trailing line for code formatting.",
  },
};

export const lineSegmentIntersection: AlgorithmDefinition<LineSegmentIntersectionInput> = {
  id: "line-segment-intersection",
  title: "Line Segment Intersection & Cross Product",
  topicIds: ["geometry_and_sweep_line"],
  difficulty: "Easy",
  description:
    "<p>Determine whether two 2D line segments <code>S₁ = (P₁, Q₁)</code> and <code>S₂ = (P₂, Q₂)</code> intersect in <code>O(1)</code> time using vector cross-product orientation tests:</p><p><code>cross(a, b, c) = (b_x - a_x)(c_y - a_y) - (b_y - a_y)(c_x - a_x)</code></p><h3>Graph Snapshot Representation</h3><p>The line segments and active orientation vectors are rendered on a 2D graph coordinate plane.</p><h3>Input Parameters</h3><ul><li><code>segment1</code> (<code>LineSegment</code>): First 2D line segment (P₁, Q₁).</li><li><code>segment2</code> (<code>LineSegment</code>): Second 2D line segment (P₂, Q₂).</li></ul><h3>Output</h3><ul><li><code>bool</code>: <code>true</code> if segments intersect, <code>false</code> otherwise.</li></ul>",
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
    time: "Evaluating 4 scalar cross products takes constant O(1) time.",
    space: "Requires O(1) auxiliary space for scalar variables.",
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
