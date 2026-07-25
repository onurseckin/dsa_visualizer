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
    `Start Quick Sort on an array of ${n} elements.`,
    { low: 0, high: n - 1 }
  );
  callStack.pop();

  if (n <= 1) {
    if (n === 1) {
      workingElements[0].state = 'sorted';
    }
    addStep(
      7,
      'Quick Sort complete',
      'Array is already sorted.',
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
      `Sorting subarray from index ${low} to ${high}.`,
      { low, high }
    );

    addStep(
      2,
      `Check condition: low < high (${low} < ${high})`,
      low < high
        ? `Base case not reached. Proceeding to partition subarray [${low}..${high}].`
        : `Base case reached. Subarray of size ${high - low + 1} requires no partitioning.`,
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
      `Partitioning subarray to select pivot and divide elements into smaller/greater subproblems.`,
      { low, high }
    );

    // Line 10: Pivot selection
    const pivotVal = workingElements[high].value;
    workingElements[high].state = 'pivot';
    workingElements[high].pointers = ['pivot'];

    addStep(
      10,
      `Select pivot arr[${high}] = ${pivotVal}`,
      `Chosen element at index ${high} as pivot for partitioning.`,
      { low, high, pivot: pivotVal }
    );

    let i = low - 1;
    addStep(
      11,
      `Initialize boundary i = ${i}`,
      `Index i tracks the boundary of elements less than pivot (${pivotVal}).`,
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
        13,
        `Compare arr[${j}] (${currentVal}) with pivot (${pivotVal})`,
        currentVal < pivotVal
          ? `${currentVal} < ${pivotVal}, element belongs in left partition.`
          : `${currentVal} >= ${pivotVal}, element stays in right partition.`,
        { low, high, i, j, 'arr[j]': currentVal, pivot: pivotVal }
      );

      if (currentVal < pivotVal) {
        i++;
        addStep(
          14,
          `Increment boundary i to ${i}`,
          `Expand smaller element partition boundary.`,
          { low, high, i, j, 'arr[j]': currentVal, pivot: pivotVal }
        );

        workingElements[i].state = 'swap';
        workingElements[j].state = 'swap';
        const temp = workingElements[i];
        workingElements[i] = workingElements[j];
        workingElements[j] = temp;

        addStep(
          15,
          `Swap arr[${i}] and arr[${j}]`,
          `Swapped ${workingElements[j].value} and ${workingElements[i].value} to move smaller element left.`,
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
      18,
      `Swap pivot arr[${high}] (${pivotVal}) into final position arr[${pivotIdx}]`,
      `Place pivot element in its correct sorted index ${pivotIdx}.`,
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
      19,
      `Partition complete. Pivot index is ${pivotIdx}`,
      `All elements before index ${pivotIdx} are <= ${pivotVal}, and all elements after are >= ${pivotVal}.`,
      { low, high, pivotIdx }
    );

    // Left recursive call
    addStep(
      4,
      `Recurse left: quickSort(arr, ${low}, ${pivotIdx - 1})`,
      `Sort left partition [${low}..${pivotIdx - 1}].`,
      { low, high: pivotIdx - 1 }
    );
    helper(low, pivotIdx - 1);

    // Right recursive call
    addStep(
      5,
      `Recurse right: quickSort(arr, ${pivotIdx + 1}, ${high})`,
      `Sort right partition [${pivotIdx + 1}..${high}].`,
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
    7,
    'Quick Sort complete',
    'All recursive calls completed. The array is fully sorted.',
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
    'Quick Sort is an efficient divide-and-conquer sorting algorithm that selects a pivot element and partitions the array into two sub-arrays according to whether elements are less than or greater than the pivot.',
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
