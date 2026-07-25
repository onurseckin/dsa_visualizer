import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface TwoSumInput {
  nums: number[];
  target: number;
}

export const TWO_SUM_CODE = `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`;

export const DEFAULT_TWO_SUM_INPUT: TwoSumInput = {
  nums: [2, 7, 11, 15],
  target: 9,
};

export const generateTwoSumSteps = (input: TwoSumInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const elements: ArrayElement[] = input.nums.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: 'default',
  }));

  const hashMap: Record<string, number> = {};

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
        hashMap: { ...hashMap },
      },
      variables,
    });
  };

  const target = input.target;
  const n = elements.length;

  addStep(
    1,
    'Initialize Two Sum',
    `Rather than scanning all pairs in O(n²) brute-force time, we use a single-pass Hash Map to find two elements in [${input.nums.join(', ')}] summing to target = ${target}.`,
    { target, length: n }
  );

  addStep(
    2,
    'Initialize Hash Map',
    'Created an empty hash map to store seen values and their indices {value: index}, enabling O(1) complement lookup during traversal.',
    { target }
  );

  for (let i = 0; i < n; i++) {
    elements[i].state = 'active';
    elements[i].pointers = ['i'];

    const currentVal = elements[i].value;

    addStep(
      3,
      `Loop index i = ${i} (arr[${i}] = ${currentVal})`,
      `Inspecting element nums[${i}] = ${currentVal}. We calculate what value is needed to reach target sum ${target}.`,
      { i, 'nums[i]': currentVal, target }
    );

    const complement = target - currentVal;

    addStep(
      4,
      `Calculate complement = target - nums[${i}]`,
      `Complement equation: ${target} - ${currentVal} = ${complement}. If ${complement} was previously inserted in our hash map, a valid pair exists.`,
      { i, 'nums[i]': currentVal, complement, target }
    );

    const hasComplement = String(complement) in hashMap;

    addStep(
      5,
      `Check if hash map contains key '${complement}'`,
      hasComplement
        ? `Complement ${complement} is present in hash map at index ${hashMap[String(complement)]}! Pair found.`
        : `Complement ${complement} has not been seen yet. We must store current element ${currentVal} for subsequent lookups.`,
      { i, complement, hasComplement }
    );

    if (hasComplement) {
      const prevIdx = hashMap[String(complement)];
      elements[prevIdx].state = 'sorted';
      elements[prevIdx].pointers = ['match'];
      elements[i].state = 'sorted';
      elements[i].pointers = ['match'];

      addStep(
        6,
        `Return indices [${prevIdx}, ${i}]`,
        `Found pair nums[${prevIdx}] (${elements[prevIdx].value}) + nums[${i}] (${currentVal}) = ${target}. Algorithm terminates in O(n) time and O(n) space.`,
        { resultIdx1: prevIdx, resultIdx2: i, target }
      );
      return steps;
    }

    // Store in map
    hashMap[String(currentVal)] = i;
    elements[i].state = 'visited';
    elements[i].pointers = undefined;

    addStep(
      7,
      `Store map[${currentVal}] = ${i}`,
      `Recorded hash_map[${currentVal}] = ${i} so future elements needing complement ${currentVal} can find it in O(1) time.`,
      { i, 'nums[i]': currentVal }
    );
  }

  addStep(
    8,
    'Return empty array []',
    `Finished array traversal without finding any two elements summing to target ${target}. Return empty array.`,
    { target }
  );

  return steps;
};

export const twoSum: AlgorithmDefinition<TwoSumInput> = {
  id: 'two-sum',
  title: 'Two Sum',
  category: 'arrays_and_hashing',
  difficulty: 'Easy',
  description:
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target using a Hash Map for O(1) complement lookup.',
  constraints: [
    '2 <= nums.length <= 10^4',
    '-10^9 <= nums[i] <= 10^9',
    '-10^9 <= target <= 10^9',
    'Only one valid answer exists.',
  ],
  examples: [
    {
      input: 'nums = [2, 7, 11, 15], target = 9',
      output: '[0, 1]',
      explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
    },
    {
      input: 'nums = [3, 2, 4], target = 6',
      output: '[1, 2]',
      explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
    },
    {
      input: 'nums = [3, 3], target = 6',
      output: '[0, 1]',
      explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].',
    },
  ],
  code: TWO_SUM_CODE,
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
  },
  spaceComplexity: 'O(n)',
  defaultInput: DEFAULT_TWO_SUM_INPUT,
  generateSteps: generateTwoSumSteps,
};
