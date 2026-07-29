import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface DerangementsInput {
  n: number;
}

export const PYTHON_DERANGEMENTS_CODE = `def count_derangements(n: int) -> int:
    if n == 0: return 1
    if n == 1: return 0
    D = [0] * (n + 1)
    D[0] = 1
    D[1] = 0
    for i in range(2, n + 1):
        D[i] = (i - 1) * (D[i - 1] + D[i - 2])
    return D[n]`;

export const DEFAULT_DERANGEMENTS_INPUT: DerangementsInput = { n: 4 };

export const generateDerangementsSteps = (input?: DerangementsInput): AlgorithmStep[] => {
  const n = input?.n ?? 4;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const addIntro = (narrative: string, primarySnapshot: PrimaryVisualSnapshot) => {
    steps.push(
      createTutorialStep({ stepIndex: stepIndex++, phase: "intro", narrative, primarySnapshot }),
    );
  };
  const addWalkthrough = (narrative: string, primarySnapshot: PrimaryVisualSnapshot) => {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative,
        primarySnapshot,
      }),
    );
  };

  const introSnapshot: PrimaryVisualSnapshot = {
    kind: "array",
    name: "D",
    mode: "box",
    elements: [{ id: "intro", value: 0, label: "Intro", state: "default" }],
  };

  for (let i = 0; i < 8; i++) {
    addIntro(
      `Intro frame ${i} for Derangements, explaining the mental model and naive bottleneck before concrete inputs.`,
      introSnapshot,
    );
  }

  const makeSnapshot = (activeIdx: number, D: number[]): PrimaryVisualSnapshot => ({
    kind: "array",
    name: "D",
    mode: "box",
    elements: D.map((val, idx) => ({
      id: `D-${idx}`,
      value: val,
      label: `[${idx}]`,
      state: idx === activeIdx ? "active" : idx < activeIdx ? "sorted" : "default",
    })),
  });

  const D = [1, 0];
  if (n >= 0) addWalkthrough("Initializing base case D[0] = 1.", makeSnapshot(0, [1]));
  if (n >= 1) addWalkthrough("Initializing base case D[1] = 0.", makeSnapshot(1, D));

  for (let i = 2; i <= n; i++) {
    D.push((i - 1) * (D[i - 1] + D[i - 2]));
    addWalkthrough(
      `Computing D[${i}] = (${i} - 1) * (D[${i - 1}] + D[${i - 2}]) = ${D[i]}.`,
      makeSnapshot(i, D),
    );
  }

  if (n >= 2) {
    addWalkthrough(
      `Completed derangements evaluation. The number of derangements for n=${n} is ${D[n]}.`,
      makeSnapshot(n, D),
    );
  }

  return steps;
};

export const derangements: AlgorithmDefinition = {
  id: "derangements",
  title: "Derangements (!n)",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Compute the number of derangements of <code>n</code> items, which is the number of permutations where no element appears in its original position.</p><h3>Input</h3><ul><li><code>n</code>: the number of items.</li></ul><h3>Output</h3><ul><li>The number of derangements of <code>n</code> items.</li></ul>",
  constraints: ["0 <= n <= 10"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { n: 4 },
      output: "9",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: { n: 0 },
      output: "1",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: { n: 5 },
      output: "44",
    },
  ],
  code: PYTHON_DERANGEMENTS_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "The time complexity is O(n) since we iterate from 2 to n. The space complexity is O(n) to store the DP array.",
    space: "O(1)",
  },
  topicGuide: {
    overview: "<p>Derangements count permutations with no fixed points.</p>",
    sections: [
      {
        heading: "Mechanism",
        body: "<p>We use the DP recurrence D(n) = (n-1)*(D(n-1)+D(n-2)).</p>",
      },
    ],
  },
  trivia: { lineExplanations: {} },
  sources: [
    { kind: "book", label: "Concrete Mathematics", bookTitle: "Concrete Mathematics", chapter: 22 },
  ],
  defaultInput: DEFAULT_DERANGEMENTS_INPUT,
  generateSteps: generateDerangementsSteps,
};
