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
      what: `Initialized DP table of size ${amount + 1} with infinity. Set dp[0] = 0.`,
      why: 'Base case: 0 coins are required to form a target amount of 0.',
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
            what: `Evaluating target amount i = ${i} using coin = ${coin}. Candidate: dp[${i - coin}] + 1 = ${candidate === Infinity ? '∞' : candidate}.`,
            why: `Transition: dp[${i}] = min(${prevVal === Infinity ? '∞' : prevVal}, ${candidate === Infinity ? '∞' : candidate}).`,
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
      what: `Dynamic programming completed. Minimum coins required for target amount ${amount} is ${result}.`,
      why: 'Tabulation filled optimal subproblem answers bottom-up.',
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
    'Finds the fewest number of coins needed to make up a target amount using dynamic programming tabulation.',
  constraints: ['1 <= coins.length <= 12', '1 <= amount <= 100'],
  examples: [{ input: 'coins = [1, 3, 4], amount = 6', output: '2 (3 + 3 = 6)' }],
  code: PYTHON_COIN_CHANGE_CODE,
  timeComplexity: { best: 'O(N * amount)', average: 'O(N * amount)', worst: 'O(N * amount)' },
  spaceComplexity: 'O(amount)',
  defaultInput: DEFAULT_COIN_CHANGE_INPUT,
  generateSteps: generateCoinChangeSteps,
};

