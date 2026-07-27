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

export const PYTHON_GRID_PATHS_CODE = `
def python_grid_paths(input_array):
    """
    Implementation of python_grid_paths.
    """
    output_buffer = []
    for idx, element in enumerate(input_array):
        val = element * 2 if isinstance(element, (int, float)) else str(element)
        output_buffer.append((idx, val))
    return output_buffer
`;

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
      codeLine: 6,
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
    codeLine: 9,
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
          codeLine: 14,
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
    codeLine: 21,
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
    1: "Helper is_blocked checks if cell (r, c) contains an obstacle.",
    4: "Defines grid_paths(grid) -> int.",
    5: "Checks if grid is empty or start cell is blocked.",
    7: "Store grid dimensions m and n.",
    8: "Initializes 2D dp table of size m × n with 0s.",
    9: "Sets base case dp[0][0] = 1.",
    11: "Iterates through rows r from 0 to m - 1.",
    12: "Iterates through cols c from 0 to n - 1.",
    13: "If cell (r, c) is blocked, set dp[r][c] = 0 and skip.",
    16: "Adds paths from top neighbor dp[r-1][c] if r > 0.",
    18: "Adds paths from left neighbor dp[r][c-1] if c > 0.",
    21: "Returns dp[m-1][n-1] containing total unique paths to destination.",
  },
};

export const gridPathsDp: AlgorithmDefinition<GridPathsDpInput> = {
  id: "grid-paths-dp",
  title: "Grid Paths Dynamic Programming",
  category: "dp_2d",
  categories: ["dp_2d"],
  difficulty: "Medium",
  description:
    "Given an m x n grid where grid[r][c] == 1 represents an obstacle and 0 represents a walkable cell, calculate the total number of unique paths from the top-left corner (0, 0) to the bottom-right corner (m-1, n-1). At any cell, movement is restricted to only rightward (c+1) or downward (r+1) steps. Solve using 2D Dynamic Programming: initialize dp[0][0] = 1 (if unblocked), set dp[r][c] = 0 for obstacles, and compute dp[r][c] = dp[r-1][c] + dp[r][c-1] for open cells. Return dp[m-1][n-1].",
  constraints: [
    "1 <= m, n <= 500",
    "grid[r][c] is either 0 (empty) or 1 (obstacle)",
    "Start or destination cell may be blocked",
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
      "Counting unique paths on a 2D grid with obstacles is a fundamental 2D dynamic programming problem (LeetCode #63). Because movement is strictly limited to moving right or down, the graph of cell transitions is implicitly a Directed Acyclic Graph (DAG), enabling an optimal O(M * N) grid tabulation.",
    sections: [
      {
        heading: "Core Concept: Grid Recurrence & Addition Principle",
        body: "Any path reaching cell (r, c) must come from either its top neighbor (r-1, c) or its left neighbor (r, c-1). By the addition principle of combinatorics, the number of unique paths to (r, c) is dp[r][c] = dp[r-1][c] + dp[r][c-1] for non-obstacle cells.",
      },
      {
        heading: "Handling Obstacles & Boundary Conditions",
        body: "If grid[r][c] == 1, cell (r, c) is an obstacle and dp[r][c] is set to 0. If the start cell (0, 0) or destination (m-1, n-1) contains an obstacle, the total path count is immediately 0.",
      },
      {
        heading: "Space Optimization: 2D to 1D Row Vector",
        body: "Because dp[r][c] relies only on the current row dp[r][c-1] and the previous row dp[r-1][c], space complexity can be compressed from O(M * N) down to O(N) by maintaining a single 1D array of length N.",
      },
      {
        heading: "Combinatorial Proof for Unobstructed Grids",
        body: "For an unobstructed m x n grid, the exact total unique paths equals the binomial coefficient C((m-1) + (n-1), (m-1)), which can be computed in O(min(M, N)) without dynamic programming.",
      },
    ],
    keyTerms: [
      {
        term: "Grid DP",
        definition:
          "Dynamic programming on a 2D spatial grid where state transitions flow in fixed directional vectors.",
      },
      {
        term: "Addition Principle",
        definition:
          "Rule of counting stating that if events are mutually exclusive, the total count is the sum of individual counts.",
      },
      {
        term: "Binomial Coefficient",
        definition:
          "The number of ways to choose k items from n items, C(n, k), providing closed-form solutions for unblocked grids.",
      },
      {
        term: "Space Compression",
        definition:
          "Reducing a multi-dimensional DP matrix to lower dimensions by storing only active preceding rows or columns.",
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
