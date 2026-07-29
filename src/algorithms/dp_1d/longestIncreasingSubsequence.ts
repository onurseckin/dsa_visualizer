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
  const nums = input?.nums ? [...input.nums] : DEFAULT_LIS_INPUT.nums;
  const n = nums.length;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // Line 1: Function entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Start length_of_lis(nums=[${nums.join(", ")}])`,
      why: "The goal is to find the length of the longest strictly increasing subsequence in nums.",
    },
    primarySnapshot: {
      kind: "array",
      elements: nums.map((val, idx) => ({
        id: `dp-${idx}`,
        value: "?",
        state: "default" as const,
        pointers: [`nums[${idx}] = ${val}`],
      })),
    },
    auxiliaryState: {
      customState: { nums: nums.join(", "), n },
    },
    variables: { n },
  });

  // Line 2: Empty check
  if (n === 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 2,
      explanation: {
        what: "Check condition 'if not nums:' -> True",
        why: "The input array is empty, so the guard condition evaluates to True.",
      },
      primarySnapshot: {
        kind: "array",
        elements: [],
      },
      auxiliaryState: {
        customState: { isEmpty: true, n: 0 },
      },
      variables: { n: 0 },
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 3,
      explanation: {
        what: "Return 0",
        why: "An empty array has no increasing subsequence, so return length 0 immediately.",
      },
      primarySnapshot: {
        kind: "array",
        elements: [],
      },
      auxiliaryState: {
        customState: { result: 0 },
      },
      variables: { result: 0 },
    });

    return steps;
  }

  // Non-empty input branch
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Check condition 'if not nums:' -> False",
      why: `nums contains ${n} element${n > 1 ? "s" : ""}, so we skip early return and proceed to calculate length.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: nums.map((val, idx) => ({
        id: `dp-${idx}`,
        value: "?",
        state: "default" as const,
        pointers: [`nums[${idx}] = ${val}`],
      })),
    },
    auxiliaryState: {
      customState: { nums: nums.join(", "), n },
    },
    variables: { n },
  });

  // Line 4: Store array length
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Store input array length n = ${n}`,
      why: "Determines boundaries for outer and inner iteration loops.",
    },
    primarySnapshot: {
      kind: "array",
      elements: nums.map((val, idx) => ({
        id: `dp-${idx}`,
        value: "?",
        state: "default" as const,
        pointers: [`nums[${idx}] = ${val}`],
      })),
    },
    auxiliaryState: {
      customState: { n },
    },
    variables: { n },
  });

  const dp = new Array<number>(n).fill(1);

  // Line 5: Initialize DP array
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Initialize DP table dp = [1] * ${n}`,
      why: "dp[i] stores the length of the longest strictly increasing subsequence ending at index i. Initially 1 for all elements since a single element is a valid subsequence of length 1.",
    },
    primarySnapshot: {
      kind: "array",
      elements: dp.map((v, idx) => ({
        id: `dp-${idx}`,
        value: v,
        state: "default" as const,
        pointers: [`nums[${idx}] = ${nums[idx]}`],
      })),
    },
    auxiliaryState: {
      customState: { nums: nums.join(", "), dp: `[${dp.join(", ")}]` },
    },
    variables: { n, "max(dp)": 1 },
  });

  for (let i = 1; i < n; i++) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: `Outer loop for i = ${i} (nums[${i}] = ${nums[i]})`,
        why: `Evaluating all preceding elements j < ${i} to determine the longest strictly increasing subsequence ending at index ${i}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: dp.map((v, idx) => ({
          id: `dp-${idx}`,
          value: v,
          state:
            idx === i ? ("active" as const) : idx < i ? ("visited" as const) : ("default" as const),
          pointers: idx === i ? [`i (nums[${i}]=${nums[i]})`] : [`nums[${idx}]=${nums[idx]}`],
        })),
      },
      auxiliaryState: {
        customState: { i, "nums[i]": nums[i], "dp[i]": dp[i] },
      },
      variables: { i, "nums[i]": nums[i], "dp[i]": dp[i] },
    });

    for (let j = 0; j < i; j++) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 8,
        explanation: {
          what: `Inner loop inspecting predecessor j = ${j} (nums[${j}] = ${nums[j]}) for target i = ${i} (nums[${i}] = ${nums[i]})`,
          why: `Comparing preceding element nums[${j}] against target element nums[${i}].`,
        },
        primarySnapshot: {
          kind: "array",
          elements: dp.map((v, idx) => ({
            id: `dp-${idx}`,
            value: v,
            state:
              idx === i
                ? ("active" as const)
                : idx === j
                  ? ("compare" as const)
                  : idx < i
                    ? ("visited" as const)
                    : ("default" as const),
            pointers: idx === i ? [`i (${nums[i]})`] : idx === j ? [`j (${nums[j]})`] : undefined,
          })),
        },
        auxiliaryState: {
          customState: { i, j, "nums[i]": nums[i], "nums[j]": nums[j] },
        },
        variables: { i, j, "nums[i]": nums[i], "nums[j]": nums[j] },
      });

      const isIncreasing = nums[i] > nums[j];
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 9,
        explanation: {
          what: `Evaluate condition nums[${i}] (${nums[i]}) > nums[${j}] (${nums[j]})`,
          why: isIncreasing
            ? `Condition True (${nums[i]} > ${nums[j]}). Element nums[${i}] can extend LIS ending at index ${j}.`
            : `Condition False (${nums[i]} <= ${nums[j]}). Element nums[${i}] cannot extend LIS ending at index ${j}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: dp.map((v, idx) => ({
            id: `dp-${idx}`,
            value: v,
            state:
              idx === i
                ? ("active" as const)
                : idx === j
                  ? ("compare" as const)
                  : idx < i
                    ? ("visited" as const)
                    : ("default" as const),
            pointers: idx === i ? [`i (${nums[i]})`] : idx === j ? [`j (${nums[j]})`] : undefined,
          })),
        },
        auxiliaryState: {
          customState: { i, j, isIncreasing: isIncreasing ? "true" : "false" },
        },
        variables: { i, j, isIncreasing },
      });

      if (isIncreasing) {
        const prevDpI = dp[i];
        dp[i] = Math.max(dp[i], dp[j] + 1);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 10,
          explanation: {
            what: `Update dp[${i}] = max(dp[${i}], dp[${j}] + 1) -> max(${prevDpI}, ${dp[j]} + 1 = ${dp[j] + 1}) = ${dp[i]}`,
            why: `Extending LIS ending at j (${j}) of length ${dp[j]} yields candidate length ${dp[j] + 1} for index ${i}.`,
          },
          primarySnapshot: {
            kind: "array",
            elements: dp.map((v, idx) => ({
              id: `dp-${idx}`,
              value: v,
              state:
                idx === i
                  ? ("active" as const)
                  : idx === j
                    ? ("compare" as const)
                    : idx < i
                      ? ("visited" as const)
                      : ("default" as const),
              pointers:
                idx === i ? [`dp[${i}]=${dp[i]}`] : idx === j ? [`dp[${j}]=${dp[j]}`] : undefined,
            })),
          },
          auxiliaryState: {
            customState: {
              i,
              j,
              "dp[i]": dp[i],
              "dp[j]": dp[j],
            },
          },
          variables: { i, j, "dp[i]": dp[i], "dp[j]": dp[j] },
        });
      }
    }
  }

  const maxLis = Math.max(...dp);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 12,
    explanation: {
      what: `Return max(dp) = ${maxLis}`,
      why: `The length of the overall longest strictly increasing subsequence across all ending indices is ${maxLis}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: dp.map((v, idx) => ({
        id: `dp-${idx}`,
        value: v,
        state: v === maxLis ? ("sorted" as const) : ("default" as const),
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
    2: "Base case guard: checks if input array nums is empty.",
    3: "Returns 0 for empty array.",
    4: "Stores total length n of input array.",
    5: "Initializes DP array dp of size n filled with 1s (each element is an LIS of length 1 by itself).",
    6: "Blank line separating initialization from subproblem iterations.",
    7: "Outer loop sweeps index i from 1 to n - 1, fixing the ending element of the candidate subsequence.",
    8: "Inner loop sweeps index j from 0 to i - 1, examining all preceding elements.",
    9: "Checks condition nums[i] > nums[j] to ensure strict monotonically increasing order.",
    10: "Updates dp[i] = max(dp[i], dp[j] + 1) using optimal substructure.",
    11: "Blank line separating nested loops from final max reduction.",
    12: "Returns max(dp), the maximum value found across all DP array entries.",
  },
};

export const longestIncreasingSubsequence: AlgorithmDefinition<LongestIncreasingSubsequenceInput> =
  {
    id: "longest-increasing-subsequence",
    title: "Longest Increasing Subsequence (LIS)",
    topicIds: ["dp_1d"],
    difficulty: "Medium",
    description:
      "<p>The <strong>Longest Increasing Subsequence (LIS)</strong> problem (LeetCode #300) asks for the length of the longest subsequence in an array where elements appear in strictly ascending order. Subsequences do not need to be contiguous.</p><p>Let <code>dp[i]</code> represent the length of the longest strictly increasing subsequence that ends at index <code>i</code>. We build the solution using the recurrence: <code>dp[i] = max(1, max(dp[j] + 1))</code> for <code>j &lt; i</code> and <code>nums[i] &gt; nums[j]</code>, with overall result <code>max(dp)</code>.</p>",
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
        "<p>The Longest Increasing Subsequence (LIS) problem is a fundamental challenge in sequence analysis. Given an array of integers <code>nums</code>, we compute the maximum length of a strictly increasing subsequence. Because subproblems depend on all previous elements, 1D dynamic programming evaluates transitions in <code>O(N<sup>2</sup>)</code> time. Patience sorting with binary search optimizes this to <code>O(N log N)</code>.</p>",
      sections: [
        {
          heading: "1. Mathematical Formulation & 1D Recurrence",
          body: "<p>Define <code>dp[i]</code> as the length of the longest strictly increasing subsequence ending at index <code>i</code>.</p><ul><li><strong>Base Case:</strong> <code>dp[i] = 1</code> for all <code>0 &le; i &lt; N</code>.</li><li><strong>State Transition:</strong> <code>dp[i] = max(dp[j] + 1)</code> for <code>j &lt; i</code> and <code>nums[i] &gt; nums[j]</code>.</li><li><strong>Global Result:</strong> <code>LIS = max(dp)</code>.</li></ul>",
        },
        {
          heading: "2. O(N log N) Patience Sorting Optimization",
          body: "<p>Instead of comparing all pairs <code>(i, j)</code>, maintain a dynamic array <code>tails</code> where <code>tails[k]</code> stores the smallest tail value of all increasing subsequences of length <code>k+1</code>.</p><ul><li>Iterate through each element <code>x &isin; nums</code>.</li><li>Binary search to find the smallest index in <code>tails</code> such that <code>tails[idx] &ge; x</code>.</li><li>If index equals <code>tails.length</code>, append <code>x</code>; otherwise update <code>tails[idx] = x</code>.</li></ul><p>At the end, <code>tails.length</code> is the exact LIS length, running in <code>O(N log N)</code> time.</p>",
        },
        {
          heading: "3. Real-World Systems Applications",
          body: "<p>LIS and its variants power critical infrastructure systems:</p><ul><li><strong>Version Control & Diff Engines:</strong> <code>git diff</code> and Myers LCS/LIS algorithm variants for code change tracking.</li><li><strong>Computational Genomics:</strong> DNA/RNA sequence alignment and gene mutation tracking.</li><li><strong>Database Query Planning:</strong> Index selection for multi-column range queries.</li></ul>",
        },
        {
          heading: "4. Common Pitfalls & Edge Cases",
          body: "<p><strong>Strict vs. Non-Strict Order:</strong> Strict inequality (<code>nums[i] &gt; nums[j]</code>) excludes equal elements. For non-decreasing LIS, use <code>&ge;</code>.<br/><strong>Decreasing/Duplicate Arrays:</strong> Input like <code>[7, 7, 7]</code> returns 1.<br/><strong>Empty Input:</strong> Returns 0 immediately.</p>",
        },
      ],
      keyTerms: [
        {
          term: "Subsequence",
          definition:
            "A sequence derived by deleting zero or more elements without changing relative order.",
        },
        {
          term: "Patience Sorting",
          definition:
            "A card-game-inspired algorithm that builds LIS in O(N log N) using binary search.",
        },
        {
          term: "Tails Array",
          definition:
            "An auxiliary array in patience sorting storing the minimal ending element for each subsequence length.",
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
