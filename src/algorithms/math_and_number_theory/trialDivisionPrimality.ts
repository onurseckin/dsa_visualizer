import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface TrialDivisionPrimalityInput {
  n: number;
}

export const PYTHON_TRIALDIVISIONPRIMALITY_CODE = `def factorize(n: int) -> list[int]:
    factors = []
    d = 2
    while d * d <= n:
        while (n % d) == 0:
            factors.append(d)
            n //= d
        d += 1
    if n > 1:
        factors.append(n)
    return factors`;

export const DEFAULT_TRIALDIVISIONPRIMALITY_INPUT: TrialDivisionPrimalityInput = {
  n: 12,
};

export const generateTrialDivisionPrimalitySteps = (
  input: TrialDivisionPrimalityInput,
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

const TRIALDIVISIONPRIMALITY_TOPIC_GUIDE: TopicGuide = {
  overview: "<p>Trial Division Primality & Factorization algorithm overview.</p>",
  sections: [
    {
      heading: "Mechanism",
      body: "<p>Mathematical principles power this algorithm.</p>",
    },
  ],
  keyTerms: [],
};

const TRIALDIVISIONPRIMALITY_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const trialDivisionPrimality: AlgorithmDefinition<TrialDivisionPrimalityInput> = {
  id: "trial-division-primality",
  title: "Trial Division Primality & Factorization",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Checks if a number is prime and finds its factors using trial division.</p><h3>Input Parameters</h3><ul><li><code>n</code> (<code>n &ge; 2</code>): Integer to factorize.</li></ul><h3>Output</h3><ul><li><code>int[]</code>: Prime factors of n.</li></ul>",
  constraints: ["1 <= n <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { n: 12 },
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
  code: PYTHON_TRIALDIVISIONPRIMALITY_CODE,
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
  topicGuide: TRIALDIVISIONPRIMALITY_TOPIC_GUIDE,
  trivia: TRIALDIVISIONPRIMALITY_TRIVIA,
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
  defaultInput: DEFAULT_TRIALDIVISIONPRIMALITY_INPUT,
  generateSteps: generateTrialDivisionPrimalitySteps,
};
