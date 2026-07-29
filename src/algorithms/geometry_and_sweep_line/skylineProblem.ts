import type {
  AlgorithmDefinition,
  AlgorithmStep,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface Building {
  left: number;
  right: number;
  height: number;
}

export interface SkylineProblemInput {
  buildings: Building[];
}

export const PYTHON_SKYLINE_PROBLEM_CODE = `import heapq

def get_skyline(buildings: list[list[int]]) -> list[list[int]]:
    events = []
    for l, r, h in buildings:
        events.append((l, -h, r))
        events.append((r, 0, 0))
        
    events.sort()
    
    result = [[0, 0]]
    live = [(0, float('inf'))]
    
    for x, neg_h, r in events:
        while live[0][1] <= x:
            heapq.heappop(live)
            
        if neg_h < 0:
            heapq.heappush(live, (neg_h, r))
            
        if result[-1][1] != -live[0][0]:
            result.append([x, -live[0][0]])
            
    return result[1:]

def skyline_problem(buildings: list[list[int]]) -> list[list[int]]:
    return get_skyline(buildings)`;

export const DEFAULT_SKYLINE_PROBLEM_INPUT: SkylineProblemInput = {
  buildings: [
    { left: 2, right: 9, height: 10 },
    { left: 3, right: 7, height: 15 },
    { left: 5, right: 12, height: 12 },
    { left: 15, right: 20, height: 10 },
    { left: 19, right: 24, height: 8 },
  ],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Skyline Problem traces the outer collective silhouette formed by N overlapping rectangular buildings [L, R, H].",
    primarySnapshot: {
      kind: "graph",
      nodes: [
        { id: "b1_l", label: "B1(2,10)", x: 50, y: 100, state: "default" },
        { id: "b1_r", label: "B1(9,10)", x: 200, y: 100, state: "default" },
        { id: "b2_l", label: "B2(3,15)", x: 80, y: 150, state: "default" },
        { id: "b2_r", label: "B2(7,15)", x: 150, y: 150, state: "default" },
      ],
      edges: [],
    },
  },
  {
    narrative:
      "Output format: key points [x, h] marking locations where the top skyline height changes.",
    primarySnapshot: {
      kind: "array",
      name: "key_points",
      mode: "box",
      elements: [
        { id: "kp1", value: 10, label: "[2, 10]", state: "sorted" },
        { id: "kp2", value: 15, label: "[3, 15]", state: "sorted" },
        { id: "kp3", value: 12, label: "[7, 12]", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Naive approach: sampling height at every integer X coordinate takes O(X_max · N) time, which is too slow for large coordinate ranges.",
    primarySnapshot: {
      kind: "array",
      name: "naive_sampling",
      mode: "box",
      elements: [
        { id: "x0", value: 0, label: "x=0", state: "compare" },
        { id: "x1", value: 1, label: "x=1", state: "compare" },
        { id: "x2", value: 2, label: "x=2", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Sweep line algorithm: process discrete building events sorted along the X-axis from left to right.",
    primarySnapshot: {
      kind: "array",
      name: "event_timeline",
      mode: "box",
      elements: [
        { id: "e1", value: 2, label: "x=2: START B1", state: "sorted" },
        { id: "e2", value: 3, label: "x=3: START B2", state: "sorted" },
        { id: "e3", value: 7, label: "x=7: END B2", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Event generation: each building [L, R, H] emits a START event at x = L (adding height H) and an END event at x = R (removing height H).",
    primarySnapshot: {
      kind: "array",
      name: "events_list",
      mode: "box",
      elements: [
        { id: "start", value: 10, label: "START L=2, H=10", state: "active" },
        { id: "end", value: 10, label: "END R=9, H=10", state: "visited" },
      ],
    },
  },
  {
    narrative:
      "Event sorting tie-breakers: sort events primarily by X; at equal X, process taller START events before shorter ones.",
    primarySnapshot: {
      kind: "array",
      name: "tie_breakers",
      mode: "box",
      elements: [{ id: "tb1", value: 15, label: "H=15 before H=10", state: "sorted" }],
    },
  },
  {
    narrative:
      "Active height tracking: maintain a Max-Heap of active building heights (including ground height 0).",
    primarySnapshot: {
      kind: "heap",
      name: "max_heap_heights",
      heapType: "max",
      heap: [15, 12, 10, 0],
    },
  },
  {
    narrative:
      "Height change invariant: whenever the maximum active height changes at position x, emit key point [x, max_height].",
    primarySnapshot: {
      kind: "array",
      name: "emitted_keypoint",
      mode: "box",
      elements: [{ id: "kp", value: 15, label: "Key Point [3, 15]", state: "active" }],
    },
  },
  {
    narrative:
      "The Sweep Line Skyline algorithm executes in optimal O(N log N) time using O(N) auxiliary space.",
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

export function generateSkylineProblemSteps(input: SkylineProblemInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIdx = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIdx++, phase, narrative, primarySnapshot }));
  };

  const rawBuildings =
    input && Array.isArray(input.buildings) && input.buildings.length > 0
      ? input.buildings
      : DEFAULT_SKYLINE_PROBLEM_INPUT.buildings;

  const isDefaultInput =
    !input ||
    (Array.isArray(input.buildings) &&
      input.buildings.length === DEFAULT_SKYLINE_PROBLEM_INPUT.buildings.length &&
      input.buildings[0].left === DEFAULT_SKYLINE_PROBLEM_INPUT.buildings[0].left);

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  interface Event {
    x: number;
    height: number;
    type: "START" | "END";
    bldgId: number;
  }

  const events: Event[] = [];
  rawBuildings.forEach((b, idx) => {
    events.push({ x: b.left, height: b.height, type: "START", bldgId: idx });
    events.push({ x: b.right, height: b.height, type: "END", bldgId: idx });
  });

  events.sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    if (a.type === "START" && b.type === "START") return b.height - a.height;
    if (a.type === "END" && b.type === "END") return a.height - b.height;
    return a.type === "START" ? -1 : 1;
  });

  addStep(
    `Initialize Skyline sweep line for ${rawBuildings.length} building(s). Generated and sorted ${events.length} events.`,
    {
      kind: "array",
      name: "buildings",
      mode: "box",
      elements: rawBuildings.map((b, idx) => ({
        id: `b-${idx}`,
        value: b.height,
        label: `B${idx + 1}[${b.left},${b.right},H:${b.height}]`,
        state: "default",
      })),
    },
  );

  const activeHeights: number[] = [0];
  const skylineKeyPoints: Array<[number, number]> = [];
  let prevMaxH = 0;

  for (let evIdx = 0; evIdx < events.length; evIdx++) {
    const ev = events[evIdx];

    if (ev.type === "START") {
      activeHeights.push(ev.height);
      activeHeights.sort((a, b) => b - a);
    } else {
      const idx = activeHeights.indexOf(ev.height);
      if (idx !== -1) {
        activeHeights.splice(idx, 1);
      }
    }

    const currentMaxH = activeHeights[0] || 0;

    if (currentMaxH !== prevMaxH) {
      skylineKeyPoints.push([ev.x, currentMaxH]);
      prevMaxH = currentMaxH;

      addStep(
        `Sweep line reaches x = ${ev.x} (${ev.type} B${ev.bldgId + 1} H:${ev.height}). Max height changed from ${prevMaxH} to ${currentMaxH}. Emitted key point [${ev.x}, ${currentMaxH}].`,
        {
          kind: "composite",
          layout: "horizontal",
          items: [
            {
              id: "heap-view",
              role: "primary",
              snapshot: {
                kind: "heap",
                name: "active_heights",
                heapType: "max",
                heap: [...activeHeights],
              },
            },
            {
              id: "skyline-view",
              role: "auxiliary",
              snapshot: {
                kind: "array",
                name: "key_points",
                mode: "box",
                elements: skylineKeyPoints.map((kp, i) => ({
                  id: `kp-${i}`,
                  value: kp[1],
                  label: `[${kp[0]}, ${kp[1]}]`,
                  state: "sorted",
                })),
              },
            },
          ],
        },
      );
    }
  }

  addStep(
    `Skyline Problem complete! Generated ${skylineKeyPoints.length} key point(s): ${skylineKeyPoints.map((kp) => `[${kp[0]}, ${kp[1]}]`).join(", ")}.`,
    {
      kind: "array",
      name: "final_skyline",
      mode: "box",
      elements: skylineKeyPoints.map((kp, i) => ({
        id: `final-kp-${i}`,
        value: kp[1],
        label: `[${kp[0]}, ${kp[1]}]`,
        state: "sorted",
      })),
    },
  );

  return steps;
}

export const SKYLINE_PROBLEM_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The <strong>Skyline Problem</strong> computes the outer key-point silhouette formed by N overlapping 2D rectangular buildings using a vertical sweep line and max-priority queue in <code>O(N log N)</code> time.</p>",
  sections: [
    {
      heading: "Event Processing & Tie Breaking",
      body: "<p>Start and end events are sorted by X-coordinate. Maintaining a Max-Heap of active heights detects whenever the max height changes.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Skyline Key Point",
      definition: "A coordinate pair [x, h] where the outer silhouette height changes.",
    },
  ],
};

export const SKYLINE_PROBLEM_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines get_skyline function signature.",
    2: "Emits START and END building events.",
    3: "Sorts events and tracks max height with priority queue.",
  },
};

export const skylineProblem: AlgorithmDefinition<SkylineProblemInput> = {
  id: "skyline-problem",
  title: "The Skyline Problem Sweep Line",
  topicIds: ["geometry_and_sweep_line"],
  difficulty: "Hard",
  description:
    "<p>Given N rectangular buildings represented by [left, right, height], compute the outer skyline silhouette key points [x, height] using a vertical sweep line algorithm.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "  <li><code>buildings</code>: Array of building objects <code>{ left: number, right: number, height: number }</code> where <code>1 &le; N &le; 1000</code>.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<p>Returns an array of key point coordinate pairs <code>[x, height]</code> where the skyline height changes.</p>",
  constraints: [
    "1 <= buildings.length <= 1000",
    "0 <= left < right <= 10000",
    "1 <= height <= 1000",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "5 Overlapping Buildings",
      input: DEFAULT_SKYLINE_PROBLEM_INPUT,
      output: "Key points [[2,10],[3,15],[7,12],[12,0],[15,10],[20,8],[24,0]]",
      explanation: "Tracing the upper envelope of buildings yields 7 skyline key points.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Nested Buildings",
      input: {
        buildings: [
          { left: 1, right: 10, height: 10 },
          { left: 2, right: 5, height: 5 },
        ],
      },
      output: "Key points [[1,10],[10,0]]",
      explanation: "Shorter nested building is hidden under taller building.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Single Building",
      input: {
        buildings: [{ left: 5, right: 15, height: 20 }],
      },
      output: "Key points [[5,20],[15,0]]",
      explanation: "Single building creates start and end key points.",
    },
  ],
  code: PYTHON_SKYLINE_PROBLEM_CODE,
  timeComplexity: {
    best: "O(N log N)",
    average: "O(N log N)",
    worst: "O(N log N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Sorting 2N events takes O(N log N) time. Priority queue insertions and removals for active heights take O(N log N) time.",
    space: "Requires O(N) auxiliary space for event queue and max-heap.",
  },
  topicGuide: SKYLINE_PROBLEM_TOPIC_GUIDE,
  trivia: SKYLINE_PROBLEM_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 30,
      label: "Competitive Programmer's Handbook, Ch 30",
    },
  ],
  defaultInput: DEFAULT_SKYLINE_PROBLEM_INPUT,
  generateSteps: generateSkylineProblemSteps,
};

export default skylineProblem;
