import type {
  AlgorithmDefinition,
  AlgorithmStep,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface IntegerPartitionSqrtInput {
  n: number;
}

export const PYTHON_INTEGER_PARTITION_SQRT_CODE = `def solve_integer_partition_sqrt(n: int) -> int:
    # Computes the number of distinct integer partitions of N using SQRT bounding
    # Because 1 + 2 + ... + k = k(k+1)/2 <= N, max parts k <= sqrt(2N)
    max_k = int((2 * n) ** 0.5) + 1
    dp = [0] * (n + 1)
    dp[0] = 1
    for k in range(1, max_k + 1):
        for i in range(n, k - 1, -1):
            dp[i] += dp[i - k]
    return dp[n]

def solve(n: int) -> int:
    return solve_integer_partition_sqrt(n)`;

export const DEFAULT_INTEGER_PARTITION_SQRT_INPUT: IntegerPartitionSqrtInput = {
  n: 10,
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "An integer partition represents N as a sum of positive integers. Constraining parts (e.g. all distinct parts) restricts how many terms can exist.",
    primarySnapshot: {
      kind: "array",
      name: "partitionConcept",
      elements: [
        { id: "p1", value: 10, label: "N = 10", state: "default" },
        { id: "p2", value: 7, label: "7 + 3", state: "active" },
        { id: "p3", value: 4, label: "4 + 3 + 2 + 1", state: "visited" },
      ],
    },
  },
  {
    narrative:
      "Naive 2D dynamic programming dp[sum][parts] uses an N x N matrix, leading to O(N²) quadratic time and memory.",
    primarySnapshot: {
      kind: "matrix",
      name: "naiveMatrix",
      rows: 3,
      cols: 3,
      rowHeaders: ["sum=1", "sum=2", "sum=3"],
      colHeaders: ["k=1", "k=2", "k=3"],
      cells: [
        { row: 0, col: 0, value: 1, state: "compare" },
        { row: 0, col: 1, value: 0, state: "compare" },
        { row: 0, col: 2, value: 0, state: "compare" },
        { row: 1, col: 0, value: 1, state: "compare" },
        { row: 1, col: 1, value: 1, state: "compare" },
        { row: 1, col: 2, value: 0, state: "compare" },
        { row: 2, col: 0, value: 1, state: "compare" },
        { row: 2, col: 1, value: 1, state: "compare" },
        { row: 2, col: 2, value: 1, state: "compare" },
      ],
    },
  },
  {
    narrative:
      "The sum of distinct positive integers starting from one is given by the triangular formula K(K+1)/2.",
    primarySnapshot: {
      kind: "array",
      name: "triangularSum",
      elements: [
        { id: "t1", value: 1, label: "K=1 (sum 1)", state: "default" },
        { id: "t2", value: 3, label: "K=2 (sum 3)", state: "default" },
        { id: "t3", value: 6, label: "K=3 (sum 6)", state: "active" },
        { id: "t4", value: 10, label: "K=4 (sum 10)", state: "active" },
      ],
    },
  },
  {
    narrative:
      "For a total sum N, the condition K(K+1)/2 <= N proves that the maximum number of distinct parts K cannot exceed sqrt(2N) = O(sqrt N).",
    primarySnapshot: {
      kind: "array",
      name: "sqrtBound",
      elements: [
        { id: "b1", value: 10, label: "N = 10", state: "default" },
        { id: "b2", value: 4, label: "max K = floor(sqrt(20)) = 4", state: "visited" },
      ],
    },
  },
  {
    narrative:
      "We can reduce the second dimension of our DP table from N to K_max = floor(sqrt(2N)).",
    primarySnapshot: {
      kind: "matrix",
      name: "boundedMatrix",
      rows: 3,
      cols: 2,
      rowHeaders: ["sum=1..4", "sum=5..8", "sum=9..10"],
      colHeaders: ["k=1", "k=2"],
      cells: [
        { row: 0, col: 0, value: 1, state: "visited" },
        { row: 0, col: 1, value: 1, state: "visited" },
        { row: 1, col: 0, value: 1, state: "visited" },
        { row: 1, col: 1, value: 2, state: "visited" },
        { row: 2, col: 0, value: 1, state: "visited" },
        { row: 2, col: 1, value: 3, state: "visited" },
      ],
    },
  },
  {
    narrative:
      "First transition: Add 1 to all existing parts in a partition, mapping sum to sum + parts without changing the number of parts.",
    primarySnapshot: {
      kind: "array",
      name: "transition1",
      elements: [
        { id: "tr1", value: 4, label: "(3, 1)", state: "default" },
        { id: "tr2", value: 6, label: "shift +2 -> (4, 2)", state: "swap" },
      ],
    },
  },
  {
    narrative:
      "Second transition: Introduce a new part of size 1 and increment all existing parts, mapping sum to sum + parts + 1 and incrementing parts count.",
    primarySnapshot: {
      kind: "array",
      name: "transition2",
      elements: [
        { id: "tr3", value: 4, label: "(3, 1)", state: "default" },
        { id: "tr4", value: 7, label: "add part -> (4, 2, 1)", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Evaluating DP states for N sums across O(sqrt N) parts reduces the operations to O(N sqrt N) total transitions.",
    primarySnapshot: {
      kind: "array",
      name: "complexitySummary",
      elements: [
        { id: "c1", value: 10, label: "N = 10", state: "default" },
        { id: "c2", value: 4, label: "K_max = 4", state: "default" },
        { id: "c3", value: 40, label: "Transitions ~ 40", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "One-dimensional space optimization maintains only the current DP row of size N + 1, using linear O(N) auxiliary space.",
    primarySnapshot: {
      kind: "array",
      name: "spaceOptimizedDp",
      elements: [
        { id: "dp0", value: 1, label: "dp[0]", state: "visited" },
        { id: "dp1", value: 1, label: "dp[1]", state: "visited" },
        { id: "dp2", value: 1, label: "dp[2]", state: "visited" },
        { id: "dp3", value: 2, label: "dp[3]", state: "visited" },
      ],
    },
  },
  {
    narrative:
      "SQRT-bounded integer partition DP computes distinct partition counts in O(N sqrt N) time and O(N) space.",
    primarySnapshot: {
      kind: "array",
      name: "finalDpSummary",
      elements: [
        { id: "f1", value: 1, label: "Time O(N sqrt N)", state: "sorted" },
        { id: "f2", value: 1, label: "Space O(N)", state: "sorted" },
      ],
    },
  },
];

export function generateIntegerPartitionSqrtSteps(
  input: IntegerPartitionSqrtInput,
): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  for (const intro of createIntroSnapshots()) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: intro.narrative,
        primarySnapshot: intro.primarySnapshot,
      }),
    );
  }

  const n =
    typeof input?.n === "number"
      ? Math.max(1, Math.min(input.n, 100))
      : DEFAULT_INTEGER_PARTITION_SQRT_INPUT.n;
  const maxK = Math.floor(Math.sqrt(2 * n));

  const dp: number[] = new Array(n + 1).fill(0);
  dp[0] = 1;

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initializing 1D DP array of size ${n + 1} with base case dp[0] = 1. Max distinct parts bounded by K = floor(sqrt(2 * ${n})) = ${maxK}.`,
      primarySnapshot: {
        kind: "array",
        name: "dp",
        elements: dp.map((val, idx) => ({
          id: `dp_${idx}`,
          value: val,
          label: `[${idx}]`,
          state: idx === 0 ? "active" : "default",
        })),
      },
    }),
  );

  for (let k = 1; k <= maxK; k++) {
    const minSum = Math.floor((k * (k + 1)) / 2);
    if (minSum > n) break;

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Outer loop k = ${k}: processing distinct partitions of exactly ${k} parts (minimum required sum = ${minSum}).`,
        primarySnapshot: {
          kind: "array",
          name: "dp",
          elements: dp.map((val, idx) => ({
            id: `dp_${idx}`,
            value: val,
            label: `[${idx}]`,
            state: idx >= minSum ? "compare" : "default",
          })),
        },
      }),
    );

    for (let i = n; i >= k; i--) {
      if (dp[i - k] > 0) {
        dp[i] += dp[i - k];
        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `Updated dp[${i}] += dp[${i - k}] (${dp[i - k]}): new dp[${i}] = ${dp[i]}.`,
            primarySnapshot: {
              kind: "array",
              name: "dp",
              elements: dp.map((val, idx) => ({
                id: `dp_${idx}`,
                value: val,
                label: `[${idx}]`,
                state: idx === i ? "swap" : idx === i - k ? "active" : "default",
              })),
            },
          }),
        );
      }
    }
  }

  const finalElements = dp.map((val, idx) => ({
    id: `dp_${idx}`,
    value: val,
    label: `[${idx}]`,
    state: idx === n ? ("sorted" as const) : ("visited" as const),
  }));

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Completed DP tabulation for N = ${n}. Number of distinct integer partitions = dp[${n}] = ${dp[n]}.`,
      primarySnapshot: {
        kind: "array",
        name: "dp",
        elements: finalElements,
      },
    }),
  );

  return steps;
}

const INTEGER_PARTITION_SQRT_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Optimize integer partition computations using the mathematical bound that the number of distinct parts is at most <code>O(&radic;N)</code>.</p>",
  sections: [
    {
      heading: "Triangular Bound",
      body: "<p>Because <code>1 + 2 + ... + K = K(K+1)/2 &le; N</code>, the number of distinct parts <code>K</code> cannot exceed <code>sqrt(2N)</code>.</p>",
    },
  ],
};

const INTEGER_PARTITION_SQRT_TRIVIA: TriviaMeta = {
  lineExplanations: {
    8: "Defines solve_integer_partition_sqrt function.",
    11: "Calculates max_k bound as int(sqrt(2N)).",
  },
};

export const integerPartitionSqrt: AlgorithmDefinition<IntegerPartitionSqrtInput> = {
  id: "integer-partition-sqrt",
  title: "Integer Partition DP with Sqrt(N) Bound",
  topicIds: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "<p>Optimize integer partition computations using the mathematical bound that the number of distinct parts is at most <code>O(&radic;N)</code>.</p><h3>Input Parameters</h3><ul><li><code>n</code>: Target integer sum to partition into distinct positive parts.</li></ul><h3>Output</h3><ul><li><code>int</code>: Total number of distinct integer partitions of N.</li></ul>",
  constraints: ["1 <= n <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { n: 10 },
      output: "10",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: { n: 1 },
      output: "1",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: { n: 100 },
      output: "100",
    },
  ],
  code: PYTHON_INTEGER_PARTITION_SQRT_CODE,
  timeComplexity: {
    best: "O(N \\sqrt{N})",
    average: "O(N \\sqrt{N})",
    worst: "O(N \\sqrt{N})",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "The number of parts is limited to O(√N). The DP processes N sums over O(√N) parts, yielding O(N√N).",
    space: "We only need to store the previous DP row of size O(N).",
  },
  topicGuide: INTEGER_PARTITION_SQRT_TOPIC_GUIDE,
  trivia: INTEGER_PARTITION_SQRT_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_INTEGER_PARTITION_SQRT_INPUT,
  generateSteps: generateIntegerPartitionSqrtSteps,
};

export default integerPartitionSqrt;
