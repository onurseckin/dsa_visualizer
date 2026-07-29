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
    "<p>A monotonic deque is a double-ended queue whose contents stay sorted by construction, enabling instant <code>O(1)</code> access to minimum or maximum values over a sliding window. By storing indices rather than raw values, the algorithm efficiently evicts expired elements from the front while dropping dominated elements from the back. Monotonic deques power streaming telemetry analytics, financial rolling risk indicators, audio signal processing, and network congestion algorithms.</p>",
  sections: [
    {
      heading: "The Core Insight: Newer and Smaller Beats Older and Larger",
      body: "<p>Consider two indices <code>i</code> and <code>j</code> where <code>i &lt; j</code> both belong to the current window <code>[i - k + 1, i]</code>, and <code>nums[i] &ge; nums[j]</code>. Every future window containing index <code>i</code> must also contain index <code>j</code> because windows slide rightward. In all future windows, <code>nums[j]</code> is at least as small as <code>nums[i]</code> and will survive longer. Therefore, <code>nums[i]</code> can never again serve as a window minimum and is safely discarded the moment <code>nums[j]</code> is observed. Removing dominated elements preserves a strictly increasing sequence of candidates in the deque.</p>",
    },
    {
      heading: "Double-Ended Queue Operations & Order Maintenance",
      body: "<p>For each index <code>i</code>, four operations occur sequentially:</p><ol><li><strong>Front Eviction:</strong> Check if the front index <code>dq[0]</code> has expired (i.e. <code>dq[0] &le; i - k</code>) and pop it from the front via <code>popleft()</code>.</li><li><strong>Back Eviction:</strong> Pop indices from the back via <code>pop()</code> while <code>nums[dq[-1]] &ge; nums[i]</code> to enforce monotonic ordering.</li><li><strong>Candidate Insertion:</strong> Append index <code>i</code> to the back of the deque.</li><li><strong>Output Generation:</strong> If <code>i &ge; k - 1</code>, the front element <code>nums[dq[0]]</code> is recorded as the minimum for the current window.</li></ol>",
    },
    {
      heading: "Why the Front is Guaranteed to be the Window Minimum",
      body: "<p>Two structural invariants hold continuously:</p><ol><li>Every index in the deque lies strictly within the current window <code>[i - k + 1, i]</code>.</li><li>The values associated with the stored indices strictly increase from front to back: <code>nums[dq[0]] &lt; nums[dq[1]] &lt; &hellip; &lt; nums[dq[-1]]</code>.</li></ol><p>Together, these invariants guarantee that <code>dq[0]</code> contains the index of the smallest element in the current window. All deleted elements were either expired or dominated, ensuring no valid candidate is prematurely lost.</p>",
    },
    {
      heading: "Storing Indices vs Storing Bare Values",
      body: "<p>Storing indices instead of bare values allows direct position testing (<code>dq[0] &le; i - k</code>) to handle window expiry. Furthermore, storing indices handles duplicate values cleanly: popping when <code>nums[dq[-1]] &ge; nums[i]</code> replaces an older duplicate with a newer duplicate, extending the lifespan of the candidate without altering the minimum value.</p>",
    },
    {
      heading: "Performance & Complexity Analysis",
      body: "<p>1. Naive Rescanning <code>O(N &middot; K)</code>: Rescans all <code>K</code> elements for every window position.</p><p>2. Priority Queue / Heap <code>O(N log K)</code>: Inserts each element into a min-heap, requiring logarithmic operations.</p><p>3. Monotonic Deque <code>O(N)</code>: Pushes and pops each index at most once across the entire array, yielding amortized <code>O(1)</code> time per window step and <code>O(K)</code> auxiliary space.</p>",
    },
    {
      heading: "Practical Engineering Applications & Pitfalls",
      body: "<p>Off-by-one errors often occur in the expiry check (comparing <code>dq[0] &le; i - k</code> vs <code>i - k + 1</code>) or in starting result recording before <code>i &ge; k - 1</code>. Monotonic deques are widely used in stock ticker volatility windows, TCP congestion window monitoring, computer vision sliding kernel filters, and time-series anomaly detection.</p>",
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
  description: `<p>Finds the minimum element in every contiguous sliding window of size <code>k</code> in an array <code>nums</code> as the window slides from left to right.</p><p>By maintaining a monotonic increasing double-ended queue (deque) of candidate indices, the algorithm computes each window minimum in amortized <code>O(1)</code> time per element (<code>O(N)</code> total).</p><h3>Why It Exists &amp; Real-World Relevance</h3><p>Tracking rolling minimums or maximums over a fixed window is a fundamental requirement in time-series analysis and system monitoring. Naively checking all <code>K</code> elements in every window takes <code>O(N &middot; K)</code> time, while min-heaps take <code>O(N log K)</code> time. A monotonic deque achieves optimal linear <code>O(N)</code> time.</p><p>Real-world applications include:</p><ul><li><strong>Financial Risk &amp; Volatility:</strong> Computing rolling minimum asset prices over fixed time windows (e.g., 30-day low).</li><li><strong>Streaming Telemetry &amp; Rate Limiting:</strong> Monitoring minimum latency or throughput spikes across sliding time intervals.</li><li><strong>Signal &amp; Image Processing:</strong> 1D/2D max/min filter kernels in computer vision (e.g. morphological erosion and dilation).</li><li><strong>Network Packet Scheduling:</strong> TCP sliding window congestion control and buffer management.</li></ul><h3>How It Works (Step-by-Step Intuition)</h3><ul><li>Maintain a double-ended queue (<code>deque</code>) storing indices into <code>nums</code>.</li><li>Iterate index <code>i</code> from <code>0</code> to <code>N - 1</code>:<ul><li><strong>Expire Front:</strong> If <code>dq[0] &le; i - k</code>, pop it from the front via <code>popleft()</code>. It has slid past the left edge of the window.</li><li><strong>Pop Dominated Back:</strong> While the deque is non-empty and <code>nums[dq[-1]] &ge; nums[i]</code>, pop from the back. Since <code>nums[i]</code> is smaller (or equal) and sits further right, older larger elements can never be a minimum again.</li><li><strong>Push Current:</strong> Push index <code>i</code> to the back of the deque.</li><li><strong>Record Minimum:</strong> Once <code>i &ge; k - 1</code> (the window is full), record <code>nums[dq[0]]</code> as the minimum for the current window.</li></ul></li></ul><p><code>dq[0] &le; i - k &rArr; popleft()</code></p><p><code>nums[dq[-1]] &ge; nums[i] &rArr; pop()</code></p><h3>Input Parameters</h3><ul><li><code>nums</code>: An array of integers.</li><li><code>k</code>: An integer representing the sliding window size (<code>1 &le; k &le; N</code>).</li></ul><h3>Output</h3><p>Returns an array <code>result</code> containing <code>N - k + 1</code> integers representing the minimum of each sliding window of size <code>k</code>.</p><h3>Edge Cases &amp; Constraints</h3><ul><li><code>1 &le; nums.length &le; 10<sup>5</sup></code></li><li><code>-10<sup>4</sup> &le; nums[i] &le; 10<sup>4</sup></code></li><li><code>1 &le; k &le; nums.length</code></li><li><code>k = 1</code>: Output array is identical to <code>nums</code>.</li><li><code>k = N</code>: Output array contains a single element (the global minimum of <code>nums</code>).</li><li>Duplicate values: Preserved correctly by non-strict popping (<code>&ge;</code>), replacing older equal values with newer ones.</li></ul>`,
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
