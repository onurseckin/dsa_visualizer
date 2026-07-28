import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { SLIDING_WINDOW_MIN_CODE } from "./pythonCode";
import { generateSlidingWindowMinSteps, type SlidingWindowMinInput } from "./stepGenerator";

export const DEFAULT_SLIDING_WINDOW_MIN_INPUT: SlidingWindowMinInput = {
  nums: [4, 2, 12, 11, 5, 8, 3, 9],
  k: 3,
};

const SLIDING_WINDOW_MIN_TOPIC_GUIDE: TopicGuide = {
  overview:
    "A monotonic deque is a double-ended queue whose contents stay sorted by construction, enabling instant $O(1)$ access to minimum or maximum values over a sliding window. By storing indices rather than raw values, the algorithm efficiently evicts expired elements from the front while dropping dominated elements from the back. Monotonic deques power streaming telemetry analytics, financial rolling risk indicators, audio signal processing, and network congestion algorithms.",
  sections: [
    {
      heading: "The Core Insight: Newer and Smaller Beats Older and Larger",
      body: `Consider two indices $i$ and $j$ where $i < j$ both belong to the current window $[i - k + 1, i]$, and $\\text{nums}[i] \\ge \\text{nums}[j]$. Every future window containing index $i$ must also contain index $j$ because windows slide rightward. In all future windows, $\\text{nums}[j]$ is at least as small as $\\text{nums}[i]$ and will survive longer. Therefore, $\\text{nums}[i]$ can never again serve as a window minimum and is safely discarded the moment $\\text{nums}[j]$ is observed. Removing dominated elements preserves a strictly increasing sequence of candidates in the deque.`,
    },
    {
      heading: "Double-Ended Queue Operations & Order Maintenance",
      body: `For each index $i$, four operations occur sequentially:
1. **Front Eviction**: Check if the front index $dq[0]$ has expired (i.e. $dq[0] \\le i - k$) and pop it from the front via \`popleft()\`.
2. **Back Eviction**: Pop indices from the back via \`pop()\` while $\\text{nums}[dq[-1]] \\ge \\text{nums}[i]$ to enforce monotonic ordering.
3. **Candidate Insertion**: Append index $i$ to the back of the deque.
4. **Output Generation**: If $i \\ge k - 1$, the front element $\\text{nums}[dq[0]]$ is recorded as the minimum for the current window.`,
    },
    {
      heading: "Why the Front is Guaranteed to be the Window Minimum",
      body: `Two structural invariants hold continuously:
1. Every index in the deque lies strictly within the current window $[i - k + 1, i]$.
2. The values associated with the stored indices strictly increase from front to back: $\\text{nums}[dq[0]] < \\text{nums}[dq[1]] < \\dots < \\text{nums}[dq[-1]]$.

Together, these invariants guarantee that $dq[0]$ contains the index of the smallest element in the current window. All deleted elements were either expired ($dq[0] \\le i - k$) or dominated ($\\text{nums}[dq[-1]] \\ge \\text{nums}[i]$), ensuring no valid candidate is prematurely lost.`,
    },
    {
      heading: "Storing Indices vs Storing Bare Values",
      body: `Storing indices instead of bare values allows direct position testing ($dq[0] \\le i - k$) to handle window expiry. Furthermore, storing indices handles duplicate values cleanly: popping when $\\text{nums}[dq[-1]] \\ge \\text{nums}[i]$ replaces an older duplicate with a newer duplicate, extending the lifespan of the candidate without altering the minimum value.`,
    },
    {
      heading: "Performance & Complexity Analysis",
      body: `1. **Naive Rescanning** $O(N \\cdot K)$: Rescans all $K$ elements for every window position. Extremely slow for large $K$.
2. **Priority Queue / Heap** $O(N \\log K)$: Inserts each element into a min-heap, but stale elements must be lazily deleted from the top, requiring logarithmic time per step.
3. **Monotonic Deque** $O(N)$: Pushes and pops each index at most once across the entire array, yielding amortized $O(1)$ time per window step and $O(K)$ auxiliary space.

$$\\sum_{i=0}^{N-1} (\\text{push count} + \\text{pop count}) \\le 2N = O(N)$$`,
    },
    {
      heading: "Practical Engineering Applications & Pitfalls",
      body: `Off-by-one errors often occur in the expiry check (comparing $dq[0] \\le i - k$ vs $i - k + 1$) or in starting result recording before $i \\ge k - 1$. Monotonic deques are widely used in stock ticker volatility windows, TCP congestion window monitoring, computer vision sliding kernel filters, and time-series anomaly detection.`,
    },
  ],
  keyTerms: [
    {
      term: "Monotonic Deque",
      definition:
        "A double-ended queue whose contents are kept strictly sorted (increasing or decreasing) by popping violating elements prior to insertion.",
    },
    {
      term: "Domination Principle",
      definition:
        "The condition where a newer, smaller element renders an older, larger element permanently obsolete for future minimum queries.",
    },
    {
      term: "Expiry Check",
      definition:
        "The front-of-deque check that removes indices that have fallen behind the left boundary of the sliding window (dq[0] <= i - k).",
    },
    {
      term: "Amortized Complexity",
      definition:
        "The proof that because each element is pushed once and popped at most once, total operations across N steps are bounded by 2N.",
    },
  ],
};

const SLIDING_WINDOW_MIN_TRIVIA: TriviaMeta = {
  skipLines: [2, 6, 10, 13, 15, 18],
  lineExplanations: {
    1: "Imports deque from standard library collections to provide O(1) double-ended push and pop operations.",
    3: "Defines sliding_window_min(nums, k): accepts an integer list nums and window size k, returning minimums for all windows.",
    4: "Initializes the result list to collect the minimum element for each window of size k.",
    5: "Creates an empty deque to maintain candidate indices whose values increase from front to back.",
    7: "Iterates through array indices i from 0 up to len(nums) - 1.",
    8: "Checks if the front index of deque dq[0] has fallen out of the window (i.e. dq[0] <= i - k).",
    9: "Evicts the expired front index using popleft() since it is outside the current window's left boundary.",
    11: "Loops while deque is non-empty and the value at the back index nums[dq[-1]] is >= current value nums[i].",
    12: "Pops the back index off the deque because nums[i] is smaller and will outlive it in future windows (Domination Principle).",
    14: "Appends current index i to the back of the deque to maintain monotonically increasing candidate values.",
    16: "Checks if the loop index i has reached at least k - 1, marking a full window of size k.",
    17: "Appends the value at the front of the deque nums[dq[0]] to result, as dq[0] is guaranteed to be the current window minimum.",
    19: "Returns the completed list of sliding window minimums.",
  },
};

export const slidingWindowMin: AlgorithmDefinition<SlidingWindowMinInput> = {
  id: "sliding-window-min",
  title: "Sliding Window Minimum",
  topicIds: ["sliding_window"],
  difficulty: "Hard",
  description: `Finds the minimum element in every contiguous sliding window of size $k$ in an array \`nums\` as the window slides from left to right.

By maintaining a monotonic increasing double-ended queue (deque) of candidate indices, the algorithm computes each window minimum in amortized $O(1)$ time per element ($O(N)$ total).

### Why It Exists & Real-World Relevance
Tracking rolling minimums or maximums over a fixed window is a fundamental requirement in time-series analysis and system monitoring. Naively checking all $K$ elements in every window takes $O(N \\cdot K)$ time, while min-heaps take $O(N \\log K)$ time. A monotonic deque achieves optimal linear $O(N)$ time.

Real-world applications include:
- **Financial Risk & Volatility**: Computing rolling minimum asset prices over fixed time windows (e.g., 30-day low).
- **Streaming Telemetry & Rate Limiting**: Monitoring minimum latency or throughput spikes across sliding time intervals.
- **Signal & Image Processing**: 1D/2D max/min filter kernels in computer vision (e.g. morphological erosion and dilation).
- **Network Packet Scheduling**: TCP sliding window congestion control and buffer management.

### How It Works (Step-by-Step Intuition)
1. Maintain a double-ended queue (\`deque\`) storing indices into \`nums\`.
2. Iterate index $i$ from $0$ to $N - 1$:
   - **Expire Front**: If $dq[0] \\le i - k$, pop it from the front via \`popleft()\`. It has slid past the left edge of the window.
   - **Pop Dominated Back**: While the deque is non-empty and $\\text{nums}[dq[-1]] \\ge \\text{nums}[i]$, pop from the back. Why? Because $\\text{nums}[i]$ is smaller (or equal) and sits further right, so the older, larger elements can never be a minimum again.
   - **Push Current**: Push index $i$ to the back of the deque.
   - **Record Minimum**: Once $i \\ge k - 1$ (the window is full), record $\\text{nums}[dq[0]]$ as the minimum for the current window.

$$dq[0] \\le i - k \\implies \\text{popleft}()$$
$$\\text{nums}[dq[-1]] \\ge \\text{nums}[i] \\implies \\text{pop}()$$

### Input Parameters
- \`nums\`: An array of integers.
- \`k\`: An integer representing the sliding window size ($1 \\le k \\le N$).

### Output
- Returns an array \`result\` containing $N - k + 1$ integers representing the minimum of each sliding window of size $k$.

### Edge Cases & Constraints
- \`1 <= nums.length <= 10^5\`
- \`-10^4 <= nums[i] <= 10^4\`
- \`1 <= k <= nums.length\`
- $k = 1$: Output array is identical to \`nums\`.
- $k = N$: Output array contains a single element (the global minimum of \`nums\`).
- Duplicate values: Preserved correctly by non-strict popping ($\\ge$), replacing older equal values with newer ones.`,
  constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4", "1 <= k <= nums.length"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nums = [4, 2, 12, 11, 5, 8, 3, 9], k = 3",
      outputDisplay: "[2, 2, 5, 5, 3, 3]",
      title: "Basic Example",
      input: DEFAULT_SLIDING_WINDOW_MIN_INPUT,
      output: "[2, 2, 5, 5, 3, 3]",
      explanation:
        "The sliding windows of size 3 are [4,2,12]->2, [2,12,11]->2, [12,11,5]->5, [11,5,8]->5, [5,8,3]->3, [8,3,9]->3.",
    },
    {
      kind: "complex",
      inputDisplay: "nums = [9, 7, 5, 3, 1, 2, 4, 6, 8], k = 4",
      outputDisplay: "[3, 1, 1, 1, 1, 2]",
      title: "Complex Decreasing-Increasing Sequence",
      input: { nums: [9, 7, 5, 3, 1, 2, 4, 6, 8], k: 4 },
      output: "[3, 1, 1, 1, 1, 2]",
      explanation:
        "Strictly decreasing then increasing sequence; monotonic deque evicts expired and dominated indices across 6 windows.",
    },
    {
      kind: "negative",
      inputDisplay: "nums = [10, 20, 30, 40], k = 4",
      outputDisplay: "[10]",
      title: "Full Window Boundary Case",
      input: { nums: [10, 20, 30, 40], k: 4 },
      output: "[10]",
      explanation: "Window size k equals total length; produces a single window minimum [10].",
    },
  ],
  code: SLIDING_WINDOW_MIN_CODE,
  timeComplexity: {
    best: "O(n)",
    average: "O(n)",
    worst: "O(n)",
  },
  spaceComplexity: "O(k)",
  complexityAnalysis: {
    time: "Each index is pushed onto the deque exactly once and popped from the front or back at most once. Total push and pop operations across the entire loop are bounded by $2N$. The amortized time per step is $O(1)$, yielding total runtime complexity of $O(N)$.",
    space:
      "The deque stores indices belonging strictly to the active sliding window, so its size never exceeds $K$. Auxiliary space complexity is $O(K)$ excluding the output array.",
  },
  topicGuide: SLIDING_WINDOW_MIN_TOPIC_GUIDE,
  trivia: SLIDING_WINDOW_MIN_TRIVIA,
  leetcode: {
    id: 239,
    url: "https://leetcode.com/problems/sliding-window-maximum/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #239",
      leetcodeId: 239,
      url: "https://leetcode.com/problems/sliding-window-maximum/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 8",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 8,
      section: "8.3 Sliding window minimum",
    },
  ],
  defaultInput: DEFAULT_SLIDING_WINDOW_MIN_INPUT,
  generateSteps: generateSlidingWindowMinSteps,
};

export default slidingWindowMin;
