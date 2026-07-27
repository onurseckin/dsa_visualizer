import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
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

    dp = [0] * (1 << n)
    dp[0] = 1

    for col in range(m):
        for row in range(n):
            next_dp = [0] * (1 << n)
            for mask in range(1 << n):
                if not dp[mask]:
                    continue
                if mask & (1 << row):
                    next_dp[mask ^ (1 << row)] += dp[mask]
                else:
                    next_dp[mask | (1 << row)] += dp[mask]
                    if row + 1 < n and not (mask & (1 << (row + 1))):
                        next_dp[mask] += dp[mask]
            dp = next_dp

    return dp[0]`;

export const generateCountingTilingsSteps = (input: CountingTilingsInput): AlgorithmStep[] => {
  const n = Math.min(6, Math.max(1, input?.n ?? DEFAULT_COUNTING_TILINGS_INPUT.n));
  const m = Math.min(10, Math.max(1, input?.m ?? DEFAULT_COUNTING_TILINGS_INPUT.m));
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  if ((n * m) % 2 !== 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 3,
      explanation: {
        what: `Total area n * m = ${n * m} is odd`,
        why: "A grid with odd total area cannot be tiled using 1x2 dominoes of area 2. Return 0.",
      },
      primarySnapshot: {
        kind: "array",
        elements: [{ id: "dp-0", value: 0, state: "sorted", pointers: ["result: 0"] }],
      },
      auxiliaryState: { customState: { n, m, totalArea: n * m } },
      variables: { result: 0 },
    });
    return steps;
  }

  const numMasks = 1 << n;
  let dp = new Array<number>(numMasks).fill(0);
  dp[0] = 1;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Initialize bitmask DP table for n=${n}`,
      why: `Size of mask space is 2^${n} = ${numMasks}. dp[0] = 1 (empty profile before col 0).`,
    },
    primarySnapshot: {
      kind: "array",
      elements: dp.map((val, mask) => ({
        id: `mask-${mask}`,
        value: val,
        state: mask === 0 ? "active" : "default",
        pointers: mask === 0 ? ["mask 0"] : undefined,
      })),
    },
    auxiliaryState: { customState: { n, m, numMasks } },
    variables: { n, m, "dp[0]": 1 },
  });

  for (let col = 0; col < m; col++) {
    for (let row = 0; row < n; row++) {
      const nextDp = new Array<number>(numMasks).fill(0);

      for (let mask = 0; mask < numMasks; mask++) {
        if (!dp[mask]) continue;

        if (mask & (1 << row)) {
          nextDp[mask ^ (1 << row)] += dp[mask];
        } else {
          nextDp[mask | (1 << row)] += dp[mask];
          if (row + 1 < n && !(mask & (1 << (row + 1)))) {
            nextDp[mask] += dp[mask];
          }
        }
      }

      dp = nextDp;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 10,
        explanation: {
          what: `Processed cell (row ${row}, col ${col})`,
          why: `Profile transition updated dp table for column ${col}, row ${row}. dp[0] is currently ${dp[0]}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: dp.map((val, mask) => ({
            id: `mask-${mask}`,
            value: val,
            state: mask === 0 ? "active" : val > 0 ? "visited" : "default",
            pointers: mask === 0 ? [`dp[0]: ${val}`] : undefined,
          })),
        },
        auxiliaryState: {
          customState: { col, row, dp0: dp[0] },
        },
        variables: { col, row, "dp[0]": dp[0] },
      });
    }
  }

  const result = dp[0];
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 20,
    explanation: {
      what: `Return dp[0] = ${result}`,
      why: `The total number of valid domino tilings for a ${n}x${m} grid is ${result}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: dp.map((val, mask) => ({
        id: `mask-${mask}`,
        value: val,
        state: mask === 0 ? "sorted" : "default",
        pointers: mask === 0 ? [`result: ${val}`] : undefined,
      })),
    },
    auxiliaryState: { customState: { totalTilings: result } },
    variables: { result },
  });

  return steps;
};

const COUNTING_TILINGS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines count_tilings(n, m) -> int: profile bitmask DP.",
    2: "If n * m is odd, returning 0 immediately.",
    5: "Initializes dp table of size 2^n with 0s.",
    6: "Sets dp[0] = 1 for the empty boundary.",
    8: "Iterates through each column col from 0 to m - 1.",
    9: "Iterates through each row row from 0 to n - 1.",
    10: "Allocates next_dp table for current cell transition.",
    11: "Loops through all bitmasks from 0 to 2^n - 1.",
    14: "If bit at row is set, places horizontal domino extending from previous cell.",
    16: "Else places horizontal domino extending to next cell or vertical domino with row below.",
    20: "Returns dp[0], valid tilings leaving no overhangs.",
  },
};

export const countingTilings: AlgorithmDefinition<CountingTilingsInput> = {
  id: "counting-tilings",
  title: "Counting Tilings (Bitmask DP)",
  category: "dp_2d",
  difficulty: "Hard",
  description:
    "Counts the number of ways to tile an n x m grid using 1x2 and 2x1 dominoes using profile/broken-profile bitmask dynamic programming.",
  constraints: ["1 <= n <= 6", "1 <= m <= 10"],
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
      explanation: "Odd total area 9 cannot be covered by 1x2 dominoes.",
    },
  ],
  code: PYTHON_COUNTING_TILINGS_CODE,
  timeComplexity: { best: "O(N * M * 2^N)", average: "O(N * M * 2^N)", worst: "O(N * M * 2^N)" },
  spaceComplexity: "O(2^N)",
  complexityAnalysis: {
    time: "Processes N * M cells, updating 2^N profile states per cell, yielding O(N * M * 2^N) time.",
    space: "Maintains DP arrays of size 2^N for profile state bitmasks.",
  },
  topicGuide: {
    overview:
      "Broken profile bitmask DP fills grid cell by cell (row, col), tracking a bitmask of occupied cells in the boundary boundary.",
    sections: [
      {
        heading: "Profile Bitmask",
        body: "Bit i in mask represents whether cell (i, col) is filled by a horizontal domino extending into the next column.",
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
