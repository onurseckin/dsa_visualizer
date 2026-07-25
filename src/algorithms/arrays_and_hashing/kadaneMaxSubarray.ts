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
    `Start processing first element nums[0] = ${elements[0].value}.`,
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
        `Discard previous subarray. Start new subarray from index ${i} with currentMax = ${currentMax}.`,
        { i, 'nums[i]': val, currentMax, globalMax, tempStart }
      );
    } else {
      currentMax += val;

      addStep(
        11,
        `Extend subarray: currentMax += nums[${i}] (${val}) -> ${currentMax}`,
        `Adding nums[${i}] (${val}) increases/modifies the current subarray sum to ${currentMax}.`,
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
        `Updated globalMax to ${globalMax} for subarray from index ${start} to ${end}.`,
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
    `Maximum contiguous subarray sum is ${globalMax} spanning indices [${start}..${end}].`,
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
    "Kadane's Algorithm finds the maximum sum of a contiguous subarray in an array of numbers in O(n) time and O(1) extra space.",
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
