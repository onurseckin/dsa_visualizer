import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
} from '../../types/dsa';

export interface CountingBitsInput {
  n: number;
}

export const DEFAULT_COUNTING_BITS_INPUT: CountingBitsInput = {
  n: 5,
};

function createBitArrayElements(
  ans: number[],
  currentIdx: number,
  halfIdx: number
): ArrayElement[] {
  return ans.map((val, idx) => {
    let state: ElementState = 'default';
    const pointers: string[] = [];

    if (idx === currentIdx) {
      state = 'active';
      pointers.push(`i=${idx}`);
    } else if (idx === halfIdx && currentIdx > 0) {
      state = 'compare';
      pointers.push(`i>>1=${halfIdx}`);
    } else if (idx < currentIdx) {
      state = 'sorted';
    }

    return {
      id: `bit-ans-${idx}`,
      value: val,
      state,
      pointers,
    };
  });
}

export function generateCountingBitsSteps(input: CountingBitsInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const n = Math.max(0, Math.min(input.n ?? 5, 32));
  const ans: number[] = new Array(n + 1).fill(0);

  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 2,
    explanation: {
      what: `Initialize answer array of length n+1 = ${n + 1} with zeros.`,
      why: 'ans[0] = 0 because binary representation of 0 has 0 set bits.',
    },
    primarySnapshot: {
      kind: 'array',
      elements: createBitArrayElements(ans, -1, -1),
    },
    auxiliaryState: {
      customState: {
        n,
        ans: `[${ans.join(', ')}]`,
      },
    },
    variables: { n, i: 0 },
  });

  for (let i = 1; i <= n; i++) {
    const half = i >> 1;
    const lowestBit = i & 1;

    ans[i] = ans[half] + lowestBit;

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 4,
      explanation: {
        what: `Calculate set bits for i=${i} (binary: ${i.toString(2)}).`,
        why: `ans[${i}] = ans[${i} >> 1] + (${i} & 1) = ans[${half}] (${ans[half]}) + ${lowestBit} = ${ans[i]}.`,
      },
      primarySnapshot: {
        kind: 'array',
        elements: createBitArrayElements(ans, i, half),
      },
      auxiliaryState: {
        customState: {
          currentNumber: i,
          binaryString: i.toString(2),
          halfIndex: half,
          lowestBit,
          computedBits: ans[i],
        },
      },
      variables: {
        i,
        binary: i.toString(2),
        half,
        lowestBit,
        bitsCount: ans[i],
      },
    });
  }

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 5,
    explanation: {
      what: `Computed set bits for all numbers from 0 to ${n}.`,
      why: 'Dynamic programming bit manipulation completes in O(N) time.',
    },
    primarySnapshot: {
      kind: 'array',
      elements: ans.map((val, idx) => ({
        id: `bit-ans-final-${idx}`,
        value: val,
        state: 'sorted',
        pointers: [`i=${idx}`],
      })),
    },
    auxiliaryState: {
      customState: {
        result: `[${ans.join(', ')}]`,
      },
    },
    variables: {
      n,
      completed: true,
    },
  });

  return steps;
}

export const countingBits: AlgorithmDefinition<CountingBitsInput> = {
  id: 'counting-bits',
  title: 'Counting Bits',
  category: 'bit_manipulation',
  difficulty: 'Easy',
  description:
    'Given an integer n, return an array ans of length n + 1 such that for each i (0 <= i <= n), ans[i] is the number of 1s in the binary representation of i.',
  constraints: ['0 <= n <= 10^5'],
  examples: [
    {
      input: 'n = 2',
      output: '[0, 1, 1]',
      explanation: '0 -> 0 (0 ones), 1 -> 1 (1 one), 2 -> 10 (1 one).',
    },
    {
      input: 'n = 5',
      output: '[0, 1, 1, 2, 1, 2]',
      explanation: '0 -> 0, 1 -> 1, 2 -> 1, 3 -> 2, 4 -> 1, 5 -> 2.',
    },
  ],
  code: `def countBits(n):
    ans = [0] * (n + 1)
    for i in range(1, n + 1):
        ans[i] = ans[i >> 1] + (i & 1)
    return ans`,
  timeComplexity: {
    best: 'O(N)',
    average: 'O(N)',
    worst: 'O(N)',
  },
  spaceComplexity: 'O(N)',
  generateSteps: generateCountingBitsSteps,
  defaultInput: DEFAULT_COUNTING_BITS_INPUT,
};
