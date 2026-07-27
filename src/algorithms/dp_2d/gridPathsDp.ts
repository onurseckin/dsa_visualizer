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

export const PYTHON_GRID_PATHS_CODE = `def unique_paths_with_obstacles(obstacleGrid: list[list[int]]) -> int:
    if not obstacleGrid or obstacleGrid[0][0] == 1:
        return 0

    m, n = len(obstacleGrid), len(obstacleGrid[0])
    dp = [[0] * n for _ in range(m)]
    dp[0][0] = 1

    for r in range(m):
        for c in range(n):
            if obstacleGrid[r][c] == 1:
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
      codeLine: 2,
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
    codeLine: 7,
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
          codeLine: 12,
          explanation: {
            what: `Cell (${r}, ${c}) is an obstacle`,
            why: "No paths can pass through an obstacle cell, so dp[r][c] is set to 0.",
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
        codeLine: 17,
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
    codeLine: 19,
    explanation: {
      what: `Final result dp[${m - 1}][${n - 1}] = ${ans}`,
      why: `The total number of unique paths to reach bottom-right cell (${m - 1}, ${n - 1}) is ${ans}.`,
    },
    primarySnapshot: createSnapshot([m - 1, n - 1]),
    auxiliaryState: { customState: { totalPaths: ans } },
    variables: { result: ans },
  });

  return steps;
};

const GRID_PATHS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines unique_paths_with_obstacles(obstacleGrid) -> int: counts unique paths avoiding obstacles.",
    2: "Guards against empty grid or blocked start cell (obstacleGrid[0][0] == 1), returning 0 immediately.",
    5: "Extracts grid dimensions m (rows) and n (columns).",
    6: "Allocates 2D DP matrix of size m x n initialized to 0.",
    7: "Sets base case dp[0][0] = 1 for unblocked starting cell.",
    9: "Outer loop sweeps row index r from 0 to m - 1.",
    10: "Inner loop sweeps col index c from 0 to n - 1.",
    11: "Checks if cell (r, c) is an obstacle (obstacleGrid[r][c] == 1).",
    12: "Sets dp[r][c] = 0 for obstacles, blocking path traversal.",
    14: "Adds path count from top neighbor dp[r-1][c] if r > 0.",
    16: "Adds path count from left neighbor dp[r][c-1] if c > 0.",
    19: "Returns dp[m-1][n-1], the total unique paths reaching destination.",
  },
};

export const gridPathsDp: AlgorithmDefinition<GridPathsDpInput> = {
  id: "grid-paths-dp",
  title: "Grid Paths Dynamic Programming",
  category: "dp_2d",
  categories: ["dp_2d"],
  difficulty: "Medium",
  description:
    "You are given an m x n integer array grid where grid[i][j] == 1 represents an obstacle and 0 represents an open space. Return the number of possible unique paths that the robot can take to reach the bottom-right corner (m - 1, n - 1) starting from the top-left corner (0, 0). The robot can only move either down or right at any point in time. Solve using 2D Dynamic Programming: initialize dp[0][0] = 1 (if unblocked), set dp[r][c] = 0 for obstacles, and compute dp[r][c] = dp[r-1][c] + dp[r][c-1] for open cells.",
  constraints: [
    "1 <= m, n <= 100",
    "grid[i][j] is 0 or 1",
    "Start cell (0,0) or destination cell (m-1,n-1) may contain obstacles",
  ],
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
      explanation:
        "Obstacle at center (1,1) allows only 2 paths around it (Right-Right-Down-Down and Down-Down-Right-Right).",
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
      explanation: "Start cell (0,0) is blocked by obstacle, so 0 paths can reach the destination.",
    },
  ],
  code: PYTHON_GRID_PATHS_CODE,
  timeComplexity: { best: "O(M * N)", average: "O(M * N)", worst: "O(M * N)" },
  spaceComplexity: "O(M * N)",
  complexityAnalysis: {
    time: "Fills an M x N matrix in row-major order. Each cell performs O(1) addition operations, taking O(M * N) total time.",
    space:
      "Requires an M x N matrix to store unique path counts for all cells, taking O(M * N) space.",
  },
  topicGuide: {
    overview:
      "Grid Unique Paths with Obstacles (LeetCode #63) is a foundational 2D dynamic programming problem. A robot moves on an m x n grid from top-left (0,0) to bottom-right (m-1, n-1), constrained to only rightward (c+1) and downward (r+1) moves. Obstacles (grid[r][c] == 1) block robot movement. Because transitions are strictly directional (down and right), the grid acts as a Directed Acyclic Graph (DAG), guaranteeing topological order when traversed row-by-row.",
    sections: [
      {
        heading: "Core Concept: Addition Principle & Grid Recurrence",
        body: "By the addition principle of combinatorics, any path reaching cell (r, c) must arrive from either top neighbor (r-1, c) or left neighbor (r, c-1). If cell (r, c) is an obstacle, dp[r][c] = 0. For open cells, dp[r][c] = (r > 0 ? dp[r-1][c] : 0) + (c > 0 ? dp[r][c-1] : 0).",
      },
      {
        heading: "Systems Applications: Network Routing & Wafer Layouts",
        body: "Grid path counting techniques underpin real-world engineering systems: VLSI microchip router wire routing around silicon defect blocks, Autonomous Mobile Robot (AMR) path planners navigating warehouse grid layouts, and IP packet routing through mesh topologies with failed node links.",
      },
      {
        heading: "Space Optimization: 2D Matrix to 1D Row Vector",
        body: "Because dp[r][c] depends solely on the current row's left cell dp[r][c-1] and previous row's cell dp[r-1][c], memory can be compressed from O(M * N) down to O(N) by maintaining a single 1D array of length N updated in place.",
      },
      {
        heading: "Edge Case Analysis & Combinatorial Bounds",
        body: "Edge cases include blocked start cell (dp[0][0] = 1 is skipped, returns 0), blocked end cell, 1x1 grids, and fully blocked walls creating disconnected components. On unobstructed grids, total paths equal the binomial coefficient C((m-1)+(n-1), (m-1)).",
      },
    ],
    keyTerms: [
      {
        term: "Grid Dynamic Programming",
        definition:
          "Tabular DP over a 2D spatial grid where state transitions follow fixed directional move vectors.",
      },
      {
        term: "Addition Principle",
        definition:
          "Combinatorial rule stating that if path choices are mutually exclusive, total paths equals the sum of subpath counts.",
      },
      {
        term: "Space Vector Compression",
        definition:
          "Reducing a 2D matrix DP state space to a single 1D array by overwriting values in row-major order.",
      },
      {
        term: "Binomial Coefficient",
        definition:
          "Combinatorial formula C(n, k) giving exact unique paths for unobstructed rectangular grids.",
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
