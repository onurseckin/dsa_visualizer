import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
} from '../../types/dsa';

export interface SlidingWindowMinInput {
  nums: number[];
  k: number;
}

export const SLIDING_WINDOW_MIN_CODE = `from collections import deque

def sliding_window_min(nums: list[int], k: int) -> list[int]:
    result = []
    dq = deque()  # stores indices
    
    for i in range(len(nums)):
        # Remove indices outside current window boundary
        while dq and dq[0] <= i - k:
            dq.popleft()
            
        # Maintain monotonic increasing deque (pop larger elements)
        while dq and nums[dq[-1]] >= nums[i]:
            dq.pop()
            
        dq.append(i)
        
        # Record window minimum once window reaches size k
        if i >= k - 1:
            result.append(nums[dq[0]])
            
    return result`;

export const DEFAULT_SLIDING_WINDOW_MIN_INPUT: SlidingWindowMinInput = {
  nums: [4, 2, 12, 11, 5, 8, 3, 9],
  k: 3,
};

export const generateSlidingWindowMinSteps = (
  input: SlidingWindowMinInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const nums = input.nums;
  const k = input.k;
  const n = nums.length;

  const elements: ArrayElement[] = nums.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: 'default',
  }));

  const deque: number[] = [];
  const result: number[] = [];

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
        elements: elements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        queue: deque.map((idx) => `idx:${idx}(val:${nums[idx]})`),
        visited: [...result],
        customState: {
          windowSize: k,
          dequeIndices: deque.join(', '),
          result: result.join(', '),
        },
      },
      variables,
    });
  };

  addStep(
    3,
    'Initialize Sliding Window Minimum',
    `Find the minimum element in every contiguous sliding window of size k = ${k} over array [${nums.join(', ')}] using a Monotonic Increasing Deque in O(n) total time.`,
    { k, length: n }
  );

  addStep(
    4,
    'Initialize Data Structures',
    'Created empty result list and double-ended queue (deque). The deque will store array indices in strictly increasing order of element values.',
    { k, dequeSize: 0, resultSize: 0 }
  );

  for (let i = 0; i < n; i++) {
    const currentVal = nums[i];

    // Highlight active window and current element
    const windowStart = Math.max(0, i - k + 1);
    for (let idx = 0; idx < n; idx++) {
      if (idx >= windowStart && idx <= i) {
        elements[idx].state = idx === i ? 'active' : 'queued';
      } else if (idx < windowStart) {
        elements[idx].state = 'visited';
      } else {
        elements[idx].state = 'default';
      }
      elements[idx].pointers = undefined;
    }

    elements[i].pointers = ['i'];
    if (i >= k - 1) {
      elements[windowStart].pointers = elements[windowStart].pointers
        ? ['L', ...elements[windowStart].pointers]
        : ['L'];
    }

    addStep(
      7,
      `Iterate index i = ${i} (nums[${i}] = ${currentVal})`,
      `Window Right Boundary: Processing element nums[${i}] = ${currentVal}. Active window range: [${windowStart}..${i}] containing elements [${nums.slice(windowStart, i + 1).join(', ')}].`,
      { i, 'nums[i]': currentVal, windowStart, k }
    );

    // Remove elements outside window
    let removedOut = false;
    while (deque.length > 0 && deque[0] <= i - k) {
      const removedIdx = deque.shift();
      if (removedIdx !== undefined) {
        removedOut = true;
        addStep(
          10,
          `Remove index ${removedIdx} from front of deque`,
          `Boundary Eviction: Index ${removedIdx} is now outside the current sliding window boundary (index <= ${i - k}). Pop from front of deque.`,
          { i, removedIdx }
        );
      }
    }

    if (!removedOut && deque.length > 0) {
      addStep(
        9,
        'Check front of deque',
        `Boundary Invariant: Front index ${deque[0]} is valid and within active window bounds (${deque[0]} > ${i - k}).`,
        { i, dequeFront: deque[0] }
      );
    }

    // Maintain monotonic increasing property (pop larger elements)
    while (deque.length > 0 && nums[deque[deque.length - 1]] >= currentVal) {
      const poppedIdx = deque.pop();
      if (poppedIdx !== undefined) {
        addStep(
          14,
          `Pop index ${poppedIdx} (val: ${nums[poppedIdx]}) from back of deque`,
          `Monotonic Invariant Violation: nums[${poppedIdx}] (${nums[poppedIdx]}) >= current value nums[${i}] (${currentVal}). Because ${currentVal} is smaller and introduced later, index ${poppedIdx} can NEVER be the minimum for any future window. Pop it from back.`,
          { i, poppedIdx, 'nums[popped]': nums[poppedIdx] }
        );
      }
    }

    // Push current index
    deque.push(i);

    addStep(
      16,
      `Push index ${i} to deque`,
      `Insert Index: Pushed index ${i} (value ${currentVal}) to back of monotonic deque. Deque preserves strictly increasing element values: [${deque.map((idx) => nums[idx]).join(', ')}].`,
      { i, dequeState: deque.join(', ') }
    );

    // Record result if window is full size k
    if (i >= k - 1) {
      const minIdx = deque[0];
      const minVal = nums[minIdx];
      result.push(minVal);

      elements[minIdx].state = 'sorted';

      addStep(
        20,
        `Record window minimum: ${minVal}`,
        `Query Result: Monotonic deque front (index ${minIdx}) provides minimum value (${minVal}) for window [${windowStart}..${i}] in O(1) time. Appended to result list.`,
        { windowStart, windowEnd: i, minVal, result: result.join(', ') }
      );
    }
  }

  addStep(
    22,
    'Complete Sliding Window Minimum',
    `Evaluation Complete: Computed minimums for all sliding windows of size k = ${k}: [${result.join(', ')}] in linear O(n) time.`,
    { result: result.join(', ') }
  );

  return steps;
};

export const slidingWindowMin: AlgorithmDefinition<SlidingWindowMinInput> = {
  id: 'sliding-window-min',
  title: 'Sliding Window Minimum',
  category: 'sliding_window',
  difficulty: 'Hard',
  description:
    'Finds the minimum element in every contiguous sliding window of size k moving across an array using a Monotonic Increasing Deque in optimal O(n) time and O(k) space.',
  constraints: [
    '1 <= nums.length <= 10^5',
    '-10^4 <= nums[i] <= 10^4',
    '1 <= k <= nums.length',
  ],
  examples: [
    {
      input: 'nums = [4, 2, 12, 11, 5, 8, 3, 9], k = 3',
      output: '[2, 2, 5, 5, 3, 3]',
      explanation:
        'The sliding windows of size 3 are [4,2,12]->2, [2,12,11]->2, [12,11,5]->5, [11,5,8]->5, [5,8,3]->3, [8,3,9]->3.',
    },
    {
      input: 'nums = [1, -1], k = 1',
      output: '[1, -1]',
      explanation: 'Sliding window of size 1 yields each array element itself as the window minimum.',
    },
  ],
  code: SLIDING_WINDOW_MIN_CODE,
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
  },
  spaceComplexity: 'O(k)',
  defaultInput: DEFAULT_SLIDING_WINDOW_MIN_INPUT,
  generateSteps: generateSlidingWindowMinSteps,
};
