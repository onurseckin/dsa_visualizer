import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export const BUBBLE_SORT_CODE = `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`;

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
    `Start sorting an array of ${n} elements.`,
    { n }
  );

  if (n <= 1) {
    if (n === 1) {
      workingElements[0].state = 'sorted';
    }
    addStep(
      10,
      'Bubble Sort complete',
      'Array is already sorted.',
      { n }
    );
    return steps;
  }

  addStep(
    2,
    `Set array length n = ${n}`,
    'Determine the number of elements to process.',
    { n }
  );

  for (let i = 0; i < n - 1; i++) {
    addStep(
      3,
      `Start pass i = ${i}`,
      `Outer loop iteration ${i + 1} of ${n - 1}. Largest remaining element will bubble up to index ${n - 1 - i}.`,
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
          ? `${valJ} > ${valJNext}, so they need to be swapped.`
          : `${valJ} <= ${valJNext}, so they are in correct order.`,
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
          `Swapped values ${valJ} and ${valJNext}.`,
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
      8,
      `Element at index ${sortedIdx} (${workingElements[sortedIdx].value}) is now sorted`,
      `Pass ${i + 1} completed. The largest unsorted element has bubbled to position ${sortedIdx}.`,
      { i, sortedIdx, sortedValue: workingElements[sortedIdx].value }
    );
  }

  // Mark first element as sorted as well
  workingElements[0].state = 'sorted';
  for (let k = 0; k < n; k++) {
    workingElements[k].state = 'sorted';
  }

  addStep(
    10,
    'Bubble Sort complete',
    'All passes complete. The array is fully sorted in ascending order.',
    { n }
  );

  return steps;
};

export const bubbleSort: AlgorithmDefinition<number[]> = {
  id: 'bubble-sort',
  title: 'Bubble Sort',
  category: 'sorting',
  difficulty: 'Easy',
  description:
    'Bubble Sort is a simple comparison-based sorting algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order.',
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
