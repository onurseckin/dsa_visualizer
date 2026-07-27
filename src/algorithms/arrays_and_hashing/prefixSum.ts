import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface PrefixSumInput {
  nums: number[];
}

export const PREFIX_SUM_CODE = `def prefix_sum(nums: list[int]) -> list[int]:
    n = len(nums)
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + nums[i]
    return prefix`;

export const DEFAULT_PREFIX_SUM_INPUT: PrefixSumInput = {
  nums: [2, 4, 1, 3, 5],
};

export const generatePrefixSumSteps = (input: PrefixSumInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nums = input.nums;
  const n = nums.length;

  const elements: ArrayElement[] = nums.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const prefixValues: number[] = new Array(n + 1).fill(0);

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
        visited: [...prefixValues],
        customState: {
          prefixArray: prefixValues.join(", "),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Start building prefix sums",
    `We'll turn [${nums.join(", ")}] into a ladder of running totals, so that later any range sum can be read off with one subtraction instead of re-adding the whole slice.`,
    { length: n },
  );

  addStep(
    3,
    "Allocate the prefix array",
    `We make room for ${n + 1} totals, all zero for now: [${prefixValues.join(", ")}]. The extra leading 0 means even a range starting at index 0 has something clean to subtract.`,
    { prefixLength: n + 1 },
  );

  for (let i = 0; i < n; i++) {
    elements[i].state = "active";
    elements[i].pointers = ["i"];

    const currentVal = nums[i];
    const prevPrefix = prefixValues[i];
    const newPrefix = prevPrefix + currentVal;
    prefixValues[i + 1] = newPrefix;

    addStep(
      4,
      `Visit nums[${i}] = ${currentVal}`,
      `So far our running total is ${prevPrefix}. Now we bring in ${currentVal} so the total covers everything up through index ${i}.`,
      { i, "nums[i]": currentVal, "prefix[i]": prevPrefix },
    );

    addStep(
      5,
      `Set prefix[${i + 1}] = ${newPrefix}`,
      `We add ${currentVal} to the previous total ${prevPrefix} and get ${newPrefix} — the sum of everything from index 0 through ${i}, banked for instant reuse later.`,
      { i, "prefix[i]": prevPrefix, "nums[i]": currentVal, "prefix[i+1]": newPrefix },
    );

    elements[i].state = "visited";
    elements[i].pointers = undefined;
  }

  addStep(
    6,
    "Finish the prefix array",
    `Our finished ladder of totals is [${prefixValues.join(", ")}]. From here, the sum of any range L..R is just prefix[R+1] minus prefix[L] — one subtraction, constant time.`,
    { result: prefixValues.join(", ") },
  );

  return steps;
};

const PREFIX_SUM_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares the function: given nums, build a table of running totals one entry longer than the input.",
    2: "Caches the length of nums in n, used to size the prefix array and bound the loop below.",
    3: "Allocates a prefix array of n + 1 zeros; the extra leading slot represents the sum of zero elements, so a range starting at index 0 needs no special case.",
    4: "Walks every index of nums once, building each new prefix entry from the one immediately before it.",
    5: "Defines prefix[i + 1] as prefix[i] plus nums[i] — the running total absorbs one more element per step, costing a single addition.",
    6: "Returns the completed table, from which the sum of any range is now a single subtraction rather than a loop.",
  },
};

export const prefixSum: AlgorithmDefinition<PrefixSumInput> = {
  id: "prefix-sum",
  title: "Prefix Sum",
  category: "arrays_and_hashing",
  difficulty: "Easy",
  description:
    "Computes cumulative prefix sums for an array. Given an array nums of N integers, construct a prefix sum array prefix of size N + 1 where prefix[i] stores the sum of elements from nums[0] to nums[i-1].\n\nUsing this prefix array, compute any sub-array range sum from index L to R inclusive in O(1) time using the formula: sum(L..R) = prefix[R + 1] - prefix[L].\n\n### Input Parameters\n- nums (list[int]): An array of integers.\n\n### Output\n- list[int]: An array prefix of size len(nums) + 1 where prefix[0] = 0 and prefix[i+1] = prefix[i] + nums[i].\n\n### Edge Cases & Constraints\n- Empty range sum (L > R): Evaluates to 0.\n- Full array range sum (0..N-1): prefix[N] - prefix[0] = prefix[N].\n- Negative values: Handled seamlessly via standard addition/subtraction.",
  constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nums = [1, 2, 3, 4, 5]",
      outputDisplay: "[1, 3, 6, 10, 15]",
      title: "Basic Example",
      input: { nums: [2, 4, 1, 3, 5] },
      output: "[0, 2, 6, 7, 10, 15]",
      explanation: "Computes prefix sums incrementally where prefix[i+1] = prefix[i] + nums[i].",
    },
    {
      kind: "complex",
      inputDisplay: "nums = [10, -5, 20, -10, 30]",
      outputDisplay: "[10, 5, 25, 15, 45]",
      title: "Complex Edge Case",
      input: { nums: [-3, 5, -2, 0, 7, -4] },
      output: "[0, -3, 2, 0, 0, 7, 3]",
      explanation:
        "Handles negative numbers and zeros, correctly updating prefix sums across signs.",
    },
    {
      kind: "negative",
      inputDisplay: "nums = [-3, -7, -2, -8]",
      outputDisplay: "[-3, -10, -12, -20]",
      title: "Failing / Boundary Case",
      input: { nums: [0] },
      output: "[0, 0]",
      explanation: "Single zero element yields a minimal 2-element prefix array [0, 0].",
    },
  ],
  code: PREFIX_SUM_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "We fill the prefix array in one pass over the input: each new entry is just the previous entry plus one array value, a single addition. With n elements that's n constant-time updates, so the work grows linearly — O(n). Best and worst case are identical because we always touch every element exactly once.",
    space:
      "We allocate one extra array of n + 1 running totals alongside the input, so extra memory grows linearly with the input size — O(n).",
  },
  topicGuide: {
    overview:
      "Prefix Sum is a foundational precomputation technique that converts O(N) range sum queries into O(1) scalar subtractions. In production software engineering, prefix sums power 2D integral images in computer vision (Box Blurs, Viola-Jones face detection), causal mask cumulative sequence lengths in LLM serving (FlashAttention, vLLM continuous batching), and cumulative distribution function (CDF) sampling in Monte Carlo simulations.",
    sections: [
      {
        heading: "Core Concept & Mathematical Principle",
        body: "The core formula prefix[i] = sum_{j=0}^{i-1} nums[j] creates a monotonic or cumulative sequence. The sum of elements between 0-indexed bounds L and R inclusive is computed in O(1) time as prefix[R + 1] - prefix[L].",
      },
      {
        heading: "Systems & Performance Impact: LLM KV-Cache & Image Processing",
        body: "In LLM inference engines like vLLM and TensorRT-LLM, prefix sums calculate total sequence lengths across batched inputs to dynamically allocate GPU memory for KV-caches. In computer vision, 2D Summed-Area Tables (Integral Images) compute box filter convolutions over arbitrary rectangular regions in O(1) operations.",
      },
      {
        heading: "Implementation Nuances & 1-Based Offset Sentinel",
        body: "Allocating the prefix array with size N + 1 and setting prefix[0] = 0 provides a sentinel value. This eliminates special-case branching when querying ranges starting at index 0 (L = 0), avoiding off-by-one errors.",
      },
      {
        heading: "Edge Case & Boundary Analysis",
        body: "For N=0 or N=1, the sentinel prefix[0] = 0 prevents out-of-bound memory reads. With large integers, prefix sums can overflow 32-bit signed integer storage, requiring 64-bit wide buffers (int64_t).",
      },
    ],
    keyTerms: [
      {
        term: "Precomputation",
        definition:
          "Performing upfront calculation to store results, enabling subsequent queries to execute in O(1) time.",
      },
      {
        term: "Integral Image / Summed-Area Table",
        definition:
          "A 2D generalization of prefix sums used in image processing to compute sub-grid sums in constant time.",
      },
      {
        term: "Sentinel Value",
        definition:
          "A dummy value (such as prefix[0] = 0) placed at the beginning of a data structure to simplify boundary conditions.",
      },
    ],
  },
  categories: ["arrays_and_hashing"],
  trivia: PREFIX_SUM_TRIVIA,
  leetcode: {
    id: 303,
    url: "https://leetcode.com/problems/range-sum-query-immutable/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #303",
      leetcodeId: 303,
      url: "https://leetcode.com/problems/range-sum-query-immutable/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 9",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 9,
      section: "9.1 Static array queries",
    },
  ],
  defaultInput: DEFAULT_PREFIX_SUM_INPUT,
  generateSteps: generatePrefixSumSteps,
};
