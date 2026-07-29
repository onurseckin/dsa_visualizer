import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface StoneGameDpInput {
  piles: number[];
}

export const PYTHON_STONE_GAME_DP_CODE = `class Solution:
    def __init__(self):
        pass

    def canWin(self, piles: list[int]) -> bool:
        """Return whether the first player gets a strictly larger total."""
        n = len(piles)
        dp = [[0] * n for _ in range(n)]

        for index, stones in enumerate(piles):
            dp[index][index] = stones

        for length in range(2, n + 1):
            for left in range(n - length + 1):
                right = left + length - 1
                take_left = piles[left] - dp[left + 1][right]
                take_right = piles[right] - dp[left][right - 1]
                dp[left][right] = max(take_left, take_right)

        return dp[0][n - 1] > 0`;

export const DEFAULT_STONE_GAME_DP_INPUT: StoneGameDpInput = {
  piles: [5, 3, 4, 5],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Stone Game is a classic interval dynamic programming problem where two players take turns picking stone piles from either boundary of a row of piles.",
    primarySnapshot: {
      kind: "array",
      name: "piles",
      mode: "box",
      elements: [
        { id: "p0", value: 5, label: "Left Boundary", state: "active" },
        { id: "p1", value: 3, label: "[1]", state: "default" },
        { id: "p2", value: 4, label: "[2]", state: "default" },
        { id: "p3", value: 5, label: "Right Boundary", state: "active" },
      ],
    },
  },
  {
    narrative:
      "At any turn, a player can choose either the leftmost pile piles[i] or the rightmost pile piles[j] from the active subarray piles[i..j].",
    primarySnapshot: {
      kind: "array",
      name: "choices",
      mode: "box",
      elements: [
        { id: "c1", value: "Pick piles[i] (Left)", state: "compare" },
        { id: "c2", value: "Pick piles[j] (Right)", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Both players play optimally to maximize their own total stone score difference relative to the opponent.",
    primarySnapshot: {
      kind: "array",
      name: "score_diff",
      mode: "box",
      elements: [
        { id: "sd1", value: "Player Score - Opponent Score", state: "sorted" },
        { id: "sd2", value: "Zero-Sum Optimal Play", state: "default" },
      ],
    },
  },
  {
    narrative:
      "We define 2D DP state dp[i][j] as the maximum score advantage the current player can achieve over the opponent on subarray piles[i..j].",
    primarySnapshot: {
      kind: "matrix",
      name: "dp",
      rows: 4,
      cols: 4,
      cells: [
        { row: 0, col: 0, value: 5, state: "sorted" },
        { row: 1, col: 1, value: 3, state: "sorted" },
        { row: 2, col: 2, value: 4, state: "sorted" },
        { row: 3, col: 3, value: 5, state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Base case: for intervals of length 1 (i == j), dp[i][i] = piles[i] because only 1 pile remains for the current player to take.",
    primarySnapshot: {
      kind: "array",
      name: "base_case",
      mode: "box",
      elements: [{ id: "b1", value: "dp[i][i] = piles[i]", state: "sorted" }],
    },
  },
  {
    narrative:
      "Recurrence transition: dp[i][j] = max(piles[i] - dp[i+1][j], piles[j] - dp[i][j-1]), subtracting the opponent's optimal advantage on the remaining sub-interval.",
    primarySnapshot: {
      kind: "array",
      name: "recurrence",
      mode: "box",
      elements: [
        { id: "r1", value: "Left: piles[i] - dp[i+1][j]", state: "compare" },
        { id: "r2", value: "Right: piles[j] - dp[i][j-1]", state: "active" },
      ],
    },
  },
  {
    narrative:
      "We fill the DP matrix by increasing interval length from len = 2 up to N = len(piles).",
    primarySnapshot: {
      kind: "matrix",
      name: "matrix_fill",
      rows: 4,
      cols: 4,
      cells: [
        { row: 0, col: 0, value: 5, state: "sorted" },
        { row: 0, col: 1, value: 2, state: "active" },
        { row: 1, col: 1, value: 3, state: "sorted" },
        { row: 1, col: 2, value: 1, state: "active" },
      ],
    },
  },
  {
    narrative:
      "If dp[0][N-1] > 0, the first player has a guaranteed positive score advantage and wins the game in O(N^2) time and O(N^2) space.",
    primarySnapshot: {
      kind: "array",
      name: "summary",
      mode: "box",
      elements: [
        { id: "s1", value: "dp[0][N-1] > 0 -> First Player Wins", state: "sorted" },
        { id: "s2", value: "Time: O(N^2), Space: O(N^2)", state: "default" },
      ],
    },
  },
];

export const generateStoneGameDpSteps = (input: StoneGameDpInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawPiles =
    Array.isArray(input?.piles) && input.piles.length > 0 ? input.piles : [5, 3, 4, 5];
  const piles = rawPiles.slice(0, 8);
  const n = piles.length;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input?.piles) &&
      input.piles.length === DEFAULT_STONE_GAME_DP_INPUT.piles!.length &&
      input.piles.every((val, idx) => val === DEFAULT_STONE_GAME_DP_INPUT.piles![idx]));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const dp: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  const makeMatrixSnapshot = (
    activeI?: number,
    activeJ?: number,
    isFinal = false,
  ): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const isDiagonal = r === c;
        const isActive = r === activeI && c === activeJ;
        cells.push({
          row: r,
          col: c,
          value: dp[r][c],
          label: `[${r}][${c}]`,
          state:
            isFinal && r === 0 && c === n - 1
              ? "sorted"
              : isActive
                ? "active"
                : r > c
                  ? "default"
                  : isDiagonal
                    ? "visited"
                    : "compare",
        });
      }
    }
    return {
      kind: "matrix",
      rows: n,
      cols: n,
      rowHeaders: Array.from({ length: n }, (_, i) => `i=${i}`),
      colHeaders: Array.from({ length: n }, (_, j) => `j=${j}`),
      cells,
    };
  };

  addStep(
    `Initializing Stone Game Interval DP for piles [${piles.join(", ")}] (N = ${n}).`,
    makeMatrixSnapshot(),
  );

  for (let i = 0; i < n; i++) {
    dp[i][i] = piles[i];
  }

  addStep(
    `Setting base cases dp[i][i] = piles[i] for single-pile intervals.`,
    makeMatrixSnapshot(0, 0),
  );

  for (let len = 2; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;
      const pickLeft = piles[i] - dp[i + 1][j];
      const pickRight = piles[j] - dp[i][j - 1];
      dp[i][j] = Math.max(pickLeft, pickRight);

      addStep(
        `Evaluating interval [${i}..${j}] (len = ${len}): pick left pile (${piles[i]}) -> net ${pickLeft}, pick right pile (${piles[j]}) -> net ${pickRight}. Setting dp[${i}][${j}] = ${dp[i][j]}.`,
        makeMatrixSnapshot(i, j),
      );
    }
  }

  const result = dp[0][n - 1] > 0;
  addStep(
    `Completed Stone Game DP: dp[0][${n - 1}] = ${dp[0][n - 1]} > 0. First player ${result ? "HAS A GUARANTEED WINNING STRATEGY" : "CANNOT FORCE A WIN"}.`,
    makeMatrixSnapshot(0, n - 1, true),
  );

  return steps;
};

const STONE_GAME_DP_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Stone Game Minimax DP evaluates zero-sum optimal strategies on interval subarrays of stone piles.</p>",
  sections: [
    {
      heading: "Interval DP & Game Parity",
      body: "<p>State dp[i][j] represents max net score advantage on piles[i..j]. Computing bottom-up by interval length yields O(N^2) exact evaluation.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Interval DP",
      definition:
        "A dynamic programming approach that solves subproblems over contiguous intervals [i..j].",
    },
  ],
};

const STONE_GAME_DP_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Evaluates stone game winning strategy using interval DP.",
  },
};

export const stoneGameDp: AlgorithmDefinition<StoneGameDpInput> = {
  id: "stone-game-dp",
  title: "Multi-pile Stone Games Minimax DP",
  topicIds: ["game_theory"],
  difficulty: "Medium",
  description:
    "<p>Given an array of positive integers <code>piles</code> representing stone piles in a row, two players take turns picking all stones from either the beginning or the end of the row. Determine whether the first player can force a win (obtain strictly more total stones than the second player) under optimal play.</p><p><strong>Input:</strong> An array of integers <code>piles</code>.</p><p><strong>Output:</strong> A boolean flag returning <code>true</code> if the first player has a guaranteed winning strategy, and <code>false</code> otherwise.</p>",
  constraints: ["1 <= piles.length <= 200", "1 <= piles[i] <= 10^6"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "piles = [5, 3, 4, 5]",
      outputDisplay: "true",
      title: "Standard 4-Pile Case",
      input: DEFAULT_STONE_GAME_DP_INPUT,
      output: "true",
      explanation: "First player picks 5, forcing opponent into lower scoring choices.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "piles = [3, 9, 1, 2]",
      outputDisplay: "true",
      title: "Adversarial Asymmetric Piles Case",
      input: { piles: [3, 9, 1, 2] },
      output: "true",
      explanation: "First player picks 3 to unlock 9 on next turn.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "piles = [2, 2]",
      outputDisplay: "false",
      title: "Tie Score Boundary Case",
      input: { piles: [2, 2] },
      output: "false",
      explanation: "Both choices lead to equal scores of 2 each, failing strict win requirement.",
    },
  ],
  code: PYTHON_STONE_GAME_DP_CODE,
  timeComplexity: {
    best: "O(N^2)",
    average: "O(N^2)",
    worst: "O(N^2)",
  },
  spaceComplexity: "O(N^2)",
  complexityAnalysis: {
    time: "Filling an N x N interval DP table takes O(N^2) execution time.",
    space: "Requires O(N^2) space to store the 2D interval DP table.",
  },
  topicGuide: STONE_GAME_DP_TOPIC_GUIDE,
  trivia: STONE_GAME_DP_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 25",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 25,
      section: "25.1 Game states",
    },
  ],
  defaultInput: DEFAULT_STONE_GAME_DP_INPUT,
  generateSteps: generateStoneGameDpSteps,
};
