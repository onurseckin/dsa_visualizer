import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface GoldbachConjectureInput {
  n: number;
}

export const PYTHON_GOLDBACHCONJECTURE_CODE = `def goldbach(n: int) -> list[int]:
    def is_prime(x: int) -> bool:
        if x < 2: return False
        for i in range(2, int(x**0.5) + 1):
            if x % i == 0: return False
        return True
    for i in range(2, n // 2 + 1):
        if is_prime(i) and is_prime(n - i):
            return [i, n - i]
    return []`;

export const DEFAULT_GOLDBACHCONJECTURE_INPUT: GoldbachConjectureInput = {
  n: 28,
};

export const generateGoldbachConjectureSteps = (
  input: GoldbachConjectureInput,
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

const GOLDBACHCONJECTURE_TOPIC_GUIDE: TopicGuide = {
  overview: "<p>Goldbach's Conjecture algorithm overview.</p>",
  sections: [
    {
      heading: "Mechanism",
      body: "<p>Mathematical principles power this algorithm.</p>",
    },
  ],
  keyTerms: [],
};

const GOLDBACHCONJECTURE_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const goldbachConjecture: AlgorithmDefinition<GoldbachConjectureInput> = {
  id: "goldbach-conjecture",
  title: "Goldbach's Conjecture",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Finds two prime numbers that sum to a given even integer.</p><h3>Input Parameters</h3><ul><li><code>n</code> (<code>n &ge; 4, even</code>): The even integer.</li></ul><h3>Output</h3><ul><li><code>int[]</code>: Two primes that sum to n.</li></ul>",
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
  code: PYTHON_GOLDBACHCONJECTURE_CODE,
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
  topicGuide: GOLDBACHCONJECTURE_TOPIC_GUIDE,
  trivia: GOLDBACHCONJECTURE_TRIVIA,
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
  defaultInput: DEFAULT_GOLDBACHCONJECTURE_INPUT,
  generateSteps: generateGoldbachConjectureSteps,
};
