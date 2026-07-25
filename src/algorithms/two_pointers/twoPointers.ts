import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface TwoPointersInput {
  array: number[];
  target: number;
}

export const TWO_POINTERS_CODE = `def two_pointers_subarray_sum(arr: list[int], target: int) -> list[int]:
    left = 0
    current_sum = 0

    for right in range(len(arr)):
        current_sum += arr[right]

        while current_sum > target and left <= right:
            current_sum -= arr[left]
            left += 1

        if current_sum == target:
            return [left, right]

    return [-1, -1]`;

export const DEFAULT_TWO_POINTERS_INPUT: TwoPointersInput = {
  array: [1, 2, 3, 7, 5],
  target: 12,
};

export const generateTwoPointersSteps = (input: TwoPointersInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const elements: ArrayElement[] = input.array.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: 'default',
  }));

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
        customState: {
          currentSum: String(variables.currentSum ?? 0),
          target: String(input.target),
        },
      },
      variables,
    });
  };

  const n = elements.length;
  const target = input.target;

  addStep(
    1,
    'Initialize Two Pointers Subarray Sum',
    `Find a contiguous subarray in [${input.array.join(', ')}] that sums to target = ${target} using a sliding window bounded by left and right pointers in O(n) time.`,
    { left: 0, right: 0, currentSum: 0, target, n }
  );

  if (n === 0) {
    addStep(
      11,
      'Array is empty',
      'No contiguous subarray can exist in an empty array.',
      { left: -1, right: -1, currentSum: 0, target }
    );
    return steps;
  }

  let left = 0;
  let currentSum = 0;

  const syncElementStates = (
    currentLeft: number,
    currentRight: number,
    isMatch = false
  ) => {
    for (let k = 0; k < n; k++) {
      const ptrs: string[] = [];
      if (k === currentLeft) ptrs.push('left');
      if (k === currentRight) ptrs.push('right');

      if (k >= currentLeft && k <= currentRight) {
        elements[k].state = isMatch ? 'sorted' : 'active';
      } else {
        elements[k].state = 'default';
      }

      elements[k].pointers = ptrs.length > 0 ? ptrs : undefined;
    }
  };

  for (let right = 0; right < n; right++) {
    const rightVal = elements[right].value;
    currentSum += rightVal;

    syncElementStates(left, right);

    addStep(
      6,
      `Expand window right = ${right}: add arr[${right}] (${rightVal})`,
      `Window Expansion: Advancing right pointer incorporates element arr[${right}] (${rightVal}), increasing running currentSum to ${currentSum} (Target: ${target}).`,
      { left, right, 'arr[right]': rightVal, currentSum, target }
    );

    while (currentSum > target && left <= right) {
      const leftVal = elements[left].value;

      addStep(
        9,
        `currentSum (${currentSum}) > target (${target}): shrink window from left = ${left}`,
        `Window Contraction: Running sum (${currentSum}) exceeds target (${target}). Since elements are non-negative, subtracting arr[${left}] (${leftVal}) by advancing left pointer reduces sum toward target.`,
        { left, right, 'arr[left]': leftVal, currentSum, target }
      );

      currentSum -= leftVal;
      left++;

      if (left <= right) {
        syncElementStates(left, right);
      }
    }

    if (currentSum === target) {
      syncElementStates(left, right, true);

      addStep(
        13,
        `Found target sum! Subarray range [${left}..${right}]`,
        `Target Match: Subarray elements [${input.array.slice(left, right + 1).join(', ')}] span range [${left}..${right}] and sum exactly to ${target}.`,
        { left, right, currentSum, target }
      );
      return steps;
    }
  }

  addStep(
    15,
    'No contiguous subarray matches target',
    `Scanned full array with right pointer without finding any contiguous subarray window summing to target ${target}.`,
    { left: -1, right: -1, currentSum, target }
  );

  return steps;
};

export const twoPointers: AlgorithmDefinition<TwoPointersInput> = {
  id: 'two-pointers',
  title: 'Two Pointers (Subarray Sum)',
  category: 'two_pointers',
  difficulty: 'Easy',
  description:
    'Finds a contiguous subarray whose elements sum up to a target value using two pointers (left and right) defining a dynamic sliding window over non-negative integers.',
  constraints: [
    '1 <= arr.length <= 10^5',
    '0 <= arr[i] <= 10^4',
    '1 <= target <= 10^9',
  ],
  examples: [
    {
      input: 'arr = [1, 2, 3, 7, 5], target = 12',
      output: '[1, 3]',
      explanation: 'Subarray from index 1 to 3: [2, 3, 7] sums to 2 + 3 + 7 = 12.',
    },
    {
      input: 'arr = [1, 2, 3, 4, 5], target = 15',
      output: '[0, 4]',
      explanation: 'The entire array sums to 15.',
    },
  ],
  code: TWO_POINTERS_CODE,
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
  },
  spaceComplexity: 'O(1)',
  defaultInput: DEFAULT_TWO_POINTERS_INPUT,
  generateSteps: generateTwoPointersSteps,
};
