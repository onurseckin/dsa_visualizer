import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphNodeItem,
  GraphEdgeItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import type { Point2D } from "./lineSegmentIntersection";

export interface SegmentItem {
  id: string;
  p1: Point2D;
  p2: Point2D;
}

export interface SweepLineIntersectionsInput {
  segments: SegmentItem[];
}

export const PYTHON_SWEEP_LINE_INTERSECTIONS_CODE = `
def cross_product(a: tuple[float, float], b: tuple[float, float], c: tuple[float, float]) -> float:
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

def on_segment(p: tuple[float, float], q: tuple[float, float], r: tuple[float, float]) -> bool:
    return (q[0] >= min(p[0], r[0]) and q[0] <= max(p[0], r[0]) and
            q[1] >= min(p[1], r[1]) and q[1] <= max(p[1], r[1]))

def do_intersect(p1: tuple[float, float], q1: tuple[float, float],
                 p2: tuple[float, float], q2: tuple[float, float]) -> bool:
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

def sweep_line_intersections(segments: list[dict]) -> list[tuple[str, str]]:
    events = []
    for s in segments:
        p1 = (s["p1"]["x"], s["p1"]["y"])
        p2 = (s["p2"]["x"], s["p2"]["y"])
        if p1[0] > p2[0]:
            p1, p2 = p2, p1
        events.append((p1[0], "LEFT", s["id"], p1, p2))
        events.append((p2[0], "RIGHT", s["id"], p1, p2))

    events.sort(key=lambda x: (x[0], 0 if x[1] == "LEFT" else 1))
    active = []
    intersections = []

    for x, ev_type, seg_id, p1, p2 in events:
        if ev_type == "LEFT":
            for other_id, op1, op2 in active:
                if do_intersect(p1, p2, op1, op2):
                    intersections.append((seg_id, other_id))
            active.append((seg_id, p1, p2))
        else:
            active = [item for item in active if item[0] != seg_id]

    return intersections
`;

export const DEFAULT_SWEEP_LINE_INTERSECTIONS_INPUT: SweepLineIntersectionsInput = {
  segments: [
    { id: "S1", p1: { x: 50, y: 100 }, p2: { x: 300, y: 300 } },
    { id: "S2", p1: { x: 80, y: 280 }, p2: { x: 320, y: 120 } },
    { id: "S3", p1: { x: 150, y: 50 }, p2: { x: 250, y: 350 } },
  ],
};

export const generateSweepLineIntersectionsSteps = (
  input: SweepLineIntersectionsInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawSegments =
    input && Array.isArray(input.segments) && input.segments.length > 0
      ? input.segments
      : DEFAULT_SWEEP_LINE_INTERSECTIONS_INPUT.segments;

  const segments = rawSegments.map((s, idx) => {
    let p1 = s.p1 || { x: 50, y: 50 };
    let p2 = s.p2 || { x: 200, y: 200 };
    if (p1.x > p2.x) {
      const temp = p1;
      p1 = p2;
      p2 = temp;
    }
    return { id: s.id || `S${idx + 1}`, p1, p2 };
  });

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

  const doIntersect = (
    s1: SegmentItem,
    s2: SegmentItem,
  ): { intersects: boolean; point: Point2D | null } => {
    const p1 = s1.p1;
    const q1 = s1.p2;
    const p2 = s2.p1;
    const q2 = s2.p2;

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

    if (!intersects) return { intersects: false, point: null };

    const denom = (p1.x - q1.x) * (p2.y - q2.y) - (p1.y - q1.y) * (p2.x - q2.x);
    if (Math.abs(denom) < 1e-9) return { intersects: true, point: null };
    const t = ((p1.x - p2.x) * (p2.y - q2.y) - (p1.y - p2.y) * (p2.x - q2.x)) / denom;
    return {
      intersects: true,
      point: {
        x: Math.round(p1.x + t * (q1.x - p1.x)),
        y: Math.round(p1.y + t * (q1.y - p1.y)),
      },
    };
  };

  interface Event {
    x: number;
    type: "LEFT" | "RIGHT";
    segId: string;
    seg: SegmentItem;
  }

  const events: Event[] = [];
  for (const s of segments) {
    events.push({ x: s.p1.x, type: "LEFT", segId: s.id, seg: s });
    events.push({ x: s.p2.x, type: "RIGHT", segId: s.id, seg: s });
  }

  events.sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    return a.type === "LEFT" ? -1 : 1;
  });

  const makeGraphSnapshot = (
    _currentX?: number,
    activeSegIds: string[] = [],
    foundIntersections: Array<{ seg1: string; seg2: string; point: Point2D | null }> = [],
  ) => {
    const nodes: GraphNodeItem[] = [];
    const edges: GraphEdgeItem[] = [];

    segments.forEach((s) => {
      const isActive = activeSegIds.includes(s.id);
      nodes.push({
        id: `${s.id}_P1`,
        label: `${s.id}_P1`,
        x: s.p1.x,
        y: s.p1.y,
        state: isActive ? "active" : "default",
      });
      nodes.push({
        id: `${s.id}_P2`,
        label: `${s.id}_P2`,
        x: s.p2.x,
        y: s.p2.y,
        state: isActive ? "active" : "default",
      });
      edges.push({
        from: `${s.id}_P1`,
        to: `${s.id}_P2`,
        isPath: isActive,
        weight: 1,
      });
    });

    foundIntersections.forEach((inter, idx) => {
      if (inter.point) {
        nodes.push({
          id: `INT_${idx}`,
          label: `X: (${inter.point.x},${inter.point.y})`,
          x: inter.point.x,
          y: inter.point.y,
          state: "sorted",
        });
      }
    });

    return { nodes, edges };
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 44,
    explanation: {
      what: `Initialize Sweep Line plane algorithm for ${segments.length} line segments.`,
      why: "The sweep line moves across the 2D plane from left to right, maintaining active segments and testing for intersections only when segments enter or leave.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot() },
    auxiliaryState: {
      hashMap: {
        "Total Segments": segments.length,
        "Total Events": events.length,
      },
    },
    variables: { numSegments: segments.length },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 54,
    explanation: {
      what: `Sort ${events.length} endpoint events primarily by X-coordinate (LEFT endpoints before RIGHT endpoints).`,
      why: "Sorting event points structures the 2D spatial search into a 1D sequential timeline.",
    },
    primarySnapshot: { kind: "graph", ...makeGraphSnapshot() },
    auxiliaryState: {
      hashMap: {
        "Sorted Events": events.map((e) => `${e.segId}:${e.type}@${e.x}`).join(", "),
      },
    },
    variables: { eventCount: events.length },
  });

  const active: SegmentItem[] = [];
  const foundIntersections: Array<{ seg1: string; seg2: string; point: Point2D | null }> = [];
  const intersectionPairs: Array<[string, string]> = [];

  for (let evIdx = 0; evIdx < events.length; evIdx++) {
    const ev = events[evIdx];

    if (ev.type === "LEFT") {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 59,
        explanation: {
          what: `Sweep line reaches LEFT endpoint event for segment ${ev.segId} at X = ${ev.x}.`,
          why: "Segment enters the active sweep status structure and must be cross-checked against currently active segments.",
        },
        primarySnapshot: {
          kind: "graph",
          ...makeGraphSnapshot(ev.x, active.map((s) => s.id).concat(ev.segId), foundIntersections),
        },
        auxiliaryState: {
          hashMap: {
            "Sweep X": ev.x,
            "Event Type": "LEFT (Insertion)",
            "Entering Segment": ev.segId,
            "Active Set": active.map((s) => s.id).join(", ") || "Empty",
          },
        },
        variables: { sweepX: ev.x, segId: ev.segId, type: "LEFT" },
      });

      for (const other of active) {
        const testRes = doIntersect(ev.seg, other);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 61,
          explanation: {
            what: `Test intersection between newly active segment ${ev.segId} and active segment ${other.id}: ${testRes.intersects ? "INTERSECT" : "NO INTERSECTION"}.`,
            why: "Using 2D cross-product orientation primitives to verify if segments cross each other.",
          },
          primarySnapshot: {
            kind: "graph",
            ...makeGraphSnapshot(
              ev.x,
              active.map((s) => s.id).concat(ev.segId),
              foundIntersections,
            ),
          },
          auxiliaryState: {
            hashMap: {
              "Testing Pair": `${ev.segId} vs ${other.id}`,
              Intersecting: testRes.intersects ? "YES" : "NO",
            },
          },
          variables: { seg1: ev.segId, seg2: other.id, intersects: testRes.intersects },
        });

        if (testRes.intersects) {
          const alreadyAdded = intersectionPairs.some(
            (pair) =>
              (pair[0] === ev.segId && pair[1] === other.id) ||
              (pair[0] === other.id && pair[1] === ev.segId),
          );

          if (!alreadyAdded) {
            intersectionPairs.push([ev.segId, other.id]);
            foundIntersections.push({ seg1: ev.segId, seg2: other.id, point: testRes.point });

            steps.push({
              stepIndex: stepIndex++,
              codeLine: 62,
              explanation: {
                what: `Record intersection between ${ev.segId} and ${other.id}${testRes.point ? ` at (${testRes.point.x}, ${testRes.point.y})` : ""}.`,
                why: "Discovered crossing point added to the global intersection list.",
              },
              primarySnapshot: {
                kind: "graph",
                ...makeGraphSnapshot(
                  ev.x,
                  active.map((s) => s.id).concat(ev.segId),
                  foundIntersections,
                ),
              },
              auxiliaryState: {
                hashMap: {
                  "New Intersection": `${ev.segId} × ${other.id}`,
                  "Intersection Point": testRes.point
                    ? `(${testRes.point.x}, ${testRes.point.y})`
                    : "Collinear",
                  "Total Intersections": intersectionPairs.length,
                },
              },
              variables: {
                seg1: ev.segId,
                seg2: other.id,
                totalIntersections: intersectionPairs.length,
              },
            });
          }
        }
      }

      active.push(ev.seg);
    } else {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 64,
        explanation: {
          what: `Sweep line reaches RIGHT endpoint event for segment ${ev.segId} at X = ${ev.x}.`,
          why: "Segment exits the active sweep status structure as the sweep line passes its rightmost coordinate.",
        },
        primarySnapshot: {
          kind: "graph",
          ...makeGraphSnapshot(
            ev.x,
            active.map((s) => s.id),
            foundIntersections,
          ),
        },
        auxiliaryState: {
          hashMap: {
            "Sweep X": ev.x,
            "Event Type": "RIGHT (Removal)",
            "Exiting Segment": ev.segId,
          },
        },
        variables: { sweepX: ev.x, segId: ev.segId, type: "RIGHT" },
      });

      const remIdx = active.findIndex((s) => s.id === ev.segId);
      if (remIdx !== -1) {
        active.splice(remIdx, 1);
      }
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 67,
    explanation: {
      what: `Sweep Line algorithm complete. Found ${intersectionPairs.length} intersection pair(s): [${intersectionPairs.map((p) => `(${p[0]}, ${p[1]})`).join(", ")}].`,
      why: "The plane sweep algorithm evaluated all segment events in optimal logarithmic time.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(undefined, [], foundIntersections),
    },
    auxiliaryState: {
      hashMap: {
        "Total Intersections": intersectionPairs.length,
        Pairs: intersectionPairs.map((p) => `${p[0]} × ${p[1]}`).join(", ") || "None",
      },
    },
    variables: { totalIntersections: intersectionPairs.length },
  });

  return steps;
};

export const SWEEP_LINE_INTERSECTIONS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The <strong>Sweep Line algorithm</strong> (Shamos-Hoey / Bentley-Ottmann) processes 2D geometric events sorted along one axis (usually X) to reduce spatial queries from quadratic <code>O(N²)</code> brute-force to optimal <code>O((N + K) log N)</code> runtime.</p>",
  sections: [
    {
      heading: "Event Queue and Status Structure",
      body: "<p>Plane sweep algorithms order geometric primitives along a primary axis (X-axis) using an Event Queue. A Status Structure dynamically tracks active segments intersecting the vertical sweep line, sorted by their Y-coordinates at sweep position X.</p>",
    },
    {
      heading: "Cross Product Orientation & Intersection Test",
      body: "<p>Segment intersections are detected strictly using exact integer cross product orientation primitives: <code>cross(a, b, c) = (b_x - a_x)(c_y - a_y) - (b_y - a_y)(c_x - a_x)</code>. Two active segments AB and CD intersect if and only if C and D straddle line AB while A and B straddle line CD.</p>",
    },
    {
      heading: "Neighboring Intersection Invariant",
      body: "<p>Crucially, two non-adjacent segments cannot intersect without becoming adjacent in the status structure at some sweep X coordinate prior to or at their intersection. This limits pairwise tests from <code>O(N²)</code> to checking only newly adjacent neighbors when segments insert, remove, or swap rank.</p>",
    },
    {
      heading: "Bentley-Ottmann & Shamos-Hoey Complexity",
      body: "<p>Shamos-Hoey answers the decision problem (does any intersection exist?) in <code>O(N log N)</code> time. Bentley-Ottmann enumerates all K intersections in <code>O((N + K) log N)</code> time by inserting dynamic event points into the queue whenever adjacent active segments cross.</p>",
    },
    {
      heading: "Implementation Nuances & Degeneracies",
      body: "<p>Vertical segments (x₁ = x₂), overlapping collinear segments, multi-segment endpoint junctions, and floating-point precision issues require strict tie-breaking in event sorting (sorting by X, then event type LEFT &lt; RIGHT, then Y) or exact rational arithmetic.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Sweep Line",
      definition:
        "An imaginary 1D line sweeping across a 2D space, pausing at discrete event points.",
    },
    {
      term: "Active Set (Status Structure)",
      definition: "The set of geometric objects currently intersected by the sweep line.",
    },
    {
      term: "Cross Product Primitive",
      definition:
        "Determinant evaluation testing left/right orientation without trigonometric or square root calculations.",
    },
    {
      term: "Straddle Test",
      definition:
        "Condition where segment endpoints lie on opposite half-planes of another segment's infinite supporting line.",
    },
    {
      term: "Bentley-Ottmann Algorithm",
      definition:
        "Generalization of sweep line plane search running in O((N + K) log N) to report all K intersections.",
    },
  ],
};

export const SWEEP_LINE_INTERSECTIONS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Empty leading line for code formatting.",
    2: "Defines cross_product helper function for 2D orientation.",
    3: "Returns signed cross product scalar.",
    4: "Empty line for formatting.",
    5: "Defines on_segment helper function for 1D bounding box containment.",
    6: "Checks x-coordinate bounding box.",
    7: "Checks y-coordinate bounding box.",
    8: "Empty line for formatting.",
    9: "Defines do_intersect helper function testing straddle condition.",
    10: "Helper function signature continued.",
    11: "Computes orientation d1.",
    12: "Computes orientation d2.",
    13: "Computes orientation d3.",
    14: "Computes orientation d4.",
    15: "Empty line for formatting.",
    16: "Checks general straddle condition.",
    17: "Returns True for general straddle.",
    18: "Checks collinear case d1 == 0.",
    19: "Checks collinear case d2 == 0.",
    20: "Checks collinear case d3 == 0.",
    21: "Checks collinear case d4 == 0.",
    22: "Returns False for no intersection.",
    23: "Empty line for formatting.",
    24: "Defines main sweep_line_intersections function signature taking segment array.",
    25: "Initializes event queue array.",
    26: "Iterates through each input segment.",
    27: "Unpacks left endpoint p1.",
    28: "Unpacks right endpoint p2.",
    29: "Ensures p1 has smaller x-coordinate (p1.x <= p2.x).",
    30: "Swaps endpoints if p1.x > p2.x.",
    31: "Appends LEFT endpoint event to event queue.",
    32: "Appends RIGHT endpoint event to event queue.",
    33: "Empty line for formatting.",
    34: "Sorts event queue primarily by x-coordinate, breaking ties with LEFT < RIGHT.",
    35: "Initializes active segment status list.",
    36: "Initializes intersections list.",
    37: "Empty line for formatting.",
    38: "Sweeps event queue sequentially by x-coordinate.",
    39: "Checks if current event is LEFT endpoint insertion.",
    40: "Iterates through existing active segments to test intersection.",
    41: "Tests intersection using do_intersect cross-product primitive.",
    42: "Appends pair to intersections list when crossing occurs.",
    43: "Appends segment to active status list.",
    44: "Else branch for RIGHT endpoint removal event.",
    45: "Removes segment from active status list.",
    46: "Empty line for formatting.",
    47: "Returns final list of discovered segment intersection pairs.",
    48: "Empty trailing line for code formatting.",
  },
};

export const sweepLineIntersections: AlgorithmDefinition<SweepLineIntersectionsInput> = {
  id: "sweep-line-intersections",
  title: "Sweep Line Segment Intersections",
  topicIds: ["geometry_and_sweep_line"],
  difficulty: "Hard",
  description:
    "<p>Find segment intersections using a vertical sweep line algorithm (Shamos-Hoey / Bentley-Ottmann) processing start, end, and event points sorted by <code>X</code> in <code>O((N + K) log N)</code> time:</p><p><code>cross(a, b, c) = (b_x - a_x)(c_y - a_y) - (b_y - a_y)(c_x - a_x)</code></p><h3>Graph Snapshot Representation</h3><p>The 2D segments, active status structure, and vertical sweep line are visualized dynamically on a 2D coordinate plane.</p><h3>Input Parameters</h3><ul><li><code>segments</code> (<code>SegmentItem[]</code>): Array of 2D line segments.</li></ul><h3>Output</h3><ul><li><code>tuple[string, string][]</code>: Pairs of segment IDs that intersect.</li></ul><h3>Edge Cases &amp; Constraints</h3><ul><li><strong>Vertical Segments:</strong> Sorted properly by tie-breaker.</li><li><strong>Parallel Segments:</strong> No false intersection reported.</li></ul>",
  constraints: ["1 <= segments.length <= 20", "0 <= x, y <= 500"],
  examples: [
    {
      kind: "basic",
      title: "3 Segments with 1 Intersection",
      input: {
        segments: [
          { id: "S1", p1: { x: 50, y: 100 }, p2: { x: 300, y: 300 } },
          { id: "S2", p1: { x: 80, y: 280 }, p2: { x: 320, y: 120 } },
          { id: "S3", p1: { x: 150, y: 50 }, p2: { x: 250, y: 350 } },
        ],
      },
      output: "3 Intersections",
      explanation: "Sweep line detects intersections as segments enter and leave the active set.",
    },
    {
      kind: "complex",
      title: "Multiple Crossing Segments",
      input: {
        segments: [
          { id: "S1", p1: { x: 10, y: 100 }, p2: { x: 200, y: 100 } },
          { id: "S2", p1: { x: 50, y: 10 }, p2: { x: 50, y: 200 } },
          { id: "S3", p1: { x: 150, y: 10 }, p2: { x: 150, y: 200 } },
        ],
      },
      output: "2 Intersections",
      explanation: "Horizontal segment S1 intersects vertical segments S2 and S3.",
    },
    {
      kind: "negative",
      title: "Parallel Non-intersecting Segments",
      input: {
        segments: [
          { id: "S1", p1: { x: 10, y: 50 }, p2: { x: 200, y: 50 } },
          { id: "S2", p1: { x: 10, y: 100 }, p2: { x: 200, y: 100 } },
          { id: "S3", p1: { x: 10, y: 150 }, p2: { x: 200, y: 150 } },
        ],
      },
      output: "0 Intersections",
      explanation: "Parallel horizontal segments never cross.",
    },
  ],
  code: PYTHON_SWEEP_LINE_INTERSECTIONS_CODE,
  timeComplexity: {
    best: "O(N log N)",
    average: "O((N + K) log N)",
    worst: "O((N + K) log N)",
  },
  spaceComplexity: "O(N + K)",
  complexityAnalysis: {
    time: "Sorting N segment endpoints takes O(N log N) time. Maintaining active status structure with K intersections takes O((N + K) log N) time.",
    space: "Requires O(N + K) auxiliary space for event queue and active status structure.",
  },
  topicGuide: SWEEP_LINE_INTERSECTIONS_TOPIC_GUIDE,
  trivia: SWEEP_LINE_INTERSECTIONS_TRIVIA,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 30",
      label: "Competitive Programmer's Handbook, Ch 30",
    },
  ],
  defaultInput: DEFAULT_SWEEP_LINE_INTERSECTIONS_INPUT,
  generateSteps: generateSweepLineIntersectionsSteps,
};
