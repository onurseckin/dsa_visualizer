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
    `We'll sweep across these ${n} values again and again, nudging out-of-order neighbours apart. Each sweep floats the biggest remaining value to the right end, like a bubble rising.`,
    { n }
  );

  if (n <= 1) {
    if (n === 1) {
      workingElements[0].state = 'sorted';
    }
    addStep(
      7,
      'Bubble Sort complete',
      'An array this small has nothing out of order, so we are done before we start.',
      { n }
    );
    return steps;
  }

  addStep(
    2,
    `Note the length n = ${n}`,
    `Knowing there are ${n} elements tells us at most ${n - 1} passes will be needed — after that many sweeps, every value has had the chance to settle into place.`,
    { n }
  );

  for (let i = 0; i < n - 1; i++) {
    addStep(
      3,
      `Begin pass ${i + 1} of ${n - 1}`,
      `We compare neighbours from index 0 up to ${n - 2 - i}; everything past that is already settled. By the end of this pass, the largest remaining value will have risen to index ${n - 1 - i}.`,
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
        `Compare ${valJ} with ${valJNext}`,
        valJ > valJNext
          ? `${valJ} is bigger than its neighbour ${valJNext}, so this pair is out of order — the larger value belongs further right, and a swap will move it there.`
          : `${valJ} is not bigger than ${valJNext}, so this pair already sits in the right order and we simply slide on to the next one.`,
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
          `Swap ${valJ} and ${valJNext}`,
          `With the pair flipped, ${valJ} moves one seat closer to the right end, continuing its rise toward where it finally belongs.`,
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
      `Lock in index ${sortedIdx}`,
      `Pass ${i + 1} is done, and ${workingElements[sortedIdx].value} has bubbled all the way to index ${sortedIdx}. Nothing bigger remains to its left, so it never has to move again.`,
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
    'Every pass has run and every value has settled where it belongs — the array now reads in ascending order from left to right.',
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
    'Bubble Sort is a simple comparison-based sorting algorithm: it sweeps through the array repeatedly, swapping adjacent neighbours that are out of order, so each sweep floats the largest remaining value to the end.',
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
  complexityAnalysis: {
    time: 'Each pass walks the unsorted portion comparing neighbours, and each pass shrinks that portion by one, so in the worst case we make roughly n + (n-1) + … + 1 comparisons — about n²/2, which is O(n²). A reverse-sorted array pays that price in full; with the common early-exit check, an already-sorted array finishes after one swap-free pass, giving the O(n) best case.',
    space: 'Sorting happens in place by swapping adjacent elements, so we only ever hold a temporary value during a swap plus two loop counters — constant extra memory, O(1).',
  },
  defaultInput: [5, 2, 8, 1, 4],
  generateSteps: generateBubbleSortSteps,
};
