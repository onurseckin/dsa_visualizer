import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export const BUBBLE_SORT_CODE = `def bubble_sort(arr: list[int]) -> list[int]:
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`;

export const DEFAULT_BUBBLE_SORT_INPUT: number[] = [5, 2, 8, 1, 4];

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Sorting rearranges an array into non-decreasing order; Bubble Sort achieves this by repeatedly sweeping across the array and swapping adjacent out-of-order elements.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 5, label: "[0]", state: "default" },
        { id: "c2", value: 2, label: "[1]", state: "default" },
        { id: "c3", value: 8, label: "[2]", state: "default" },
        { id: "c4", value: 1, label: "[3]", state: "default" },
        { id: "c5", value: 4, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "An inversion is any pair of positions where a larger number precedes a smaller number; Bubble Sort systematically repairs these adjacent inversions one step at a time.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 5, label: "[0]", state: "compare", pointers: ["j"] },
        { id: "c2", value: 2, label: "[1]", state: "compare", pointers: ["j+1"] },
        { id: "c3", value: 8, label: "[2]", state: "default" },
        { id: "c4", value: 1, label: "[3]", state: "default" },
        { id: "c5", value: 4, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "When adjacent elements are inverted (arr[j] > arr[j + 1]), swapping them moves the larger element one position rightward toward its correct destination.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 2, label: "[0]", state: "swap", pointers: ["j"] },
        { id: "c2", value: 5, label: "[1]", state: "swap", pointers: ["j+1"] },
        { id: "c3", value: 8, label: "[2]", state: "default" },
        { id: "c4", value: 1, label: "[3]", state: "default" },
        { id: "c5", value: 4, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Each adjacent swap resolves exactly one inversion without disturbing the relative positions of elements outside the pair.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 2, label: "[0]", state: "default" },
        { id: "c2", value: 5, label: "[1]", state: "compare", pointers: ["j"] },
        { id: "c3", value: 8, label: "[2]", state: "compare", pointers: ["j+1"] },
        { id: "c4", value: 1, label: "[3]", state: "default" },
        { id: "c5", value: 4, label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "A core invariant of Bubble Sort is that after pass 1, the largest element in the array is guaranteed to have bubbled all the way into its final tail position.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 2, label: "[0]", state: "default" },
        { id: "c2", value: 5, label: "[1]", state: "default" },
        { id: "c3", value: 1, label: "[2]", state: "default" },
        { id: "c4", value: 4, label: "[3]", state: "default" },
        { id: "c5", value: 8, label: "[4]", state: "sorted", pointers: ["tail"] },
      ],
    },
  },
  {
    narrative:
      "Subsequent passes only need to scan the unsorted prefix arr[0 ... N - 1 - i], shrinking the active search window by one element after every pass.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 2, label: "[0]", state: "compare", pointers: ["j"] },
        { id: "c2", value: 5, label: "[1]", state: "compare", pointers: ["j+1"] },
        { id: "c3", value: 1, label: "[2]", state: "default" },
        { id: "c4", value: 4, label: "[3]", state: "sorted", pointers: ["tail"] },
        { id: "c5", value: 8, label: "[4]", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Bubble Sort is a stable sort because equal adjacent elements (arr[j] == arr[j + 1]) are never swapped, preserving their original relative input order.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 3, label: "[0]", state: "compare", pointers: ["j"] },
        { id: "c2", value: 3, label: "[1]", state: "compare", pointers: ["j+1"] },
        { id: "c3", value: 7, label: "[2]", state: "default" },
        { id: "c4", value: 9, label: "[3]", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "After executing at most N - 1 passes, all inversions are resolved and the array completes fully sorted in O(N²) worst-case time using O(1) auxiliary space.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "sorted" },
        { id: "c2", value: 2, label: "[1]", state: "sorted" },
        { id: "c3", value: 4, label: "[2]", state: "sorted" },
        { id: "c4", value: 5, label: "[3]", state: "sorted" },
        { id: "c5", value: 8, label: "[4]", state: "sorted" },
      ],
    },
  },
];

export const generateBubbleSortSteps = (input: number[]): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawInput = Array.isArray(input) && input.length > 0 ? input : DEFAULT_BUBBLE_SORT_INPUT;
  const arr = [...rawInput];
  const n = arr.length;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input) &&
      input.length === DEFAULT_BUBBLE_SORT_INPUT.length &&
      input.every((val, idx) => val === DEFAULT_BUBBLE_SORT_INPUT[idx]));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const makeSnapshot = (
    compA?: number,
    compB?: number,
    isSwapping?: boolean,
    sortedUpToCount: number = 0,
  ): PrimaryVisualSnapshot => {
    const elements: ArrayElement[] = arr.map((val, idx) => {
      const ptrs: string[] = [];
      if (idx === compA) ptrs.push("j");
      if (idx === compB) ptrs.push("j+1");

      let state: ArrayElement["state"] = "default";
      if (idx >= n - sortedUpToCount) {
        state = "sorted";
      } else if (idx === compA || idx === compB) {
        state = isSwapping ? "swap" : "compare";
      }

      return {
        id: `el-${idx}`,
        value: val,
        label: `[${idx}]`,
        state,
        pointers: ptrs.length > 0 ? ptrs : undefined,
      };
    });

    return {
      kind: "array",
      name: "arr",
      mode: "box",
      elements,
    };
  };

  if (n <= 1) {
    addStep(
      `The input array has ${n} element${n === 1 ? "" : "s"}, which requires 0 passes; the array is trivially sorted.`,
      {
        kind: "array",
        name: "arr",
        mode: "box",
        elements: arr.map((val, idx) => ({
          id: `el-${idx}`,
          value: val,
          label: `[${idx}]`,
          state: "sorted",
        })),
      },
    );
    return steps;
  }

  addStep(
    `Having established the mental model, let's now transition to our selected input array of ${n} elements: [${arr.join(", ")}].`,
    makeSnapshot(undefined, undefined, false, 0),
  );

  const makePassStartSnapshot = (
    passNum: number,
    sortedUpToCount: number,
  ): PrimaryVisualSnapshot => {
    const elements: ArrayElement[] = arr.map((val, idx) => {
      let state: ArrayElement["state"] = "default";
      let ptrs: string[] | undefined = undefined;

      if (idx >= n - sortedUpToCount) {
        state = "sorted";
      } else if (idx === 0) {
        state = "active";
        ptrs = [`pass ${passNum}`];
      }

      return {
        id: `el-${idx}`,
        value: val,
        label: `[${idx}]`,
        state,
        pointers: ptrs,
      };
    });

    return {
      kind: "array",
      name: "arr",
      mode: "box",
      elements,
    };
  };

  let sortedCount = 0;
  for (let i = 0; i < n - 1; i++) {
    addStep(
      `Begin pass ${i + 1} of ${n - 1}: we will scan adjacent pairs from index 0 to ${n - 2 - i}, bubbling the largest remaining element to index ${n - 1 - i}.`,
      makePassStartSnapshot(i + 1, sortedCount),
    );

    let swappedInPass = false;
    for (let j = 0; j < n - i - 1; j++) {
      const valJ = arr[j];
      const valJNext = arr[j + 1];

      if (valJ > valJNext) {
        addStep(
          `Compare arr[${j}] = ${valJ} and arr[${j + 1}] = ${valJNext}: because ${valJ} > ${valJNext}, the pair is out of order and must be swapped.`,
          makeSnapshot(j, j + 1, false, sortedCount),
        );

        arr[j] = valJNext;
        arr[j + 1] = valJ;
        swappedInPass = true;

        addStep(
          `Swap arr[${j}] and arr[${j + 1}]: element ${valJ} moves rightward to index ${j + 1}, shifting the larger value closer to the end of the array.`,
          makeSnapshot(j, j + 1, true, sortedCount),
        );
      } else {
        addStep(
          `Compare arr[${j}] = ${valJ} and arr[${j + 1}] = ${valJNext}: because ${valJ} ≤ ${valJNext}, the pair is already in correct order, so no swap is needed.`,
          makeSnapshot(j, j + 1, false, sortedCount),
        );
      }
    }

    sortedCount += 1;
    if (!swappedInPass) {
      sortedCount = n;
      addStep(
        `Zero swaps occurred during pass ${i + 1}, proving that all remaining elements are already sorted. Early exit triggered! Bubble Sort complete: [${arr.join(", ")}].`,
        makeSnapshot(undefined, undefined, false, n),
      );
      break;
    } else if (i < n - 2) {
      addStep(
        `Pass ${i + 1} complete! Element ${arr[n - sortedCount]} has bubbled into its final position at index ${n - sortedCount} and is now locked as sorted.`,
        makeSnapshot(undefined, undefined, false, sortedCount),
      );
    }
  }

  if (sortedCount < n) {
    addStep(
      `Bubble Sort complete! All passes finished and all ${n} elements are locked in non-decreasing order: [${arr.join(", ")}].`,
      makeSnapshot(undefined, undefined, false, n),
    );
  }

  return steps;
};

const BUBBLE_SORT_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "for j in range(0, n - i):",
    "for j in range(0, n - 1):",
    "if arr[j] >= arr[j + 1]:",
    "if arr[j] < arr[j + 1]:",
    "arr[j], arr[j + 1] = arr[j], arr[j + 1]",
  ],
  hints: [
    {
      line: 2,
      hint: "Measure the array once up front, so both loop bounds can be written in terms of it.",
    },
    {
      line: 4,
      hint: "Bound the sweep so it stops before the suffix already settled by earlier passes, and never reads past the last index.",
    },
    {
      line: 5,
      hint: "Compare the neighbours strictly, so equal values are left alone and the sort stays stable.",
    },
    {
      line: 6,
      hint: "Exchange the two neighbours in one statement — Python needs no temporary here.",
    },
  ],
  lineExplanations: {
    1: "Declares the function signature: accepts an un-sorted array of integers and returns it sorted in-place in non-decreasing order.",
    2: "Caches the total length of the array in variable n to avoid re-evaluating len(arr) on every iteration.",
    3: "Outer loop controls the pass count. After i full passes, the i largest elements are guaranteed to be locked into their final sorted positions at the tail.",
    4: "Inner loop scans adjacent pairs from index 0 up to n - i - 1, skipping the suffix already sorted in prior passes and preventing index out-of-bounds access.",
    5: "Compares adjacent elements arr[j] and arr[j + 1]. A strict greater-than condition checks if the pair is inverted and out of order.",
    6: "Swaps arr[j] and arr[j + 1] using Python tuple packing/unpacking, shifting the larger element rightward toward its target index.",
    7: "Returns the modified input array, now fully sorted in non-decreasing order after all passes complete.",
  },
};

export const bubbleSort: AlgorithmDefinition<number[]> = {
  id: "bubble-sort",
  title: "Bubble Sort",
  topicIds: ["arrays_and_hashing"],
  difficulty: "Easy",
  description: `<p>Given an array of integers <code>nums</code>, sort the array in non-decreasing order.</p>
<h3>Problem Statement</h3>
<p>Given an unsorted array of integers <code>nums</code>, return the array sorted in ascending (non-decreasing) order.</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>nums</code>: An unsorted array of integers.</li>
</ul>
<h3>Output</h3>
<p>Returns the array sorted in non-decreasing order.</p>
<h3>Constraints &amp; Edge Cases</h3>
<ul>
  <li><code>1 &le; nums.length &le; 10<sup>3</sup></code>.</li>
  <li><code>-10<sup>4</sup> &le; nums[i] &le; 10<sup>4</sup></code>.</li>
  <li>Single element or already sorted array: Returns array as-is.</li>
  <li>Duplicate values: Order of equal elements is preserved (stable sort).</li>
</ul>`,
  constraints: ["1 <= arr.length <= 10^3", "-10^4 <= arr[i] <= 10^4"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "nums = [5, 2, 8, 1, 4]",
      outputDisplay: "[1, 2, 4, 5, 8]",
      title: "Standard 5-Element Unsorted Array",
      input: DEFAULT_BUBBLE_SORT_INPUT,
      output: "[1, 2, 4, 5, 8]",
      explanation: "Sorts an unsorted array of positive integers into ascending order.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "nums = [64, 34, 25, 12, 22, 11, 90]",
      outputDisplay: "[11, 12, 22, 25, 34, 64, 90]",
      title: "Adversarial 7-Element Unsorted Array",
      input: [64, 34, 25, 12, 22, 11, 90],
      output: "[11, 12, 22, 25, 34, 64, 90]",
      explanation: "A larger array demonstrating repeated adjacent swaps until fully sorted.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "nums = [1, 2, 3, 4, 5]",
      outputDisplay: "[1, 2, 3, 4, 5]",
      title: "Boundary Already Sorted Array",
      input: [1, 2, 3, 4, 5],
      output: "[1, 2, 3, 4, 5]",
      explanation: "Already sorted array; verifies early exit after 0 swaps are made.",
    },
  ],
  code: BUBBLE_SORT_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n²)",
    worst: "O(n²)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Each pass walks the unsorted portion comparing neighbours, shrinking that portion by one each pass. In the worst case we make sum_{i=1}^{n-1} i = n(n-1)/2 comparisons, which is O(n²).",
    space:
      "Sorting occurs entirely in-place by swapping adjacent memory locations, maintaining O(1) constant auxiliary space.",
  },
  topicGuide: {
    overview:
      "<p>Bubble Sort is the fundamental comparison-based sorting algorithm operating via adjacent swaps. While inefficient for large <code>N</code> (<code>O(N<sup>2</sup>)</code> average/worst-case), its simplicity makes it ideal for studying inversion counts, stability guarantees, and adjacent memory accesses. In real-world systems, small-scale adjacent sorting patterns appear in hardware graphics pipelines and low-overhead microcontrollers.</p>",
    sections: [
      {
        heading: "Core Concept & Adjacent Inversion Repair",
        body: "<p>The algorithm repeatedly compares adjacent elements <code>arr[j]</code> and <code>arr[j+1]</code>. If <code>arr[j] &gt; arr[j+1]</code>, they are swapped, eliminating exactly one inversion. With each pass <code>i</code>, the largest remaining element bubbles up to its final destination at index <code>N - i - 1</code>. This guarantees progressive progress toward full sorting.</p>",
      },
      {
        heading: "Systems & Performance Impact: Memory Locality & SIMD",
        body: "<p>Because Bubble Sort accesses array elements sequentially (<code>arr[j]</code>, <code>arr[j+1]</code>), it exhibits high CPU cache line spatial locality compared to tree-based or heap-based sorts. However, its high total swap count creates branch mispredictions and write amplification on modern flash/NVMe controllers. In SIMD architectures, fixed small adjacent swaps can be vectorised effectively.</p>",
      },
      {
        heading: "Implementation Nuances & Stability",
        body: "<p>Bubble Sort is a stable sorting algorithm because equal elements are never swapped (comparison is strictly <code>arr[j] &gt; arr[j+1]</code>). Using a swapped boolean flag allows the algorithm to detect sorted arrays early and exit in <code>O(N)</code> best-case time. Preserving stability is essential when sorting structured records by secondary keys.</p>",
      },
      {
        heading: "Edge Case Analysis & Boundary Invariants",
        body: "<p>For <code>N &le; 1</code>, zero passes are executed because the array is trivially sorted. Reverse-sorted arrays represent the absolute worst case requiring <code>N(N-1)/2</code> swaps. Already-sorted arrays require <code>N-1</code> comparisons and 0 swaps when early-exit optimization is active.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Inversion",
        definition:
          "A pair of indices (i, j) such that i < j but arr[i] > arr[j]. Bubble Sort resolves exactly one adjacent inversion per swap.",
      },
      {
        term: "Stable Sort",
        definition:
          "A sorting algorithm that preserves the relative order of elements with equal keys.",
      },
      {
        term: "Adaptive Algorithm",
        definition:
          "An algorithm whose runtime improves (e.g. down to O(N)) when the input is already partially sorted.",
      },
    ],
  },
  trivia: BUBBLE_SORT_TRIVIA,
  sources: [
    {
      kind: "standard",
      label: "Standard Algorithm",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 3",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 3,
      section: "3.1 Sorting theory",
    },
  ],
  defaultInput: DEFAULT_BUBBLE_SORT_INPUT,
  generateSteps: generateBubbleSortSteps,
};

export default bubbleSort;
