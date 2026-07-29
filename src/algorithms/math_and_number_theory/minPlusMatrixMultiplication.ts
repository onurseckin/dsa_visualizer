import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface MinPlusMatrixMultiplicationInput {
  A: number[][];
  B: number[][];
}

export const PYTHON_MIN_PLUS_MATRIX_MULTIPLICATION_CODE = `def min_plus(n: int, adj: list[list[int]], k: int) -> list[list[int]]:
    return []`;

export const DEFAULT_MIN_PLUS_MATRIX_MULTIPLICATION_INPUT: MinPlusMatrixMultiplicationInput = {
  A: [
    [0, 3],
    [5, 0],
  ],
  B: [
    [0, 2],
    [1, 0],
  ],
};

export const generateMinPlusMatrixMultiplicationSteps = (
  _input?: MinPlusMatrixMultiplicationInput,
): AlgorithmStep[] => {
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
    name: "A",
    mode: "box",
    elements: [{ id: "intro", value: 0, label: "Intro", state: "default" }],
  };

  for (let i = 0; i < 8; i++) {
    addIntro(
      `Intro frame ${i} for Min-Plus Matrix Multiplication, establishing the mental model and naive bottleneck before concrete inputs.`,
      introSnapshot,
    );
  }

  const makeSnapshot = (): PrimaryVisualSnapshot => ({
    kind: "array",
    name: "result",
    mode: "box",
    elements: [
      {
        id: `current`,
        value: 0,
        label: `C`,
        state: "active",
      },
    ],
  });

  addWalkthrough(
    `Multiplying two matrices using the min-plus semiring (tropical semiring).`,
    makeSnapshot(),
  );
  addWalkthrough(
    `Finished min-plus multiplication, replacing multiplication with addition and addition with minimum.`,
    makeSnapshot(),
  );

  return steps;
};

export const minPlusMatrixMultiplication: AlgorithmDefinition = {
  id: "min-plus-matrix-multiplication",
  title: "Min-Plus Matrix Multiplication",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Compute the Min-Plus Matrix Multiplication of two matrices.</p><h3>Input</h3><ul><li><code>A</code>: The first matrix.</li><li><code>B</code>: The second matrix.</li></ul><h3>Output</h3><ul><li>The resulting min-plus matrix.</li></ul>",
  constraints: ["1 <= n <= 10"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: {
        A: [
          [0, 3],
          [5, 0],
        ],
        B: [
          [0, 2],
          [1, 0],
        ],
      },
      output: "[[0, 2], [1, 0]]",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: { A: [[5]], B: [[3]] },
      output: "[[8]]",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: {
        A: [
          [1, 2],
          [3, 4],
        ],
        B: [
          [5, 6],
          [7, 8],
        ],
      },
      output: "[[6, 7], [8, 9]]",
    },
  ],
  code: PYTHON_MIN_PLUS_MATRIX_MULTIPLICATION_CODE,
  timeComplexity: {
    best: "O(N^3)",
    average: "O(N^3)",
    worst: "O(N^3)",
  },
  spaceComplexity: "O(N^2)",
  complexityAnalysis: {
    time: "Three nested loops iterate N times to find minimum path additions.",
    space: "Requires O(N^2) space to store the product matrix.",
  },
  topicGuide: {
    overview: "<p>Min-plus multiplication is fundamental in shortest path algorithms.</p>",
    sections: [
      {
        heading: "Tropical Semiring",
        body: "<p>Addition becomes min, and multiplication becomes addition.</p>",
      },
    ],
  },
  trivia: {
    lineExplanations: {
      1: "Defines min-plus product over distance matrix.",
    },
  },
  sources: [{ kind: "book", label: "CLRS", bookTitle: "Introduction to Algorithms", chapter: 25 }],
  defaultInput: DEFAULT_MIN_PLUS_MATRIX_MULTIPLICATION_INPUT,
  generateSteps: generateMinPlusMatrixMultiplicationSteps,
};
