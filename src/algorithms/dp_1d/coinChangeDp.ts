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
  defaultInput: DEFAULT_COIN_CHANGE_INPUT,
  generateSteps: generateCoinChangeSteps,
};
