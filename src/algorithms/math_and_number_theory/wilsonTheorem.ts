import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface WilsonTheoremInput {
  n: number;
}

export const PYTHON_WILSONTHEOREM_CODE = `def wilson_prime(p: int) -> bool:
    if p <= 1: return False
    fact = 1
    for i in range(1, p):
        fact = (fact * i) % p
    return fact == p - 1`;

export const DEFAULT_WILSONTHEOREM_INPUT: WilsonTheoremInput = {
  n: 7,
};

export const generateWilsonTheoremSteps = (input: WilsonTheoremInput): AlgorithmStep[] => {
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

const WILSONTHEOREM_TOPIC_GUIDE: TopicGuide = {
  overview: "<p>Wilson's Theorem Primality Test algorithm overview.</p>",
  sections: [
    {
      heading: "Mechanism",
      body: "<p>Mathematical principles power this algorithm.</p>",
    },
  ],
  keyTerms: [],
};

const WILSONTHEOREM_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const wilsonTheorem: AlgorithmDefinition<WilsonTheoremInput> = {
  id: "wilson-theorem",
  title: "Wilson's Theorem Primality Test",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Tests primality using Wilson's Theorem: (p-1)! &equiv; -1 (mod p).</p><h3>Input Parameters</h3><ul><li><code>p</code> (<code>p &ge; 2</code>): The integer to test.</li></ul><h3>Output</h3><ul><li><code>bool</code>: True if prime, False otherwise.</li></ul>",
  constraints: ["1 <= n <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      input: { n: 7 },
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
  code: PYTHON_WILSONTHEOREM_CODE,
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
  topicGuide: WILSONTHEOREM_TOPIC_GUIDE,
  trivia: WILSONTHEOREM_TRIVIA,
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
  defaultInput: DEFAULT_WILSONTHEOREM_INPUT,
  generateSteps: generateWilsonTheoremSteps,
};
