import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface IntervalItem {
  id: string;
  start: number;
  end: number;
}

export interface IntervalSchedulingInput {
  intervals: IntervalItem[];
}

export const PYTHON_INTERVAL_SCHEDULING_CODE = `def interval_scheduling(intervals: list[tuple[int, int]]) -> list[tuple[int, int]]:
    intervals.sort(key=lambda x: x[1])
    selected = []
    last_end = float('-inf')

    for start, end in intervals:
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
  ],
};

export const generateIntervalSchedulingSteps = (input: IntervalSchedulingInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawIntervals = [...input.intervals];

  const createArrayElements = (
    currentList: IntervalItem[],
    activeIndex: number | null,
    selectedIndexSet: Set<number>,
    rejectedIndexSet: Set<number>,
  ): ArrayElement[] => {
    return currentList.map((item, idx) => {
      let state: ArrayElement["state"] = "default";
      if (selectedIndexSet.has(idx)) {
        state = "sorted";
      } else if (rejectedIndexSet.has(idx)) {
        state = "visited";
      } else if (idx === activeIndex) {
        state = "active";
      }

      return {
        id: item.id,
        value: item.end,
        state,
        pointers: [item.id, `[${item.start},${item.end}]`],
      };
    });
  };

  // Step 0: Input start
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Received ${rawIntervals.length} input intervals to schedule.`,
      why: "The goal is to select the maximum number of non-overlapping intervals.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createArrayElements(rawIntervals, null, new Set(), new Set()),
    },
    auxiliaryState: {
      customState: {
        totalIntervals: rawIntervals.length,
        status: "Unsorted input",
      },
    },
    variables: {
      intervalCount: rawIntervals.length,
    },
  });

  // Step 1: Sort by end time
  const sortedIntervals = [...rawIntervals].sort((a, b) => a.end - b.end);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Sorted all intervals by finish time in ascending order.",
      why: "Greedy choice principle: Finishing earlier leaves maximum available time for remaining intervals.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createArrayElements(sortedIntervals, null, new Set(), new Set()),
    },
    auxiliaryState: {
      customState: {
        sortedOrder: sortedIntervals.map((i) => `${i.id}:[${i.start},${i.end}]`).join(", "),
      },
    },
    variables: {
      sortedCount: sortedIntervals.length,
    },
  });

  // Step 2: Greedy Selection Loop
  const selected: IntervalItem[] = [];
  const selectedIndices = new Set<number>();
  const rejectedIndices = new Set<number>();
  let lastEnd = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < sortedIntervals.length; i++) {
    const current = sortedIntervals[i];

    // Check compatibility step
    const isCompatible = current.start >= lastEnd;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: `Evaluating interval ${current.id} [${current.start}, ${current.end}].`,
        why: `Compare start time (${current.start}) with last selected end time (${lastEnd === Number.NEGATIVE_INFINITY ? "-∞" : lastEnd}).`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createArrayElements(sortedIntervals, i, selectedIndices, rejectedIndices),
      },
      auxiliaryState: {
        visited: selected.map((s) => s.id),
        customState: {
          currentInterval: `${current.id} [${current.start}, ${current.end}]`,
          lastEnd: lastEnd === Number.NEGATIVE_INFINITY ? "-∞" : lastEnd,
          compatible: isCompatible ? "Yes" : "No (Overlap)",
        },
      },
      variables: {
        currentStart: current.start,
        currentEnd: current.end,
        lastEnd: lastEnd === Number.NEGATIVE_INFINITY ? -1 : lastEnd,
      },
    });

    if (isCompatible) {
      selected.push(current);
      selectedIndices.add(i);
      lastEnd = current.end;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 8,
        explanation: {
          what: `Selected interval ${current.id} [${current.start}, ${current.end}]. Updated lastEnd = ${lastEnd}.`,
          why: "Since it does not overlap with previously selected intervals, we greedily accept it.",
        },
        primarySnapshot: {
          kind: "array",
          elements: createArrayElements(sortedIntervals, i, selectedIndices, rejectedIndices),
        },
        auxiliaryState: {
          visited: selected.map((s) => `${s.id}[${s.start},${s.end}]`),
          customState: {
            lastEnd,
            countSelected: selected.length,
          },
        },
        variables: {
          lastEnd,
          selectedCount: selected.length,
        },
      });
    } else {
      rejectedIndices.add(i);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 7,
        explanation: {
          what: `Rejected interval ${current.id} [${current.start}, ${current.end}] due to overlap with previous end (${lastEnd}).`,
          why: "Accepting an overlapping interval would violate mutual compatibility.",
        },
        primarySnapshot: {
          kind: "array",
          elements: createArrayElements(sortedIntervals, i, selectedIndices, rejectedIndices),
        },
        auxiliaryState: {
          visited: selected.map((s) => `${s.id}[${s.start},${s.end}]`),
          customState: {
            rejected: current.id,
            reason: `start (${current.start}) < lastEnd (${lastEnd})`,
          },
        },
        variables: {
          lastEnd,
        },
      });
    }
  }

  // Final Step: Return result
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: `Algorithm finished. Selected ${selected.length} optimal non-overlapping intervals.`,
      why: "No more intervals remain to evaluate.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createArrayElements(sortedIntervals, null, selectedIndices, rejectedIndices),
    },
    auxiliaryState: {
      visited: selected.map((s) => `${s.id}[${s.start},${s.end}]`),
      customState: {
        totalSelected: selected.length,
        selectedList: selected.map((s) => `[${s.start},${s.end}]`).join(", "),
      },
    },
    variables: {
      resultCount: selected.length,
    },
  });

  return steps;
};

export const INTERVAL_SCHEDULING_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Interval Scheduling is a classic greedy problem where we are given a set of intervals (requests) with start and end times, and must select a maximum-cardinality subset of mutually compatible (non-overlapping) intervals.",
  sections: [
    {
      heading: "Greedy Strategy Rationale",
      body: "Sorting by finish time ensures that at each decision step, we pick the job that frees up the resource at the earliest possible moment, leaving maximum remaining time for subsequent jobs.",
    },
    {
      heading: "Optimality Proof",
      body: "Using an 'exchange argument', suppose an optimal solution OPT differs from greedy selection G. In the first differing interval, G's choice ends no later than OPT's choice. Substituting G's choice into OPT retains feasibility, proving greedy is optimal.",
    },
  ],
  keyTerms: [
    {
      term: "Earliest Finish Time (EFT)",
      definition: "Greedy choice criterion of selecting the interval that ends first.",
    },
    {
      term: "Mutual Compatibility",
      definition: "Two intervals [s1, e1] and [s2, e2] are compatible if s2 >= e1 or s1 >= e2.",
    },
  ],
};

export const INTERVAL_SCHEDULING_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines interval_scheduling: selects max non-overlapping intervals.",
    2: "Sorts intervals by their end (finish) time in ascending order.",
    3: "Initializes selected list to store chosen intervals.",
    4: "Initializes last_end to negative infinity.",
    6: "Iterates through each interval (start, end) in sorted order.",
    7: "Checks if current start >= last_end (non-overlapping condition).",
    8: "Appends current interval to selected list.",
    9: "Updates last_end to current interval's finish time.",
    11: "Returns optimal list of selected non-overlapping intervals.",
  },
};

export const intervalScheduling: AlgorithmDefinition<IntervalSchedulingInput> = {
  id: "interval-scheduling",
  title: "Interval Scheduling",
  category: "greedy_algorithms",
  difficulty: "Medium",
  description:
    "Given a set of intervals each with a start and end time, select the maximum number of mutually compatible intervals. The greedy choice of sorting intervals by finish time guarantees an optimal schedule.",
  constraints: ["1 <= intervals.length <= 10^5", "0 <= start < end <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Intervals",
      inputDisplay: "intervals = [[1,4],[3,5],[0,6],[5,7],[3,9],[5,9],[6,10],[8,11]]",
      outputDisplay: "Selected 4 intervals: [[1,4], [5,7], [8,11]] (3 non-overlapping)",
      input: {
        intervals: [
          { id: "I1", start: 1, end: 4 },
          { id: "I2", start: 3, end: 5 },
          { id: "I3", start: 0, end: 6 },
          { id: "I4", start: 5, end: 7 },
          { id: "I5", start: 8, end: 11 },
        ],
      },
      output: "Selected 3 non-overlapping intervals",
      explanation: "Greedily picking intervals by earliest finish time yields 3 non-overlapping intervals.",
    },
    {
      kind: "complex",
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
    time: "Sorting N intervals by finish time takes O(N log N) time. The subsequent single linear scan takes O(N) time. Thus total time is O(N log N).",
    space: "O(N) memory to store the sorted array and output list of selected intervals.",
  },
  topicGuide: INTERVAL_SCHEDULING_TOPIC_GUIDE,
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
