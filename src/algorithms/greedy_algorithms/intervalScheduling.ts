import type {
  AlgorithmDefinition,
  AlgorithmStep,
  CompositeCanvasSnapshot,
  ElementState,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface IntervalItem {
  id: string;
  start: number;
  end: number;
}

export interface IntervalSchedulingInput {
  intervals: IntervalItem[];
}

export const PYTHON_INTERVAL_SCHEDULING_CODE = `def interval_scheduling(intervals: list[tuple[int, int]]) -> list[tuple[int, int]]:
    sorted_intervals = sorted(intervals, key=lambda x: x[1])
    selected = []
    last_end = float("-inf")

    for start, end in sorted_intervals:
        if start >= last_end:
            selected.append((start, end))
            last_end = end

    return selected`;

export const DEFAULT_INTERVAL_SCHEDULING_INPUT: IntervalSchedulingInput = {
  intervals: [
    { id: "I1", start: 1, end: 4 },
    { id: "I2", start: 3, end: 5 },
    { id: "I3", start: 0, end: 6 },
    { id: "I4", start: 5, end: 7 },
    { id: "I5", start: 3, end: 9 },
    { id: "I6", start: 5, end: 9 },
    { id: "I7", start: 6, end: 10 },
    { id: "I8", start: 8, end: 11 },
    { id: "I9", start: 10, end: 12 },
    { id: "I10", start: 11, end: 14 },
  ],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Interval scheduling (Activity Selection) deals with allocating competing tasks to a single shared resource over time.",
    primarySnapshot: {
      kind: "interval",
      name: "tasks",
      axis: { min: 0, max: 15 },
      intervals: [
        { id: "t1", start: 1, end: 4, label: "Job A [1, 4]", state: "default", track: 0 },
        { id: "t2", start: 3, end: 7, label: "Job B [3, 7]", state: "default", track: 1 },
      ],
    },
  },
  {
    narrative:
      "The goal is to select the maximum possible number of mutually non-overlapping tasks.",
    primarySnapshot: {
      kind: "interval",
      name: "tasks",
      axis: { min: 0, max: 15 },
      intervals: [
        { id: "t1", start: 1, end: 4, label: "Job A [1, 4]", state: "compare", track: 0 },
        { id: "t2", start: 3, end: 7, label: "Job B [3, 7]", state: "compare", track: 1 },
      ],
    },
  },
  {
    narrative:
      "Exhaustive brute force tests all 2^N task subsets for compatibility, taking exponential O(2^N · N) time.",
    primarySnapshot: {
      kind: "interval",
      name: "tasks",
      axis: { min: 0, max: 15 },
      intervals: [
        { id: "t1", start: 1, end: 10, label: "Job 1 [1, 10]", state: "active", track: 0 },
        { id: "t2", start: 2, end: 5, label: "Job 2 [2, 5]", state: "compare", track: 1 },
        { id: "t3", start: 6, end: 9, label: "Job 3 [6, 9]", state: "compare", track: 2 },
      ],
    },
  },
  {
    narrative:
      "Flawed strategy: choosing shortest duration first fails when a short task blocks multiple non-overlapping tasks.",
    primarySnapshot: {
      kind: "interval",
      name: "shortest_flaw",
      axis: { min: 0, max: 15 },
      intervals: [
        { id: "f1", start: 1, end: 4, label: "Long 1 [1, 4]", state: "default", track: 0 },
        { id: "f2", start: 3, end: 5, label: "Short [3, 5]", state: "active", track: 1 },
        { id: "f3", start: 4, end: 7, label: "Long 2 [4, 7]", state: "default", track: 2 },
      ],
    },
  },
  {
    narrative:
      "Flawed strategy: choosing earliest start time first fails when an early task extends far into the future.",
    primarySnapshot: {
      kind: "interval",
      name: "earliest_start_flaw",
      axis: { min: 0, max: 15 },
      intervals: [
        { id: "e1", start: 1, end: 12, label: "Early-Long [1, 12]", state: "active", track: 0 },
        { id: "e2", start: 2, end: 4, label: "Task 2 [2, 4]", state: "default", track: 1 },
        { id: "e3", start: 5, end: 8, label: "Task 3 [5, 8]", state: "default", track: 2 },
      ],
    },
  },
  {
    narrative:
      "Optimal greedy rule: always select the compatible task with Earliest Finish Time (EFT).",
    primarySnapshot: {
      kind: "interval",
      name: "eft_rule",
      axis: { min: 0, max: 15 },
      intervals: [
        { id: "g1", start: 1, end: 4, label: "Finishes early [1, 4]", state: "sorted", track: 0 },
        { id: "g2", start: 0, end: 6, label: "Finishes late [0, 6]", state: "default", track: 1 },
      ],
    },
  },
  {
    narrative:
      "Finishing a task as early as possible frees the resource immediately, leaving maximum remaining capacity for future selections.",
    primarySnapshot: {
      kind: "interval",
      name: "remaining_capacity",
      axis: { min: 0, max: 15 },
      sweepLine: { position: 4, label: "Free at t=4", state: "sorted" },
      intervals: [
        { id: "g1", start: 1, end: 4, label: "Selected [1, 4]", state: "sorted", track: 0 },
        { id: "g3", start: 5, end: 8, label: "Available [5, 8]", state: "active", track: 1 },
      ],
    },
  },
  {
    narrative:
      "Exchange argument: swapping any optimal selection with the EFT selection preserves total capacity without introducing overlaps.",
    primarySnapshot: {
      kind: "interval",
      name: "exchange_proof",
      axis: { min: 0, max: 15 },
      intervals: [
        { id: "p1", start: 1, end: 4, label: "Greedy choice [1, 4]", state: "sorted", track: 0 },
        { id: "p2", start: 5, end: 8, label: "Next choice [5, 8]", state: "sorted", track: 1 },
      ],
    },
  },
  {
    narrative:
      "The greedy algorithm sorts N tasks by finish time in O(N log N) time and scans in O(N) time using O(N) auxiliary space.",
    primarySnapshot: {
      kind: "array",
      name: "schedule_summary",
      mode: "box",
      elements: [
        { id: "s1", value: 4, label: "[1, 4]", state: "sorted" },
        { id: "s2", value: 8, label: "[5, 8]", state: "sorted" },
      ],
    },
  },
];

export const generateIntervalSchedulingSteps = (
  input: IntervalSchedulingInput,
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

  const rawIntervals =
    Array.isArray(input?.intervals) && input.intervals.length > 0
      ? [...input.intervals]
      : [...DEFAULT_INTERVAL_SCHEDULING_INPUT.intervals];

  const isDefaultInput =
    !input ||
    (Array.isArray(input.intervals) &&
      input.intervals.length === DEFAULT_INTERVAL_SCHEDULING_INPUT.intervals.length &&
      input.intervals[0].id === DEFAULT_INTERVAL_SCHEDULING_INPUT.intervals[0].id);

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const sorted = [...rawIntervals].sort((a, b) => a.end - b.end || a.start - b.start);

  const makeCompositeSnapshot = (
    currentIdx: number | null,
    selectedSet: Set<number>,
    rejectedSet: Set<number>,
    lastEnd: number,
  ): CompositeCanvasSnapshot => {
    const minVal = Math.min(...sorted.map((i) => i.start), 0);
    const maxVal = Math.max(...sorted.map((i) => i.end), 15);

    return {
      kind: "composite",
      layout: "horizontal",
      items: [
        {
          id: "scheduling-intervals",
          role: "primary",
          snapshot: {
            kind: "interval",
            name: "tasks",
            axis: { min: minVal, max: maxVal },
            sweepLine:
              lastEnd > Number.NEGATIVE_INFINITY
                ? { position: lastEnd, label: `lastEnd=${lastEnd}`, state: "sorted" }
                : undefined,
            intervals: sorted.map((item, idx) => {
              let state: ElementState = "default";
              if (selectedSet.has(idx)) {
                state = "sorted";
              } else if (rejectedSet.has(idx)) {
                state = "visited";
              } else if (idx === currentIdx) {
                state = "active";
              }
              return {
                id: `tsk-${item.id}`,
                start: item.start,
                end: item.end,
                label: `${item.id} [${item.start}, ${item.end}]`,
                state,
                track: idx,
              };
            }),
          },
        },
        {
          id: "scheduled-output",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "selected_schedule",
            mode: "box",
            elements: sorted
              .filter((_, idx) => selectedSet.has(idx))
              .map((item) => ({
                id: `sel-${item.id}`,
                value: item.end,
                label: `${item.id} [${item.start},${item.end}]`,
                state: "sorted",
              })),
          },
        },
      ],
    };
  };

  addStep(
    `We start with ${sorted.length} candidate interval(s) sorted by Earliest Finish Time (EFT): ${sorted.map((i) => `${i.id}[${i.start},${i.end}]`).join(", ")}.`,
    makeCompositeSnapshot(null, new Set(), new Set(), Number.NEGATIVE_INFINITY),
  );

  const selectedSet = new Set<number>();
  const rejectedSet = new Set<number>();
  let lastEnd = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    addStep(
      `Inspect candidate ${current.id} [${current.start}, ${current.end}] against threshold lastEnd = ${lastEnd === Number.NEGATIVE_INFINITY ? "-∞" : lastEnd}.`,
      makeCompositeSnapshot(i, selectedSet, rejectedSet, lastEnd),
    );

    if (current.start >= lastEnd) {
      selectedSet.add(i);
      lastEnd = current.end;
      addStep(
        `Since start (${current.start}) ≥ lastEnd (${lastEnd === current.end && selectedSet.size === 1 ? "-∞" : current.start}), interval ${current.id} is compatible! Accept ${current.id} into schedule and update lastEnd to ${lastEnd}.`,
        makeCompositeSnapshot(i, selectedSet, rejectedSet, lastEnd),
      );
    } else {
      rejectedSet.add(i);
      addStep(
        `Since start (${current.start}) < lastEnd (${lastEnd}), interval ${current.id} overlaps with the active schedule. Reject ${current.id}.`,
        makeCompositeSnapshot(i, selectedSet, rejectedSet, lastEnd),
      );
    }
  }

  addStep(
    `Interval scheduling complete! Selected maximum set of ${selectedSet.size} non-overlapping task(s): ${sorted
      .filter((_, idx) => selectedSet.has(idx))
      .map((i) => i.id)
      .join(", ")}.`,
    makeCompositeSnapshot(null, selectedSet, rejectedSet, lastEnd),
  );

  return steps;
};

export const INTERVAL_SCHEDULING_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines `interval_scheduling(intervals)` function signature taking a list of interval tuples `(start, end)`.",
    2: "Sorts intervals by Earliest Finish Time (EFT) using `sorted()` with key `lambda x: x[1]` in O(N log N) time.",
    3: "Initializes `selected = []` as an empty list to collect accepted non-overlapping intervals.",
    4: "Initializes `last_end = float('-inf')` to track the finish time of the most recently accepted interval.",
    5: "Blank line separator before the greedy iteration loop.",
    6: "Loops over each `(start, end)` interval tuple in `sorted_intervals` in ascending finish order.",
    7: "Evaluates greedy choice condition `start >= last_end` to check compatibility with previously selected intervals.",
    8: "Appends compatible interval `(start, end)` to `selected` list.",
    9: "Updates threshold `last_end = end` to current interval's finish time.",
    10: "Blank line separator after loop completion.",
    11: "Returns `selected` list containing the optimal maximum-cardinality non-overlapping schedule.",
  },
};

export const intervalScheduling: AlgorithmDefinition<IntervalSchedulingInput> = {
  id: "interval-scheduling",
  title: "Interval Scheduling",
  topicIds: ["greedy_algorithms", "two_pointers"],
  difficulty: "Medium",
  description:
    "<p>Given a collection of intervals each defined by a start time and end time, find a maximum-cardinality subset of mutually compatible (non-overlapping) intervals.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "  <li><code>intervals</code>: An array of interval objects <code>{ id: string, start: number, end: number }</code> where <code>1 &le; N &le; 10<sup>5</sup></code>.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<p>Returns an array of selected non-overlapping interval objects forming an optimal maximum-cardinality schedule.</p>",
  constraints: ["1 <= intervals.length <= 10^5", "0 <= start < end <= 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard 10-Task Schedule",
      inputDisplay:
        "intervals = [[1,4],[3,5],[0,6],[5,7],[3,9],[5,9],[6,10],[8,11],[10,12],[11,14]]",
      outputDisplay: "Selected 4 non-overlapping intervals",
      input: DEFAULT_INTERVAL_SCHEDULING_INPUT,
      output: "Selected 4 non-overlapping intervals",
      explanation:
        "Greedily selecting intervals by earliest finish time yields 4 non-overlapping tasks.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Densely Overlapping Intervals",
      inputDisplay: "intervals = [[1,2],[2,3],[3,4],[1,3],[2,4]]",
      outputDisplay: "Selected 3 intervals: [[1,2], [2,3], [3,4]]",
      input: {
        intervals: [
          { id: "A", start: 1, end: 2 },
          { id: "B", start: 2, end: 3 },
          { id: "C", start: 3, end: 4 },
          { id: "D", start: 1, end: 3 },
          { id: "E", start: 2, end: 4 },
        ],
      },
      output: "Selected 3 intervals",
      explanation: "Adjacent intervals touching at boundaries ([1,2] and [2,3]) are compatible.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "All Overlapping Intervals",
      inputDisplay: "intervals = [[1,10],[2,10],[3,10]]",
      outputDisplay: "Selected 1 interval: [[1,10]]",
      input: {
        intervals: [
          { id: "X", start: 1, end: 10 },
          { id: "Y", start: 2, end: 10 },
          { id: "Z", start: 3, end: 10 },
        ],
      },
      output: "Selected 1 interval",
      explanation: "All intervals overlap with each other, so at most 1 interval can be scheduled.",
    },
  ],
  code: PYTHON_INTERVAL_SCHEDULING_CODE,
  timeComplexity: {
    best: "O(N log N)",
    average: "O(N log N)",
    worst: "O(N log N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Sorting N intervals by finish time takes O(N log N) time. The subsequent linear sweep pass takes O(N) time, yielding O(N log N) total execution time.",
    space: "O(N) memory to store the sorted array and output list of selected intervals.",
  },
  topicGuide: {
    overview:
      "<p>Interval Scheduling (also known as the Activity Selection Problem) finds a maximum-cardinality set of mutually compatible non-overlapping intervals from a collection of candidate activities. By sorting candidate intervals by Earliest Finish Time (EFT), the greedy choice provably maximizes the number of scheduled tasks on a single shared resource.</p>",
    sections: [
      {
        heading: "Why Earliest Finish Time (EFT) Works",
        body: "<p>Picking the interval with the earliest finish time leaves the maximum possible remaining time for all subsequent tasks. Any alternative interval ending later can only restrict future options further.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Earliest Finish Time (EFT)",
        definition:
          "The greedy selection rule prioritizing intervals by smallest finish coordinate to maximize remaining resource availability.",
      },
    ],
  },
  trivia: INTERVAL_SCHEDULING_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 6",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 6,
      section: "6.1 Scheduling",
    },
  ],
  defaultInput: DEFAULT_INTERVAL_SCHEDULING_INPUT,
  generateSteps: generateIntervalSchedulingSteps,
};

export default intervalScheduling;
