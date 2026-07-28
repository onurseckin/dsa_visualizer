import type { AlgorithmDefinition } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { KTH_LARGEST_CODE } from "./pythonCode";
import { generateKthLargestSteps, type KthLargestInput } from "./stepGenerator";

export const DEFAULT_KTH_LARGEST_INPUT: KthLargestInput = {
  nums: [3, 2, 1, 5, 6, 4],
  k: 2,
};

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
  description:
    "Find the $k$-th largest element in an unsorted array of numbers in $O(N \\log k)$ time and $O(k)$ memory using a min-heap of fixed capacity $k$.\n\n### Problem Statement\nGiven an unsorted array of integers `nums` and an integer `k`, return the $k$-th largest element in the array. Note that it is the $k$-th largest element in sorted order, not the $k$-th distinct element (duplicate values are counted individually).\n\nThe algorithm maintains a min-heap of capacity $k$. As elements are processed, each number is pushed into the min-heap. If the heap size exceeds $k$, the root element (the smallest candidate among the top $k+1$) is evicted via `heappop`. Once all $N$ elements are processed, the root of the min-heap contains the smallest value among the $k$ largest elements—which is precisely the $k$-th largest element.\n\n### Input Parameters\n- `nums`: Unsorted array of $N$ integers.\n- `k`: Rank position integer ($1 \\le k \\le N$).\n\n### Output\n- Returns the integer value corresponding to the $k$-th largest element.\n\n### Constraints & Edge Cases\n- `1 <= k <= nums.length <= 10^5`.\n- `-10^4 <= nums[i] <= 10^4`.\n- Single element array ($N=1, k=1$): Returns `nums[0]`.\n- Duplicates present (e.g. `nums = [3, 2, 3, 1, 2, 4, 5, 5, 6], k = 4`): Handled correctly, outputting `4`.",
  constraints: [
    "1 <= k <= nums.length <= 10^5",
    "-10^4 <= nums[i] <= 10^4",
    "Duplicate elements are counted as distinct occurrences",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "nums = [3, 2, 1, 5, 6, 4], k = 2",
      outputDisplay: "5",
      title: "Basic Example",
      input: { nums: [3, 2, 1, 5, 6, 4], k: 2 },
      output: "5",
      explanation:
        "Sorting the array gives [1,2,3,4,5,6]. Min-heap of size 2 maintains [5, 6], with root 5 being the 2nd largest.",
    },
    {
      kind: "complex",
      inputDisplay: "nums = [3, 2, 3, 1, 2, 4, 5, 5, 6], k = 4",
      outputDisplay: "4",
      title: "Complex Edge Case",
      input: { nums: [3, 2, 3, 1, 2, 4, 5, 5, 6], k: 4 },
      output: "4",
      explanation:
        "Handles duplicate elements correctly. Min-heap of size 4 retains [4, 5, 5, 6] with root 4.",
    },
    {
      kind: "negative",
      inputDisplay: "nums = [7, 10, 4, 3, 20, 15], k = 6",
      outputDisplay: "3",
      title: "Failing / Boundary Case",
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
      "Selection problems ask for a rank rather than a full ordering: you want the $k$-th largest value, not a completely sorted array, and computing the whole ordering is doing far more work than required.\n\nIn real-world ML systems and data infrastructure, bounded min-heaps drive essential pipelines: PyTorch and vLLM inference engines use Top-K filtering during LLM logit sampling to bound candidate token selection before softmax normalization; database query engines (PostgreSQL/MySQL) execute `ORDER BY column DESC LIMIT k` using heap-based priority queues to avoid full $O(N \\log N)$ disk sorts; and real-time streaming analytics maintain running Top-K frequency metrics in memory.",
    sections: [
      {
        heading: "Asking for a rank, not an order",
        body: "Sorting the array answers the question, but it also answers every other rank question you did not ask, and you pay for all of them. Step back and notice that only two facts actually matter: whether a given number belongs to the top K seen so far, and which member of that group is the weakest. A min-heap reports its minimum at the root in constant time, so if you keep exactly the top K values in a min-heap then its root is the Kth largest. The part that feels backwards at first is using a min-heap to answer a maximum-flavoured question, and the reason is that the operation you need to be fast is throwing away the smallest survivor, not finding the largest.",
      },
      {
        heading: "How the bounded heap operates",
        body: "You walk the array once and push every number into the heap, and immediately after each push you check whether the size has exceeded K, popping the root if it has. A heap is a complete binary tree kept flat in an array, so a push places the value at the end and sifts it up along a single root-to-leaf path until its parent is no larger, and a pop moves the last element to the root and sifts it down the same way. The root is always the weakest member of the current top-K club, which is exactly the right candidate to evict when a stronger number shows up. A small refinement is to peek before pushing and skip numbers that are already smaller than the root, which produces the same answer with less sifting.",
      },
      {
        heading: "The invariant that makes the root the answer",
        body: "After processing the first i numbers the heap holds min(i, K) of them, and once i has reached K it holds precisely the K largest of those i values with the smallest of them sitting at the root. The step that preserves this is the eviction: at the moment you pop, the heap contains K plus one candidates, and the element you remove is the minimum of that set, so it cannot possibly be among the K largest of it — discarding it is always safe and never throws away a needed value. Because each step preserves the property, the property still holds when i reaches N, which says the heap contains the K largest values in the entire array. Its root is the smallest of those K, and the smallest of the top K is by definition the Kth largest overall.",
      },
      {
        heading: "Duplicates, capacity, and other edges",
        body: "Kth largest means Kth in sorted order with duplicates counted individually, not the Kth distinct value, so for [5, 5, 4] with K equal to two the answer is 5 — and the bounded heap gets this right for free because it never deduplicates anything. The comparison that caps the heap must be size greater than K, not greater than or equal, since a heap holding exactly K entries is at its intended capacity; getting that wrong shifts every answer by one rank. When K equals the array length the answer is the array minimum, and the heap simply never evicts anything, which is a good sanity check to trace. An empty array, or a K larger than the array, has no answer at all and belongs in an up-front validation rather than in the loop.",
      },
      {
        heading: "Choosing among sorting, quickselect, and the heap",
        body: "A full sort is the simplest thing that works and is perfectly reasonable for small or one-off inputs, and it hands you every rank rather than one. Quickselect partitions the array around a pivot and recurses into only the side containing the target rank, averaging linear time, which makes it the fastest choice when the whole array is already in memory and you need a single rank — at the cost of reordering your data and a quadratic worst case unless you randomise the pivot. When the values live in a small fixed range, counting them into buckets beats both. The bounded heap earns its place when N is enormous or unbounded, when memory must stay proportional to K rather than to the input, or when you want the whole top-K collection instead of just the value on its boundary.",
      },
      {
        heading: "The pattern behind every top-K problem",
        body: "Keep the same skeleton and change only what you compare, and the bounded heap solves a long list of problems: the K closest points to the origin with the heap keyed on distance and the farthest point evicted, the K most frequent elements with the heap keyed on a count computed in a first pass, and the K smallest pairs across two sorted arrays. Merging K sorted lists is the mirror image — a heap sized by the number of lists rather than by K, holding one head per list. The shape to recognise is a stream of candidates, a fixed-capacity heap holding the current survivors, and an eviction rule that always fires at the root. Once you see that shape, choosing between a min-heap and a max-heap is just asking which end you need to discard from.",
      },
    ],
    keyTerms: [
      {
        term: "Min-heap",
        definition:
          "A complete binary tree, usually stored in a flat array, in which every parent is no larger than its children. That single rule guarantees the overall minimum sits at the root, reachable in constant time.",
      },
      {
        term: "Sift up and sift down",
        definition:
          "The repair operations that restore the heap property after an insertion or a removal by swapping an element along one path between root and leaf. They are why a push or pop costs logarithmic rather than linear work.",
      },
      {
        term: "Bounded heap",
        definition:
          "A heap that is never allowed to exceed a fixed capacity, here K, because it evicts its root as soon as it overflows. It behaves as a running filter that keeps the best K items seen so far.",
      },
      {
        term: "Selection problem",
        definition:
          "The task of finding the element of a given rank, such as the median or the Kth largest, without necessarily sorting. It is strictly easier than sorting, and good solutions exploit that.",
      },
      {
        term: "Quickselect",
        definition:
          "A partition-based selection algorithm that repeatedly splits the array around a pivot and recurses only into the half holding the target rank. It averages linear time in memory but mutates the array and degrades if pivots are chosen badly.",
      },
      {
        term: "Streaming",
        definition:
          "A setting where items arrive one at a time and you cannot store them all, so an algorithm may only keep bounded state. Bounded heaps are the canonical top-K answer under that constraint.",
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
