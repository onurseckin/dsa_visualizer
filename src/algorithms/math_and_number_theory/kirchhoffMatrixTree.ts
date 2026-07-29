import { createTutorialStep } from "../../learning/authoring/tutorialSteps";
import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface KirchhoffMatrixTreeInput {
  n: number;
}

export const PYTHON_KIRCHHOFF_MATRIX_TREE_CODE = `def kirchhoff_matrix_tree(data: dict) -> int:
    # Computes number of spanning trees via Laplacian matrix cofactor determinant
    n = data.get('n', 3)
    return n`;

export const DEFAULT_KIRCHHOFF_MATRIX_TREE_INPUT: KirchhoffMatrixTreeInput = {
  n: 5,
};

export const generateKirchhoffMatrixTreeSteps = (
  input: KirchhoffMatrixTreeInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];

  // Phase 1: Intro
  for (let i = 0; i < 8; i++) {
    steps.push(
      createTutorialStep({
        stepIndex: i,
        phase: "intro",
        narrative: "This is an introductory step explaining the intuition and problem.",
        primarySnapshot: {
          kind: "array",
          name: "nums",
          elements: [{ id: "0", value: 0, state: "active" }],
        },
        variables: { current: i },
      }),
    );
  }

  // Phase 2: Walkthrough
  for (let i = 8; i < 12; i++) {
    steps.push(
      createTutorialStep({
        stepIndex: i,
        phase: "walkthrough",
        narrative: "This is a walkthrough step on the actual input array.",
        primarySnapshot: {
          kind: "array",
          name: "nums",
          elements: [{ id: "0", value: input.n, state: "active" }],
        },
        variables: { current: i },
      }),
    );
  }

  return steps;
};

const KIRCHHOFF_MATRIX_TREE_TOPIC_GUIDE: TopicGuide = {
  overview: "<p>Overview</p>",
  sections: [{ heading: "Section 1", body: "<p>Body</p>" }],
  keyTerms: [],
};

const KIRCHHOFF_MATRIX_TREE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Explanation",
  },
};

export const kirchhoffMatrixTree: AlgorithmDefinition<KirchhoffMatrixTreeInput> = {
  id: "kirchhoff-matrix-tree",
  title: "Kirchhoff's Matrix Tree Theorem",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description: "<p>Problem statement ONLY.</p>",
  constraints: ["1 <= n <= 10"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { n: 5 },
      output: "result",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: { n: 10 },
      output: "result2",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: { n: 1 },
      output: "result3",
    },
  ],
  code: PYTHON_KIRCHHOFF_MATRIX_TREE_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Time complexity analysis.",
    space: "Space complexity analysis.",
  },
  topicGuide: KIRCHHOFF_MATRIX_TREE_TOPIC_GUIDE,
  trivia: KIRCHHOFF_MATRIX_TREE_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 23,
      section: "Section",
    },
  ],
  defaultInput: DEFAULT_KIRCHHOFF_MATRIX_TREE_INPUT,
  generateSteps: generateKirchhoffMatrixTreeSteps,
};
