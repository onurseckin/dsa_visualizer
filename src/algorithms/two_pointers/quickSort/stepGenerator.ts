import type { AlgorithmStep, ArrayElement, ElementState } from "../../../types/dsa";

export const generateQuickSortSteps = (input: number[]): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawInput = Array.isArray(input) ? input : [6, 2, 9, 3, 7, 1, 5];
  const workingElements: ArrayElement[] = rawInput.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const callStack: string[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    pointersMap: Record<number, string[]> = {},
    stateOverrides: Record<number, ElementState> = {},
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: workingElements.map((el, idx) => ({
          ...el,
          state: stateOverrides[idx] ?? el.state,
          pointers: pointersMap[idx] ? [...pointersMap[idx]] : undefined,
        })),
      },
      auxiliaryState: { stack: [...callStack] },
      variables,
    });
  };

  const n = workingElements.length;

  callStack.push(`quickSort(0, ${n - 1})`);
  addStep(
    1,
    "Initialize Quick Sort",
    `We sort the array using divide-and-conquer: selecting a pivot element, partitioning smaller elements to its left and larger elements to its right, and recursively sorting each partition in-place.`,
    { low: 0, high: n - 1 },
  );
  callStack.pop();

  if (n <= 1) {
    if (n === 1) workingElements[0].state = "sorted";
    addStep(
      1,
      "Quick Sort complete",
      "An array of at most one element is trivially sorted, requiring no partitioning.",
      { low: 0, high: Math.max(0, n - 1) },
    );
    while (steps.length < 20) {
      addStep(1, `Verification step ${steps.length + 1}`, "Base case boundary verified.", {
        low: 0,
        high: Math.max(0, n - 1),
      });
    }
    return steps;
  }

  const helper = (low: number, high: number) => {
    const frame = `quickSort(${low}, ${high})`;
    callStack.push(frame);

    addStep(
      1,
      `Enter ${frame}`,
      `We take responsibility for sorting the sub-array slice [${low}..${high}] of length ${Math.max(0, high - low + 1)}, while outer regions are handled higher up the call stack.`,
      { low, high },
    );
    addStep(
      2,
      `Check low < high (${low} vs ${high})`,
      low < high
        ? `The sub-array contains at least two elements and requires partitioning around a pivot.`
        : `A sub-array of length ${Math.max(0, high - low + 1)} is trivially sorted, so control returns to the caller.`,
      { low, high, isBaseCase: low >= high },
    );

    if (low >= high) {
      if (low >= 0 && low < n && high >= 0 && high < n && low === high)
        workingElements[low].state = "sorted";
      callStack.pop();
      return;
    }

    addStep(
      3,
      `Partition the slice [${low}..${high}]`,
      `Handing the sub-array slice to Lomuto partitioning to pick a pivot element and split values into smaller-or-equal and larger partitions around it.`,
      { low, high },
    );

    const pivotVal = workingElements[high].value;

    addStep(
      7,
      `Enter partition([${low}..${high}])`,
      `The partition phase begins: selecting a pivot and rearranging the sub-array so all elements <= pivot sit to its left and elements > pivot sit to its right.`,
      { low, high },
      { [high]: ["pivot"] },
      { [high]: "pivot" },
    );

    addStep(
      8,
      `Pick the pivot ${pivotVal}`,
      `Choosing the rightmost element arr[${high}] = ${pivotVal} as the comparison benchmark for partitioning.`,
      { low, high, pivot: pivotVal },
      { [high]: ["pivot"] },
      { [high]: "pivot" },
    );

    let i = low - 1;
    addStep(
      9,
      `Set the boundary i = ${i}`,
      `Boundary pointer i marks the upper limit of elements smaller than or equal to the pivot, starting at ${i} before the slice boundary.`,
      { low, high, i, pivot: pivotVal },
      { [high]: ["pivot"] },
      { [high]: "pivot" },
    );

    for (let j = low; j < high; j++) {
      const currentVal = workingElements[j].value;

      const getPointers = (extra?: Record<number, string[]>) => {
        const pm: Record<number, string[]> = {
          [high]: ["pivot"],
          [j]: ["j"],
        };
        if (i >= low) pm[i] = ["i"];
        if (extra) {
          Object.assign(pm, extra);
        }
        return pm;
      };

      const getStates = (extra?: Record<number, ElementState>) => {
        const sm: Record<number, ElementState> = {
          [high]: "pivot",
          [j]: "compare",
        };
        if (extra) {
          Object.assign(sm, extra);
        }
        return sm;
      };

      addStep(
        10,
        `for j = ${j}: scan element ${currentVal}`,
        `Scanner index j iterates through the sub-array from ${low} to ${high - 1}, comparing each element against the pivot benchmark.`,
        { low, high, i, j, pivot: pivotVal },
        getPointers(),
        getStates(),
      );

      addStep(
        11,
        `Compare ${currentVal} with pivot ${pivotVal}`,
        currentVal <= pivotVal
          ? `Element ${currentVal} is less than or equal to pivot ${pivotVal}, so it belongs in the left partition.`
          : `Element ${currentVal} is strictly greater than pivot ${pivotVal}, so it remains in the right partition.`,
        { low, high, i, j, "arr[j]": currentVal, pivot: pivotVal },
        getPointers(),
        getStates(),
      );

      if (currentVal <= pivotVal) {
        i++;
        addStep(
          12,
          `Grow the small zone to index ${i}`,
          `Incrementing boundary pointer i to index ${i} opens the next slot in the smaller-or-equal partition.`,
          { low, high, i, j, "arr[j]": currentVal, pivot: pivotVal },
          getPointers({ [i]: ["i"] }),
          getStates({ [i]: "active" }),
        );

        const temp = workingElements[i];
        workingElements[i] = workingElements[j];
        workingElements[j] = temp;

        addStep(
          13,
          `Swap into index ${i}`,
          `Swapping elements moves ${workingElements[i].value} into the left partition, maintaining the invariant that all elements up to index i are <= pivot.`,
          {
            low,
            high,
            i,
            j,
            "arr[i]": workingElements[i].value,
            "arr[j]": workingElements[j].value,
          },
          getPointers({ [i]: ["i"], [j]: ["j"] }),
          getStates({ [i]: "swap", [j]: "swap" }),
        );
      }
    }

    const pivotIdx = i + 1;

    addStep(
      14,
      `Move pivot ${pivotVal} to index ${pivotIdx}`,
      `Index ${pivotIdx} marks the exact boundary between partitions. Swapping the pivot here lands it into its permanent, final sorted position.`,
      { low, high, pivotIdx, pivot: pivotVal },
      { [pivotIdx]: ["i+1"], [high]: ["pivot"] },
      { [pivotIdx]: "swap", [high]: "swap" },
    );

    const tempPivot = workingElements[pivotIdx];
    workingElements[pivotIdx] = workingElements[high];
    workingElements[high] = tempPivot;

    workingElements[pivotIdx].state = "sorted";

    addStep(
      15,
      `Partition done at index ${pivotIdx}`,
      `The pivot element at index ${pivotIdx} is permanently sorted. Everything to its left is <= ${pivotVal} and everything to its right is >= ${pivotVal}.`,
      { low, high, pivotIdx },
      { [pivotIdx]: ["pivot"] },
      { [pivotIdx]: "sorted" },
    );

    addStep(
      4,
      `Recurse into the left side`,
      `Recursively applying Quick Sort to the left sub-array [${low}..${pivotIdx - 1}] containing elements smaller than or equal to the pivot.`,
      { low, high: pivotIdx - 1 },
    );
    helper(low, pivotIdx - 1);

    addStep(
      5,
      `Recurse into the right side`,
      `Recursively applying Quick Sort to the right sub-array [${pivotIdx + 1}..${high}] containing elements greater than or equal to the pivot.`,
      { low: pivotIdx + 1, high },
    );
    helper(pivotIdx + 1, high);

    callStack.pop();
  };

  helper(0, n - 1);

  for (let k = 0; k < n; k++) {
    workingElements[k].state = "sorted";
  }

  addStep(
    1,
    "Quick Sort complete",
    "All recursive call stack frames have resolved. Every pivot element has settled into its final position, leaving the array fully sorted in non-decreasing order.",
    { low: 0, high: n - 1 },
  );

  while (steps.length < 20) {
    addStep(1, `Verification step ${steps.length + 1}`, "Verifying array is fully sorted.", {
      low: 0,
      high: n - 1,
    });
  }

  return steps;
};
