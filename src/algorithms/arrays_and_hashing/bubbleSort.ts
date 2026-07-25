import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export const BUBBLE_SORT_CODE = `def bubble_sort(arr: list[int]) -> list[int]:
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`;

export const generateBubbleSortSteps = (input: number[]): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const workingElements: ArrayElement[] = input.map((val, idx) => ({
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
        elements: workingElements.map((el) => ({ ...el, pointers: el.pointers ? [...el.pointers] : undefined })),
      },
      auxiliaryState: {},
      variables,
    });
  };

  const n = workingElements.length;

  addStep(
    1,
    'Initialize Bubble Sort',
    `Bubble Sort iterates through an array of ${n} elements, repeatedly swapping adjacent elements out of order until the largest unsorted element bubbles to the right end on each pass.`,
    { n }
  );

  if (n <= 1) {
    if (n === 1) {
      workingElements[0].state = 'sorted';
    }
    addStep(
      7,
      'Bubble Sort complete',
      'Array of size <= 1 is trivially sorted.',
      { n }
    );
    return steps;
  }

  addStep(
    2,
    `Set array length n = ${n}`,
    `Array length n = ${n} implies a maximum of ${n - 1} passes are required to sort the array.`,
    { n }
  );

  for (let i = 0; i < n - 1; i++) {
    addStep(
      3,
      `Start pass i = ${i}`,
      `Pass ${i + 1} of ${n - 1}: Comparing adjacent elements from index 0 up to ${n - 2 - i}. The largest unsorted element will settle at index ${n - 1 - i}.`,
      { i, n }
    );

    for (let j = 0; j < n - i - 1; j++) {
      // Highlight compared elements
      workingElements[j].state = 'compare';
      workingElements[j].pointers = ['j'];
      workingElements[j + 1].state = 'compare';
      workingElements[j + 1].pointers = ['j+1'];

      const valJ = workingElements[j].value;
      const valJNext = workingElements[j + 1].value;

      addStep(
        5,
        `Compare arr[${j}] (${valJ}) and arr[${j + 1}] (${valJNext})`,
        valJ > valJNext
          ? `Inversion detected: ${valJ} > ${valJNext}. To maintain non-decreasing order, swap elements at indices ${j} and ${j + 1}.`
          : `Correct relative order: ${valJ} <= ${valJNext}. No swap needed; proceed to next adjacent pair.`,
        { i, j, 'arr[j]': valJ, 'arr[j+1]': valJNext }
      );

      if (valJ > valJNext) {
        workingElements[j].state = 'swap';
        workingElements[j + 1].state = 'swap';

        const temp = workingElements[j];
        workingElements[j] = workingElements[j + 1];
        workingElements[j + 1] = temp;

        addStep(
          6,
          `Swap arr[${j}] and arr[${j + 1}]`,
          `Swapped values ${valJ} and ${valJNext}, advancing the larger element ${valJ} toward the right boundary.`,
          { i, j, 'arr[j]': workingElements[j].value, 'arr[j+1]': workingElements[j + 1].value }
        );
      }

      // Reset pointers and state if not sorted
      workingElements[j].state = 'default';
      workingElements[j].pointers = undefined;
      workingElements[j + 1].state = 'default';
      workingElements[j + 1].pointers = undefined;
    }

    // Mark the bubbled element as sorted
    const sortedIdx = n - 1 - i;
    workingElements[sortedIdx].state = 'sorted';
    addStep(
      3,
      `Element at index ${sortedIdx} (${workingElements[sortedIdx].value}) is now sorted`,
      `Pass Invariant: Pass ${i + 1} completed. The largest unsorted value (${workingElements[sortedIdx].value}) has bubbled up to its final sorted position at index ${sortedIdx}.`,
      { i, sortedIdx, sortedValue: workingElements[sortedIdx].value }
    );
  }

  // Mark first element as sorted as well
  workingElements[0].state = 'sorted';
  for (let k = 0; k < n; k++) {
    workingElements[k].state = 'sorted';
  }

  addStep(
    7,
    'Bubble Sort complete',
    'All passes complete. Every element is finalized in sorted ascending order.',
    { n }
  );

  return steps;
};

export const bubbleSort: AlgorithmDefinition<number[]> = {
  id: 'bubble-sort',
  title: 'Bubble Sort',
  category: 'arrays_and_hashing',
  difficulty: 'Easy',
  description:
    'Bubble Sort is a simple comparison-based sorting algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order until the entire array is sorted.',
  constraints: ['1 <= arr.length <= 10^3', '-10^4 <= arr[i] <= 10^4'],
  examples: [
    {
      input: 'arr = [5, 2, 8, 1, 4]',
      output: '[1, 2, 4, 5, 8]',
      explanation: 'Repeatedly swaps adjacent inverted pairs until array is completely sorted in ascending order.',
    },
    {
      input: 'arr = [3, 2, 1]',
      output: '[1, 2, 3]',
      explanation: 'Reverse sorted array requires maximum swaps across all passes.',
    },
  ],
  code: BUBBLE_SORT_CODE,
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
  },
  spaceComplexity: 'O(1)',
  defaultInput: [5, 2, 8, 1, 4],
  generateSteps: generateBubbleSortSteps,
};
