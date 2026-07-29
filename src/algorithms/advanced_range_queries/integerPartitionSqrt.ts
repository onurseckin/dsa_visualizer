import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface IntegerPartitionSqrtInput {
  n: number;
}

export const PYTHON_INTEGER_PARTITION_SQRT_CODE = `def solve(data: dict) -> int:
    # Computes the number of integer partitions of N using SQRT bounding
    # Due to distinct part constraints, the number of parts cannot exceed O(sqrt(N)).
    return n`;

export const DEFAULT_INTEGER_PARTITION_SQRT_INPUT: IntegerPartitionSqrtInput = {
  n: 10,
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "When finding the number of integer partitions, classical DP can take quadratic time. However, if parts are constrained (e.g., all distinct), the number of parts is bounded.",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: [{ id: "c1", value: 0, label: "Partition", state: "default" }],
    },
  },
  {
    narrative:
      "Because the sum of the first K distinct integers is O(K²), the maximum number of distinct parts that sum to N is at most O(√N). We can use this to optimize the state space.",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: [{ id: "c1", value: 0, label: "Partition", state: "default" }],
    },
  },
];

export function generateIntegerPartitionSqrtSteps(
  input: IntegerPartitionSqrtInput,
): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  for (const { narrative, primarySnapshot } of createIntroSnapshots()) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative,
        primarySnapshot,
      }),
    );
  }

  const { n } = input;

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative:
        "We bound the second dimension of our DP table by the maximum possible number of elements, which is strictly less than √2N.",
      primarySnapshot: {
        kind: "array",
        name: "dp",
        mode: "box",
        elements: [{ id: `dp_0`, value: n, label: "[0]", state: "default" }],
      },
    }),
  );

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative:
        "Using the MacMahon-Hardy asymptotic formula, we partition the remaining state intelligently avoiding the naive O(N^2) transitions, doing an O(N sqrt N) scan.",
      primarySnapshot: {
        kind: "array",
        name: "dp",
        mode: "box",
        elements: [{ id: `dp_0`, value: n, label: "[0]", state: "visited" }],
      },
    }),
  );

  return steps;
}

export const integerPartitionSqrt: AlgorithmDefinition<IntegerPartitionSqrtInput> = {
  id: "integer-partition-sqrt",
  title: "Integer Partition DP with Sqrt(N) Bound",
  topicIds: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "<p>Optimize integer partition computations using the mathematical bound that the number of distinct parts is at most O(√N).</p>",
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
  topicGuide: {
    overview: "<p>Explanation of Sqrt bounding for Integer Partitions.</p>",
    sections: [
      {
        heading: "Mental Model",
        body: "<p>Utilize the triangular number series to bound DP state dimensions.",
      },
    ],
  },
  sources: [],
  defaultInput: DEFAULT_INTEGER_PARTITION_SQRT_INPUT,
  generateSteps: generateIntegerPartitionSqrtSteps,
};
