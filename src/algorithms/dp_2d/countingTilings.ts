import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GridCellNode,
  GridVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface CountingTilingsInput {
  n: number;
  m: number;
}

export const DEFAULT_COUNTING_TILINGS_INPUT: CountingTilingsInput = {
  n: 4,
  m: 3,
};

export const PYTHON_COUNTING_TILINGS_CODE = `def count_tilings(n: int, m: int) -> int:
    if (n * m) % 2 != 0:
        return 0

    num_masks = 1 << n
    dp = [0] * num_masks
    dp[0] = 1

    for col in range(m):
        for row in range(n):
            next_dp = [0] * num_masks
            for mask in range(num_masks):
                if not dp[mask]:
                    continue
                if mask & (1 << row):
                    next_dp[mask ^ (1 << row)] += dp[mask]
                else:
                    next_dp[mask | (1 << row)] += dp[mask]
                    if row + 1 < n and not (mask & (1 << (row + 1))):
                        next_dp[mask | (1 << (row + 1))] += dp[mask]
            dp = next_dp

    return dp[0]`;

export const generateCountingTilingsSteps = (input: CountingTilingsInput): AlgorithmStep[] => {
  const n = Math.min(6, Math.max(1, input?.n ?? DEFAULT_COUNTING_TILINGS_INPUT.n));
  const m = Math.min(10, Math.max(1, input?.m ?? DEFAULT_COUNTING_TILINGS_INPUT.m));
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const createGridSnapshot = (
    activeCell?: { row: number; col: number },
    highlightedCells?: { row: number; col: number; state: ElementState }[],
    allSorted = false,
  ): GridVisualSnapshot => {
    const gridNodes: GridCellNode[][] = [];
    for (let r = 0; r < n; r++) {
      const rowNodes: GridCellNode[] = [];
      for (let c = 0; c < m; c++) {
        const isActive = activeCell && activeCell.row === r && activeCell.col === c;
        const customHighlight = highlightedCells?.find((cell) => cell.row === r && cell.col === c);

        let state: ElementState = "default";
        if (allSorted) {
          state = "sorted";
        } else if (isActive) {
          state = "active";
        } else if (customHighlight) {
          state = customHighlight.state;
        } else if (activeCell) {
          if (c < activeCell.col || (c === activeCell.col && r < activeCell.row)) {
            state = "visited";
          }
        }

        rowNodes.push({
          row: r,
          col: c,
          state,
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
      what: `Start Counting Tilings algorithm for ${n}x${m} grid`,
      why: "The goal is to calculate the total number of valid domino tilings (1x2 and 2x1) that cover the grid without overlaps or gaps.",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { customState: { n, m, totalArea: n * m } },
    variables: { n, m, totalArea: n * m },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Check grid area parity: total area ${n} * ${m} = ${n * m}`,
      why: "Each domino covers exactly 2 unit squares. If total grid area is odd, domino coverage is mathematically impossible.",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { customState: { n, m, isOdd: (n * m) % 2 !== 0 ? "true" : "false" } },
    variables: { n, m, isOdd: (n * m) % 2 !== 0 },
  });

  if ((n * m) % 2 !== 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 3,
      explanation: {
        what: `Total area ${n * m} is odd. Returning 0 tilings.`,
        why: "A grid with odd area cannot be covered by 1x2 dominoes of area 2.",
      },
      primarySnapshot: createGridSnapshot(),
      auxiliaryState: { customState: { n, m, totalArea: n * m } },
      variables: { result: 0 },
    });
    return steps;
  }

  const numMasks = 1 << n;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Calculate number of profile states num_masks = 2^${n} = ${numMasks}`,
      why: "An n-bit bitmask captures all possible boundary overhang configurations between adjacent columns.",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { customState: { n, m, numMasks } },
    variables: { n, numMasks },
  });

  let dp = new Array<number>(numMasks).fill(0);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Allocate DP array of size ${numMasks} initialized with 0`,
      why: "dp[mask] tracks the number of ways to reach the current profile boundary configuration.",
    },
    primarySnapshot: createGridSnapshot(),
    auxiliaryState: { customState: { n, numMasks } },
    variables: { numMasks },
  });

  dp[0] = 1;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: "Set base case dp[0] = 1",
      why: "There is exactly 1 valid configuration with zero boundary overhangs before processing column 0.",
    },
    primarySnapshot: createGridSnapshot(undefined, [{ row: 0, col: 0, state: "active" }]),
    auxiliaryState: { customState: { n, m, "dp[0]": 1 } },
    variables: { n, m, "dp[0]": 1 },
  });

  for (let col = 0; col < m; col++) {
    const colHighlights = Array.from({ length: n }, (_, r) => ({
      row: r,
      col,
      state: "pivot" as ElementState,
    }));
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 9,
      explanation: {
        what: `Begin column col = ${col}`,
        why: "Columns are processed left-to-right.",
      },
      primarySnapshot: createGridSnapshot(undefined, colHighlights),
      auxiliaryState: { customState: { col, m, "dp[0]": dp[0] } },
      variables: { col, m, "dp[0]": dp[0] },
    });

    for (let row = 0; row < n; row++) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 10,
        explanation: {
          what: `Process cell (row ${row}, col ${col})`,
          why: "Cell-by-cell profile updates transition bitmask states.",
        },
        primarySnapshot: createGridSnapshot({ row, col }),
        auxiliaryState: { customState: { col, row, "dp[0]": dp[0] } },
        variables: { col, row, "dp[0]": dp[0] },
      });

      const nextDp = new Array<number>(numMasks).fill(0);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 11,
        explanation: {
          what: `Allocate next_dp array of size ${numMasks} for cell (${row}, ${col})`,
          why: "Stores updated boundary profile counts resulting from domino placements at the current cell.",
        },
        primarySnapshot: createGridSnapshot({ row, col }),
        auxiliaryState: { customState: { col, row, nextDpSize: numMasks, "dp[0]": dp[0] } },
        variables: { col, row, numMasks, "dp[0]": dp[0] },
      });

      let transitionsCount = 0;
      for (let mask = 0; mask < numMasks; mask++) {
        if (!dp[mask]) continue;
        transitionsCount++;

        if (mask & (1 << row)) {
          nextDp[mask ^ (1 << row)] += dp[mask];
        } else {
          nextDp[mask | (1 << row)] += dp[mask];
          if (row + 1 < n && !(mask & (1 << (row + 1)))) {
            nextDp[mask | (1 << (row + 1))] += dp[mask];
          }
        }
      }

      dp = nextDp;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 21,
        explanation: {
          what: `Finished transitions for cell (row ${row}, col ${col}) across ${transitionsCount} active profile masks`,
          why: `Profile transitions updated DP table for column ${col}, row ${row}. Current dp[0] = ${dp[0]}.`,
        },
        primarySnapshot: createGridSnapshot({ row, col }),
        auxiliaryState: {
          customState: { col, row, dp0: dp[0], activeMasks: transitionsCount },
        },
        variables: { col, row, "dp[0]": dp[0] },
      });
    }
  }

  const result = dp[0];
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 23,
    explanation: {
      what: `Final result dp[0] = ${result}`,
      why: `The total number of valid domino tilings for a ${n}x${m} grid with zero boundary overhangs is ${result}.`,
    },
    primarySnapshot: createGridSnapshot(undefined, undefined, true),
    auxiliaryState: { customState: { totalTilings: result } },
    variables: { result },
  });

  return steps;
};

const COUNTING_TILINGS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines count_tilings(n, m) -> int: counts valid 1x2 and 2x1 domino tilings of an n x m grid.",
    2: "Checks if total grid area n * m is odd ((n * m) % 2 != 0).",
    3: "Returns 0 immediately if total area is odd, because 1x2 dominoes have area 2 and cannot tile an odd total area.",
    4: "Blank line separating parity validation check from DP profile state setup.",
    5: "Calculates total profile states num_masks = 2^n using left bit-shift (1 << n).",
    6: "Allocates DP array dp of size 2^n initialized to zeros.",
    7: "Sets base case dp[0] = 1 (empty boundary profile with zero overhangs).",
    8: "Blank line separating profile allocation from grid column iteration.",
    9: "Outer loop sweeps column index col from 0 to m - 1.",
    10: "Middle loop sweeps row index row from 0 to n - 1.",
    11: "Allocates next_dp array of size 2^n for storing current cell's profile transitions.",
    12: "Inner loop sweeps through all 2^n possible boundary profile bitmasks.",
    13: "Checks if dp[mask] has non-zero valid tilings count.",
    14: "Skips unreachable profile masks with zero tilings.",
    15: "Checks if bit row is set in mask (mask & (1 << row)), meaning cell (row, col) is already covered by a horizontal domino.",
    16: "Clears bit row into next_dp state: next_dp[mask ^ (1 << row)] += dp[mask].",
    17: "Else branch executed when cell (row, col) is unoccupied.",
    18: "Option A: Place a horizontal 1x2 domino extending into col+1, setting bit row in next_dp.",
    19: "Checks Option B: if row+1 < n and bit row+1 is empty, try placing a vertical 2x1 domino.",
    20: "Option B executed: places vertical domino covering (row, col) and (row+1, col), setting bit row+1 in next_dp.",
    21: "Updates dp = next_dp after evaluating all profile transitions for cell (row, col).",
    22: "Blank line separating grid traversal loops from returning final result.",
    23: "Returns dp[0], total domino tilings leaving zero boundary overhangs.",
  },
};

export const countingTilings: AlgorithmDefinition<CountingTilingsInput> = {
  id: "counting-tilings",
  title: "Counting Tilings (Bitmask DP)",
  topicIds: ["dp_2d"],
  difficulty: "Hard",
  description:
    "<p>The <strong>Counting Tilings</strong> problem (CSES #2181) asks for the number of ways to completely tile an <code>N &times; M</code> grid using non-overlapping <code>1 &times; 2</code> and <code>2 &times; 1</code> dominoes.</p><p>If the total area <code>N &times; M</code> is odd, tiling is impossible, returning 0 immediately. For even area, <strong>Broken Profile Bitmask DP</strong> processes grid cells sequentially, maintaining an <code>N</code>-bit mask representing boundary cells extending into the next column. This yields an efficient state transition in <code>O(N &times; M &times; 2<sup>N</sup>)</code> time.</p>",
  constraints: [
    "1 <= n <= 10",
    "1 <= m <= 10",
    "Time complexity O(N * M * 2^N)",
    "Output must fit within standard 64-bit integer representation",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "n = 4, m = 3",
      outputDisplay: "11",
      title: "Basic Case",
      input: { n: 4, m: 3 },
      output: "11",
      explanation: "A 4x3 grid can be tiled with 1x2 dominoes in exactly 11 distinct ways.",
    },
    {
      kind: "complex",
      inputDisplay: "n = 4, m = 4",
      outputDisplay: "36",
      title: "4x4 Grid",
      input: { n: 4, m: 4 },
      output: "36",
      explanation: "A 4x4 grid has 36 valid domino tilings.",
    },
    {
      kind: "negative",
      inputDisplay: "n = 3, m = 3",
      outputDisplay: "0",
      title: "Odd Area Grid",
      input: { n: 3, m: 3 },
      output: "0",
      explanation: "Odd total area 9 cannot be covered by 1x2 dominoes, returning 0.",
    },
  ],
  code: PYTHON_COUNTING_TILINGS_CODE,
  timeComplexity: { best: "O(N * M * 2^N)", average: "O(N * M * 2^N)", worst: "O(N * M * 2^N)" },
  spaceComplexity: "O(2^N)",
  complexityAnalysis: {
    time: "Processes N * M grid cells, updating 2^N profile states per cell, yielding O(N * M * 2^N) total time.",
    space: "Maintains DP arrays of size 2^N to track boundary profile bitmask states.",
  },
  topicGuide: {
    overview:
      "<p>Counting domino tilings of an <code>N &times; M</code> grid is a landmark problem in algebraic combinatorics and advanced dynamic programming (CSES #2181 / Kasteleyn Tiling Theory). When <code>N &le; 10</code>, broken profile bitmask DP processes grid cells sequentially, maintaining an <code>N</code>-bit mask for boundary profile occupancy in <code>O(N &times; M &times; 2<sup>N</sup>)</code> time and <code>O(2<sup>N</sup>)</code> space.</p>",
    sections: [
      {
        heading: "1. Broken Profile Bitmask Representation",
        body: "<p>An <code>N</code>-bit integer <code>mask</code> represents the profile boundary state between column <code>c-1</code> and <code>c</code>. The <code>i</code>-th bit is 1 if cell <code>(i, c)</code> is occupied by a horizontal domino extending from column <code>c-1</code>, and 0 otherwise.</p>",
      },
      {
        heading: "2. Cell-by-Cell Transitions",
        body: "<p>At cell <code>(r, c)</code>:</p><ul><li><strong>Bit r = 1:</strong> Cell is occupied. Clear bit <code>r</code> in <code>next_dp</code>.</li><li><strong>Bit r = 0:</strong> Cell is empty.<ul><li><em>Option A (Horizontal):</em> Place 1x2 domino, setting bit <code>r</code> in <code>next_dp</code>.</li><li><em>Option B (Vertical):</em> If <code>r+1 &lt; N</code> and bit <code>r+1 = 0</code>, place 2x1 domino, setting bit <code>r+1</code> in <code>next_dp</code>.</li></ul></li></ul>",
      },
      {
        heading: "3. Kasteleyn Exact Trigonometric Formula",
        body: "<p>For unobstructed <code>N &times; M</code> grids, Kasteleyn's exact formula computes the total tilings in closed form using trigonometric products of cosine terms.</p>",
      },
      {
        heading: "4. Physical Science & Systems Applications",
        body: "<p>Domino tiling algorithms model dimer coverage in statistical mechanics (Ising model), molecular surface adsorption in physical chemistry, and cell layout packing in VLSI integrated circuit design.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Broken Profile DP",
        definition:
          "A dynamic programming technique processing grid cells individually while maintaining a boundary profile bitmask.",
      },
      {
        term: "Domino Tiling",
        definition:
          "A complete tessellation of a grid using 1x2 and 2x1 rectangular tiles without gaps or overlaps.",
      },
      {
        term: "Kasteleyn Formula",
        definition:
          "An exact matrix product formula for counting planar bipartite graph matchings.",
      },
    ],
  },
  trivia: COUNTING_TILINGS_TRIVIA,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 7",
      label: "Competitive Programmer's Handbook, Ch 7",
    },
  ],
  defaultInput: DEFAULT_COUNTING_TILINGS_INPUT,
  generateSteps: generateCountingTilingsSteps,
};
