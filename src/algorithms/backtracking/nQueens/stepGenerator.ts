import type { AlgorithmStep, GridCellNode, PrimaryVisualSnapshot } from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

export interface NQueensInput {
  n: number;
}

export const DEFAULT_NQUEENS_INPUT: NQueensInput = {
  n: 4,
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The N-Queens puzzle places N chess queens on an N x N chessboard so that no two queens attack each other horizontally, vertically, or diagonally.",
    primarySnapshot: {
      kind: "grid",
      name: "4x4 Board",
      grid: [
        [
          { row: 0, col: 0, state: "default" },
          { row: 0, col: 1, state: "active" },
          { row: 0, col: 2, state: "default" },
          { row: 0, col: 3, state: "default" },
        ],
        [
          { row: 1, col: 0, state: "default" },
          { row: 1, col: 1, state: "default" },
          { row: 1, col: 2, state: "default" },
          { row: 1, col: 3, state: "active" },
        ],
        [
          { row: 2, col: 0, state: "active" },
          { row: 2, col: 1, state: "default" },
          { row: 2, col: 2, state: "default" },
          { row: 2, col: 3, state: "default" },
        ],
        [
          { row: 3, col: 0, state: "default" },
          { row: 3, col: 1, state: "default" },
          { row: 3, col: 2, state: "active" },
          { row: 3, col: 3, state: "default" },
        ],
      ],
    },
  },
  {
    narrative:
      "Search Space Reduction: placing N queens freely across N^2 squares yields binomial combinations. Restricting to exactly one queen per row reduces search space to N^N.",
    primarySnapshot: {
      kind: "grid",
      name: "One Queen Per Row",
      grid: [
        [
          { row: 0, col: 0, state: "active" },
          { row: 0, col: 1, state: "default" },
          { row: 0, col: 2, state: "default" },
          { row: 0, col: 3, state: "default" },
        ],
        [
          { row: 1, col: 0, state: "default" },
          { row: 1, col: 1, state: "default" },
          { row: 1, col: 2, state: "active" },
          { row: 1, col: 3, state: "default" },
        ],
        [
          { row: 2, col: 0, state: "default" },
          { row: 2, col: 1, state: "default" },
          { row: 2, col: 2, state: "default" },
          { row: 2, col: 3, state: "default" },
        ],
        [
          { row: 3, col: 0, state: "default" },
          { row: 3, col: 1, state: "default" },
          { row: 3, col: 2, state: "default" },
          { row: 3, col: 3, state: "default" },
        ],
      ],
    },
  },
  {
    narrative:
      "O(1) Conflict Lookup Sets: track occupied columns (cols), major diagonals (row - col), and minor diagonals (row + col) to test square safety in constant time.",
    primarySnapshot: {
      kind: "grid",
      name: "Diagonals & Columns",
      grid: [
        [
          { row: 0, col: 0, state: "active" },
          { row: 0, col: 1, state: "pivot" },
          { row: 0, col: 2, state: "default" },
          { row: 0, col: 3, state: "default" },
        ],
        [
          { row: 1, col: 0, state: "pivot" },
          { row: 1, col: 1, state: "swap" },
          { row: 1, col: 2, state: "default" },
          { row: 1, col: 3, state: "default" },
        ],
        [
          { row: 2, col: 0, state: "default" },
          { row: 2, col: 1, state: "default" },
          { row: 2, col: 2, state: "swap" },
          { row: 2, col: 3, state: "default" },
        ],
        [
          { row: 3, col: 0, state: "default" },
          { row: 3, col: 1, state: "default" },
          { row: 3, col: 2, state: "default" },
          { row: 3, col: 3, state: "swap" },
        ],
      ],
    },
  },
  {
    narrative:
      "Early Subtree Pruning: if candidate cell (row, col) conflicts with an active queen in cols or diagonals, abandon the branch immediately without placing further queens.",
    primarySnapshot: {
      kind: "grid",
      name: "Conflict Pruned",
      grid: [
        [
          { row: 0, col: 1, state: "active" },
          { row: 0, col: 0, state: "default" },
          { row: 0, col: 2, state: "default" },
          { row: 0, col: 3, state: "default" },
        ],
        [
          { row: 1, col: 1, state: "swap" },
          { row: 1, col: 0, state: "default" },
          { row: 1, col: 2, state: "default" },
          { row: 1, col: 3, state: "default" },
        ],
        [
          { row: 2, col: 0, state: "default" },
          { row: 2, col: 1, state: "default" },
          { row: 2, col: 2, state: "default" },
          { row: 2, col: 3, state: "default" },
        ],
        [
          { row: 3, col: 0, state: "default" },
          { row: 3, col: 1, state: "default" },
          { row: 3, col: 2, state: "default" },
          { row: 3, col: 3, state: "default" },
        ],
      ],
    },
  },
  {
    narrative:
      "The Choose Step: place queen at (row, col) and register col, row - col, and row + col into occupied lookup sets.",
    primarySnapshot: {
      kind: "grid",
      name: "Placed Queen",
      grid: [
        [
          { row: 0, col: 0, state: "active" },
          { row: 0, col: 1, state: "default" },
          { row: 0, col: 2, state: "default" },
          { row: 0, col: 3, state: "default" },
        ],
        [
          { row: 1, col: 0, state: "default" },
          { row: 1, col: 1, state: "default" },
          { row: 1, col: 2, state: "active" },
          { row: 1, col: 3, state: "default" },
        ],
        [
          { row: 2, col: 0, state: "default" },
          { row: 2, col: 1, state: "default" },
          { row: 2, col: 2, state: "default" },
          { row: 2, col: 3, state: "default" },
        ],
        [
          { row: 3, col: 0, state: "default" },
          { row: 3, col: 1, state: "default" },
          { row: 3, col: 2, state: "default" },
          { row: 3, col: 3, state: "default" },
        ],
      ],
    },
  },
  {
    narrative:
      "Recursive Exploration: recurse to row + 1 to find a non-conflicting column position for the next queen.",
    primarySnapshot: {
      kind: "grid",
      name: "Recurse Row 2",
      grid: [
        [
          { row: 0, col: 0, state: "visited" },
          { row: 0, col: 1, state: "default" },
          { row: 0, col: 2, state: "default" },
          { row: 0, col: 3, state: "default" },
        ],
        [
          { row: 1, col: 2, state: "visited" },
          { row: 1, col: 0, state: "default" },
          { row: 1, col: 1, state: "default" },
          { row: 1, col: 3, state: "default" },
        ],
        [
          { row: 2, col: 0, state: "compare" },
          { row: 2, col: 1, state: "default" },
          { row: 2, col: 2, state: "default" },
          { row: 2, col: 3, state: "default" },
        ],
        [
          { row: 3, col: 0, state: "default" },
          { row: 3, col: 1, state: "default" },
          { row: 3, col: 2, state: "default" },
          { row: 3, col: 3, state: "default" },
        ],
      ],
    },
  },
  {
    narrative:
      "Backtracking Un-Choose Step: after fully exploring subtrees below (row, col), remove queen and erase lookup set entries so sibling branches search a clean board.",
    primarySnapshot: {
      kind: "grid",
      name: "Un-Choose Backtrack",
      grid: [
        [
          { row: 0, col: 0, state: "visited" },
          { row: 0, col: 1, state: "default" },
          { row: 0, col: 2, state: "default" },
          { row: 0, col: 3, state: "default" },
        ],
        [
          { row: 1, col: 0, state: "default" },
          { row: 1, col: 1, state: "default" },
          { row: 1, col: 2, state: "default" },
          { row: 1, col: 3, state: "default" },
        ],
        [
          { row: 2, col: 0, state: "default" },
          { row: 2, col: 1, state: "default" },
          { row: 2, col: 2, state: "default" },
          { row: 2, col: 3, state: "default" },
        ],
        [
          { row: 3, col: 0, state: "default" },
          { row: 3, col: 1, state: "default" },
          { row: 3, col: 2, state: "default" },
          { row: 3, col: 3, state: "default" },
        ],
      ],
    },
  },
  {
    narrative:
      "Solution Verification & Complexity: reaching row = N confirms all N queens are placed safely, delivering O(N) space and factorially bounded O(N!) time execution.",
    primarySnapshot: {
      kind: "grid",
      name: "Solution Complete",
      grid: [
        [
          { row: 0, col: 1, state: "sorted" },
          { row: 0, col: 0, state: "default" },
          { row: 0, col: 2, state: "default" },
          { row: 0, col: 3, state: "default" },
        ],
        [
          { row: 1, col: 3, state: "sorted" },
          { row: 1, col: 0, state: "default" },
          { row: 1, col: 1, state: "default" },
          { row: 1, col: 2, state: "default" },
        ],
        [
          { row: 2, col: 0, state: "sorted" },
          { row: 2, col: 1, state: "default" },
          { row: 2, col: 2, state: "default" },
          { row: 2, col: 3, state: "default" },
        ],
        [
          { row: 3, col: 2, state: "sorted" },
          { row: 3, col: 0, state: "default" },
          { row: 3, col: 1, state: "default" },
          { row: 3, col: 3, state: "default" },
        ],
      ],
    },
  },
];

export const generateNQueensSteps = (input: NQueensInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nVal = typeof input?.n === "number" && input.n > 0 ? input.n : DEFAULT_NQUEENS_INPUT.n;
  const n = Math.max(1, Math.min(8, nVal));

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  for (const intro of createIntroSnapshots()) {
    addStep(intro.narrative, intro.primarySnapshot, "intro");
  }

  const board: string[][] = Array.from({ length: n }, () => Array(n).fill("."));
  const cols = new Set<number>();
  const diag1 = new Set<number>();
  const diag2 = new Set<number>();
  let totalSolutions = 0;

  const createGridSnapshot = (
    evalCell?: { r: number; c: number; conflict?: boolean },
    isSolution: boolean = false,
  ): PrimaryVisualSnapshot => {
    const grid: GridCellNode[][] = board.map((rowArr, rIdx) =>
      rowArr.map((cellVal, cIdx) => {
        const cell: GridCellNode = {
          row: rIdx,
          col: cIdx,
          state: "default",
        };

        if (cellVal === "Q") {
          cell.state = isSolution ? "sorted" : "active";
        } else if (evalCell && evalCell.r === rIdx && evalCell.c === cIdx) {
          cell.state = evalCell.conflict ? "swap" : "compare";
        }

        return cell;
      }),
    );

    return {
      kind: "grid",
      name: `Chessboard (${n}x${n})`,
      grid,
    };
  };

  addStep(
    `Having established the mental model, let's now transition to solving the ${n}-Queens puzzle on an empty ${n}x${n} chessboard.`,
    createGridSnapshot(undefined),
  );

  const backtrack = (row: number) => {
    if (row === n) {
      totalSolutions++;
      addStep(
        `Valid arrangement found! Solution #${totalSolutions}: placed ${n} non-attacking queens successfully across all rows.`,
        createGridSnapshot(undefined, true),
      );
      return;
    }

    for (let col = 0; col < n; col++) {
      const d1 = row - col;
      const d2 = row + col;
      const hasConflict = cols.has(col) || diag1.has(d1) || diag2.has(d2);

      if (hasConflict) {
        addStep(
          `Evaluating cell (row ${row}, col ${col}): CONFLICT detected in column or diagonals! Pruning subtree branch immediately.`,
          createGridSnapshot({ r: row, c: col, conflict: true }),
        );
      } else {
        addStep(
          `Evaluating cell (row ${row}, col ${col}): square is CLEAR and safe from all active queens.`,
          createGridSnapshot({ r: row, c: col, conflict: false }),
        );

        board[row][col] = "Q";
        cols.add(col);
        diag1.add(d1);
        diag2.add(d2);

        addStep(
          `Placed Queen at cell (row ${row}, col ${col}): registered column ${col} and diagonals (${d1}, ${d2}) into lookup sets.`,
          createGridSnapshot(undefined),
        );

        backtrack(row + 1);

        board[row][col] = ".";
        cols.delete(col);
        diag1.delete(d1);
        diag2.delete(d2);

        addStep(
          `Backtracked from cell (row ${row}, col ${col}): removed Queen and un-marked column ${col} and diagonals from lookup sets.`,
          createGridSnapshot({ r: row, c: col, conflict: false }),
        );
      }
    }
  };

  backtrack(0);

  addStep(
    `N-Queens Backtracking complete! Located ${totalSolutions} total valid non-attacking solution(s) on a ${n}x${n} chessboard.`,
    createGridSnapshot(undefined, totalSolutions > 0),
  );

  return steps;
};

export default generateNQueensSteps;
