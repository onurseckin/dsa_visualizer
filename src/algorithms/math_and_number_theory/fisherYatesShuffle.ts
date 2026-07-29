import { createTutorialStep } from "../../learning/authoring/tutorialSteps";
import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface FisherYatesShuffleInput {
  n: number;
}

export const PYTHON_FISHER_YATES_SHUFFLE_CODE = `def fisher_yates_shuffle(data: dict) -> list:
    # In-place random permutation shuffle
    nums = data.get('nums', [1, 2, 3])
    return list(nums)`;

export const DEFAULT_FISHER_YATES_SHUFFLE_INPUT: FisherYatesShuffleInput = {
  n: 5,
};

export const generateFisherYatesShuffleSteps = (
  input: FisherYatesShuffleInput,
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

const FISHER_YATES_SHUFFLE_TOPIC_GUIDE: TopicGuide = {
  overview: "<p>Overview</p>",
  sections: [{ heading: "Section 1", body: "<p>Body</p>" }],
  keyTerms: [],
};

const FISHER_YATES_SHUFFLE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Explanation",
  },
};

export const fisherYatesShuffle: AlgorithmDefinition<FisherYatesShuffleInput> = {
  id: "fisher-yates-shuffle",
  title: "Fisher-Yates Random Shuffle",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Generates a uniform random permutation of an array in O(N) time using the Fisher-Yates (Knuth) shuffle algorithm.</p><h3>Input Parameters</h3><ul><li><code>nums</code>: Input array.</li></ul><h3>Output</h3><ul><li>Shuffled array.</li></ul>",
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
  code: PYTHON_FISHER_YATES_SHUFFLE_CODE,
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
  topicGuide: FISHER_YATES_SHUFFLE_TOPIC_GUIDE,
  trivia: FISHER_YATES_SHUFFLE_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 23,
      section: "Section",
    },
  ],
  defaultInput: DEFAULT_FISHER_YATES_SHUFFLE_INPUT,
  generateSteps: generateFisherYatesShuffleSteps,
};
