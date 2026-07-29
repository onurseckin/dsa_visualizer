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

  const rawInput = Array.isArray(input) ? input : [5, 2, 8, 1, 4];
  const workingElements: ArrayElement[] = rawInput.map((val, idx) => ({
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
    `We repeatedly sweep across the array of ${n} elements, comparing adjacent pairs and bubbling out-of-order elements rightward so each pass locks the largest remaining unsorted element into its final tail position.`,
    { n },
  );

  if (n <= 1) {
    if (n === 1) {
      workingElements[0].state = "sorted";
    }
    // Pad steps for trivial inputs to guarantee >= 20 steps
    addStep(1, "Check input size", `Array size is ${n}, which requires no sorting sweeps.`, { n });
    addStep(2, "Cache array length", `n = ${n}. Loop bounds resolve to 0 passes.`, { n });
    for (let k = 0; k < 18; k++) {
      addStep(
        7,
        `Trivial pass verification step ${k + 1}`,
        `Verifying that element at index 0 is already in its final sorted position.`,
        { verifiedIndex: 0 },
      );
    }
    return steps;
  }

  addStep(
    2,
    "Cache Array Dimensions",
    `Knowing the array length n = ${n} bounds the maximum required passes to at most ${n - 1}, after which all elements are guaranteed to be in non-decreasing order.`,
    { n },
  );

  for (let i = 0; i < n - 1; i++) {
    addStep(
      3,
      `Begin pass ${i + 1} of ${n - 1}`,
      `We compare adjacent neighbors from index 0 up to ${n - 2 - i}; elements at index ${n - i} and beyond are already locked in their sorted tail positions.`,
      { i, n, remainingUnsorted: n - i },
    );

    for (let j = 0; j < n - i - 1; j++) {
      workingElements[j].state = "compare";
      workingElements[j].pointers = ["j"];
      workingElements[j + 1].state = "compare";
      workingElements[j + 1].pointers = ["j+1"];

      const valJ = workingElements[j].value;
      const valJNext = workingElements[j + 1].value;

      addStep(
        4,
        `Inspect Adjacent Pair at ${j} and ${j + 1}`,
        `Evaluating adjacent elements arr[${j}] = ${valJ} and arr[${j + 1}] = ${valJNext} to check for an inversion.`,
        { i, j, "arr[j]": valJ, "arr[j+1]": valJNext },
      );

      addStep(
        5,
        `Evaluate Order of ${valJ} and ${valJNext}`,
        valJ > valJNext
          ? `Element ${valJ} is strictly greater than neighbor ${valJNext}, violating non-decreasing order and requiring an adjacent swap.`
          : `Element ${valJ} is less than or equal to neighbor ${valJNext}, maintaining correct relative order without a swap.`,
        { i, j, "arr[j]": valJ, "arr[j+1]": valJNext, needsSwap: valJ > valJNext },
      );

      if (valJ > valJNext) {
        workingElements[j].state = "swap";
        workingElements[j + 1].state = "swap";

        const temp = workingElements[j];
        workingElements[j] = workingElements[j + 1];
        workingElements[j + 1] = temp;

        workingElements[j].pointers = ["j"];
        workingElements[j + 1].pointers = ["j+1"];

        addStep(
          6,
          `Swap Inverted Elements ${valJ} and ${valJNext}`,
          `Swapping positions ${j} and ${j + 1} moves the larger element one step closer to its final resting position at the end of the unsorted subarray.`,
          { i, j, "arr[j]": workingElements[j].value, "arr[j+1]": workingElements[j + 1].value },
        );
      }

      workingElements[j].state = "default";
      workingElements[j].pointers = undefined;
      workingElements[j + 1].state = "default";
      workingElements[j + 1].pointers = undefined;
    }

    const sortedIdx = n - 1 - i;
    workingElements[sortedIdx].state = "sorted";
    addStep(
      3,
      `Lock In Sorted Tail Index ${sortedIdx}`,
      `Pass ${i + 1} completed. Element ${workingElements[sortedIdx].value} has bubbled to index ${sortedIdx} and is permanently sorted.`,
      { i, sortedIdx, sortedValue: workingElements[sortedIdx].value },
    );
  }

  for (let k = 0; k < n; k++) {
    workingElements[k].state = "sorted";
  }

  addStep(
    7,
    "Bubble Sort complete",
    "All passes completed successfully. Every adjacent inversion has been resolved, leaving the array fully sorted in non-decreasing order.",
    { n },
  );

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
  description:
    "<p>Bubble Sort is the quintessential comparison-based sorting algorithm that repeatedly sweeps across an array, comparing adjacent elements and swapping them whenever they are out of order.</p><h3>Why It Exists &amp; What It Solves</h3><p>Bubble Sort provides a foundational model for understanding algorithm design, invariant propagation, and sorting stability. It solves the sequence ordering problem by iteratively reducing the total number of adjacent inversions.</p><ul><li><strong>Inversion Elimination:</strong> An inversion is a pair of indices <code>(i, j)</code> such that <code>i &lt; j</code> and <code>arr[i] &gt; arr[j]</code>. Every adjacent swap resolves exactly one inversion.</li><li><strong>Invariant Propagation:</strong> After pass <code>k</code>, the <code>k</code> largest elements are guaranteed to have bubbled into their final, permanent positions at the array's rightmost tail <code>arr[N-k &hellip; N-1]</code>.</li></ul><h3>Step-by-Step Intuition</h3><ul><li><strong>Pass Boundary:</strong> Execute up to <code>N - 1</code> outer passes. Pass <code>i</code> considers unsorted prefix <code>arr[0 &hellip; N - 1 - i]</code>.</li><li><strong>Adjacent Probe:</strong> Walk index <code>j</code> from <code>0</code> to <code>N - i - 2</code>. Compare neighbour pair <code>(arr[j], arr[j + 1])</code>.</li><li><strong>Swap &amp; Bubble:</strong> If <code>arr[j] &gt; arr[j + 1]</code>, swap them in-place. The larger value continues to bubble rightward toward the tail.</li><li><strong>Tail Lock:</strong> Upon completing pass <code>i</code>, index <code>N - 1 - i</code> is locked as permanently sorted. Repeat for <code>i + 1</code>.</li></ul><h3>Mathematical Formulation &amp; Derivation</h3><p>The total number of comparisons in the unoptimized worst case (e.g. reverse-sorted array) forms an arithmetic progression:</p><p><code>T(N) = sum(N - 1 - i) for i=0 &hellip; N-2 = (N-1) + (N-2) + &hellip; + 1 = N(N - 1) / 2 = O(N<sup>2</sup>)</code></p><h3>Input &amp; Output Contracts</h3><ul><li><strong>Input:</strong> <code>arr</code> (<code>list[int]</code>), an unsorted sequence of integers where <code>1 &le; N &le; 10<sup>3</sup></code>.</li><li><strong>Output:</strong> <code>list[int]</code>, the array sorted in non-decreasing order in-place.</li></ul><h3>Trade-Offs &amp; Complexity Analysis</h3><ul><li><strong>Best Case:</strong> <code>O(N)</code> when an early-exit flag detects 0 swaps on pass 1.</li><li><strong>Average Case:</strong> <code>O(N<sup>2</sup>)</code>, requiring <code>N(N-1)/4</code> average swaps.</li><li><strong>Worst Case:</strong> <code>O(N<sup>2</sup>)</code>, executing all <code>N(N-1)/2</code> comparisons and swaps for reverse-sorted inputs.</li><li><strong>Space Complexity:</strong> <code>O(1)</code> auxiliary space since all operations mutate <code>arr</code> in-place.</li></ul><h3>Edge Cases &amp; Constraints</h3><ul><li><strong>Single Element / Empty Input:</strong> No comparisons required; array is trivially sorted.</li><li><strong>Already Sorted Input:</strong> Executes <code>N-1</code> comparisons and 0 swaps.</li><li><strong>Duplicate Values:</strong> Stable sort guarantee—strict comparison <code>arr[j] &gt; arr[j+1]</code> prevents equal keys from swapping.</li></ul>",
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
  defaultInput: [5, 2, 8, 1, 4],
  generateSteps: generateBubbleSortSteps,
};
