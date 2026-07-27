import type { AlgorithmStep, ArrayElement, ElementState } from "../../../types/dsa";

export interface KthLargestInput {
  nums: number[];
  k: number;
}

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
  const nums = input.nums || [];
  const k = Math.max(1, Math.min(input.k || 1, nums.length || 1));

  if (nums.length === 0) {
    steps.push({
      stepIndex: 0,
      codeLine: 3,
      explanation: {
        what: "Stop: the array is empty",
        why: "There is no Kth largest element to find in an empty array, so we stop right away.",
      },
      primarySnapshot: { kind: "array", elements: [] },
      auxiliaryState: { customState: { k, heapSize: 0 } },
      variables: { k, result: -1 },
    });
    return steps;
  }

  let stepIdx = 0;
  const minHeap: number[] = [];

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 1,
    explanation: {
      what: "Import heapq for min-heap operations",
      why: "Python's heapq provides O(log k) push and pop on the heap, which is what makes this algorithm O(n log k) overall instead of O(n log n) with full sorting.",
    },
    primarySnapshot: { kind: "array", elements: createArrayElements(minHeap) },
    auxiliaryState: { customState: { k, nums: `[${nums.join(", ")}]` } },
    variables: { k },
  });

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 4,
    explanation: {
      what: `Create an empty min-heap for K = ${k}`,
      why: `Here's the plan: we keep only the ${k} largest numbers we've seen so far, stored in a min-heap. That way the smallest of our keepers always sits at the root, ready to be compared or evicted in an instant.`,
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
        what: `Inspect element nums[${i}] = ${num}`,
        why: `We consider ${num} to see if it belongs among the ${k} largest elements seen so far.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createArrayElements(minHeap),
      },
      auxiliaryState: {
        customState: { currentNum: num, heap: `[${minHeap.join(", ")}]`, rootMin: minHeap[0] ?? "none" },
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
        what: `Push ${num} into the heap`,
        why: `We add ${num} and let it sift up until its parent is smaller, so the smallest candidate stays at the root. The heap now holds [${minHeap.join(", ")}].`,
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
        what: `Check heap capacity: size ${minHeap.length} > k (${k})? ${exceedsCapacity ? "Yes" : "No"}`,
        why: exceedsCapacity
          ? `The heap size (${minHeap.length}) exceeds k (${k}), so we must evict the root (the smallest candidate).`
          : `The heap size (${minHeap.length}) is within capacity k (${k}), so no eviction is needed yet.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createArrayElements(minHeap, 0, exceedsCapacity ? "active" : "default"),
      },
      auxiliaryState: {
        customState: { currentNum: num, heap: `[${minHeap.join(", ")}]`, rootMin: minHeap[0], exceedsCapacity },
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
          what: `Evict the root minimum, ${popped}`,
          why: `The heap just grew past capacity ${k}, so the smallest candidate, ${popped} at the root, gets dropped. Everything still in the heap is at least as large as what we discard.`,
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
      what: `Done: the answer is ${result}`,
      why: `Every number has passed through the filter, so the heap now holds the ${k} largest values in the whole array — and its root, ${result}, is the smallest of that group, which makes it exactly the Kth largest overall.`,
    },
    primarySnapshot: { kind: "array", elements: finalElements },
    auxiliaryState: {
      customState: { result, k, finalHeap: `[${minHeap.join(", ")}]` },
    },
    variables: { k, result, heapSize: minHeap.length },
  });

  return steps;
}
