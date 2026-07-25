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
    `We'll sort these ${n} values by divide and conquer: pick a pivot, herd everything smaller to its left and everything larger to its right, then repeat on each side.`,
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
      'An array of at most one element is already sorted, so there is nothing for us to do.',
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
      `We're now responsible for the ${Math.max(0, high - low + 1)}-element slice [${low}..${high}]; everything outside it is handled by calls higher up the stack.`,
      { low, high }
    );

    addStep(
      2,
      `Check low < high (${low} vs ${high})`,
      low < high
        ? `The slice still holds at least two elements, so it could be out of order — we go on to partition it around a pivot.`
        : `A slice of ${Math.max(0, high - low + 1)} element${Math.max(0, high - low + 1) === 1 ? '' : 's'} is as sorted as it can get, so this call simply hands control back.`,
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
      `Partition the slice [${low}..${high}]`,
      `We hand the slice to partition, whose job is to pick a pivot and split the values into a "smaller or equal" side and a "larger" side around it.`,
      { low, high }
    );

    // Line 8: Pivot selection
    const pivotVal = workingElements[high].value;
    workingElements[high].state = 'pivot';
    workingElements[high].pointers = ['pivot'];

    addStep(
      8,
      `Pick the pivot ${pivotVal}`,
      `We take the rightmost element, ${pivotVal}, as our yardstick — every other value in this slice will be judged as either "at most ${pivotVal}" or "bigger".`,
      { low, high, pivot: pivotVal }
    );

    let i = low - 1;
    addStep(
      9,
      `Set the boundary i = ${i}`,
      `The pointer i marks the end of the "small values" zone. It starts at ${i}, just before the slice, because we haven't found anything <= ${pivotVal} yet.`,
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
        `Compare ${currentVal} with pivot ${pivotVal}`,
        currentVal <= pivotVal
          ? `${currentVal} is at most ${pivotVal}, so it belongs on the pivot's left — we'll grow the small-values zone to take it in.`
          : `${currentVal} is bigger than ${pivotVal}, so we leave it where it stands; it will end up on the pivot's right side.`,
        { low, high, i, j, 'arr[j]': currentVal, pivot: pivotVal }
      );

      if (currentVal <= pivotVal) {
        i++;
        addStep(
          12,
          `Grow the small zone to index ${i}`,
          `Sliding i forward to ${i} opens the next seat in the <=-pivot zone, ready to receive ${currentVal}.`,
          { low, high, i, j, 'arr[j]': currentVal, pivot: pivotVal }
        );

        workingElements[i].state = 'swap';
        workingElements[j].state = 'swap';
        const temp = workingElements[i];
        workingElements[i] = workingElements[j];
        workingElements[j] = temp;

        addStep(
          13,
          `Swap into index ${i}`,
          `Moving ${workingElements[i].value} into index ${i} keeps our promise intact: everything up to and including index ${i} is at most ${pivotVal}.`,
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
      `Move pivot ${pivotVal} to index ${pivotIdx}`,
      `Index ${pivotIdx} is the first seat after the small-values zone — exactly where ${pivotVal} belongs. Once it lands there, it will never need to move again.`,
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
      `Partition done at index ${pivotIdx}`,
      `Everything left of index ${pivotIdx} is at most ${pivotVal}, and everything right of it is at least ${pivotVal} — so the pivot now sits in its final sorted position.`,
      { low, high, pivotIdx }
    );

    // Left recursive call
    addStep(
      4,
      `Recurse into the left side`,
      `The values in [${low}..${pivotIdx - 1}] are all on the correct side of the pivot but still jumbled among themselves, so we sort that slice the same way.`,
      { low, high: pivotIdx - 1 }
    );
    helper(low, pivotIdx - 1);

    // Right recursive call
    addStep(
      5,
      `Recurse into the right side`,
      `Now the larger values in [${pivotIdx + 1}..${high}] get the same treatment: pick a pivot, split, and repeat.`,
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
    'Every recursive call has finished and every pivot has settled into its final spot, so the whole array now reads in ascending order. With reasonably balanced splits, that took about n log n work.',
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
    'Quick Sort is an efficient divide-and-conquer sorting algorithm: it picks a pivot, partitions the array so smaller values sit to its left and larger values to its right, then recursively sorts each side.',
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
  complexityAnalysis: {
    time: 'Each partition pass touches every element in its slice once, and when pivots land near the middle the slices roughly halve at every level, giving about log n levels of n work each — O(n log n) on average. If the pivot keeps landing at an extreme (for example, an already-sorted array with the last element as pivot), one side of every split is empty, the levels grow to n, and the cost degrades to O(n²).',
    space: 'The sorting itself happens in place; the only memory that grows is the recursion stack, which stays around log n frames deep when splits are balanced — O(log n). Badly unbalanced splits can push it toward O(n) frames.',
  },
  defaultInput: [6, 2, 9, 3, 7, 1, 5],
  generateSteps: generateQuickSortSteps,
};
