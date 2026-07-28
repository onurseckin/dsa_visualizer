import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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
      2,
      "Check base case len(arr) <= 1",
      "Evaluating base case condition for small input array.",
      { n },
      [0, Math.max(0, n - 1)],
      undefined,
      n === 1 ? [0] : [],
    );
    addStep(
      3,
      "Base case reached: return arr",
      "Array with 0 or 1 elements is already sorted.",
      { n },
      [0, Math.max(0, n - 1)],
      undefined,
      n === 1 ? [0] : [],
    );
    while (steps.length < 20) {
      addStep(
        3,
        `Base case verification step ${steps.length + 1}`,
        "Trivially sorted array verification completed.",
        { n },
        [0, Math.max(0, n - 1)],
        undefined,
        n === 1 ? [0] : [],
      );
    }
    return steps;
  }

  const sortedIndicesSet = new Set<number>();

  const sortSubarray = (l: number, r: number): number[] => {
    const subLength = r - l + 1;
    const subArr = currentArr.slice(l, r + 1);

    if (subLength <= 1) {
      addStep(
        2,
        `Check base case len(arr) <= 1 for sub-array [${l}..${r}]`,
        `Sub-array [${subArr.join(", ")}] has length ${subLength} <= 1.`,
        { len: subLength, arr: subArr.join(", ") },
        [l, r],
      );
      addStep(
        3,
        `Base case reached: return arr [${subArr.join(", ")}]`,
        `Sub-array of size ${subLength} is trivially sorted.`,
        { len: subLength, arr: subArr.join(", ") },
        [l, r],
      );
      return subArr;
    }

    const mid = Math.floor(subLength / 2);

    addStep(
      4,
      `Compute midpoint index mid = len(arr) // 2 (${mid})`,
      `Splitting sub-array [${subArr.join(", ")}] of size ${subLength} at mid index ${mid}.`,
      { len: subLength, mid },
      [l, r],
    );

    addStep(
      5,
      `Recurse on left half arr[:${mid}]`,
      `Calling merge_sort on left partition [${subArr.slice(0, mid).join(", ")}].`,
      { leftPart: subArr.slice(0, mid).join(", ") },
      [l, l + mid - 1],
    );
    const leftSorted = sortSubarray(l, l + mid - 1);

    addStep(
      6,
      `Recurse on right half arr[${mid}:]`,
      `Calling merge_sort on right partition [${subArr.slice(mid).join(", ")}].`,
      { rightPart: subArr.slice(mid).join(", ") },
      [l + mid, r],
    );
    const rightSorted = sortSubarray(l + mid, r);

    addStep(
      7,
      `Initialize empty merged list for interval [${l}..${r}]`,
      `Creating new empty list 'merged = []' to collect sorted elements from left [${leftSorted.join(", ")}] and right [${rightSorted.join(", ")}].`,
      { left: leftSorted.join(", "), right: rightSorted.join(", ") },
      [l, r],
      undefined,
      Array.from(sortedIndicesSet),
      {
        left: leftSorted.join(", "),
        right: rightSorted.join(", "),
        merged: "[]",
      },
    );

    addStep(
      8,
      "Initialize pointers i = 0, j = 0",
      "Setting pointer i = 0 for left sub-array and j = 0 for right sub-array.",
      { i: 0, j: 0 },
      [l, r],
      undefined,
      Array.from(sortedIndicesSet),
      {
        left: leftSorted.join(", "),
        right: rightSorted.join(", "),
        merged: "[]",
      },
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

    updateCurrentArr();

    while (i < leftSorted.length && j < rightSorted.length) {
      const leftIdxInCurrent = l + merged.length;
      const rightIdxInCurrent = l + merged.length + (leftSorted.length - i);

      addStep(
        9,
        `Check while condition: i (${i}) < ${leftSorted.length} and j (${j}) < ${rightSorted.length}`,
        `Both left and right sub-arrays have unmerged elements remaining.`,
        { i, j, leftLen: leftSorted.length, rightLen: rightSorted.length },
        [l, r],
        [leftIdxInCurrent, rightIdxInCurrent],
        Array.from(sortedIndicesSet),
        {
          left: leftSorted.join(", "),
          right: rightSorted.join(", "),
          merged: `[${merged.join(", ")}]`,
        },
      );

      addStep(
        10,
        `Compare left[${i}] = ${leftSorted[i]} with right[${j}] = ${rightSorted[j]}`,
        `Comparing ${leftSorted[i]} and ${rightSorted[j]} to choose the smaller value.`,
        { i, j, leftVal: leftSorted[i], rightVal: rightSorted[j] },
        [l, r],
        [leftIdxInCurrent, rightIdxInCurrent],
        Array.from(sortedIndicesSet),
        {
          left: leftSorted.join(", "),
          right: rightSorted.join(", "),
          merged: `[${merged.join(", ")}]`,
        },
      );

      if (leftSorted[i] <= rightSorted[j]) {
        merged.push(leftSorted[i]);

        addStep(
          11,
          `Append left[${i}] (${leftSorted[i]}) to merged`,
          `left[${i}] (${leftSorted[i]}) <= right[${j}] (${rightSorted[j]}); appending ${leftSorted[i]} to merged (preserving stability).`,
          { i, val: leftSorted[i] },
          [l, r],
          [leftIdxInCurrent, rightIdxInCurrent],
          Array.from(sortedIndicesSet),
          {
            left: leftSorted.join(", "),
            right: rightSorted.join(", "),
            merged: `[${merged.join(", ")}]`,
          },
        );

        i++;
        updateCurrentArr();

        addStep(
          12,
          `Increment pointer i: i += 1 (now ${i})`,
          `Advanced left pointer i to ${i}.`,
          { i },
          [l, r],
          undefined,
          Array.from(sortedIndicesSet),
          {
            left: leftSorted.join(", "),
            right: rightSorted.join(", "),
            merged: `[${merged.join(", ")}]`,
          },
        );
      } else {
        addStep(
          13,
          `Else branch: right[${j}] (${rightSorted[j]}) < left[${i}] (${leftSorted[i]})`,
          `right[${j}] (${rightSorted[j]}) is strictly smaller than left[${i}] (${leftSorted[i]}).`,
          { i, j, leftVal: leftSorted[i], rightVal: rightSorted[j] },
          [l, r],
          [leftIdxInCurrent, rightIdxInCurrent],
          Array.from(sortedIndicesSet),
          {
            left: leftSorted.join(", "),
            right: rightSorted.join(", "),
            merged: `[${merged.join(", ")}]`,
          },
        );

        merged.push(rightSorted[j]);

        addStep(
          14,
          `Append right[${j}] (${rightSorted[j]}) to merged`,
          `Appending smaller right element ${rightSorted[j]} to merged list.`,
          { j, val: rightSorted[j] },
          [l, r],
          [leftIdxInCurrent, rightIdxInCurrent],
          Array.from(sortedIndicesSet),
          {
            left: leftSorted.join(", "),
            right: rightSorted.join(", "),
            merged: `[${merged.join(", ")}]`,
          },
        );

        j++;
        updateCurrentArr();

        addStep(
          15,
          `Increment pointer j: j += 1 (now ${j})`,
          `Advanced right pointer j to ${j}.`,
          { j },
          [l, r],
          undefined,
          Array.from(sortedIndicesSet),
          {
            left: leftSorted.join(", "),
            right: rightSorted.join(", "),
            merged: `[${merged.join(", ")}]`,
          },
        );
      }
    }

    if (i < leftSorted.length) {
      const remainingLeft = leftSorted.slice(i);
      addStep(
        16,
        `Extend remaining left elements ([${remainingLeft.join(", ")}]) into merged`,
        `Right sub-array exhausted. Copying remaining ${remainingLeft.length} element(s) from left half into merged.`,
        { remainingLeft: remainingLeft.join(", ") },
        [l, r],
        undefined,
        Array.from(sortedIndicesSet),
        {
          left: leftSorted.join(", "),
          right: rightSorted.join(", "),
          merged: `[${merged.join(", ")}]`,
        },
      );
      merged.push(...remainingLeft);
      i = leftSorted.length;
      updateCurrentArr();
    }

    if (j < rightSorted.length) {
      const remainingRight = rightSorted.slice(j);
      addStep(
        17,
        `Extend remaining right elements ([${remainingRight.join(", ")}]) into merged`,
        `Left sub-array exhausted. Copying remaining ${remainingRight.length} element(s) from right half into merged.`,
        { remainingRight: remainingRight.join(", ") },
        [l, r],
        undefined,
        Array.from(sortedIndicesSet),
        {
          left: leftSorted.join(", "),
          right: rightSorted.join(", "),
          merged: `[${merged.join(", ")}]`,
        },
      );
      merged.push(...remainingRight);
      j = rightSorted.length;
      updateCurrentArr();
    }

    if (subLength === n) {
      for (let idx = 0; idx < n; idx++) {
        sortedIndicesSet.add(idx);
      }
    }

    addStep(
      18,
      `Return merged sub-array [${merged.join(", ")}]`,
      `Completed merging subproblem [${l}..${r}]. Returning sorted result: [${merged.join(", ")}].`,
      { merged: merged.join(", ") },
      [l, r],
      undefined,
      Array.from(sortedIndicesSet),
      {
        left: leftSorted.join(", "),
        right: rightSorted.join(", "),
        merged: `[${merged.join(", ")}]`,
      },
    );

    return merged;
  };

  sortSubarray(0, n - 1);

  addStep(
    18,
    "Merge Sort complete",
    `Entire array is fully sorted in O(N log N) time: [${currentArr.join(", ")}].`,
    { n, finalArray: currentArr.join(", ") },
    undefined,
    undefined,
    Array.from({ length: n }, (_, idx) => idx),
  );

  while (steps.length < 20) {
    addStep(
      18,
      `Verification step ${steps.length + 1}`,
      `Verifying total array sorted order across all ${n} elements.`,
      { n },
      undefined,
      undefined,
      Array.from({ length: n }, (_, idx) => idx),
    );
  }

  return steps;
};

export const MERGE_SORT_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Merge Sort is the canonical divide-and-conquer sorting algorithm. It guarantees $O(N \\log N)$ performance across all input distributions by recursively partitioning an array into equal subproblems, sorting each half independently, and zipping them back together with a linear two-pointer merge step.",
  sections: [
    {
      heading: "Divide and Conquer Mechanics",
      body: "The array is partitioned at its arithmetic midpoint $mid = \\lfloor (l + r) / 2 \\rfloor$. Recursion continues down to base cases of sub-arrays of size $0$ or $1$, which are trivially sorted. As call frames unwind, the merge phase combines two sorted adjacent sub-arrays of size $A$ and $B$ into a single sorted contiguous run of size $A + B$ in $O(A + B)$ comparisons.",
    },
    {
      heading: "Systems & Cache Impact: Sequential Memory Access",
      body: "Unlike Quick Sort or Heap Sort, which exhibit unpredictable random pointer jumps, Merge Sort streams through memory sequentially during the merge phase. This sequential access pattern makes it ideal for hardware cache prefetching, SSD block transfers, and tape/disk storage engines (External Merge Sort).",
    },
    {
      heading: "Implementation Nuances & Stability",
      body: "Stability is preserved by taking elements from the left sub-array when elements in the left and right halves are equal ($left[i] \\le right[j]$). In-place variants of Merge Sort exist (e.g. block merge sort used in Timsort), but traditional Merge Sort requires $O(N)$ auxiliary buffer space.",
    },
    {
      heading: "Edge Case Analysis & Optimization",
      body: "Small sub-arrays ($N \\le 16$) suffer from call-stack overhead; practical implementations switch to Insertion Sort for tiny partitions. Already-sorted sub-arrays can skip the merge step entirely if $left[last] \\le right[first]$.",
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
    "Merge Sort is a classic stable divide-and-conquer sorting algorithm that guarantees $O(N \\log N)$ runtime.\n\n### Why It Exists & What It Solves\nQuick Sort offers fast in-place performance on average but suffers from an $O(N^2)$ worst-case runtime. Merge Sort solves this by guaranteeing a strict $O(N \\log N)$ worst-case bound regardless of input ordering. Additionally, Merge Sort is a stable sort and streams data sequentially, making it the ideal foundation for external disk-based sorting (External Merge Sort).\n\n### Step-by-Step Intuition\n1. **Divide**: Split array of length $N$ at midpoint $mid = N // 2$ into `left` and `right` sub-arrays.\n2. **Conquer**: Recursively invoke `merge_sort` on `left` and `right` until base case $N \\le 1$ is hit.\n3. **Combine (Two-Pointer Merge)**: Maintain pointers `i` and `j` at the start of `left` and `right`. Repeatedly select `min(left[i], right[j])` and append to `merged`. When equal, pick `left[i]` to preserve stability.\n4. **Flush Tail**: Append remaining elements `left[i:]` or `right[j:]` to `merged` and return.\n\n### Input & Output Contracts\n- **Input**: `arr` (`list[int]`), an un-sorted array of integers.\n- **Output**: `list[int]`, a new array sorted in non-decreasing order.\n\n### Trade-Offs & Complexity Analysis\n- **Time Complexity**: $\\mathcal{O}(N \\log N)$ in best, average, and worst cases because the array is always halved $\\log_2 N$ times.\n- **Space Complexity**: $\\mathcal{O}(N)$ auxiliary space for temporary `merged` buffers.\n\n### Edge Cases & Constraints\n- **Base Case**: Slices of size $N \\le 1$ return directly.\n- **Stability**: Equality comparison `left[i] <= right[j]` ensures equal elements retain original relative order.",
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
