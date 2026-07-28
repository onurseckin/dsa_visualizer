import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { NIM_GAME_CODE } from "./pythonCode";
import { generateNimGameSteps, type NimInput } from "./stepGenerator";

export const DEFAULT_NIM_INPUT: NimInput = {
  piles: [3, 4, 5],
};

const NIM_GAME_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Nim is the canonical reference example of an impartial combinatorial game played under normal play rules. Multiple piles of objects sit on the table, and two players alternate turns removing any positive number of objects from a single pile. The last player to move wins the game. Rather than exploring an exponential game tree search, the Sprague-Grundy theorem proves that the entire game state is completely determined by a single algebraic quantity: the Nim-sum $S = x_1 \\oplus x_2 \\oplus \\dots \\oplus x_n$, which is the bitwise XOR sum of all pile sizes. A Nim-sum of $S = 0$ represents a losing P-position for the player to move, while a non-zero Nim-sum $S \\neq 0$ represents a winning N-position.",
  sections: [
    {
      heading: "Impartial Games & Normal Play Convention",
      body: "An impartial game is a combinatorial game where both players have access to the exact same set of legal moves from any given board state. Unlike Chess or Poker, there is no asymmetric piece ownership, no random chance, and no hidden information. Under the normal play convention, a player who has no legal moves left loses the game immediately, meaning the player who makes the final valid move wins.",
    },
    {
      heading: "P-Positions vs N-Positions & Game Equivalence",
      body: "Game positions are recursively classified into P-positions (Previous player winning / Next player losing) and N-positions (Next player winning / Previous player losing). A state is a P-position if every valid move leads to an N-position. Conversely, a state is an N-position if at least one valid move leads to a P-position. Charles Bouton proved in 1901 that a Nim position is a P-position if and only if its Nim-sum $S = x_1 \\oplus x_2 \\oplus \\dots \\oplus x_n$ equals $0$.",
    },
    {
      heading: "Constructing the Optimal Winning Move",
      body: "When facing a non-zero Nim-sum $S \\neq 0$ (an N-position), the First Player can always force a win in a single move. To find the winning move, locate the highest set bit $d$ in $S$. Find any pile $i$ whose binary representation has bit $d$ set. Reducing pile $i$ to target size $x_i' = x_i \\oplus S$ is guaranteed to strictly decrease the pile size ($x_i' < x_i$), yielding a valid move that resets the new Nim-sum to exactly $0$ and handing the opponent a losing P-position.",
    },
    {
      heading: "The Sprague-Grundy Theorem Connection",
      body: "The Sprague-Grundy theorem generalizes Nim to ALL finite impartial games under normal play rules. It establishes that every position in an impartial game is equivalent to a single Nim pile of size equal to its Grundy value (or nim-value) $g = \\text{mex}(\\{g_1, g_2, \\dots\\})$, where $\\text{mex}$ is the Minimum Excluded Value of reachable successor states. Concurrently played independent subgames simply XOR their Grundy values together, exactly matching the behavior of Nim piles.",
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
      definition:
        "The bitwise XOR sum of all pile sizes ($S = x_1 \\oplus x_2 \\oplus \\dots \\oplus x_n$).",
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
        "The equivalent Nim pile size of an impartial game position, computed recursively via the minimum excluded value (mex).",
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
    "Nim is the classic impartial combinatorial game solved by the Sprague-Grundy theorem. Computing the Nim-sum—the bitwise XOR sum of all pile sizes:\n$$S = x_1 \\oplus x_2 \\oplus \\dots \\oplus x_n$$\ninstantly determines whether the position is a forced win for the First Player ($S \\neq 0$, N-position) or the Second Player ($S = 0$, P-position), and pinpoints the optimal opening move by targeting a pile $i$ with $x_i' = x_i \\oplus S < x_i$.",
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
    time: "We make one pass over the piles to XOR their sizes together in $\\mathcal{O}(n)$ time, then at most one more pass to locate the winning move pile. No game tree search is required.",
    space:
      "Auxiliary space is $\\mathcal{O}(1)$ because only a single scalar XOR sum register and loop indices are maintained.",
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
