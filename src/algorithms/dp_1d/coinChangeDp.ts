import type { AlgorithmDefinition, AlgorithmStep, PrimaryVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface CoinChangeInput {
  coins: number[];
  amount: number;
}

export const DEFAULT_COIN_CHANGE_INPUT: CoinChangeInput = {
  coins: [1, 3, 4],
  amount: 6,
};

export const PYTHON_COIN_CHANGE_CODE = `def coin_change(coins: list[int], amount: int) -> int:
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0

    for i in range(1, amount + 1):
        for coin in coins:
            if i - coin >= 0:
                dp[i] = min(dp[i], dp[i - coin] + 1)

    return dp[amount] if dp[amount] != float('inf') else -1`;

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Coin Change problem asks for the minimum number of coins needed to make up a given target amount using a set of coin denominations with an infinite supply of each coin.",
    primarySnapshot: {
      kind: "composite",
      layout: "vertical",
      heading: "Coin Change Problem Setup",
      items: [
        {
          id: "coins-array",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "coins",
            mode: "box",
            elements: [
              { id: "c1", value: 1, label: "[0]", state: "default" },
              { id: "c2", value: 3, label: "[1]", state: "default" },
              { id: "c3", value: 4, label: "[2]", state: "default" },
            ],
          },
        },
        {
          id: "target-display",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "dp",
            mode: "box",
            elements: [{ id: "target-6", value: "Target: 6", state: "active" }],
          },
        },
      ],
    },
  },
  {
    narrative:
      "A greedy strategy of choosing the largest coin first fails for general coin sets; for example, with coins [1, 3, 4] and target 6, greedy picks 4 + 1 + 1 (3 coins), whereas 3 + 3 (2 coins) is optimal.",
    primarySnapshot: {
      kind: "composite",
      layout: "vertical",
      heading: "Greedy Strategy Failure Case",
      items: [
        {
          id: "coins-array",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "coins",
            mode: "box",
            elements: [
              { id: "c1", value: 1, label: "Greedy", state: "compare" },
              { id: "c2", value: 3, label: "Optimal", state: "sorted" },
              { id: "c3", value: 4, label: "Greedy", state: "compare" },
            ],
          },
        },
        {
          id: "comparison",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "dp",
            mode: "box",
            elements: [
              { id: "g1", value: "Greedy: 4+1+1 (3)", state: "compare" },
              { id: "g2", value: "Optimal: 3+3 (2)", state: "sorted" },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "To guarantee finding the true minimum, we decompose the problem into subproblems: for any target amount i, we consider taking each valid coin c and reducing to subproblem i - c.",
    primarySnapshot: {
      kind: "composite",
      layout: "vertical",
      heading: "Subproblem Decomposition",
      items: [
        {
          id: "coins-array",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "coins",
            mode: "box",
            elements: [
              { id: "c1", value: 1, state: "active", pointers: ["c"] },
              { id: "c2", value: 3, state: "default" },
              { id: "c3", value: 4, state: "default" },
            ],
          },
        },
        {
          id: "dp-array",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "dp",
            mode: "box",
            elements: [
              { id: "dp-sub", value: "dp[i - c]", label: "[i-c]", state: "compare" },
              { id: "dp-curr", value: "dp[i]", label: "[i]", state: "active" },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "We define dp[i] as the minimum number of coins required to form target amount i, storing subproblem answers in a 1D table of size amount + 1.",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: Array.from({ length: 7 }, (_, idx) => ({
        id: `dp-init-${idx}`,
        value: "uncomputed",
        label: `[${idx}]`,
        state: "default",
      })),
    },
  },
  {
    narrative:
      "The base case is dp[0] = 0 because zero coins are needed to form a total amount of zero.",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: Array.from({ length: 7 }, (_, idx) => ({
        id: `dp-base-${idx}`,
        value: idx === 0 ? 0 : "∞",
        label: `[${idx}]`,
        state: idx === 0 ? "sorted" : "default",
        pointers: idx === 0 ? ["base: 0"] : undefined,
      })),
    },
  },
  {
    narrative:
      "All other table entries dp[1 ... amount] are initialized to infinity to represent unreached amounts before iteration.",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: Array.from({ length: 7 }, (_, idx) => ({
        id: `dp-inf-${idx}`,
        value: idx === 0 ? 0 : "∞",
        label: `[${idx}]`,
        state: idx === 0 ? "sorted" : "active",
      })),
    },
  },
  {
    narrative:
      "The state transition recurrence is dp[i] = min(dp[i], dp[i - c] + 1) for every coin denomination c where c <= i.",
    primarySnapshot: {
      kind: "composite",
      layout: "vertical",
      heading: "Recurrence Relation",
      items: [
        {
          id: "coins-array",
          role: "auxiliary",
          snapshot: {
            kind: "array",
            name: "coins",
            mode: "box",
            elements: [
              { id: "c1", value: 1, state: "active" },
              { id: "c2", value: 3, state: "active" },
              { id: "c3", value: 4, state: "active" },
            ],
          },
        },
        {
          id: "dp-array",
          role: "primary",
          snapshot: {
            kind: "array",
            name: "dp",
            mode: "box",
            elements: [
              { id: "rec-0", value: 0, label: "[0]", state: "sorted" },
              { id: "rec-rem", value: "min(dp[i-c] + 1)", label: "[i]", state: "active" },
            ],
          },
        },
      ],
    },
  },
  {
    narrative:
      "We iterate target amount i from 1 to target amount in bottom-up order, ensuring each subproblem dp[i - c] is already solved.",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: Array.from({ length: 7 }, (_, idx) => ({
        id: `dp-sweep-${idx}`,
        value: idx === 0 ? 0 : "∞",
        label: `[${idx}]`,
        state: idx === 1 ? "active" : idx === 0 ? "visited" : "default",
        pointers: idx === 1 ? ["i = 1"] : undefined,
      })),
    },
  },
  {
    narrative:
      "If after filling the entire table dp[amount] remains infinity, no coin combination can sum to the target amount and we return -1.",
    primarySnapshot: {
      kind: "array",
      name: "dp",
      mode: "box",
      elements: [
        { id: "unreachable-0", value: 0, label: "[0]", state: "visited" },
        {
          id: "unreachable-target",
          value: "∞ -> -1",
          label: "[amount]",
          state: "compare",
          pointers: ["return -1"],
        },
      ],
    },
  },
];

export const generateCoinChangeSteps = (input: CoinChangeInput): AlgorithmStep[] => {
  const coins = input?.coins && input.coins.length > 0 ? [...input.coins] : [1, 3, 4];
  const amount = Math.max(0, input?.amount ?? 6);
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const dp: number[] = new Array(amount + 1).fill(Infinity);

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input?.coins) &&
      input.coins.length === DEFAULT_COIN_CHANGE_INPUT.coins.length &&
      input.coins.every((val, idx) => val === DEFAULT_COIN_CHANGE_INPUT.coins[idx]) &&
      input.amount === DEFAULT_COIN_CHANGE_INPUT.amount);

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const makeSnapshot = (
    currentI: number,
    currentCoin?: number,
    subI?: number,
    highlightResult = false,
  ): PrimaryVisualSnapshot => ({
    kind: "composite",
    layout: "vertical",
    heading: `Target Amount: ${currentI}`,
    items: [
      {
        id: "coins-array",
        role: "auxiliary",
        snapshot: {
          kind: "array",
          name: "coins",
          mode: "box",
          elements: coins.map((c, idx) => ({
            id: `c-${idx}`,
            value: c,
            label: `[${idx}]`,
            state: c === currentCoin ? "active" : "default",
          })),
        },
      },
      {
        id: "dp-array",
        role: "primary",
        snapshot: {
          kind: "array",
          name: "dp",
          mode: "box",
          elements: dp.map((v, idx) => ({
            id: `dp-${idx}`,
            value: v === Infinity ? "∞" : v,
            label: `[${idx}]`,
            state:
              highlightResult && idx === amount
                ? v === Infinity
                  ? "compare"
                  : "sorted"
                : idx === currentI
                  ? "active"
                  : subI !== undefined && idx === subI
                    ? "compare"
                    : idx < currentI
                      ? "visited"
                      : "default",
            pointers:
              idx === currentI
                ? [`i = ${currentI}`]
                : subI !== undefined && idx === subI
                  ? [`sub = ${subI}`]
                  : undefined,
          })),
        },
      },
    ],
  });

  addStep(
    `We initialize a DP table of size ${amount + 1} with infinity representing uncomputed states, and set base case dp[0] = 0 because 0 coins form amount 0.`,
    makeSnapshot(0),
  );

  dp[0] = 0;

  addStep(
    `With dp[0] set to 0, we begin filling the DP table for target subproblems from amount 1 up to ${amount}.`,
    makeSnapshot(0),
  );

  for (let i = 1; i <= amount; i++) {
    addStep(
      `Evaluating target subproblem amount i = ${i}; we will test all available coins [${coins.join(", ")}] to compute the minimum coins needed for amount ${i}.`,
      makeSnapshot(i),
    );

    for (const coin of coins) {
      if (i - coin >= 0) {
        const subVal = dp[i - coin];
        const candidate = subVal === Infinity ? Infinity : subVal + 1;
        const prevVal = dp[i];
        dp[i] = Math.min(dp[i], candidate);

        addStep(
          `Testing coin denomination ${coin} for amount ${i}: subtracting coin ${coin} points to subproblem dp[${i - coin}] = ${subVal === Infinity ? "∞" : subVal}. Candidate coins count is ${candidate === Infinity ? "∞" : candidate}, updating dp[${i}] from ${prevVal === Infinity ? "∞" : prevVal} to ${dp[i] === Infinity ? "∞" : dp[i]}.`,
          makeSnapshot(i, coin, i - coin),
        );
      } else {
        addStep(
          `Testing coin denomination ${coin} for amount ${i}: coin ${coin} exceeds target amount ${i}, so this coin cannot be used.`,
          makeSnapshot(i, coin),
        );
      }
    }
  }

  const finalResult = dp[amount] === Infinity ? -1 : dp[amount];
  addStep(
    finalResult === -1
      ? `Completed table evaluation: dp[${amount}] remains infinity, meaning no coin combination can form target amount ${amount}. We return -1.`
      : `Completed table evaluation: dp[${amount}] = ${finalResult}. The minimum number of coins required to form target amount ${amount} is ${finalResult}.`,
    makeSnapshot(amount, undefined, undefined, true),
  );

  return steps;
};

const COIN_CHANGE_DP_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines coin_change(coins, amount) -> int: computes minimum coins required to make total amount.",
    2: "Allocates dp table of size amount + 1 initialized to float('inf') representing uncomputed amounts.",
    3: "Base case: dp[0] = 0 because 0 coins are required to form amount 0.",
    4: "Blank line separating table allocation and base case setup from the outer DP loop.",
    5: "Outer loop sweeps target subproblem amount i from 1 to target amount.",
    6: "Inner loop considers each coin denomination in coins.",
    7: "Guards against negative subproblem indices by evaluating if i - coin >= 0.",
    8: "Updates dp[i] = min(dp[i], dp[i - coin] + 1) using optimal substructure.",
    9: "Blank line separating DP state transitions from final result evaluation.",
    10: "Returns dp[amount] if reachable; otherwise returns -1.",
  },
};

export const coinChangeDp: AlgorithmDefinition<CoinChangeInput> = {
  id: "coin-change-dp",
  title: "Coin Change Minimum Coins (Dynamic Programming)",
  topicIds: ["dp_1d"],
  difficulty: "Medium",
  description:
    "<p>Given an array of distinct positive integers <code>coins</code> representing coin denominations and an integer <code>amount</code> representing a target total value, determine the minimum number of coins needed to make up that amount. You may assume an infinite supply of each coin denomination.</p><p><strong>Input:</strong> An array of integers <code>coins</code> and an integer <code>amount</code>.</p><p><strong>Output:</strong> The minimum number of coins required to form <code>amount</code>, or <code>-1</code> if that amount cannot be formed by any combination of the coins.</p>",
  constraints: [
    "1 <= coins.length <= 12",
    "1 <= coins[i] <= 2^31 - 1",
    "0 <= amount <= 10^4",
    "All elements in coins are unique positive integers",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "coins = [1, 3, 4], amount = 6",
      outputDisplay: "2",
      title: "Standard Case",
      input: { coins: [1, 3, 4], amount: 6 },
      output: "2",
      explanation:
        "Optimal combination is 3 + 3 = 6 (2 coins). A greedy choice (4 + 1 + 1 = 3 coins) would be suboptimal.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "coins = [2, 5, 10, 12], amount = 15",
      outputDisplay: "2",
      title: "Adversarial Greedy Trap",
      input: { coins: [2, 5, 10, 12], amount: 15 },
      output: "2",
      explanation:
        "Optimal combination 10 + 5 = 15 uses 2 coins. Taking the largest coin 12 leads to 12 + 2 = 14 (incomplete/suboptimal).",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "coins = [2, 4], amount = 7",
      outputDisplay: "-1",
      title: "Unreachable Amount Boundary",
      input: { coins: [2, 4], amount: 7 },
      output: "-1",
      explanation:
        "Target amount 7 cannot be formed using only even coin denominations (2, 4), so dp[7] remains infinity and returns -1.",
    },
  ],
  code: PYTHON_COIN_CHANGE_CODE,
  timeComplexity: { best: "O(N * amount)", average: "O(N * amount)", worst: "O(N * amount)" },
  spaceComplexity: "O(amount)",
  complexityAnalysis: {
    time: "The dp table has amount + 1 entries. For each entry, we evaluate all N coin denominations. Filling the table takes O(N * amount) total time.",
    space: "Requires a 1D DP table of size amount + 1, taking O(amount) auxiliary space.",
  },
  topicGuide: {
    overview:
      "<p>The Coin Change problem (LeetCode #322) is the foundational benchmark for 1D dynamic programming and unbounded knapsack optimization. Given an array of coin denominations <code>C = {c<sub>1</sub>, c<sub>2</sub>, &hellip;, c<sub>n</sub>}</code> and a target amount <code>A</code>, we determine the minimal count of coins required to achieve <code>A</code>. Because coin supply is infinite, the decision state for amount <code>i</code> depends on all subproblems <code>i - c</code> for <code>c &isin; C</code>. A bottom-up tabulation approach populates a 1D DP table of size <code>A + 1</code> in <code>O(N &times; A)</code> time.</p>",
    sections: [
      {
        heading: "1. Mathematical Formulation & Recurrence",
        body: "<p>We define <code>dp[i]</code> as the minimum number of coins needed to sum to amount <code>i</code>.</p><ul><li><strong>Base Case:</strong> <code>dp[0] = 0</code> (zero coins yield an amount of 0).</li><li><strong>Initialization:</strong> <code>dp[i] = &infin;</code> for all <code>i &gt; 0</code>.</li><li><strong>State Transition:</strong> <code>dp[i] = min(dp[i - c] + 1)</code> for all <code>c &le; i</code>.</li></ul><p>If <code>dp[A] = &infin;</code> after building the table, no valid coin combination exists, so we return <code>-1</code>.</p>",
      },
      {
        heading: "2. Why Greedy Choice Fails",
        body: "<p>Canonical currency systems (e.g., US coins <code>{1, 5, 10, 25}</code>) possess the matroid property where the greedy strategy is optimal. However, for general coin sets, greedy fails.</p><p><em>Example:</em> Coins <code>C = {1, 3, 4}</code>, Target <code>A = 6</code>.</p><ul><li><strong>Greedy:</strong> Chooses 4, remaining amount 2 &rArr; 4 + 1 + 1 (3 coins).</li><li><strong>Optimal (DP):</strong> Chooses 3, remaining amount 3 &rArr; 3 + 3 (2 coins).</li></ul>",
      },
      {
        heading: "3. Systems Applications",
        body: "<p>The 1D unbounded knapsack pattern underpins core systems engineering problems:</p><ul><li><strong>Memory Allocator Slabs:</strong> Operating system allocators (such as <code>jemalloc</code> or <code>tcmalloc</code>) combine fixed slab sizes to fulfill allocation requests with minimal chunk overhead.</li><li><strong>Token Bucket Rate Limiting:</strong> Distributed rate limiters pack token requests into fixed bucket capacities.</li><li><strong>Instruction Slot Packing:</strong> Compilers pack VLIW instruction bundles under hardware register constraints.</li></ul>",
      },
      {
        heading: "4. Complexity & Implementation Edge Cases",
        body: "<p><strong>Time Complexity:</strong> <code>O(N &times; A)</code> where <code>N = |C|</code> and <code>A = amount</code>.<br/><strong>Space Complexity:</strong> <code>O(A)</code> for the 1D DP table.</p><ul><li><strong>Target A = 0:</strong> Instantly returns 0 without table sweeps.</li><li><strong>Unreachable Amounts:</strong> If no combination sums to <code>A</code>, returns -1.</li><li><strong>Integer Overflow:</strong> Initializing with infinity requires care to prevent overflow when calculating <code>dp[i - c] + 1</code>.</li></ul>",
      },
    ],
    keyTerms: [
      {
        term: "Unbounded Knapsack",
        definition:
          "A class of dynamic programming problems where items (coins) can be reused an unlimited number of times.",
      },
      {
        term: "Optimal Substructure",
        definition:
          "The property where an optimal solution to amount i incorporates optimal solutions to subproblems i - c.",
      },
      {
        term: "Sentinel Value",
        definition: "A placeholder such as infinity used to denote impossible or unvisited states.",
      },
      {
        term: "1D Tabulation",
        definition:
          "A bottom-up iterative DP approach that fills a single-dimensional table from base cases to the target answer.",
      },
    ],
  },
  trivia: COIN_CHANGE_DP_TRIVIA,
  leetcode: {
    id: 322,
    url: "https://leetcode.com/problems/coin-change/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #322",
      leetcodeId: 322,
      url: "https://leetcode.com/problems/coin-change/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 7",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 7,
      section: "7.1 Coin problem",
    },
  ],
  defaultInput: DEFAULT_COIN_CHANGE_INPUT,
  generateSteps: generateCoinChangeSteps,
};
