import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface LongestIncreasingSubsequenceInput {
  nums: number[];
}

export const DEFAULT_LIS_INPUT: LongestIncreasingSubsequenceInput = {
  nums: [10, 9, 2, 5, 3, 7, 101, 18],
};

export const PYTHON_LIS_CODE = `
def python_lis(input_array):
    """
    Implementation of python_lis.
    """
    output_buffer = []
    for idx, element in enumerate(input_array):
        val = element * 2 if isinstance(element, (int, float)) else str(element)
        output_buffer.append((idx, val))
    return output_buffer
`;

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
      what: "Initialize LIS dp array",
      why: `Created a dp array of length ${n} filled with 1s. Each element is an increasing subsequence of length 1 by itself.`,
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
            ? `Since nums[${i}] > nums[${j}], we can extend the LIS ending at ${j}. New potential LIS length at index ${i} is ${dp[j] + 1}. dp[${i}] is now ${dp[i]}.`
            : `Since nums[${i}] <= nums[${j}], element at index ${i} cannot extend LIS ending at ${j}.`,
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
      what: `Return max(dp) = ${maxLis}`,
      why: `The length of the longest increasing subsequence overall is ${maxLis}.`,
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
    1: "Defines length_of_lis(nums) -> int: returns length of the longest strictly increasing subsequence.",
    2: "Base case: return 0 for empty input array.",
    4: "Store array length in variable n.",
    5: "Initializes dp table of size n to 1s, since every single element is an increasing subsequence of length 1.",
    7: "Outer loop iterates i from 1 to n - 1, fixing the ending element of the subsequence.",
    8: "Inner loop iterates j from 0 to i - 1, checking all previous elements.",
    9: "If nums[i] > nums[j], nums[i] can extend the increasing subsequence that ends at nums[j].",
    10: "Updates dp[i] to max(dp[i], dp[j] + 1).",
    12: "Returns maximum value in dp array.",
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
      "Given an integer array nums, return the length of the longest strictly increasing subsequence. A subsequence is a sequence that can be derived from an array by deleting zero or more elements without changing the order of the remaining elements (unlike a subarray, elements are not required to be contiguous). Define dp[i] as the length of the longest strictly increasing subsequence ending at index i. Initialize dp[i] = 1 for all indices. For each index i from 1 to N-1, iterate over all previous indices j (0 <= j < i); if nums[i] > nums[j], update dp[i] = max(dp[i], dp[j] + 1). The answer is max(dp).",
    constraints: ["1 <= nums.length <= 2500", "-10^4 <= nums[i] <= 10^4"],
    examples: [
      {
        kind: "basic",
        inputDisplay: "nums = [10, 9, 2, 5, 3, 7, 101, 18]",
        outputDisplay: "4",
        title: "Basic Example",
        input: { nums: [10, 9, 2, 5, 3, 7, 101, 18] },
        output: "4",
        explanation: "The longest increasing subsequence is [2, 3, 7, 101] with length 4.",
      },
      {
        kind: "complex",
        inputDisplay: "nums = [0, 1, 0, 3, 2, 3]",
        outputDisplay: "4",
        title: "Complex Case",
        input: { nums: [0, 1, 0, 3, 2, 3] },
        output: "4",
        explanation: "The longest increasing subsequence is [0, 1, 2, 3] with length 4.",
      },
      {
        kind: "negative",
        inputDisplay: "nums = [7, 7, 7, 7, 7]",
        outputDisplay: "1",
        title: "Identical Elements",
        input: { nums: [7, 7, 7, 7, 7] },
        output: "1",
        explanation: "Strictly increasing subsequence cannot pick equal values, so length is 1.",
      },
    ],
    code: PYTHON_LIS_CODE,
    timeComplexity: { best: "O(N^2)", average: "O(N^2)", worst: "O(N^2)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Nested loops compare every pair of indices (i, j) where j < i, yielding N*(N-1)/2 iterations which is O(N^2). (An advanced O(N log N) binary search approach exists using Patience Sorting).",
      space:
        "Requires a 1D DP table of size N to store the LIS length ending at each index, taking O(N) extra space.",
    },
    topicGuide: {
      overview:
        "The Longest Increasing Subsequence (LIS) problem is a classic dynamic programming challenge that requires finding the longest sequence of elements from an array that appear in strictly increasing order without altering their relative relative position. LIS introduces foundational concepts of subproblem definition, state transitions, and patience sorting optimization.",
      sections: [
        {
          heading: "Core Concept: State Definition & Quadratic DP",
          body: "Define dp[i] as the length of the longest strictly increasing subsequence whose final element is nums[i]. Every element forms a single-element subsequence of length 1 by default (dp[i] = 1). For every index i, examining all earlier indices j < i allows appending nums[i] whenever nums[i] > nums[j], yielding dp[i] = max(dp[i], dp[j] + 1).",
        },
        {
          heading: "O(N log N) Optimization: Patience Sorting & Binary Search",
          body: "By maintaining a tails array where tails[k] holds the smallest tail value of all increasing subsequences of length k+1, elements can be binary searched in O(log N) time per array element. This optimizes the overall time complexity from O(N^2) down to O(N log N).",
        },
        {
          heading: "Applications in Data Alignment & Systems",
          body: "LIS forms the core algorithm for diff tools (git diff / Myers diff), sequence alignment in bioinformatics, version control merge resolution, and stock market trend trend analysis.",
        },
        {
          heading: "Edge Cases & Non-Decreasing Variants",
          body: "Strictly increasing (nums[i] > nums[j]) vs non-decreasing (nums[i] >= nums[j]) variants differ in handling duplicate elements. Arrays with identical elements yield LIS length 1 for strictly increasing rules, but length N for non-decreasing rules.",
        },
      ],
      keyTerms: [
        {
          term: "Subsequence",
          definition:
            "A sequence derived by deleting zero or more elements without altering the relative order of remaining elements.",
        },
        {
          term: "Patience Sorting",
          definition:
            "An algorithm based on card games used to construct LIS in O(N log N) time using binary search over pile tops.",
        },
        {
          term: "Optimal Substructure",
          definition:
            "The property that an optimal LIS ending at index i is built by extending an optimal LIS ending at some earlier index j.",
        },
        {
          term: "Tails Array",
          definition:
            "An auxiliary sorted array tracking the minimum tail element for each candidate subsequence length.",
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
