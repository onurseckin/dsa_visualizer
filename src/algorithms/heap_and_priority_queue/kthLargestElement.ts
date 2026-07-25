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
        why: 'Cannot find kth largest element in an empty array.',
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
      what: `Initialize min-heap of maximum size k=${k}.`,
      why: 'A min-heap of size K keeps the K largest elements seen so far.',
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
        what: `Push num=${num} into min-heap.`,
        why: `Heap now contains ${minHeap.length} elements: [${minHeap.join(', ')}].`,
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
          what: `Heap size exceeded K (${minHeap.length + 1} > ${k}). Popped smallest element: ${popped}.`,
          why: 'By evicting the smallest element, we maintain the K largest elements seen so far.',
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
      why: 'The min-heap of size K contains the K largest elements, so its root (smallest of the K) is the Kth largest element.',
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
    'Find the Kth largest element in an unsorted array using a Min-Heap of size K.',
  constraints: [
    '1 <= k <= nums.length <= 10^5',
    '-10^4 <= nums[i] <= 10^4',
  ],
  examples: [
    {
      input: 'nums = [3,2,1,5,6,4], k = 2',
      output: '5',
      explanation: 'The 2nd largest element in sorted order [1,2,3,4,5,6] is 5.',
    },
    {
      input: 'nums = [3,2,3,1,2,4,5,5,6], k = 4',
      output: '4',
      explanation: 'The 4th largest element is 4.',
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
