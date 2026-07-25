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
        what: 'Stop: the array is empty',
        why: 'There is no Kth largest element to find in an empty array, so we stop right away.',
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
      what: `Create an empty min-heap for K = ${k}`,
      why: `Here's the plan: we keep only the ${k} largest numbers we've seen so far, stored in a min-heap. That way the smallest of our keepers always sits at the root, ready to be compared or evicted in an instant.`,
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
        what: `Push ${num} into the heap`,
        why: `We add ${num} and let it sift up until its parent is smaller, so the smallest candidate stays at the root. The heap now holds [${minHeap.join(', ')}].`,
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
          what: `Evict the root minimum, ${popped}`,
          why: `The heap just grew to ${minHeap.length + 1} — one more than the ${k} we want to keep — so the smallest candidate, ${popped} at the root, gets dropped. Everything still in the heap is at least as large as what we discard.`,
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
      what: `Done: the answer is ${result}`,
      why: `Every number has passed through the filter, so the heap now holds the ${k} largest values in the whole array — and its root, ${result}, is the smallest of that group, which makes it exactly the Kth largest overall. Each element cost one O(log K) heap operation, O(N log K) in total.`,
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
  complexityAnalysis: {
    time: 'We push each of the N array elements into a heap that never grows past K entries, and every push or pop on a heap that small costs O(log K) sift work. N elements times an O(log K) heap operation apiece gives O(N log K) — noticeably cheaper than fully sorting the array when K is small compared to N.',
    space: "The min-heap is capped at K elements — the moment it reaches K + 1 we evict the root — so extra memory is O(K), independent of the array's length.",
  },
  generateSteps: generateKthLargestSteps,
  defaultInput: DEFAULT_KTH_LARGEST_INPUT,
};
