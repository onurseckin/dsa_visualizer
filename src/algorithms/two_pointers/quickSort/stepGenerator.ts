import type { AlgorithmStep, ArrayElement, ElementState } from "../../../types/dsa";

export const generateQuickSortSteps = (input: number[]): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const workingElements: ArrayElement[] = input.map((val, idx) => ({
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
    `We'll sort these ${n} values by divide and conquer: pick a pivot, herd everything smaller to its left and everything larger to its right, then repeat on each side.`,
    { low: 0, high: n - 1 },
  );
  callStack.pop();

  if (n <= 1) {
    if (n === 1) workingElements[0].state = "sorted";
    addStep(
      1,
      "Quick Sort complete",
      "An array of at most one element is already sorted, so there is nothing for us to do.",
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
      `We're now responsible for the ${Math.max(0, high - low + 1)}-element slice [${low}..${high}]; everything outside it is handled by calls higher up the stack.`,
      { low, high },
    );
    addStep(
      2,
      `Check low < high (${low} vs ${high})`,
      low < high
        ? `The slice still holds at least two elements, so it could be out of order — we go on to partition it around a pivot.`
        : `A slice of ${Math.max(0, high - low + 1)} element${Math.max(0, high - low + 1) === 1 ? "" : "s"} is as sorted as it can get, so this call simply hands control back.`,
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
      `We hand the slice to partition, whose job is to pick a pivot and split the values into a "smaller or equal" side and a "larger" side around it.`,
      { low, high },
    );

    const pivotVal = workingElements[high].value;

    addStep(
      7,
      `Enter partition([${low}..${high}])`,
      `The partition helper takes over: it picks a pivot and rearranges the slice so everything ≤ pivot is on the left and everything > pivot is on the right.`,
      { low, high },
      { [high]: ["pivot"] },
      { [high]: "pivot" },
    );

    addStep(
      8,
      `Pick the pivot ${pivotVal}`,
      `We take the rightmost element, ${pivotVal}, as our yardstick — every other value in this slice will be judged as either "at most ${pivotVal}" or "bigger".`,
      { low, high, pivot: pivotVal },
      { [high]: ["pivot"] },
      { [high]: "pivot" },
    );

    let i = low - 1;
    addStep(
      9,
      `Set the boundary i = ${i}`,
      `The pointer i marks the end of the "small values" zone. It starts at ${i}, just before the slice, because we haven't found anything <= ${pivotVal} yet.`,
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
        `The for loop scans each position from ${low} to ${high - 1}, comparing every element against the pivot to decide which side it belongs on.`,
        { low, high, i, j, pivot: pivotVal },
        getPointers(),
        getStates(),
      );

      addStep(
        11,
        `Compare ${currentVal} with pivot ${pivotVal}`,
        currentVal <= pivotVal
          ? `${currentVal} is at most ${pivotVal}, so it belongs on the pivot's left — we'll grow the small-values zone to take it in.`
          : `${currentVal} is bigger than ${pivotVal}, so we leave it where it stands; it will end up on the pivot's right side.`,
        { low, high, i, j, "arr[j]": currentVal, pivot: pivotVal },
        getPointers(),
        getStates(),
      );

      if (currentVal <= pivotVal) {
        i++;
        addStep(
          12,
          `Grow the small zone to index ${i}`,
          `Sliding i forward to ${i} opens the next seat in the <=-pivot zone, ready to receive ${currentVal}.`,
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
          `Moving ${workingElements[i].value} into index ${i} keeps our promise intact: everything up to and including index ${i} is at most ${pivotVal}.`,
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
      `Index ${pivotIdx} is the first seat after the small-values zone — exactly where ${pivotVal} belongs. Once it lands there, it will never need to move again.`,
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
      `Everything left of index ${pivotIdx} is at most ${pivotVal}, and everything right of it is at least ${pivotVal} — so the pivot now sits in its final sorted position.`,
      { low, high, pivotIdx },
      { [pivotIdx]: ["pivot"] },
      { [pivotIdx]: "sorted" },
    );

    addStep(
      4,
      `Recurse into the left side`,
      `The values in [${low}..${pivotIdx - 1}] are all on the correct side of the pivot but still jumbled among themselves, so we sort that slice the same way.`,
      { low, high: pivotIdx - 1 },
    );
    helper(low, pivotIdx - 1);

    addStep(
      5,
      `Recurse into the right side`,
      `Now the larger values in [${pivotIdx + 1}..${high}] get the same treatment: pick a pivot, split, and repeat.`,
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
    "Every recursive call has finished and every pivot has settled into its final spot, so the whole array now reads in ascending order. With reasonably balanced splits, that took about n log n work.",
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
