import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { NIM_GAME_CODE } from "./pythonCode";
import { generateNimGameSteps, type NimInput } from "./stepGenerator";

export const DEFAULT_NIM_INPUT: NimInput = {
  piles: [3, 4, 5],
};

const NIM_GAME_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p><strong>Nim</strong> is the canonical impartial combinatorial game played under normal play rules. Multiple piles of objects sit on the table, and two players alternate turns removing any positive number of objects from a single pile. Under normal play, the last player to move wins. Rather than exploring an exponential game tree search, the <strong>Sprague-Grundy theorem</strong> proves that the game state is completely determined by the <strong>Nim-sum</strong> <code>S = x<sub>1</sub> &oplus; x<sub>2</sub> &oplus; ... &oplus; x<sub>n</sub></code>. A Nim-sum of <code>S = 0</code> represents a losing P-position for the player to move, while <code>S &ne; 0</code> represents a winning N-position.</p>",
  sections: [
    {
      heading: "Impartial Games & Normal Play",
      body: "<p>An impartial game gives both players identical legal options from any board state. Under normal play rules, a player without legal moves loses immediately, making the player who makes the final valid move the winner.</p>",
    },
    {
      heading: "P-Positions vs N-Positions",
      body: "<p>Game states recursively partition into <strong>P-positions</strong> (Previous player winning / Next player losing) and <strong>N-positions</strong> (Next player winning). Charles Bouton proved in 1901 that a Nim position is a P-position if and only if its Nim-sum <code>S = &bigoplus; x<sub>i</sub></code> equals 0.</p>",
    },
    {
      heading: "Constructing the Optimal Move",
      body: "<p>Facing an N-position (<code>S &ne; 0</code>), the First Player can always force a win. Locating the most significant set bit <code>d</code> in <code>S</code> and selecting any pile <code>i</code> with bit <code>d</code> set allows reducing pile <code>i</code> to <code>x<sub>i</sub>' = x<sub>i</sub> &oplus; S &lt; x<sub>i</sub></code>, resetting the new Nim-sum to 0 for the opponent.</p>",
    },
    {
      heading: "Sprague-Grundy Theorem Connection",
      body: "<p>The Sprague-Grundy theorem proves that every position in any finite impartial game is equivalent to a Nim pile of size equal to its Grundy value <code>g = mex({g<sub>1</sub>, g<sub>2</sub>, ...})</code>. Independent parallel subgames combine by XORing their Grundy values.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Impartial Game",
      definition:
        "A game where legal move options depend solely on the board position, not on which player's turn it is.",
    },
    {
      term: "Nim-Sum",
      definition: "The bitwise XOR sum of all pile sizes (S = x_1 ^ x_2 ^ ... ^ x_n).",
    },
    {
      term: "P-Position",
      definition:
        "A position that favors the Previous player (the player to move loses under optimal play).",
    },
    {
      term: "N-Position",
      definition:
        "A position that favors the Next player (the player to move has a forced winning strategy).",
    },
    {
      term: "Grundy value",
      definition:
        "The equivalent Nim pile size of an impartial game position, computed recursively via minimum excluded value (mex).",
    },
    {
      term: "Sprague-Grundy Theorem",
      definition:
        "The theorem establishing that every impartial game state is equivalent to a Nim pile of size equal to its Grundy value.",
    },
  ],
};

const NIM_GAME_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines nim_game function accepting list of pile sizes and returning game outcome details.",
    2: "Initializes accumulator variable xor_sum = 0 to compute bitwise XOR sum.",
    3: "Stores total number of piles n = len(piles).",
    4: "Iterates through each pile index i from 0 up to n - 1.",
    5: "Folds pile size into running XOR total via xor_sum ^= piles[i].",
    6: "Empty line separating XOR loop from outcome analysis.",
    7: "Evaluates if total Nim-sum is 0 (P-position, losing for player to move).",
    8: "Returns dictionary indicating Second Player wins when Nim-sum is 0.",
    9: "Empty line separating P-position return from N-position move search.",
    10: "Iterates through piles to find a valid winning move for First Player.",
    11: "Calculates target pile size required to zero out Nim-sum: target_size = piles[i] ^ xor_sum.",
    12: "Checks if target_size is strictly less than current pile size piles[i] (legal reduction).",
    13: "Returns dictionary specifying First Player win with details of winning move.",
    14: "Sets winner key to 'First Player' in return dictionary.",
    15: "Sets winning_pile index to i in return dictionary.",
    16: "Sets target_size for winning pile in return dictionary.",
    17: "Calculates exact number of objects to remove from winning pile: piles[i] - target_size.",
    18: "Closes winning dictionary return statement.",
    19: "Empty line separating loop return from fallback.",
    20: "Fallback return indicating Second Player wins if no reducing move exists.",
  },
};

export const nimGame: AlgorithmDefinition<NimInput> = {
  id: "nim-game",
  title: "Nim Game Sprague-Grundy",
  topicIds: ["math_and_number_theory", "game_theory"],
  difficulty: "Easy",
  description:
    "<p><strong>Nim</strong> is the classic impartial combinatorial game solved by the Sprague-Grundy theorem. Computing the <strong>Nim-sum</strong>—the bitwise XOR sum of all pile sizes:</p><p><code>S = x<sub>1</sub> &oplus; x<sub>2</sub> &oplus; ... &oplus; x<sub>n</sub></code></p><p>instantly determines whether the position is a forced win for the First Player (<code>S &ne; 0</code>, N-position) or the Second Player (<code>S = 0</code>, P-position), and pinpoints the optimal opening move by targeting a pile <code>i</code> with <code>x<sub>i</sub>' = x<sub>i</sub> &oplus; S &lt; x<sub>i</sub></code>.</p><h3>State Representation</h3><p>The state is tracked as a 1D array of pile sizes alongside the running bitwise XOR accumulator.</p><h3>Input Parameters</h3><ul><li><code>piles</code>: Array of non-negative integer pile sizes.</li></ul><h3>Output</h3><ul><li><code>dict</code>: Indicates winning player and optimal reducing move details.</li></ul>",
  constraints: ["1 <= piles.length <= 10^4", "0 <= piles[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "piles = [3, 4, 5]",
      outputDisplay: "First Player Wins (reduce pile 0 from 3 to 1)",
      title: "Basic Example",
      input: { piles: [3, 4, 5] },
      output: "First Player Wins, reduce pile 0 from 3 to 1",
      explanation:
        "Initial XOR sum: 3 ^ 4 ^ 5 = 2 != 0 (First Player wins). Reducing pile 0 to 1 forces Nim-sum of 0 for opponent.",
    },
    {
      kind: "complex",
      inputDisplay: "piles = [1, 3, 5, 7]",
      outputDisplay: "Second Player Wins (Nim-sum = 0)",
      title: "Complex Edge Case",
      input: { piles: [1, 3, 5, 7] },
      output: "Second Player Wins (Nim-sum = 0)",
      explanation:
        "Initial XOR sum: 1 ^ 3 ^ 5 ^ 7 = 0 (P-position, Second Player wins). Any move leaves a non-zero Nim-sum.",
    },
    {
      kind: "negative",
      inputDisplay: "piles = [0, 0, 0]",
      outputDisplay: "Second Player Wins (Nim-sum = 0)",
      title: "Failing / Boundary Case",
      input: { piles: [0, 0, 0] },
      output: "Second Player Wins (Nim-sum = 0)",
      explanation:
        "All piles empty (0 objects remaining); terminal P-position with zero legal moves remaining.",
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
    time: "We make one pass over the piles to XOR their sizes together in O(n) time, then at most one more pass to locate the winning move pile. No game tree search is required.",
    space:
      "Auxiliary space is O(1) because only a single scalar XOR sum register and loop indices are maintained.",
  },
  topicGuide: NIM_GAME_TOPIC_GUIDE,
  trivia: NIM_GAME_TRIVIA,
  leetcode: {
    id: 292,
    url: "https://leetcode.com/problems/nim-game/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #292",
      leetcodeId: 292,
      url: "https://leetcode.com/problems/nim-game/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 25",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 25,
      section: "25.2 Nim game",
    },
  ],
  defaultInput: DEFAULT_NIM_INPUT,
  generateSteps: generateNimGameSteps,
};

export default nimGame;
