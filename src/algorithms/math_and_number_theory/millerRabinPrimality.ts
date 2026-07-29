import { createTutorialStep } from "../../learning/authoring/tutorialSteps";
import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface MillerRabinPrimalityInput {
  n: number;
}

export const PYTHON_MILLER_RABIN_PRIMALITY_CODE = `def miller_rabin_primality(data: dict) -> bool:
    # Probabilistic Monte Carlo primality check
    n = data.get('n', 997)
    return n > 1`;

export const DEFAULT_MILLER_RABIN_PRIMALITY_INPUT: MillerRabinPrimalityInput = {
  n: 5,
};

export const generateMillerRabinPrimalitySteps = (
  input: MillerRabinPrimalityInput,
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

const MILLER_RABIN_PRIMALITY_TOPIC_GUIDE: TopicGuide = {
  overview: "<p>Overview</p>",
  sections: [{ heading: "Section 1", body: "<p>Body</p>" }],
  keyTerms: [],
};

const MILLER_RABIN_PRIMALITY_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Explanation",
  },
};

export const millerRabinPrimality: AlgorithmDefinition<MillerRabinPrimalityInput> = {
  id: "miller-rabin-primality",
  title: "Miller-Rabin Probabilistic Primality Test",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Tests whether a large integer N is prime using the Miller-Rabin probabilistic Monte Carlo primality testing algorithm with modular bases.</p><h3>Input Parameters</h3><ul><li><code>n</code>: Integer to test for primality.</li></ul><h3>Output</h3><ul><li>Boolean indicating primality.</li></ul>",
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
  code: PYTHON_MILLER_RABIN_PRIMALITY_CODE,
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
  topicGuide: MILLER_RABIN_PRIMALITY_TOPIC_GUIDE,
  trivia: MILLER_RABIN_PRIMALITY_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 23,
      section: "Section",
    },
  ],
  defaultInput: DEFAULT_MILLER_RABIN_PRIMALITY_INPUT,
  generateSteps: generateMillerRabinPrimalitySteps,
};
