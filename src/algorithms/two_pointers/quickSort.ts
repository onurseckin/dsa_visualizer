import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export const QUICK_SORT_CODE = `def quick_sort(arr: list[int], low: int, high: int):
    if low < high:
        pivot_idx = partition(arr, low, high)
        quick_sort(arr, low, pivot_idx - 1)
        quick_sort(arr, pivot_idx + 1, high)

def partition(arr: list[int], low: int, high: int) -> int:
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1`;

export const generateQuickSortSteps = (input: number[]): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const workingElements: ArrayElement[] = input.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: 'default',
  }));

  const callStack: string[] = [];

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
        elements: workingElements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        stack: [...callStack],
      },
      variables,
    });
  };

  const n = workingElements.length;

  callStack.push(`quickSort(0, ${n - 1})`);
  addStep(
    1,
    'Initialize Quick Sort',
    `Divide-and-Conquer Strategy: Start Quick Sort on array of ${n} elements using Lomuto partitioning scheme around selected pivot elements.`,
    { low: 0, high: n - 1 }
  );
  callStack.pop();

  if (n <= 1) {
    if (n === 1) {
      workingElements[0].state = 'sorted';
    }
    addStep(
      1,
      'Quick Sort complete',
      'Base case: Array of size <= 1 requires no partitioning.',
      { low: 0, high: Math.max(0, n - 1) }
    );
    return steps;
  }

  const helper = (low: number, high: number) => {
    const frame = `quickSort(${low}, ${high})`;
    callStack.push(frame);

    addStep(
      1,
      `Enter ${frame}`,
      `Sorting subarray span [${low}..${high}]. Subarray length: ${high - low + 1}.`,
      { low, high }
    );

    addStep(
      2,
      `Check condition: low < high (${low} < ${high})`,
      low < high
        ? `Base case not reached (${low} < ${high}). Proceeding to partition subarray [${low}..${high}] around a pivot.`
        : `Base case reached (${low} >= ${high}). Subarray of size ${Math.max(0, high - low + 1)} requires no further division.`,
      { low, high, isBaseCase: low >= high }
    );

    if (low >= high) {
      if (low >= 0 && low < n && high >= 0 && high < n && low === high) {
        workingElements[low].state = 'sorted';
      }
      callStack.pop();
      return;
    }

    // Partition step
    addStep(
      3,
      `Call partition(arr, ${low}, ${high})`,
      `Invoking Lomuto Partitioning on subarray [${low}..${high}] to divide elements into smaller and larger partitions relative to pivot.`,
      { low, high }
    );

    // Line 8: Pivot selection
    const pivotVal = workingElements[high].value;
    workingElements[high].state = 'pivot';
    workingElements[high].pointers = ['pivot'];

    addStep(
      8,
      `Select pivot arr[${high}] = ${pivotVal}`,
      `Pivot Selection: Chosen rightmost element arr[${high}] (${pivotVal}) as comparison benchmark for this partition pass.`,
      { low, high, pivot: pivotVal }
    );

    let i = low - 1;
    addStep(
      9,
      `Initialize boundary i = ${i}`,
      `Boundary Pointer i: Pointer i initialized to ${i} (low - 1). It marks the upper boundary of elements known to be <= pivot (${pivotVal}).`,
      { low, high, i, pivot: pivotVal }
    );

    for (let j = low; j < high; j++) {
      workingElements[j].state = 'compare';
      const jPointers = ['j'];
      if (i >= low) {
        workingElements[i].pointers = ['i'];
      }
      workingElements[j].pointers = jPointers;

      const currentVal = workingElements[j].value;
      addStep(
        11,
        `Compare arr[${j}] (${currentVal}) with pivot (${pivotVal})`,
        currentVal <= pivotVal
          ? `Comparison: ${currentVal} <= ${pivotVal}. Element belongs in left partition (<= pivot).`
          : `Comparison: ${currentVal} > ${pivotVal}. Element belongs in right partition (> pivot).`,
        { low, high, i, j, 'arr[j]': currentVal, pivot: pivotVal }
      );

      if (currentVal <= pivotVal) {
        i++;
        addStep(
          12,
          `Increment boundary i to ${i}`,
          `Expand Left Boundary: Increment pointer i to ${i} to allocate space for element ${currentVal} in the left partition.`,
          { low, high, i, j, 'arr[j]': currentVal, pivot: pivotVal }
        );

        workingElements[i].state = 'swap';
        workingElements[j].state = 'swap';
        const temp = workingElements[i];
        workingElements[i] = workingElements[j];
        workingElements[j] = temp;

        addStep(
          13,
          `Swap arr[${i}] and arr[${j}]`,
          `Swap Action: Moved element ${workingElements[i].value} into index ${i} so all elements up to index ${i} remain <= pivot (${pivotVal}).`,
          { low, high, i, j, 'arr[i]': workingElements[i].value, 'arr[j]': workingElements[j].value }
        );

        workingElements[i].state = 'default';
        workingElements[j].state = 'default';
      } else {
        workingElements[j].state = 'default';
      }

      // Cleanup pointers
      if (i >= low && i < n) {
        workingElements[i].pointers = undefined;
      }
      workingElements[j].pointers = undefined;
    }

    const pivotIdx = i + 1;
    workingElements[pivotIdx].state = 'swap';
    workingElements[high].state = 'swap';

    addStep(
      14,
      `Swap pivot arr[${high}] (${pivotVal}) into final position arr[${pivotIdx}]`,
      `Final Pivot Placement: Swap pivot ${pivotVal} from index ${high} into index ${pivotIdx}, placing it in its permanent sorted position.`,
      { low, high, pivotIdx, pivot: pivotVal }
    );

    const tempPivot = workingElements[pivotIdx];
    workingElements[pivotIdx] = workingElements[high];
    workingElements[high] = tempPivot;

    workingElements[pivotIdx].state = 'sorted';
    workingElements[pivotIdx].pointers = undefined;
    if (high !== pivotIdx) {
      workingElements[high].state = 'default';
      workingElements[high].pointers = undefined;
    }

    addStep(
      15,
      `Partition complete. Pivot index is ${pivotIdx}`,
      `Lomuto Partition Invariant: All elements in arr[${low}..${pivotIdx - 1}] are <= ${pivotVal}, and all elements in arr[${pivotIdx + 1}..${high}] are >= ${pivotVal}.`,
      { low, high, pivotIdx }
    );

    // Left recursive call
    addStep(
      4,
      `Recurse left: quickSort(arr, ${low}, ${pivotIdx - 1})`,
      `Recursive Subproblem: Solve left partition arr[${low}..${pivotIdx - 1}].`,
      { low, high: pivotIdx - 1 }
    );
    helper(low, pivotIdx - 1);

    // Right recursive call
    addStep(
      5,
      `Recurse right: quickSort(arr, ${pivotIdx + 1}, ${high})`,
      `Recursive Subproblem: Solve right partition arr[${pivotIdx + 1}..${high}].`,
      { low: pivotIdx + 1, high }
    );
    helper(pivotIdx + 1, high);

    callStack.pop();
  };

  helper(0, n - 1);

  // Mark all elements sorted at the end
  for (let k = 0; k < n; k++) {
    workingElements[k].state = 'sorted';
    workingElements[k].pointers = undefined;
  }

  addStep(
    1,
    'Quick Sort complete',
    'All recursive subproblems resolved. Entire array is fully sorted in ascending order.',
    { low: 0, high: n - 1 }
  );

  return steps;
};

export const quickSort: AlgorithmDefinition<number[]> = {
  id: 'quick-sort',
  title: 'Quick Sort',
  category: 'two_pointers',
  difficulty: 'Medium',
  description:
    'Quick Sort is an efficient divide-and-conquer sorting algorithm that selects a pivot element, partitions the array such that smaller elements move left and larger elements stay right, and recursively sorts sub-arrays.',
  constraints: ['1 <= arr.length <= 10^5', '-10^9 <= arr[i] <= 10^9'],
  examples: [
    {
      input: 'arr = [6, 2, 9, 3, 7, 1, 5]',
      output: '[1, 2, 3, 5, 6, 7, 9]',
      explanation: 'Partitions around pivot 5, recursively sorting sub-arrays [1, 2, 3] and [6, 9, 7].',
    },
    {
      input: 'arr = [4, 2, 4, 1]',
      output: '[1, 2, 4, 4]',
      explanation: 'Correctly sorts arrays containing duplicate values.',
    },
  ],
  code: QUICK_SORT_CODE,
  timeComplexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
  },
  spaceComplexity: 'O(log n)',
  defaultInput: [6, 2, 9, 3, 7, 1, 5],
  generateSteps: generateQuickSortSteps,
};
