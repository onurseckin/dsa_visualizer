import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "A subsequence is formed by deleting zero or more elements from an array without changing the relative order of the remaining elements; LIS seeks the maximum length of a strictly increasing subsequence.",
    primarySnapshot: {
      kind: "composite",
      layout: "vertical",
      heading: "Subsequence vs Subarray",
      items: [
        {
          id: "nums-array",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: [
              { id: "e1", value: 10, label: "[0]", state: "default" },
              { id: "e2", value: 9, label: "[1]", state: "default" },
              { id: "e3", value: 2, label: "[2]", state: "active" },
              { id: "e4", value: 5, label: "[3]", state: "default" },
              { id: "e5", value: 3, label: "[4]", state: "active" },
              { id: "e6", value: 7, label: "[5]", state: "active" },
            ],
          },
        },
        {
          id: "sub-display",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "subsequence",
            mode: "box",
            elements: [
              { id: "s1", value: 2, label: "[0]", state: "sorted" },
              { id: "s2", value: 3, label: "[1]", state: "sorted" },
              { id: "s3", value: 7, label: "[2]", state: "sorted" },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "Strict monotonicity requires each element in the subsequence to be strictly greater than its predecessor (nums[i] > nums[j]); duplicate values or equal elements cannot extend the sequence.",
    primarySnapshot: {
      kind: "array",
      name: "comparison",
      mode: "box",
      elements: [
        { id: "c1", value: 5, label: "j", state: "compare" },
        { id: "c2", value: 5, label: "i (equal)", state: "compare" },
        { id: "c3", value: "Invalid", label: "Strict > required", state: "default" },
      ],
    },
  },
  {
    narrative:
      "A brute-force check generates all 2^N possible subsequences, which causes exponential time complexity O(2^N) and quickly becomes intractable for larger inputs.",
    primarySnapshot: {
      kind: "array",
      name: "complexity",
      mode: "box",
      elements: [
        { id: "b1", value: "Subsequences: 2^N", state: "compare" },
        { id: "b2", value: "Brute Force: O(2^N)", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Dynamic programming optimizes this by defining dp[i] as the length of the longest strictly increasing subsequence that ends exactly at index i.",
    primarySnapshot: {
      kind: "composite",
      layout: "vertical",
      heading: "DP State Definition",
      items: [
        {
          id: "nums-array",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "nums",
            mode: "box",
            elements: Array.from({ length: 6 }, (_, idx) => ({
              id: `n-${idx}`,
              value: [10, 9, 2, 5, 3, 7][idx],
              label: `[${idx}]`,
              state: idx === 5 ? "active" : "default",
            })),
          },
        },
        {
          id: "dp-array",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "dp",
            mode: "box",
            elements: Array.from({ length: 6 }, (_, idx) => ({
              id: `d-${idx}`,
              value: idx === 5 ? "dp[5] = 3" : "?",
              label: `[${idx}]`,
              state: idx === 5 ? "sorted" : "default",
            })),
          },
        },
      ],
    },
  },
  {
    narrative:
      "Every single element by itself forms a valid increasing subsequence of length 1, so we initialize all dp[i] = 1 for all 0 <= i < N.",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: Array.from({ length: 6 }, (_, idx) => ({
        id: `init-${idx}`,
        value: 1,
        label: `[${idx}]`,
        state: "default",
      })),
    },
  },
  {
    narrative:
      "For each index i from 1 to N - 1, we inspect all preceding indices j < i to test if nums[i] can append after nums[j].",
    primarySnapshot: {
      kind: "array",
      name: "nums",
      mode: "box",
      elements: [
        { id: "p1", value: 2, label: "j", state: "compare" },
        { id: "p2", value: 5, label: "j", state: "compare" },
        { id: "p3", value: 7, label: "i (target)", state: "active" },
      ],
    },
  },
  {
    narrative:
      "If nums[i] > nums[j], index i can extend the LIS ending at j, giving recurrence dp[i] = max(dp[i], dp[j] + 1).",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: [
        { id: "r1", value: "dp[j]", label: "[j]", state: "compare" },
        { id: "r2", value: "dp[i] = max(dp[i], dp[j]+1)", label: "[i]", state: "active" },
      ],
    },
  },
  {
    narrative:
      "After populating the entire DP array, the overall answer is max(dp) across all ending indices i.",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: Array.from({ length: 6 }, (_, idx) => ({
        id: `final-${idx}`,
        value: [1, 1, 1, 2, 2, 3][idx],
        label: `[${idx}]`,
        state: idx === 5 ? "sorted" : "default",
        pointers: idx === 5 ? ["max = 3"] : undefined,
      })),
    },
  },
  {
    narrative:
      "Standard DP solves LIS in O(N^2) time and O(N) space; advanced patience sorting with binary search can further optimize runtime to O(N log N).",
    primarySnapshot: {
      kind: "array",
      name: "summary",
      mode: "box",
      elements: [
        { id: "s1", value: "DP Tabulation: O(N^2)", state: "default" },
        { id: "s2", value: "Patience Search: O(N log N)", state: "sorted" },
      ],
    },
  },
];

export const generateLisSteps = (input: LongestIncreasingSubsequenceInput): AlgorithmStep[] => {
  const nums = input?.nums ? [...input.nums] : DEFAULT_LIS_INPUT.nums;
  const n = nums.length;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input?.nums) &&
      input.nums.length === DEFAULT_LIS_INPUT.nums.length &&
      input.nums.every((val, idx) => val === DEFAULT_LIS_INPUT.nums[idx]));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  if (n === 0) {
    addStep(
      "The input array is empty, so we immediately return length 0 without computing DP transitions.",
      {
        kind: "array",
        name: "nums",
        mode: "box",
        elements: [],
      },
    );
    return steps;
  }

  const dp = new Array<number>(n).fill(1);

  const makeSnapshot = (
    currentI: number,
    currentJ?: number,
    highlightMax = false,
  ): PrimaryVisualSnapshot => ({
    kind: "composite",
    layout: "vertical",
    heading: `LIS Evaluation (Index i = ${currentI})`,
    items: [
      {
        id: "nums-array",
        role: "auxiliary",
        snapshot: {
          kind: "array",
          name: "nums",
          mode: "box",
          elements: nums.map((val, idx) => ({
            id: `num-${idx}`,
            value: val,
            label: `[${idx}]`,
            state:
              idx === currentI
                ? "active"
                : currentJ !== undefined && idx === currentJ
                  ? "compare"
                  : idx < currentI
                    ? "visited"
                    : "default",
            pointers:
              idx === currentI
                ? [`i`]
                : currentJ !== undefined && idx === currentJ
                  ? [`j`]
                  : undefined,
          })),
        },
      },
      {
        id: "dp-array",
        role: "primary",
        snapshot: {
          kind: "array",
          name: "dp",
          mode: "box",
          elements: dp.map((v, idx) => ({
            id: `dp-${idx}`,
            value: v,
            label: `[${idx}]`,
            state:
              highlightMax && v === Math.max(...dp)
                ? "sorted"
                : idx === currentI
                  ? "active"
                  : currentJ !== undefined && idx === currentJ
                    ? "compare"
                    : idx < currentI
                      ? "visited"
                      : "default",
            pointers:
              highlightMax && v === Math.max(...dp)
                ? [`max = ${v}`]
                : idx === currentI
                  ? [`dp[${idx}] = ${v}`]
                  : undefined,
          })),
        },
      },
    ],
  });

  addStep(
    `We initialize the DP table of size ${n} with 1 for all elements, because each individual element nums[i] constitutes a valid strictly increasing subsequence of length 1.`,
    makeSnapshot(0),
  );

  for (let i = 1; i < n; i++) {
    addStep(
      `Evaluating target index i = ${i} (nums[${i}] = ${nums[i]}); we will inspect all preceding indices j from 0 to ${i - 1} to determine if nums[${i}] can extend their LIS.`,
      makeSnapshot(i),
    );

    for (let j = 0; j < i; j++) {
      const isIncreasing = nums[i] > nums[j];
      if (isIncreasing) {
        const prevVal = dp[i];
        dp[i] = Math.max(dp[i], dp[j] + 1);
        addStep(
          `Inspecting predecessor j = ${j} (nums[${j}] = ${nums[j]}): since ${nums[i]} > ${nums[j]}, element nums[${i}] can extend the LIS ending at j. Updating dp[${i}] = max(${prevVal}, dp[${j}] + 1) = ${dp[i]}.`,
          makeSnapshot(i, j),
        );
      } else {
        addStep(
          `Inspecting predecessor j = ${j} (nums[${j}] = ${nums[j]}): since ${nums[i]} <= ${nums[j]}, strict monotonicity is violated so nums[${i}] cannot extend the LIS ending at j.`,
          makeSnapshot(i, j),
        );
      }
    }
  }

  const maxLis = Math.max(...dp);
  addStep(
    `Completed LIS computation across all indices: max(dp) = ${maxLis}. The length of the longest strictly increasing subsequence in nums is ${maxLis}.`,
    makeSnapshot(n - 1, undefined, true),
  );

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
      "<p>Given an integer array <code>nums</code>, return the length of the longest strictly increasing subsequence. A subsequence is a sequence derived by deleting zero or more elements without changing the relative order of the remaining elements.</p><p><strong>Input:</strong> An array of integers <code>nums</code>.</p><p><strong>Output:</strong> The length of the longest strictly increasing subsequence in <code>nums</code>.</p>",
    constraints: [
      "1 <= nums.length <= 2500",
      "-10^4 <= nums[i] <= 10^4",
      "Array may contain duplicate values",
    ],
    examples: [
      {
        kind: "basic",
        scenario: "standard",
        inputDisplay: "nums = [10, 9, 2, 5, 3, 7, 101, 18]",
        outputDisplay: "4",
        title: "Standard Case",
        input: { nums: [10, 9, 2, 5, 3, 7, 101, 18] },
        output: "4",
        explanation: "The longest strictly increasing subsequence is [2, 3, 7, 101] with length 4.",
      },
      {
        kind: "complex",
        scenario: "adversarial",
        inputDisplay: "nums = [0, 1, 0, 3, 2, 3]",
        outputDisplay: "4",
        title: "Adversarial Non-Monotonic Order",
        input: { nums: [0, 1, 0, 3, 2, 3] },
        output: "4",
        explanation: "The longest strictly increasing subsequence is [0, 1, 2, 3] with length 4.",
      },
      {
        kind: "negative",
        scenario: "boundary",
        inputDisplay: "nums = [7, 7, 7, 7, 7]",
        outputDisplay: "1",
        title: "Identical Elements Boundary",
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
      time: "Nested loops compare every pair of indices (i, j) where j < i, performing N*(N-1)/2 iterations, yielding O(N^2) time.",
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
        chapter: 7,
        label: "Competitive Programmer's Handbook, Ch 7",
      },
    ],
    defaultInput: DEFAULT_LIS_INPUT,
    generateSteps: generateLisSteps,
  };
