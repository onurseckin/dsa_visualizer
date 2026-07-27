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

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Start unique paths algorithm on ${m}x${n} grid`,
      why: "The goal is to compute total unique paths from top-left (0,0) to bottom-right destination while dodging obstacle walls.",
    },
    primarySnapshot: createSnapshot([0, 0]),
    auxiliaryState: { customState: { m, n } },
    variables: { m, n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Check boundary conditions and starting cell obstacle status (grid[0][0] = ${grid[0][0]})`,
      why: "If the starting cell contains an obstacle (1), no paths can leave the starting position, returning 0 immediately.",
    },
    primarySnapshot: createSnapshot([0, 0]),
    auxiliaryState: { customState: { startBlocked: grid[0][0] === 1 } },
    variables: { m, n, startBlocked: grid[0][0] === 1 },
  });

  if (grid[0][0] === 1) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 3,
      explanation: {
        what: "Start cell (0,0) is blocked by an obstacle. Returning 0.",
        why: "Impossible to reach destination because starting cell is blocked.",
      },
      primarySnapshot: createSnapshot([0, 0]),
      auxiliaryState: { customState: { paths: 0 } },
      variables: { result: 0 },
    });
    return steps;
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Extract grid dimensions: rows m = ${m}, cols n = ${n}`,
      why: "Dimensions specify matrix allocation boundaries and grid traversal range.",
    },
    primarySnapshot: createSnapshot([0, 0]),
    auxiliaryState: { customState: { m, n } },
    variables: { m, n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Allocate 2D DP matrix of size ${m} x ${n} filled with zeros`,
      why: "dp[r][c] stores the total number of unique paths reaching cell (r, c).",
    },
    primarySnapshot: createSnapshot([0, 0]),
    auxiliaryState: { customState: { m, n } },
    variables: { m, n },
  });

  dp[0][0] = 1;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: "Initialize base case dp[0][0] = 1",
      why: "There is exactly 1 way to be at the starting location (0,0).",
    },
    primarySnapshot: createSnapshot([0, 0]),
    auxiliaryState: { customState: { "dp[0][0]": 1 } },
    variables: { m, n, "dp[0][0]": 1 },
  });

  for (let r = 0; r < m; r++) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 9,
      explanation: {
        what: `Begin traversing row r = ${r}`,
        why: "Row-by-row traversal guarantees topological ordering because moves are strictly rightward and downward.",
      },
      primarySnapshot: createSnapshot([r, 0]),
      auxiliaryState: { customState: { currentCombinedRow: r } },
      variables: { r, m },
    });

    for (let c = 0; c < n; c++) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 10,
        explanation: {
          what: `Evaluate cell (${r}, ${c})`,
          why: `Processing state for row ${r}, column ${c}.`,
        },
        primarySnapshot: createSnapshot([r, c]),
        auxiliaryState: { customState: { r, c } },
        variables: { r, c },
      });

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 11,
        explanation: {
          what: `Check condition if obstacleGrid[${r}][${c}] == 1 (${grid[r][c] === 1})`,
          why: grid[r][c] === 1
            ? `Cell (${r}, ${c}) is an obstacle wall!`
            : `Cell (${r}, ${c}) is an open floor cell.`,
        },
        primarySnapshot: createSnapshot([r, c]),
        auxiliaryState: { customState: { r, c, isObstacle: grid[r][c] === 1 } },
        variables: { r, c, isObstacle: grid[r][c] === 1 },
      });

      if (grid[r][c] === 1) {
        dp[r][c] = 0;
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 12,
          explanation: {
            what: `Set dp[${r}][${c}] = 0 for obstacle cell`,
            why: "Obstacles block path traversal, so dp[r][c] must be set to 0.",
          },
          primarySnapshot: createSnapshot([r, c]),
          auxiliaryState: { customState: { r, c, dpVal: 0 } },
          variables: { r, c, "dp[r][c]": 0 },
        });

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 13,
          explanation: {
            what: `Continue to next cell, skipping additions for obstacle (${r}, ${c})`,
            why: "No incoming paths can pass through an obstacle.",
          },
          primarySnapshot: createSnapshot([r, c]),
          auxiliaryState: { customState: { r, c, skipped: true } },
          variables: { r, c },
        });
        continue;
      }

      if (r === 0 && c === 0) continue;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 14,
        explanation: {
          what: `Evaluate top neighbor condition if r > 0 (r = ${r})`,
          why: r > 0
            ? `Top neighbor cell (${r - 1}, ${c}) exists.`
            : `Top boundary reached (row 0), no top neighbor.`,
        },
        primarySnapshot: createSnapshot([r, c]),
        auxiliaryState: { customState: { r, c, hasTop: r > 0 } },
        variables: { r, c, hasTop: r > 0 },
      });

      if (r > 0) {
        const topVal = dp[r - 1][c];
        dp[r][c] += topVal;
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 15,
          explanation: {
            what: `Add top neighbor paths: dp[${r}][${c}] += dp[${r - 1}][${c}] (${topVal})`,
            why: `Robot can move down from top neighbor cell (${r - 1}, ${c}). Total paths now ${dp[r][c]}.`,
          },
          primarySnapshot: createSnapshot([r, c]),
          auxiliaryState: { customState: { r, c, topAdded: topVal, currentPaths: dp[r][c] } },
          variables: { r, c, topVal, "dp[r][c]": dp[r][c] },
        });
      }

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 16,
        explanation: {
          what: `Evaluate left neighbor condition if c > 0 (c = ${c})`,
          why: c > 0
            ? `Left neighbor cell (${r}, ${c - 1}) exists.`
            : `Left boundary reached (col 0), no left neighbor.`,
        },
        primarySnapshot: createSnapshot([r, c]),
        auxiliaryState: { customState: { r, c, hasLeft: c > 0 } },
        variables: { r, c, hasLeft: c > 0 },
      });

      if (c > 0) {
        const leftVal = dp[r][c - 1];
        dp[r][c] += leftVal;
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 17,
          explanation: {
            what: `Add left neighbor paths: dp[${r}][${c}] += dp[${r}][${c - 1}] (${leftVal})`,
            why: `Robot can move right from left neighbor cell (${r}, ${c - 1}). Total paths now ${dp[r][c]}.`,
          },
          primarySnapshot: createSnapshot([r, c]),
          variables: { val: dp[r][c] },
        });
      }
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
  category: "dp_2d",
  categories: ["dp_2d"],
  difficulty: "Medium",
  description: `The **Grid Unique Paths with Obstacles** problem (LeetCode #63) asks for the total number of unique paths a robot can take from top-left $(0,0)$ to bottom-right $(m-1, n-1)$ on an $m \\times n$ grid while avoiding obstacle cells ($grid[r][c] = 1$).

### Directional Traversal & 2D Recurrence
Movement is strictly limited to **Right** and **Down**. By the Rule of Sum, the total number of unique paths reaching cell $(r, c)$ is:
$$dp[r][c] = \\begin{cases} 0 & \\text{if } grid[r][c] = 1 \\text{ (obstacle)} \\\\ 1 & \\text{if } r = 0, c = 0 \\text{ and } grid[0][0] = 0 \\\\ dp[r-1][c] + dp[r][c-1] & \\text{otherwise} \\end{cases}$$

### Key Interview Insights
1. **Rule of Sum in DAGs**: Grid path counting models DAG reachability. Unblocked cell path count equals top neighbor paths plus left neighbor paths.
2. **Obstacle Zeroing**: Any obstacle cell forces $dp[r][c] = 0$, preventing paths from flowing downstream.
3. **Space Vector Optimization**: 2D memory $\\mathcal{O}(M \\times N)$ can be compressed to 1D vector space $\\mathcal{O}(N)$.`,
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
      inputDisplay: "grid = [[0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]",
      outputDisplay: "8",
      title: "4x4 Grid with Obstacle",
      input: {
        grid: [
          [0, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
      },
      output: "8",
      explanation: "A 4x4 grid with an obstacle at (1,1) yields 8 unique paths from (0,0) to (3,3).",
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
    time: "Fills an M x N matrix in row-major order. Each cell performs O(1) additions, giving O(M * N) total time.",
    space:
      "Requires an M x N matrix to store unique path counts for all cells, taking O(M * N) auxiliary space.",
  },
  topicGuide: {
    overview:
      "Grid Unique Paths with Obstacles (LeetCode #63) is the fundamental benchmark for spatial 2D dynamic programming. A robot moves on an $m \\times n$ grid from $(0,0)$ to $(m-1, n-1)$ using only rightward and downward moves. Obstacles ($grid[r][c] = 1$) block traversal. 2D DP computes total paths in $\\mathcal{O}(M \\times N)$ time and $\\mathcal{O}(M \\times N)$ space.",
    sections: [
      {
        heading: "1. 2D Recurrence & Rule of Sum",
        body: "Let $dp[r][c]$ be the number of unique paths from $(0,0)$ to $(r, c)$.\n\n- **Base Case**: $dp[0][0] = 1$ if $grid[0][0] = 0$.\n- **Obstacle Rule**: $dp[r][c] = 0$ if $grid[r][c] = 1$.\n- **Transition**:\n  $$dp[r][c] = (r > 0 ? dp[r-1][c] : 0) + (c > 0 ? dp[r][c-1] : 0)$$\n- **Result**: $dp[m-1][n-1]$.",
      },
      {
        heading: "2. Why Combinatorics (Binomial Coefficients) Fails Here",
        body: "On an obstacle-free grid, total paths equals the binomial coefficient $\\binom{m+n-2}{m-1}$. However, obstacles break closed-form combinations, necessitating dynamic programming.",
      },
      {
        heading: "3. Systems Applications",
        body: "Spatial grid DP forms the foundation for:\n- **VLSI Microchip Routing**: Routing interconnect wires around physical component defect blocks.\n- **Warehouse AMR Navigation**: Autonomous mobile robot pathing on grid floors.\n- **Mesh Network Routing**: Packet delivery across 2D grid topologies.",
      },
      {
        heading: "4. Space Vector Compression",
        body: "Because $dp[r][c]$ depends only on row $r-1$ (top) and current row cell $c-1$ (left), memory compresses from $\\mathcal{O}(M \\times N)$ to $\\mathcal{O}(N)$ using a single 1D array.",
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
      chapter: "Ch 7",
      label: "Competitive Programmer's Handbook, Ch 7",
    },
  ],
  defaultInput: DEFAULT_GRID_PATHS_INPUT,
  generateSteps: generateGridPathsDpSteps,
};



