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
    'Set up the two-pointer search',
    `The array [${nums.join(', ')}] is already sorted, so instead of testing every pair we can squeeze two pointers toward each other until they land on a pair that sums to ${target}.`,
    { target, length: n }
  );

  let left = 0;
  let right = n - 1;

  addStep(
    2,
    'Place the left pointer at index 0',
    `We start left at the smallest value, ${nums[left] ?? 'N/A'}. Moving this pointer right is our only way to make the sum bigger.`,
    { left, right, target }
  );

  addStep(
    3,
    `Place the right pointer at index ${right}`,
    `We start right at the largest value, ${nums[right] ?? 'N/A'}. Moving this pointer left is our only way to make the sum smaller.`,
    { left, right, target }
  );

  while (left < right) {
    // update element states: preserve visited for eliminated indices outside [left, right]
    for (let k = 0; k < n; k++) {
      if (k < left || k > right) {
        elements[k].state = 'visited';
        elements[k].pointers = undefined;
      } else if (k !== left && k !== right) {
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
      `Check pointers at ${left} and ${right}`,
      `The pointers haven't crossed yet, so there are still pairs left to try. Our current candidates are nums[${left}] = ${nums[left]} and nums[${right}] = ${nums[right]}.`,
      { left, right, 'nums[left]': nums[left], 'nums[right]': nums[right] }
    );

    addStep(
      6,
      `Add ${nums[left]} and ${nums[right]}`,
      `We add the two ends together: ${nums[left]} + ${nums[right]} = ${sum}. Comparing that against the target ${target} tells us which pointer to move next.`,
      { left, right, sum, target }
    );

    if (sum === target) {
      elements[left].state = 'sorted';
      elements[left].pointers = ['L', 'MATCH'];
      elements[right].state = 'sorted';
      elements[right].pointers = ['R', 'MATCH'];

      addStep(
        9,
        `Return the pair [${left}, ${right}]`,
        `${nums[left]} + ${nums[right]} lands exactly on ${target}, so indices [${left}, ${right}] are our answer. One pass with two pointers — that's the whole trick.`,
        { resultIdx1: left, resultIdx2: right, target, sum }
      );
      return steps;
    } else if (sum < target) {
      addStep(
        11,
        'Advance left to raise the sum',
        `${sum} falls short of ${target}, and pairing nums[${left}] = ${nums[left]} with anything smaller than nums[${right}] would fall even shorter. So we're done with it — we move left to index ${left + 1} to bring in a bigger number.`,
        { left, right, sum, target }
      );
      elements[left].state = 'visited';
      elements[left].pointers = undefined;
      left++;
    } else {
      addStep(
        13,
        'Pull right back to lower the sum',
        `${sum} overshoots ${target}, and pairing nums[${right}] = ${nums[right]} with anything bigger than nums[${left}] would overshoot even more. So we're done with it — we move right to index ${right - 1} to bring in a smaller number.`,
        { left, right, sum, target }
      );
      elements[right].state = 'visited';
      elements[right].pointers = undefined;
      right--;
    }
  }

  addStep(
    15,
    'Return empty array — no pair exists',
    `The pointers met without ever hitting ${target}, which means every possible pair has been ruled out. We return an empty array to signal there is no answer.`,
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
    'Find two numbers in a sorted array that add up to a target by walking a left and a right pointer toward each other from opposite ends.',
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
  complexityAnalysis: {
    time: 'Every iteration moves one of the two pointers a step inward and neither ever moves back, so after at most n - 1 moves they meet and the loop stops. That single squeeze across the array is why the time is O(n) in every case — the sorted order lets each comparison eliminate one element for good.',
    space: 'We keep only two index variables and a running sum no matter how large the array gets, so extra memory is constant — O(1).',
  },
  defaultInput: DEFAULT_TWO_SUM_SORTED_INPUT,
  generateSteps: generateTwoSumSortedSteps,
};
