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
      what: `Create an answer array of ${n + 1} zeros`,
      why: `We set up one slot per number from 0 to ${n}, and slot 0 is already correct — zero has no binary ones. Every later entry will be built from an earlier one.`,
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
        what: `Count bits for ${i} (binary ${i.toString(2)})`,
        why: `Shifting ${i} right one bit gives ${half}, whose count we already know is ${ans[half]}, and the bit we dropped is ${lowestBit}. So we just add them — ${ans[half]} + ${lowestBit} = ${ans[i]} — with no bit-by-bit counting at all.`,
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
      what: `Finish: counts for 0 through ${n}`,
      why: `The table now holds the number of ones for every value up to ${n}. Because each entry reused a smaller answer in constant time, the whole build took just one linear pass — O(n) overall.`,
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
    'Given an integer n, returns an array ans of length n + 1 where ans[i] is the number of 1s in the binary representation of i. Each count is derived from a smaller, already-solved one via a bitwise right-shift (i >> 1), giving linear time without any built-in bit-count functions.',
  constraints: [
    '0 <= n <= 10^5',
  ],
  examples: [
    {
      input: 'n = 2',
      output: '[0, 1, 1]',
      explanation: '0 -> 0b0 (0 ones), 1 -> 0b1 (1 one), 2 -> 0b10 (1 one).',
    },
    {
      input: 'n = 5',
      output: '[0, 1, 1, 2, 1, 2]',
      explanation: '0 -> 0b0 (0), 1 -> 0b1 (1), 2 -> 0b10 (1), 3 -> 0b11 (2), 4 -> 0b100 (1), 5 -> 0b101 (2).',
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
  complexityAnalysis: {
    time: 'We fill the answer array in a single pass from 1 to n, and each entry costs constant work: one right shift, one bitwise AND, and one addition that reuses an answer we already computed. There is no inner loop over the bits of each number, which is exactly what beats the naive approach of counting every number\'s bits from scratch — that would cost O(n log n) instead of O(n).',
    space: 'The answer array itself holds n + 1 entries, so memory grows linearly with n. Beyond the output we keep only a couple of loop variables, so the extra working space is constant.',
  },
  generateSteps: generateCountingBitsSteps,
  defaultInput: DEFAULT_COUNTING_BITS_INPUT,
};
