import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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

export const generateCoinChangeSteps = (input: CoinChangeInput): AlgorithmStep[] => {
  const coins = input?.coins && input.coins.length > 0 ? [...input.coins] : [1, 3, 4];
  const amount = Math.max(0, input?.amount ?? 6);
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const dp: number[] = new Array(amount + 1).fill(Infinity);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Start Coin Change algorithm with coins=[${coins.join(", ")}] and amount=${amount}`,
      why: "The goal is to find the minimum number of coins needed to make up the target amount using unlimited coins of each denomination.",
    },
    primarySnapshot: {
      kind: "array",
      elements: dp.map((v, idx) => ({
        id: `dp-${idx}`,
        value: v === Infinity ? -1 : v,
        state: "default",
      })),
    },
    auxiliaryState: {
      customState: { amount, coins: coins.join(", ") },
    },
    variables: { amount, coinsCount: coins.length },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Initialize DP table of size ${amount + 1} with infinity (float('inf'))`,
      why: `dp[i] stores the minimum coins required for target amount i. Infinity represents an unreached/uncomputed amount.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: dp.map((v, idx) => ({
        id: `dp-${idx}`,
        value: v === Infinity ? -1 : v,
        state: "default",
      })),
    },
    auxiliaryState: {
      customState: { amount, coins: coins.join(", ") },
    },
    variables: { amount, "dp[0]": -1 },
  });

  dp[0] = 0;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: "Set base case dp[0] = 0",
      why: "Exactly 0 coins are required to form a total amount of 0.",
    },
    primarySnapshot: {
      kind: "array",
      elements: dp.map((v, idx) => ({
        id: `dp-${idx}`,
        value: v === Infinity ? -1 : v,
        state: idx === 0 ? "sorted" : "default",
        pointers: idx === 0 ? ["base: 0"] : undefined,
      })),
    },
    auxiliaryState: {
      customState: { amount, coins: coins.join(", ") },
    },
    variables: { amount, "dp[0]": 0 },
  });

  for (let i = 1; i <= amount; i++) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `Begin outer loop evaluating target subproblem amount i = ${i}`,
        why: `We will test each available coin denomination to find the minimal coin count for amount ${i}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: dp.map((v, idx) => ({
          id: `dp-${idx}`,
          value: v === Infinity ? -1 : v,
          state: idx === i ? "active" : idx < i ? "visited" : "default",
          pointers: idx === i ? [`target: ${i}`] : undefined,
        })),
      },
      auxiliaryState: {
        customState: { targetAmount: i, currentCoins: coins.join(", ") },
      },
      variables: { i, amount },
    });

    for (const coin of coins) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 6,
        explanation: {
          what: `Inspect coin denomination ${coin} for target amount ${i}`,
          why: `Iterating over available coin choices for amount ${i}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: dp.map((v, idx) => ({
            id: `dp-${idx}`,
            value: v === Infinity ? -1 : v,
            state: idx === i ? "active" : "default",
            pointers: idx === i ? [`target ${i}`] : undefined,
          })),
        },
        auxiliaryState: {
          customState: { targetAmount: i, currentCoin: coin },
        },
        variables: { i, coin },
      });

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 7,
        explanation: {
          what: `Evaluate condition if i - coin >= 0 (${i} - ${coin} = ${i - coin})`,
          why:
            i - coin >= 0
              ? `Coin ${coin} <= amount ${i}, so subtracting coin ${coin} yields valid subproblem amount ${i - coin}.`
              : `Coin ${coin} > amount ${i}, so this coin cannot be used to form amount ${i}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: dp.map((v, idx) => ({
            id: `dp-${idx}`,
            value: v === Infinity ? -1 : v,
            state: idx === i ? "active" : idx === i - coin ? "compare" : "default",
            pointers:
              idx === i
                ? [`target ${i}`]
                : i - coin >= 0 && idx === i - coin
                  ? [`sub ${i - coin}`]
                  : undefined,
          })),
        },
        auxiliaryState: {
          customState: { targetAmount: i, currentCoin: coin, valid: i - coin >= 0 },
        },
        variables: { i, coin, "i - coin": i - coin },
      });

      if (i - coin >= 0) {
        const prevVal = dp[i];
        const prevSubVal = dp[i - coin];
        const candidate = prevSubVal === Infinity ? Infinity : prevSubVal + 1;
        dp[i] = Math.min(dp[i], candidate);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 8,
          explanation: {
            what: `Update dp[${i}] = min(dp[${i}], dp[${i - coin}] + 1)`,
            why: `Previous cost: ${prevVal === Infinity ? "∞" : prevVal}, subproblem dp[${i - coin}] cost: ${prevSubVal === Infinity ? "∞" : prevSubVal}, candidate cost: ${candidate === Infinity ? "∞" : candidate}. Updated dp[${i}] = ${dp[i] === Infinity ? "∞" : dp[i]}.`,
          },
          primarySnapshot: {
            kind: "array",
            elements: dp.map((v, idx) => ({
              id: `dp-${idx}`,
              value: v === Infinity ? -1 : v,
              state: idx === i ? "active" : idx === i - coin ? "compare" : "default",
              pointers:
                idx === i ? [`target: ${i}`] : idx === i - coin ? [`sub: ${i - coin}`] : undefined,
            })),
          },
          auxiliaryState: {
            customState: {
              targetAmount: i,
              currentCoin: coin,
              subproblemIndex: i - coin,
              newDpVal: dp[i] === Infinity ? "∞" : dp[i],
            },
          },
          variables: { i, coin, "i - coin": i - coin, "dp[i]": dp[i] === Infinity ? -1 : dp[i] },
        });
      }
    }
  }

  const result = dp[amount] === Infinity ? -1 : dp[amount];
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: `Final result dp[${amount}] = ${result}`,
      why: `${result === -1 ? `No combination of given coins can sum to target amount ${amount}. Returning -1.` : `Minimum coins needed to form amount ${amount} is ${result}.`}`,
    },
    primarySnapshot: {
      kind: "array",
      elements: dp.map((v, idx) => ({
        id: `dp-${idx}`,
        value: v === Infinity ? -1 : v,
        state: idx === amount ? (result !== -1 ? "sorted" : "visited") : "default",
        pointers: idx === amount ? [`result: ${result}`] : undefined,
      })),
    },
    auxiliaryState: {
      customState: { result, targetAmount: amount },
    },
    variables: { result, amount },
  });

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
    "<p>The <strong>Coin Change Problem</strong> (LeetCode #322) asks for the minimum number of coins needed to make a target sum <code>A</code> (amount) using a set of coin denominations <code>C = {c<sub>1</sub>, c<sub>2</sub>, &hellip;, c<sub>n</sub>}</code> with an unlimited supply of each coin. If the amount cannot be formed, return <code>-1</code>.</p><p>We build the solution bottom-up using the recurrence: <code>dp[i] = min(dp[i - c] + 1)</code> for <code>c &le; i</code>, with base case <code>dp[0] = 0</code>.</p>",
  constraints: [
    "1 <= coins.length <= 12",
    "1 <= coins[i] <= 2^31 - 1",
    "0 <= amount <= 10^4",
    "All elements in coins are unique positive integers",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "coins = [1, 3, 4], amount = 6",
      outputDisplay: "2",
      title: "Basic Example",
      input: { coins: [1, 3, 4], amount: 6 },
      output: "2",
      explanation:
        "Optimal combination is 3 + 3 = 6 (2 coins). A greedy strategy (4 + 1 + 1) would yield 3 coins, demonstrating why dynamic programming is necessary.",
    },
    {
      kind: "complex",
      inputDisplay: "coins = [2, 5, 10, 12], amount = 15",
      outputDisplay: "2",
      title: "Complex Edge Case",
      input: { coins: [2, 5, 10, 12], amount: 15 },
      output: "2",
      explanation:
        "Optimal combination 10 + 5 = 15 uses 2 coins. Taking the largest coin 12 leads to suboptimal coin counts.",
    },
    {
      kind: "negative",
      inputDisplay: "coins = [2, 4], amount = 7",
      outputDisplay: "-1",
      title: "Failing / Boundary Case",
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
