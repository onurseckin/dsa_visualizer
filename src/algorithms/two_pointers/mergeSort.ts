import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface MergeSortInput {
  array: number[];
}

export const MERGE_SORT_CODE = `def merge_sort(arr: list[int]) -> list[int]:
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left_half = merge_sort(arr[:mid])
    right_half = merge_sort(arr[mid:])

    merged = []
    i = j = 0
    while i < len(left_half) and j < len(right_half):
        if left_half[i] <= right_half[j]:
            merged.append(left_half[i])
            i += 1
        else:
            merged.append(right_half[j])
            j += 1

    merged.extend(left_half[i:])
    merged.extend(right_half[j:])
    return merged`;

export const DEFAULT_MERGE_SORT_INPUT: MergeSortInput = {
  array: [38, 27, 43, 3, 9, 82, 10],
};

export const generateMergeSortSteps = (input: MergeSortInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const currentArr = [...input.array];
  const n = currentArr.length;

  const makeElements = (
    activeRange?: [number, number],
    comparingIndices?: [number, number],
    sortedIndices?: number[],
  ): ArrayElement[] => {
    return currentArr.map((val, idx) => {
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
        state,
      };
    });
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRange?: [number, number],
    comparingIndices?: [number, number],
    sortedIndices?: number[],
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(activeRange, comparingIndices, sortedIndices),
      },
      auxiliaryState: {
        customState: customState ?? {
          currentArray: currentArr.join(", "),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Start Merge Sort",
    `Sorting input array of size N = ${n}: [${currentArr.join(", ")}].`,
    { n },
  );

  if (n <= 1) {
    addStep(
      3,
      "Base case reached",
      "Array with 0 or 1 elements is already sorted.",
      { n },
      [0, Math.max(0, n - 1)],
      undefined,
      n === 1 ? [0] : [],
    );
    return steps;
  }

  const sortedRange: number[] = [];

  const sortSubarray = (l: number, r: number) => {
    if (l >= r) return;

    const mid = Math.floor((l + r) / 2);

    addStep(
      5,
      `Divide subarray [${l}..${r}] at mid index ${mid}`,
      `Splitting range [${l}..${r}] into left [${l}..${mid}] and right [${mid + 1}..${r}].`,
      { l, r, mid },
      [l, r],
    );

    sortSubarray(l, mid);
    sortSubarray(mid + 1, r);

    // Merge step
    addStep(
      10,
      `Merge sorted halves [${l}..${mid}] and [${mid + 1}..${r}]`,
      `Using two pointers i (left half) and j (right half) to merge elements back into subarray [${l}..${r}].`,
      { l, mid, r },
      [l, r],
    );

    const leftCopy = currentArr.slice(l, mid + 1);
    const rightCopy = currentArr.slice(mid + 1, r + 1);
    let i = 0;
    let j = 0;
    let k = l;

    while (i < leftCopy.length && j < rightCopy.length) {
      const idxLeft = l + i;
      const idxRight = mid + 1 + j;

      addStep(
        13,
        `Compare left [${idxLeft}] = ${leftCopy[i]} with right [${idxRight}] = ${rightCopy[j]}`,
        `Two pointers: picking smaller value between ${leftCopy[i]} and ${rightCopy[j]}.`,
        { i, j, k, leftVal: leftCopy[i], rightVal: rightCopy[j] },
        [l, r],
        [idxLeft, idxRight],
      );

      if (leftCopy[i] <= rightCopy[j]) {
        currentArr[k] = leftCopy[i];
        i++;
      } else {
        currentArr[k] = rightCopy[j];
        j++;
      }
      k++;
    }

    while (i < leftCopy.length) {
      currentArr[k] = leftCopy[i];
      i++;
      k++;
    }
    while (j < rightCopy.length) {
      currentArr[k] = rightCopy[j];
      j++;
      k++;
    }

    for (let idx = l; idx <= r; idx++) {
      if (!sortedRange.includes(idx)) sortedRange.push(idx);
    }

    addStep(
      21,
      `Subarray [${l}..${r}] merged and sorted: [${currentArr.slice(l, r + 1).join(", ")}]`,
      `Completed merging for interval [${l}..${r}]. Elements are now in sorted order.`,
      { l, r, mergedSubarray: currentArr.slice(l, r + 1).join(", ") },
      undefined,
      undefined,
      [...sortedRange],
    );
  };

  sortSubarray(0, n - 1);

  addStep(
    22,
    "Merge Sort complete",
    `Entire array is fully sorted in O(N log N) time: [${currentArr.join(", ")}].`,
    { n, finalArray: currentArr.join(", ") },
    undefined,
    undefined,
    Array.from({ length: n }, (_, idx) => idx),
  );

  return steps;
};

export const MERGE_SORT_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Merge Sort is a classic Divide and Conquer sorting algorithm that recursively splits an array in half, sorts each half, and merges the two sorted halves back together in O(N log N) time.",
  sections: [
    {
      heading: "Divide and Conquer Strategy",
      body: "The array is repeatedly halved until subarrays contain 0 or 1 element, which are trivially sorted. These smaller sorted subarrays are then systematically merged back together.",
    },
    {
      heading: "Two-Pointer Merging",
      body: "Merging two sorted arrays of length A and B takes O(A + B) time by maintaining one pointer in each array and comparing their current elements, appending the smaller element to the result.",
    },
    {
      heading: "Guaranteed O(N log N) Performance",
      body: "Unlike Quick Sort, Merge Sort guarantees O(N log N) worst-case time complexity regardless of initial array ordering, making it ideal when predictable performance is required.",
    },
  ],
  keyTerms: [
    {
      term: "Divide and Conquer",
      definition: "Breaking a problem into independent subproblems, solving subproblems recursively, and combining solutions.",
    },
    {
      term: "Stable Sort",
      definition: "A sorting algorithm that preserves the relative order of duplicate equal elements.",
    },
  ],
};

export const MERGE_SORT_TRIVIA: TriviaMeta = {
  skipLines: [1, 3, 7, 12],
  distractors: [
    "if left_half[i] > right_half[j]: merged.append(left_half[i])",
    "mid = (l + r) // 3",
    "merged = left_half + right_half",
  ],
  hints: [
    {
      line: 13,
      hint: "Compare left_half[i] and right_half[j] to maintain stable sorted order",
    },
    {
      line: 20,
      hint: "Append remaining unmerged elements from left and right halves",
    },
  ],
  lineExplanations: {
    13: "Pick smaller element to maintain ascending order during merge.",
    20: "Append remaining elements once one pointer reaches end of half.",
  },
};

export const mergeSort: AlgorithmDefinition<MergeSortInput> = {
  id: "merge-sort",
  title: "Merge Sort (Divide and Conquer)",
  category: "two_pointers",
  difficulty: "Medium",
  description:
    "Merge Sort divides the array into halves, sorts each recursively, and merges the sorted halves using two pointers in O(N log N) time.",
  constraints: ["1 <= N <= 10^5", "-10^9 <= array[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Basic Example",
      inputDisplay: "arr = [38, 27, 43, 3, 9, 82, 10]",
      outputDisplay: "arr = [3, 9, 10, 27, 38, 43, 82]",
      input: { array: [38, 27, 43, 3, 9, 82, 10] },
      output: "arr = [3, 9, 10, 27, 38, 43, 82]",
      explanation: "Array split into halves, sorted recursively, and merged back in order.",
    },
    {
      kind: "complex",
      title: "Complex Edge Case",
      inputDisplay: "arr = [10, -5, 20, -15, 0, 5]",
      outputDisplay: "arr = [-15, -5, 0, 5, 10, 20]",
      input: { array: [10, -5, 20, -15, 0, 5] },
      output: "arr = [-15, -5, 0, 5, 10, 20]",
      explanation: "Handles negative numbers and duplicate elements stably.",
    },
    {
      kind: "negative",
      title: "Failing / Boundary Case",
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
    space: "Requires O(n) auxiliary space to store temporary merged arrays during subproblem combination.",
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
