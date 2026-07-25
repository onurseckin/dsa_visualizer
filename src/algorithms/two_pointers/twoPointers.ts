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
    'Set up the window search',
    `We're looking for a run of consecutive elements in [${input.array.join(', ')}] that sums to ${target}. A window bounded by left and right pointers will grow and shrink as we scan.`,
    { left: 0, right: 0, currentSum: 0, target, n }
  );

  if (n === 0) {
    addStep(
      11,
      'Stop — the array is empty',
      'There are no elements at all, so no contiguous subarray can exist. We return [-1, -1] right away.',
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
      `Grow the window to index ${right}`,
      `We slide right to index ${right} and fold arr[${right}] = ${rightVal} into the running sum, which is now ${currentSum}. We're still chasing ${target}.`,
      { left, right, 'arr[right]': rightVal, currentSum, target }
    );

    while (currentSum > target && left <= right) {
      const leftVal = elements[left].value;

      addStep(
        9,
        'Shrink the window from the left',
        `Our sum ${currentSum} has overshot ${target}, and because every element is non-negative, growing the window can never fix that. We drop arr[${left}] = ${leftVal} off the left edge to bring the sum back down.`,
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
        `Return the window [${left}..${right}]`,
        `The window [${input.array.slice(left, right + 1).join(', ')}] sums to exactly ${target}, so indices [${left}, ${right}] are the answer. Because each pointer only ever moved forward, the whole search stayed linear.`,
        { left, right, currentSum, target }
      );
      return steps;
    }
  }

  addStep(
    15,
    'Return [-1, -1] — no window matched',
    `The right pointer reached the end and no window ever settled on ${target}. There is no contiguous subarray with that sum, so we return [-1, -1].`,
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
    'Finds a contiguous subarray that sums to a target value by growing and shrinking a window between left and right pointers over non-negative integers.',
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
  complexityAnalysis: {
    time: 'The right pointer walks the array exactly once, and the left pointer chases it — it only ever moves forward, so across the whole run it also takes at most n steps. Even though the shrink loop looks nested, the total work is bounded by those two forward walks, which is why the time is O(n) rather than O(n²).',
    space: 'The window is tracked with just two indices and one running sum, so extra memory stays constant at O(1) regardless of input size.',
  },
  defaultInput: DEFAULT_TWO_POINTERS_INPUT,
  generateSteps: generateTwoPointersSteps,
};
