import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface PrefixSumInput {
  nums: number[];
}

export const PREFIX_SUM_CODE = `def compute_prefix_sum(nums: list[int]) -> list[int]:
    n = len(nums)
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + nums[i]
    return prefix`;

export const DEFAULT_PREFIX_SUM_INPUT: PrefixSumInput = {
  nums: [2, 4, 1, 3, 5],
};

export const generatePrefixSumSteps = (
  input: PrefixSumInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nums = input.nums;
  const n = nums.length;

  const elements: ArrayElement[] = nums.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: 'default',
  }));

  const prefixValues: number[] = new Array(n + 1).fill(0);

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'array',
        elements: elements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        visited: [...prefixValues],
        customState: {
          'prefixArray': prefixValues.join(', '),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    'Start building prefix sums',
    `We'll turn [${nums.join(', ')}] into a ladder of running totals, so that later any range sum can be read off with one subtraction instead of re-adding the whole slice.`,
    { length: n }
  );

  addStep(
    3,
    'Allocate the prefix array',
    `We make room for ${n + 1} totals, all zero for now: [${prefixValues.join(', ')}]. The extra leading 0 means even a range starting at index 0 has something clean to subtract.`,
    { prefixLength: n + 1 }
  );

  for (let i = 0; i < n; i++) {
    elements[i].state = 'active';
    elements[i].pointers = ['i'];

    const currentVal = nums[i];
    const prevPrefix = prefixValues[i];
    const newPrefix = prevPrefix + currentVal;
    prefixValues[i + 1] = newPrefix;

    addStep(
      4,
      `Visit nums[${i}] = ${currentVal}`,
      `So far our running total is ${prevPrefix}. Now we bring in ${currentVal} so the total covers everything up through index ${i}.`,
      { i, 'nums[i]': currentVal, 'prefix[i]': prevPrefix }
    );

    addStep(
      5,
      `Set prefix[${i + 1}] = ${newPrefix}`,
      `We add ${currentVal} to the previous total ${prevPrefix} and get ${newPrefix} — the sum of everything from index 0 through ${i}, banked for instant reuse later.`,
      { i, 'prefix[i]': prevPrefix, 'nums[i]': currentVal, 'prefix[i+1]': newPrefix }
    );

    elements[i].state = 'visited';
    elements[i].pointers = undefined;
  }

  addStep(
    6,
    'Finish the prefix array',
    `Our finished ladder of totals is [${prefixValues.join(', ')}]. From here, the sum of any range L..R is just prefix[R+1] minus prefix[L] — one subtraction, constant time.`,
    { result: prefixValues.join(', ') }
  );

  return steps;
};

export const prefixSum: AlgorithmDefinition<PrefixSumInput> = {
  id: 'prefix-sum',
  title: 'Prefix Sum',
  category: 'arrays_and_hashing',
  difficulty: 'Easy',
  description:
    'Computes cumulative prefix sums for an array, so any later sub-array range sum can be answered in O(1) time with a single subtraction of two precomputed totals.',
  constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
  examples: [
    {
      input: 'nums = [2, 4, 1, 3, 5]',
      output: 'prefix = [0, 2, 6, 7, 10, 15]',
      explanation:
        'Sum of sub-array from index 1 to 3 (4 + 1 + 3 = 8) is evaluated in O(1) time as prefix[4] - prefix[1] = 10 - 2 = 8.',
    },
    {
      input: 'nums = [1, 1, 1]',
      output: 'prefix = [0, 1, 2, 3]',
      explanation: 'Prefix sums build incrementally at each step.',
    },
  ],
  code: PREFIX_SUM_CODE,
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
  },
  spaceComplexity: 'O(n)',
  complexityAnalysis: {
    time: "We fill the prefix array in one pass over the input: each new entry is just the previous entry plus one array value, a single addition. With n elements that's n constant-time updates, so the work grows linearly — O(n). Best and worst case are identical because we always touch every element exactly once.",
    space: 'We allocate one extra array of n + 1 running totals alongside the input, so extra memory grows linearly with the input size — O(n).',
  },
  defaultInput: DEFAULT_PREFIX_SUM_INPUT,
  generateSteps: generatePrefixSumSteps,
};
