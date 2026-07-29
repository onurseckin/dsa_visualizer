import type { AlgorithmStep, ArrayElement, ElementState } from "../../../types/dsa";

export interface KthLargestInput {
  nums: number[];
  k: number;
}

export const DEFAULT_KTH_LARGEST_INPUT: KthLargestInput = {
  nums: [3, 2, 1, 5, 6, 4],
  k: 2,
};

function createArrayElements(
  heap: number[],
  activeIdx: number = -1,
  stateOverride: ElementState = "active",
): ArrayElement[] {
  return heap.map((val, idx) => {
    let state: ElementState = "default";
    if (idx === activeIdx) {
      state = stateOverride;
    } else if (idx === 0) {
      state = "pivot";
    }
    const pointers: string[] = [];
    if (idx === 0) pointers.push("min-root");
    if (idx === activeIdx) pointers.push("curr");

    return {
      id: `heap-${idx}-${val}`,
      value: val,
      state,
      pointers,
    };
  });
}

export function generateKthLargestSteps(input: KthLargestInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const rawNums = Array.isArray(input?.nums)
    ? input.nums
    : input?.nums === undefined
      ? []
      : DEFAULT_KTH_LARGEST_INPUT.nums;
  const targetK = typeof input?.k === "number" ? input.k : DEFAULT_KTH_LARGEST_INPUT.k;

  if (!Array.isArray(rawNums) || rawNums.length === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 3,
      explanation: {
        what: "Validate input bounds",
        why: "Input array is empty. Terminating algorithm with default invalid rank result.",
      },
      primarySnapshot: { kind: "array", elements: [] },
      auxiliaryState: { customState: { k: targetK, heapSize: 0 } },
      variables: { k: targetK, result: -1 },
    });
    return steps;
  }

  const nums = rawNums;
  const k = Math.max(1, Math.min(targetK, nums.length));

  let stepIdx = 0;
  const minHeap: number[] = [];

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 1,
    explanation: {
      what: "Initialize Bounded Min-Heap filter",
      why: "A min-heap of capacity k maintains the top k largest values seen so far. Root element corresponds to the minimum of the top k (the current k-th largest candidate).",
    },
    primarySnapshot: { kind: "array", elements: createArrayElements(minHeap) },
    auxiliaryState: { customState: { k, nums: `[${nums.join(", ")}]` } },
    variables: { k },
  });

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 4,
    explanation: {
      what: `Allocate min-heap with target capacity K = ${k}`,
      why: `The min-heap acts as a sliding window of the top ${k} largest numbers. Any element that drops below root is evicted, guaranteeing O(N log k) total runtime.`,
    },
    primarySnapshot: { kind: "array", elements: createArrayElements(minHeap) },
    auxiliaryState: {
      customState: { k, heap: "[]", nums: `[${nums.join(", ")}]` },
    },
    variables: { k, heapSize: 0, processedCount: 0 },
  });

  const siftUp = (heap: number[]): number => {
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
    return curr;
  };

  const siftDown = (heap: number[]): void => {
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

  for (let i = 0; i < nums.length; i++) {
    const num = nums[i];

    // Step for line 5: loop iteration
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 5,
      explanation: {
        what: `Process array element nums[${i}] = ${num}`,
        why: `Evaluating ${num} against candidate top ${k} values currently in min-heap.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createArrayElements(minHeap),
      },
      auxiliaryState: {
        customState: {
          currentNum: num,
          heap: `[${minHeap.join(", ")}]`,
          rootMin: minHeap[0] ?? "none",
        },
      },
      variables: { i, num, heapSize: minHeap.length, k },
    });

    // Step for line 6: push into heap
    minHeap.push(num);
    const activeIdx = siftUp(minHeap);

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 6,
      explanation: {
        what: `Insert ${num} into min-heap`,
        why: `Pushing ${num} and performing sift-up to restore min-heap invariant. Smallest candidate moves to root.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createArrayElements(minHeap, activeIdx, "queued"),
      },
      auxiliaryState: {
        customState: { currentNum: num, heap: `[${minHeap.join(", ")}]`, rootMin: minHeap[0] },
      },
      variables: { i, num, heapSize: minHeap.length, k },
    });

    // Step for line 7: check capacity
    const exceedsCapacity = minHeap.length > k;
    steps.push({
      stepIndex: stepIdx++,
      codeLine: 7,
      explanation: {
        what: `Check heap capacity: size ${minHeap.length} > capacity ${k}? ${exceedsCapacity ? "Yes" : "No"}`,
        why: exceedsCapacity
          ? `Heap size (${minHeap.length}) exceeds maximum capacity k (${k}). The root minimum must be evicted.`
          : `Heap size (${minHeap.length}) is within capacity k (${k}). No eviction needed.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createArrayElements(minHeap, 0, exceedsCapacity ? "active" : "default"),
      },
      auxiliaryState: {
        customState: {
          currentNum: num,
          heap: `[${minHeap.join(", ")}]`,
          rootMin: minHeap[0],
          exceedsCapacity,
        },
      },
      variables: { i, num, heapSize: minHeap.length, k, exceedsCapacity },
    });

    if (exceedsCapacity) {
      const popped = minHeap[0];
      minHeap[0] = minHeap[minHeap.length - 1];
      minHeap.pop();
      siftDown(minHeap);

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 8,
        explanation: {
          what: `Evict root element ${popped} via min-heap pop`,
          why: `Evicting root value ${popped} (smallest candidate among top ${k + 1}). All remaining heap items are strictly greater than or equal to ${popped}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: createArrayElements(minHeap, 0, "swap"),
        },
        auxiliaryState: {
          customState: {
            poppedElement: popped,
            heap: `[${minHeap.join(", ")}]`,
            rootMin: minHeap[0],
          },
        },
        variables: { i, popped, heapSize: minHeap.length, k },
      });
    }
  }

  const result = minHeap[0];
  const finalElements = createArrayElements(minHeap, 0, "sorted");

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 9,
    explanation: {
      what: `Return K-th largest element: ${result}`,
      why: `All array elements processed. Min-heap contains the ${k} largest numbers overall. Root value ${result} is the minimum of the top ${k}, which is precisely the ${k}-th largest element.`,
    },
    primarySnapshot: { kind: "array", elements: finalElements },
    auxiliaryState: {
      customState: { result, k, finalHeap: `[${minHeap.join(", ")}]` },
    },
    variables: { k, result, heapSize: minHeap.length },
  });

  return steps;
}
