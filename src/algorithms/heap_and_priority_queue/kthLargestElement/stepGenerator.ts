import type {
  AlgorithmStep,
  ArrayElement,
  ElementState,
  PrimaryVisualSnapshot,
} from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

export interface KthLargestInput {
  nums: number[];
  k: number;
}

export const DEFAULT_KTH_LARGEST_INPUT: KthLargestInput = {
  nums: [3, 2, 1, 5, 6, 4],
  k: 2,
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Kth Largest Element problem finds the k-th largest value in an unsorted array of N numbers in O(N log k) time and O(k) memory using a bounded min-heap.",
    primarySnapshot: {
      kind: "array",
      name: "Input Array",
      mode: "box",
      elements: [
        { id: "i0", value: 3, label: "[0]", state: "default" },
        { id: "i1", value: 2, label: "[1]", state: "default" },
        { id: "i2", value: 1, label: "[2]", state: "default" },
        { id: "i3", value: 5, label: "[3]", state: "default" },
        { id: "i4", value: 6, label: "[4]", state: "default" },
        { id: "i5", value: 4, label: "[5]", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Selection vs Full Sorting: sorting all N numbers costs O(N log N) time and extra space. By maintaining a min-heap capped at capacity k, runtime drops to O(N log k).",
    primarySnapshot: {
      kind: "array",
      name: "Min-Heap (k=2)",
      mode: "box",
      elements: [
        { id: "h0", value: 5, label: "root (min)", state: "pivot" },
        { id: "h1", value: 6, label: "max", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Bounded Min-Heap Invariant: a min-heap of capacity k holds the k largest numbers seen so far, placing the smallest of those k candidates at the root.",
    primarySnapshot: {
      kind: "array",
      name: "Min-Heap",
      mode: "box",
      elements: [
        { id: "h0", value: 3, label: "root", state: "pivot", pointers: ["k-th candidate"] },
        { id: "h1", value: 5, label: "node", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Insertion Step (heappush): push each array element into the min-heap, allowing it to sift into place in O(log k) time.",
    primarySnapshot: {
      kind: "array",
      name: "Min-Heap",
      mode: "box",
      elements: [
        { id: "h0", value: 2, label: "root", state: "pivot" },
        { id: "h1", value: 3, label: "node", state: "default" },
        { id: "h2", value: 5, label: "pushed", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Capacity Check (len(heap) > k): when pushing an element increases heap size to k + 1, the root element is guaranteed to be smaller than the true top k.",
    primarySnapshot: {
      kind: "array",
      name: "Min-Heap Overflow",
      mode: "box",
      elements: [
        { id: "h0", value: 1, label: "evict root", state: "swap" },
        { id: "h1", value: 3, label: "node", state: "default" },
        { id: "h2", value: 5, label: "node", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Eviction Step (heappop): evict the root element via heappop to shrink the heap size back to k in O(log k) time.",
    primarySnapshot: {
      kind: "array",
      name: "Min-Heap (size k)",
      mode: "box",
      elements: [
        { id: "h0", value: 5, label: "new root", state: "pivot" },
        { id: "h1", value: 6, label: "node", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Traversal Completion: after processing all N elements, the min-heap contains exactly the k largest values from the original array.",
    primarySnapshot: {
      kind: "array",
      name: "Top K Candidates",
      mode: "box",
      elements: [
        { id: "h0", value: 5, label: "root", state: "pivot" },
        { id: "h1", value: 6, label: "node", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Result Extraction: the root of the min-heap (the minimum of the k largest elements) is returned as the exact k-th largest value in O(1) time.",
    primarySnapshot: {
      kind: "array",
      name: "Result Kth Largest",
      mode: "box",
      elements: [
        { id: "h0", value: 5, label: "k-th largest = 5", state: "sorted", pointers: ["RESULT"] },
        { id: "h1", value: 6, label: "larger", state: "default" },
      ],
    },
  },
];

export function generateKthLargestSteps(input: KthLargestInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawNums = Array.isArray(input?.nums)
    ? input.nums
    : input?.nums === undefined
      ? []
      : DEFAULT_KTH_LARGEST_INPUT.nums;
  const targetK = typeof input?.k === "number" ? input.k : DEFAULT_KTH_LARGEST_INPUT.k;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (input.k === DEFAULT_KTH_LARGEST_INPUT.k &&
      Array.isArray(input.nums) &&
      input.nums.length === DEFAULT_KTH_LARGEST_INPUT.nums.length &&
      input.nums.every((val, idx) => val === DEFAULT_KTH_LARGEST_INPUT.nums[idx]));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  if (!Array.isArray(rawNums) || rawNums.length === 0) {
    addStep("The input array is empty, so no k-th largest element exists; returning -1.", {
      kind: "array",
      name: "Min-Heap",
      mode: "box",
      elements: [],
    });
    return steps;
  }

  const nums = rawNums;
  const k = Math.max(1, Math.min(targetK, nums.length));
  const minHeap: number[] = [];

  const siftUp = (heap: number[]) => {
    let curr = heap.length - 1;
    while (curr > 0) {
      const parent = Math.floor((curr - 1) / 2);
      if (heap[curr] < heap[parent]) {
        const temp = heap[curr];
        heap[curr] = heap[parent];
        heap[parent] = temp;
        curr = parent;
      } else {
        break;
      }
    }
  };

  const siftDown = (heap: number[]) => {
    let curr = 0;
    const len = heap.length;
    while (curr * 2 + 1 < len) {
      let smallest = curr * 2 + 1;
      const right = curr * 2 + 2;
      if (right < len && heap[right] < heap[smallest]) {
        smallest = right;
      }
      if (heap[smallest] < heap[curr]) {
        const temp = heap[curr];
        heap[curr] = heap[smallest];
        heap[smallest] = temp;
        curr = smallest;
      } else {
        break;
      }
    }
  };

  const makeSnapshot = (
    activeVal?: number,
    activeIdx?: number,
    stateOverride?: ElementState,
    isComplete?: boolean,
  ): PrimaryVisualSnapshot => {
    const elements: ArrayElement[] = minHeap.map((val, idx) => {
      let state: ElementState = "default";
      const ptrs: string[] = [];

      if (idx === 0) {
        state = isComplete ? "sorted" : "pivot";
        ptrs.push("min-root");
      }

      if (idx === activeIdx) {
        state = stateOverride ?? "active";
        ptrs.push(`pushed:${val}`);
      }

      return {
        id: `h-${idx}-${val}`,
        value: val,
        label: `[${idx}]`,
        state,
        pointers: ptrs.length > 0 ? ptrs : undefined,
      };
    });

    if (elements.length === 0 && activeVal !== undefined) {
      elements.push({
        id: `inspecting-${activeVal}`,
        value: activeVal,
        label: "inspecting",
        state: stateOverride ?? "compare",
      });
    }

    return {
      kind: "array",
      name: `Min-Heap (capacity k=${k})`,
      mode: "box",
      elements,
    };
  };

  addStep(
    `Having established the mental model, let's now transition to input array [${nums.join(", ")}] searching for k=${k} largest element using a bounded min-heap.`,
    makeSnapshot(undefined, undefined, undefined),
  );

  for (let i = 0; i < nums.length; i++) {
    const num = nums[i];

    addStep(
      `Inspect element nums[${i}] = ${num}: prepare to insert into min-heap.`,
      makeSnapshot(num, undefined, "compare"),
    );

    minHeap.push(num);
    siftUp(minHeap);
    const pushedIdx = minHeap.indexOf(num);

    addStep(
      `Push ${num} into min-heap (current size ${minHeap.length}): sifted into place at index ${pushedIdx >= 0 ? pushedIdx : 0}.`,
      makeSnapshot(num, pushedIdx >= 0 ? pushedIdx : undefined, "active"),
    );

    if (minHeap.length > k) {
      const minEvicted = minHeap[0];
      addStep(
        `Min-heap size (${minHeap.length}) exceeds capacity k=${k}: root element ${minEvicted} is the smallest of top ${minHeap.length} candidates and must be evicted.`,
        makeSnapshot(minEvicted, 0, "swap"),
      );

      const last = minHeap.pop()!;
      if (minHeap.length > 0) {
        minHeap[0] = last;
        siftDown(minHeap);
      }

      addStep(
        `Evicted root ${minEvicted}: min-heap size restored to k=${k}. New root is ${minHeap[0]}, maintaining top ${k} largest values.`,
        makeSnapshot(undefined, 0, "pivot"),
      );
    }
  }

  const kthLargestVal = minHeap[0];

  addStep(
    `Kth Largest Element complete! Processed all ${nums.length} numbers. Min-heap root contains ${kthLargestVal}, which is the ${k}-th largest element in the array.`,
    makeSnapshot(kthLargestVal, 0, "sorted", true),
  );

  return steps;
}

export default generateKthLargestSteps;
