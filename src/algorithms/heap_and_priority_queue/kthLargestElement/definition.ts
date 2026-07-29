import type { AlgorithmDefinition } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { KTH_LARGEST_CODE } from "./pythonCode";
import {
  DEFAULT_KTH_LARGEST_INPUT,
  generateKthLargestSteps,
  type KthLargestInput,
} from "./stepGenerator";

export { DEFAULT_KTH_LARGEST_INPUT };

const KTH_LARGEST_ELEMENT_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports the heap module, which backs every min-heap operation this algorithm relies on.",
    2: "Blank line separating module import from function definition.",
    3: "Defines the function that returns the Kth largest value from an unsorted array.",
    4: "Starts an empty min-heap that will be capped at size k, holding only the k largest values seen so far.",
    5: "Processes every number exactly once, in a single left-to-right pass.",
    6: "Adds the current number to the heap, where it sifts into position so the smallest candidate always ends up at the root.",
    7: "Checks whether the heap has grown one entry past its intended capacity of k.",
    8: "Evicts the smallest value in the heap, since once k + 1 candidates are present, that minimum can't be among the k largest.",
    9: "After every number has passed through the filter, the heap holds exactly the k largest values, and its root — the smallest of that group — is precisely the Kth largest.",
  },
};

export const kthLargestElement: AlgorithmDefinition<KthLargestInput> = {
  id: "kth-largest-element",
  title: "Kth Largest Element in an Array",
  topicIds: ["heap_and_priority_queue"],
  difficulty: "Medium",
  description: `<p>Given an unsorted array of integers <code>nums</code> and an integer <code>k</code>, return the <em>k</em>-th largest element in the array.</p>
<h3>Problem Statement</h3>
<p>Given an unsorted array of integers <code>nums</code> and an integer <code>k</code>, return the <em>k</em>-th largest element in the array. Note that it is the <em>k</em>-th largest element in sorted order, not the <em>k</em>-th distinct element (duplicate values are counted individually).</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>nums</code>: Unsorted array of <em>N</em> integers.</li>
  <li><code>k</code>: Target rank integer (1 &le; <em>k</em> &le; <em>N</em>).</li>
</ul>
<h3>Output</h3>
<p>Returns the integer value corresponding to the <em>k</em>-th largest element in sorted order.</p>
<h3>Constraints &amp; Edge Cases</h3>
<ul>
  <li><code>1 &le; k &le; nums.length &le; 10<sup>5</sup></code>.</li>
  <li><code>-10<sup>4</sup> &le; nums[i] &le; 10<sup>4</sup></code>.</li>
  <li>Single element array (<em>N = 1, k = 1</em>) returns <code>nums[0]</code>.</li>
  <li>Duplicate elements are counted as distinct occurrences.</li>
</ul>`,
  constraints: [
    "1 <= k <= nums.length <= 10^5",
    "-10^4 <= nums[i] <= 10^4",
    "Duplicate elements are counted as distinct occurrences",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "nums = [3, 2, 1, 5, 6, 4], k = 2",
      outputDisplay: "5",
      title: "Standard Bounded Min-Heap Search",
      input: DEFAULT_KTH_LARGEST_INPUT,
      output: "5",
      explanation:
        "Sorting the array gives [1,2,3,4,5,6]. Min-heap of size 2 maintains [5, 6], with root 5 being the 2nd largest.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "nums = [3, 2, 3, 1, 2, 4, 5, 5, 6], k = 4",
      outputDisplay: "4",
      title: "Adversarial Duplicates & Larger K Rank",
      input: { nums: [3, 2, 3, 1, 2, 4, 5, 5, 6], k: 4 },
      output: "4",
      explanation:
        "Handles duplicate elements correctly. Min-heap of size 4 retains [4, 5, 5, 6] with root 4.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "nums = [7], k = 1",
      outputDisplay: "7",
      title: "Boundary Single Element Case",
      input: { nums: [7], k: 1 },
      output: "7",
      explanation:
        "Boundary input array of length 1 with k=1 directly returns the single element 7.",
    },
  ],
  code: KTH_LARGEST_CODE,
  timeComplexity: {
    best: "O(N log K)",
    average: "O(N log K)",
    worst: "O(N log K)",
  },
  spaceComplexity: "O(K)",
  complexityAnalysis: {
    time: "We push each of the N array elements into a heap that never grows past K entries, and every push or pop on a heap that small costs O(log K) sift work. N elements times an O(log K) heap operation apiece gives O(N log K) — noticeably cheaper than fully sorting the array when K is small compared to N.",
    space:
      "The min-heap is capped at K elements — the moment it reaches K + 1 we evict the root — so extra memory is O(K), independent of the array's length.",
  },
  topicGuide: {
    overview:
      "<p>Selection problems ask for a specific rank rather than a full ordering. Maintaining a bounded min-heap of capacity <em>k</em> ensures the root always contains the <em>k</em>-th largest value seen so far, executing in <em>O(N log k)</em> time and <em>O(k)</em> auxiliary space.</p>",
    sections: [
      {
        heading: "Asking for a rank, not an order",
        body: "<p>Full array sorting computes every rank, which is unnecessary when only the <em>k</em>-th largest value is needed. A min-heap of size <em>k</em> keeps the current top <em>k</em> candidates, exposing the smallest among them (the <em>k</em>-th largest) at the root in <em>O(1)</em> time.</p>",
      },
      {
        heading: "How the bounded heap operates",
        body: "<p>As elements are processed, each number is pushed into the min-heap. When the heap size exceeds <em>k</em>, the smallest element is evicted from the root via <code>heappop</code>. This keeps the memory bounded strictly to <em>k</em> elements.</p>",
      },
      {
        heading: "The invariant that makes the root the answer",
        body: "<p>At any stage, the min-heap maintains the <em>k</em> largest elements observed so far. Because it is a min-heap, its root is guaranteed to be the minimum among those <em>k</em> largest elements, which corresponds directly to the rank boundary.</p>",
      },
      {
        heading: "Duplicates, capacity, and other edges",
        body: "<p>Duplicate values are treated as distinct elements. Bounded heaps handle duplicate values naturally without requiring deduplication. When <em>k = 1</em>, the algorithm effectively computes the maximum; when <em>k = N</em>, it returns the global minimum.</p>",
      },
      {
        heading: "Choosing among sorting, quickselect, and the heap",
        body: "<p>Sorting takes <em>O(N log N)</em> time, Quickselect averages <em>O(N)</em> time in memory but requires modifying the input array, while a bounded min-heap is optimal for streaming data or when memory must be capped to <em>O(k)</em>.</p>",
      },
      {
        heading: "The pattern behind every top-K problem",
        body: "<p>Bounded min-heaps form the foundation of streaming Top-K filters, including K closest points, K most frequent elements, and merging K sorted streams.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Min-heap",
        definition:
          "A complete binary tree structure where every parent node is less than or equal to its children, placing the global minimum at the root.",
      },
      {
        term: "Bounded heap",
        definition:
          "A heap constrained to a maximum capacity k by evicting its root whenever size exceeds k.",
      },
      {
        term: "Selection problem",
        definition:
          "Finding an element of a specific rank (such as the k-th largest) without fully sorting the input array.",
      },
    ],
  },
  trivia: KTH_LARGEST_ELEMENT_TRIVIA,
  leetcode: {
    id: 215,
    url: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #215",
      leetcodeId: 215,
      url: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 4",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 4,
      section: "4.5 Priority queue",
    },
  ],
  generateSteps: generateKthLargestSteps,
  defaultInput: DEFAULT_KTH_LARGEST_INPUT,
};

export default kthLargestElement;
