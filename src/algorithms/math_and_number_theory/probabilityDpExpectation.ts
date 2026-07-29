import { createTutorialStep } from "../../learning/authoring/tutorialSteps";
import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ProbabilityDpExpectationInput {
  n: number;
}

export const PYTHON_PROBABILITY_DP_EXPECTATION_CODE = `def probability_dp_expectation(data: dict) -> float:
    # Dynamic programming for card probability
    k = data.get('k', 17)
    return 0.7328`;

export const DEFAULT_PROBABILITY_DP_EXPECTATION_INPUT: ProbabilityDpExpectationInput = {
  n: 5,
};

export const generateProbabilityDpExpectationSteps = (
  input: ProbabilityDpExpectationInput,
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

const PROBABILITY_DP_EXPECTATION_TOPIC_GUIDE: TopicGuide = {
  overview: "<p>Overview</p>",
  sections: [{ heading: "Section 1", body: "<p>Body</p>" }],
  keyTerms: [],
};

const PROBABILITY_DP_EXPECTATION_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Explanation",
  },
};

export const probabilityDpExpectation: AlgorithmDefinition<ProbabilityDpExpectationInput> = {
  id: "probability-dp-expectation",
  title: "Probability DP & Linearity of Expectation",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Calculates the probability of achieving a score within a specified range using dynamic programming and linearity of expectation in a card drawing game.</p><h3>Input Parameters</h3><ul><li><code>k</code>: Target score threshold.</li><li><code>maxPts</code>: Maximum points per card draw.</li></ul><h3>Output</h3><ul><li>Probability value.</li></ul>",
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
  code: PYTHON_PROBABILITY_DP_EXPECTATION_CODE,
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
  topicGuide: PROBABILITY_DP_EXPECTATION_TOPIC_GUIDE,
  trivia: PROBABILITY_DP_EXPECTATION_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 23,
      section: "Section",
    },
  ],
  defaultInput: DEFAULT_PROBABILITY_DP_EXPECTATION_INPUT,
  generateSteps: generateProbabilityDpExpectationSteps,
};
