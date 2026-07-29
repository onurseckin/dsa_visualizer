import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface MergeSortInput {
  array: number[];
}

export const MERGE_SORT_CODE = `def merge_sort(arr: list[int]) -> list[int]:
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    merged = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
    merged.extend(left[i:])
    merged.extend(right[j:])
    return merged`;

export const DEFAULT_MERGE_SORT_INPUT: MergeSortInput = {
  array: [38, 27, 43, 3, 9, 82, 10],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Merge Sort is a classic divide-and-conquer sorting algorithm that guarantees strict O(N log N) runtime performance across all input distributions.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "e1", value: 38, label: "[0]", state: "default" },
        { id: "e2", value: 27, label: "[1]", state: "default" },
        { id: "e3", value: 43, label: "[2]", state: "default" },
        { id: "e4", value: 3, label: "[3]", state: "default" },
        { id: "e5", value: 9, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "The Divide step recursively splits an unsorted array of size N at its arithmetic midpoint mid = floor(N / 2) into left and right sub-arrays.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "d1", value: 38, label: "Left", state: "active" },
        { id: "d2", value: 27, label: "Left", state: "active" },
        { id: "d3", value: 43, label: "Mid Split", state: "compare" },
        { id: "d4", value: 3, label: "Right", state: "visited" },
        { id: "d5", value: 9, label: "Right", state: "visited" },
      ],
    },
  },
  {
    narrative:
      "Recursion continues partitioning until reaching base case sub-arrays of size 0 or 1, which are trivially sorted by definition.",
    primarySnapshot: {
      kind: "array",
      name: "base_cases",
      mode: "box",
      elements: [
        { id: "b1", value: 38, label: "Base [38]", state: "sorted" },
        { id: "b2", value: 27, label: "Base [27]", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "As recursive call frames unwind, the Combine (Merge) step zips adjacent sorted sub-arrays into a single combined sorted sub-array.",
    primarySnapshot: {
      kind: "array",
      name: "merge_phase",
      mode: "box",
      elements: [
        { id: "m1", value: 27, label: "Merged [0]", state: "sorted" },
        { id: "m2", value: 38, label: "Merged [1]", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Two pointers i and j iterate through the left and right sub-arrays, repeatedly picking min(left[i], right[j]) to append to the merged buffer.",
    primarySnapshot: {
      kind: "array",
      name: "two_pointers",
      mode: "box",
      elements: [
        { id: "tp1", value: 27, label: "left[i]", state: "compare", pointers: ["i"] },
        { id: "tp2", value: 3, label: "right[j]", state: "compare", pointers: ["j"] },
        { id: "tp3", value: 3, label: "pick 3", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Merge Sort is a stable sort: when left[i] equals right[j], the element from the left sub-array is picked first, preserving original relative element ordering.",
    primarySnapshot: {
      kind: "array",
      name: "stability",
      mode: "box",
      elements: [
        { id: "st1", value: 5, label: "left[i]=5", state: "sorted" },
        { id: "st2", value: 5, label: "right[j]=5", state: "default" },
      ],
    },
  },
  {
    narrative:
      "When one sub-array is exhausted, any remaining elements from the other sub-array are flushed directly into the merged output buffer in linear O(N) time.",
    primarySnapshot: {
      kind: "array",
      name: "flush_tail",
      mode: "box",
      elements: [
        { id: "f1", value: 3, label: "merged", state: "sorted" },
        { id: "f2", value: 9, label: "merged", state: "sorted" },
        { id: "f3", value: 43, label: "flush left", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Sequential memory access during merging yields excellent CPU cache locality, making Merge Sort the ideal foundation for external disk-based sorting.",
    primarySnapshot: {
      kind: "array",
      name: "cache_locality",
      mode: "box",
      elements: [
        { id: "c1", value: "Sequential Memory Streams", state: "sorted" },
        { id: "c2", value: "Cache-Prefetch Friendly", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "The recursion tree has log2(N) levels with O(N) work per level, guaranteeing O(N log N) time complexity across all cases using O(N) auxiliary space.",
    primarySnapshot: {
      kind: "array",
      name: "summary",
      mode: "box",
      elements: [
        { id: "s1", value: "Time: O(N log N) Best/Avg/Worst", state: "sorted" },
        { id: "s2", value: "Space: O(N) Auxiliary Buffer", state: "default" },
      ],
    },
  },
];

export const generateMergeSortSteps = (input: MergeSortInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const safeInput = {
    array: Array.isArray(input?.array) ? input.array : DEFAULT_MERGE_SORT_INPUT.array,
  };
  const currentArr = [...safeInput.array];
  const n = currentArr.length;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input?.array) &&
      input.array.length === DEFAULT_MERGE_SORT_INPUT.array.length &&
      input.array.every((val, idx) => val === DEFAULT_MERGE_SORT_INPUT.array[idx]));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const makeElements = (
    activeRange?: [number, number],
    comparingIndices?: [number, number],
    sortedIndices?: number[],
  ): PrimaryVisualSnapshot => ({
    kind: "array",
    name: "arr",
    mode: "box",
    elements: currentArr.map((val, idx) => {
      let state: ArrayElement["state"] = "default";
      if (sortedIndices && sortedIndices.includes(idx)) {
        state = "sorted";
      } else if (comparingIndices && comparingIndices.includes(idx)) {
        state = "compare";
      } else if (activeRange && idx >= activeRange[0] && idx <= activeRange[1]) {
        state = "active";
      }
      return {
        id: `el-${idx}`,
        value: val,
        label: `[${idx}]`,
        state,
      };
    }),
  });

  addStep(
    `Initializing Merge Sort on input array of size N = ${n}: [${currentArr.join(", ")}].`,
    makeElements([0, Math.max(0, n - 1)]),
  );

  if (n <= 1) {
    addStep(
      `Array size N = ${n} <= 1: base case reached immediately. Array is trivially sorted.`,
      makeElements([0, Math.max(0, n - 1)], undefined, [0]),
    );
    return steps;
  }

  const sortedIndicesSet = new Set<number>();

  const sortSubarray = (l: number, r: number): number[] => {
    const subLength = r - l + 1;
    const subArr = currentArr.slice(l, r + 1);

    if (subLength <= 1) {
      addStep(
        `Base case len <= 1 for sub-array interval [${l}..${r}] ([${subArr.join(", ")}]); returning as sorted.`,
        makeElements([l, r]),
      );
      return subArr;
    }

    const mid = Math.floor(subLength / 2);
    addStep(
      `Splitting sub-array [${subArr.join(", ")}] at mid index ${mid}: left subproblem [${l}..${l + mid - 1}], right subproblem [${l + mid}..${r}].`,
      makeElements([l, r]),
    );

    const leftSorted = sortSubarray(l, l + mid - 1);
    const rightSorted = sortSubarray(l + mid, r);

    addStep(
      `Conquered subproblems: merging left sorted half [${leftSorted.join(", ")}] and right sorted half [${rightSorted.join(", ")}].`,
      makeElements([l, r]),
    );

    const merged: number[] = [];
    let i = 0;
    let j = 0;

    const updateCurrentArr = () => {
      const combined = [...merged, ...leftSorted.slice(i), ...rightSorted.slice(j)];
      for (let idx = 0; idx < combined.length; idx++) {
        currentArr[l + idx] = combined[idx];
      }
    };

    while (i < leftSorted.length && j < rightSorted.length) {
      const leftVal = leftSorted[i];
      const rightVal = rightSorted[j];

      if (leftVal <= rightVal) {
        merged.push(leftVal);
        addStep(
          `Comparing left[${i}] = ${leftVal} and right[${j}] = ${rightVal}: ${leftVal} <= ${rightVal}, appending ${leftVal} to merged buffer (preserving stability).`,
          makeElements([l, r], [l + i, l + mid + j]),
        );
        i++;
      } else {
        merged.push(rightVal);
        addStep(
          `Comparing left[${i}] = ${leftVal} and right[${j}] = ${rightVal}: ${rightVal} < ${leftVal}, appending ${rightVal} to merged buffer.`,
          makeElements([l, r], [l + i, l + mid + j]),
        );
        j++;
      }
      updateCurrentArr();
    }

    while (i < leftSorted.length) {
      merged.push(leftSorted[i]);
      addStep(
        `Right sub-array exhausted: flushing remaining left element ${leftSorted[i]} into merged buffer.`,
        makeElements([l, r]),
      );
      i++;
      updateCurrentArr();
    }

    while (j < rightSorted.length) {
      merged.push(rightSorted[j]);
      addStep(
        `Left sub-array exhausted: flushing remaining right element ${rightSorted[j]} into merged buffer.`,
        makeElements([l, r]),
      );
      j++;
      updateCurrentArr();
    }

    if (subLength === n) {
      for (let idx = 0; idx < n; idx++) {
        sortedIndicesSet.add(idx);
      }
    }

    addStep(
      `Completed merging for interval [${l}..${r}]: result is [${merged.join(", ")}].`,
      makeElements([l, r], undefined, Array.from(sortedIndicesSet)),
    );

    return merged;
  };

  sortSubarray(0, n - 1);

  addStep(
    `Completed Merge Sort: entire array of ${n} elements is fully sorted in O(N log N) time: [${currentArr.join(", ")}].`,
    makeElements(
      undefined,
      undefined,
      Array.from({ length: n }, (_, idx) => idx),
    ),
  );

  return steps;
};

export const MERGE_SORT_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p><strong>Merge Sort</strong> is the canonical divide-and-conquer sorting algorithm. It guarantees <code>O(N log N)</code> performance across all input distributions by recursively partitioning an array into equal subproblems, sorting each half independently, and zipping them back together with a linear two-pointer merge step.</p>",
  sections: [
    {
      heading: "1. Divide and Conquer Mechanics",
      body: "<p>The array is partitioned at its arithmetic midpoint <code>mid = &lfloor;(l + r) / 2&rfloor;</code>. Recursion continues down to base cases of sub-arrays of size 0 or 1, which are trivially sorted. As call frames unwind, the merge phase combines two sorted adjacent sub-arrays of size <code>A</code> and <code>B</code> into a single sorted contiguous run of size <code>A + B</code> in <code>O(A + B)</code> comparisons.</p>",
    },
    {
      heading: "2. Systems & Cache Impact: Sequential Memory Access",
      body: "<p>Unlike Quick Sort or Heap Sort, which exhibit unpredictable random pointer jumps, Merge Sort streams through memory sequentially during the merge phase. This sequential access pattern makes it ideal for hardware cache prefetching, SSD block transfers, and tape/disk storage engines (External Merge Sort).</p>",
    },
    {
      heading: "3. Implementation Nuances & Stability",
      body: "<p>Stability is preserved by taking elements from the left sub-array when elements in the left and right halves are equal (<code>left[i] &le; right[j]</code>). In-place variants of Merge Sort exist (e.g. block merge sort used in Timsort), but traditional Merge Sort requires <code>O(N)</code> auxiliary buffer space.</p>",
    },
    {
      heading: "4. Edge Case Analysis & Optimization",
      body: "<p>Small sub-arrays (<code>N &le; 16</code>) suffer from call-stack overhead; practical implementations switch to Insertion Sort for tiny partitions. Already-sorted sub-arrays can skip the merge step entirely if <code>left[last] &le; right[first]</code>.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Divide and Conquer",
      definition:
        "An algorithmic paradigm that breaks a problem into non-overlapping subproblems of the same type, solves them recursively, and combines their solutions.",
    },
    {
      term: "Stable Sort",
      definition:
        "A sorting algorithm that preserves the original relative position of items with equal comparison keys.",
    },
    {
      term: "External Merge Sort",
      definition:
        "A database sorting algorithm that sorts datasets larger than RAM by partitioning data into sorted chunks on disk and merging them using multi-way buffer streams.",
    },
  ],
};

export const MERGE_SORT_TRIVIA: TriviaMeta = {
  skipLines: [1, 7],
  distractors: [
    "if left[i] > right[j]:",
    "mid = len(arr) // 3",
    "merged.append(left[j])",
    "return left",
    "merged.extend(right[:j])",
  ],
  lineExplanations: {
    1: "Declares function merge_sort: accepts array arr, recursively splits it into halves, and merges sorted sub-arrays.",
    2: "Base case guard: if len(arr) <= 1, the array is trivially sorted.",
    3: "Returns arr unchanged for base cases of length 0 or 1.",
    4: "Computes midpoint index mid = len(arr) // 2 to split array into two equal halves.",
    5: "Recursively calls merge_sort on left half arr[:mid].",
    6: "Recursively calls merge_sort on right half arr[mid:].",
    7: "Initializes empty list 'merged' to collect elements in sorted order.",
    8: "Initializes pointer indices i = 0 (for left half) and j = 0 (for right half).",
    9: "Loops while i < len(left) and j < len(right), comparing elements from both halves.",
    10: "Compares left[i] <= right[j]. Using <= guarantees sorting stability for equal elements.",
    11: "Appends smaller/equal left element left[i] to merged list.",
    12: "Increments index pointer i by 1 (i += 1).",
    13: "Else branch executed when right[j] is strictly smaller than left[i].",
    14: "Appends smaller right element right[j] to merged list.",
    15: "Increments index pointer j by 1 (j += 1).",
    16: "Appends any leftover elements from left half (left[i:]) after right half is exhausted.",
    17: "Appends any leftover elements from right half (right[j:]) after left half is exhausted.",
    18: "Returns the fully sorted merged list.",
  },
};

export const mergeSort: AlgorithmDefinition<MergeSortInput> = {
  id: "merge-sort",
  title: "Merge Sort (Divide and Conquer)",
  topicIds: ["two_pointers"],
  difficulty: "Medium",
  description:
    "<p>Given an array of integers <code>array</code>, sort the array in non-decreasing order using the Merge Sort algorithm.</p><p><strong>Input:</strong> An array of integers <code>array</code>.</p><p><strong>Output:</strong> The array sorted in non-decreasing order.</p>",
  constraints: ["1 <= N <= 10^5", "-10^9 <= array[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard Case",
      inputDisplay: "arr = [38, 27, 43, 3, 9, 82, 10]",
      outputDisplay: "arr = [3, 9, 10, 27, 38, 43, 82]",
      input: { array: [38, 27, 43, 3, 9, 82, 10] },
      output: "arr = [3, 9, 10, 27, 38, 43, 82]",
      explanation: "Array split into halves, sorted recursively, and merged back in order.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Adversarial Negative and Mixed Array",
      inputDisplay: "arr = [10, -5, 20, -15, 0, 5]",
      outputDisplay: "arr = [-15, -5, 0, 5, 10, 20]",
      input: { array: [10, -5, 20, -15, 0, 5] },
      output: "arr = [-15, -5, 0, 5, 10, 20]",
      explanation: "Handles negative numbers and duplicate elements stably.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Single Element Boundary",
      inputDisplay: "arr = [7]",
      outputDisplay: "arr = [7]",
      input: { array: [7] },
      output: "arr = [7]",
      explanation: "Single element array N=1 is already sorted by definition.",
    },
  ],
  code: MERGE_SORT_CODE,
  timeComplexity: {
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n log n)",
  },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "The recursion tree has log2(n) levels. Merging elements across each level takes O(n) total comparisons, giving O(n log n) overall time.",
    space:
      "Requires O(n) auxiliary space to store temporary merged arrays during subproblem combination.",
  },
  topicGuide: MERGE_SORT_TOPIC_GUIDE,
  trivia: MERGE_SORT_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 3,
      section: "3.1 Sorting algorithms / Merge sort",
      label: "Competitive Programmer's Handbook, Ch 3",
    },
  ],
  defaultInput: DEFAULT_MERGE_SORT_INPUT,
  generateSteps: generateMergeSortSteps,
};
