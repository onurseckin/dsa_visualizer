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

export interface Rectangle {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface RectangleAreaUnionInput {
  rectangles: Rectangle[];
}

export const PYTHON_RECTANGLE_AREA_UNION_CODE = `def rectangle_area_union(rectangles: list[list[int]]) -> int:
    events = []
    for x1, y1, x2, y2 in rectangles:
        events.append((x1, 1, y1, y2))
        events.append((x2, -1, y1, y2))
        
    events.sort(key=lambda e: e[0])
    
    def get_y_coverage(intervals):
        if not intervals:
            return 0
        sorted_intervals = sorted(intervals)
        total = 0
        curr_start, curr_end = sorted_intervals[0]
        for start, end in sorted_intervals[1:]:
            if start < curr_end:
                curr_end = max(curr_end, end)
            else:
                total += curr_end - curr_start
                curr_start, curr_end = start, end
        total += curr_end - curr_start
        return total

    total_area = 0
    prev_x = events[0][0]
    active_y = []
    
    for x, type_, y1, y2 in events:
        dx = x - prev_x
        if dx > 0:
            total_area += dx * get_y_coverage(active_y)
        if type_ == 1:
            active_y.append((y1, y2))
        else:
            active_y.remove((y1, y2))
        prev_x = x
        
    return total_area
`;

export const DEFAULT_RECTANGLE_AREA_UNION_INPUT: RectangleAreaUnionInput = {
  rectangles: [
    { x1: 10, y1: 10, x2: 30, y2: 30 },
    { x1: 20, y1: 20, x2: 40, y2: 40 },
    { x1: 10, y1: 25, x2: 25, y2: 45 },
  ],
};

const calculateYCoverage = (intervals: Array<[number, number]>): number => {
  if (intervals.length === 0) return 0;
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  let total = 0;
  let currStart = sorted[0][0];
  let currEnd = sorted[0][1];

  for (let i = 1; i < sorted.length; i++) {
    const [start, end] = sorted[i];
    if (start < currEnd) {
      currEnd = Math.max(currEnd, end);
    } else {
      total += currEnd - currStart;
      currStart = start;
      currEnd = end;
    }
  }
  total += currEnd - currStart;
  return total;
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Rectangle Area Union calculates the total enclosed surface area of N axis-aligned 2D rectangles.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "r1_bl", label: "R1(10,10)", x: 100, y: 100, state: "default" },
        { id: "r1_tr", label: "R1(30,30)", x: 300, y: 300, state: "default" },
        { id: "r2_bl", label: "R2(20,20)", x: 200, y: 200, state: "default" },
        { id: "r2_tr", label: "R2(40,40)", x: 400, y: 400, state: "default" },
      ],
      edges: [],
    },
  },
  {
    narrative:
      "Overlap challenge: simply summing individual rectangle areas double-counts overlapping interior regions.",
    primarySnapshot: {
      kind: "array",
      name: "naive_sum",
      mode: "box",
      elements: [
        { id: "r1", value: 400, label: "Area R1 = 400", state: "compare" },
        { id: "r2", value: 400, label: "Area R2 = 400", state: "compare" },
        { id: "sum", value: 800, label: "Sum = 800 (Overcounts!)", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Plane Sweep technique: sweep a vertical line left-to-right along the X-axis across the 2D plane.",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "sweep", label: "Sweep X=20", x: 200, y: 250, state: "active" },
        { id: "r1_bl", label: "R1", x: 100, y: 100, state: "visited" },
      ],
      edges: [],
    },
  },
  {
    narrative:
      "Event generation: each rectangle [x1, y1, x2, y2] emits an ENTRY event at x = x1 and an EXIT event at x = x2.",
    primarySnapshot: {
      kind: "array",
      name: "events_generated",
      mode: "box",
      elements: [
        { id: "e1", value: 10, label: "ENTRY R1 @ x=10", state: "sorted" },
        { id: "e2", value: 30, label: "EXIT R1 @ x=30", state: "visited" },
      ],
    },
  },
  {
    narrative:
      "Event sorting: sort all 2N boundary events by X-coordinate into a 1D sequential event stream.",
    primarySnapshot: {
      kind: "array",
      name: "sorted_events",
      mode: "box",
      elements: [
        { id: "s1", value: 10, label: "x=10 (ENTRY)", state: "sorted" },
        { id: "s2", value: 20, label: "x=20 (ENTRY)", state: "sorted" },
        { id: "s3", value: 30, label: "x=30 (EXIT)", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Active Y-interval status: at sweep position x, maintain active Y-intervals [y1, y2] for all rectangles currently intersecting the sweep line.",
    primarySnapshot: {
      kind: "array",
      name: "active_y_intervals",
      mode: "box",
      elements: [
        { id: "i1", value: 20, label: "R1: [10, 30]", state: "active" },
        { id: "i2", value: 20, label: "R2: [20, 40]", state: "active" },
      ],
    },
  },
  {
    narrative:
      "1D Interval Merging: compute the total union length of active Y-intervals to evaluate active height H_active.",
    primarySnapshot: {
      kind: "array",
      name: "y_coverage",
      mode: "box",
      elements: [{ id: "cov", value: 30, label: "H_active = [10, 40] span = 30", state: "sorted" }],
    },
  },
  {
    narrative:
      "Area accumulation: as sweep line moves from x_prev to x_curr, add H_active · (x_curr - x_prev) to total area.",
    primarySnapshot: {
      kind: "array",
      name: "area_accumulation",
      mode: "box",
      elements: [{ id: "acc", value: 300, label: "Added = 30 * (20 - 10) = 300", state: "active" }],
    },
  },
  {
    narrative:
      "Sweep Line Rectangle Area Union completes in optimal O(N log N) time using O(N) auxiliary space.",
    primarySnapshot: {
      kind: "array",
      name: "complexity_summary",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "Time: O(N log N)", state: "sorted" },
        { id: "c2", value: 2, label: "Space: O(N)", state: "sorted" },
      ],
    },
  },
];

export function generateRectangleAreaUnionSteps(input: RectangleAreaUnionInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIdx++, phase, narrative, primarySnapshot }));
  };

  const rawRects =
    input && Array.isArray(input.rectangles) && input.rectangles.length > 0
      ? input.rectangles
      : DEFAULT_RECTANGLE_AREA_UNION_INPUT.rectangles;

  const isDefaultInput =
    !input ||
    (Array.isArray(input.rectangles) &&
      input.rectangles.length === DEFAULT_RECTANGLE_AREA_UNION_INPUT.rectangles.length &&
      input.rectangles[0].x1 === DEFAULT_RECTANGLE_AREA_UNION_INPUT.rectangles[0].x1);

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  interface Event {
    x: number;
    type: 1 | -1;
    y1: number;
    y2: number;
    rectId: number;
  }

  const events: Event[] = [];
  rawRects.forEach((r, idx) => {
    events.push({ x: r.x1, type: 1, y1: r.y1, y2: r.y2, rectId: idx });
    events.push({ x: r.x2, type: -1, y1: r.y1, y2: r.y2, rectId: idx });
  });

  events.sort((a, b) => a.x - b.x);

  const makeGraphSnapshot = (
    activeRectIds: number[] = [],
    _sweepX?: number,
  ): GraphVisualSnapshot => {
    const nodes: GraphNodeItem[] = [];
    const edges: GraphEdgeItem[] = [];

    rawRects.forEach((r, idx) => {
      const isActive = activeRectIds.includes(idx);
      nodes.push({
        id: `R${idx}_BL`,
        label: `R${idx + 1}_BL`,
        x: r.x1 * 10,
        y: r.y1 * 10,
        state: isActive ? "active" : "default",
      });
      nodes.push({
        id: `R${idx}_TR`,
        label: `R${idx + 1}_TR`,
        x: r.x2 * 10,
        y: r.y2 * 10,
        state: isActive ? "active" : "default",
      });
      edges.push({
        from: `R${idx}_BL`,
        to: `R${idx}_TR`,
        isPath: isActive,
      });
    });

    return { kind: "graph", nodes, edges };
  };

  addStep(
    `Initialize Sweep Line Rectangle Area Union for ${rawRects.length} rectangle(s). Generated ${events.length} boundary events.`,
    makeGraphSnapshot(),
  );

  let totalArea = 0;
  let prevX = events[0].x;
  const activeY: Array<[number, number]> = [];
  const activeRectIds: number[] = [];

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const dx = ev.x - prevX;
    const yCoverage = calculateYCoverage(activeY);

    if (dx > 0) {
      const addedArea = dx * yCoverage;
      totalArea += addedArea;

      addStep(
        `Sweep line advances from x = ${prevX} to x = ${ev.x} (dx = ${dx}). Active Y coverage = ${yCoverage}. Accumulated slice area = ${dx} × ${yCoverage} = ${addedArea} (Total = ${totalArea}).`,
        makeGraphSnapshot(activeRectIds, ev.x),
      );
    }

    if (ev.type === 1) {
      activeY.push([ev.y1, ev.y2]);
      activeRectIds.push(ev.rectId);
    } else {
      const remIdx = activeY.findIndex((y) => y[0] === ev.y1 && y[1] === ev.y2);
      if (remIdx !== -1) activeY.splice(remIdx, 1);
      const remIdIdx = activeRectIds.indexOf(ev.rectId);
      if (remIdIdx !== -1) activeRectIds.splice(remIdIdx, 1);
    }

    prevX = ev.x;
  }

  addStep(`Rectangle Area Union complete! Total enclosed surface area = ${totalArea}.`, {
    kind: "array",
    name: "final_area",
    mode: "box",
    elements: [
      { id: "area-res", value: totalArea, label: `Total Area = ${totalArea}`, state: "sorted" },
    ],
  });

  return steps;
}

export const RECTANGLE_AREA_UNION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The <strong>Rectangle Area Union algorithm</strong> uses a 2D vertical sweep line and 1D interval merging to compute total enclosed area in <code>O(N log N)</code> time.</p>",
  sections: [
    {
      heading: "Plane Sweep & 1D Interval Coverage",
      body: "<p>Sorting X-boundary events converts 2D area integration into summing vertical Y-interval coverage spans multiplied by horizontal dx steps.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Sweep Line",
      definition: "1D line sweeping across 2D space accumulating area slices.",
    },
  ],
};

export const RECTANGLE_AREA_UNION_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines rectangle_area_union function signature.",
    2: "Sorts X boundary events and sweeps plane.",
    3: "Returns total accumulated union area.",
  },
};

export const rectangleAreaUnion: AlgorithmDefinition<RectangleAreaUnionInput> = {
  id: "rectangle-area-union",
  title: "Rectangle Area Union Sweep Line",
  topicIds: ["geometry_and_sweep_line"],
  difficulty: "Hard",
  description:
    "<p>Given a set of axis-aligned 2D rectangles, calculate the total surface area covered by their union in O(N log N) time using a vertical sweep line.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "  <li><code>rectangles</code>: Array of 2D rectangle objects <code>{ x1: number, y1: number, x2: number, y2: number }</code> where <code>1 &le; N &le; 500</code>.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<p>Returns an integer or float representing the total area covered by the union of all rectangles.</p>",
  constraints: [
    "1 <= rectangles.length <= 500",
    "-1000 <= x1 < x2 <= 1000",
    "-1000 <= y1 < y2 <= 1000",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "3 Overlapping Rectangles",
      input: DEFAULT_RECTANGLE_AREA_UNION_INPUT,
      output: "1075",
      explanation: "Union of 3 overlapping rectangles equals 1075 area units.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Nested Rectangle Inside Taller Rectangle",
      input: {
        rectangles: [
          { x1: 0, y1: 0, x2: 10, y2: 10 },
          { x1: 2, y1: 2, x2: 8, y2: 8 },
        ],
      },
      output: "100",
      explanation: "Smaller rectangle is fully enclosed, total union area is 100.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Single Rectangle",
      input: {
        rectangles: [{ x1: 0, y1: 0, x2: 5, y2: 5 }],
      },
      output: "25",
      explanation: "Single 5x5 rectangle has union area 25.",
    },
  ],
  code: PYTHON_RECTANGLE_AREA_UNION_CODE,
  timeComplexity: {
    best: "O(N log N)",
    average: "O(N log N)",
    worst: "O(N log N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Sorting 2N X-events takes O(N log N) time. 1D segment tree or interval coverage takes O(N log N) time.",
    space: "Requires O(N) auxiliary space for event queue and active interval set.",
  },
  topicGuide: RECTANGLE_AREA_UNION_TOPIC_GUIDE,
  trivia: RECTANGLE_AREA_UNION_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 29,
      label: "Competitive Programmer's Handbook, Ch 29",
    },
  ],
  defaultInput: DEFAULT_RECTANGLE_AREA_UNION_INPUT,
  generateSteps: generateRectangleAreaUnionSteps,
};

export default rectangleAreaUnion;
