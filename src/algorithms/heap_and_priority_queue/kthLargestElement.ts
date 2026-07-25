import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ElementState,
} from '../../types/dsa';

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
  stateOverride?: ElementState
): ArrayElement[] {
  return heap.map((val, idx) => {
    let state: ElementState = 'default';
    if (idx === activeIdx) {
      state = stateOverride || 'active';
    } else if (idx === 0) {
      state = 'pivot';
    }
    const pointers: string[] = [];
    if (idx === 0) pointers.push('min-root');
    if (idx === activeIdx) pointers.push('curr');

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
      codeLine: 1,
      explanation: {
        what: 'Input array is empty.',
        why: 'Cannot extract the Kth largest element from an array with length 0.',
      },
      primarySnapshot: {
        kind: 'array',
        elements: [],
      },
      auxiliaryState: {
        customState: { k, heapSize: 0 },
      },
      variables: { k, result: -1 },
    });
    return steps;
  }

  let stepIdx = 0;
  const minHeap: number[] = [];

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 4,
    explanation: {
      what: `Initialize Min-Heap with capacity target K = ${k}.`,
      why: 'A Min-Heap of size K acts as a filter tracking the K largest elements seen so far. The smallest of these K elements resides at the root for instant O(1) comparison.',
    },
    primarySnapshot: {
      kind: 'array',
      elements: createArrayElements(minHeap),
    },
    auxiliaryState: {
      customState: {
        k,
        heap: '[]',
        nums: `[${nums.join(', ')}]`,
      },
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

    minHeap.push(num);
    const activeIdx = siftUp(minHeap);

    steps.push({
      stepIndex: stepIdx++,
      codeLine: 6,
      explanation: {
        what: `Push num=${num} into Min-Heap (Heap size: ${minHeap.length}).`,
        why: `Inserting ${num} and restoring heap order via sift-up ensures that the root remains the smallest element among all items currently in the heap: [${minHeap.join(', ')}].`,
      },
      primarySnapshot: {
        kind: 'array',
        elements: createArrayElements(minHeap, activeIdx, 'queued'),
      },
      auxiliaryState: {
        customState: {
          currentNum: num,
          heap: `[${minHeap.join(', ')}]`,
          rootMin: minHeap[0],
        },
      },
      variables: {
        i,
        num,
        heapSize: minHeap.length,
        k,
      },
    });

    if (minHeap.length > k) {
      const popped = minHeap[0];
      minHeap[0] = minHeap[minHeap.length - 1];
      minHeap.pop();
      siftDown(minHeap);

      steps.push({
        stepIndex: stepIdx++,
        codeLine: 8,
        explanation: {
          what: `Heap size exceeded K (${minHeap.length + 1} > ${k}). Evicted root minimum: ${popped}.`,
          why: `Because we only need to keep the K largest elements, evicting the root minimum guarantees that all numbers retained in the heap are strictly greater than or equal to ${popped}.`,
        },
        primarySnapshot: {
          kind: 'array',
          elements: createArrayElements(minHeap, 0, 'swap'),
        },
        auxiliaryState: {
          customState: {
            poppedElement: popped,
            heap: `[${minHeap.join(', ')}]`,
            rootMin: minHeap[0],
          },
        },
        variables: {
          i,
          popped,
          heapSize: minHeap.length,
          k,
        },
      });
    }
  }

  const result = minHeap[0];
  const finalElements = createArrayElements(minHeap, 0, 'sorted');

  steps.push({
    stepIndex: stepIdx++,
    codeLine: 9,
    explanation: {
      what: `Algorithm finished. The ${k}th largest element is ${result}.`,
      why: `The Min-Heap of size K retains the K largest elements from the entire array. Because its root represents the minimum value among these top K candidates, it is mathematically the Kth largest element overall.`,
    },
    primarySnapshot: {
      kind: 'array',
      elements: finalElements,
    },
    auxiliaryState: {
      customState: {
        result,
        k,
        finalHeap: `[${minHeap.join(', ')}]`,
      },
    },
    variables: {
      k,
      result,
      heapSize: minHeap.length,
    },
  });

  return steps;
}

export const kthLargestElement: AlgorithmDefinition<KthLargestInput> = {
  id: 'kth-largest-element',
  title: 'Kth Largest Element in an Array',
  category: 'heap_and_priority_queue',
  difficulty: 'Medium',
  description:
    'Find the Kth largest element in an unsorted array of numbers using a Min-Heap of fixed capacity K. As we iterate through each element in the array, we push it into the min-heap. Whenever the heap size exceeds K, the minimum element (located at the root) is evicted. Because smaller elements are systematically removed, the min-heap maintains the K largest elements seen so far across the entire array. Consequently, when all elements have been processed, the minimum element remaining at the heap\'s root is precisely the Kth largest element.',
  constraints: [
    '1 <= k <= nums.length <= 10^5',
    '-10^4 <= nums[i] <= 10^4',
    'Duplicate elements are counted as distinct occurrences',
  ],
  examples: [
    {
      input: 'nums = [3,2,1,5,6,4], k = 2',
      output: '5',
      explanation:
        'Sorting the array in non-decreasing order gives [1,2,3,4,5,6]. The 2nd largest element is 5. The min-heap of size 2 retains [5, 6] with root 5.',
    },
    {
      input: 'nums = [3,2,3,1,2,4,5,5,6], k = 4',
      output: '4',
      explanation:
        'Sorted order is [1,2,2,3,3,4,5,5,6]. The 4th largest element is 4. The min-heap of size 4 retains [4, 5, 5, 6] with root 4.',
    },
  ],
  code: `import heapq

def findKthLargest(nums, k):
    min_heap = []
    for num in nums:
        heapq.heappush(min_heap, num)
        if len(min_heap) > k:
            heapq.heappop(min_heap)
    return min_heap[0]`,
  timeComplexity: {
    best: 'O(N log K)',
    average: 'O(N log K)',
    worst: 'O(N log K)',
  },
  spaceComplexity: 'O(K)',
  generateSteps: generateKthLargestSteps,
  defaultInput: DEFAULT_KTH_LARGEST_INPUT,
};
