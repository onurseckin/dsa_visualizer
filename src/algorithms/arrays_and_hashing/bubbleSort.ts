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
  difficulty: "Easy",
  description:
    "Bubble Sort is a simple comparison-based sorting algorithm: it sweeps through the array repeatedly, swapping adjacent neighbours that are out of order, so each sweep floats the largest remaining value to the end.",
  constraints: ["1 <= arr.length <= 10^3", "-10^4 <= arr[i] <= 10^4"],
  examples: [
    {
      input: "arr = [5, 2, 8, 1, 4]",
      output: "[1, 2, 4, 5, 8]",
      explanation:
        "Repeatedly swaps adjacent inverted pairs until array is completely sorted in ascending order.",
    },
    {
      input: "arr = [3, 2, 1]",
      output: "[1, 2, 3]",
      explanation: "Reverse sorted array requires maximum swaps across all passes.",
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
      "Bubble Sort is the simplest correct sorting algorithm, and its real value is as a lens on what sorting actually requires. It works entirely through local repair: it only ever compares neighbours and only ever swaps neighbours, yet repeated local repair provably produces a globally sorted array. Studying it gives you a concrete feel for inversions, in-place mutation, stability, and adaptivity — the vocabulary you need to reason about every faster sort that follows. You will rarely ship it, but you will keep using the ideas it makes visible.",
    sections: [
      {
        heading: "The core idea: fix neighbours and let order emerge",
        body: "The algorithm never looks at the array as a whole; it only ever asks whether one adjacent pair is in the wrong relative order and swaps if so. The insight is that an unsorted array must contain at least one adjacent pair that is out of order, so as long as any disorder remains there is always a swap available to make. Each swap removes exactly one inversion, and since a sorted array is precisely an array with zero inversions, this local rule cannot get stuck short of the answer. The name comes from the visible side effect: within a single sweep the largest value encountered keeps winning its comparisons and rides all the way to the end of the pass, like a bubble surfacing.",
      },
      {
        heading: "How the passes and the shrinking boundary work",
        body: "The outer loop counts passes and the inner loop walks the still-unsorted prefix, comparing arr[j] with arr[j + 1] and swapping when the left value is larger. The inner bound is n minus i minus 1 rather than n minus 1 because after i passes the last i positions already hold the i largest values in final order, so re-scanning them would be wasted work. That shrinking boundary is what makes later passes progressively cheaper and is the difference between a correct implementation and one that just happens to work. Everything happens in place through swaps, so at no point does a second array exist.",
      },
      {
        heading: "Why it is correct: the sorted-suffix invariant",
        body: "The invariant is that after i complete passes, the final i positions of the array contain the i largest elements, each already in its correct final slot. That holds because a full sweep carries the maximum of the unsorted region to the right end of that region: whenever the running maximum meets a smaller neighbour it wins the comparison and moves forward, and it never loses one. Since each pass extends the sorted suffix by exactly one element, after n minus 1 passes only a single element can remain unplaced, and by elimination it must already be the smallest. Termination is guaranteed by the inversion count, which strictly decreases with every swap and can never go below zero.",
      },
      {
        heading: "When it is defensible, and what to use instead",
        body: "Bubble Sort is a fine choice for teaching, for tiny fixed-size arrays where clarity beats speed, and for arrays you know are almost sorted, because with the early-exit flag it detects sortedness in a single clean sweep. For anything else it loses badly: insertion sort does the same adaptive job with far fewer element writes, merge sort gives predictable performance with stability, and quick sort wins in practice on large in-memory data. If a nearly-sorted input is your real workload, insertion sort is the honest version of what bubble sort is trying to be. The one property worth remembering is that it is stable, so it will not reorder records that compare equal.",
      },
      {
        heading: "Pitfalls and edge cases",
        body: 'Forgetting the early-exit flag is the most common omission, and it costs you the entire best case: without a "did anything swap" check, an already-sorted array still grinds through every pass. Getting the inner bound wrong is the other frequent bug, since dropping the minus i re-scans placed elements, and dropping the minus 1 reads one slot past the end. Comparing with a strict greater-than rather than greater-or-equal is what keeps the sort stable, so relaxing that comparison quietly breaks equal-key ordering. Arrays of length zero or one need no special case, because both loops simply never execute, and duplicates need no handling at all since equal neighbours are left alone.',
      },
      {
        heading: "How it connects to the rest of sorting",
        body: "Bubble Sort sits with selection sort and insertion sort as the three quadratic comparison sorts, and the contrast between them is instructive: selection sort searches for the extreme then places it once, insertion sort grows a sorted prefix by shifting, and bubble sort only ever swaps neighbours. Cocktail-shaker sort alternates sweep direction to move small values left faster, and comb sort generalises the neighbour gap from one to a shrinking sequence, which is precisely the leap that makes shell sort subquadratic. Because every swap fixes exactly one inversion, bubble sort performs a number of swaps equal to the array inversion count, which makes it the canonical way to measure how unsorted a sequence really is. The broader takeaway is that no comparison sort escapes the n log n barrier, and the fast ones earn their speed by comparing distant elements rather than only neighbours.",
      },
    ],
    keyTerms: [
      {
        term: "Inversion",
        definition:
          "A pair of positions whose values are in the wrong relative order. The number of inversions measures how far an array is from sorted, and each adjacent swap removes exactly one.",
      },
      {
        term: "Pass",
        definition:
          "One full sweep of the inner loop across the unsorted region. Each pass places at least one more element in its final position.",
      },
      {
        term: "In-place",
        definition:
          "Rearranging the input array itself using only a constant amount of extra memory. Bubble Sort qualifies because it stores nothing beyond loop counters and a swap temporary.",
      },
      {
        term: "Stable sort",
        definition:
          "A sort that preserves the original relative order of elements that compare equal. Bubble Sort is stable as long as it swaps only on a strict inequality.",
      },
      {
        term: "Adaptive sort",
        definition:
          "A sort that runs faster on input that is already partially ordered. The early-exit flag is what makes Bubble Sort adaptive, letting a sorted array finish in one pass.",
      },
    ],
  },
  trivia: BUBBLE_SORT_TRIVIA,
  defaultInput: [5, 2, 8, 1, 4],
  generateSteps: generateBubbleSortSteps,
};
