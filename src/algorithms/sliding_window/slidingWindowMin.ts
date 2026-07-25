import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  TopicGuide,
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

const SLIDING_WINDOW_MIN_TOPIC_GUIDE: TopicGuide = {
  overview:
    'A monotonic deque is a double-ended queue whose contents stay sorted by construction, and it is the standard answer to questions of the form "give me the extreme value of every window". It stores indices rather than values, throws away any candidate that a newer and better one has made irrelevant, and hands you the answer at its front in a single read. What lifts it above a convenience trick is the discarding rule: an element that is larger than a newer element to its right can never again be a window minimum, so deleting it loses nothing at all.',
  sections: [
    {
      heading: 'The insight: newer and smaller beats older and larger',
      body: `Take two indices i and j with i before j, both inside the same window, where nums[i] is greater than or equal to nums[j]. Every future window that still contains i must also contain j, because windows only slide rightward and j sits further right. In all of those windows nums[j] is at least as good a minimum as nums[i], so nums[i] can never be the answer again and may be deleted the instant you see nums[j]. Apply that rule relentlessly and what survives is exactly the set of indices whose values increase from front to back, which is precisely the set of candidates that could still win some window. That one observation is what replaces the repeated rescanning a naive solution would do.`,
    },
    {
      heading: 'How the deque is maintained',
      body: `Each new index i triggers three operations in a fixed order. First you evict from the front any index that has fallen out of the window, testing whether the front index is at most i minus k, since a window of size k ending at i begins at i minus k plus one. Second you pop from the back while the value there is greater than or equal to nums[i], which is the domination rule doing its work. Third you append i to the back. Once i has reached index k minus one the window is full, so the front of the deque is by construction the position of the smallest value inside it, and you read that value straight off without touching the rest of the window.`,
    },
    {
      heading: 'Why the front is always the window minimum',
      body: `Two invariants hold every time you record an answer. Every index in the deque lies inside the current window, which the front eviction guarantees, and the values at those indices increase from front to back, which the back popping guarantees. Together they force the front to be the smallest surviving candidate. The domination argument then closes the gap: everything you deleted was either outside the window or provably worse than something still present, so nothing eligible was ever lost. Convince yourself of the two invariants separately and the correctness of the whole algorithm follows from them without any further reasoning.`,
    },
    {
      heading: 'Why the deque holds indices instead of values',
      body: `Pushing plain values would make the code shorter, but then you could not tell when a candidate has aged out of the window. An index carries both pieces of information you need: the value through a lookup, and the position for the expiry test. Storing indices also handles duplicates cleanly, because popping on greater-than-or-equal rather than strictly greater removes an equal older twin, which is harmless since the newer twin lives longer and is just as small. If you ever need the window maximum instead of the minimum, flip that one comparison and the front becomes the maximum with nothing else changing.`,
    },
    {
      heading: 'When to reach for it, and what the alternatives cost',
      body: `A min-heap can also answer window extremes, but a heap cannot cheaply delete an element that has merely left the window, so you end up carrying stale entries and discarding them lazily at the top, or maintaining a side map of positions. The deque sidesteps all of that because expiry is just a positional test at the front. Rescanning each window outright is fine when k is tiny and becomes hopeless as k grows. Use the deque whenever you need an extreme value over a fixed-size sliding range, and prefer a heap or a balanced multiset when the window is not fixed-size or you need order statistics beyond the extreme, such as a running median.`,
    },
    {
      heading: 'Pitfalls and sibling problems',
      body: `The classic off-by-one lives in the expiry test, which compares the front index against i minus k rather than the window start, and in the guard that only begins recording once the window has actually reached size k. Popping with a strict comparison still yields correct minima but leaves useless equal duplicates lying in the deque. Remember also that the deque is a candidate list and not the window itself, so its length tells you nothing about how many elements the window holds. The same machinery, called a monotonic stack when you only ever touch one end, drives Next Greater Element, Daily Temperatures, and Largest Rectangle in Histogram; in every one of them the shared move is deleting candidates that a new arrival has made permanently irrelevant.`,
    },
  ],
  keyTerms: [
    {
      term: 'Deque',
      definition:
        'A double-ended queue that supports pushing and popping at both ends in constant time, which is what lets expiry and domination be handled at opposite ends.',
    },
    {
      term: 'Monotonic',
      definition:
        'The property that the values at the stored indices are ordered. Here they increase from front to back, so the front always holds the minimum.',
    },
    {
      term: 'Domination',
      definition:
        'The relation in which a newer element that is smaller or equal makes an older one permanently useless, because it survives longer in the window and is never worse.',
    },
    {
      term: 'Expiry check',
      definition:
        'The front-of-deque test that removes indices which have slid past the left edge of the window. It is the reason the deque stores indices rather than bare values.',
    },
    {
      term: 'Amortized accounting',
      definition:
        'The argument that each index is pushed once and popped at most once, so the total pop work stays bounded even though a single step may pop many entries at once.',
    },
  ],
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
  topicGuide: SLIDING_WINDOW_MIN_TOPIC_GUIDE,
  defaultInput: DEFAULT_SLIDING_WINDOW_MIN_INPUT,
  generateSteps: generateSlidingWindowMinSteps,
};
