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
  description: `The **Coin Change Problem** (LeetCode #322) asks for the minimum number of coins needed to make a target sum $A$ (amount) using a set of coin denominations $C = \\{c_1, c_2, \\dots, c_n\\}$ with an unlimited supply of each coin. If the amount cannot be formed, return $-1$.

### Optimal Substructure & Recurrence
Let $dp[i]$ represent the minimum number of coins needed to form amount $i$. We build the solution bottom-up using the recurrence:
$$dp[i] = \\min_{c \\in C, c \\le i} (dp[i - c] + 1)$$
with the base case:
$$dp[0] = 0$$

### Why Greedy Fails
A greedy approach of picking the largest denomination first fails for arbitrary coin systems. For instance, with coins $\\{1, 3, 4\\}$ and amount $6$:
- **Greedy choice**: $4 + 1 + 1 = 6$ (3 coins)
- **Optimal DP choice**: $3 + 3 = 6$ (2 coins)

### Key Interview Insights
1. **Unbounded Knapsack Variant**: Each coin can be chosen infinitely many times, so we iterate forward over subproblems $i \\in [1, A]$.
2. **Sentinel Values**: Use $\\infty$ (\`float('inf')\`) to denote unreachable amounts.
3. **Space & Time Complexity**: Time complexity is $\\mathcal{O}(N \\times A)$ and auxiliary space is $\\mathcal{O}(A)$.`,
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
      "The Coin Change problem (LeetCode #322) is the foundational benchmark for 1D dynamic programming and unbounded knapsack optimization. Given an array of coin denominations $C = \\{c_1, c_2, \\dots, c_n\\}$ and a target amount $A$, we determine the minimal count of coins required to achieve $A$. Because coin supply is infinite, the decision state for amount $i$ depends on all subproblems $i - c$ for $c \\in C$. A bottom-up tabulation approach populates a 1D DP table of size $A + 1$ in $\\mathcal{O}(N \\times A)$ time.",
    sections: [
      {
        heading: "1. Mathematical Formulation & Recurrence",
        body: "We define $dp[i]$ as the minimum number of coins needed to sum to amount $i$.\n\n- **Base Case**: $dp[0] = 0$ (zero coins yield an amount of 0).\n- **Initialization**: $dp[i] = \\infty$ for all $i > 0$.\n- **State Transition**:\n  $$dp[i] = \\min_{c \\in C, c \\le i} (dp[i - c] + 1)$$\n\nIf $dp[A] = \\infty$ after building the table, no valid coin combination exists, so we return $-1$.",
      },
      {
        heading: "2. Why Greedy Choice Fails",
        body: "Canonical currency systems (e.g., US coins $\\{1, 5, 10, 25\\}$) possess the matroid property where the greedy strategy is optimal. However, for general coin sets, greedy fails.\n\n*Example*: Coins $C = \\{1, 3, 4\\}$, Target $A = 6$.\n- **Greedy**: Chooses $4$, remaining amount $2 \\implies 4 + 1 + 1$ ($3$ coins).\n- **Optimal (DP)**: Chooses $3$, remaining amount $3 \\implies 3 + 3$ ($2$ coins).\n\nDynamic programming guarantees optimal results by exhaustively evaluating all valid coin transitions.",
      },
      {
        heading: "3. Systems Applications",
        body: "The 1D unbounded knapsack pattern underpins core systems engineering problems:\n- **Memory Allocator Slabs**: Operating system allocators (such as `jemalloc` or `tcmalloc`) combine fixed slab sizes to fulfill allocation requests with minimal chunk overhead.\n- **Token Bucket Rate Limiting**: Distributed rate limiters pack token requests into fixed bucket capacities.\n- **Instruction Slot Packing**: Compilers pack VLIW instruction bundles under hardware register constraints.",
      },
      {
        heading: "4. Complexity & Implementation Edge Cases",
        body: "### Complexity Analysis\n- **Time Complexity**: $\\mathcal{O}(N \\times A)$ where $N = |C|$ and $A = \\text{amount}$.\n- **Space Complexity**: $\\mathcal{O}(A)$ for the 1D DP table.\n\n### Edge Cases to Watch Out For\n- **Target $A = 0$**: Instantly returns $0$ without table sweeps.\n- **Unreachable Amounts**: If no combination sums to $A$ (e.g., coins $\\{2, 4\\}$, amount $7$), returns $-1$.\n- **Integer Overflow**: In C++/Java, initializing with `INT_MAX` requires care to prevent overflow when calculating `dp[i - c] + 1`. Using `amount + 1` as infinity avoids overflow safely.",
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
          "The property where an optimal solution to amount $i$ incorporates optimal solutions to subproblems $i - c$.",
      },
      {
        term: "Sentinel Value",
        definition:
          "A placeholder such as $\\infty$ (`float('inf')`) used to denote impossible or unvisited states.",
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
