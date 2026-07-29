import type {
  AlgorithmDefinition,
  AlgorithmStep,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface GameStateMinimaxInput {
  n: number;
}

export const PYTHON_GAME_STATE_MINIMAX_CODE = `class Solution:
    def __init__(self):
        pass

    def canIWin(self, maxChoosableInteger: int, desiredTotal: int) -> bool:
        if (maxChoosableInteger * (maxChoosableInteger + 1)) // 2 < desiredTotal:
            return False
        if desiredTotal <= 0:
            return True

        memo = {}

        def dfs(used_mask: int, current_total: int) -> bool:
            if used_mask in memo:
                return memo[used_mask]

            for i in range(1, maxChoosableInteger + 1):
                if not (used_mask & (1 << i)):
                    if current_total + i >= desiredTotal or not dfs(used_mask | (1 << i), current_total + i):
                        memo[used_mask] = True
                        return True

            memo[used_mask] = False
            return False

        return dfs(0, 0)`;

export const DEFAULT_GAME_STATE_MINIMAX_INPUT: GameStateMinimaxInput = {
  n: 5,
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Minimax Game State Evaluation determines whether the current player can force a win in a two-player zero-sum impartial game.",
    primarySnapshot: {
      kind: "array",
      name: "board",
      mode: "box",
      elements: [
        { id: "c1", value: "+", label: "[0]", state: "default" },
        { id: "c2", value: "+", label: "[1]", state: "default" },
        { id: "c3", value: "+", label: "[2]", state: "default" },
        { id: "c4", value: "+", label: "[3]", state: "default" },
        { id: "c5", value: "+", label: "[4]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "In Flip Game II, two players alternate turns flipping two consecutive '+' characters into '--'. The first player unable to make a valid move loses.",
    primarySnapshot: {
      kind: "array",
      name: "flip_rule",
      mode: "box",
      elements: [
        { id: "fr1", value: "++", label: "Target Pair", state: "compare" },
        { id: "fr2", value: "--", label: "Flipped Pair", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "The game space forms a Directed Acyclic Graph (DAG) of configurations where edges represent legal move choices.",
    primarySnapshot: {
      kind: "array",
      name: "game_dag",
      mode: "box",
      elements: [
        { id: "d1", value: "+++++", label: "Root State", state: "active" },
        { id: "d2", value: "--+++", label: "Option 1", state: "compare" },
        { id: "d3", value: "+--++", label: "Option 2", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "A state is WINNING if ANY available move leads to a state from which the opponent loses (not canWin(next_state)).",
    primarySnapshot: {
      kind: "array",
      name: "winning_condition",
      mode: "box",
      elements: [
        { id: "w1", value: "Player 1 Move", state: "active" },
        { id: "w2", value: "Opponent Losing -> WIN!", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "A state is LOSING if ALL available moves lead to states from which the opponent can force a win.",
    primarySnapshot: {
      kind: "array",
      name: "losing_condition",
      mode: "box",
      elements: [
        { id: "l1", value: "All Moves Lead To Opponent Win", state: "compare" },
        { id: "l2", value: "Current Player Loses", state: "visited" },
      ],
    },
  },
  {
    narrative: "Minimax recurrence: canWin(state) = OR over all moves of (NOT canWin(next_state)).",
    primarySnapshot: {
      kind: "array",
      name: "recurrence",
      mode: "box",
      elements: [
        { id: "r1", value: "canWin(S) =", state: "default" },
        { id: "r2", value: "OR (not canWin(S'))", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Memoization (caching evaluated states in a hash map) prevents re-calculating overlapping board configurations across different move permutations.",
    primarySnapshot: {
      kind: "array",
      name: "memoization",
      mode: "box",
      elements: [
        { id: "m1", value: "Cache State -> Result", state: "sorted" },
        { id: "m2", value: "Avoid Duplicate Subtrees", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Minimax DP and Sprague-Grundy theorem form the core engine for game AI, checkers, chess, and nim-sum combinatorial evaluation.",
    primarySnapshot: {
      kind: "array",
      name: "summary",
      mode: "box",
      elements: [
        { id: "s1", value: "Memoized Game DAG Search", state: "sorted" },
        { id: "s2", value: "Optimal Play Evaluation", state: "default" },
      ],
    },
  },
];

export const generateGameStateMinimaxSteps = (input: GameStateMinimaxInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const n = Math.max(1, Math.min(10, input?.n ?? DEFAULT_GAME_STATE_MINIMAX_INPUT.n));
  const initialState = "+".repeat(n);

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput = !input || input.n === DEFAULT_GAME_STATE_MINIMAX_INPUT.n;

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const memo = new Map<string, boolean>();

  const makeElements = (
    state: string,
    activePairIdx?: number,
    isWinning?: boolean,
  ): PrimaryVisualSnapshot => ({
    kind: "array",
    name: "board",
    mode: "box",
    elements: Array.from(state).map((ch, idx) => ({
      id: `ch-${idx}`,
      value: ch,
      label: `[${idx}]`,
      state:
        isWinning !== undefined
          ? isWinning
            ? "sorted"
            : "visited"
          : activePairIdx !== undefined && (idx === activePairIdx || idx === activePairIdx + 1)
            ? "active"
            : ch === "-"
              ? "visited"
              : "default",
    })),
  });

  addStep(
    `Initializing Minimax evaluation for board state "${initialState}" (length N = ${n}).`,
    makeElements(initialState),
  );

  const canWin = (state: string): boolean => {
    if (memo.has(state)) return memo.get(state)!;

    for (let i = 0; i < state.length - 1; i++) {
      if (state[i] === "+" && state[i + 1] === "+") {
        const nextState = state.slice(0, i) + "--" + state.slice(i + 2);
        addStep(
          `Evaluating move at indices (${i}, ${i + 1}): flipping "++" to "--" yields next state "${nextState}".`,
          makeElements(state, i),
        );

        if (!canWin(nextState)) {
          memo.set(state, true);
          addStep(
            `Found winning move for state "${state}": flipping at index ${i} forces opponent loss in next state "${nextState}". State "${state}" is WINNING!`,
            makeElements(state, i, true),
          );
          return true;
        }
      }
    }

    memo.set(state, false);
    addStep(
      `All valid moves from state "${state}" allow opponent to win. State "${state}" is LOSING.`,
      makeElements(state, undefined, false),
    );
    return false;
  };

  const result = canWin(initialState);

  addStep(
    `Completed Minimax Game Evaluation: First player ${result ? "HAS A GUARANTEED WINNING STRATEGY" : "CANNOT FORCE A WIN"} for starting board "${initialState}".`,
    makeElements(initialState, undefined, result),
  );

  return steps;
};

const GAME_STATE_MINIMAX_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Minimax DP evaluates optimal strategies for impartial two-player games by searching state decision graphs.</p>",
  sections: [
    {
      heading: "Minimax Mechanics & Memoization",
      body: "<p>State evaluation recursively checks opponent state outcomes. Memoization prevents exponential re-computation on overlapping game configurations.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Minimax",
      definition:
        "A decision rule for minimizing the possible loss for a worst-case scenario in a zero-sum game.",
    },
  ],
};

const GAME_STATE_MINIMAX_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Evaluates winning strategy for flip game using Minimax DP.",
  },
};

export const gameStateMinimax: AlgorithmDefinition<GameStateMinimaxInput> = {
  id: "game-state-minimax",
  title: "Game State Evaluation via Minimax DP",
  topicIds: ["game_theory"],
  difficulty: "Medium",
  description:
    "<p>Given a game state representation (such as a string of consecutive '+' signs where two adjacent '+' can be flipped to '--'), determine whether the starting player can force a win using the Minimax algorithm with memoization.</p><p><strong>Input:</strong> An integer <code>n</code> representing the length of a board of consecutive <code>'+'</code> characters, or a game state string.</p><p><strong>Output:</strong> A boolean flag returning <code>true</code> if the first player has a guaranteed winning strategy, and <code>false</code> otherwise.</p>",
  constraints: ["1 <= n <= 10"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "n = 5 ('+++++')",
      outputDisplay: "true",
      title: "Standard 5-Board Case",
      input: DEFAULT_GAME_STATE_MINIMAX_INPUT,
      output: "true",
      explanation: "First player flips center ++ leaving ++ -- ++, forcing opponent loss.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "n = 10 ('++++++++++')",
      outputDisplay: "true",
      title: "Adversarial 10-Board Case",
      input: { n: 10 },
      output: "true",
      explanation: "First player has winning move chain.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "n = 1 ('+')",
      outputDisplay: "false",
      title: "Single Plus Boundary Case",
      input: { n: 1 },
      output: "false",
      explanation: "No legal moves available for first player, resulting in immediate loss.",
    },
  ],
  code: PYTHON_GAME_STATE_MINIMAX_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(2^N)",
    worst: "O(2^N)",
  },
  spaceComplexity: "O(2^N)",
  complexityAnalysis: {
    time: "Evaluating game states takes O(2^N) in worst case across all valid board partition permutations.",
    space: "Requires O(2^N) memory for memoization hash map storing evaluated game state strings.",
  },
  topicGuide: GAME_STATE_MINIMAX_TOPIC_GUIDE,
  trivia: GAME_STATE_MINIMAX_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 25",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 25,
      section: "25.1 Game states",
    },
  ],
  defaultInput: DEFAULT_GAME_STATE_MINIMAX_INPUT,
  generateSteps: generateGameStateMinimaxSteps,
};
