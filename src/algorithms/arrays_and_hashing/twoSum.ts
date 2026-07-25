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
    `Find two numbers in [${input.nums.join(', ')}] that add up to target = ${target}.`,
    { target, length: n }
  );

  addStep(
    2,
    'Initialize Hash Map',
    'Create an empty map to store { value: index } pairs for O(1) complement lookup.',
    { target }
  );

  for (let i = 0; i < n; i++) {
    elements[i].state = 'active';
    elements[i].pointers = ['i'];

    const currentVal = elements[i].value;

    addStep(
      3,
      `Loop index i = ${i} (arr[${i}] = ${currentVal})`,
      `Inspecting element at index ${i}.`,
      { i, 'nums[i]': currentVal, target }
    );

    const complement = target - currentVal;

    addStep(
      4,
      `Calculate complement = target - nums[${i}]`,
      `${target} - ${currentVal} = ${complement}. We look for ${complement} in the hash map.`,
      { i, 'nums[i]': currentVal, complement, target }
    );

    const hasComplement = String(complement) in hashMap;

    addStep(
      5,
      `Check if hash map contains key '${complement}'`,
      hasComplement
        ? `Complement ${complement} found in map at index ${hashMap[String(complement)]}!`
        : `Complement ${complement} is not yet in the map.`,
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
        `Found pair nums[${prevIdx}] (${elements[prevIdx].value}) + nums[${i}] (${currentVal}) = ${target}.`,
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
      `Recorded value ${currentVal} with its index ${i} into hash map.`,
      { i, 'nums[i]': currentVal }
    );
  }

  addStep(
    8,
    'Return empty array []',
    `No pair in array sums up to target = ${target}.`,
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
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target using a Hash Map.',
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
