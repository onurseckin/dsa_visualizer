import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GridCellNode,
  GridVisualSnapshot,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Counting Tilings problem asks for the total number of ways to completely cover an N x M rectangular grid using non-overlapping 1x2 and 2x1 dominoes.",
    primarySnapshot: {
      kind: "grid",
      grid: Array.from({ length: 3 }, (_, r) =>
        Array.from({ length: 4 }, (_, c) => ({
          row: r,
          col: c,
          state: "default" as ElementState,
        })),
      ),
    },
  },
  {
    narrative:
      "Each domino covers exactly 2 unit squares, so if the total grid area N x M is odd, a complete domino tiling is mathematically impossible (0 tilings).",
    primarySnapshot: {
      kind: "array",
      name: "parity_check",
      mode: "box",
      elements: [
        { id: "p1", value: "Even Area (N*M % 2 == 0): Valid", state: "sorted" },
        { id: "p2", value: "Odd Area (N*M % 2 != 0): 0 Tilings", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Because dominoes placed horizontally cross column boundaries, independent row or column DP fails; we must track boundary overhangs between adjacent columns.",
    primarySnapshot: {
      kind: "array",
      name: "boundary",
      mode: "box",
      elements: [
        { id: "b1", value: "Horizontal Domino Overhang -> Column c+1", state: "compare" },
        { id: "b2", value: "Requires Bitmask Profile State", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "In Broken Profile Bitmask DP, we traverse grid cells one by one in row-major order, maintaining an N-bit profile mask of boundary cells extending into the next column.",
    primarySnapshot: {
      kind: "grid",
      grid: [
        [
          { row: 0, col: 0, state: "visited" },
          { row: 0, col: 1, state: "active" },
        ],
        [
          { row: 1, col: 0, state: "visited" },
          { row: 1, col: 1, state: "default" },
        ],
      ],
    },
  },
  {
    narrative:
      "An N-bit integer mask represents profile occupancy: bit r = 1 if cell (r, c) is already covered by a horizontal domino extending from column c-1, and 0 if empty.",
    primarySnapshot: {
      kind: "bitmask",
      name: "profile_mask",
      value: 5,
      bitWidth: 4,
      label: "Profile Bitmask",
      bits: [
        { index: 0, value: 1, label: "r=0 (Covered)", state: "active" },
        { index: 1, value: 0, label: "r=1 (Empty)", state: "default" },
        { index: 2, value: 1, label: "r=2 (Covered)", state: "active" },
        { index: 3, value: 0, label: "r=3 (Empty)", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Base case: dp[0] = 1 before column 0, representing 1 valid state with zero boundary overhangs (mask 0).",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: [
        { id: "d0", value: "dp[0] = 1", label: "mask 0", state: "sorted" },
        { id: "d1", value: "dp[mask] = 0", label: "others", state: "default" },
      ],
    },
  },
  {
    narrative:
      "At cell (r, c), if bit r = 1, the cell is already covered by a horizontal domino; we clear bit r into the next mask state.",
    primarySnapshot: {
      kind: "bitmask",
      name: "occupied_transition",
      value: 1,
      bitWidth: 4,
      label: "Bit r=1 Transition",
      bits: [
        { index: 0, value: 1, label: "Covered -> Clear", state: "compare" },
        { index: 1, value: 0, label: "r=1", state: "default" },
        { index: 2, value: 0, label: "r=2", state: "default" },
        { index: 3, value: 0, label: "r=3", state: "default" },
      ],
    },
  },
  {
    narrative:
      "If bit r = 0, cell (r, c) is empty: we can either place a 1x2 horizontal domino (setting bit r in next mask) or a 2x1 vertical domino covering (r, c) and (r+1, c).",
    primarySnapshot: {
      kind: "array",
      name: "placements",
      mode: "box",
      elements: [
        { id: "p_horiz", value: "Option A: 1x2 Horizontal (Set bit r)", state: "active" },
        { id: "p_vert", value: "Option B: 2x1 Vertical (Cover r, r+1)", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "After processing all N x M cells, dp[0] contains the total number of valid tilings with zero boundary overhangs, computed in O(N * M * 2^N) time.",
    primarySnapshot: {
      kind: "array",
      name: "result",
      mode: "box",
      elements: [
        { id: "res", value: "dp[0] = Total Tilings", state: "sorted" },
        { id: "comp", value: "O(N * M * 2^N) Time, O(2^N) Space", state: "default" },
      ],
    },
  },
];

export const generateCountingTilingsSteps = (input: CountingTilingsInput): AlgorithmStep[] => {
  const n = Math.min(6, Math.max(1, input?.n ?? DEFAULT_COUNTING_TILINGS_INPUT.n));
  const m = Math.min(10, Math.max(1, input?.m ?? DEFAULT_COUNTING_TILINGS_INPUT.m));
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (input.n === DEFAULT_COUNTING_TILINGS_INPUT.n && input.m === DEFAULT_COUNTING_TILINGS_INPUT.m);

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const createGridSnapshot = (
    activeCell?: { row: number; col: number },
    allSorted = false,
  ): GridVisualSnapshot => {
    const gridNodes: GridCellNode[][] = [];
    for (let r = 0; r < n; r++) {
      const rowNodes: GridCellNode[] = [];
      for (let c = 0; c < m; c++) {
        const isActive = activeCell && activeCell.row === r && activeCell.col === c;
        const isVisited =
          activeCell && (c < activeCell.col || (c === activeCell.col && r < activeCell.row));

        rowNodes.push({
          row: r,
          col: c,
          state: allSorted ? "sorted" : isActive ? "active" : isVisited ? "visited" : "default",
        });
      }
      gridNodes.push(rowNodes);
    }
    return { kind: "grid", grid: gridNodes };
  };

  addStep(
    `Initializing Counting Tilings algorithm for ${n}x${m} grid (total area ${n * m}).`,
    createGridSnapshot(),
  );

  if ((n * m) % 2 !== 0) {
    addStep(
      `Total grid area ${n * m} is odd; since 1x2 dominoes have area 2, odd area cannot be tiled. Returning 0 tilings immediately.`,
      createGridSnapshot(),
    );
    return steps;
  }

  const numMasks = 1 << n;
  let dp = new Array<number>(numMasks).fill(0);
  dp[0] = 1;

  addStep(
    `Setting base case dp[0] = 1 for 2^${n} = ${numMasks} profile states, representing 1 valid configuration before column 0.`,
    createGridSnapshot({ row: 0, col: 0 }),
  );

  for (let col = 0; col < m; col++) {
    for (let row = 0; row < n; row++) {
      const nextDp = new Array<number>(numMasks).fill(0);
      let activeMasks = 0;

      for (let mask = 0; mask < numMasks; mask++) {
        if (!dp[mask]) continue;
        activeMasks++;

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

      addStep(
        `Processed cell (row ${row}, col ${col}) across ${activeMasks} active boundary profile states. Current valid tilings count for zero overhang mask dp[0] = ${dp[0]}.`,
        createGridSnapshot({ row, col }),
      );
    }
  }

  const result = dp[0];
  addStep(
    `Completed Bitmask DP profile traversal: dp[0] = ${result}. The total number of valid domino tilings for a ${n}x${m} grid is ${result}.`,
    createGridSnapshot(undefined, true),
  );

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
    "<p>Given the dimensions <code>N</code> and <code>M</code> of a rectangular grid, calculate the number of ways to completely cover the grid using non-overlapping <code>1 &times; 2</code> and <code>2 &times; 1</code> dominoes.</p><p><strong>Input:</strong> Two integers <code>n</code> (rows) and <code>m</code> (columns).</p><p><strong>Output:</strong> The total number of valid domino tilings for the <code>n &times; m</code> grid.</p>",
  constraints: [
    "1 <= n <= 10",
    "1 <= m <= 10",
    "Time complexity O(N * M * 2^N)",
    "Output must fit within standard 64-bit integer representation",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "n = 4, m = 3",
      outputDisplay: "11",
      title: "Standard Case",
      input: { n: 4, m: 3 },
      output: "11",
      explanation: "A 4x3 grid can be tiled with 1x2 dominoes in exactly 11 distinct ways.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "n = 4, m = 4",
      outputDisplay: "36",
      title: "Adversarial Symmetric 4x4 Grid",
      input: { n: 4, m: 4 },
      output: "36",
      explanation: "A 4x4 grid has 36 valid domino tilings.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "n = 3, m = 3",
      outputDisplay: "0",
      title: "Odd Area Grid Boundary",
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
      chapter: 7,
      label: "Competitive Programmer's Handbook, Ch 7",
    },
  ],
  defaultInput: DEFAULT_COUNTING_TILINGS_INPUT,
  generateSteps: generateCountingTilingsSteps,
};
