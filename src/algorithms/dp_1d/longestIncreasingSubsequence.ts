import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface LongestIncreasingSubsequenceInput {
  nums: number[];
}

export const DEFAULT_LIS_INPUT: LongestIncreasingSubsequenceInput = {
  nums: [10, 9, 2, 5, 3, 7, 101, 18],
};

export const PYTHON_LIS_CODE = `def length_of_lis(nums: list[int]) -> int:
    if not nums:
        return 0
    n = len(nums)
    dp = [1] * n

    for i in range(1, n):
        for j in range(i):
            if nums[i] > nums[j]:
                dp[i] = max(dp[i], dp[j] + 1)

    return max(dp)`;

export const generateLisSteps = (input: LongestIncreasingSubsequenceInput): AlgorithmStep[] => {
  const nums = input?.nums && input.nums.length > 0 ? [...input.nums] : DEFAULT_LIS_INPUT.nums;
  const n = nums.length;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const dp = new Array<number>(n).fill(1);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Initialize DP table of size ${n} with 1s`,
      why: `dp[i] stores the length of the longest strictly increasing subsequence ending at index i. Initially 1 for all elements, as every element alone forms a valid subsequence of length 1.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: dp.map((v, idx) => ({
        id: `dp-${idx}`,
        value: v,
        state: "default",
        pointers: [`nums[${idx}] = ${nums[idx]}`],
      })),
    },
    auxiliaryState: {
      customState: { nums: nums.join(", ") },
    },
    variables: { n, "max(dp)": 1 },
  });

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      const isIncreasing = nums[i] > nums[j];
      if (isIncreasing) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 10,
        explanation: {
          what: `Compare nums[${j}] (${nums[j]}) with nums[${i}] (${nums[i]})`,
          why: isIncreasing
            ? `Since nums[${i}] (${nums[i]}) > nums[${j}] (${nums[j]}), we can extend the LIS ending at ${j}. Candidate length is dp[${j}] + 1 = ${dp[j] + 1}. Updated dp[${i}] = ${dp[i]}.`
            : `Since nums[${i}] (${nums[i]}) <= nums[${j}] (${nums[j]}), element at index ${i} cannot extend LIS ending at ${j}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: dp.map((v, idx) => ({
            id: `dp-${idx}`,
            value: v,
            state: idx === i ? "active" : idx === j ? "compare" : idx < i ? "visited" : "default",
            pointers: idx === i ? [`i: ${nums[i]}`] : idx === j ? [`j: ${nums[j]}`] : undefined,
          })),
        },
        auxiliaryState: {
          customState: {
            i,
            j,
            "nums[i]": nums[i],
            "nums[j]": nums[j],
            isIncreasing: isIncreasing ? "true" : "false",
          },
        },
        variables: { i, j, "dp[i]": dp[i], "dp[j]": dp[j] },
      });
    }
  }

  const maxLis = Math.max(...dp);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 12,
    explanation: {
      what: `Final result max(dp) = ${maxLis}`,
      why: `The length of the overall longest strictly increasing subsequence in the array is ${maxLis}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: dp.map((v, idx) => ({
        id: `dp-${idx}`,
        value: v,
        state: v === maxLis ? "sorted" : "default",
        pointers: v === maxLis ? [`max: ${v}`] : undefined,
      })),
    },
    auxiliaryState: {
      customState: { maxLis },
    },
    variables: { result: maxLis },
  });

  return steps;
};

const LIS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines length_of_lis(nums) -> int: returns the length of the longest strictly increasing subsequence.",
    2: "Base case guard: returns 0 immediately if input array nums is empty.",
    3: "Returns 0 for empty array.",
    4: "Stores total length n of input array.",
    5: "Initializes DP array dp of size n filled with 1s (each element is an LIS of length 1 by itself).",
    7: "Outer loop sweeps index i from 1 to n - 1, fixing the ending element of the candidate subsequence.",
    8: "Inner loop sweeps index j from 0 to i - 1, examining all preceding elements.",
    9: "Checks condition nums[i] > nums[j] to ensure strict monotonically increasing order.",
    10: "Updates dp[i] = max(dp[i], dp[j] + 1) using optimal substructure.",
    12: "Returns max(dp), the maximum value found across all DP array entries.",
  },
};

export const longestIncreasingSubsequence: AlgorithmDefinition<LongestIncreasingSubsequenceInput> =
  {
    id: "longest-increasing-subsequence",
    title: "Longest Increasing Subsequence (LIS)",
    category: "dp_1d",
    categories: ["dp_1d"],
    difficulty: "Medium",
    description:
      "Given an integer array nums, return the length of the longest strictly increasing subsequence. A subsequence is a sequence that can be derived from an array by deleting zero or more elements without changing the order of the remaining elements (unlike a subarray, elements are not required to be contiguous). Define dp[i] as the length of the longest strictly increasing subsequence ending at index i. Initialize dp[i] = 1 for all indices. For each index i from 1 to N-1, iterate over all previous indices j (0 <= j < i); if nums[i] > nums[j], update dp[i] = max(dp[i], dp[j] + 1). The final answer is max(dp).",
    constraints: [
      "1 <= nums.length <= 2500",
      "-10^4 <= nums[i] <= 10^4",
      "Array may contain duplicate values",
    ],
    examples: [
      {
        kind: "basic",
        inputDisplay: "nums = [10, 9, 2, 5, 3, 7, 101, 18]",
        outputDisplay: "4",
        title: "Basic Example",
        input: { nums: [10, 9, 2, 5, 3, 7, 101, 18] },
        output: "4",
        explanation: "The longest strictly increasing subsequence is [2, 3, 7, 101] with length 4.",
      },
      {
        kind: "complex",
        inputDisplay: "nums = [0, 1, 0, 3, 2, 3]",
        outputDisplay: "4",
        title: "Complex Case",
        input: { nums: [0, 1, 0, 3, 2, 3] },
        output: "4",
        explanation: "The longest strictly increasing subsequence is [0, 1, 2, 3] with length 4.",
      },
      {
        kind: "negative",
        inputDisplay: "nums = [7, 7, 7, 7, 7]",
        outputDisplay: "1",
        title: "Identical Elements",
        input: { nums: [7, 7, 7, 7, 7] },
        output: "1",
        explanation:
          "Strictly increasing order requires strict inequality (nums[i] > nums[j]), so duplicate values cannot extend LIS, returning 1.",
      },
    ],
    code: PYTHON_LIS_CODE,
    timeComplexity: { best: "O(N^2)", average: "O(N^2)", worst: "O(N^2)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Nested loops compare every pair of indices (i, j) where j < i, performing N*(N-1)/2 iterations, yielding O(N^2) time. (An O(N log N) patience sorting algorithm with binary search also exists).",
      space:
        "Requires a 1D DP table of size N to store the LIS length ending at each index, taking O(N) auxiliary space.",
    },
    topicGuide: {
      overview:
        "The Longest Increasing Subsequence (LIS) problem (LeetCode #300) is a fundamental problem in sequence alignment and dynamic programming. Given an array of integers, the goal is to find the maximum length of a subsequence in which all elements appear in strictly ascending numerical order. Subsequences differ from contiguous subarrays in that elements can be skipped. The standard O(N^2) DP approach defines dp[i] as the LIS length ending at index i, evaluating all predecessors j < i. An advanced O(N log N) solution uses patience sorting combined with binary search (bisect_left) over candidate tail values.",
      sections: [
        {
          heading: "Core Concept: State Definition & Recurrence",
          body: "Define dp[i] as the length of the longest strictly increasing subsequence whose final element is nums[i]. Every element forms a single-element subsequence of length 1 by default (dp[i] = 1). For each index i, examining all earlier indices j < i allows appending nums[i] whenever nums[i] > nums[j], giving recurrence dp[i] = max(dp[i], dp[j] + 1). The overall answer is max_{0 <= i < N}(dp[i]).",
        },
        {
          heading: "O(N log N) Optimization: Patience Sorting & Binary Search",
          body: "By maintaining an array tails where tails[k] stores the smallest tail value among all strictly increasing subsequences of length k+1, elements can be binary searched in O(log N) time. For each number x, if x is larger than all elements in tails, append x; otherwise, overwrite the smallest element in tails that is >= x. The length of tails equals the LIS length.",
        },
        {
          heading: "Systems Applications: Version Control Diffing & DNA Alignment",
          body: "LIS concepts underpin critical systems software: git diff and Myers diff algorithms compute longest common subsequences (LCS) by mapping to LIS models. In bioinformatics, LIS aligns genomic DNA sequences. In database query optimizers, LIS ranks index scan candidates.",
        },
        {
          heading: "Edge Case Analysis & Non-Decreasing Variants",
          body: "Strictly increasing (nums[i] > nums[j]) vs non-decreasing (nums[i] >= nums[j]) variants differ in duplicate handling. For identical elements like [7, 7, 7], strictly increasing order returns length 1, whereas non-decreasing order returns length N. Reconstructing the actual LIS sequence requires a parent array tracking predecessor pointers.",
        },
      ],
      keyTerms: [
        {
          term: "Subsequence",
          definition:
            "A sequence derived by deleting zero or more elements from an array without changing the relative order of remaining elements.",
        },
        {
          term: "Patience Sorting",
          definition:
            "A card game sorting algorithm that constructs LIS in O(N log N) time by maintaining pile tops with binary search.",
        },
        {
          term: "Optimal Substructure",
          definition:
            "The property that an optimal LIS ending at index i is built by extending an optimal LIS ending at some earlier index j.",
        },
        {
          term: "Tails Array",
          definition:
            "An auxiliary sorted array tracking the minimum tail element for each candidate subsequence length in O(N log N) LIS.",
        },
      ],
    },
    trivia: LIS_TRIVIA,
    sources: [
      {
        type: "book",
        kind: "book",
        bookTitle: "Competitive Programmer's Handbook",
        chapter: "Ch 7",
        label: "Competitive Programmer's Handbook, Ch 7",
      },
    ],
    defaultInput: DEFAULT_LIS_INPUT,
    generateSteps: generateLisSteps,
  };
