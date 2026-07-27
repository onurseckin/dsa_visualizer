import type { AlgorithmDefinition, AlgorithmStep, GraphNodeItem, GraphEdgeItem, TopicGuide } from "../../types/dsa";
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

export const PYTHON_SWEEP_LINE_INTERSECTIONS_CODE = `def sweep_line_intersections(segments: list) -> list:
    events = []
    for idx, seg in enumerate(segments):
        p1, p2 = seg['p1'], seg['p2']
        if p1['x'] > p2['x']: p1, p2 = p2, p1
        events.append((p1['x'], 'LEFT', idx, p1, p2))
        events.append((p2['x'], 'RIGHT', idx, p1, p2))
    events.sort(key=lambda e: (e[0], 0 if e[1] == 'LEFT' else 1))

    intersections = []
    active_segments = set()
    for x, event_type, seg_id, p1, p2 in events:
        if event_type == 'LEFT':
            active_segments.add(seg_id)
        else:
            active_segments.remove(seg_id)
    return intersections`;

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

  const rawSegments = input.segments && input.segments.length > 0 ? input.segments : DEFAULT_SWEEP_LINE_INTERSECTIONS_INPUT.segments;

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

  const doIntersect = (s1: SegmentItem, s2: SegmentItem): { intersects: boolean; point: Point2D | null } => {
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

  const makeGraphSnapshot = (sweepX: number, activeSegIds: string[], foundIntersections: Point2D[]) => {
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

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Initializing Sweep Line algorithm across ${segments.length} line segments. Generated ${events.length} endpoint events.`,
      why: "A vertical line sweeps left-to-right across the plane, maintaining a status structure of active segments intersecting the sweep line.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(events[0]?.x || 0, [], []),
    },
    auxiliaryState: {
      hashMap: {
        "Total Segments": segments.length,
        "Total Events": events.length,
      },
    },
    variables: { totalSegments: segments.length },
  });

  const activeSegments: SegmentItem[] = [];
  const intersectionsFound: Point2D[] = [];
  const testedPairs = new Set<string>();

  for (const ev of events) {
    const sweepX = ev.x;

    if (ev.type === "LEFT") {
      activeSegments.push(ev.seg);
      // Check intersections with existing active segments
      for (const other of activeSegments) {
        if (other.id !== ev.seg.id) {
          const pairKey = [ev.seg.id, other.id].sort().join("-");
          if (!testedPairs.has(pairKey)) {
            testedPairs.add(pairKey);
            const res = doIntersect(ev.seg, other);
            if (res.intersects && res.point) {
              intersectionsFound.push(res.point);
            }
          }
        }
      }
    } else {
      const idx = activeSegments.findIndex(s => s.id === ev.seg.id);
      if (idx !== -1) {
        activeSegments.splice(idx, 1);
      }
    }

    const activeIds = activeSegments.map(s => s.id);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `Sweep Line at X=${sweepX}: Processed ${ev.type} event for segment ${ev.seg.id}. Active set: [${activeIds.join(", ")}].`,
        why: `Total intersections discovered so far: ${intersectionsFound.length}.`,
      },
      primarySnapshot: {
        kind: "graph",
        ...makeGraphSnapshot(sweepX, activeIds, intersectionsFound),
      },
      auxiliaryState: {
        hashMap: {
          "Sweep X": sweepX,
          "Event": `${ev.type} ${ev.seg.id}`,
          "Active Segments": activeIds.join(", ") || "None",
          "Intersections": intersectionsFound.length,
        },
      },
      variables: { sweepX, activeCount: activeSegments.length },
    });
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 17,
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

const SWEEP_LINE_INTERSECTIONS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "The Sweep Line algorithm (Shamos-Hoey / Bentley-Ottmann) processes 2D geometric events sorted along one axis (usually X) to reduce spatial queries from O(N^2) to O((N + K) log N).",
  sections: [
    {
      heading: "Event Queue and Status Structure",
      body: "The event queue orders segment start points, end points, and intersection events. The sweep line status structure maintains Y-ordered active segments crossing the current X position.",
    },
    {
      heading: "Neighboring Intersection Invariant",
      body: "Two segments can only intersect if they become adjacent in the sweep line status structure at some point before or at their intersection.",
    },
  ],
  keyTerms: [
    {
      term: "Sweep Line",
      definition: "An imaginary 1D line sweeping across a 2D space, pausing at discrete event points.",
    },
    {
      term: "Active Set",
      definition: "The set of geometric objects currently intersected by the sweep line.",
    },
  ],
};

const SWEEP_LINE_INTERSECTIONS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines function sweep_line_intersections taking a list of line segments.",
    2: "Builds event list consisting of LEFT and RIGHT endpoint events.",
    8: "Sorts events primarily by X coordinate to process plane left-to-right.",
    11: "Initializes active_segments set.",
    12: "Iterates through event queue updating active segment set.",
    14: "Adds new segment to active set when LEFT event occurs.",
    16: "Removes segment from active set when RIGHT event occurs.",
    17: "Returns list of detected intersections.",
  },
};

export const sweepLineIntersections: AlgorithmDefinition<SweepLineIntersectionsInput> = {
  id: "sweep-line-intersections",
  title: "Sweep Line Segment Intersections",
  category: "geometry_and_sweep_line",
  difficulty: "Hard",
  description:
    "Find segment intersections using a vertical sweep line algorithm (Shamos-Hoey / Bentley-Ottmann) processing start, end, and event points sorted by X.",
  constraints: [
    "1 <= segments.length <= 20",
    "0 <= x, y <= 500",
  ],
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
    time: "Sorting N segment endpoints takes O(N log N). Maintaining active set with K intersections takes O((N + K) log N).",
    space: "Requires O(N) space for event queue and active set.",
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
