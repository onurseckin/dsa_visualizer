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
    5: "Blank line separating initialization from internal backtrack helper function.",
    6: "The recursive search: try to place a safe queen somewhere in this row, then recurse into the next row.",
    7: "Base case: every row from 0 up to n-1 already holds a queen, so the board is complete.",
    8: "Save a copy of the finished board as one valid solution — a copy, not a reference, since the live board keeps changing as the search backtracks.",
    9: "Stop this branch here; there's nothing left to place, so unwind back up and let the caller try other columns.",
    10: "Blank line separating base case from column exploration loop.",
    11: "Try every column in this row as a candidate spot for the current queen.",
    12: "Check all three ways a square can be attacked at once: same column as an existing queen, or on either diagonal of one — row minus col identifies one diagonal direction, row plus col the other.",
    13: "This square is attacked, so skip it without placing anything and move on to the next column — this is the pruning that keeps the search from exploring doomed branches.",
    14: "Blank line separating safety check from state updates.",
    15: "The square is safe, so commit to placing a queen here.",
    16: "Mark this column as occupied so no later row tries to reuse it.",
    17: "Mark this diagonal (the row-minus-col family) as occupied.",
    18: "Mark the other diagonal (the row-plus-col family) as occupied too — together with cols, these three sets fully describe every square this queen now threatens.",
    19: "Blank line separating state modification from recursive call.",
    20: "Recurse into the next row with this queen locked in, continuing to build on top of this choice.",
    21: "Blank line separating recursive call from backtracking restoration steps.",
    22: "Undo the placement: once everything that could follow from this queen has been explored, clear the square so the next candidate column starts from a clean board.",
    23: "Free this column back up, since a different queen placement two levels up might need it.",
    24: "Free this diagonal, mirroring the add two lines above exactly.",
    25: "Free the other diagonal too — restoring all three sets is what lets the same shared state be reused correctly for every sibling branch.",
    26: "Blank line separating backtrack definition from main function execution.",
    27: "Kick off the search starting from row 0, with the board and all three sets still empty.",
    28: "Hand back every complete, valid arrangement discovered by the search.",
  },
};

export const nQueens: AlgorithmDefinition<NQueensInput> = {
  id: "n-queens",
  title: "N-Queens Backtracking",
  topicIds: ["backtracking"],
  difficulty: "Hard",
  description:
    "<p>The <strong>N-Queens</strong> puzzle requires placing N chess queens on an N×N chessboard so that no two queens threaten each other. Using recursive backtracking, queens are placed row by row while maintaining constant-time lookup sets for occupied columns and diagonals (<code>row - col</code> and <code>row + col</code>). Invalid placement branches are pruned early before exploring doomed subtrees.</p>",
  constraints: ["1 <= N <= 9"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "n = 4",
      outputDisplay: "2 solutions",
      title: "Basic Example",
      input: { n: 4 },
      output: "2 valid solutions",
      explanation: "Standard 4x4 chessboard has 2 distinct non-attacking queen configurations.",
    },
    {
      kind: "complex",
      inputDisplay: "n = 5",
      outputDisplay: "10 solutions",
      title: "Complex Edge Case",
      input: { n: 6 },
      output: "4 valid solutions",
      explanation:
        "6x6 chessboard with deeper recursion and multiple diagonal constraint pruning steps.",
    },
    {
      kind: "negative",
      inputDisplay: "n = 3",
      outputDisplay: "0 solutions",
      title: "Failing / Boundary Case",
      input: { n: 3 },
      output: "0 valid solutions",
      explanation:
        "No valid non-attacking placement exists for N=3 (or N=2); all branch attempts lead to immediate diagonal or column attacks.",
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
      "<p>Backtracking is depth-first search over partial solutions: you extend a candidate one decision at a time, abandon a branch the moment it can no longer lead anywhere valid, and undo that decision before trying the next option. <strong>N-Queens</strong> is the classic instance, asking you to place <code>N</code> queens on an <code>N×N</code> board so that no two share a row, column, or diagonal.</p><p>It is worth studying because it teaches the three core actions that every backtracking algorithm makes — <em>choose</em>, <em>explore</em>, <em>un-choose</em> — and shows how encoding constraints turns an exponential search into an efficient traversal.</p>",
    sections: [
      {
        heading: "Search as a tree of decisions",
        body: "<p>Stated naively, you are choosing <code>N</code> squares out of <code>N²</code>, which creates an enormous search space where virtually all placements are illegal. The first key insight collapses most of that space: since two queens in the same row always attack each other, any valid solution has exactly one queen per row. The decision reduces to selecting a column for each row in sequence.</p><p>The second insight is early pruning: if two queens clash on an incomplete board, no deeper placement can fix the conflict. We discard the entire subtree below that invalid state immediately.</p>",
      },
      {
        heading: "Turning geometry into set lookups",
        body: "<p>Checking safety by scanning the board costs <code>O(N)</code> work on every step. Instead, we can identify threatened lines using hash sets. The <code>cols</code> set tracks occupied columns. For diagonals, every cell on a major diagonal shares a constant <code>row - col</code>, while every cell on a minor diagonal shares a constant <code>row + col</code>.</p><p>Placing a queen inserts three keys into hash sets; removing the queen deletes them. Safety testing becomes three <code>O(1)</code> hash lookups regardless of board size.</p>",
      },
      {
        heading: "Choose, explore, un-choose",
        body: "<p>The recursive search iterates through every column in the current row. For each valid column, it places a queen, updates the column and diagonal sets, recurses to <code>row + 1</code>, and then removes the queen and set keys. That final restoration is essential: because state is shared across recursive frames, every branch must clean up after itself so sibling branches start with a clean board.</p><p>When <code>row === N</code>, all rows contain safe queens. We save a deep copy of the board as a valid solution.</p>",
      },
      {
        heading: "Why the enumeration is complete and correct",
        body: "<p>The invariant at <code>backtrack(row)</code> is that all rows prior to <code>row</code> hold mutually safe queens, and the set lookups accurately reflect their coverage. A column is skipped only when a lookup proves an immediate conflict — a conflict no deeper placement can resolve. Thus, no valid configuration is skipped, and every solution corresponds to a unique root-to-leaf path in the decision tree.</p>",
      },
      {
        heading: "The bugs everyone writes first",
        body: "<p>Common bugs include omitting the un-choose step or mutating shared state without restoring it, which produces ghost conflicts in subsequent branches. Storing a reference to the live board instead of creating a deep copy results in duplicate corrupted entries. Finally, since <code>row - col</code> can be negative, offset the key if using an array-based lookup table.</p>",
      },
      {
        heading: "The same skeleton elsewhere",
        body: "<p>This choose-explore-un-choose pattern extends directly to Sudoku solver, subset generation, permutation building, and graph coloring problems. Once the core skeleton is clear, optimization techniques like ordering decisions by the most constrained variables (minimum remaining values heuristic) make real-world constraint satisfaction solvers fast.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Backtracking",
        definition:
          "A depth-first exploration of partial solutions that undoes each decision after exploring it, so a single mutable state can be reused across the whole search.",
      },
      {
        term: "Pruning",
        definition:
          "Discarding an entire branch of the search tree the moment a partial solution violates a constraint.",
      },
      {
        term: "State Space Tree",
        definition:
          "The conceptual tree whose nodes are partial solutions and whose edges represent individual placement decisions.",
      },
      {
        term: "Diagonal Identity",
        definition:
          "The invariant that row - col is constant along major diagonals and row + col is constant along minor diagonals.",
      },
      {
        term: "Un-choose",
        definition:
          "The restoration step that reverses a placement and frees constraint set keys after subtrees have been fully explored.",
      },
    ],
  },
  trivia: N_QUEENS_TRIVIA,
  leetcode: {
    id: 51,
    url: "https://leetcode.com/problems/n-queens/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #51",
      leetcodeId: 51,
      url: "https://leetcode.com/problems/n-queens/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 5",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 5,
      section: "5.3 Backtracking",
    },
  ],
  defaultInput: DEFAULT_NQUEENS_INPUT,
  generateSteps: generateNQueensSteps,
};

export default nQueens;
