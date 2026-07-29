import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface DivisorFunctionsInput {
  n: number;
}

export const PYTHON_DIVISORFUNCTIONS_CODE = `def sum_of_divisors(n: int) -> int:
    if n <= 1: return 0
    total = 1
    d = 2
    while d * d <= n:
        if n % d == 0:
            total += d
            if d * d != n:
                total += n // d
        d += 1
    return total`;

export const DEFAULT_DIVISORFUNCTIONS_INPUT: DivisorFunctionsInput = {
  n: 28,
};

export const generateDivisorFunctionsSteps = (input: DivisorFunctionsInput): AlgorithmStep[] => {
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

const DIVISORFUNCTIONS_TOPIC_GUIDE: TopicGuide = {
  overview: "<p>Divisor Functions & Perfect Numbers algorithm overview.</p>",
  sections: [
    {
      heading: "Mechanism",
      body: "<p>Mathematical principles power this algorithm.</p>",
    },
  ],
  keyTerms: [],
};

const DIVISORFUNCTIONS_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const divisorFunctions: AlgorithmDefinition<DivisorFunctionsInput> = {
  id: "divisor-functions",
  title: "Divisor Functions & Perfect Numbers",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Computes the sum of divisors function to determine if a number is perfect.</p><h3>Input Parameters</h3><ul><li><code>n</code> (<code>n &ge; 1</code>): Integer to analyze.</li></ul><h3>Output</h3><ul><li><code>int</code>: Sum of proper divisors.</li></ul>",
  constraints: ["1 <= n <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { n: 28 },
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
  code: PYTHON_DIVISORFUNCTIONS_CODE,
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
  topicGuide: DIVISORFUNCTIONS_TOPIC_GUIDE,
  trivia: DIVISORFUNCTIONS_TRIVIA,
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
  defaultInput: DEFAULT_DIVISORFUNCTIONS_INPUT,
  generateSteps: generateDivisorFunctionsSteps,
};
