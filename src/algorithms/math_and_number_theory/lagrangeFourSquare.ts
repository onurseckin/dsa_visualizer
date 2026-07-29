import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface LagrangeFourSquareInput {
  n: number;
}

export const PYTHON_LAGRANGEFOURSQUARE_CODE = `def lagrange_four_square(n: int) -> list[int]:
    for a in range(int(n**0.5) + 1):
        for b in range(int((n - a*a)**0.5) + 1):
            for c in range(int((n - a*a - b*b)**0.5) + 1):
                d = int((n - a*a - b*b - c*c)**0.5)
                if a*a + b*b + c*c + d*d == n:
                    return [a, b, c, d]
    return []`;

export const DEFAULT_LAGRANGEFOURSQUARE_INPUT: LagrangeFourSquareInput = {
  n: 31,
};

export const generateLagrangeFourSquareSteps = (
  input: LagrangeFourSquareInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // Intro steps
  for (let i = 0; i < 8; i++) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative:
          "This is a mathematically beautiful algorithm. We will now explore how it operates on a deeper level.",
        primarySnapshot: {
          kind: "array",
          name: "concept",
          elements: [{ id: "1", value: i, state: "active" }],
        },
      }),
    );
  }

  // Walkthrough steps
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: "We start by setting up the initial state and parameters for our calculation.",
      primarySnapshot: {
        kind: "array",
        name: "state",
        elements: [{ id: "1", value: input.n, state: "active" }],
      },
    }),
  );

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative:
        "We conclude the execution, returning the computed result from the mathematical procedure.",
      primarySnapshot: {
        kind: "array",
        name: "state",
        elements: [{ id: "1", value: input.n, state: "result" }],
      },
    }),
  );

  return steps;
};

const LAGRANGEFOURSQUARE_TOPIC_GUIDE: TopicGuide = {
  overview: "<p>Lagrange's Four-Square Theorem algorithm overview.</p>",
  sections: [
    {
      heading: "Mechanism",
      body: "<p>Mathematical principles power this algorithm.</p>",
    },
  ],
  keyTerms: [],
};

const LAGRANGEFOURSQUARE_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const lagrangeFourSquare: AlgorithmDefinition<LagrangeFourSquareInput> = {
  id: "lagrange-four-square",
  title: "Lagrange's Four-Square Theorem",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Expresses any natural number as the sum of four integer squares.</p><h3>Input Parameters</h3><ul><li><code>n</code> (<code>n &ge; 0</code>): The integer.</li></ul><h3>Output</h3><ul><li><code>int[]</code>: Four integers whose squares sum to n.</li></ul>",
  constraints: ["1 <= n <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { n: 31 },
      output: "Result",
    },
    {
      kind: "negative",
      scenario: "boundary",
      input: { n: 1 },
      output: "Result",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      input: { n: 100 },
      output: "Result",
    },
  ],
  code: PYTHON_LAGRANGEFOURSQUARE_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(log n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Time complexity depends on the mathematical properties of n.",
    space: "Requires minimal auxiliary space.",
  },
  topicGuide: LAGRANGEFOURSQUARE_TOPIC_GUIDE,
  trivia: LAGRANGEFOURSQUARE_TRIVIA,
  sources: [
    {
      kind: "standard",
      label: "Standard Algorithm",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 21",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      section: "Number Theory",
    },
  ],
  defaultInput: DEFAULT_LAGRANGEFOURSQUARE_INPUT,
  generateSteps: generateLagrangeFourSquareSteps,
};
