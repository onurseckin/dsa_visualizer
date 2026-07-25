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

export const EDIT_DISTANCE_CODE = `def min_distance(word1: str, word2: str) -> int:
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i - 1] == word2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])

    return dp[m][n]`;

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
    codeLine: 3,
    explanation: {
      what: `Fill the base row and column`,
      why: `The first column says dp[i][0] = i, because turning the first i letters of "${word1}" into nothing takes i deletions. The first row says dp[0][j] = j, because building the first j letters of "${word2}" from nothing takes j insertions.`,
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
          codeLine: 13,
          explanation: {
            what: `Match '${char1}' at cell (${i}, ${j})`,
            why: `Both words have '${char1}' here, so no edit is needed — we just carry over the cost of matching the shorter prefixes diagonally: dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]}.`,
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
          codeLine: 15,
          explanation: {
            what: `Resolve mismatch '${char1}' vs '${char2}'`,
            why: `The letters differ, so we pick the cheapest fix among deleting (${deleteOp}), inserting (${insertOp}), or replacing (${replaceOp}). ${bestOpName} wins at ${minPrev}, and adding 1 for the edit itself gives dp[${i}][${j}] = ${dp[i][j]}.`,
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
    codeLine: 17,
    explanation: {
      what: `Read the answer at dp[${m}][${n}]`,
      why: `The bottom-right cell compares the full words, so turning "${word1}" into "${word2}" takes ${dp[m][n]} edits. We got there by solving every smaller prefix pair exactly once, which is why the work is proportional to the table size.`,
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
    'Finds the minimum number of single-character operations (insertions, deletions, or substitutions) required to transform word1 into word2 using Levenshtein distance 2D dynamic programming tabulation.',
  constraints: [
    '0 <= word1.length, word2.length <= 500',
    'Strings consist of lowercase English letters',
  ],
  examples: [
    {
      input: 'word1 = "horse", word2 = "ros"',
      output: '3',
      explanation: 'horse -> rorse (replace h with r) -> rose (remove r) -> ros (remove e)',
    },
    {
      input: 'word1 = "intention", word2 = "execution"',
      output: '5',
      explanation: 'intention -> inention (remove t) -> enention (replace i with e) -> exention (replace n with x) -> exection (replace n with c) -> execution (insert u)',
    },
  ],
  code: EDIT_DISTANCE_CODE,
  timeComplexity: {
    best: 'O(M * N)',
    average: 'O(M * N)',
    worst: 'O(M * N)',
  },
  spaceComplexity: 'O(M * N)',
  complexityAnalysis: {
    time: 'The dp table has (M + 1) × (N + 1) cells — one for every pair of prefixes of the two words — and we fill each cell exactly once with a constant amount of comparison work. That makes the total time O(M × N) no matter what the strings look like; matching and mismatching characters cost the same.',
    space: 'The full 2D table stores an answer for every prefix pair, so memory grows with both word lengths — O(M × N). Only the previous row is strictly needed, but we keep the whole table so the computation stays visible.',
  },
  defaultInput: DEFAULT_EDIT_DISTANCE_INPUT,
  generateSteps: generateEditDistanceSteps,
};
