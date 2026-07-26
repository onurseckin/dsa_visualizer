import type { AlgorithmDefinition } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { N_QUEENS_CODE } from "./pythonCode";
import { generateNQueensSteps, type NQueensInput } from "./stepGenerator";

export const DEFAULT_NQUEENS_INPUT: NQueensInput = {
  n: 4,
};

const N_QUEENS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Signature: place n queens on an n by n board so none attacks another, and return every distinct valid arrangement.",
    2: "Build an n by n grid of empty squares to represent the chessboard as it fills in.",
    3: "Three sets tracking which columns and diagonals are already occupied, so checking whether a square is safe costs a constant-time lookup instead of scanning the whole board.",
    4: "Collects a snapshot of every complete, valid board found during the search.",
    6: "The recursive search: try to place a safe queen somewhere in this row, then recurse into the next row.",
    7: "Base case: every row from 0 up to n-1 already holds a queen, so the board is complete.",
    8: "Save a copy of the finished board as one valid solution — a copy, not a reference, since the live board keeps changing as the search backtracks.",
    9: "Stop this branch here; there's nothing left to place, so unwind back up and let the caller try other columns.",
    11: "Try every column in this row as a candidate spot for the current queen.",
    12: "Check all three ways a square can be attacked at once: same column as an existing queen, or on either diagonal of one — row minus col identifies one diagonal direction, row plus col the other.",
    13: "This square is attacked, so skip it without placing anything and move on to the next column — this is the pruning that keeps the search from exploring doomed branches.",
    15: "The square is safe, so commit to placing a queen here.",
    16: "Mark this column as occupied so no later row tries to reuse it.",
    17: "Mark this diagonal (the row-minus-col family) as occupied.",
    18: "Mark the other diagonal (the row-plus-col family) as occupied too — together with cols, these three sets fully describe every square this queen now threatens.",
    20: "Recurse into the next row with this queen locked in, continuing to build on top of this choice.",
    22: "Undo the placement: once everything that could follow from this queen has been explored, clear the square so the next candidate column starts from a clean board.",
    23: "Free this column back up, since a different queen placement two levels up might need it.",
    24: "Free this diagonal, mirroring the add two lines above exactly.",
    25: "Free the other diagonal too — restoring all three sets is what lets the same shared state be reused correctly for every sibling branch.",
    27: "Kick off the search starting from row 0, with the board and all three sets still empty.",
    28: "Hand back every complete, valid arrangement discovered by the search.",
  },
};

export const nQueens: AlgorithmDefinition<NQueensInput> = {
  id: "n-queens",
  title: "N-Queens Backtracking",
  category: "backtracking",
  difficulty: "Hard",
  description:
    "The N-Queens puzzle requires placing N chess queens on an N×N chessboard so that no two queens threaten each other. Using recursive backtracking, queens are placed row by row while maintaining lookup sets for occupied columns and diagonals (row - col and row + col). Invalid placement branches are pruned early.",
  constraints: ["1 <= N <= 9"],
  examples: [
    {
      input: "n = 4",
      output: "2 valid solutions",
      explanation:
        'Solutions: [[".Q..", "...Q", "Q...", "..Q."], ["..Q.", "Q...", "...Q", ".Q.."]]',
    },
    {
      input: "n = 1",
      output: "1 valid solution",
      explanation: "Single queen placed at (0, 0).",
    },
  ],
  code: N_QUEENS_CODE,
  timeComplexity: {
    best: "O(N!)",
    average: "O(N!)",
    worst: "O(N!)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Each row offers up to N columns, but every queen we place removes its column and two diagonals from all later rows — so the branching shrinks roughly like N × (N − 1) × (N − 2) × …, which is why the search tree grows factorially, O(N!). The three conflict sets prune many branches the instant a clash appears, yet in the worst case we still explore a factorial number of partial placements.",
    space:
      "The recursion never goes deeper than N rows, and the column and diagonal sets each hold at most N entries, so working memory grows linearly with N — O(N) beyond the board itself.",
  },
  topicGuide: {
    overview:
      "Backtracking is depth-first search over partial solutions: you extend a candidate one decision at a time, abandon a branch the moment it can no longer lead anywhere valid, and undo that decision before trying the next option. N-Queens is the classic instance, asking you to place N queens on an N by N board so that no two share a row, column, or diagonal. It is worth studying not because chess puzzles are common but because it teaches the three moves that every backtracking solution makes — choose, explore, un-choose — and shows how encoding constraints cleverly turns an astronomical search into an instant one.",
    sections: [
      {
        heading: "Search as a tree of decisions",
        body: 'Stated naively you are choosing N squares out of N squared, which for even a modest board is an unthinkable number of arrangements, and virtually all of them are obviously illegal. The first insight collapses most of that: since two queens in the same row always attack each other, any valid solution has exactly one queen per row, so the real decision is only "which column in row zero, which column in row one", and the search space shrinks to permutations of columns. The second insight is that you can recognise failure on an incomplete board — two queens already clash after three placements, and no fourth queen can repair that — so the entire subtree below that partial board can be discarded unexamined. That discarding is pruning, and it is the reason a search with factorial worst-case size finishes immediately for the sizes you care about.',
      },
      {
        heading: "Turning geometry into set lookups",
        body: "Checking safety by scanning the board costs work proportional to N on every attempt, and you can do far better by giving each threatened line a name. The set cols simply holds the column indices already used. For the diagonals, notice that every square on a descending diagonal shares the same value of row minus col, and every square on an ascending diagonal shares the same value of row plus col, so those two numbers identify the diagonals a square lies on. Placing a queen inserts three keys into three sets, removing it deletes them, and testing a square is three hash lookups regardless of board size. This move — encode a geometric or structural constraint as a hashable number — is the single most transferable trick in the problem.",
      },
      {
        heading: "Choose, explore, un-choose",
        body: "The recursive function backtrack(row) loops over every column in that row, and for each column that passes the three lookups it writes the queen onto the board, inserts the column and two diagonal keys, calls backtrack(row + 1), and then deletes those three keys and clears the square. That final undo is the entire discipline of backtracking: because the board and the sets are shared and mutated in place rather than copied, state must be restored exactly, or the next column in this row inherits ghost queens from a branch you already abandoned. The base case is row equal to N, which means every row now holds a queen and the board is a complete solution, so you record it. Record a copy, not the board itself, since the live board is about to keep changing underneath you.",
      },
      {
        heading: "Why the enumeration is complete and correct",
        body: "The invariant at every entry into backtrack(row) is that rows zero through row minus one each hold exactly one queen, no two of those queens attack each other, and the three sets describe precisely that set of placements and nothing else. Every column of the current row is offered a turn, and a column is skipped only when a lookup proves it collides with a queen that is already down — a collision that no deeper placement could ever undo, because queens are never moved once you have descended past their row. So nothing is pruned unless it is genuinely impossible, and nothing legal is ever skipped, which together mean the recursion enumerates every valid arrangement. Each arrangement is produced exactly once, because it corresponds to one unique root-to-leaf path of column choices.",
      },
      {
        heading: "The bugs everyone writes first",
        body: "Forgetting the un-choose, or undoing in a way that does not exactly mirror the choose, is the number one failure and shows up as too few solutions or as impossible boards being accepted. Appending the live board rather than a deep copy of its rows produces a list of solutions that are all the same object and all wrong by the time the search finishes. Because row minus col can be negative, use it as a hash key or shift it by N minus one if you insist on indexing an array, and never reuse the same set for both diagonal directions. Do not be alarmed that N equal to two and N equal to three yield zero solutions — that is the true answer, not a bug — and remember that reflections and rotations count as distinct solutions in this formulation, which is why N equal to four has two rather than one.",
      },
      {
        heading: "The same skeleton elsewhere",
        body: "Sudoku is this problem with three constraint sets per cell instead of three per queen, word search on a grid is it with a visited mask you set and clear, and permutations, subsets, combination sums, and palindrome partitioning are all the same choose-explore-un-choose loop with a different decision and a different validity test. Graph colouring is the direct generalisation: assign a value to each item such that no conflicting pair matches. Once the skeleton is familiar, the interesting variations are about doing less work — return only the count when the boards are not needed, propagate a boolean up the stack to stop at the first solution, or order the decisions so the most constrained row is filled first, which is the constraint-propagation idea that makes real-world solvers practical.",
      },
    ],
    keyTerms: [
      {
        term: "Backtracking",
        definition:
          "A depth-first exploration of partial solutions that undoes each decision after exploring it, so a single mutable state can be reused across the whole search. It is exhaustive search made affordable by early abandonment.",
      },
      {
        term: "Pruning",
        definition:
          "Discarding an entire branch of the search because the partial solution already violates a constraint. It is what separates backtracking from generating every candidate and filtering at the end.",
      },
      {
        term: "State space tree",
        definition:
          "The conceptual tree whose nodes are partial solutions and whose edges are individual decisions, here one level per board row. The algorithm is simply a depth-first walk of that tree with impossible subtrees cut off.",
      },
      {
        term: "Diagonal identity",
        definition:
          "The observation that row minus col is constant along one diagonal direction and row plus col along the other. It lets a diagonal be represented by a single integer and stored in a hash set.",
      },
      {
        term: "Un-choose",
        definition:
          "The restoration step that reverses a placement after its subtree has been explored, removing the queen and its three constraint keys. Skipping it corrupts the shared state for every sibling branch that follows.",
      },
    ],
  },
  trivia: N_QUEENS_TRIVIA,
  defaultInput: DEFAULT_NQUEENS_INPUT,
  generateSteps: generateNQueensSteps,
};

export default nQueens;
