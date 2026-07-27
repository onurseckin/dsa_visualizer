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
  const coins = input.coins && input.coins.length > 0 ? [...input.coins] : [1, 3, 4];
  const amount = Math.max(0, input.amount ?? 6);
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const dp: number[] = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Initialize DP table of size ${amount + 1}`,
      why: `dp[i] stores the minimum coins needed to form target amount i. dp[0] = 0 (0 coins to make amount 0), while all other slots are initialized to infinity.`,
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
    for (const coin of coins) {
      if (i - coin >= 0) {
        const prevVal = dp[i];
        const prevSubVal = dp[i - coin];
        const candidate = prevSubVal === Infinity ? Infinity : prevSubVal + 1;
        dp[i] = Math.min(dp[i], candidate);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 8,
          explanation: {
            what: `Consider coin ${coin} for amount ${i}`,
            why: `Checking transition dp[${i}] = min(dp[${i}], dp[${i - coin}] + 1). Previous cost: ${prevVal === Infinity ? "∞" : prevVal}, candidate: ${candidate === Infinity ? "∞" : candidate}. Updated dp[${i}] = ${dp[i] === Infinity ? "∞" : dp[i]}.`,
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
    5: "Outer loop sweeps target amount i from 1 to target amount.",
    6: "Inner loop considers each coin denomination in coins.",
    7: "Guards against negative indices by ensuring i - coin >= 0.",
    8: "Updates dp[i] = min(dp[i], dp[i - coin] + 1) using optimal substructure.",
    10: "Returns dp[amount] if reachable; otherwise returns -1.",
  },
};

export const coinChangeDp: AlgorithmDefinition<CoinChangeInput> = {
  id: "coin-change-dp",
  title: "Coin Change Minimum Coins (Dynamic Programming)",
  category: "dp_1d",
  categories: ["dp_1d"],
  difficulty: "Medium",
  description:
    "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1. You may assume that you have an infinite number of each kind of coin. This problem exhibits optimal substructure: to compute the minimum coins for amount i, evaluate min(dp[i - coin] + 1) over all coins where i >= coin.",
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
      "The Coin Change problem (LeetCode #322) is the quintessential 1D dynamic programming benchmark. Given an array of coin denominations and a target amount, the goal is to find the minimum number of coins needed to sum to that amount, assuming an unlimited supply of each coin denomination. Unlike currency systems with canonical denominations (such as US coins {1, 5, 10, 25} where a greedy approach succeeds), arbitrary coin systems break greedy assumptions. For instance, with coins {1, 3, 4} and target 6, greedy picks 4 + 1 + 1 (3 coins), whereas the optimal choice is 3 + 3 (2 coins). Dynamic programming systematically evaluates subproblems using the recurrence relation dp[i] = min_{c in coins}(dp[i - c] + 1) with base case dp[0] = 0.",
    sections: [
      {
        heading: "Core Concept: Optimal Substructure & 1D Tabulation",
        body: "Define dp[i] as the minimum number of coins needed to make amount i. Because each coin can be used multiple times (unbounded knapsack property), the optimal solution for amount i is constructed by taking one coin c and adding it to the optimal solution for amount i - c. By sweeping i from 1 to amount, every smaller subproblem is finalized before it is referenced, guaranteeing exact optimal substructure.",
      },
      {
        heading: "Systems & Performance Impact: Memory Allocators & Token Budgets",
        body: "Unbounded coin change dynamic programming models real-world resource allocation problems. In operating system memory allocators (e.g., jemalloc, tcmalloc), slab sizes must be combined to fulfill requested allocation sizes with minimum chunk overhead. In LLM serving engines (such as vLLM or Hugging Face TGI), block-paging algorithms partition KV-cache memory requests using minimum block combinations. Hardware compilers use similar 1D DP passes for instruction slot packing under register constraints.",
      },
      {
        heading: "Implementation Nuances: Sentinels & Integer Overflow",
        body: "In Python, float('inf') serves as an ideal sentinel because float('inf') + 1 remains float('inf'), making min() comparisons clean. In statically typed languages (C++, Java, Rust), initializing DP elements to INT_MAX requires caution: adding 1 to INT_MAX causes integer overflow into negative numbers. A standard practice is initializing to amount + 1, since the maximum possible coins for amount is amount (using all 1-value coins).",
      },
      {
        heading: "Edge Case Analysis & Reconstructive Traceback",
        body: "Edge cases include target amount 0 (returns 0 immediately), single coin denomination larger than amount (returns -1), and unreachable amounts (returns -1 when dp[amount] stays sentinel). To reconstruct the actual coins used rather than just counting them, maintain a parent array parent[i] recording the winning coin c that minimized dp[i].",
      },
    ],
    keyTerms: [
      {
        term: "Unbounded Knapsack",
        definition:
          "A category of dynamic programming problems where items (coins) can be reused an unlimited number of times.",
      },
      {
        term: "Optimal Substructure",
        definition:
          "The property that an optimal global solution contains within it optimal solutions to smaller subproblems.",
      },
      {
        term: "Sentinel Value",
        definition:
          "A special placeholder value (e.g., float('inf') or amount + 1) used to denote unreached or impossible state configurations.",
      },
      {
        term: "1D Tabulation",
        definition:
          "Bottom-up dynamic programming using a 1D array filled sequentially from base cases to the final answer.",
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
