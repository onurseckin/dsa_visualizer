import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { QUICK_SORT_CODE } from "./pythonCode";
import { generateQuickSortSteps } from "./stepGenerator";

const QUICK_SORT_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Quick Sort is an efficient divide-and-conquer sorting algorithm. It selects a pivot element, partitions the array so smaller elements sit to its left and larger elements sit to its right, and recursively sorts each partition in <code>O(N log N)</code> average time.</p>",
  sections: [
    {
      heading: "The core idea: place one element, split the rest",
      body: "<p>Most quadratic sorting algorithms move elements gradually toward their destinations. Quick Sort places at least one pivot element into its final sorted position per partition step. The array is split into two independent sub-problems around the pivot <code>p</code>: elements in <code>[low &hellip; p-1]</code> are <code>&le; arr[p]</code>, and elements in <code>[p+1 &hellip; high]</code> are <code>&ge; arr[p]</code>.</p>",
    },
    {
      heading: "How Lomuto partitioning actually moves elements",
      body: "<p>Lomuto partitioning picks the last element <code>arr[high]</code> as the pivot. Pointer <code>i</code> marks the boundary of elements <code>&le; pivot</code>, starting at <code>low - 1</code>. Pointer <code>j</code> scans from <code>low</code> to <code>high - 1</code>. Whenever <code>arr[j] &le; pivot</code>, <code>i</code> increments by 1 and <code>arr[i]</code> swaps with <code>arr[j]</code>. Finally, <code>arr[i + 1]</code> swaps with <code>arr[high]</code>, placing the pivot at index <code>i + 1</code>.</p>",
    },
    {
      heading: "Why it is correct: the three-region invariant",
      body: "<p>During partitioning, the slice is divided into three active regions: <code>arr[low &hellip; i] &le; pivot</code>, <code>arr[i+1 &hellip; j-1] &gt; pivot</code>, and <code>arr[j &hellip; high-1]</code> unexamined. Swapping on <code>arr[j] &le; pivot</code> maintains this invariant until all elements are partitioned.</p>",
    },
    {
      heading: "When to reach for it versus merge sort or heap sort",
      body: "<p>Quick Sort is preferred for in-place array sorting in RAM due to exceptional L1/L2 CPU cache locality. Use Merge Sort when stable sorting or guaranteed <code>O(N log N)</code> worst-case performance is required.</p>",
    },
    {
      heading: "Pitfalls and edge cases",
      body: "<p>Fixed end-pivot selection suffers from <code>O(N<sup>2</sup>)</code> worst-case complexity on pre-sorted inputs. Randomized pivots or median-of-three mitigates this risk. Subarrays of size <code>&le; 1</code> serve as recursive base cases.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Pivot",
      definition:
        "The element chosen to partition the array. It reaches its final sorted index at the end of the partition phase.",
    },
    {
      term: "Lomuto Partition",
      definition:
        "A single-direction two-pointer partitioning scheme using boundary index i and scanner index j.",
    },
    {
      term: "Divide and Conquer",
      definition:
        "Breaking a problem into independent sub-problems, solving recursively, and combining results in-place.",
    },
  ],
};

const QUICK_SORT_TRIVIA: TriviaMeta = {
  skipLines: [1, 6, 7],
  distractors: [
    "if arr[j] > pivot:",
    "arr[i], arr[j] = arr[j], arr[i]",
    "pivot = arr[low]",
    "return i",
    "quick_sort(arr, low, pivot_idx)",
  ],
  lineExplanations: {
    1: "Declares recursive quick_sort function operating on array slice bounded by low and high indices.",
    2: "Guards recursion: if low < high, the sub-array contains 2 or more elements and requires partitioning.",
    3: "Calls partition helper to rearrange slice around a pivot and return its final sorted index.",
    4: "Recursively sorts left sub-array from index low to pivot_idx - 1.",
    5: "Recursively sorts right sub-array from index pivot_idx + 1 to high.",
    6: "Blank line separating quick_sort function from partition helper definition.",
    7: "Declares partition helper: rearranges slice arr[low..high] around pivot arr[high] and returns pivot's resting index.",
    8: "Selects rightmost element arr[high] as pivot value.",
    9: "Initializes boundary index i = low - 1 for elements less than or equal to pivot.",
    10: "Scans index j from low up to high - 1 to examine each element in the slice.",
    11: "Checks if element arr[j] is less than or equal to pivot value.",
    12: "Increments boundary pointer i by 1 (i += 1) to make room for element arr[j].",
    13: "Swaps arr[i] and arr[j] to move smaller/equal element into left partition.",
    14: "Swaps pivot arr[high] with arr[i + 1] to place pivot between left and right partitions.",
    15: "Returns pivot's final sorted index i + 1.",
  },
};

export const quickSort: AlgorithmDefinition<number[]> = {
  id: "quick-sort",
  title: "Quick Sort",
  topicIds: ["two_pointers"],
  difficulty: "Medium",
  description: `<p>Given an array of integers <code>nums</code>, sort the array in non-decreasing order.</p>
<h3>Problem Statement</h3>
<p>Given an unsorted array of integers <code>nums</code>, return the array sorted in ascending (non-decreasing) order.</p>
<h3>Input Parameters</h3>
<ul>
  <li><code>nums</code>: An unsorted array of integers.</li>
</ul>
<h3>Output</h3>
<p>Returns the array sorted in non-decreasing order.</p>
<h3>Constraints &amp; Edge Cases</h3>
<ul>
  <li><code>1 &le; nums.length &le; 10<sup>5</sup></code>.</li>
  <li><code>-10<sup>9</sup> &le; nums[i] &le; 10<sup>9</sup></code>.</li>
  <li>Single element array returns array as-is.</li>
  <li>Handles duplicate elements.</li>
</ul>`,
  constraints: ["1 <= arr.length <= 10^5", "-10^9 <= arr[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "nums = [6, 2, 9, 3, 7, 1, 5]",
      outputDisplay: "[1, 2, 3, 5, 6, 7, 9]",
      title: "Standard 7-Element Unsorted Array",
      input: [6, 2, 9, 3, 7, 1, 5],
      output: "[1, 2, 3, 5, 6, 7, 9]",
      explanation:
        "Partitions around pivot 5, recursively sorting sub-arrays [1, 2, 3] and [6, 9, 7].",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "nums = [12, 4, 7, 12, 1, 9, 4, 3, 15]",
      outputDisplay: "[1, 3, 4, 4, 7, 9, 12, 12, 15]",
      title: "Adversarial Duplicate Values Array",
      input: [12, 4, 7, 12, 1, 9, 4, 3, 15],
      output: "[1, 3, 4, 4, 7, 9, 12, 12, 15]",
      explanation: "Handles duplicate values and larger unsorted ranges with Lomuto partitioning.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "nums = [1, 2, 3, 4, 5]",
      outputDisplay: "[1, 2, 3, 4, 5]",
      title: "Boundary Already Sorted Array",
      input: [1, 2, 3, 4, 5],
      output: "[1, 2, 3, 4, 5]",
      explanation: "Already sorted array; partitioning still runs but no elements need swapping.",
    },
  ],
  code: QUICK_SORT_CODE,
  timeComplexity: {
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n²)",
  },
  spaceComplexity: "O(log n)",
  complexityAnalysis: {
    time: "Each partition pass touches every element in its slice once, and when pivots land near the middle the slices roughly halve at every level, giving about log n levels of n work each — O(n log n) on average. If the pivot keeps landing at an extreme, one side of every split is empty and time degrades to O(n²).",
    space:
      "The sorting happens in place; memory is spent on recursion stack frames — O(log n) average depth.",
  },
  topicGuide: QUICK_SORT_TOPIC_GUIDE,
  trivia: QUICK_SORT_TRIVIA,
  sources: [
    {
      kind: "standard",
      label: "Standard Algorithm",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 3",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 3,
      section: "3.1 Sorting theory",
    },
  ],
  defaultInput: [6, 2, 9, 3, 7, 1, 5],
  generateSteps: generateQuickSortSteps,
};

export default quickSort;
