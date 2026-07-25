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
    'Set up the sliding window minimum',
    `We want the smallest value in every window of ${k} consecutive elements of [${nums.join(', ')}]. A deque of indices will let us answer each window without rescanning it.`,
    { k, length: n }
  );

  addStep(
    4,
    'Create the result list and deque',
    "We start with an empty result list and an empty deque. The deque will hold indices whose values stay in increasing order, so each window's minimum is always waiting at the front.",
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
      `Look at nums[${i}] = ${currentVal}`,
      `We slide the right edge to index ${i}, so the window in play is [${windowStart}..${i}] holding [${nums.slice(windowStart, i + 1).join(', ')}]. Now we update the deque to reflect it.`,
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
          `Evict index ${removedIdx} — it left the window`,
          `Index ${removedIdx} now sits outside the window's left edge, so its value can no longer be a candidate. We pop it off the front of the deque.`,
          { i, removedIdx }
        );
      }
    }

    if (!removedOut && deque.length > 0) {
      addStep(
        9,
        'Confirm the deque front still fits',
        `The front index ${deque[0]} is still inside the window, so its value remains a legitimate minimum candidate. Nothing to evict this round.`,
        { i, dequeFront: deque[0] }
      );
    }

    // Maintain monotonic increasing property (pop larger elements)
    while (deque.length > 0 && nums[deque[deque.length - 1]] >= currentVal) {
      const poppedIdx = deque.pop();
      if (poppedIdx !== undefined) {
        addStep(
          14,
          `Pop index ${poppedIdx} from the back`,
          `nums[${poppedIdx}] = ${nums[poppedIdx]} is at least as big as the new value ${currentVal}, and ${currentVal} will outlive it in the window. The older value can never be a minimum again, so we discard it.`,
          { i, poppedIdx, 'nums[popped]': nums[poppedIdx] }
        );
      }
    }

    // Push current index
    deque.push(i);

    addStep(
      16,
      `Push index ${i} onto the deque`,
      `With everything bigger cleared out, index ${i} (value ${currentVal}) takes its place at the back. The deque's values now read [${deque.map((idx) => nums[idx]).join(', ')}] — still increasing from front to back.`,
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
        `Record ${minVal} as this window's minimum`,
        `The window [${windowStart}..${i}] is full, and the deque's front — index ${minIdx} — holds its smallest value, ${minVal}. We append it to the result without rescanning the window.`,
        { windowStart, windowEnd: i, minVal, result: result.join(', ') }
      );
    }
  }

  addStep(
    22,
    'Return the list of minimums',
    `Every window of size ${k} has been answered: [${result.join(', ')}]. Each index entered and left the deque at most once, which is why the whole run stayed linear.`,
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
    'Finds the minimum element in every contiguous sliding window of size k by maintaining a monotonic increasing deque of candidate indices.',
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
  complexityAnalysis: {
    time: 'Although there are loops inside the main scan, every index is pushed onto the deque exactly once and popped at most once — either from the front when it leaves the window or from the back when a smaller value arrives. Charging each pop to the push that created it bounds the total work at about 2n deque operations, so the time is O(n) rather than O(n·k).',
    space: 'The deque only ever holds indices from the current window, so it never grows past k entries — O(k) extra space beyond the output list.',
  },
  defaultInput: DEFAULT_SLIDING_WINDOW_MIN_INPUT,
  generateSteps: generateSlidingWindowMinSteps,
};
