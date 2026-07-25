import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface PrefixSumInput {
  nums: number[];
}

export const PREFIX_SUM_CODE = `function computePrefixSum(nums) {
  const n = nums.length;
  const prefix = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + nums[i];
  }
  return prefix;
}`;

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
    'Initialize Prefix Sum Calculation',
    `Given input array [${nums.join(', ')}], initialize prefix sum computation.`,
    { length: n }
  );

  addStep(
    2,
    'Allocate Prefix Array',
    `Created prefix array of size ${n + 1} initialized to 0: [${prefixValues.join(', ')}].`,
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
      3,
      `Inspect index i = ${i} (nums[${i}] = ${currentVal})`,
      `Processing element at index ${i}.`,
      { i, 'nums[i]': currentVal, 'prefix[i]': prevPrefix }
    );

    addStep(
      4,
      `Compute prefix[${i + 1}] = prefix[${i}] + nums[${i}]`,
      `prefix[${i + 1}] = ${prevPrefix} + ${currentVal} = ${newPrefix}.`,
      { i, 'prefix[i]': prevPrefix, 'nums[i]': currentVal, 'prefix[i+1]': newPrefix }
    );

    elements[i].state = 'visited';
    elements[i].pointers = undefined;
  }

  addStep(
    5,
    'Complete Prefix Sum Array',
    `Computed final prefix sum array: [${prefixValues.join(', ')}].`,
    { result: prefixValues.join(', ') }
  );

  return steps;
};

export const prefixSum: AlgorithmDefinition<PrefixSumInput> = {
  id: 'prefix-sum',
  title: 'Prefix Sum',
  category: 'fundamentals',
  difficulty: 'Easy',
  description:
    'Computes cumulative prefix sums for an array, enabling O(1) time sub-array range sum queries.',
  code: PREFIX_SUM_CODE,
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
  },
  spaceComplexity: 'O(n)',
  defaultInput: DEFAULT_PREFIX_SUM_INPUT,
  generateSteps: generatePrefixSumSteps,
};
