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
            pointers:
              idx === i ? [`i: ${nums[i]}`] : idx === j ? [`j: ${nums[j]}`] : undefined,
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

export const longestIncreasingSubsequence: AlgorithmDefinition<LongestIncreasingSubsequenceInput> = {
  id: "longest-increasing-subsequence",
  title: "Longest Increasing Subsequence (LIS)",
  category: "dp_1d",
  difficulty: "Medium",
  description:
    "Finds the length of the longest strictly increasing subsequence in an array of numbers using 1D dynamic programming.",
  constraints: ["1 <= nums.length <= 20", "-10^4 <= nums[i] <= 10^4"],
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
    time: "Nested loops compare every pair of indices (i, j) where j < i, yielding N*(N-1)/2 iterations which is O(N^2).",
    space: "Requires a 1D DP table of size N to store the LIS length ending at each index, taking O(N) extra space.",
  },
  topicGuide: {
    overview:
      "Longest Increasing Subsequence (LIS) is a classic 1D dynamic programming problem where dp[i] represents the length of the longest increasing subsequence ending at index i.",
    sections: [
      {
        heading: "State Definition",
        body: "dp[i] stores the length of the longest strictly increasing subsequence that ends exactly at index i.",
      },
      {
        heading: "Transitions",
        body: "For index i, iterate over all j < i. If nums[i] > nums[j], we can append nums[i] to the subsequence ending at j: dp[i] = max(dp[i], dp[j] + 1).",
      },
    ],
    keyTerms: [
      {
        term: "Subsequence",
        definition: "A sequence derived by deleting zero or more elements without changing the order of remaining elements.",
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
