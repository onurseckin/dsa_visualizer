import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GridCellNode,
  GridVisualSnapshot,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface GridPathsDpInput {
  grid: number[][];
}

export const DEFAULT_GRID_PATHS_INPUT: GridPathsDpInput = {
  grid: [
    [0, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Grid Unique Paths with Obstacles problem asks for the total number of unique paths a robot can take from top-left (0,0) to bottom-right (m-1, n-1) on an m x n grid.",
    primarySnapshot: {
      kind: "grid",
      grid: [
        [
          { row: 0, col: 0, isStart: true, distance: 1, state: "active" },
          { row: 0, col: 1, distance: 0, state: "default" },
        ],
        [
          { row: 1, col: 0, distance: 0, state: "default" },
          { row: 1, col: 1, isEnd: true, distance: 0, state: "default" },
        ],
      ],
    },
  },
  {
    narrative:
      "Movement is strictly restricted to moving Right or Down at every step; moving Left or Up is prohibited.",
    primarySnapshot: {
      kind: "array",
      name: "moves",
      mode: "box",
      elements: [
        { id: "m1", value: "Right (col + 1)", state: "sorted" },
        { id: "m2", value: "Down (row + 1)", state: "sorted" },
        { id: "m3", value: "Left / Up (Prohibited)", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Obstacle cells (grid[r][c] = 1) act as impassable walls that completely block robot traversal through that cell.",
    primarySnapshot: {
      kind: "grid",
      grid: [
        [
          { row: 0, col: 0, isStart: true, distance: 1, state: "visited" },
          { row: 0, col: 1, isWall: true, distance: 0, state: "pivot" },
        ],
        [
          { row: 1, col: 0, distance: 1, state: "visited" },
          { row: 1, col: 1, isEnd: true, distance: 1, state: "sorted" },
        ],
      ],
    },
  },
  {
    narrative:
      "On an obstacle-free grid, paths can be counted with a simple combinatorics formula C(m+n-2, m-1); however, obstacles break simple combination math, requiring dynamic programming.",
    primarySnapshot: {
      kind: "array",
      name: "comparison",
      mode: "box",
      elements: [
        { id: "c1", value: "No Obstacles: Binomial C(m+n-2, m-1)", state: "default" },
        { id: "c2", value: "With Obstacles: Dynamic Programming O(M*N)", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "We define 2D state dp[r][c] as the exact number of unique valid paths reaching cell (r, c) from the start position (0,0).",
    primarySnapshot: {
      kind: "matrix",
      name: "dp",
      rows: 2,
      cols: 2,
      cells: [
        { row: 0, col: 0, value: "dp[0][0]", state: "sorted" },
        { row: 0, col: 1, value: "dp[0][1]", state: "default" },
        { row: 1, col: 0, value: "dp[1][0]", state: "default" },
        { row: 1, col: 1, value: "dp[1][1]", state: "active" },
      ],
    },
  },
  {
    narrative:
      "The base case sets dp[0][0] = 1 assuming the starting cell is unblocked, because there is exactly 1 way to be at the starting position.",
    primarySnapshot: {
      kind: "grid",
      grid: [
        [
          { row: 0, col: 0, isStart: true, distance: 1, state: "sorted" },
          { row: 0, col: 1, distance: 0, state: "default" },
        ],
        [
          { row: 1, col: 0, distance: 0, state: "default" },
          { row: 1, col: 1, isEnd: true, distance: 0, state: "default" },
        ],
      ],
    },
  },
  {
    narrative:
      "By the Rule of Sum, any open cell receives paths from its top neighbor (dp[r-1][c]) and its left neighbor (dp[r][c-1]), yielding dp[r][c] = dp[r-1][c] + dp[r][c-1].",
    primarySnapshot: {
      kind: "grid",
      grid: [
        [
          { row: 0, col: 0, distance: 1, state: "visited" },
          { row: 0, col: 1, distance: 1, state: "compare" },
        ],
        [
          { row: 1, col: 0, distance: 1, state: "compare" },
          { row: 1, col: 1, isEnd: true, distance: 2, state: "active" },
        ],
      ],
    },
  },
  {
    narrative:
      "If cell (r, c) contains an obstacle, dp[r][c] is set to 0, ensuring no incoming paths flow through that cell to subsequent subproblems.",
    primarySnapshot: {
      kind: "grid",
      grid: [
        [
          { row: 0, col: 0, distance: 1, state: "visited" },
          { row: 0, col: 1, isWall: true, distance: 0, state: "pivot" },
        ],
        [
          { row: 1, col: 0, distance: 1, state: "visited" },
          { row: 1, col: 1, isEnd: true, distance: 1, state: "active" },
        ],
      ],
    },
  },
  {
    narrative:
      "Traversing the grid in row-major order computes all subproblems in O(M * N) time, which can also be memory-compressed to O(N) space using a single row buffer.",
    primarySnapshot: {
      kind: "array",
      name: "summary",
      mode: "box",
      elements: [
        { id: "s1", value: "Time Complexity: O(M * N)", state: "default" },
        { id: "s2", value: "Space Complexity: O(M * N) -> O(N)", state: "sorted" },
      ],
    },
  },
];

export const generateGridPathsDpSteps = (input: GridPathsDpInput): AlgorithmStep[] => {
  const grid = input?.grid && input.grid.length > 0 ? input.grid : DEFAULT_GRID_PATHS_INPUT.grid;
  const m = grid.length;
  const n = grid[0].length;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const dp: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input?.grid) &&
      input.grid.length === DEFAULT_GRID_PATHS_INPUT.grid.length &&
      input.grid.every((row, r) =>
        row.every((val, c) => val === DEFAULT_GRID_PATHS_INPUT.grid[r][c]),
      ));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const makeGridSnapshot = (
    activePos?: [number, number],
    highlightResult = false,
  ): GridVisualSnapshot => {
    const gridNodes: GridCellNode[][] = [];
    for (let r = 0; r < m; r++) {
      const rowNodes: GridCellNode[] = [];
      for (let c = 0; c < n; c++) {
        const isWall = grid[r][c] === 1;
        const isActive = Boolean(activePos && activePos[0] === r && activePos[1] === c);
        const isEnd = r === m - 1 && c === n - 1;
        rowNodes.push({
          row: r,
          col: c,
          isStart: r === 0 && c === 0,
          isEnd,
          isWall,
          distance: dp[r][c],
          state:
            highlightResult && isEnd
              ? "sorted"
              : isActive
                ? "active"
                : isWall
                  ? "pivot"
                  : dp[r][c] > 0
                    ? "visited"
                    : "default",
        });
      }
      gridNodes.push(rowNodes);
    }
    return { kind: "grid", grid: gridNodes };
  };

  addStep(
    `Initializing 2D DP grid of size ${m}x${n} for unique paths calculation starting at (0,0).`,
    makeGridSnapshot([0, 0]),
  );

  if (grid[0][0] === 1) {
    addStep(
      `Starting cell (0,0) is blocked by an obstacle wall! Returning 0 unique paths immediately.`,
      makeGridSnapshot([0, 0]),
    );
    return steps;
  }

  dp[0][0] = 1;
  addStep(
    `Set base case dp[0][0] = 1, as there is exactly 1 way to begin at the start position.`,
    makeGridSnapshot([0, 0]),
  );

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (r === 0 && c === 0) continue;

      if (grid[r][c] === 1) {
        dp[r][c] = 0;
        addStep(
          `Cell (${r}, ${c}) contains an obstacle: setting dp[${r}][${c}] = 0 to block path propagation.`,
          makeGridSnapshot([r, c]),
        );
        continue;
      }

      const topVal = r > 0 ? dp[r - 1][c] : 0;
      const leftVal = c > 0 ? dp[r][c - 1] : 0;
      dp[r][c] = topVal + leftVal;

      addStep(
        `Evaluating open cell (${r}, ${c}): adding top neighbor paths dp[${r - 1 < 0 ? 0 : r - 1}][${c}] = ${topVal} and left neighbor paths dp[${r}][${c - 1 < 0 ? 0 : c - 1}] = ${leftVal}. Updated dp[${r}][${c}] = ${dp[r][c]}.`,
        makeGridSnapshot([r, c]),
      );
    }
  }

  const finalAns = dp[m - 1][n - 1];
  addStep(
    `Completed grid DP tabulation: dp[${m - 1}][${n - 1}] = ${finalAns}. The total number of unique paths from (0,0) to (${m - 1}, ${n - 1}) avoiding obstacles is ${finalAns}.`,
    makeGridSnapshot([m - 1, n - 1], true),
  );

  return steps;
};

export const GRID_PATHS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines unique_paths_with_obstacles(obstacleGrid) -> int: computes unique paths avoiding obstacle cells.",
    2: "Checks boundary condition: if grid is empty or start cell (0,0) is an obstacle (1), return 0 immediately.",
    3: "Returns 0 when the starting position (0,0) is blocked by an obstacle.",
    4: "Empty line separating initial guard checks from matrix allocation.",
    5: "Extracts grid dimensions m = len(obstacleGrid) (rows) and n = len(obstacleGrid[0]) (columns).",
    6: "Allocates 2D DP matrix dp of size m x n initialized to 0.",
    7: "Sets base case dp[0][0] = 1, representing 1 path to start at (0,0).",
    8: "Empty line separating DP initialization from grid traversal loops.",
    9: "Outer loop iterates row index r from 0 up to m - 1.",
    10: "Inner loop iterates column index c from 0 up to n - 1.",
    11: "Checks if cell (r, c) is an obstacle (obstacleGrid[r][c] == 1).",
    12: "Sets dp[r][c] = 0 for obstacle cells because no path can traverse through them.",
    13: "Continues to next grid cell, skipping incoming path accumulation for obstacle cells.",
    14: "Evaluates if top neighbor cell exists (r > 0).",
    15: "Adds path count from top neighbor dp[r-1][c] to current cell dp[r][c] if r > 0.",
    16: "Evaluates if left neighbor cell exists (c > 0).",
    17: "Adds path count from left neighbor dp[r][c-1] to current cell dp[r][c] if c > 0.",
    18: "Empty line separating grid traversal loops from returning final result.",
    19: "Returns dp[m - 1][n - 1], the total unique paths reaching bottom-right destination cell.",
  },
};

export const gridPathsDp: AlgorithmDefinition<GridPathsDpInput> = {
  id: "grid-paths-dp",
  title: "Grid Paths Dynamic Programming",
  topicIds: ["dp_2d"],
  difficulty: "Medium",
  description:
    "<p>Given an <code>m &times; n</code> integer array <code>grid</code> where <code>grid[i][j] = 1</code> represents an obstacle wall and <code>0</code> represents an open path cell, determine the number of unique paths a robot can take from top-left <code>(0,0)</code> to bottom-right <code>(m-1, n-1)</code>. The robot can only move either <strong>down</strong> or <strong>right</strong> at any point in time.</p><p><strong>Input:</strong> A 2D integer array <code>grid</code>.</p><p><strong>Output:</strong> The total number of unique paths to reach the bottom-right destination cell.</p>",
  constraints: [
    "1 <= m, n <= 100",
    "grid[i][j] is 0 or 1",
    "Start cell (0,0) or destination cell (m-1,n-1) may contain obstacles",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "grid = [[0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]",
      outputDisplay: "8",
      title: "Standard Case",
      input: {
        grid: [
          [0, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
      },
      output: "8",
      explanation:
        "A 4x4 grid with an obstacle at (1,1) yields 8 unique paths from (0,0) to (3,3).",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "grid = [[0, 0, 0], [0, 1, 0], [0, 0, 0]]",
      outputDisplay: "2",
      title: "Adversarial Central Blockade",
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
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "grid = [[1, 0], [0, 0]]",
      outputDisplay: "0",
      title: "Blocked Start Boundary",
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
    time: "Fills an M x N matrix in row-major order. Each cell performs O(1) additions, giving O(M * N) total time.",
    space:
      "Requires an M x N matrix to store unique path counts for all cells, taking O(M * N) auxiliary space.",
  },
  topicGuide: {
    overview:
      "<p>Grid Unique Paths with Obstacles (LeetCode #63) is the fundamental benchmark for spatial 2D dynamic programming. A robot moves on an <code>m &times; n</code> grid from <code>(0,0)</code> to <code>(m-1, n-1)</code> using only rightward and downward moves. Obstacles (<code>grid[r][c] = 1</code>) block traversal. 2D DP computes total paths in <code>O(M &times; N)</code> time and space.</p>",
    sections: [
      {
        heading: "1. 2D Recurrence & Rule of Sum",
        body: "<p>Let <code>dp[r][c]</code> be the number of unique paths from <code>(0,0)</code> to <code>(r, c)</code>.</p><ul><li><strong>Base Case:</strong> <code>dp[0][0] = 1</code> if <code>grid[0][0] = 0</code>.</li><li><strong>Obstacle Rule:</strong> <code>dp[r][c] = 0</code> if <code>grid[r][c] = 1</code>.</li><li><strong>Transition:</strong> <code>dp[r][c] = (top neighbor paths) + (left neighbor paths)</code>.</li><li><strong>Result:</strong> <code>dp[m-1][n-1]</code>.</li></ul>",
      },
      {
        heading: "2. Why Combinatorics Fails with Obstacles",
        body: "<p>On an obstacle-free grid, total paths equals the binomial coefficient. However, obstacles break closed-form combinations, necessitating dynamic programming.</p>",
      },
      {
        heading: "3. Systems Applications",
        body: "<p>Spatial grid DP forms the foundation for:</p><ul><li><strong>VLSI Microchip Routing:</strong> Routing interconnect wires around physical component defect blocks.</li><li><strong>Warehouse AMR Navigation:</strong> Autonomous mobile robot pathing on grid floors.</li><li><strong>Mesh Network Routing:</strong> Packet delivery across 2D grid topologies.</li></ul>",
      },
      {
        heading: "4. Space Vector Compression",
        body: "<p>Because <code>dp[r][c]</code> depends only on row <code>r-1</code> (top) and current row cell <code>c-1</code> (left), memory compresses from <code>O(M &times; N)</code> to <code>O(N)</code> using a single 1D array.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Grid Dynamic Programming",
        definition:
          "Tabular DP over a 2D grid where state transitions move along fixed directional vectors.",
      },
      {
        term: "Rule of Sum",
        definition:
          "Combinatorial principle stating total paths equals the sum of mutually exclusive subpath counts.",
      },
      {
        term: "Space Vector Compression",
        definition:
          "Reducing a 2D grid DP table to a 1D row array by overwriting entries in row-major order.",
      },
    ],
  },
  trivia: GRID_PATHS_TRIVIA,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 7,
      label: "Competitive Programmer's Handbook, Ch 7",
    },
  ],
  defaultInput: DEFAULT_GRID_PATHS_INPUT,
  generateSteps: generateGridPathsDpSteps,
};
