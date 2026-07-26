import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';
import type { TriviaMeta } from '../../types/trivia';

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

const QUICK_SORT_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: 'Declares the recursive sort: given a slice bounded by low and high, quick_sort leaves it fully ordered in place.',
    2: 'Guards the recursion: a slice with fewer than two elements (low >= high) is already sorted, so there is nothing left to do.',
    3: "Partitions the slice around a pivot and captures the index where that pivot ends up — everything left of it is at most the pivot, everything right is greater.",
    4: "Recursively sorts the left slice, from low up to just before the pivot's final position.",
    5: "Recursively sorts the right slice, from just after the pivot's final position up to high.",
    7: "Declares the helper that rearranges one slice around a pivot and returns the pivot's final resting index.",
    8: 'Chooses the last element of the slice as the pivot, the yardstick every other value in the slice will be judged against.',
    9: 'Initializes i one step before low, marking that the "small values" zone is currently empty.',
    10: 'Scans j across the slice from low up to (but not including) high, so the pivot itself is never re-examined during the scan.',
    11: 'Tests whether the current element belongs in the small-or-equal-to-pivot zone.',
    12: 'Advances i, opening the next seat in the small-values zone to receive arr[j].',
    13: 'Swaps arr[i] and arr[j], moving the qualifying value into the small zone and evicting whatever was there into the scanned-large region.',
    14: 'After the scan, swaps the pivot at arr[high] into position i + 1, placing it exactly on the boundary between the two regions it just created.',
    15: "Returns i + 1, the pivot's final sorted index, so the caller knows where to split the two recursive halves.",
  },
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
  topicGuide: {
    overview:
      'Quick Sort is divide-and-conquer applied to sorting, and it is the algorithm most general-purpose library sorts are built on. The whole method rests on partitioning: choose one element as a pivot, rearrange the slice so everything smaller sits left of it and everything larger sits right, and that pivot is now in its final position forever. Two independent smaller problems remain, and recursion finishes them. It is worth studying closely because it is simultaneously the fastest common in-memory sort in practice and the one with the most instructive failure mode.',
    sections: [
      {
        heading: 'The core idea: place one element, split the rest',
        body: 'Most sorts move elements gradually toward their destinations, but Quick Sort commits one element permanently per partition and then never touches it again. The insight is that you do not need to know where any other element belongs in order to place the pivot correctly: you only need to know how many values are smaller than it. Partitioning discovers that count as a side effect of rearranging, so the pivot lands at the boundary between the two groups, which is exactly its sorted index. Because the left and right groups can never need to exchange elements with each other, they become fully independent subproblems, and that independence is what makes the recursion clean.',
      },
      {
        heading: 'How Lomuto partitioning actually moves elements',
        body: 'This implementation takes the last element of the slice as the pivot and uses two indices, which is why the problem is grouped with the two-pointer family. The scanning index j walks from low to high minus one, while i marks the end of the region already known to hold values less than or equal to the pivot. Whenever arr[j] is at most the pivot, i advances by one and arr[i] swaps with arr[j], which pushes that small value into the small region and evicts a large value into the scanned-large region. After the scan, one final swap exchanges arr[i + 1] with the pivot at arr[high], seating the pivot right between the two groups, and that index is returned so the caller can recurse on low through pivot minus 1 and pivot plus 1 through high.',
      },
      {
        heading: 'Why it is correct: the three-region invariant',
        body: 'At every point during the scan, the slice is divided into four labelled stretches: elements from low through i are at most the pivot, elements from i + 1 through j minus 1 are greater than the pivot, elements from j through high minus 1 are unexamined, and arr[high] is the pivot itself. Each iteration preserves this by either extending the greater-than region when arr[j] is large, or by swapping the small value forward so both the at-most and greater-than regions stay contiguous. When the scan ends the unexamined region is empty, so placing the pivot at i + 1 gives it exactly the number of smaller elements to its left that belong there. The recursion is then correct by induction, since each recursive call sorts a strictly shorter slice and slices of length zero or one are trivially sorted.',
      },
      {
        heading: 'When to reach for it versus merge sort or heap sort',
        body: 'Quick Sort is the right default for sorting a large array in memory when you do not need stability, because it sorts in place and its sequential partition scans are extremely friendly to CPU caches. Choose merge sort instead when you need guaranteed worst-case performance, stable ordering of equal keys, or when data lives in linked nodes or on external storage where sequential merging shines. Choose heap sort when you need in-place sorting with a hard worst-case guarantee and can accept its poorer locality. Real library implementations hedge by combining approaches, switching to insertion sort on small slices and bailing out to heap sort if the recursion depth suggests a pathological pivot pattern.',
      },
      {
        heading: 'Pitfalls and edge cases',
        body: 'The famous trap is pivot choice: taking a fixed end element means an already-sorted or reverse-sorted array produces one empty side at every level, which is the quadratic worst case and can also overflow the call stack. Randomising the pivot or using the median of the first, middle, and last elements makes that behaviour vanishingly unlikely for real inputs. Arrays with many duplicate values are the other weak spot, because Lomuto sends all equal elements to the same side and the splits become lopsided, which is what three-way partitioning is designed to fix. Watch the base condition too: the recursion must guard on low being strictly less than high, and pivot minus 1 can legitimately be less than low, so your bounds must tolerate empty slices rather than assume non-empty ones. Note also that this partition scheme is not stable, since long-range swaps freely reorder equal keys.',
      },
      {
        heading: 'How partitioning generalises beyond sorting',
        body: 'Keep only the recursive call that contains the index you care about and Quick Sort becomes Quickselect, which finds the k-th smallest element in linear expected time without sorting anything else. That is how median-finding and top-k selection are usually implemented, and it is the clearest demonstration that partitioning is the valuable primitive here rather than the sorting wrapper. Three-way partitioning, the Dutch national flag arrangement, splits into less-than, equal, and greater-than regions and turns arrays with heavy duplication from a weakness into a strength. The same rearrange-around-a-predicate move shows up all over array work, from moving zeroes to the end to grouping by parity, so once you can write a partition loop confidently you have a tool that reaches well past sorting.',
      },
    ],
    keyTerms: [
      {
        term: 'Pivot',
        definition:
          'The element a partition organises the slice around. Once partitioning finishes, the pivot occupies its correct final sorted position and is never moved again.',
      },
      {
        term: 'Partition',
        definition:
          'The rearrangement step that pushes values at most the pivot to the left and values greater than the pivot to the right. It returns the index where the pivot came to rest.',
      },
      {
        term: 'Divide and conquer',
        definition:
          'Solving a problem by splitting it into independent smaller instances, solving those recursively, and combining the results. Quick Sort does all its real work in the divide step, so the combine step is empty.',
      },
      {
        term: 'Recursion depth',
        definition:
          'How many nested calls are live at once, which is the height of the partition tree. Balanced splits keep it logarithmic, while consistently lopsided splits let it grow to the array length.',
      },
      {
        term: 'Quickselect',
        definition:
          'The single-branch variant that recurses only into the side containing a target rank. It finds order statistics such as the median without fully sorting the array.',
      },
    ],
  },
  trivia: QUICK_SORT_TRIVIA,
  defaultInput: [6, 2, 9, 3, 7, 1, 5],
  generateSteps: generateQuickSortSteps,
};
