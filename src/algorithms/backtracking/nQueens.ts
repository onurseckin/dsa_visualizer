import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GridCellNode,
} from '../../types/dsa';

export interface NQueensInput {
  n: number;
}

export const N_QUEENS_CODE = `function solveNQueens(n) {
  const board = Array.from({ length: n }, () => Array(n).fill('.'));
  const cols = new Set(), diag1 = new Set(), diag2 = new Set();
  const solutions = [];

  function backtrack(row) {
    if (row === n) {
      solutions.push(board.map(r => r.join('')));
      return;
    }
    for (let col = 0; col < n; col++) {
      if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) continue;
      board[row][col] = 'Q';
      cols.add(col); diag1.add(row - col); diag2.add(row + col);

      backtrack(row + 1);

      board[row][col] = '.';
      cols.delete(col); diag1.delete(row - col); diag2.delete(row + col);
    }
  }
  backtrack(0);
  return solutions;
}`;

export const DEFAULT_NQUEENS_INPUT: NQueensInput = {
  n: 4,
};

export const generateNQueensSteps = (input: NQueensInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const n = Math.max(1, Math.min(8, input.n || 4));

  const board: string[][] = Array.from({ length: n }, () => Array(n).fill('.'));
  const cols = new Set<number>();
  const diag1 = new Set<number>(); // row - col
  const diag2 = new Set<number>(); // row + col
  let totalSolutions = 0;

  const createGridSnapshot = (
    evalCell?: { r: number; c: number; conflict?: boolean },
    isSolution: boolean = false
  ): GridCellNode[][] => {
    return board.map((rowArr, rIdx) =>
      rowArr.map((cellVal, cIdx) => {
        const cell: GridCellNode = {
          row: rIdx,
          col: cIdx,
          state: 'default',
        };

        if (cellVal === 'Q') {
          if (isSolution) {
            cell.state = 'sorted';
            cell.isPath = true;
          } else {
            cell.isStart = true;
            cell.state = 'active';
          }
        } else if (evalCell && evalCell.r === rIdx && evalCell.c === cIdx) {
          cell.state = evalCell.conflict ? 'swap' : 'compare';
        }

        return cell;
      })
    );
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    evalCell?: { r: number; c: number; conflict?: boolean },
    isSolution: boolean = false,
    extraVars: Record<string, string | number | boolean> = {}
  ) => {
    const queenPositions: string[] = [];
    board.forEach((r, rIdx) => {
      const qCol = r.indexOf('Q');
      if (qCol !== -1) {
        queenPositions.push(`(r:${rIdx}, c:${qCol})`);
      }
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'grid',
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
    `Initialize ${n}-Queens Backtracking Solver`,
    `Goal: Place ${n} non-attacking queens on an ${n}x${n} chessboard.`
  );

  const backtrack = (row: number) => {
    addStep(
      7,
      `Enter backtrack(row = ${row})`,
      row === n
        ? `Reached row ${n}! All ${n} queens placed successfully.`
        : `Attempting to place queen at row ${row}.`,
      undefined,
      false,
      { row }
    );

    if (row === n) {
      totalSolutions++;
      addStep(
        8,
        `Solution #${totalSolutions} Found!`,
        `All ${n} queens placed with no conflicts across rows, columns, or diagonals.`,
        undefined,
        true,
        { row, totalSolutions, isSolution: true }
      );
      return;
    }

    for (let col = 0; col < n; col++) {
      const d1 = row - col;
      const d2 = row + col;
      const hasConflict = cols.has(col) || diag1.has(d1) || diag2.has(d2);

      addStep(
        12,
        `Check position (row ${row}, col ${col})`,
        hasConflict
          ? `Conflict detected at col ${col} or diagonal (d1=${d1}, d2=${d2}). Cannot place Queen.`
          : `Position (row ${row}, col ${col}) is safe! Proceeding to place Queen.`,
        { r: row, c: col, conflict: hasConflict },
        false,
        { row, col, hasConflict }
      );

      if (!hasConflict) {
        board[row][col] = 'Q';
        cols.add(col);
        diag1.add(d1);
        diag2.add(d2);

        addStep(
          13,
          `Place Queen at (row ${row}, col ${col})`,
          `Added queen to board and marked col ${col}, diag1=${d1}, diag2=${d2} as occupied.`,
          { r: row, c: col, conflict: false },
          false,
          { row, col }
        );

        backtrack(row + 1);

        board[row][col] = '.';
        cols.delete(col);
        diag1.delete(d1);
        diag2.delete(d2);

        addStep(
          17,
          `Backtrack: Remove Queen from (row ${row}, col ${col})`,
          `Backtracking from row ${row + 1}. Removed queen from (row ${row}, col ${col}).`,
          { r: row, c: col, conflict: false },
          false,
          { row, col }
        );
      }
    }
  };

  backtrack(0);

  addStep(
    21,
    `N-Queens Solver Completed`,
    `Found a total of ${totalSolutions} distinct valid solution configurations for N = ${n}.`,
    undefined,
    false,
    { n, totalSolutions }
  );

  return steps;
};

export const nQueens: AlgorithmDefinition<NQueensInput> = {
  id: 'n-queens',
  title: 'N-Queens Backtracking',
  category: 'advanced',
  difficulty: 'Hard',
  description:
    'The N-Queens puzzle requires placing N chess queens on an N×N chessboard so that no two queens threaten each other using recursive backtracking.',
  code: N_QUEENS_CODE,
  timeComplexity: {
    best: 'O(N!)',
    average: 'O(N!)',
    worst: 'O(N!)',
  },
  spaceComplexity: 'O(N)',
  defaultInput: DEFAULT_NQUEENS_INPUT,
  generateSteps: generateNQueensSteps,
};
