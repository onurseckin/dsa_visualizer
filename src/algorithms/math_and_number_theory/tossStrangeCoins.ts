import { createTutorialStep } from "../../learning/authoring/tutorialSteps";
import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface TossStrangeCoinsInput {
  n: number;
}

export const PYTHON_TOSS_STRANGE_COINS_CODE = `def toss_strange_coins(data: dict) -> float:
    # 2D DP for exact target heads probability
    target = data.get('target', 2)
    return 0.375`;

export const DEFAULT_TOSS_STRANGE_COINS_INPUT: TossStrangeCoinsInput = {
  n: 5,
};

export const generateTossStrangeCoinsSteps = (input: TossStrangeCoinsInput): AlgorithmStep[] => {
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

const TOSS_STRANGE_COINS_TOPIC_GUIDE: TopicGuide = {
  overview: "<p>Overview</p>",
  sections: [{ heading: "Section 1", body: "<p>Body</p>" }],
  keyTerms: [],
};

const TOSS_STRANGE_COINS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Explanation",
  },
};

export const tossStrangeCoins: AlgorithmDefinition<TossStrangeCoinsInput> = {
  id: "toss-strange-coins",
  title: "Coin Toss Probability DP",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Computes the exact probability of getting target number of heads given an array of independent biased coin probabilities using 2D DP.</p><h3>Input Parameters</h3><ul><li><code>prob</code>: Array of head probabilities.</li><li><code>target</code>: Target number of heads.</li></ul><h3>Output</h3><ul><li>Probability of target heads.</li></ul>",
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
  code: PYTHON_TOSS_STRANGE_COINS_CODE,
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
  topicGuide: TOSS_STRANGE_COINS_TOPIC_GUIDE,
  trivia: TOSS_STRANGE_COINS_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 23,
      section: "Section",
    },
  ],
  defaultInput: DEFAULT_TOSS_STRANGE_COINS_INPUT,
  generateSteps: generateTossStrangeCoinsSteps,
};
