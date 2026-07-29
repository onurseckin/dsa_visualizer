import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface MexSubtractionGameInput {
  n: number;
}

export const PYTHON_MEX_SUBTRACTION_GAME_CODE = `def mex_subtraction_game(data: dict) -> int:
    dp = [0] * (n + 1)
    for i in range(1, n + 1):
        seen = set()
        if i >= 1: seen.add(dp[i - 1])
        if i >= 2: seen.add(dp[i - 2])
        if i >= 3: seen.add(dp[i - 3])
        mex = 0
        while mex in seen:
            mex += 1
        dp[i] = mex
    return dp[n]`;

export const DEFAULT_MEX_SUBTRACTION_GAME_INPUT: MexSubtractionGameInput = {
  n: 5,
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "In a subtraction game, players take turns removing a certain number of stones from a pile. The game can be analyzed using the Sprague-Grundy theorem.",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: [{ id: "c1", value: 0, label: "Grundy Values", state: "default" }],
    },
  },
  {
    narrative:
      "The value of a state is the Minimum Excluded (MEX) value of the states it can transition to. The MEX is the smallest non-negative integer not present in a given set.",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: [{ id: "c1", value: 0, label: "Grundy Values", state: "default" }],
    },
  },
];

export function generateMexSubtractionGameSteps(input: MexSubtractionGameInput): AlgorithmStep[] {
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
  const dp: number[] = new Array(n + 1).fill(0);

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative:
        "We start with a DP array initialized to 0. For 0 stones, there are no moves, so the Grundy value is 0.",
      primarySnapshot: {
        kind: "array",
        name: "dp",
        mode: "box",
        elements: dp.map((v, i) => ({
          id: `dp_${i}`,
          value: v,
          label: `[${i}]`,
          state: i === 0 ? "visited" : "default",
        })),
      },
    }),
  );

  for (let i = 1; i <= n; i++) {
    const seen = new Set<number>();
    if (i >= 1) seen.add(dp[i - 1]);
    if (i >= 2) seen.add(dp[i - 2]);
    if (i >= 3) seen.add(dp[i - 3]);

    let mex = 0;
    while (seen.has(mex)) mex++;
    dp[i] = mex;

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `For ${i} stones, the reachable states are the Grundy values of the remaining stones. The MEX of these values is ${mex}.`,
        primarySnapshot: {
          kind: "array",
          name: "dp",
          mode: "box",
          elements: dp.map((v, idx) => ({
            id: `dp_${idx}`,
            value: v,
            label: `[${idx}]`,
            state: idx === i ? "active" : idx < i ? "visited" : "default",
          })),
        },
      }),
    );
  }

  return steps;
}

export const mexSubtractionGame: AlgorithmDefinition<MexSubtractionGameInput> = {
  id: "mex-subtraction-game",
  title: "Subtraction Game Mex Grundy Calculation",
  topicIds: ["game_theory"],
  difficulty: "Medium",
  description:
    "<p>Calculate the Grundy values for a subtraction game where a player can subtract 1, 2, or 3 stones.</p>",
  constraints: ["1 <= n <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { n: 5 },
      output: "2",
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
      input: { n: 10 },
      output: "2",
    },
  ],
  code: PYTHON_MEX_SUBTRACTION_GAME_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Each state calculates the MEX from at most 3 reachable states, leading to O(N) time.",
    space: "The DP array requires O(N) space.",
  },
  topicGuide: {
    overview: "<p>Explanation of the subtraction game and Sprague-Grundy theorem.</p>",
    sections: [
      {
        heading: "Mental Model",
        body: "<p>The game can be viewed as an impartial game. The MEX calculation gives the Grundy value.</p>",
      },
    ],
  },
  sources: [],
  defaultInput: DEFAULT_MEX_SUBTRACTION_GAME_INPUT,
  generateSteps: generateMexSubtractionGameSteps,
};
