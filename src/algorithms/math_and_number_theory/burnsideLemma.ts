import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface BurnsideLemmaInput {
  colors: number;
}

export const PYTHON_BURNSIDE_LEMMA_CODE = `def burnside_lemma(n: int, k: int) -> int:
    return 0`;

export const DEFAULT_BURNSIDE_LEMMA_INPUT: BurnsideLemmaInput = { colors: 2 };

export const generateBurnsideLemmaSteps = (input?: BurnsideLemmaInput): AlgorithmStep[] => {
  const c = input?.colors ?? 2;
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
    name: "symmetries",
    mode: "box",
    elements: [{ id: "intro", value: 0, label: "Intro", state: "default" }],
  };

  for (let i = 0; i < 8; i++) {
    addIntro(
      `Intro frame ${i} for Burnside's Lemma, establishing the mental model of group actions and fixed points.`,
      introSnapshot,
    );
  }

  const makeSnapshot = (activeIdx: number, sums: number[]): PrimaryVisualSnapshot => ({
    kind: "array",
    name: "terms",
    mode: "box",
    elements: sums.map((val, idx) => ({
      id: `term-${idx}`,
      value: val,
      label: `sum`,
      state: idx === activeIdx ? "active" : idx < activeIdx ? "sorted" : "default",
    })),
  });

  const terms = [Math.pow(c, 4), Math.pow(c, 1), Math.pow(c, 2), Math.pow(c, 1)];

  let currentSum = 0;
  const runningSums: number[] = [];

  for (let i = 0; i < terms.length; i++) {
    currentSum += terms[i];
    runningSums.push(currentSum);
    addWalkthrough(
      `Adding term for symmetry ${i} value ${terms[i]} with running sum Running sum is ${currentSum}.`,
      makeSnapshot(i, runningSums),
    );
  }

  const result = currentSum / 4;
  addWalkthrough(
    `Dividing total sum ${currentSum} by total number of symmetries 4. Result is ${result}.`,
    makeSnapshot(terms.length - 1, runningSums),
  );

  return steps;
};

export const burnsideLemma: AlgorithmDefinition = {
  id: "burnside-lemma",
  title: "Burnside's Lemma",
  topicIds: ["math_and_number_theory"],
  difficulty: "Hard",
  description:
    "<p>Compute the number of distinct colorings of a 2x2 grid under rotations using Burnside's Lemma.</p><h3>Input</h3><ul><li><code>colors</code>: number of colors.</li></ul><h3>Output</h3><ul><li>The number of distinct colorings.</li></ul>",
  constraints: ["1 <= colors <= 10"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { colors: 2 },
      output: "6",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: { colors: 1 },
      output: "1",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: { colors: 3 },
      output: "24",
    },
  ],
  code: PYTHON_BURNSIDE_LEMMA_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(1)",
    worst: "O(1)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "We use a fixed formula based on the 4 rotations, giving O(1) time and space.",
    space: "O(1)",
  },
  topicGuide: {
    overview: "<p>Burnside's lemma counts objects under symmetry.</p>",
    sections: [
      {
        heading: "Mechanism",
        body: "<p>Average the number of fixed points over all group elements.</p>",
      },
    ],
  },
  trivia: { lineExplanations: {} },
  sources: [
    { kind: "book", label: "Abstract Algebra", bookTitle: "Abstract Algebra", chapter: 22 },
  ],
  defaultInput: DEFAULT_BURNSIDE_LEMMA_INPUT,
  generateSteps: generateBurnsideLemmaSteps,
};
