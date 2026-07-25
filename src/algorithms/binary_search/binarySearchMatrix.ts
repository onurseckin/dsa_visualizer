import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GridCellNode,
} from '../../types/dsa';

export interface BinarySearchMatrixInput {
  matrix: number[][];
  target: number;
}

export const BINARY_SEARCH_MATRIX_CODE = `function searchMatrix(matrix, target) {
  if (!matrix || matrix.length === 0) return false;
  const m = matrix.length;
  const n = matrix[0].length;
  let low = 0, high = m * n - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const row = Math.floor(mid / n);
    const col = mid % n;
    const midVal = matrix[row][col];

    if (midVal === target) return true;
    if (midVal < target) low = mid + 1;
    else high = mid - 1;
  }
  return false;
}`;

export const DEFAULT_BINARY_SEARCH_MATRIX_INPUT: BinarySearchMatrixInput = {
  matrix: [
    [1, 3, 5, 7],
    [10, 11, 16, 20],
    [23, 30, 34, 60],
  ],
  target: 3,
};

export const generateBinarySearchMatrixSteps = (
  input: BinarySearchMatrixInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const { matrix, target } = input;

  if (!matrix || matrix.length === 0 || matrix[0].length === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 2,
      explanation: {
        what: 'Check matrix bounds',
        why: 'Matrix is empty, target cannot be found.',
      },
      primarySnapshot: {
        kind: 'grid',
        grid: [],
      },
      auxiliaryState: { customState: { result: 'false' } },
      variables: { target, found: false },
    });
    return steps;
  }

  const rows = matrix.length;
  const cols = matrix[0].length;
  const totalElements = rows * cols;

  const createGridState = (
    low: number,
    high: number,
    mid?: number,
    foundCoord?: { r: number; c: number }
  ): GridCellNode[][] => {
    return matrix.map((rowArr, rIdx) =>
      rowArr.map((val, cIdx) => {
        const flatIdx = rIdx * cols + cIdx;
        const cell: GridCellNode = {
          row: rIdx,
          col: cIdx,
          distance: val,
          state: 'default',
        };

        if (foundCoord && foundCoord.r === rIdx && foundCoord.c === cIdx) {
          cell.state = 'sorted';
          cell.isPath = true;
        } else if (mid !== undefined && flatIdx === mid) {
          cell.state = 'active';
        } else if (flatIdx >= low && flatIdx <= high) {
          cell.state = 'compare';
        } else {
          cell.isVisited = true;
        }

        return cell;
      })
    );
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    low: number,
    high: number,
    mid?: number,
    foundCoord?: { r: number; c: number },
    extraVars: Record<string, string | number | boolean> = {}
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'grid',
        grid: createGridState(low, high, mid, foundCoord),
      },
      auxiliaryState: {
        customState: {
          low,
          high,
          mid: mid !== undefined ? mid : 'N/A',
          target,
        },
      },
      variables: {
        low,
        high,
        target,
        ...extraVars,
      },
    });
  };

  addStep(
    4,
    `Initialize 2D Binary Search on ${rows}x${cols} matrix`,
    `Total elements: ${totalElements}. Initial search bounds: low = 0, high = ${totalElements - 1}.`,
    0,
    totalElements - 1
  );

  let low = 0;
  let high = totalElements - 1;
  let found = false;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const r = Math.floor(mid / cols);
    const c = mid % cols;
    const midVal = matrix[r][c];

    addStep(
      7,
      `Compute mid index ${mid} -> matrix[${r}][${c}] = ${midVal}`,
      `Flattened mid = Math.floor((${low} + ${high}) / 2) = ${mid}. Matrix cell is row ${r}, col ${c}.`,
      low,
      high,
      mid,
      undefined,
      { mid, row: r, col: c, midVal }
    );

    if (midVal === target) {
      found = true;
      addStep(
        11,
        `Target ${target} found at matrix[${r}][${c}]!`,
        `matrix[${r}][${c}] (${midVal}) matches target ${target}. Binary search succeeds.`,
        low,
        high,
        mid,
        { r, c },
        { mid, row: r, col: c, midVal, found: true }
      );
      break;
    }

    if (midVal < target) {
      addStep(
        12,
        `matrix[${r}][${c}] (${midVal}) < target (${target})`,
        `Target must be in the right half. Update low = mid + 1 = ${mid + 1}.`,
        low,
        high,
        mid,
        undefined,
        { mid, row: r, col: c, midVal }
      );
      low = mid + 1;
    } else {
      addStep(
        13,
        `matrix[${r}][${c}] (${midVal}) > target (${target})`,
        `Target must be in the left half. Update high = mid - 1 = ${mid - 1}.`,
        low,
        high,
        mid,
        undefined,
        { mid, row: r, col: c, midVal }
      );
      high = mid - 1;
    }
  }

  if (!found) {
    addStep(
      15,
      `Target ${target} not found in matrix`,
      `Search range low (${low}) > high (${high}). Target is absent.`,
      low,
      high,
      undefined,
      undefined,
      { found: false }
    );
  }

  return steps;
};

export const binarySearchMatrix: AlgorithmDefinition<BinarySearchMatrixInput> = {
  id: 'binary-search-matrix',
  title: 'Search a 2D Matrix',
  category: 'fundamentals',
  difficulty: 'Medium',
  description:
    'Searches for a target value in an m x n integer matrix where each row is sorted and the first integer of each row is greater than the last integer of the previous row using 2D binary search.',
  code: BINARY_SEARCH_MATRIX_CODE,
  timeComplexity: {
    best: 'O(1)',
    average: 'O(log(m * n))',
    worst: 'O(log(m * n))',
  },
  spaceComplexity: 'O(1)',
  defaultInput: DEFAULT_BINARY_SEARCH_MATRIX_INPUT,
  generateSteps: generateBinarySearchMatrixSteps,
};
