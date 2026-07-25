import type { AlgorithmDefinition, AlgorithmStep } from '../../types/dsa';

export interface CoinChangeInput {
  coins: number[];
  amount: number;
}

const code = `function coinChange(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (i - coin >= 0) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`;

export const coinChangeDp: AlgorithmDefinition<CoinChangeInput> = {
  id: 'coin-change-dp',
  title: 'Coin Change Minimum Coins (Dynamic Programming)',
  category: 'dp_1d',
  difficulty: 'Medium',
  description:
    'Finds the fewest number of coins needed to make up a target amount using dynamic programming tabulation.',
  constraints: ['1 <= coins.length <= 12', '1 <= amount <= 100'],
  examples: [{ input: 'coins = [1, 3, 4], amount = 6', output: '2 (3 + 3 = 6)' }],
  code,
  timeComplexity: { best: 'O(N * amount)', average: 'O(N * amount)', worst: 'O(N * amount)' },
  spaceComplexity: 'O(amount)',
  defaultInput: { coins: [1, 3, 4], amount: 6 },
  generateSteps: (input: CoinChangeInput): AlgorithmStep[] => {
    const coins = input.coins || [1, 3, 4];
    const amount = input.amount ?? 6;
    const steps: AlgorithmStep[] = [];
    let stepIndex = 0;

    const dp: number[] = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 3,
      explanation: {
        what: `Initialize DP table of size ${amount + 1}. Set dp[0] = 0.`,
        why: 'Base Case: 0 coins are required to make amount 0.',
      },
      primarySnapshot: {
        kind: 'array',
        elements: dp.map((v, idx) => ({
          id: `dp-${idx}`,
          value: v === Infinity ? -1 : v,
          state: idx === 0 ? 'sorted' : 'default',
          pointers: [idx.toString()],
        })),
      },
      auxiliaryState: { customState: { amount } },
      variables: { amount, 'dp[0]': 0 },
    });

    for (let i = 1; i <= amount; i++) {
      for (const coin of coins) {
        if (i - coin >= 0) {
          const prevVal = dp[i];
          const newCandidate = dp[i - coin] === Infinity ? Infinity : dp[i - coin] + 1;
          dp[i] = Math.min(dp[i], newCandidate);

          steps.push({
            stepIndex: stepIndex++,
            codeLine: 7,
            explanation: {
              what: `Testing amount i = ${i} with coin = ${coin}. Candidate: dp[${i - coin}] + 1 = ${newCandidate}.`,
              why: `Transition: dp[${i}] = min(${prevVal === Infinity ? '∞' : prevVal}, ${newCandidate === Infinity ? '∞' : newCandidate}).`,
            },
            primarySnapshot: {
              kind: 'array',
              elements: dp.map((v, idx) => ({
                id: `dp-${idx}`,
                value: v === Infinity ? -1 : v,
                state: idx === i ? 'active' : idx === i - coin ? 'compare' : 'default',
                pointers: idx === i ? [`target: ${i}`] : idx === i - coin ? [`sub: ${i - coin}`] : undefined,
              })),
            },
            auxiliaryState: { customState: { coin, 'dp[i]': dp[i] === Infinity ? '∞' : dp[i] } },
            variables: { i, coin, 'dp[i]': dp[i] === Infinity ? -1 : dp[i] },
          });
        }
      }
    }

    const result = dp[amount] === Infinity ? -1 : dp[amount];
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: `Dynamic programming completed. Minimum coins required for amount ${amount} is ${result}.`,
        why: 'Tabulation filled optimal subproblem answers bottom-up.',
      },
      primarySnapshot: {
        kind: 'array',
        elements: dp.map((v, idx) => ({
          id: `dp-${idx}`,
          value: v === Infinity ? -1 : v,
          state: idx === amount ? 'sorted' : 'default',
        })),
      },
      auxiliaryState: { customState: { result } },
      variables: { result },
    });

    return steps;
  },
};
