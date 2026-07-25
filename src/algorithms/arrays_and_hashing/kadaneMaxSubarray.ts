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
      'Handle empty input',
      'There are no elements to build a subarray from, so the best sum defaults to 0 and we stop right away.',
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
    `Start both sums at ${currentMax}`,
    `The only subarray that ends at index 0 is [${elements[0].value}] by itself, so both our running sum and our best-so-far begin there. From now on, every element just has to decide: join the current run, or start a new one.`,
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

    // Captured before mutation so explanations can show the sum being abandoned/extended
    const prevSum = currentMax;

    if (val > currentMax + val) {
      currentMax = val;
      tempStart = i;

      // Update pointers for new window start
      elements[i].state = 'active';
      elements[i].pointers = ['i', 'tempStart'];

      addStep(
        7,
        `Restart the subarray at index ${i}`,
        `The sum we were carrying, ${prevSum}, is negative — adding ${val} on top of it would leave less than ${val} alone. So we drop that stretch and let a fresh subarray begin here.`,
        { i, 'nums[i]': val, currentMax, globalMax, tempStart }
      );
    } else {
      currentMax += val;

      addStep(
        11,
        `Extend the subarray to ${currentMax}`,
        `Our running sum ${prevSum} is worth keeping, so we let it absorb ${val}. The best subarray ending at index ${i} is now worth ${currentMax}.`,
        { i, 'nums[i]': val, currentMax, globalMax, tempStart }
      );
    }

    if (currentMax > globalMax) {
      globalMax = currentMax;
      start = tempStart;
      end = i;

      addStep(
        14,
        `Record new best sum ${globalMax}`,
        `The subarray ending at index ${i} sums to ${currentMax}, better than anything we've seen so far. We note the new record and its span [${start}..${end}].`,
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
    `Kadane's scan complete`,
    `The best contiguous run spans [${start}..${end}] with a sum of ${globalMax}. One linear pass was enough, because each element only had to answer a single question: extend the run or start over.`,
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
    "Kadane's Algorithm finds the maximum sum of a contiguous subarray in a single pass by making one decision at each index: extend the current run, or abandon it and start fresh.",
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
  complexityAnalysis: {
    time: "We make a single left-to-right pass, and at each element we do only a constant amount of work: one comparison to decide whether to extend or restart the run, and one to update the best-so-far. That's n constant-time decisions, so the total is O(n) in every case — no input can make the pass longer.",
    space: 'We carry just a handful of scalars — the running sum, the best sum, and a few indices — no matter how long the array gets, so extra memory stays constant at O(1).',
  },
  defaultInput: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
  generateSteps: generateKadaneMaxSubarraySteps,
};
