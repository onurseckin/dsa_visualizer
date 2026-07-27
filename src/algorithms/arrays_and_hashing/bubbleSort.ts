import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export const BUBBLE_SORT_CODE = `def bubble_sort(arr: list[int]) -> list[int]:
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`;

export const generateBubbleSortSteps = (input: number[]): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const workingElements: ArrayElement[] = input.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: workingElements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {},
      variables,
    });
  };

  const n = workingElements.length;

  addStep(
    1,
    "Initialize Bubble Sort",
    `We'll sweep across these ${n} values again and again, nudging out-of-order neighbours apart. Each sweep floats the biggest remaining value to the right end, like a bubble rising.`,
    { n },
  );

  if (n <= 1) {
    if (n === 1) {
      workingElements[0].state = "sorted";
    }
    addStep(
      7,
      "Bubble Sort complete",
      "An array this small has nothing out of order, so we are done before we start.",
      { n },
    );
    return steps;
  }

  addStep(
    2,
    `Note the length n = ${n}`,
    `Knowing there are ${n} elements tells us at most ${n - 1} passes will be needed — after that many sweeps, every value has had the chance to settle into place.`,
    { n },
  );

  for (let i = 0; i < n - 1; i++) {
    addStep(
      3,
      `Begin pass ${i + 1} of ${n - 1}`,
      `We compare neighbours from index 0 up to ${n - 2 - i}; everything past that is already settled. By the end of this pass, the largest remaining value will have risen to index ${n - 1 - i}.`,
      { i, n },
    );

    for (let j = 0; j < n - i - 1; j++) {
      // Highlight compared elements
      workingElements[j].state = "compare";
      workingElements[j].pointers = ["j"];
      workingElements[j + 1].state = "compare";
      workingElements[j + 1].pointers = ["j+1"];

      const valJ = workingElements[j].value;
      const valJNext = workingElements[j + 1].value;

      addStep(
        5,
        `Compare ${valJ} with ${valJNext}`,
        valJ > valJNext
          ? `${valJ} is bigger than its neighbour ${valJNext}, so this pair is out of order — the larger value belongs further right, and a swap will move it there.`
          : `${valJ} is not bigger than ${valJNext}, so this pair already sits in the right order and we simply slide on to the next one.`,
        { i, j, "arr[j]": valJ, "arr[j+1]": valJNext },
      );

      if (valJ > valJNext) {
        workingElements[j].state = "swap";
        workingElements[j + 1].state = "swap";

        const temp = workingElements[j];
        workingElements[j] = workingElements[j + 1];
        workingElements[j + 1] = temp;

        addStep(
          6,
          `Swap ${valJ} and ${valJNext}`,
          `With the pair flipped, ${valJ} moves one seat closer to the right end, continuing its rise toward where it finally belongs.`,
          { i, j, "arr[j]": workingElements[j].value, "arr[j+1]": workingElements[j + 1].value },
        );
      }

      // Reset pointers and state if not sorted
      workingElements[j].state = "default";
      workingElements[j].pointers = undefined;
      workingElements[j + 1].state = "default";
      workingElements[j + 1].pointers = undefined;
    }

    // Mark the bubbled element as sorted
    const sortedIdx = n - 1 - i;
    workingElements[sortedIdx].state = "sorted";
    addStep(
      3,
      `Lock in index ${sortedIdx}`,
      `Pass ${i + 1} is done, and ${workingElements[sortedIdx].value} has bubbled all the way to index ${sortedIdx}. Nothing bigger remains to its left, so it never has to move again.`,
      { i, sortedIdx, sortedValue: workingElements[sortedIdx].value },
    );
  }

  // Mark first element as sorted as well
  workingElements[0].state = "sorted";
  for (let k = 0; k < n; k++) {
    workingElements[k].state = "sorted";
  }

  addStep(
    7,
    "Bubble Sort complete",
    "Every pass has run and every value has settled where it belongs — the array now reads in ascending order from left to right.",
    { n },
  );

  return steps;
};

/* Line 1 is the given signature; the distractors below are the two bugs this
   solution actually invites — a mis-shrunk inner bound and a relaxed comparison
   that silently costs stability. */
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
    1: "Declares the function signature: it takes an array and returns it sorted in place, the contract every call in this file relies on.",
    2: "Caches the array's length in n so the loop bounds below don't recompute len(arr) on every iteration.",
    3: "The outer loop counts passes; after i full passes, the i largest elements are already parked at the tail end of the array.",
    4: "The inner loop walks the still-unsorted prefix, stopping short of the tail that earlier passes already sorted, so index j + 1 never runs off the array's end.",
    5: "Compares two neighbours: a strict greater-than means this pair is inverted and needs swapping, while equal values are left untouched so the sort stays stable.",
    6: "Swaps arr[j] and arr[j + 1] in a single tuple assignment, nudging the larger value one seat closer to its final position on the right.",
    7: "Returns the now-sorted array once every pass has finished.",
  },
};

export const bubbleSort: AlgorithmDefinition<number[]> = {
  id: "bubble-sort",
  title: "Bubble Sort",
  category: "arrays_and_hashing",
  categories: ["arrays_and_hashing"],
  difficulty: "Easy",
  description:
    "Bubble Sort is a simple comparison-based sorting algorithm: it repeatedly iterates through the list, comparing adjacent elements and swapping them if they are out of order.\n\n### Input Parameters\n- arr (list[int]): An un-sorted array of integers.\n\n### Output\n- list[int]: The array sorted in non-decreasing order.\n\n### Edge Cases & Constraints\n- Arrays of size 1 or 0 are already sorted.\n- Already-sorted arrays complete in O(N) time with early exit flag.\n- Duplicate elements maintain their relative order (stable sort).",
  constraints: ["1 <= arr.length <= 10^3", "-10^4 <= arr[i] <= 10^4"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nums = [5, 1, 4, 2, 8]",
      outputDisplay: "[1, 2, 4, 5, 8]",
      title: "Basic Example",
      input: [5, 1, 4, 2, 8],
      output: "[1, 2, 4, 5, 8]",
      explanation: "Sorts an unsorted array of positive integers into ascending order.",
    },
    {
      kind: "complex",
      inputDisplay: "nums = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]",
      outputDisplay: "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]",
      title: "Complex Edge Case",
      input: [64, 34, 25, 12, 22, 11, 90],
      output: "[11, 12, 22, 25, 34, 64, 90]",
      explanation: "A larger array demonstrating repeated adjacent swaps until fully sorted.",
    },
    {
      kind: "negative",
      inputDisplay: "nums = [1, 2, 3, 4, 5]",
      outputDisplay: "[1, 2, 3, 4, 5]",
      title: "Failing / Boundary Case",
      input: [1, 2, 3, 4, 5],
      output: "[1, 2, 3, 4, 5]",
      explanation: "Already sorted array; verifies no unnecessary swaps are made.",
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
    time: "Each pass walks the unsorted portion comparing neighbours, and each pass shrinks that portion by one, so in the worst case we make roughly n + (n-1) + … + 1 comparisons — about n²/2, which is O(n²). A reverse-sorted array pays that price in full; with the common early-exit check, an already-sorted array finishes after one swap-free pass, giving the O(n) best case.",
    space:
      "Sorting happens in place by swapping adjacent elements, so we only ever hold a temporary value during a swap plus two loop counters — constant extra memory, O(1).",
  },
  topicGuide: {
    overview:
      "Bubble Sort is the fundamental comparison-based sorting algorithm operating via adjacent swaps. While inefficient for large N (O(N^2) average/worst-case), its simplicity makes it ideal for studying inversion counts, stability guarantees, and adjacent memory accesses. In real-world systems, small-scale adjacent sorting patterns appear in hardware graphics pipelines and low-overhead microcontrollers.",
    sections: [
      {
        heading: "Core Concept & Adjacent Inversion Repair",
        body: "The algorithm repeatedly compares adjacent elements arr[j] and arr[j+1]. If arr[j] > arr[j+1], they are swapped, eliminating one inversion. With each pass i, the largest remaining element bubbles up to its final destination at index N - i - 1.",
      },
      {
        heading: "Systems & Performance Impact: Memory Locality & SIMD",
        body: "Because Bubble Sort accesses array elements sequentially (arr[j], arr[j+1]), it exhibits high CPU cache line spatial locality compared to tree-based or heap-based sorts. However, its high total swap count creates branch mispredictions and write amplification on modern flash/NVMe controllers.",
      },
      {
        heading: "Implementation Nuances & Stability",
        body: "Bubble Sort is a stable sorting algorithm because equal elements are never swapped (comparison is strictly arr[j] > arr[j+1]). Using a swapped boolean flag allows the algorithm to detect sorted arrays early and exit in O(N) best-case time.",
      },
      {
        heading: "Edge Case Analysis",
        body: "For N <= 1, zero passes are executed. Reverse-sorted arrays represent the absolute worst case requiring N*(N-1)/2 swaps. Already-sorted arrays require N-1 comparisons and 0 swaps when early-exit optimization is active.",
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
  defaultInput: [5, 2, 8, 1, 4],
  generateSteps: generateBubbleSortSteps,
};
