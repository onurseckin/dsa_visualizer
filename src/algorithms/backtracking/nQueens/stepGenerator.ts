import type { AlgorithmStep, GridCellNode } from "../../../types/dsa";

export interface NQueensInput {
  n: number;
}

export const generateNQueensSteps = (input: NQueensInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const n = Math.max(1, Math.min(8, input.n || 4));

  const board: string[][] = Array.from({ length: n }, () => Array(n).fill("."));
  const cols = new Set<number>();
  const diag1 = new Set<number>();
  const diag2 = new Set<number>();
  let totalSolutions = 0;

  const createGridSnapshot = (
    evalCell?: { r: number; c: number; conflict?: boolean },
    isSolution: boolean = false,
  ): GridCellNode[][] => {
    return board.map((rowArr, rIdx) =>
      rowArr.map((cellVal, cIdx) => {
        const cell: GridCellNode = {
          row: rIdx,
          col: cIdx,
          state: "default",
        };

        if (cellVal === "Q") {
          if (isSolution) {
            cell.state = "sorted";
            cell.isPath = true;
          } else {
            cell.isStart = true;
            cell.state = "active";
          }
        } else if (evalCell && evalCell.r === rIdx && evalCell.c === cIdx) {
          cell.state = evalCell.conflict ? "swap" : "compare";
        }

        return cell;
      }),
    );
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    evalCell?: { r: number; c: number; conflict?: boolean },
    isSolution: boolean = false,
    extraVars: Record<string, string | number | boolean> = {},
  ) => {
    const queenPositions: string[] = [];
    board.forEach((r, rIdx) => {
      const qCol = r.indexOf("Q");
      if (qCol !== -1) {
        queenPositions.push(`(r:${rIdx}, c:${qCol})`);
      }
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "grid",
        grid: createGridSnapshot(evalCell, isSolution),
      },
      auxiliaryState: {
        stack: queenPositions,
        visited: Array.from(cols).map((c) => `col-${c}`),
        customState: {
          n,
          activeQueens: queenPositions.length,
          solutionsFound: totalSolutions,
        },
      },
      variables: {
        n,
        solutionsFound: totalSolutions,
        ...extraVars,
      },
    });
  };

  addStep(
    1,
    `Set up the ${n}-queens board`,
    `We need ${n} queens on a ${n}x${n} board with none able to attack another. We'll place them one row at a time and undo any choice that leads to a dead end — that undo is the backtracking.`,
  );

  const backtrack = (row: number) => {
    addStep(
      6,
      row === n ? `All ${n} rows are filled` : `Try to fill row ${row}`,
      row === n
        ? `We've placed a queen in every row without a single conflict — this arrangement is a complete solution.`
        : `Every earlier row already holds a safe queen, so now we scan row ${row} for a column that no existing queen attacks.`,
      undefined,
      false,
      { row },
    );

    if (row === n) {
      totalSolutions++;
      addStep(
        8,
        `Record solution #${totalSolutions}`,
        `This board is a valid answer, so we save a copy of it. Then we backtrack anyway — other arrangements may still be out there.`,
        undefined,
        true,
        { row, totalSolutions, isSolution: true },
      );
      return;
    }

    for (let col = 0; col < n; col++) {
      const d1 = row - col;
      const d2 = row + col;
      const hasConflict = cols.has(col) || diag1.has(d1) || diag2.has(d2);

      addStep(
        12,
        `Check square (row ${row}, col ${col})`,
        hasConflict
          ? `A queen already covers column ${col} or one of this square's diagonals, so placing here would mean an attack. We skip it without searching any deeper — that's the pruning that keeps this feasible.`
          : `Column ${col} and both diagonals through this square are clear, so a queen here is safe alongside everything placed so far.`,
        { r: row, c: col, conflict: hasConflict },
        false,
        { row, col, hasConflict },
      );

      if (!hasConflict) {
        board[row][col] = "Q";
        cols.add(col);
        diag1.add(d1);
        diag2.add(d2);

        addStep(
          15,
          `Place a queen at (row ${row}, col ${col})`,
          `The square is safe, so the queen goes down and we mark column ${col} and diagonals ${d1} and ${d2} as taken. Those three sets are what let every future safety check run in constant time.`,
          { r: row, c: col, conflict: false },
          false,
          { row, col },
        );

        backtrack(row + 1);

        board[row][col] = ".";
        cols.delete(col);
        diag1.delete(d1);
        diag2.delete(d2);

        addStep(
          22,
          `Remove the queen from (row ${row}, col ${col})`,
          `We've explored everything that follows from this placement, so we lift the queen and free its column and diagonals. Now the next column in row ${row} gets its turn.`,
          { r: row, c: col, conflict: false },
          false,
          { row, col },
        );
      }
    }
  };

  backtrack(0);

  addStep(
    28,
    `Search complete: ${totalSolutions} solution${totalSolutions === 1 ? "" : "s"} found`,
    `Every branch of the search tree has now been explored or pruned, giving ${totalSolutions} distinct arrangement${totalSolutions === 1 ? "" : "s"} for N = ${n}. The tree is factorial-sized in theory, but pruning let us skip most of it.`,
    undefined,
    false,
    { n, totalSolutions },
  );

  return steps;
};
