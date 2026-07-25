import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GridCellNode,
} from '../../types/dsa';

export interface BinarySearchMatrixInput {
  matrix: number[][];
  target: number;
}

export const BINARY_SEARCH_MATRIX_CODE = `def search_matrix(matrix: list[list[int]], target: int) -> bool:
    if not matrix or not matrix[0]:
        return False
    m, n = len(matrix), len(matrix[0])
    low, high = 0, m * n - 1

    while low <= high:
        mid = (low + high) // 2
        row = mid // n
        col = mid % n
        mid_val = matrix[row][col]

        if mid_val == target:
            return True
        elif mid_val < target:
            low = mid + 1
        else:
            high = mid - 1

    return False`;

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
    5,
    `Initialize 2D Binary Search on ${rows}x${cols} matrix`,
    `Virtual 1D Array Mapping: Because each row is sorted and the first element of each row exceeds the last element of the previous row, we treat the ${rows}x${cols} grid as a single virtual sorted 1D array of ${totalElements} elements with bounds low = 0, high = ${totalElements - 1}.`,
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
      8,
      `Compute mid index ${mid} -> matrix[${r}][${c}] = ${midVal}`,
      `Coordinate Mapping: Virtual midpoint index mid = ${mid} maps to 2D matrix cell row ${r} (mid // ${cols}) and col ${c} (mid % ${cols}), yielding value matrix[${r}][${c}] = ${midVal}.`,
      low,
      high,
      mid,
      undefined,
      { mid, row: r, col: c, midVal }
    );

    if (midVal === target) {
      found = true;
      addStep(
        14,
        `Target ${target} found at matrix[${r}][${c}]!`,
        `Target Match: matrix[${r}][${c}] (${midVal}) matches target ${target}. Binary search succeeds in O(log(m * n)) time!`,
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
        16,
        `matrix[${r}][${c}] (${midVal}) < target (${target})`,
        `Binary Decision: matrix[${r}][${c}] (${midVal}) is smaller than target ${target}. By monotonic sorted property, all elements in virtual range [0..${mid}] are strictly < ${target}. Eliminate left half: low = mid + 1 (${mid + 1}).`,
        low,
        high,
        mid,
        undefined,
        { mid, row: r, col: c, midVal }
      );
      low = mid + 1;
    } else {
      addStep(
        18,
        `matrix[${r}][${c}] (${midVal}) > target (${target})`,
        `Binary Decision: matrix[${r}][${c}] (${midVal}) is larger than target ${target}. By monotonic sorted property, all elements in virtual range [${mid}..${totalElements - 1}] are strictly > ${target}. Eliminate right half: high = mid - 1 (${mid - 1}).`,
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
      20,
      `Target ${target} not found in matrix`,
      `Search Space Exhausted: Search range collapsed (low ${low} > high ${high}) without discovering target ${target}. Target is absent from matrix.`,
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
  category: 'binary_search',
  difficulty: 'Medium',
  description:
    'Searches for a target value in an m x n integer matrix where each row is sorted and the first element of each row is greater than the last element of the previous row using virtual 1D-to-2D index mapping.',
  constraints: [
    'm == matrix.length',
    'n == matrix[i].length',
    '1 <= m, n <= 100',
    '-10^4 <= matrix[i][j], target <= 10^4',
  ],
  examples: [
    {
      input: 'matrix = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target = 3',
      output: 'true',
      explanation: 'Target 3 exists at row 0, column 1.',
    },
    {
      input: 'matrix = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target = 13',
      output: 'false',
      explanation: 'Target 13 is not present in the matrix.',
    },
  ],
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
