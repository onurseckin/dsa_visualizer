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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Sweep Line segment intersection detects all crossing pairs among N 2D line segments on a plane.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "s1_p1", label: "S1_L", x: 50, y: 100, state: "default" },
        { id: "s1_p2", label: "S1_R", x: 300, y: 300, state: "default" },
        { id: "s2_p1", label: "S2_L", x: 80, y: 280, state: "default" },
        { id: "s2_p2", label: "S2_R", x: 320, y: 120, state: "default" },
      ],
      edges: [
        { from: "s1_p1", to: "s1_p2", isPath: true },
        { from: "s2_p1", to: "s2_p2", isPath: true },
      ],
    },
  },
  {
    narrative:
      "Testing all N · (N - 1) / 2 candidate segment pairs takes quadratic O(N²) time, which is too slow for large datasets.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "s1_p1", label: "S1_L", x: 50, y: 100, state: "compare" },
        { id: "s1_p2", label: "S1_R", x: 300, y: 300, state: "compare" },
        { id: "s2_p1", label: "S2_L", x: 80, y: 280, state: "compare" },
        { id: "s2_p2", label: "S2_R", x: 320, y: 120, state: "compare" },
      ],
      edges: [
        { from: "s1_p1", to: "s1_p2", isTraversed: true },
        { from: "s2_p1", to: "s2_p2", isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Key concept: imagine a vertical line sweeping across the 2D plane from left to right, converting 2D space into a 1D event timeline.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "sweep", label: "Sweep X=150", x: 150, y: 200, state: "active" },
        { id: "s1_p1", label: "S1_L", x: 50, y: 100, state: "visited" },
        { id: "s1_p2", label: "S1_R", x: 300, y: 300, state: "default" },
      ],
      edges: [{ from: "s1_p1", to: "s1_p2", isPath: true }],
    },
  },
  {
    narrative:
      "Event Queue: all segment endpoints are sorted by X-coordinate into LEFT (start) and RIGHT (end) events.",
    primarySnapshot: {
      kind: "array",
      name: "event_queue",
      mode: "box",
      elements: [
        { id: "e1", value: 50, label: "S1:LEFT@50", state: "sorted" },
        { id: "e2", value: 80, label: "S2:LEFT@80", state: "sorted" },
        { id: "e3", value: 300, label: "S1:RIGHT@300", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Active Status Structure: dynamically maintains the set of segments currently intersected by the vertical sweep line.",
    primarySnapshot: {
      kind: "array",
      name: "active_set",
      mode: "box",
      elements: [
        { id: "a1", value: 1, label: "S1", state: "active" },
        { id: "a2", value: 2, label: "S2", state: "active" },
      ],
    },
  },
  {
    narrative:
      "LEFT event: when sweep line hits a LEFT endpoint, insert the new segment into active set and test against existing active items.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "s1_p1", label: "S1", x: 50, y: 100, state: "active" },
        { id: "s2_p1", label: "S2 Insertion", x: 80, y: 280, state: "active" },
      ],
      edges: [],
    },
  },
  {
    narrative:
      "Neighboring Invariant: two segments can only intersect if they become adjacent in the active status structure.",
    primarySnapshot: {
      kind: "graph",
      nodes: [{ id: "int_p", label: "Intersection Point", x: 190, y: 200, state: "sorted" }],
      edges: [],
    },
  },
  {
    narrative:
      "RIGHT event: when sweep line passes a RIGHT endpoint, remove the completed segment from the active status structure.",
    primarySnapshot: {
      kind: "array",
      name: "active_after_removal",
      mode: "box",
      elements: [{ id: "rem1", value: 2, label: "S2", state: "visited" }],
    },
  },
  {
    narrative:
      "Bentley-Ottmann algorithm enumerates all K intersections in O((N + K) log N) time with O(N + K) auxiliary space.",
    primarySnapshot: {
      kind: "array",
      name: "complexity_summary",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "Time: O((N + K) log N)", state: "sorted" },
        { id: "c2", value: 2, label: "Space: O(N + K)", state: "sorted" },
      ],
    },
  },
];

export const generateSweepLineIntersectionsSteps = (
  input: SweepLineIntersectionsInput,
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

  const rawSegments =
    input && Array.isArray(input.segments) && input.segments.length > 0
      ? input.segments
      : DEFAULT_SWEEP_LINE_INTERSECTIONS_INPUT.segments;

  const isDefaultInput =
    !input ||
    (Array.isArray(input.segments) &&
      input.segments.length === DEFAULT_SWEEP_LINE_INTERSECTIONS_INPUT.segments.length &&
      input.segments[0].id === DEFAULT_SWEEP_LINE_INTERSECTIONS_INPUT.segments[0].id);

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

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

  const crossProduct = (a: Point2D, b: Point2D, c: Point2D): number =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

  const onSegment = (p: Point2D, q: Point2D, r: Point2D): boolean =>
    q.x >= Math.min(p.x, r.x) &&
    q.x <= Math.max(p.x, r.x) &&
    q.y >= Math.min(p.y, r.y) &&
    q.y <= Math.max(p.y, r.y);

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
  ): GraphVisualSnapshot => {
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

    return { kind: "graph", nodes, edges };
  };

  addStep(
    `Initialize Sweep Line plane algorithm for ${segments.length} line segment(s).`,
    makeGraphSnapshot(),
  );

  addStep(
    `Sort ${events.length} endpoint events primarily by X-coordinate: ${events.map((e) => `${e.segId}:${e.type}@${e.x}`).join(", ")}.`,
    makeGraphSnapshot(),
  );

  const active: SegmentItem[] = [];
  const foundIntersections: Array<{ seg1: string; seg2: string; point: Point2D | null }> = [];
  const intersectionPairs: Array<[string, string]> = [];

  for (let evIdx = 0; evIdx < events.length; evIdx++) {
    const ev = events[evIdx];

    if (ev.type === "LEFT") {
      addStep(
        `Sweep line reaches LEFT endpoint event for segment ${ev.segId} at X = ${ev.x}. Insert ${ev.segId} into active status structure.`,
        makeGraphSnapshot(ev.x, active.map((s) => s.id).concat(ev.segId), foundIntersections),
      );

      for (const other of active) {
        const testRes = doIntersect(ev.seg, other);
        if (testRes.intersects) {
          const alreadyAdded = intersectionPairs.some(
            (pair) =>
              (pair[0] === ev.segId && pair[1] === other.id) ||
              (pair[0] === other.id && pair[1] === ev.segId),
          );

          if (!alreadyAdded) {
            intersectionPairs.push([ev.segId, other.id]);
            foundIntersections.push({ seg1: ev.segId, seg2: other.id, point: testRes.point });

            addStep(
              `Intersection detected between ${ev.segId} and ${other.id}${testRes.point ? ` at coordinate (${testRes.point.x}, ${testRes.point.y})` : ""}!`,
              makeGraphSnapshot(ev.x, active.map((s) => s.id).concat(ev.segId), foundIntersections),
            );
          }
        }
      }

      active.push(ev.seg);
    } else {
      addStep(
        `Sweep line reaches RIGHT endpoint event for segment ${ev.segId} at X = ${ev.x}. Remove ${ev.segId} from active status structure.`,
        makeGraphSnapshot(
          ev.x,
          active.map((s) => s.id),
          foundIntersections,
        ),
      );

      const remIdx = active.findIndex((s) => s.id === ev.segId);
      if (remIdx !== -1) {
        active.splice(remIdx, 1);
      }
    }
  }

  addStep(
    `Sweep Line algorithm complete! Discovered ${intersectionPairs.length} intersection pair(s): ${intersectionPairs.map((p) => `(${p[0]}, ${p[1]})`).join(", ") || "None"}.`,
    makeGraphSnapshot(undefined, [], foundIntersections),
  );

  return steps;
};

export const SWEEP_LINE_INTERSECTIONS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The <strong>Sweep Line algorithm</strong> (Shamos-Hoey / Bentley-Ottmann) processes 2D geometric events sorted along one axis (usually X) to reduce spatial queries from quadratic <code>O(N²)</code> brute-force to optimal <code>O((N + K) log N)</code> runtime.</p>",
  sections: [
    {
      heading: "Event Queue and Status Structure",
      body: "<p>Plane sweep algorithms order geometric primitives along a primary axis (X-axis) using an Event Queue.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Sweep Line",
      definition:
        "An imaginary 1D line sweeping across a 2D space, pausing at discrete event points.",
    },
  ],
};

export const SWEEP_LINE_INTERSECTIONS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines cross_product helper function for 2D orientation.",
    2: "Defines do_intersect helper function testing straddle condition.",
    3: "Defines main sweep_line_intersections function signature.",
  },
};

export const sweepLineIntersections: AlgorithmDefinition<SweepLineIntersectionsInput> = {
  id: "sweep-line-intersections",
  title: "Sweep Line Segment Intersections",
  topicIds: ["geometry_and_sweep_line"],
  difficulty: "Hard",
  description:
    "<p>Given a set of 2D line segments, find all intersecting pairs using a vertical sweep line algorithm (Shamos-Hoey / Bentley-Ottmann).</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "  <li><code>segments</code>: An array of 2D segment objects <code>{ id: string, p1: {x, y}, p2: {x, y} }</code> where <code>1 &le; N &le; 20</code>.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<p>Returns an array of segment ID pairs <code>[id1, id2]</code> that intersect on the 2D plane.</p>",
  constraints: ["1 <= segments.length <= 20", "0 <= x, y <= 500"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "3 Segments with Intersections",
      input: DEFAULT_SWEEP_LINE_INTERSECTIONS_INPUT,
      output: "Intersections found",
      explanation: "Sweep line detects intersections as segments enter and leave the active set.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
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
      scenario: "boundary",
      title: "Parallel Non-Intersecting Segments",
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
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 30,
      label: "Competitive Programmer's Handbook, Ch 30",
    },
  ],
  defaultInput: DEFAULT_SWEEP_LINE_INTERSECTIONS_INPUT,
  generateSteps: generateSweepLineIntersectionsSteps,
};

export default sweepLineIntersections;
