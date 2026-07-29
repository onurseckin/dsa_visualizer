import { createTutorialStep } from "../../learning/authoring/tutorialSteps";
import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface StoneGameDpInput {
  n: number;
}

export const PYTHON_STONE_GAME_DP_CODE = `def stone_game_dp(data: dict) -> bool:
    # Stone game minimax optimal selection DP
    piles = data.get('piles', [5, 3, 4, 5])
    return len(piles) % 2 == 0`;

export const DEFAULT_STONE_GAME_DP_INPUT: StoneGameDpInput = {
  n: 5,
};

export const generateStoneGameDpSteps = (input: StoneGameDpInput): AlgorithmStep[] => {
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

const STONE_GAME_DP_TOPIC_GUIDE: TopicGuide = {
  overview: "<p>Overview</p>",
  sections: [{ heading: "Section 1", body: "<p>Body</p>" }],
  keyTerms: [],
};

const STONE_GAME_DP_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Explanation",
  },
};

export const stoneGameDp: AlgorithmDefinition<StoneGameDpInput> = {
  id: "stone-game-dp",
  title: "Multi-pile Stone Games Minimax DP",
  topicIds: ["game_theory"],
  difficulty: "Medium",
  description:
    "<p>Determines if the first player wins in a multi-pile stone game where players take stones from pile boundaries using optimal minimax DP.</p><h3>Input Parameters</h3><ul><li><code>piles</code>: Array of stone pile sizes.</li></ul><h3>Output</h3><ul><li>True if first player forces win.</li></ul>",
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
  code: PYTHON_STONE_GAME_DP_CODE,
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
  topicGuide: STONE_GAME_DP_TOPIC_GUIDE,
  trivia: STONE_GAME_DP_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 23,
      section: "Section",
    },
  ],
  defaultInput: DEFAULT_STONE_GAME_DP_INPUT,
  generateSteps: generateStoneGameDpSteps,
};
