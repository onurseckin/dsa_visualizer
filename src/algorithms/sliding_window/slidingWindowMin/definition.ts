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
  description: `<p>Given an array of integers <code>nums</code> and a sliding window size <code>k</code>, return an array containing the minimum value in each contiguous window of size <code>k</code> as it slides from left to right.</p>
<h3>Problem Statement</h3>
<p>There is a sliding window of size <code>k</code> moving from the very left of the array <code>nums</code> to the very right. You can only see the <code>k</code> numbers in the window. Each time the sliding window moves right by one position, determine the minimum value within the current window.</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>nums</code>: An array of integers.</li>
  <li><code>k</code>: An integer representing the sliding window size (<code>1 &le; k &le; N</code>).</li>
</ul>
<h3>Output</h3>
<p>Returns an array <code>result</code> containing <code>N - k + 1</code> integers representing the minimum of each sliding window of size <code>k</code>.</p>
`,
  constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4", "1 <= k <= nums.length"],
  examples: [
    {
      kind: "basic",
      kind: "basic",
      scenario: "standard",
      inputDisplay: "nums = [4, 2, 12, 11, 5, 8, 3, 9], k = 3",
      outputDisplay: "[2, 2, 5, 5, 3, 3]",
      title: "Standard 8-Element Array with k = 3",
      input: DEFAULT_SLIDING_WINDOW_MIN_INPUT,
      output: "[2, 2, 5, 5, 3, 3]",
      explanation:
        "The sliding windows of size 3 are [4,2,12]->2, [2,12,11]->2, [12,11,5]->5, [11,5,8]->5, [5,8,3]->3, [8,3,9]->3.",
    },
    {
      kind: "complex",
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "nums = [9, 7, 5, 3, 1, 2, 4, 6, 8], k = 4",
      outputDisplay: "[3, 1, 1, 1, 1, 2]",
      title: "Adversarial Decreasing-Increasing Sequence",
      input: { nums: [9, 7, 5, 3, 1, 2, 4, 6, 8], k: 4 },
      output: "[3, 1, 1, 1, 1, 2]",
      explanation:
        "Strictly decreasing then increasing sequence; monotonic deque evicts expired and dominated indices across 6 windows.",
    },
    {
      kind: "negative",
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "nums = [10, 20, 30, 40], k = 4",
      outputDisplay: "[10]",
      title: "Boundary Full Window k = N",
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
