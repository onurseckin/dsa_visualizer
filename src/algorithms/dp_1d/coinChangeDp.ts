import type { AlgorithmDefinition, AlgorithmStep } from '../../types/dsa';

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
    codeLine: 3,
    explanation: {
      what: `Create dp table of ${amount + 1} slots`,
      why: 'dp[i] will hold the fewest coins that make amount i. Making 0 costs zero coins, so dp[0] = 0; every other slot starts at infinity, meaning "we have not found a way to make this amount yet".',
    },
    primarySnapshot: {
      kind: 'array',
      elements: dp.map((v, idx) => ({
        id: `dp-${idx}`,
        value: v === Infinity ? -1 : v,
        state: idx === 0 ? 'sorted' : 'default',
        pointers: idx === 0 ? ['base: 0'] : undefined,
      })),
    },
    auxiliaryState: {
      customState: { amount, coins: coins.join(', ') },
    },
    variables: { amount, 'dp[0]': 0 },
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
            what: `Try coin ${coin} for amount ${i}`,
            why: `If we spend coin ${coin}, we land on the already-solved amount ${i - coin}, which would cost dp[${i - coin}] + 1 = ${candidate === Infinity ? '∞' : candidate} coins in total. We keep the better of that and our current ${prevVal === Infinity ? '∞' : prevVal}, so dp[${i}] is now ${dp[i] === Infinity ? '∞' : dp[i]}.`,
          },
          primarySnapshot: {
            kind: 'array',
            elements: dp.map((v, idx) => ({
              id: `dp-${idx}`,
              value: v === Infinity ? -1 : v,
              state: idx === i ? 'active' : idx === i - coin ? 'compare' : 'default',
              pointers:
                idx === i
                  ? [`target: ${i}`]
                  : idx === i - coin
                  ? [`sub: ${i - coin}`]
                  : undefined,
            })),
          },
          auxiliaryState: {
            customState: {
              targetAmount: i,
              currentCoin: coin,
              subproblemIndex: i - coin,
              newDpVal: dp[i] === Infinity ? '∞' : dp[i],
            },
          },
          variables: { i, coin, 'i - coin': i - coin, 'dp[i]': dp[i] === Infinity ? -1 : dp[i] },
        });
      }
    }
  }

  const result = dp[amount] === Infinity ? -1 : dp[amount];
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: `Read the answer from dp[${amount}]`,
      why: `${result === -1 ? `No combination of these coins can reach ${amount}, so dp[${amount}] stayed at infinity and we return -1.` : `We built every amount from already-optimal smaller amounts, so dp[${amount}] = ${result} is the true minimum.`} Filling one table entry per amount, once per coin, is all the work this took.`,
    },
    primarySnapshot: {
      kind: 'array',
      elements: dp.map((v, idx) => ({
        id: `dp-${idx}`,
        value: v === Infinity ? -1 : v,
        state: idx === amount ? (result !== -1 ? 'sorted' : 'visited') : 'default',
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

export const coinChangeDp: AlgorithmDefinition<CoinChangeInput> = {
  id: 'coin-change-dp',
  title: 'Coin Change Minimum Coins (Dynamic Programming)',
  category: 'dp_1d',
  difficulty: 'Medium',
  description:
    'Finds the fewest number of coins needed to make up a given target amount using 1D dynamic programming tabulation. If that amount of money cannot be made up by any combination of the coins, returns -1. You may assume that you have an infinite number of each kind of coin.',
  constraints: [
    '1 <= coins.length <= 12',
    '1 <= coins[i] <= 10^4',
    '0 <= amount <= 10^4',
  ],
  examples: [
    {
      input: 'coins = [1, 3, 4], amount = 6',
      output: '2',
      explanation: 'Optimal combination is 3 + 3 = 6 (2 coins total). Greedy choice (4 + 1 + 1) would yield 3 coins, showing why DP optimal substructure is necessary.',
    },
    {
      input: 'coins = [2], amount = 3',
      output: '-1',
      explanation: 'Target amount 3 cannot be formed using only coin denomination 2.',
    },
  ],
  code: PYTHON_COIN_CHANGE_CODE,
  timeComplexity: { best: 'O(N * amount)', average: 'O(N * amount)', worst: 'O(N * amount)' },
  spaceComplexity: 'O(amount)',
  complexityAnalysis: {
    time: 'The dp table has amount + 1 entries, and to fill each entry we try every one of the N coin denominations. That nested loop performs N × amount constant-time transitions, giving O(N × amount). The cost is the same in every case because we always fill the entire table before reading the answer.',
    space: 'The dp array is the only structure that grows: one entry for every amount from 0 up to the target, so extra memory is O(amount).',
  },
  topicGuide: {
    overview:
      'Coin change with unlimited coins is the doorway to one-dimensional dynamic programming: you want the fewest coins that sum to a target, and because the denominations are arbitrary, intuition borrowed from a cash register does not apply. The technique is to define one number per subproblem — the best answer for every amount from zero up to the target — and build the table upward so each entry is computed only from entries already finished. It works because the optimal way to make an amount necessarily contains the optimal way to make whatever is left after you remove one coin. Once that structure is visible you will recognise it across a whole family of problems where a single index captures the entire state.',
    sections: [
      {
        heading: 'The core idea: one number per amount',
        body: 'Every dynamic program starts with a precise statement of what a table entry means, and here dp of a is the minimum number of coins that add up to exactly a. The entry dp of zero is zero, because the empty handful of coins makes nothing, and that base case is the only value you get for free. Every other entry starts at infinity, a sentinel meaning no combination has been found yet that survives comparison without any special-case branching. Being pedantic about the definition pays off later: because an entry means exactly a rather than at most a, you never have to wonder whether an unspent remainder is allowed.',
      },
      {
        heading: 'How the transition works, and why greedy fails',
        body: 'To fill dp of a you consider every denomination c that is no larger than a and ask what would happen if the last coin you laid down were c. The remaining amount is a minus c, which you have already solved, so the candidate cost is dp of a minus c plus one; take the smallest candidate across all denominations and the entry is final, because some coin must be last and you tried them all. This is exactly where the greedy rule of taking the largest coin that fits breaks down. With denominations of one, three, and four, greedy builds six as four plus one plus one for three coins, while the table finds three plus three for two — greedy commits to a local choice, whereas the transition lets already-optimal subresults decide.',
      },
      {
        heading: 'Why the upward sweep is correct',
        body: 'The invariant is that when the loop arrives at amount a, every entry from zero through a minus one already holds its true optimum. That holds because a minus c is strictly smaller than a for every positive denomination, so the transition only ever reads finished entries and never one still under construction. Order therefore carries real meaning: sweep amounts upward, and if you put the coin loop on the outside you must still walk amounts upward on the inside so that reusing a denomination many times stays legal. Sweeping amounts downward is not a bug but a different problem — that is the bounded knapsack where each item may be used once — and mixing up those two directions is the most common source of wrong answers in this family.',
      },
      {
        heading: 'Reading the answer and handling unreachable targets',
        body: 'When the sweep ends, dp of the target is the answer, and an infinity there means precisely what it says: no multiset of these denominations sums to the target, so you report minus one. That test belongs at the very end and nowhere else, because an intermediate infinity is completely normal — with denominations of three and four, dp of one and dp of two are legitimately unreachable while dp of six is not. If you use a large integer instead of true infinity, guard against overflow before adding one to it, which is why comparing against the sentinel first is the safer habit. When you need the actual coins rather than just the count, store the winning denomination beside each entry and walk backwards from the target, subtracting as you go.',
      },
      {
        heading: 'When to reach for a one-dimensional table',
        body: 'This shape fits whenever the state you need is a single number and every transition moves to a strictly smaller value of it, which is why climbing stairs, house robber, word break, and longest increasing subsequence all look like variations on the same code. If the supply of each coin were limited, or you had both a weight budget and a value to maximise, one index would no longer describe the state and you would be writing a two-dimensional knapsack instead. Memoised recursion computes the same values and is often easier to derive from the recurrence, but the bottom-up table avoids deep call stacks and makes the sweep order explicit. Prefer the table once you trust the recurrence; prefer recursion while you are still discovering it.',
      },
      {
        heading: 'How the pattern generalises',
        body: 'Changing just the combining operation changes the problem while the skeleton stands still. Swap the minimum for a sum and the same table counts how many ways each amount can be formed, and in that variant the loop nesting decides whether you count unordered combinations or ordered sequences, so the order you found harmless here suddenly matters. Swap it for a boolean or and you get subset-sum feasibility; swap it for a maximum and you get the best value achievable under a budget. The transferable lesson is that a table definition, a base case, a transition, and a sweep order are four independent decisions, and once you make each one deliberately the rest of one-dimensional dynamic programming becomes routine.',
      },
    ],
    keyTerms: [
      {
        term: 'Tabulation',
        definition:
          'Filling a dynamic-programming table bottom-up with loops, from the base case toward the target. It contrasts with memoisation, which starts at the target and recurses downward, caching results on the way.',
      },
      {
        term: 'State',
        definition:
          'The information that fully identifies a subproblem. Here it is one number, the amount still to be made, which is what makes the table one-dimensional.',
      },
      {
        term: 'Transition',
        definition:
          'The rule that computes one entry from smaller entries. For coin change it tries every denomination as the last coin placed and keeps the cheapest resulting total.',
      },
      {
        term: 'Optimal substructure',
        definition:
          'The property that an optimal solution is built from optimal solutions to its subproblems. Without it, reusing a stored subresult would be unsound and the table would give wrong answers.',
      },
      {
        term: 'Unbounded knapsack',
        definition:
          'The item-selection family where each item may be taken any number of times, which is what coin change is. The unbounded case is recognisable by its inner loop running upward so a single denomination can be reused within one entry chain.',
      },
    ],
  },
  defaultInput: DEFAULT_COIN_CHANGE_INPUT,
  generateSteps: generateCoinChangeSteps,
};
