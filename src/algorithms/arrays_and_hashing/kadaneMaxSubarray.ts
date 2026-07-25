import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export const KADANE_MAX_SUBARRAY_CODE = `def max_sub_array(nums: list[int]) -> int:
    current_max = nums[0]
    global_max = nums[0]
    start = end = temp_start = 0

    for i in range(1, len(nums)):
        if nums[i] > current_max + nums[i]:
            current_max = nums[i]
            temp_start = i
        else:
            current_max += nums[i]

        if current_max > global_max:
            global_max = current_max
            start = temp_start
            end = i

    return global_max`;

export const generateKadaneMaxSubarraySteps = (input: number[]): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const elements: ArrayElement[] = input.map((val, idx) => ({
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
          currentMax: variables.currentMax !== undefined ? String(variables.currentMax) : '0',
          globalMax: variables.globalMax !== undefined ? String(variables.globalMax) : '0',
        },
      },
      variables,
    });
  };

  const n = elements.length;

  if (n === 0) {
    addStep(
      1,
      'Initialize Kadane Algorithm',
      'Input array is empty. Return globalMax = 0.',
      { currentMax: 0, globalMax: 0, n: 0 }
    );
    return steps;
  }

  let currentMax = elements[0].value;
  let globalMax = elements[0].value;
  let start = 0;
  let end = 0;
  let tempStart = 0;

  elements[0].state = 'active';
  elements[0].pointers = ['start', 'end'];

  addStep(
    2,
    `Initialize Kadane: currentMax = ${currentMax}, globalMax = ${globalMax}`,
    `Kadane Decision Rule: Initialize running local max (currentMax) and overall max (globalMax) to nums[0] (${elements[0].value}). At index 0, the best contiguous subarray ending at index 0 is the single element nums[0].`,
    { currentMax, globalMax, start, end, tempStart, i: 0, 'nums[0]': elements[0].value }
  );

  for (let i = 1; i < n; i++) {
    const val = elements[i].value;

    // Reset element states to default, then set active bounds
    for (let k = 0; k < n; k++) {
      if (k >= tempStart && k < i) {
        elements[k].state = 'active';
      } else {
        elements[k].state = 'default';
      }
      elements[k].pointers = undefined;
    }

    elements[i].state = 'compare';
    elements[i].pointers = ['i'];

    if (val > currentMax + val) {
      currentMax = val;
      tempStart = i;

      // Update pointers for new window start
      elements[i].state = 'active';
      elements[i].pointers = ['i', 'tempStart'];

      addStep(
        7,
        `nums[${i}] (${val}) > currentMax + nums[${i}] (${currentMax + val})`,
        `Reset Subarray Window: The previous accumulated sum was negative (${currentMax - val}), making it detrimental to extend. Discard previous window and start a fresh subarray at index ${i}.`,
        { i, 'nums[i]': val, currentMax, globalMax, tempStart }
      );
    } else {
      currentMax += val;

      addStep(
        11,
        `Extend subarray: currentMax += nums[${i}] (${val}) -> ${currentMax}`,
        `Extend Subarray Window: The previous accumulated sum (${currentMax - val}) is positive/helpful. Adding nums[${i}] (${val}) extends the running subarray sum to ${currentMax}.`,
        { i, 'nums[i]': val, currentMax, globalMax, tempStart }
      );
    }

    if (currentMax > globalMax) {
      globalMax = currentMax;
      start = tempStart;
      end = i;

      addStep(
        14,
        `New globalMax found: ${globalMax}`,
        `Record New High: Running local max currentMax (${currentMax}) exceeds previous globalMax. Update globalMax = ${globalMax} for subarray range [${start}..${end}].`,
        { i, currentMax, globalMax, start, end, tempStart }
      );
    }
  }

  // Highlight the best subarray as sorted
  for (let k = 0; k < n; k++) {
    if (k >= start && k <= end) {
      elements[k].state = 'sorted';
      const ptrs: string[] = [];
      if (k === start) ptrs.push('max_start');
      if (k === end) ptrs.push('max_end');
      elements[k].pointers = ptrs.length > 0 ? ptrs : undefined;
    } else {
      elements[k].state = 'default';
      elements[k].pointers = undefined;
    }
  }

  addStep(
    18,
    `Kadane Algorithm Complete`,
    `Evaluation Complete: Discovered maximum contiguous subarray sum globalMax = ${globalMax} spanning indices [${start}..${end}] in single linear O(n) pass.`,
    { globalMax, start, end }
  );

  return steps;
};

export const kadaneMaxSubarray: AlgorithmDefinition<number[]> = {
  id: 'kadane-max-subarray',
  title: "Kadane's Algorithm (Maximum Subarray)",
  category: 'arrays_and_hashing',
  difficulty: 'Medium',
  description:
    "Kadane's Algorithm finds the maximum sum of a contiguous subarray in an array of numbers in O(n) time and O(1) extra space by dynamically deciding whether to extend the current subarray or reset it at each index.",
  constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
  examples: [
    {
      input: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]',
      output: '6',
      explanation: 'The contiguous subarray [4, -1, 2, 1] has the maximum sum = 6.',
    },
    {
      input: 'nums = [1]',
      output: '1',
      explanation: 'The single element array has maximum sum = 1.',
    },
    {
      input: 'nums = [5, 4, -1, 7, 8]',
      output: '23',
      explanation: 'The entire array forms the maximum contiguous subarray with sum = 23.',
    },
  ],
  code: KADANE_MAX_SUBARRAY_CODE,
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
  },
  spaceComplexity: 'O(1)',
  defaultInput: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  generateSteps: generateKadaneMaxSubarraySteps,
};
