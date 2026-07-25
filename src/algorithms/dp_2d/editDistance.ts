import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GridCellNode,
  GridVisualSnapshot,
} from '../../types/dsa';

export interface EditDistanceInput {
  word1: string;
  word2: string;
}

export const DEFAULT_EDIT_DISTANCE_INPUT: EditDistanceInput = {
  word1: 'horse',
  word2: 'ros',
};

export const EDIT_DISTANCE_CODE = `function minDistance(word1: string, word2: string): number {
  const m = word1.length, n = word2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}`;

export const generateEditDistanceSteps = (
  input: EditDistanceInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const word1 = input?.word1 ?? DEFAULT_EDIT_DISTANCE_INPUT.word1;
  const word2 = input?.word2 ?? DEFAULT_EDIT_DISTANCE_INPUT.word2;
  const m = word1.length;
  const n = word2.length;
  let stepIndex = 0;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  const createGridSnapshot = (
    activePos?: [number, number],
    comparePositions: Array<[number, number]> = [],
    computedUntil?: [number, number]
  ): GridVisualSnapshot => {
    const gridNodes: GridCellNode[][] = [];
    const compSet = new Set(comparePositions.map(([r, c]) => `${r},${c}`));

    for (let r = 0; r <= m; r++) {
      const rowNodes: GridCellNode[] = [];
      for (let c = 0; c <= n; c++) {
        const isActive = activePos && activePos[0] === r && activePos[1] === c;
        const isCompare = compSet.has(`${r},${c}`);
        const isComputed = computedUntil
          ? r < computedUntil[0] || (r === computedUntil[0] && c <= computedUntil[1])
          : false;

        rowNodes.push({
          row: r,
          col: c,
          distance: dp[r][c],
          state: isActive
            ? 'active'
            : isCompare
            ? 'compare'
            : isComputed
            ? 'visited'
            : 'default',
        });
      }
      gridNodes.push(rowNodes);
    }
    return { kind: 'grid', grid: gridNodes };
  };

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Initialized DP table of size (${m + 1} x ${n + 1}) with base cases.`,
      why: 'Converting any word to empty string requires deletion of all characters, and vice versa.',
    },
    primarySnapshot: createGridSnapshot(undefined, [], [0, n]),
    auxiliaryState: {
      customState: { word1, word2, rows: m + 1, cols: n + 1 },
    },
    variables: { m, n },
  });

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const char1 = word1[i - 1];
      const char2 = word2[j - 1];

      if (char1 === char2) {
        dp[i][j] = dp[i - 1][j - 1];
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 9,
          explanation: {
            what: `Matching characters '${char1}' === '${char2}' at word1[${i - 1}] and word2[${j - 1}].`,
            why: `No extra edit needed. Carry over dp[${i - 1}][${j - 1}] = ${dp[i][j]}.`,
          },
          primarySnapshot: createGridSnapshot([i, j], [[i - 1, j - 1]], [i, j]),
          auxiliaryState: {
            customState: { char1, char2, operation: 'Match', editCost: dp[i][j] },
          },
          variables: { i, j, char1, char2, 'dp[i][j]': dp[i][j] },
        });
      } else {
        const deleteOp = dp[i - 1][j];
        const insertOp = dp[i][j - 1];
        const replaceOp = dp[i - 1][j - 1];
        const minPrev = Math.min(deleteOp, insertOp, replaceOp);
        dp[i][j] = 1 + minPrev;

        let bestOpName = 'Replace';
        if (minPrev === deleteOp) bestOpName = 'Delete';
        else if (minPrev === insertOp) bestOpName = 'Insert';

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 11,
          explanation: {
            what: `Mismatch '${char1}' !== '${char2}' at (${i}, ${j}). Min of Delete(${deleteOp}), Insert(${insertOp}), Replace(${replaceOp}) is ${minPrev}.`,
            why: `1 + min(${deleteOp}, ${insertOp}, ${replaceOp}) = ${dp[i][j]} via optimal ${bestOpName} operation.`,
          },
          primarySnapshot: createGridSnapshot(
            [i, j],
            [
              [i - 1, j],
              [i, j - 1],
              [i - 1, j - 1],
            ],
            [i, j]
          ),
          auxiliaryState: {
            customState: {
              char1,
              char2,
              operation: bestOpName,
              deleteCost: deleteOp,
              insertCost: insertOp,
              replaceCost: replaceOp,
            },
          },
          variables: { i, j, char1, char2, 'dp[i][j]': dp[i][j] },
        });
      }
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 15,
    explanation: {
      what: `Edit Distance computation complete. Minimum operations to convert "${word1}" to "${word2}" is ${dp[m][n]}.`,
      why: 'Full 2D tabulation complete. Answer stored in bottom-right cell dp[m][n].',
    },
    primarySnapshot: createGridSnapshot([m, n], [], [m, n]),
    auxiliaryState: {
      customState: { result: dp[m][n] },
    },
    variables: { minDistance: dp[m][n] },
  });

  return steps;
};

export const editDistance: AlgorithmDefinition<EditDistanceInput> = {
  id: 'edit-distance',
  title: 'Edit Distance (2D Dynamic Programming)',
  category: 'dp_2d',
  difficulty: 'Hard',
  description:
    'Finds the minimum number of single-character insertions, deletions, or substitutions to transform word1 into word2 using 2D DP tabulation.',
  constraints: ['0 <= word1.length, word2.length <= 20'],
  examples: [
    {
      input: 'word1 = "horse", word2 = "ros"',
      output: '3',
      explanation: 'horse -> rorse (replace h with r) -> rose (remove r) -> ros (remove e)',
    },
  ],
  code: EDIT_DISTANCE_CODE,
  timeComplexity: {
    best: 'O(M * N)',
    average: 'O(M * N)',
    worst: 'O(M * N)',
  },
  spaceComplexity: 'O(M * N)',
  defaultInput: DEFAULT_EDIT_DISTANCE_INPUT,
  generateSteps: generateEditDistanceSteps,
};
