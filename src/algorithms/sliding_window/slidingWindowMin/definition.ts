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
    'A monotonic deque is a double-ended queue whose contents stay sorted by construction, and it is the standard answer to questions of the form "give me the extreme value of every window". It stores indices rather than values, throws away any candidate that a newer and better one has made irrelevant, and hands you the answer at its front in a single read. What lifts it above a convenience trick is the discarding rule: an element that is larger than a newer element to its right can never again be a window minimum, so deleting it loses nothing at all.',
  sections: [
    {
      heading: "The insight: newer and smaller beats older and larger",
      body: `Take two indices i and j with i before j, both inside the same window, where nums[i] is greater than or equal to nums[j]. Every future window that still contains i must also contain j, because windows only slide rightward and j sits further right. In all of those windows nums[j] is at least as good a minimum as nums[i], so nums[i] can never be the answer again and may be deleted the instant you see nums[j]. Apply that rule relentlessly and what survives is exactly the set of indices whose values increase from front to back, which is precisely the set of candidates that could still win some window. That one observation is what replaces the repeated rescanning a naive solution would do.`,
    },
    {
      heading: "How the deque is maintained",
      body: `Each new index i triggers three operations in a fixed order. First you evict from the front any index that has fallen out of the window, testing whether the front index is at most i minus k, since a window of size k ending at i begins at i minus k plus one. Second you pop from the back while the value there is greater than or equal to nums[i], which is the domination rule doing its work. Third you append i to the back. Once i has reached index k minus one the window is full, so the front of the deque is by construction the position of the smallest value inside it, and you read that value straight off without touching the rest of the window.`,
    },
    {
      heading: "Why the front is always the window minimum",
      body: `Two invariants hold every time you record an answer. Every index in the deque lies inside the current window, which the front eviction guarantees, and the values at those indices increase from front to back, which the back popping guarantees. Together they force the front to be the smallest surviving candidate. The domination argument then closes the gap: everything you deleted was either outside the window or provably worse than something still present, so nothing eligible was ever lost. Convince yourself of the two invariants separately and the correctness of the whole algorithm follows from them without any further reasoning.`,
    },
    {
      heading: "Why the deque holds indices instead of values",
      body: `Pushing plain values would make the code shorter, but then you could not tell when a candidate has aged out of the window. An index carries both pieces of information you need: the value through a lookup, and the position for the expiry test. Storing indices also handles duplicates cleanly, because popping on greater-than-or-equal rather than strictly greater removes an equal older twin, which is harmless since the newer twin lives longer and is just as small. If you ever need the window maximum instead of the minimum, flip that one comparison and the front becomes the maximum with nothing else changing.`,
    },
    {
      heading: "When to reach for it, and what the alternatives cost",
      body: `A min-heap can also answer window extremes, but a heap cannot cheaply delete an element that has merely left the window, so you end up carrying stale entries and discarding them lazily at the top, or maintaining a side map of positions. The deque sidesteps all of that because expiry is just a positional test at the front. Rescanning each window outright is fine when k is tiny and becomes hopeless as k grows. Use the deque whenever you need an extreme value over a fixed-size sliding range, and prefer a heap or a balanced multiset when the window is not fixed-size or you need order statistics beyond the extreme, such as a running median.`,
    },
    {
      heading: "Pitfalls and sibling problems",
      body: `The classic off-by-one lives in the expiry test, which compares the front index against i minus k rather than the window start, and in the guard that only begins recording once the window has actually reached size k. Popping with a strict comparison still yields correct minima but leaves useless equal duplicates lying in the deque. Remember also that the deque is a candidate list and not the window itself, so its length tells you nothing about how many elements the window holds. The same machinery, called a monotonic stack when you only ever touch one end, drives Next Greater Element, Daily Temperatures, and Largest Rectangle in Histogram; in every one of them the shared move is deleting candidates that a new arrival has made permanently irrelevant.`,
    },
  ],
  keyTerms: [
    {
      term: "Deque",
      definition:
        "A double-ended queue that supports pushing and popping at both ends in constant time, which is what lets expiry and domination be handled at opposite ends.",
    },
    {
      term: "Monotonic",
      definition:
        "The property that the values at the stored indices are ordered. Here they increase from front to back, so the front always holds the minimum.",
    },
    {
      term: "Domination",
      definition:
        "The relation in which a newer element that is smaller or equal makes an older one permanently useless, because it survives longer in the window and is never worse.",
    },
    {
      term: "Expiry check",
      definition:
        "The front-of-deque test that removes indices which have slid past the left edge of the window. It is the reason the deque stores indices rather than bare values.",
    },
    {
      term: "Amortized accounting",
      definition:
        "The argument that each index is pushed once and popped at most once, so the total pop work stays bounded even though a single step may pop many entries at once.",
    },
  ],
};

const SLIDING_WINDOW_MIN_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports deque from the standard library, the double-ended queue that will hold candidate indices and support O(1) pushes and pops at both ends.",
    3: "Declares the function: given nums and a window size k, return the minimum of every contiguous window of that size.",
    4: "Initializes the output list that will collect one minimum per window.",
    5: "Creates an empty deque that stores indices into nums (not values), kept in an order that always exposes the current window's minimum at the front.",
    7: "Scans i across every index of nums once; each index goes through the same three-step routine below before a result may be recorded.",
    8: "Checks whether the index at the front of the deque has fallen out of the window — a window of size k ending at i starts at i - k + 1, so anything at or before i - k is stale.",
    9: "Removes the stale front index with popleft, since it can never be part of the current or any future window.",
    11: "Checks whether the value at the back of the deque is greater than or equal to nums[i] — if so, that older candidate can never win a window again, since nums[i] is at least as small and will outlive it in the window.",
    12: "Pops the dominated index off the back, since a newer, at-least-as-small value has just made it irrelevant.",
    14: "Appends the current index i to the back of the deque, now that everything it would dominate has been cleared out — the deque's values stay increasing from front to back.",
    16: "Checks whether i has reached at least k - 1, the first index at which a full window of size k exists.",
    17: "Reads nums[dq[0]] — the front of the deque is guaranteed to be the smallest value still inside the window — and appends it to result without rescanning the window.",
    19: "Returns the completed list of per-window minimums, one entry for every window the scan passed over.",
  },
};

export const slidingWindowMin: AlgorithmDefinition<SlidingWindowMinInput> = {
  id: "sliding-window-min",
  title: "Sliding Window Minimum",
  category: "sliding_window",
  difficulty: "Hard",
  description:
    "Finds the minimum element in every contiguous sliding window of size k by maintaining a monotonic increasing deque of candidate indices.",
  constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4", "1 <= k <= nums.length"],
  examples: [
    {
      input: "nums = [4, 2, 12, 11, 5, 8, 3, 9], k = 3",
      output: "[2, 2, 5, 5, 3, 3]",
      explanation:
        "The sliding windows of size 3 are [4,2,12]->2, [2,12,11]->2, [12,11,5]->5, [11,5,8]->5, [5,8,3]->3, [8,3,9]->3.",
    },
    {
      input: "nums = [1, -1], k = 1",
      output: "[1, -1]",
      explanation:
        "Sliding window of size 1 yields each array element itself as the window minimum.",
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
    time: "Although there are loops inside the main scan, every index is pushed onto the deque exactly once and popped at most once — either from the front when it leaves the window or from the back when a smaller value arrives. Charging each pop to the push that created it bounds the total work at about 2n deque operations, so the time is O(n) rather than O(n·k).",
    space:
      "The deque only ever holds indices from the current window, so it never grows past k entries — O(k) extra space beyond the output list.",
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
