import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { QUICK_SORT_CODE } from "./pythonCode";
import { generateQuickSortSteps } from "./stepGenerator";

const QUICK_SORT_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Quick Sort is an efficient divide-and-conquer sorting algorithm. It selects a pivot element, partitions the array so smaller elements sit to its left and larger elements sit to its right, and recursively sorts each partition in $O(N \\log N)$ average time.",
  sections: [
    {
      heading: "The core idea: place one element, split the rest",
      body: "Most quadratic sorting algorithms move elements gradually toward their destinations. Quick Sort places at least one pivot element into its final sorted position per partition step. The array is split into two independent sub-problems around the pivot $p$: elements in $[low..p-1]$ are $\\le arr[p]$, and elements in $[p+1..high]$ are $\\ge arr[p]$.",
    },
    {
      heading: "How Lomuto partitioning actually moves elements",
      body: "Lomuto partitioning picks the last element $arr[high]$ as the pivot. Pointer $i$ marks the boundary of elements $\\le pivot$, starting at $low - 1$. Pointer $j$ scans from $low$ to $high - 1$. Whenever $arr[j] \\le pivot$, $i$ increments by $1$ and $arr[i]$ swaps with $arr[j]$. Finally, $arr[i + 1]$ swaps with $arr[high]$, placing the pivot at index $i + 1$.",
    },
    {
      heading: "Why it is correct: the three-region invariant",
      body: "During partitioning, the slice is divided into three active regions: $arr[low..i] \\le pivot$, $arr[i+1..j-1] > pivot$, and $arr[j..high-1]$ unexamined. Swapping on $arr[j] \\le pivot$ maintains this invariant until all elements are partitioned.",
    },
    {
      heading: "When to reach for it versus merge sort or heap sort",
      body: "Quick Sort is preferred for in-place array sorting in RAM due to exceptional L1/L2 CPU cache locality. Use Merge Sort when stable sorting or guaranteed $O(N \\log N)$ worst-case performance is required.",
    },
    {
      heading: "Pitfalls and edge cases",
      body: "Fixed end-pivot selection suffers from $O(N^2)$ worst-case complexity on pre-sorted inputs. Randomized pivots or median-of-three mitigates this risk. Subarrays of size $\\le 1$ serve as recursive base cases.",
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
  description:
    "Quick Sort is an efficient divide-and-conquer sorting algorithm that selects a pivot element, partitions the array so smaller elements sit to its left and larger ones to its right, and recursively sorts each half.\n\n### Why It Exists & What It Solves\nDeveloped by Tony Hoare, Quick Sort solves in-place array sorting without allocating auxiliary arrays ($O(1)$ extra memory beyond call stack). It delivers superior CPU cache locality compared to Merge Sort and Heap Sort.\n\n### Step-by-Step Intuition\n1. **Pivot Selection**: Choose a pivot element (typically $arr[high]$).\n2. **Lomuto Partitioning**: Maintain boundary pointer $i = low - 1$. Scan $j$ from $low$ to $high - 1$. If $arr[j] \\le pivot$, increment $i$ and swap $arr[i]$ with $arr[j]$.\n3. **Pivot Placement**: Swap $arr[i + 1]$ with $arr[high]$. The pivot lands at $pivot\\_idx = i + 1$.\n4. **Recursion**: Recurse on $[low..pivot\\_idx - 1]$ and $[pivot\\_idx + 1..high]$.\n\n### Input & Output Contracts\n- **Input**: `arr` (`list[int]`), unsorted array of numbers.\n- **Output**: `list[int]`, sorted array in non-decreasing order.\n\n### Trade-Offs & Complexity Analysis\n- **Time Complexity**: Average/Best $\\mathcal{O}(N \\log N)$, Worst $\\mathcal{O}(N^2)$ for unbalanced pivots.\n- **Space Complexity**: $\\mathcal{O}(\\log N)$ auxiliary space for call stack frames.\n\n### Edge Cases & Constraints\n- **Base Cases**: Subarrays with $N \\le 1$ return immediately.\n- **Duplicates**: Handled non-stably by Lomuto partitioning.",
  constraints: ["1 <= arr.length <= 10^5", "-10^9 <= arr[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nums = [4, 2, 7, 1, 3]",
      outputDisplay: "[1, 2, 3, 4, 7]",
      title: "Basic Example",
      input: [6, 2, 9, 3, 7, 1, 5],
      output: "[1, 2, 3, 5, 6, 7, 9]",
      explanation:
        "Partitions around pivot 5, recursively sorting sub-arrays [1, 2, 3] and [6, 9, 7].",
    },
    {
      kind: "complex",
      inputDisplay: "nums = [9, -3, 5, 2, 6, 8, -6, 1, 3]",
      outputDisplay: "[-6, -3, 1, 2, 3, 5, 6, 8, 9]",
      title: "Complex Edge Case",
      input: [12, 4, 7, 12, 1, 9, 4, 3, 15],
      output: "[1, 3, 4, 4, 7, 9, 12, 12, 15]",
      explanation: "Handles duplicate values and larger unsorted ranges with Lomuto partitioning.",
    },
    {
      kind: "negative",
      inputDisplay: "nums = [5, 5, 5, 5]",
      outputDisplay: "[5, 5, 5, 5]",
      title: "Failing / Boundary Case",
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
