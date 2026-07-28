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

export const generateIntervalSchedulingSteps = (
  input: IntervalSchedulingInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawIntervals = [...(input?.intervals ?? DEFAULT_INTERVAL_SCHEDULING_INPUT.intervals)];

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

  // Line 1: Function entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Function call: interval_scheduling with ${rawIntervals.length} candidate intervals.`,
      why: "Our objective is to greedily pick the maximum possible number of mutually non-overlapping intervals.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createArrayElements(rawIntervals, null, new Set(), new Set()),
    },
    auxiliaryState: {
      customState: {
        totalIntervals: rawIntervals.length,
        status: "Input received",
      },
    },
    variables: {
      intervalCount: rawIntervals.length,
    },
  });

  // Line 2: Sort by finish time
  const sortedIntervals = [...rawIntervals].sort((a, b) => a.end - b.end || a.start - b.start);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Sorted ${sortedIntervals.length} intervals by finish time in ascending order.`,
      why: "Earliest Finish Time (EFT) greedy strategy: completing jobs as early as possible frees the resource for subsequent intervals.",
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

  // Line 3: Initialize selected list
  const selected: IntervalItem[] = [];
  const selectedIndices = new Set<number>();
  const rejectedIndices = new Set<number>();

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: "Initialized empty selected list `selected = []`.",
      why: "This array will store the optimal subset of non-overlapping intervals.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createArrayElements(sortedIntervals, null, selectedIndices, rejectedIndices),
    },
    auxiliaryState: {
      visited: [],
      customState: {
        selectedCount: 0,
      },
    },
    variables: {
      selectedCount: 0,
    },
  });

  // Line 4: Initialize last_end
  let lastEnd = Number.NEGATIVE_INFINITY;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialized threshold `last_end = float('-inf')`.",
      why: "Any valid initial interval will have `start >= -inf`, ensuring the first sorted interval is accepted.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createArrayElements(sortedIntervals, null, selectedIndices, rejectedIndices),
    },
    auxiliaryState: {
      visited: [],
      customState: {
        lastEnd: "-∞",
      },
    },
    variables: {
      lastEnd: -1,
    },
  });

  // Loop: evaluate candidates
  for (let i = 0; i < sortedIntervals.length; i++) {
    const current = sortedIntervals[i];

    // Line 6: For loop iteration header
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: `Loop step ${i + 1}/${sortedIntervals.length}: inspect interval ${current.id} [${current.start}, ${current.end}].`,
        why: "Fetch next interval in sorted order to evaluate compatibility.",
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
        },
      },
      variables: {
        currentStart: current.start,
        currentEnd: current.end,
        lastEnd: lastEnd === Number.NEGATIVE_INFINITY ? -1 : lastEnd,
      },
    });

    const isCompatible = current.start >= lastEnd;

    // Line 7: Evaluate if condition
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: `Evaluate condition: start (${current.start}) >= lastEnd (${lastEnd === Number.NEGATIVE_INFINITY ? "-∞" : lastEnd}) -> ${isCompatible ? "TRUE" : "FALSE"}`,
        why: isCompatible
          ? `Interval ${current.id} starts at ${current.start}, which is >= finish time ${lastEnd === Number.NEGATIVE_INFINITY ? "-∞" : lastEnd}. No overlap!`
          : `Interval ${current.id} starts at ${current.start}, which is < finish time ${lastEnd}. Overlap detected!`,
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
          compatible: isCompatible ? "True" : "False",
        },
      },
      variables: {
        isCompatible,
        currentStart: current.start,
        lastEnd: lastEnd === Number.NEGATIVE_INFINITY ? -1 : lastEnd,
      },
    });

    if (isCompatible) {
      selected.push(current);
      selectedIndices.add(i);

      // Line 8: append to selected
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 8,
        explanation: {
          what: `Append ${current.id} [${current.start}, ${current.end}] to selected schedule.`,
          why: "Since it is compatible, greedily accepting this interval maximizes available remaining schedule space.",
        },
        primarySnapshot: {
          kind: "array",
          elements: createArrayElements(sortedIntervals, i, selectedIndices, rejectedIndices),
        },
        auxiliaryState: {
          visited: selected.map((s) => `${s.id}[${s.start},${s.end}]`),
          customState: {
            status: "Accepted",
            selectedCount: selected.length,
          },
        },
        variables: {
          selectedCount: selected.length,
        },
      });

      lastEnd = current.end;

      // Line 9: update last_end
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 9,
        explanation: {
          what: `Update threshold last_end = ${lastEnd} (end time of ${current.id}).`,
          why: "Future selected intervals must start at or after this updated finish time.",
        },
        primarySnapshot: {
          kind: "array",
          elements: createArrayElements(sortedIntervals, i, selectedIndices, rejectedIndices),
        },
        auxiliaryState: {
          visited: selected.map((s) => `${s.id}[${s.start},${s.end}]`),
          customState: {
            lastEnd,
            selectedCount: selected.length,
          },
        },
        variables: {
          lastEnd,
          selectedCount: selected.length,
        },
      });
    } else {
      rejectedIndices.add(i);

      // Line 7: reject branch explanation
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 7,
        explanation: {
          what: `Reject interval ${current.id} [${current.start}, ${current.end}] (overlaps with previous ending at ${lastEnd}).`,
          why: "Discarding overlapping candidates is required to maintain mutual compatibility.",
        },
        primarySnapshot: {
          kind: "array",
          elements: createArrayElements(sortedIntervals, i, selectedIndices, rejectedIndices),
        },
        auxiliaryState: {
          visited: selected.map((s) => `${s.id}[${s.start},${s.end}]`),
          customState: {
            rejected: current.id,
            reason: `start ${current.start} < lastEnd ${lastEnd}`,
          },
        },
        variables: {
          lastEnd,
        },
      });
    }
  }

  // Line 11: Loop completion
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: "Finished inspecting all sorted intervals.",
      why: "All candidate intervals have been evaluated against the Earliest Finish Time criterion.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createArrayElements(sortedIntervals, null, selectedIndices, rejectedIndices),
    },
    auxiliaryState: {
      visited: selected.map((s) => `${s.id}[${s.start},${s.end}]`),
      customState: {
        totalSelected: selected.length,
      },
    },
    variables: {
      selectedCount: selected.length,
    },
  });

  // Line 11: Return result
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: `Return selected schedule with ${selected.length} non-overlapping intervals.`,
      why: `Optimal schedule: ${selected.map((s) => `[${s.start},${s.end}]`).join(", ")}.`,
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
    "Interval Scheduling (also known as the Activity Selection Problem) finds a maximum-cardinality set of mutually compatible non-overlapping intervals from a collection of candidate activities. By sorting candidate intervals by Earliest Finish Time (EFT), the greedy choice provably maximizes the number of scheduled tasks on a single shared resource. Key applications include CPU task execution scheduling, satellite transmission window reservation, and meeting room assignment.",
  sections: [
    {
      heading: "Why Earliest Finish Time (EFT) Works",
      body: "Picking the interval with the earliest finish time leaves the maximum possible remaining time for all subsequent tasks. Any alternative interval ending later can only restrict future options further. This local choice guarantees optimal remaining capacity for future selections. Thus, making the earliest finish time greedy choice at every step produces a globally optimal schedule.",
    },
    {
      heading: "Exchange Argument Proof of Optimality",
      body: "Let $G = [g_1, g_2, \\dots, g_k]$ be the greedy schedule sorted by finish time. Let $OPT = [o_1, o_2, \\dots, o_m]$ be any optimal schedule. By mathematical induction, $\\text{finish}(g_i) \\le \\text{finish}(o_i)$ for all $i$. Replacing $o_1$ with $g_1$ preserves compatibility for all remaining intervals in $OPT$, proving $|G| = |OPT|$.",
    },
    {
      heading: "Flawed Heuristics Counter-Examples",
      body: "Other greedy criteria fail on simple inputs. Shortest Duration First fails for $[1,4]$, $[3,5]$, $[4,7]$ where selecting $[3,5]$ yields 1 job instead of 2. Earliest Start Time First fails for $[1,10]$, $[2,3]$, $[4,5]$ where selecting $[1,10]$ yields 1 job instead of 2. Fewest Overlaps First also fails on specific graph configurations.",
    },
    {
      heading: "Boundary Conditions & Touch Conventions",
      body: "In standard interval scheduling, touching boundaries where $\\text{start} = \\text{last\\_end}$ are compatible under $\\text{start} \\ge \\text{last\\_end}$. If strict separation $\\text{start} > \\text{last\\_end}$ is required, modifying the operator preserves identical asymptotic performance. Always clarify boundary inclusivity in interview settings. Small changes in inequality constraints alter valid solutions without breaking the greedy core.",
    },
    {
      heading: "Algorithmic Family Comparisons",
      body: "Contrast Interval Scheduling which maximizes job count in $O(N \\log N)$ time. Compare it with Weighted Interval Scheduling where jobs carry values, solved via Dynamic Programming in $O(N \\log N)$ time. Also compare with Interval Partitioning which finds minimum resource rooms to host all jobs, solved with min-heaps in $O(N \\log N)$ time. Understanding these distinctions helps select the correct pattern immediately.",
    },
  ],
  keyTerms: [
    {
      term: "Earliest Finish Time (EFT)",
      definition:
        "The greedy selection rule prioritizing intervals by smallest finish coordinate to maximize remaining resource availability.",
    },
    {
      term: "Mutual Compatibility",
      definition:
        "The property where no two chosen intervals share an overlapping interior time span.",
    },
    {
      term: "Exchange Argument",
      definition:
        "A formal proof technique showing a greedy choice can be swapped into any optimal solution without loss of quality.",
    },
    {
      term: "Activity Selection",
      definition:
        "The canonical problem of maximizing non-overlapping resource allocations over time.",
    },
  ],
};

export const INTERVAL_SCHEDULING_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines `interval_scheduling(intervals)` function signature taking a list of interval tuples `(start, end)`.",
    2: "Sorts intervals by Earliest Finish Time (EFT) using `sorted()` with key `lambda x: x[1]` in $O(N \\log N)$ time.",
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
    "Given a collection of intervals each defined by a start time and end time, find a maximum-cardinality subset of mutually compatible (non-overlapping) intervals.\n\n" +
    "### Problem Overview\n" +
    "Select the maximum number of intervals such that no two selected intervals overlap. Greedily picking intervals in ascending order of finish time (Earliest Finish Time) guarantees an optimal schedule.\n\n" +
    "### Key Insights & Proof Sketch\n" +
    "- **Earliest Finish Time (EFT)**: Finishing a job as early as possible leaves maximum remaining time for remaining activities.\n" +
    "- **Exchange Argument**: Let $g_1$ be the greedy choice and $o_1$ be the first interval in an optimal schedule $OPT$. Since $\\text{end}(g_1) \\le \\text{end}(o_1)$, swapping $o_1$ with $g_1$ yields another optimal schedule.\n\n" +
    "### Complexity\n" +
    "- **Time**: $O(N \\log N)$ where $N$ is the number of intervals, dominated by the sorting step.\n" +
    "- **Space**: $O(N)$ for storing the sorted intervals and selected schedule.",
  constraints: ["1 <= intervals.length <= 10^5", "0 <= start < end <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Intervals",
      inputDisplay: "intervals = [[1,4],[3,5],[0,6],[5,7],[8,11]]",
      outputDisplay: "Selected 3 non-overlapping intervals: [[1,4], [5,7], [8,11]]",
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
      explanation:
        "Greedily picking intervals by earliest finish time yields 3 non-overlapping intervals.",
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
    time: "Sorting N intervals by finish time takes O(N log N) time. The subsequent linear sweep pass takes O(N) time, yielding O(N log N) total execution time.",
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
