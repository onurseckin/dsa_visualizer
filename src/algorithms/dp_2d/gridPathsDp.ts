import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GridCellNode,
  GridVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface GridPathsDpInput {
  grid: number[][];
}

export const DEFAULT_GRID_PATHS_INPUT: GridPathsDpInput = {
  grid: [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ],
};

export const PYTHON_GRID_PATHS_CODE = `def grid_paths(grid: list[list[int]]) -> int:
    if not grid or grid[0][0] == 1:
        return 0
    m, n = len(grid), len(grid[0])
    dp = [[0] * n for _ in range(m)]
    dp[0][0] = 1

    for r in range(m):
        for c in range(n):
            if grid[r][c] == 1:
                dp[r][c] = 0
                continue
            if r > 0:
                dp[r][c] += dp[r - 1][c]
            if c > 0:
                dp[r][c] += dp[r][c - 1]

    return dp[m - 1][n - 1]`;

export const generateGridPathsDpSteps = (input: GridPathsDpInput): AlgorithmStep[] => {
  const grid = input?.grid && input.grid.length > 0 ? input.grid : DEFAULT_GRID_PATHS_INPUT.grid;
  const m = grid.length;
  const n = grid[0].length;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));

  const createSnapshot = (activePos?: [number, number]): GridVisualSnapshot => {
    const gridNodes: GridCellNode[][] = [];
    for (let r = 0; r < m; r++) {
      const rowNodes: GridCellNode[] = [];
      for (let c = 0; c < n; c++) {
        const isWall = grid[r][c] === 1;
        const isActive = Boolean(activePos && activePos[0] === r && activePos[1] === c);
        rowNodes.push({
          row: r,
          col: c,
          isStart: r === 0 && c === 0,
          isEnd: r === m - 1 && c === n - 1,
          isWall,
          distance: dp[r][c],
          state: isActive ? "active" : isWall ? "pivot" : dp[r][c] > 0 ? "visited" : "default",
        });
      }
      gridNodes.push(rowNodes);
    }
    return { kind: "grid", grid: gridNodes };
  };

  if (grid[0][0] === 1) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 3,
      explanation: {
        what: "Start cell (0,0) is blocked by an obstacle",
        why: "Impossible to reach the destination since start is an obstacle. Return 0.",
      },
      primarySnapshot: createSnapshot([0, 0]),
      auxiliaryState: { customState: { paths: 0 } },
      variables: { result: 0 },
    });
    return steps;
  }

  dp[0][0] = 1;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: "Initialize dp[0][0] = 1",
      why: "There is exactly 1 way to start at cell (0,0).",
    },
    primarySnapshot: createSnapshot([0, 0]),
    auxiliaryState: { customState: { "dp[0][0]": 1 } },
    variables: { m, n, "dp[0][0]": 1 },
  });

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (r === 0 && c === 0) continue;

      if (grid[r][c] === 1) {
        dp[r][c] = 0;
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 11,
          explanation: {
            what: `Cell (${r}, ${c}) is an obstacle`,
            why: "No paths can pass through an obstacle, so dp[r][c] is set to 0.",
          },
          primarySnapshot: createSnapshot([r, c]),
          auxiliaryState: { customState: { r, c, isObstacle: "true" } },
          variables: { r, c, "dp[r][c]": 0 },
        });
        continue;
      }

      if (r > 0) dp[r][c] += dp[r - 1][c];
      if (c > 0) dp[r][c] += dp[r][c - 1];

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 15,
        explanation: {
          what: `Compute dp[${r}][${c}] = ${dp[r][c]}`,
          why: `Accumulated paths from top cell (${r > 0 ? dp[r - 1][c] : 0}) and left cell (${c > 0 ? dp[r][c - 1] : 0}).`,
        },
        primarySnapshot: createSnapshot([r, c]),
        auxiliaryState: { customState: { r, c, paths: dp[r][c] } },
        variables: { r, c, "dp[r][c]": dp[r][c] },
      });
    }
  }

  const ans = dp[m - 1][n - 1];
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 18,
    explanation: {
      what: `Return dp[${m - 1}][${n - 1}] = ${ans}`,
      why: `The total number of unique paths to reach bottom-right cell is ${ans}.`,
    },
    primarySnapshot: createSnapshot([m - 1, n - 1]),
    auxiliaryState: { customState: { totalPaths: ans } },
    variables: { result: ans },
  });

  return steps;
};

const GRID_PATHS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines grid_paths(grid) -> int.",
    2: "Checks if grid is empty or start cell is an obstacle.",
    5: "Initializes 2D dp table of size m x n with 0s.",
    6: "Sets base case dp[0][0] = 1.",
    8: "Iterates through rows r from 0 to m - 1.",
    9: "Iterates through cols c from 0 to n - 1.",
    10: "If grid[r][c] == 1, cell is an obstacle, dp[r][c] = 0.",
    13: "Adds paths from top neighbor dp[r-1][c] if r > 0.",
    15: "Adds paths from left neighbor dp[r][c-1] if c > 0.",
    18: "Returns dp[m-1][n-1] which is the answer.",
  },
};

export const gridPathsDp: AlgorithmDefinition<GridPathsDpInput> = {
  id: "grid-paths-dp",
  title: "Grid Paths Dynamic Programming",
  category: "dp_2d",
  difficulty: "Medium",
  description:
    "Calculates total unique paths from top-left (0,0) to bottom-right (m-1, n-1) on a grid with obstacles using 2D dynamic programming.",
  constraints: ["1 <= m, n <= 10", "grid[r][c] in {0, 1}"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "grid = [[0, 0, 0], [0, 1, 0], [0, 0, 0]]",
      outputDisplay: "2",
      title: "Basic Case",
      input: {
        grid: [
          [0, 0, 0],
          [0, 1, 0],
          [0, 0, 0],
        ],
      },
      output: "2",
      explanation: "Obstacle at center (1,1) allows only 2 paths around it.",
    },
    {
      kind: "complex",
      inputDisplay: "grid = [[0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0]]",
      outputDisplay: "4",
      title: "Larger Grid",
      input: {
        grid: [
          [0, 0, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 0],
        ],
      },
      output: "4",
      explanation: "4 unique paths reach bottom right around obstacle at (1,2).",
    },
    {
      kind: "negative",
      inputDisplay: "grid = [[1, 0], [0, 0]]",
      outputDisplay: "0",
      title: "Blocked Start",
      input: {
        grid: [
          [1, 0],
          [0, 0],
        ],
      },
      output: "0",
      explanation: "Start cell is blocked by obstacle, so 0 paths.",
    },
  ],
  code: PYTHON_GRID_PATHS_CODE,
  timeComplexity: { best: "O(M * N)", average: "O(M * N)", worst: "O(M * N)" },
  spaceComplexity: "O(M * N)",
  complexityAnalysis: {
    time: "Fills an M x N matrix in row-major order, taking O(M * N) time.",
    space: "Requires an M x N table to store path counts, taking O(M * N) extra space.",
  },
  topicGuide: {
    overview:
      "Grid Paths DP sums paths arriving from top (r-1, c) and left (r, c-1) while setting obstacle cells to 0.",
    sections: [
      {
        heading: "Grid Transition",
        body: "dp[r][c] = dp[r-1][c] + dp[r][c-1] for valid non-wall cells.",
      },
    ],
  },
  trivia: GRID_PATHS_TRIVIA,
    sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 7",
      label: "Competitive Programmer's Handbook, Ch 7",
    },
  ],
  defaultInput: DEFAULT_GRID_PATHS_INPUT,
  generateSteps: generateGridPathsDpSteps,
};
