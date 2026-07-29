import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { NIM_GAME_CODE } from "./pythonCode";
import { generateNimGameSteps, type NimInput } from "./stepGenerator";

export const DEFAULT_NIM_INPUT: NimInput = {
  piles: [3, 4, 5],
};

const NIM_GAME_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Nim is an impartial game solved by calculating the Nim-sum <code>S = x<sub>1</sub> &oplus; x<sub>2</sub> &oplus; &hellip; &oplus; x<sub>n</sub></code>. Under normal play, the game position is winning (N-position) if and only if <code>S &ne; 0</code>.</p>",
  sections: [
    {
      heading: "Nim-Sum & Game Positions",
      body: "<p>Position <code>S = 0</code> is a losing P-position (previous player forced win); <code>S &ne; 0</code> is a winning N-position (next player forced win). From an N-position, there is always at least one pile <code>i</code> where reducing its size to <code>x<sub>i</sub> &oplus; S</code> restores the Nim-sum to 0 for the opponent.</p>",
    },
    {
      heading: "Minimax vs Bitwise XOR",
      body: "<p>While game tree search (minimax) takes exponential <code>O(b<sup>d</sup>)</code> time, the Sprague-Grundy bitwise XOR algorithm evaluates the winning player and optimal reducing move in <code>O(n)</code> linear time and <code>O(1)</code> space.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Nim-Sum",
      definition: "The bitwise XOR sum of all pile sizes in the game.",
    },
    {
      term: "P-Position",
      definition:
        "A position from which the Previous player (the one who just moved) can force a win (Nim-sum = 0).",
    },
    {
      term: "N-Position",
      definition:
        "A position from which the Next player (the one about to move) can force a win (Nim-sum != 0).",
    },
  ],
};

const NIM_GAME_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const nimGame: AlgorithmDefinition<NimInput> = {
  id: "nim-game",
  title: "Nim Game Sprague-Grundy",
  topicIds: ["math_and_number_theory", "game_theory"],
  difficulty: "Easy",
  description:
    "<p>Given an array of pile sizes, determine whether the First Player has a forced winning strategy in Nim, and find an optimal reducing move when one exists.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>piles</code>: Array of non-negative integer pile sizes.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>dict</code>: Details containing winning player and optimal move.</li></ul>",
  constraints: ["1 <= piles.length <= 10^4", "0 <= piles[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "piles = [3, 4, 5]",
      outputDisplay: "First Player Wins",
      title: "Standard Example",
      input: { piles: [3, 4, 5] },
      output: "First Player Wins",
      explanation: "Initial XOR sum 3 ^ 4 ^ 5 = 2 != 0 (First Player wins).",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "piles = [0, 0, 0]",
      outputDisplay: "Second Player Wins",
      title: "Boundary Case (Empty Board)",
      input: { piles: [0, 0, 0] },
      output: "Second Player Wins",
      explanation: "All piles empty (0 objects); terminal P-position with no legal moves.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "piles = [1, 3, 5, 7]",
      outputDisplay: "Second Player Wins",
      title: "Adversarial Case (P-Position)",
      input: { piles: [1, 3, 5, 7] },
      output: "Second Player Wins",
      explanation: "Initial XOR sum 1 ^ 3 ^ 5 ^ 7 = 0 (P-position).",
    },
  ],
  code: NIM_GAME_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "One pass to XOR pile sizes in O(n) time.",
    space: "Requires O(1) auxiliary space.",
  },
  topicGuide: NIM_GAME_TOPIC_GUIDE,
  trivia: NIM_GAME_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 292,
      leetcodeId: 292,
      url: "https://leetcode.com/problems/nim-game/",
      label: "LeetCode #292",
      title: "Nim Game",
    },
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 25,
      chapterTitle: "Game Theory",
      section: "25.1 Game states",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  leetcode: {
    id: 292,
    url: "https://leetcode.com/problems/nim-game/",
  },
  defaultInput: DEFAULT_NIM_INPUT,
  generateSteps: generateNimGameSteps,
};

export default nimGame;
