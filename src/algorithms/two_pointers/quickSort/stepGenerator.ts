import type {
  AlgorithmStep,
  ArrayElement,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

export const DEFAULT_QUICK_SORT_INPUT: number[] = [6, 2, 9, 3, 7, 1, 5];

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Quick Sort is an efficient divide-and-conquer sorting algorithm that selects a pivot element, partitions smaller elements to its left and larger elements to its right, and recursively sorts each half in-place.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 6, label: "[0]", state: "default" },
        { id: "c2", value: 2, label: "[1]", state: "default" },
        { id: "c3", value: 9, label: "[2]", state: "default" },
        { id: "c4", value: 3, label: "[3]", state: "default" },
        { id: "c5", value: 7, label: "[4]", state: "default" },
        { id: "c6", value: 1, label: "[5]", state: "default" },
        { id: "c7", value: 5, label: "[6]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "In Lomuto partitioning, we pick the rightmost element of the current sub-array (arr[high]) as the pivot around which all other elements will be compared.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 6, label: "[0]", state: "default" },
        { id: "c2", value: 2, label: "[1]", state: "default" },
        { id: "c3", value: 9, label: "[2]", state: "default" },
        { id: "c4", value: 3, label: "[3]", state: "default" },
        { id: "c5", value: 7, label: "[4]", state: "default" },
        { id: "c6", value: 1, label: "[5]", state: "default" },
        { id: "c7", value: 5, label: "[6]", state: "pivot", pointers: ["pivot"] },
      ],
    },
  },
  {
    narrative:
      "Lomuto partitioning maintains three regions during the scan: elements ≤ pivot on the left, elements > pivot in the middle, and unexamined elements on the right.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 2, label: "[0]", state: "active", pointers: ["≤ pivot"] },
        { id: "c2", value: 3, label: "[1]", state: "active", pointers: ["i"] },
        { id: "c3", value: 6, label: "[2]", state: "compare", pointers: ["> pivot"] },
        { id: "c4", value: 9, label: "[3]", state: "compare" },
        { id: "c5", value: 7, label: "[4]", state: "default", pointers: ["j"] },
        { id: "c6", value: 1, label: "[5]", state: "default" },
        { id: "c7", value: 5, label: "[6]", state: "pivot", pointers: ["pivot"] },
      ],
    },
  },
  {
    narrative:
      "Pointer i marks the boundary of elements ≤ pivot (starting at low - 1), while scanner j walks from low to high - 1 checking each element against the pivot.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 2, label: "[0]", state: "active", pointers: ["i"] },
        { id: "c2", value: 9, label: "[1]", state: "default" },
        { id: "c3", value: 3, label: "[2]", state: "compare", pointers: ["j"] },
        { id: "c4", value: 7, label: "[3]", state: "default" },
        { id: "c5", value: 1, label: "[4]", state: "default" },
        { id: "c6", value: 6, label: "[5]", state: "default" },
        { id: "c7", value: 5, label: "[6]", state: "pivot", pointers: ["pivot"] },
      ],
    },
  },
  {
    narrative:
      "Whenever arr[j] ≤ pivot, boundary pointer i advances by 1 and arr[i] swaps with arr[j], expanding the left ≤ pivot partition by one element.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 2, label: "[0]", state: "active" },
        { id: "c2", value: 3, label: "[1]", state: "swap", pointers: ["i"] },
        { id: "c3", value: 9, label: "[2]", state: "swap", pointers: ["j"] },
        { id: "c4", value: 7, label: "[3]", state: "default" },
        { id: "c5", value: 1, label: "[4]", state: "default" },
        { id: "c6", value: 6, label: "[5]", state: "default" },
        { id: "c7", value: 5, label: "[6]", state: "pivot", pointers: ["pivot"] },
      ],
    },
  },
  {
    narrative:
      "Once the scan finishes, swapping arr[i + 1] with arr[high] places the pivot into its permanent, final sorted index pivot_idx = i + 1 between the two partitions.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 2, label: "[0]", state: "active" },
        { id: "c2", value: 3, label: "[1]", state: "active" },
        { id: "c3", value: 1, label: "[2]", state: "active" },
        { id: "c4", value: 5, label: "[3]", state: "sorted", pointers: ["pivot_idx"] },
        { id: "c5", value: 7, label: "[4]", state: "compare" },
        { id: "c6", value: 6, label: "[5]", state: "compare" },
        { id: "c7", value: 9, label: "[6]", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Quick Sort then recursively applies partitioning to the left sub-array [low ... pivot_idx - 1] and right sub-array [pivot_idx + 1 ... high] until sub-array lengths are ≤ 1.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 2, label: "[0]", state: "active", pointers: ["left sub-array"] },
        { id: "c2", value: 3, label: "[1]", state: "active" },
        { id: "c3", value: 1, label: "[2]", state: "active" },
        { id: "c4", value: 5, label: "[3]", state: "sorted", pointers: ["pivot"] },
        { id: "c5", value: 7, label: "[4]", state: "compare", pointers: ["right sub-array"] },
        { id: "c6", value: 6, label: "[5]", state: "compare" },
        { id: "c7", value: 9, label: "[6]", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Because sorting operates entirely in-place with sequential cache-friendly access, Quick Sort delivers O(N log N) average runtime using only O(log N) stack space.",
    primarySnapshot: {
      kind: "array",
      name: "arr",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "[0]", state: "sorted" },
        { id: "c2", value: 2, label: "[1]", state: "sorted" },
        { id: "c3", value: 3, label: "[2]", state: "sorted" },
        { id: "c4", value: 5, label: "[3]", state: "sorted" },
        { id: "c5", value: 6, label: "[4]", state: "sorted" },
        { id: "c6", value: 7, label: "[5]", state: "sorted" },
        { id: "c7", value: 9, label: "[6]", state: "sorted" },
      ],
    },
  },
];

export const generateQuickSortSteps = (input: number[]): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawInput =
    Array.isArray(input) && input.length > 0 ? input : DEFAULT_QUICK_SORT_INPUT;
  const arr = [...rawInput];
  const n = arr.length;
  const sortedSet = new Set<number>();

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (Array.isArray(input) &&
      input.length === DEFAULT_QUICK_SORT_INPUT.length &&
      input.every((val, idx) => val === DEFAULT_QUICK_SORT_INPUT[idx]));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const makeSnapshot = (
    low?: number,
    high?: number,
    pivotIdx?: number,
    iIdx?: number,
    jIdx?: number,
    isSwapping?: boolean,
  ): PrimaryVisualSnapshot => {
    const elements: ArrayElement[] = arr.map((val, idx) => {
      const ptrs: string[] = [];
      if (idx === pivotIdx) ptrs.push("pivot");
      if (idx === iIdx && iIdx >= 0) ptrs.push("i");
      if (idx === jIdx) ptrs.push("j");

      let state: ArrayElement["state"] = "default";
      if (sortedSet.has(idx)) {
        state = "sorted";
      } else if (idx === pivotIdx) {
        state = "pivot";
      } else if (isSwapping && (idx === iIdx || idx === jIdx)) {
        state = "swap";
      } else if (idx === jIdx) {
        state = "compare";
      } else if (iIdx !== undefined && iIdx >= 0 && low !== undefined && idx >= low && idx <= iIdx) {
        state = "active";
      } else if (low !== undefined && high !== undefined && idx >= low && idx <= high) {
        state = "compare";
      }

      return {
        id: `el-${idx}`,
        value: val,
        label: `[${idx}]`,
        state,
        pointers: ptrs.length > 0 ? ptrs : undefined,
      };
    });

    return {
      kind: "array",
      name: "arr",
      mode: "box",
      elements,
    };
  };

  if (n <= 1) {
    if (n === 1) sortedSet.add(0);
    addStep(
      `The input array has ${n} element${n === 1 ? "" : "s"}, which is trivially sorted; returning immediately.`,
      makeSnapshot(0, Math.max(0, n - 1)),
    );
    return steps;
  }

  addStep(
    `Having established the mental model, let's now transition to our selected input array of ${n} elements: [${arr.join(", ")}].`,
    makeSnapshot(0, n - 1),
  );

  const partition = (low: number, high: number): number => {
    const pivotVal = arr[high];
    let i = low - 1;

    addStep(
      `Partition sub-array [${low} ... ${high}]: select rightmost element arr[${high}] = ${pivotVal} as pivot and set boundary pointer i = ${i}.`,
      makeSnapshot(low, high, high, i, undefined, false),
    );

    for (let j = low; j < high; j++) {
      const valJ = arr[j];
      if (valJ <= pivotVal) {
        i += 1;
        addStep(
          `Inspect arr[${j}] = ${valJ}: because ${valJ} ≤ pivot (${pivotVal}), advance i to ${i} and swap arr[${i}] (${arr[i]}) with arr[${j}] (${valJ}).`,
          makeSnapshot(low, high, high, i, j, false),
        );

        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;

        addStep(
          `Swapped arr[${i}] and arr[${j}]: element ${arr[i]} is now banked into the ≤ pivot partition on the left.`,
          makeSnapshot(low, high, high, i, j, true),
        );
      } else {
        addStep(
          `Inspect arr[${j}] = ${valJ}: because ${valJ} > pivot (${pivotVal}), element remains in the > pivot partition; advance j.`,
          makeSnapshot(low, high, high, i, j, false),
        );
      }
    }

    const pivotRestingIdx = i + 1;
    addStep(
      `Partition scan complete! Swap pivot arr[${high}] (${pivotVal}) with arr[${pivotRestingIdx}] (${arr[pivotRestingIdx]}) to place pivot into its resting index ${pivotRestingIdx}.`,
      makeSnapshot(low, high, high, pivotRestingIdx, high, true),
    );

    const temp = arr[pivotRestingIdx];
    arr[pivotRestingIdx] = arr[high];
    arr[high] = temp;

    sortedSet.add(pivotRestingIdx);

    addStep(
      `Pivot element ${pivotVal} is now locked into its final sorted position at index ${pivotRestingIdx}! Left partition [${low} ... ${pivotRestingIdx - 1}] and right partition [${pivotRestingIdx + 1} ... ${high}] will be sorted recursively.`,
      makeSnapshot(low, high, pivotRestingIdx, undefined, undefined, false),
    );

    return pivotRestingIdx;
  };

  const quickSortHelper = (low: number, high: number) => {
    if (low < high) {
      const pIdx = partition(low, high);
      quickSortHelper(low, pIdx - 1);
      quickSortHelper(pIdx + 1, high);
    } else if (low === high) {
      sortedSet.add(low);
      addStep(
        `Sub-array slice [${low} ... ${high}] has length 1; element ${arr[low]} at index ${low} is trivially sorted.`,
        makeSnapshot(low, high, low, undefined, undefined, false),
      );
    }
  };

  quickSortHelper(0, n - 1);

  for (let k = 0; k < n; k++) {
    sortedSet.add(k);
  }

  addStep(
    `Quick Sort complete! All partitions have been recursively processed and all ${n} elements are locked in non-decreasing order: [${arr.join(", ")}].`,
    makeSnapshot(0, n - 1),
  );

  return steps;
};

export default generateQuickSortSteps;
