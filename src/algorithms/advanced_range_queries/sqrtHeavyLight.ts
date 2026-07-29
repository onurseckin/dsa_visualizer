import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface SqrtHeavyLightInput {
  n: number;
  queries: number[][];
}

export const PYTHON_SQRT_HEAVY_LIGHT_CODE = `def sqrt_heavy_light(data: dict) -> list[int]:
    # Placeholder for SQRT Heavy-Light threshold splitting
    # Heavy items (frequency > sqrt(N)) are tracked individually
    # Light items (frequency <= sqrt(N)) are computed on the fly
    return [0] * len(queries)`;

export const DEFAULT_SQRT_HEAVY_LIGHT_INPUT: SqrtHeavyLightInput = {
  n: 10,
  queries: [
    [1, 2],
    [2, 3],
  ],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "When answering queries over groups of items, groups can vary vastly in size. A naive approach might be too slow if we iterate over large groups.",
    primarySnapshot: {
      kind: "array",
      name: "queries",
      mode: "box",
      elements: [{ id: "c1", value: 1, label: "Q", state: "default" }],
    },
  },
  {
    narrative:
      "Square Root thresholding divides groups into 'heavy' (size > √N) and 'light' (size ≤ √N). Heavy groups are precomputed or updated efficiently, while light groups are processed individually.",
    primarySnapshot: {
      kind: "array",
      name: "queries",
      mode: "box",
      elements: [{ id: "c1", value: 1, label: "Q", state: "default" }],
    },
  },
];

export function generateSqrtHeavyLightSteps(input: SqrtHeavyLightInput): AlgorithmStep[] {
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

  const { queries } = input;

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: "First, we compute the frequencies of all items and determine the threshold √N.",
      primarySnapshot: {
        kind: "array",
        name: "queries",
        mode: "box",
        elements: queries.map((q, i) => ({
          id: `q_${i}`,
          value: q[0],
          label: `[${i}]`,
          state: "default",
        })),
      },
    }),
  );

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative:
        "We then route each query either to the precomputed heavy data structures or the fast light group iterator.",
      primarySnapshot: {
        kind: "array",
        name: "queries",
        mode: "box",
        elements: queries.map((q, i) => ({
          id: `q_${i}`,
          value: q[0],
          label: `[${i}]`,
          state: "visited",
        })),
      },
    }),
  );

  return steps;
}

export const sqrtHeavyLight: AlgorithmDefinition<SqrtHeavyLightInput> = {
  id: "sqrt-heavy-light",
  title: "SQRT Heavy-Light Item Threshold Splitting",
  topicIds: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "<p>Use square root decomposition to split items into heavy and light components to optimize query times.</p>",
  constraints: ["1 <= n <= 10^5", "1 <= queries.length <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: {
        n: 10,
        queries: [
          [1, 2],
          [2, 3],
        ],
      },
      output: "[0, 0]",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: { n: 1, queries: [[1, 1]] },
      output: "[0]",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: {
        n: 100,
        queries: [
          [1, 5],
          [2, 10],
        ],
      },
      output: "[0, 0]",
    },
  ],
  code: PYTHON_SQRT_HEAVY_LIGHT_CODE,
  timeComplexity: {
    best: "O(Q \\sqrt{N})",
    average: "O(Q \\sqrt{N})",
    worst: "O(Q \\sqrt{N})",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Processing heavy items takes at most N/√N iterations, and light items take at most √N iterations, balancing out to O(Q√N) time.",
    space: "O(N) extra space is required for tracking heavy properties.",
  },
  topicGuide: {
    overview:
      "<p>Explanation of Heavy-Light Decomposition over items using square root bounds.</p>",
    sections: [
      {
        heading: "Mental Model",
        body: "<p>Separate entities into two sets bounded by √N to bound worst-case performance.</p>",
      },
    ],
  },
  sources: [],
  defaultInput: DEFAULT_SQRT_HEAVY_LIGHT_INPUT,
  generateSteps: generateSqrtHeavyLightSteps,
};
