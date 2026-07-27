import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { NIM_GAME_CODE } from "./pythonCode";
import { generateNimGameSteps, type NimInput } from "./stepGenerator";

export const DEFAULT_NIM_INPUT: NimInput = {
  piles: [3, 4, 5],
};

const NIM_GAME_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Nim is the reference example of an impartial combinatorial game: several piles of objects sit on the table, a move removes any positive number of objects from exactly one pile, and the player who cannot move loses. Its entire theory collapses into one number, the Nim-sum, which is the bitwise XOR of all the pile sizes and tells you both who wins under perfect play and what move to make. Studying it teaches you to evaluate a game with algebra instead of searching a game tree, which is the difference between an instant answer and an exponential one. The Sprague-Grundy theorem then extends that same algebra to essentially every impartial game, which is why Nim is where game theory for programmers begins.",
  sections: [
    {
      heading: "Positions, and what winning actually means",
      body: "Under the normal play convention the player who makes the last move wins, so being unable to move is losing. That lets you classify every position as one of two kinds without any reference to strategy: a position is losing for whoever must move if every available move hands the opponent a winning position, and it is winning if at least one move hands the opponent a losing one. These are traditionally called P-positions, good for the previous player, and N-positions, good for the next player. The definition is recursive and perfectly correct, and you could evaluate it by exploring the game tree bottom up, but the tree explodes because a single pile of size k already offers k moves. What Bouton discovered is that for Nim this recursive classification has a closed form, so the whole search evaporates.",
    },
    {
      heading: "The Nim-sum test and the move it hands you",
      body: "Compute the XOR of every pile size and call it the Nim-sum. If it is zero the player about to move loses against a perfect opponent, and if it is non-zero that player wins. The winning move is constructive rather than mysterious: look at the highest set bit of the Nim-sum, find a pile whose size also has that bit set, and reduce that pile to its size XOR the Nim-sum, which is guaranteed to be strictly smaller and leaves the total XOR at zero. In practice you can simply test every pile and take the first one whose size XOR the Nim-sum is smaller than the pile, which is exactly what this implementation does. The intuition behind the bits is worth holding on to: bit k of the Nim-sum is 1 precisely when an odd number of piles have that bit set, so a Nim-sum of zero means every power of two is paired off evenly across the piles.",
    },
    {
      heading: "Why zero is exactly the losing set",
      body: "The proof is two short observations that together satisfy the recursive definition. From a position with Nim-sum zero, any legal move changes exactly one pile, and changing a number necessarily flips at least one of its bits, so the new Nim-sum cannot still be zero; every move out of zero lands on non-zero. From a position with non-zero Nim-sum there is always a move back to zero, namely the reduction described above, which is legal precisely because XOR-ing with a value whose highest set bit is also set in the pile makes the pile smaller. So zero positions offer only moves to non-zero, and non-zero positions offer at least one move to zero, which is the definition of losing and winning respectively. Termination is guaranteed because every move strictly decreases the total number of objects, and the empty board, which has Nim-sum zero, is the terminal losing position. The winner therefore simply restores a Nim-sum of zero after each opponent move until the opponent faces an empty table.",
    },
    {
      heading: "From Nim to every impartial game",
      body: "The Sprague-Grundy theorem says that any position in an impartial game under normal play behaves exactly like a single Nim pile, whose size is called the Grundy value of the position. You compute it recursively as the minimum excludant, or mex, of the Grundy values of all positions reachable in one move, meaning the smallest non-negative integer not appearing among them. A Nim pile of size k has Grundy value k, and a terminal position has Grundy value 0, which is why zero means losing in general and not just in Nim. The second half of the theorem is the part that makes it practical: when a game splits into independent components played side by side, the Grundy value of the whole is the XOR of the components. So for a subtraction game, a row of coins, or a strip of Kayles, you tabulate Grundy values for one component with dynamic programming and then XOR across components exactly as you XOR pile sizes here.",
    },
    {
      heading: "Pitfalls and the limits of the theory",
      body: "Everything above assumes the game is impartial, meaning both players have the same moves available from any position, and that it uses normal play. Misere Nim, where taking the last object loses, has a genuinely different answer: if every pile has size one, the parity of the number of piles decides it, and otherwise the winner is the same as in normal play but the endgame is handled differently. Games where the two players have different move sets, chess and checkers among them, are partizan and lie outside Grundy theory entirely. Smaller traps are easy to trip on in code: empty piles contribute nothing to the XOR and are not a legal source of a move, so they can be ignored but not counted; and when hunting for the winning pile you must require the target size to be strictly smaller than the pile, since equal would mean removing nothing, which is not a legal move.",
    },
    {
      heading: "Where this shows up in practice",
      body: "Subtraction games, where each move removes a size from a fixed allowed set, are the standard first exercise, and their Grundy values are periodic in a way you discover by tabulating a few dozen positions. Staircase Nim maps a seemingly different game about sliding coins along a strip onto plain Nim by noticing that only the piles at alternating distances matter. Coin-turning games such as Turning Turtles reduce to Nim by treating each face-up coin position as a pile, and Green Hackenbush reduces tree pruning to XOR of branch values. The habit these all reward is the same: look for independent components, compute a Grundy value for each, XOR them, and only then think about the specific move. If the components are not independent, the theory does not apply and you are back to explicit search over states, which is a useful signal in itself.",
    },
  ],
  keyTerms: [
    {
      term: "Impartial game",
      definition:
        "A two-player game where the set of legal moves depends only on the position, not on whose turn it is, and there is no chance or hidden information. Nim is impartial, which is what makes Grundy theory apply.",
    },
    {
      term: "Nim-sum",
      definition:
        "The bitwise XOR of all pile sizes. Its value alone decides the outcome, because zero means the player to move loses and anything else means that player has a winning move.",
    },
    {
      term: "P-position and N-position",
      definition:
        "A P-position is losing for the player about to move, so it favours the previous player, while an N-position favours the next player. In Nim the P-positions are exactly those with a Nim-sum of zero.",
    },
    {
      term: "Grundy value",
      definition:
        "The size of the single Nim pile a position is equivalent to, computed as the mex of the Grundy values of its options. A value of zero marks a losing position.",
    },
    {
      term: "Mex",
      definition:
        "The minimum excludant of a set of non-negative integers, meaning the smallest one absent from the set. It is the operation that turns the Grundy values of a position options into the value of the position itself.",
    },
    {
      term: "Normal play convention",
      definition:
        "The rule that a player with no legal move loses, so the last player to move wins. Reversing it gives misere play, where the analysis of Nim changes.",
    },
  ],
};

const NIM_GAME_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines the function signature, taking the list of pile sizes for this Nim position.",
    2: "Initializes the running Nim-sum to 0 before any pile has been folded in.",
    3: "Caches the number of piles, used to bound both upcoming loops.",
    4: "Begins the first pass, which XORs every pile size together to compute the Nim-sum.",
    5: "Folds pile i into the running total; the value left after all piles are XORed together is the Nim-sum that alone decides who wins.",
    7: "Checks whether the Nim-sum came out to exactly zero, which by the Sprague-Grundy result for Nim means the player about to move is already losing.",
    8: "Reports a Second Player win: with a zero Nim-sum every legal move makes the sum non-zero, so no move here can help the First Player.",
    10: "Starts a second pass over the piles, this time hunting for the specific move that restores a zero Nim-sum.",
    11: "Computes the size pile i would need to shrink to (its size XORed with the Nim-sum) in order to zero out the total.",
    12: "Checks whether that target size is strictly smaller than the current pile — only shrinking a pile is a legal Nim move, so a larger or equal target is not usable.",
    13: "Begins building the result once a pile that can legally reach the target size is found.",
    14: "Records that the First Player wins this position.",
    15: "Records which pile index holds the winning move.",
    16: "Records the size that pile should be reduced to.",
    17: "Records how many objects must be removed to reach that target size.",
    18: "Closes the dictionary describing the winning move.",
    20: "A fallback return for Second Player — unreachable once the Nim-sum is confirmed non-zero, since a winning pile is always guaranteed to exist, but it keeps the function total.",
  },
};

export const nimGame: AlgorithmDefinition<NimInput> = {
  id: "nim-game",
  title: "Nim Game Sprague-Grundy",
  category: "game_theory",
  difficulty: "Easy",
  description:
    "Nim is the classic impartial game solved by the Sprague-Grundy theorem. Computing the Nim-sum — the bitwise XOR of all pile sizes — instantly reveals whether the position is a forced win for the First Player (non-zero) or the Second Player (zero), and pinpoints the optimal opening move.",
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
    time: "We make one pass over the piles to XOR their sizes together, then at most one more pass to find a pile whose size shrinks when XOR-ed with the Nim-sum. Both passes do constant work per pile, so the total is linear in the number of piles — O(n). Notably, no game tree is ever explored; the XOR identity replaces all of that search.",
    space:
      "All we carry is a single running XOR value and a couple of loop variables, so extra memory stays constant at O(1) no matter how many piles there are.",
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
