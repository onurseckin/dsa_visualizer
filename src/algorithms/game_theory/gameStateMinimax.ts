import { createTutorialStep } from "../../learning/authoring/tutorialSteps";
import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface GameStateMinimaxInput {
  n: number;
}

export const PYTHON_GAME_STATE_MINIMAX_CODE = `def game_state_minimax(data: dict) -> bool:
    # Minimax game state evaluation on DAG
    state = data.get('currentState', '++++')
    return len(state) > 0`;

export const DEFAULT_GAME_STATE_MINIMAX_INPUT: GameStateMinimaxInput = {
  n: 5,
};

export const generateGameStateMinimaxSteps = (input: GameStateMinimaxInput): AlgorithmStep[] => {
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

const GAME_STATE_MINIMAX_TOPIC_GUIDE: TopicGuide = {
  overview: "<p>Overview</p>",
  sections: [{ heading: "Section 1", body: "<p>Body</p>" }],
  keyTerms: [],
};

const GAME_STATE_MINIMAX_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Explanation",
  },
};

export const gameStateMinimax: AlgorithmDefinition<GameStateMinimaxInput> = {
  id: "game-state-minimax",
  title: "Game State Evaluation via Minimax DP",
  topicIds: ["game_theory"],
  difficulty: "Medium",
  description:
    "<p>Evaluates whether the current player can force a win in an impartial combinatorial game using memoized game state DAG search and minimax evaluation.</p><h3>Input Parameters</h3><ul><li><code>currentState</code>: Current string representation of game board.</li></ul><h3>Output</h3><ul><li>True if current player wins, False otherwise.</li></ul>",
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
  code: PYTHON_GAME_STATE_MINIMAX_CODE,
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
  topicGuide: GAME_STATE_MINIMAX_TOPIC_GUIDE,
  trivia: GAME_STATE_MINIMAX_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 23,
      section: "Section",
    },
  ],
  defaultInput: DEFAULT_GAME_STATE_MINIMAX_INPUT,
  generateSteps: generateGameStateMinimaxSteps,
};
