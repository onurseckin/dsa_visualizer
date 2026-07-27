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
    """
    Finds 2D segment intersections using a vertical sweep line algorithm.
    """
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
    input.segments && input.segments.length > 0
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
    seg: SegmentItem;
  }

  const events: Event[] = [];
  for (const seg of segments) {
    events.push({ x: seg.p1.x, type: "LEFT", seg });
    events.push({ x: seg.p2.x, type: "RIGHT", seg });
  }

  events.sort((a, b) => a.x - b.x || (a.type === "LEFT" ? -1 : 1));

  const makeGraphSnapshot = (
    sweepX: number,
    activeSegIds: string[],
    foundIntersections: Point2D[],
  ) => {
    const nodes: GraphNodeItem[] = [];
    const edges: GraphEdgeItem[] = [];

    // Add sweep line node
    nodes.push({
      id: "SWEEP_LINE",
      label: `Sweep X=${sweepX}`,
      x: sweepX,
      y: 20,
      state: "active",
    });

    for (const s of segments) {
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
      });
    }

    foundIntersections.forEach((pt, idx) => {
      nodes.push({
        id: `INT_${idx}`,
        label: `Intersection (${pt.x},${pt.y})`,
        x: pt.x,
        y: pt.y,
        state: "sorted",
      });
    });

    return { nodes, edges };
  };

  // Step 0: Entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 48,
    explanation: {
      what: `Initializing Sweep Line algorithm for ${segments.length} segments.`,
      why: "A vertical line sweeps left-to-right across the plane, maintaining a status structure of active segments intersecting the sweep line.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(events[0]?.x || 0, [], []),
    },
    auxiliaryState: {
      hashMap: {
        "Total Segments": segments.length,
        "Status": "Initializing Event Queue",
      },
    },
    variables: { totalSegments: segments.length },
  });

  // Step 1: Create events
  for (const seg of segments) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 54,
      explanation: {
        what: `Segment ${seg.id}: Created LEFT event at X=${seg.p1.x} and RIGHT event at X=${seg.p2.x}.`,
        why: "Endpoints mark when a segment enters and leaves the active sweep line status structure.",
      },
      primarySnapshot: {
        kind: "graph",
        ...makeGraphSnapshot(seg.p1.x, [seg.id], []),
      },
      auxiliaryState: {
        hashMap: {
          "Segment": seg.id,
          "LEFT Event": `X=${seg.p1.x}`,
          "RIGHT Event": `X=${seg.p2.x}`,
        },
      },
      variables: { segmentId: seg.id, p1X: seg.p1.x, p2X: seg.p2.x },
    });
  }

  // Step 2: Sort events
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 57,
    explanation: {
      what: `Sorted ${events.length} endpoint events by X-coordinate.`,
      why: "Event queue ordering guarantees sweep line processes events in left-to-right spatial order.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(events[0]?.x || 0, [], []),
    },
    auxiliaryState: {
      hashMap: {
        "Event Queue": events.map((e) => `${e.type}(${e.seg.id})@${e.x}`).join(", "),
      },
    },
    variables: { eventCount: events.length },
  });

  const activeSegments: SegmentItem[] = [];
  const intersectionsFound: Point2D[] = [];
  const testedPairs = new Set<string>();

  for (const ev of events) {
    const sweepX = ev.x;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 61,
      explanation: {
        what: `Advancing Sweep Line to X=${sweepX} (Event: ${ev.type} for Segment ${ev.seg.id}).`,
        why: "Sweep line pauses at discrete endpoint event positions.",
      },
      primarySnapshot: {
        kind: "graph",
        ...makeGraphSnapshot(sweepX, activeSegments.map((s) => s.id), intersectionsFound),
      },
      auxiliaryState: {
        hashMap: {
          "Sweep X": sweepX,
          "Event": `${ev.type} ${ev.seg.id}`,
          "Active Count": activeSegments.length,
        },
      },
      variables: { sweepX, eventType: ev.type, segId: ev.seg.id },
    });

    if (ev.type === "LEFT") {
      // Check intersections with existing active segments
      for (const other of activeSegments) {
        if (other.id !== ev.seg.id) {
          const pairKey = [ev.seg.id, other.id].sort().join("-");
          if (!testedPairs.has(pairKey)) {
            testedPairs.add(pairKey);
            const res = doIntersect(ev.seg, other);

            steps.push({
              stepIndex: stepIndex++,
              codeLine: 64,
              explanation: {
                what: `Testing intersection between Segment ${ev.seg.id} and Active Segment ${other.id}: ${res.intersects ? "INTERSECTS!" : "No Intersection"}.`,
                why: "When a new segment inserts into active set, test for intersection against existing active neighbors.",
              },
              primarySnapshot: {
                kind: "graph",
                ...makeGraphSnapshot(sweepX, [...activeSegments.map((s) => s.id), ev.seg.id], intersectionsFound),
              },
              auxiliaryState: {
                hashMap: {
                  "Tested Pair": `${ev.seg.id} vs ${other.id}`,
                  "Intersects": res.intersects ? "YES" : "NO",
                  "Intersection Point": res.point ? `(${res.point.x},${res.point.y})` : "None",
                },
              },
              variables: { seg1: ev.seg.id, seg2: other.id, intersects: res.intersects },
            });

            if (res.intersects && res.point) {
              intersectionsFound.push(res.point);
              steps.push({
                stepIndex: stepIndex++,
                codeLine: 65,
                explanation: {
                  what: `Recorded intersection point (${res.point.x}, ${res.point.y}) between ${ev.seg.id} and ${other.id}.`,
                  why: "Found segment crossing in 2D plane.",
                },
                primarySnapshot: {
                  kind: "graph",
                  ...makeGraphSnapshot(sweepX, [...activeSegments.map((s) => s.id), ev.seg.id], intersectionsFound),
                },
                auxiliaryState: {
                  hashMap: {
                    "Discovered Intersection": `(${res.point.x}, ${res.point.y})`,
                    "Total Discovered": intersectionsFound.length,
                  },
                },
                variables: { intX: res.point.x, intY: res.point.y },
              });
            }
          }
        }
      }

      activeSegments.push(ev.seg);
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 66,
        explanation: {
          what: `Added Segment ${ev.seg.id} to Active Status Structure.`,
          why: "Segment is currently intersected by vertical sweep line.",
        },
        primarySnapshot: {
          kind: "graph",
          ...makeGraphSnapshot(sweepX, activeSegments.map((s) => s.id), intersectionsFound),
        },
        auxiliaryState: {
          hashMap: {
            "Active Set": activeSegments.map((s) => s.id).join(", "),
          },
        },
        variables: { activeCount: activeSegments.length },
      });
    } else {
      const idx = activeSegments.findIndex((s) => s.id === ev.seg.id);
      if (idx !== -1) {
        activeSegments.splice(idx, 1);
      }
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 68,
        explanation: {
          what: `Removed Segment ${ev.seg.id} from Active Status Structure at RIGHT endpoint X=${sweepX}.`,
          why: "Sweep line has moved past the right endpoint of this segment.",
        },
        primarySnapshot: {
          kind: "graph",
          ...makeGraphSnapshot(sweepX, activeSegments.map((s) => s.id), intersectionsFound),
        },
        auxiliaryState: {
          hashMap: {
            "Removed Segment": ev.seg.id,
            "Remaining Active Set": activeSegments.map((s) => s.id).join(", ") || "None",
          },
        },
        variables: { activeCount: activeSegments.length },
      });
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 70,
    explanation: {
      what: `Sweep Line algorithm complete. Total intersections found: ${intersectionsFound.length}.`,
      why: "The sweep line approach restricts intersection tests to active spatial neighbors.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(events[events.length - 1]?.x || 400, [], intersectionsFound),
    },
    auxiliaryState: {
      hashMap: {
        "Final Intersections Count": intersectionsFound.length,
      },
    },
    variables: { totalIntersections: intersectionsFound.length },
  });

  return steps;
};

export const SWEEP_LINE_INTERSECTIONS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "The Sweep Line algorithm (Shamos-Hoey / Bentley-Ottmann) processes 2D geometric events sorted along one axis (usually X) to reduce spatial queries from quadratic $\\mathcal{O}(N^2)$ brute-force to optimal $\\mathcal{O}((N + K) \\log N)$ runtime.",
  sections: [
    {
      heading: "Event Queue and Status Structure",
      body: "Plane sweep algorithms order geometric primitives along a primary axis (X-axis) using an Event Queue. A Status Structure (balanced BST) dynamically tracks active segments intersecting the vertical sweep line, sorted by their Y-coordinates at sweep position X.",
    },
    {
      heading: "Cross Product Orientation & Intersection Test",
      body: "Segment intersections are detected strictly using exact integer cross product orientation primitives:\n$$\\text{cross}(\\mathbf{a}, \\mathbf{b}, \\mathbf{c}) = (b_x - a_x)(c_y - a_y) - (b_y - a_y)(c_x - a_x)$$\nTwo active segments $AB$ and $CD$ intersect if and only if $C$ and $D$ straddle line $AB$ while $A$ and $B$ straddle line $CD$.",
    },
    {
      heading: "Neighboring Intersection Invariant",
      body: "Crucially, two non-adjacent segments cannot intersect without becoming adjacent in the status structure at some sweep X coordinate prior to or at their intersection. This limits pairwise tests from $\\mathcal{O}(N^2)$ to checking only newly adjacent neighbors when segments insert, remove, or swap rank.",
    },
    {
      heading: "Bentley-Ottmann & Shamos-Hoey Complexity",
      body: "Shamos-Hoey answers the decision problem (does any intersection exist?) in $\\mathcal{O}(N \\log N)$ time. Bentley-Ottmann enumerates all $K$ intersections in $\\mathcal{O}((N + K) \\log N)$ time by inserting dynamic event points into the queue whenever adjacent active segments cross.",
    },
    {
      heading: "Implementation Nuances & Degeneracies",
      body: "Vertical segments ($x_1 = x_2$), overlapping collinear segments, multi-segment endpoint junctions, and floating-point precision issues require strict tie-breaking in event sorting (sorting by X, then event type LEFT < RIGHT, then Y) or exact rational arithmetic.",
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
        "Generalization of sweep line plane search running in $\\mathcal{O}((N + K) \\log N)$ to report all $K$ intersections.",
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
    25: "Opening docstring tag.",
    26: "Docstring describing vertical sweep line algorithm.",
    27: "Closing docstring tag.",
    28: "Initializes event queue array.",
    29: "Iterates through each input segment.",
    30: "Unpacks left endpoint p1.",
    31: "Unpacks right endpoint p2.",
    32: "Ensures p1 has smaller x-coordinate (p1.x <= p2.x).",
    33: "Swaps endpoints if p1.x > p2.x.",
    34: "Appends LEFT endpoint event to event queue.",
    35: "Appends RIGHT endpoint event to event queue.",
    36: "Empty line for formatting.",
    37: "Sorts event queue primarily by x-coordinate, breaking ties with LEFT < RIGHT.",
    38: "Initializes active segment status list.",
    39: "Initializes intersections list.",
    40: "Empty line for formatting.",
    41: "Sweeps event queue sequentially by x-coordinate.",
    42: "Checks if current event is LEFT endpoint insertion.",
    43: "Iterates through existing active segments to test intersection.",
    44: "Tests intersection using do_intersect cross-product primitive.",
    45: "Appends pair to intersections list when crossing occurs.",
    46: "Appends segment to active status list.",
    47: "Else branch for RIGHT endpoint removal event.",
    48: "Removes segment from active status list.",
    49: "Empty line for formatting.",
    50: "Returns final list of discovered segment intersection pairs.",
    51: "Empty trailing line for code formatting.",
  },
};

export const sweepLineIntersections: AlgorithmDefinition<SweepLineIntersectionsInput> = {
  id: "sweep-line-intersections",
  title: "Sweep Line Segment Intersections",
  category: "geometry_and_sweep_line",
  categories: ["geometry_and_sweep_line"],
  difficulty: "Hard",
  description:
    "Find segment intersections using a vertical sweep line algorithm (Shamos-Hoey / Bentley-Ottmann) processing start, end, and event points sorted by $X$ in $\\mathcal{O}((N + K) \\log N)$ time:\n\n$$\\text{cross}(\\mathbf{a}, \\mathbf{b}, \\mathbf{c}) = (b_x - a_x)(c_y - a_y) - (b_y - a_y)(c_x - a_x)$$\n\n### Graph Snapshot Representation\nThe 2D segments, active status structure, and vertical sweep line are visualized dynamically on a 2D coordinate plane.\n\n### Input Parameters\n- `segments` (`SegmentItem[]`): Array of 2D line segments.\n\n### Output\n- `tuple[string, string][]`: Pairs of segment IDs that intersect.\n\n### Edge Cases & Constraints\n- Vertical Segments ($x_1 = x_2$): Sorted properly by tie-breaker.\n- Parallel Segments: No false intersection reported.",
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
    time: "Sorting $N$ segment endpoints takes $\\mathcal{O}(N \\log N)$ time. Maintaining the active status structure with $K$ intersections takes $\\mathcal{O}((N + K) \\log N)$ time.",
    space: "Requires $\\mathcal{O}(N + K)$ auxiliary space for the event queue and active status structure.",
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
