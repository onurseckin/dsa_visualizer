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
        why: 'The matrix has no elements, so the target cannot possibly be inside. We return False immediately.',
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
    'Treat the matrix as one sorted list',
    `Each row is sorted and every row starts above where the previous one ended, so reading the ${rows}x${cols} grid row by row gives one sorted list of ${totalElements} values. We can binary search that list with low = 0 and high = ${totalElements - 1}.`,
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
      `Probe the middle at index ${mid}`,
      `The virtual index ${mid} converts to row ${r} (${mid} // ${cols}) and column ${c} (${mid} % ${cols}), where the value is ${midVal}. Now we compare it with the target ${target}.`,
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
        `Return True — found at [${r}][${c}]`,
        `matrix[${r}][${c}] is exactly ${target}, so the search is over. Each probe halved the remaining range, which is why we got here in logarithmic time.`,
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
        'Discard the lower half',
        `${midVal} is smaller than ${target}, and everything at or before index ${mid} is smaller still. Half the candidates vanish in one comparison — we continue with low = ${mid + 1}.`,
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
        'Discard the upper half',
        `${midVal} is bigger than ${target}, and everything at or after index ${mid} is bigger still. We drop that half in one comparison and continue with high = ${mid - 1}.`,
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
      `Target ${target} not found`,
      `low (${low}) has crossed past high (${high}), so the search range is empty and no cell ever matched ${target}. The value simply isn't in the matrix, so we return False.`,
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
    'Searches for a target value in an m x n integer matrix — each row sorted, rows strictly increasing — by binary searching the grid as one virtual sorted 1D array.',
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
  complexityAnalysis: {
    time: 'Every probe compares one cell and throws away half of the remaining virtual list, so the m·n candidates shrink to a single cell in about log₂(m·n) comparisons — O(log(m·n)). The best case is O(1) when the very first midpoint happens to be the target; otherwise the repeated halving carries us to the answer or to an empty range.',
    space: 'We navigate with just the low, high, and mid indices — no copy of the matrix and no recursion — so extra memory is O(1).',
  },
  defaultInput: DEFAULT_BINARY_SEARCH_MATRIX_INPUT,
  generateSteps: generateBinarySearchMatrixSteps,
};
