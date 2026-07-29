import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface BinarySearch1dInput {
  array: number[];
  target: number;
  mode?: "exact" | "lower_bound" | "upper_bound";
}

export const BINARY_SEARCH_1D_CODE = `def binary_search_1d(arr: list[int], target: int) -> int:
    left, right = 0, len(arr) - 1
    found_idx = -1

    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            found_idx = mid
            break
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return found_idx

def lower_bound(arr: list[int], target: int) -> int:
    left, right = 0, len(arr)
    while left < right:
        mid = (left + right) // 2
        if arr[mid] < target:
            left = mid + 1
        else:
            right = mid
    return left

def upper_bound(arr: list[int], target: int) -> int:
    left, right = 0, len(arr)
    while left < right:
        mid = (left + right) // 2
        if arr[mid] <= target:
            left = mid + 1
        else:
            right = mid
    return left`;

export const DEFAULT_BINARY_SEARCH_1D_INPUT: BinarySearch1dInput = {
  array: [2, 5, 8, 12, 16, 21, 25, 29, 34, 38, 42, 47, 56, 63, 72, 81, 91, 99],
  target: 72,
  mode: "exact",
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "1D Binary Search is an O(log N) algorithm that locates target values or boundary thresholds in sorted arrays by repeatedly probing the midpoint and discarding half of the remaining elements.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "e1", value: 2, label: "[0]", state: "default" },
        { id: "e2", value: 8, label: "[1]", state: "default" },
        { id: "e3", value: 16, label: "[2]", state: "default" },
        { id: "e4", value: 25, label: "[3]", state: "default" },
        { id: "e5", value: 42, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Monotonic non-decreasing order is a mandatory requirement: because elements are ordered, probing element arr[mid] guarantees whether target must lie in the left or right sub-interval.",
    primarySnapshot: {
      kind: "array",
      name: "sorted_order",
      mode: "box",
      elements: [
        { id: "s1", value: "Strict Monotonic Order", state: "sorted" },
        { id: "s2", value: "Unsorted Array -> Unusable", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "While a linear search inspects elements one by one taking O(N) comparisons, Binary Search halves the candidate space on every iteration, reaching targets in at most log2(N) probes.",
    primarySnapshot: {
      kind: "array",
      name: "efficiency",
      mode: "box",
      elements: [
        { id: "ef1", value: "Linear Scan: O(N)", state: "compare" },
        { id: "ef2", value: "Binary Search: O(log N)", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "We maintain search pointers left = 0 and right = N - 1 defining the active candidate interval [left, right].",
    primarySnapshot: {
      kind: "array",
      name: "pointers",
      mode: "box",
      elements: [
        { id: "p1", value: 2, label: "[0]", state: "active", pointers: ["left"] },
        { id: "p2", value: 16, label: "[2]", state: "default" },
        { id: "p3", value: 42, label: "[4]", state: "active", pointers: ["right"] },
      ],
    },
  },
  {
    narrative:
      "At each step, we calculate mid = left + floor((right - left) / 2) to split the active candidate interval evenly.",
    primarySnapshot: {
      kind: "array",
      name: "midpoint",
      mode: "box",
      elements: [
        { id: "m1", value: 2, label: "left", state: "active" },
        { id: "m2", value: 16, label: "mid", state: "compare", pointers: ["mid"] },
        { id: "m3", value: 42, label: "right", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Comparing arr[mid] against target dictates the next move: if arr[mid] == target, search succeeds; if arr[mid] < target, shift left = mid + 1; else shift right = mid - 1.",
    primarySnapshot: {
      kind: "array",
      name: "branching",
      mode: "box",
      elements: [
        { id: "b1", value: "arr[mid] < target -> left = mid + 1", state: "compare" },
        { id: "b2", value: "arr[mid] > target -> right = mid - 1", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Lower Bound mode searches for the first index where arr[i] >= target, while Upper Bound mode searches for the first index where arr[i] > target.",
    primarySnapshot: {
      kind: "array",
      name: "bounds",
      mode: "box",
      elements: [
        { id: "lb", value: "Lower Bound: arr[i] >= target", state: "sorted" },
        { id: "ub", value: "Upper Bound: arr[i] > target", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Binary Search achieves O(log N) worst-case time complexity using strictly O(1) auxiliary memory space.",
    primarySnapshot: {
      kind: "array",
      name: "summary",
      mode: "box",
      elements: [
        { id: "sum1", value: "Time: O(log N)", state: "sorted" },
        { id: "sum2", value: "Space: O(1)", state: "default" },
      ],
    },
  },
];

export const generateBinarySearch1dSteps = (input: BinarySearch1dInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const safeInput = {
    array: Array.isArray(input?.array) ? input.array : DEFAULT_BINARY_SEARCH_1D_INPUT.array,
    target:
      typeof input?.target === "number" ? input.target : DEFAULT_BINARY_SEARCH_1D_INPUT.target,
    mode: input?.mode ?? DEFAULT_BINARY_SEARCH_1D_INPUT.mode,
  };
  const arr = [...safeInput.array].sort((a, b) => a - b);
  const n = arr.length;
  const target = safeInput.target;
  const mode = safeInput.mode;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    !input.array ||
    (Array.isArray(input?.array) &&
      input.array.length === DEFAULT_BINARY_SEARCH_1D_INPUT.array.length &&
      input.array.every((val, idx) => val === DEFAULT_BINARY_SEARCH_1D_INPUT.array[idx]));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const makeElements = (
    left: number,
    right: number,
    mid?: number,
    foundIndex?: number,
  ): PrimaryVisualSnapshot => ({
    kind: "array",
    name: "arr",
    mode: "box",
    elements: arr.map((val, idx) => {
      let state: ArrayElement["state"] = "default";
      const ptrs: string[] = [];

      if (idx === left) ptrs.push("left");
      if (idx === right) ptrs.push("right");
      if (mid !== undefined && idx === mid) {
        ptrs.push("mid");
        state = "compare";
      }
      if (idx >= left && idx <= right && state === "default") {
        state = "active";
      }
      if (foundIndex !== undefined && idx === foundIndex) {
        state = "sorted";
      }

      return {
        id: `el-${idx}`,
        value: val,
        label: `[${idx}]`,
        state,
        pointers: ptrs.length > 0 ? ptrs : undefined,
      };
    }),
  });

  addStep(
    `Initializing 1D Binary Search (mode: ${mode ?? "exact"}) for target = ${target} on sorted array of ${n} elements.`,
    makeElements(0, n - 1),
  );

  let left = 0;
  let right = n - 1;
  let foundIdx = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midVal = arr[mid];

    if (midVal === target) {
      foundIdx = mid;
      addStep(
        `Probed mid index ${mid} (value ${midVal}): exact match with target ${target}! Found at index ${mid}.`,
        makeElements(left, right, mid, mid),
      );
      break;
    } else if (midVal < target) {
      addStep(
        `Probed mid index ${mid} (value ${midVal}): ${midVal} < target ${target}. Target lies in right half; shifting left = mid + 1 (${mid + 1}).`,
        makeElements(left, right, mid),
      );
      left = mid + 1;
    } else {
      addStep(
        `Probed mid index ${mid} (value ${midVal}): ${midVal} > target ${target}. Target lies in left half; shifting right = mid - 1 (${mid - 1}).`,
        makeElements(left, right, mid),
      );
      right = mid - 1;
    }
  }

  addStep(
    foundIdx !== -1
      ? `Completed 1D Binary Search: target ${target} located at index ${foundIdx}.`
      : `Completed 1D Binary Search: target ${target} not found in array (returning -1).`,
    makeElements(
      foundIdx !== -1 ? foundIdx : 0,
      foundIdx !== -1 ? foundIdx : n - 1,
      undefined,
      foundIdx !== -1 ? foundIdx : undefined,
    ),
  );

  return steps;
};

export const BINARY_SEARCH_1D_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p><strong>1D Binary Search</strong> is the foundational logarithmic search paradigm operating on sorted domains. By evaluating the midpoint of an active search interval <code>[left, right]</code>, it discards half of the candidate space in a single comparison. Beyond value lookup in sorted vectors, binary search generalizes to continuous monotonic predicate functions (binary search on answer), powers B-Tree database indexing, and drives low-latency systems algorithms like <code>std::lower_bound</code> and <code>std::upper_bound</code>.</p>",
  sections: [
    {
      heading: "1. Why It Exists & Core Problem Solved",
      body: "<p>Linear scanning over <code>N</code> elements requires <code>O(N)</code> comparisons, which becomes prohibitively slow for millions or billions of records. When elements are stored in sorted order, binary search leverages monotonic order to cut the search space by half on every iteration, reaching any target in at most <code>log₂ N</code> probes.</p>",
    },
    {
      heading: "2. Step-by-Step Intuition & Invariant Maintenance",
      body: "<p>The central invariant maintains that if target exists, it must reside within the closed interval <code>[left, right]</code>. Midpoint <code>mid = left + &lfloor;(right - left) / 2&rfloor;</code> splits the interval. Comparing <code>arr[mid]</code> against target reveals which sub-interval retains the target, allowing the other half to be discarded unconditionally without missing valid solutions.</p>",
    },
    {
      heading: "3. Exact vs Lower Bound Formulations",
      body: "<p>Exact binary search halts as soon as <code>arr[mid] == target</code>. Lower bound searches for the boundary index <code>i</code> where <code>arr[i] &ge; target</code>, using a half-open interval <code>[0, N)</code>. Lower bound and upper bound together enable duplicate counting in <code>O(log N)</code> time as <code>upper_bound - lower_bound</code>.</p>",
    },
    {
      heading: "4. Trade-offs & Modern Systems Considerations",
      body: "<p>Binary search requires contiguous memory or random-access indexing alongside sorted data. Random memory jumps across huge arrays can trigger CPU L3 cache misses compared to sequential SIMD vector scans. In high-performance runtimes, midpoint calculations use bitwise unsigned shifts <code>mid = (left + right) &gt;&gt;&gt; 1</code> or <code>mid = left + ((right - left) &gt;&gt; 1)</code> to prevent integer overflow.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Search Interval",
      definition:
        "The active sub-range of array indices [left, right] currently guaranteed to contain the target element if present.",
    },
    {
      term: "Lower Bound",
      definition:
        "The smallest index i in a sorted domain such that arr[i] is greater than or equal to the target value.",
    },
    {
      term: "Parametric Search",
      definition:
        "Binary searching over a discrete or continuous range of answer candidates using a monotonic predicate decision function.",
    },
  ],
};

export const BINARY_SEARCH_1D_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines binary_search_1d: returns index of target in sorted arr, or -1 if absent.",
    2: "Initializes left and right pointers to span the full array range [0..len(arr)-1].",
    3: "Initializes found_idx to -1 as the default result for target not found.",
    4: "Blank line preceding main search loop.",
    5: "Loops while search range is valid (left <= right).",
    6: "Computes mid index as the floor of (left + right) / 2.",
    7: "Checks if middle element arr[mid] equals target.",
    8: "Stores matching index mid in found_idx.",
    9: "Breaks out of loop upon finding exact match.",
    10: "Checks if middle element arr[mid] is strictly less than target.",
    11: "Discards left half by setting left = mid + 1 when arr[mid] < target.",
    12: "Branch handling case when arr[mid] is strictly greater than target.",
    13: "Discards right half by setting right = mid - 1 when arr[mid] > target.",
    14: "Blank line ending main search loop.",
    15: "Returns found_idx (-1 if target was not present).",
  },
};

export const binarySearch1d: AlgorithmDefinition<BinarySearch1dInput> = {
  id: "binary-search-1d",
  title: "1D Binary Search & Lower/Upper Bound",
  topicIds: ["binary_search"],
  difficulty: "Easy",
  description:
    '<p>Given a 1D array of integers <code>array</code> sorted in non-decreasing order and a target integer <code>target</code>, locate the target element or its boundary threshold (exact match, <code>lower_bound</code>, or <code>upper_bound</code>) in <code>O(log N)</code> time.</p><p><strong>Input:</strong> A sorted integer array <code>array</code>, a target integer <code>target</code>, and an optional <code>mode</code> (<code>"exact"</code>, <code>"lower_bound"</code>, or <code>"upper_bound"</code>).</p><p><strong>Output:</strong> The 0-indexed position of <code>target</code> in exact mode (or <code>-1</code> if absent), or the boundary index for lower/upper bound modes.</p>',
  constraints: ["1 <= N <= 10^5", "-10^9 <= array[i], target <= 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard Exact Search Case",
      inputDisplay:
        "arr = [2, 5, 8, 12, 16, 21, 25, 29, 34, 38, 42, 47, 56, 63, 72, 91], target = 63, mode = 'exact'",
      outputDisplay: "Target 63 found at index 13",
      input: {
        array: [2, 5, 8, 12, 16, 21, 25, 29, 34, 38, 42, 47, 56, 63, 72, 91],
        target: 63,
        mode: "exact",
      },
      output: "Target 63 found at index 13",
      explanation:
        "N=16 sorted elements; logarithmic halving probes mid indices to locate 63 at index 13.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Adversarial Lower Bound Duplicate Search",
      inputDisplay: "arr = [1, 3, 3, 3, 5, 7], target = 3, mode = 'lower_bound'",
      outputDisplay: "Lower bound index: 1",
      input: {
        array: [1, 3, 3, 3, 5, 7],
        target: 3,
        mode: "lower_bound",
      },
      output: "Lower bound index: 1",
      explanation: "Lower bound mode finds first occurrence of duplicate element 3 at index 1.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Absent Target Boundary Case",
      inputDisplay: "arr = [1, 4, 9], target = 5, mode = 'exact'",
      outputDisplay: "Target 5 not found (result -1)",
      input: {
        array: [1, 4, 9],
        target: 5,
        mode: "exact",
      },
      output: "Target 5 not found (result -1)",
      explanation: "Target 5 lies between 4 and 9; pointers cross without match, returning -1.",
    },
  ],
  code: BINARY_SEARCH_1D_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(log n)",
    worst: "O(log n)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Each comparison cuts the search window [left..right] in half. An array of size N contracts to 1 element in at most log2(N) steps, guaranteeing O(log N) execution time.",
    space:
      "Uses strictly O(1) auxiliary space, keeping only scalar integer pointers (left, right, mid).",
  },
  topicGuide: BINARY_SEARCH_1D_TOPIC_GUIDE,
  trivia: BINARY_SEARCH_1D_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 3,
      section: "3.2 Binary search",
      label: "Competitive Programmer's Handbook, Ch 3",
    },
  ],
  defaultInput: DEFAULT_BINARY_SEARCH_1D_INPUT,
  generateSteps: generateBinarySearch1dSteps,
};
