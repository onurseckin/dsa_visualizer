import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export const KADANE_MAX_SUBARRAY_CODE = `def kadane_max_subarray(nums: list[int]) -> int:
    current_max = nums[0]
    global_max = nums[0]
    start = end = temp_start = 0

    for i in range(1, len(nums)):
        if nums[i] > current_max + nums[i]:
            current_max = nums[i]
            temp_start = i
        else:
            current_max += nums[i]

        if current_max > global_max:
            global_max = current_max
            start = temp_start
            end = i

    return global_max`;

export const generateKadaneMaxSubarraySteps = (input: number[]): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const elements: ArrayElement[] = input.map((val, idx) => ({
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
        elements: elements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          currentMax: String(variables.currentMax ?? 0),
          globalMax: String(variables.globalMax),
        },
      },
      variables,
    });
  };

  const n = elements.length;

  if (n === 0) {
    addStep(
      1,
      "Handle empty input",
      "There are no elements to build a subarray from, so the best sum defaults to 0 and we stop right away.",
      { currentMax: 0, globalMax: 0, n: 0 },
    );
    return steps;
  }

  let currentMax = Number(elements[0].value);
  let globalMax = Number(elements[0].value);
  let start = 0;
  let end = 0;
  let tempStart = 0;

  elements[0].state = "active";
  elements[0].pointers = ["start", "end"];

  addStep(
    2,
    `Start both sums at ${currentMax}`,
    `The only subarray that ends at index 0 is [${elements[0].value}] by itself, so both our running sum and our best-so-far begin there. From now on, every element just has to decide: join the current run, or start a new one.`,
    { currentMax, globalMax, start, end, tempStart, i: 0, "nums[0]": elements[0].value },
  );

  for (let i = 1; i < n; i++) {
    const val = Number(elements[i].value);

    // Reset element states to default, then set active bounds
    for (let k = 0; k < n; k++) {
      if (k >= tempStart && k < i) {
        elements[k].state = "active";
      } else {
        elements[k].state = "default";
      }
      elements[k].pointers = undefined;
    }

    elements[i].state = "compare";
    elements[i].pointers = ["i"];

    // Captured before mutation so explanations can show the sum being abandoned/extended
    const prevSum = currentMax;

    if (val > currentMax + val) {
      currentMax = val;
      tempStart = i;

      // Update pointers for new window start
      elements[i].state = "active";
      elements[i].pointers = ["i", "tempStart"];

      addStep(
        7,
        `Restart the subarray at index ${i}`,
        `The sum we were carrying, ${prevSum}, is negative — adding ${val} on top of it would leave less than ${val} alone. So we drop that stretch and let a fresh subarray begin here.`,
        { i, "nums[i]": val, currentMax, globalMax, tempStart },
      );
    } else {
      currentMax += val;

      addStep(
        11,
        `Extend the subarray to ${currentMax}`,
        `Our running sum ${prevSum} is worth keeping, so we let it absorb ${val}. The best subarray ending at index ${i} is now worth ${currentMax}.`,
        { i, "nums[i]": val, currentMax, globalMax, tempStart },
      );
    }

    if (currentMax > globalMax) {
      globalMax = currentMax;
      start = tempStart;
      end = i;

      addStep(
        14,
        `Record new best sum ${globalMax}`,
        `The subarray ending at index ${i} sums to ${currentMax}, better than anything we've seen so far. We note the new record and its span [${start}..${end}].`,
        { i, currentMax, globalMax, start, end, tempStart },
      );
    }
  }

  // Highlight the best subarray as sorted
  for (let k = 0; k < n; k++) {
    if (k >= start && k <= end) {
      elements[k].state = "sorted";
      const ptrs: string[] = [];
      if (k === start) ptrs.push("max_start");
      if (k === end) ptrs.push("max_end");
      elements[k].pointers = ptrs.length > 0 ? ptrs : undefined;
    } else {
      elements[k].state = "default";
      elements[k].pointers = undefined;
    }
  }

  addStep(
    18,
    `Kadane's scan complete`,
    `The best contiguous run spans [${start}..${end}] with a sum of ${globalMax}. One linear pass was enough, because each element only had to answer a single question: extend the run or start over.`,
    { globalMax, start, end },
  );

  return steps;
};

const KADANE_MAX_SUBARRAY_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares the function: given a list of numbers, return the largest sum obtainable from any contiguous run inside it.",
    2: "Seeds the running sum with nums[0], since the only subarray ending at index 0 is that single element by itself.",
    3: "Seeds the best-seen sum with nums[0] too, so a single-element array already has a valid answer before the loop starts.",
    4: "Initializes start, end, and temp_start to 0, the bookkeeping that will track the boundaries of the best run once one is found.",
    6: "Iterates from index 1 onward — index 0 was already handled by the seeding above — so each remaining element makes one extend-or-restart decision.",
    7: "Compares taking nums[i] alone against extending the running sum: if the running sum is negative, adding nums[i] to it produces less than nums[i] alone, so it isn't worth carrying forward.",
    8: "Restarts the running sum at nums[i] alone, discarding the previous run because it was actively hurting rather than helping.",
    9: "Marks index i as the new start of the current run, since the run now begins fresh here.",
    11: "Extends the running sum by folding in nums[i], because the run so far was non-negative and worth keeping.",
    13: "Checks whether the run ending here beats the best run recorded anywhere so far.",
    14: "Updates the best-known sum to the current run's total, since it is now the new record.",
    15: "Records temp_start as the officially reported start of the best subarray, promoting it only now that this run has actually won.",
    16: "Records i as the end of the best subarray, completing the [start, end] span that produced global_max.",
    18: "Returns the best sum found across the whole scan, the answer to the problem.",
  },
};

export const kadaneMaxSubarray: AlgorithmDefinition<number[]> = {
  id: "kadane-max-subarray",
  title: "Kadane's Algorithm (Maximum Subarray)",
  category: "arrays_and_hashing",
  categories: ["arrays_and_hashing"],
  difficulty: "Medium",
  description:
    "Kadane's Algorithm finds the maximum sum of a contiguous subarray in a single pass. Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.\n\n### Input Parameters\n- nums (list[int]): An array of integers containing positive and negative values.\n\n### Output\n- int: The maximum sum obtainable from any contiguous subarray.\n\n### Edge Cases & Constraints\n- All-negative arrays: Returns the single maximum element (least negative value).\n- Single element arrays: Returns nums[0].\n- Contiguity constraint: Elements must be contiguous; non-adjacent sums are not allowed.",
  constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
      outputDisplay: "6",
      title: "Basic Example",
      input: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      output: "6",
      explanation: "The contiguous subarray [4, -1, 2, 1] has the largest sum = 6.",
    },
    {
      kind: "complex",
      inputDisplay: "nums = [5, 4, -1, 7, 8]",
      outputDisplay: "23",
      title: "Complex Edge Case",
      input: [5, 4, -1, 7, 8],
      output: "23",
      explanation:
        "All positive elements except -1; the maximum subarray spans the entire array with sum 23.",
    },
    {
      kind: "negative",
      inputDisplay: "nums = [-5, -2, -8, -1]",
      outputDisplay: "-1",
      title: "Failing / Boundary Case",
      input: [-8, -3, -6, -2, -5],
      output: "-2",
      explanation:
        "All elements are negative. Kadane's algorithm selects the single max element -2.",
    },
  ],
  code: KADANE_MAX_SUBARRAY_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "We make a single left-to-right pass, and at each element we do only a constant amount of work: one comparison to decide whether to extend or restart the run, and one to update the best-so-far. That's n constant-time decisions, so the total is O(n) in every case — no input can make the pass longer.",
    space:
      "We carry just a handful of scalars — the running sum, the best sum, and a few indices — no matter how long the array gets, so extra memory stays constant at O(1).",
  },
  topicGuide: {
    overview:
      "Kadane's Algorithm is an optimal dynamic programming technique that solves the Maximum Subarray Problem in O(N) time and O(1) space. In real-world systems, Kadane's algorithm is applied in quantitative finance for maximum drawdown/profit window analysis, digital signal processing for peak energy detection, image processing (2D grid extension), and genomic sequencing for finding GC-dense regions.",
    sections: [
      {
        heading: "Core Concept & Local vs. Global Optimum",
        body: "Kadane's algorithm maintains two variables: current_max (the maximum subarray sum ending at the current position i) and global_max (the maximum sum encountered across all positions). At index i, current_max = max(nums[i], current_max + nums[i]). If current_max drops below nums[i], the previous prefix sum is discarded and a new subarray starts at i.",
      },
      {
        heading: "Systems & Performance Impact: Low Latency & Streaming",
        body: "Because Kadane's algorithm requires only a single sequential pass over the array with O(1) state overhead, it executes with near-zero CPU cache misses. It is easily vectorized using SIMD registers and runs in online streaming systems (processing event streams in real time without storing history).",
      },
      {
        heading: "Implementation Nuances & Negative Numbers",
        body: "To handle arrays where all elements are negative, current_max and global_max must be initialized to nums[0] rather than 0. Initializing to 0 would incorrectly return 0 for an array like [-5, -2, -8], whereas initialization to nums[0] correctly returns -2.",
      },
      {
        heading: "Edge Case & Boundary Analysis",
        body: "For N=1, the loop does not execute and nums[0] is returned immediately. For uniform positive arrays, global_max accumulates the entire array sum. For alternating positive and negative values, Kadane's selectively bridges negative valleys if the subsequent positive peak exceeds the valley's magnitude loss.",
      },
    ],
    keyTerms: [
      {
        term: "Contiguous Subarray",
        definition: "A sequence of elements occupying adjacent memory locations within an array.",
      },
      {
        term: "Optimal Substructure",
        definition:
          "A property of dynamic programming where an optimal solution to a problem contains optimal solutions to its subproblems.",
      },
      {
        term: "Online Algorithm",
        definition:
          "An algorithm that can process its input piece-by-piece in a serial fashion without requiring the entire input upfront.",
      },
    ],
  },
  trivia: KADANE_MAX_SUBARRAY_TRIVIA,
  leetcode: {
    id: 53,
    url: "https://leetcode.com/problems/maximum-subarray/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #53",
      leetcodeId: 53,
      url: "https://leetcode.com/problems/maximum-subarray/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 2",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 2,
      section: "2.4 Maximum subarray sum",
    },
  ],
  defaultInput: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  generateSteps: generateKadaneMaxSubarraySteps,
};
