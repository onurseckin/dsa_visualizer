import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface TwoSumSortedInput {
  nums: number[];
  target: number;
}

export const TWO_SUM_SORTED_CODE = `def two_sum_sorted(nums: list[int], target: int) -> list[int]:
    left = 0
    right = len(nums) - 1

    while left < right:
        current_sum = nums[left] + nums[right]

        if current_sum == target:
            return [left, right]
        elif current_sum < target:
            left += 1
        else:
            right -= 1

    return []`;

export const DEFAULT_TWO_SUM_SORTED_INPUT: TwoSumSortedInput = {
  nums: [1, 3, 4, 6, 8, 10, 13],
  target: 14,
};

export const generateTwoSumSortedSteps = (
  input: TwoSumSortedInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nums = input.nums;
  const target = input.target;
  const n = nums.length;

  const elements: ArrayElement[] = nums.map((val, idx) => ({
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
          target: String(target),
          currentPointers: `left: ${variables.left ?? '-'}, right: ${variables.right ?? '-'}`,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    'Initialize Two Sum II (Sorted)',
    `Because array [${nums.join(', ')}] is sorted, we can find two numbers summing to target ${target} in O(n) time and O(1) space using opposing two pointers.`,
    { target, length: n }
  );

  let left = 0;
  let right = n - 1;

  addStep(
    2,
    'Initialize Left Pointer',
    `Set left pointer at index 0 (value ${nums[left] ?? 'N/A'}), pointing to the smallest unexamined element.`,
    { left, right, target }
  );

  addStep(
    3,
    'Initialize Right Pointer',
    `Set right pointer at index ${right} (value ${nums[right] ?? 'N/A'}), pointing to the largest unexamined element.`,
    { left, right, target }
  );

  while (left < right) {
    // reset element states
    for (let k = 0; k < n; k++) {
      if (k !== left && k !== right) {
        elements[k].state = 'default';
        elements[k].pointers = undefined;
      }
    }

    elements[left].state = 'compare';
    elements[left].pointers = ['L'];
    elements[right].state = 'compare';
    elements[right].pointers = ['R'];

    const sum = nums[left] + nums[right];

    addStep(
      5,
      `Evaluate Left < Right (${left} < ${right})`,
      `Loop invariant satisfied: left (${left}) < right (${right}). Testing active candidate pair (nums[${left}] = ${nums[left]}, nums[${right}] = ${nums[right]}).`,
      { left, right, 'nums[left]': nums[left], 'nums[right]': nums[right] }
    );

    addStep(
      6,
      `Calculate current_sum = nums[${left}] + nums[${right}]`,
      `Compute candidate sum: ${nums[left]} + ${nums[right]} = ${sum}. Target is ${target}.`,
      { left, right, sum, target }
    );

    if (sum === target) {
      elements[left].state = 'sorted';
      elements[left].pointers = ['L', 'MATCH'];
      elements[right].state = 'sorted';
      elements[right].pointers = ['R', 'MATCH'];

      addStep(
        9,
        `Found Target Sum! Return indices [${left}, ${right}]`,
        `Target match! nums[${left}] (${nums[left]}) + nums[${right}] (${nums[right]}) = ${target}. Solution indices [${left}, ${right}] returned.`,
        { resultIdx1: left, resultIdx2: right, target, sum }
      );
      return steps;
    } else if (sum < target) {
      addStep(
        11,
        `Sum (${sum}) < Target (${target})`,
        `Monotonic Decision: Sum (${sum}) is smaller than target (${target}). Pairing nums[${left}] with any element <= nums[${right}] cannot reach target. Increment left pointer from ${left} to ${left + 1} to increase sum.`,
        { left, right, sum, target }
      );
      elements[left].state = 'visited';
      elements[left].pointers = undefined;
      left++;
    } else {
      addStep(
        13,
        `Sum (${sum}) > Target (${target})`,
        `Monotonic Decision: Sum (${sum}) is larger than target (${target}). Pairing nums[${right}] with any element >= nums[${left}] cannot reach target. Decrement right pointer from ${right} to ${right - 1} to decrease sum.`,
        { left, right, sum, target }
      );
      elements[right].state = 'visited';
      elements[right].pointers = undefined;
      right--;
    }
  }

  addStep(
    15,
    'Return empty array []',
    `Pointers converged (left >= right) without finding any pair summing to target ${target}. Return empty array.`,
    { target }
  );

  return steps;
};

export const twoSumSorted: AlgorithmDefinition<TwoSumSortedInput> = {
  id: 'two-sum-sorted',
  title: 'Two Sum II (Sorted)',
  category: 'two_pointers',
  difficulty: 'Easy',
  description:
    'Find two numbers in a 1-indexed sorted array of integers that add up to target using opposing left and right pointers in O(n) time and O(1) extra space.',
  constraints: [
    '2 <= nums.length <= 3 * 10^4',
    '-1000 <= nums[i] <= 1000',
    'nums is sorted in non-decreasing order.',
    '-1000 <= target <= 1000',
  ],
  examples: [
    {
      input: 'nums = [1, 3, 4, 6, 8, 10, 13], target = 14',
      output: '[0, 6]',
      explanation: 'nums[0] (1) + nums[6] (13) = 14. Return 0-indexed indices [0, 6].',
    },
    {
      input: 'nums = [2, 7, 11, 15], target = 9',
      output: '[0, 1]',
      explanation: 'nums[0] (2) + nums[1] (7) = 9. Return [0, 1].',
    },
  ],
  code: TWO_SUM_SORTED_CODE,
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
  },
  spaceComplexity: 'O(1)',
  defaultInput: DEFAULT_TWO_SUM_SORTED_INPUT,
  generateSteps: generateTwoSumSortedSteps,
};
