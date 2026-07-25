import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface TwoPointersInput {
  array: number[];
  target: number;
}

export const TWO_POINTERS_CODE = `function twoPointersSubarraySum(arr, target) {
  let left = 0;
  let currentSum = 0;

  for (let right = 0; right < arr.length; right++) {
    currentSum += arr[right];

    while (currentSum > target && left <= right) {
      currentSum -= arr[left];
      left++;
    }

    if (currentSum === target) {
      return [left, right];
    }
  }

  return [-1, -1];
}`;

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
    `Find a contiguous subarray in [${input.array.join(', ')}] that sums up to target = ${target}.`,
    { left: 0, right: 0, currentSum: 0, target, n }
  );

  if (n === 0) {
    addStep(
      15,
      'Array is empty',
      'No contiguous subarray possible in empty array.',
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
      `Extended right pointer. currentSum is now ${currentSum}. Target is ${target}.`,
      { left, right, 'arr[right]': rightVal, currentSum, target }
    );

    while (currentSum > target && left <= right) {
      const leftVal = elements[left].value;

      addStep(
        8,
        `currentSum (${currentSum}) > target (${target}): shrink window from left = ${left}`,
        `Subtracting arr[${left}] (${leftVal}) to reduce sum.`,
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
        12,
        `Found target sum! Subarray range [${left}..${right}]`,
        `Subarray elements [${input.array.slice(left, right + 1).join(', ')}] sum up to ${target}.`,
        { left, right, currentSum, target }
      );
      return steps;
    }
  }

  addStep(
    15,
    'No contiguous subarray matches target',
    `Finished scanning array. No contiguous range sums to ${target}.`,
    { left: -1, right: -1, currentSum, target }
  );

  return steps;
};

export const twoPointers: AlgorithmDefinition<TwoPointersInput> = {
  id: 'two-pointers',
  title: 'Two Pointers (Subarray Sum)',
  category: 'data-structures',
  difficulty: 'Easy',
  description:
    'Finds a contiguous subarray whose elements sum up to a target value using two pointers (left and right) defining a sliding window.',
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
