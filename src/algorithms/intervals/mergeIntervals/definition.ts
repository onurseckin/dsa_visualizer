import type { AlgorithmDefinition } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { MERGE_INTERVALS_CODE } from "./pythonCode";
import { generateMergeIntervalsSteps, type MergeIntervalsInput } from "./stepGenerator";

export const DEFAULT_MERGE_INTERVALS_INPUT: MergeIntervalsInput = {
  intervals: [
    { start: 1, end: 3 },
    { start: 2, end: 6 },
    { start: 8, end: 10 },
    { start: 9, end: 12 },
    { start: 15, end: 18 },
    { start: 17, end: 20 },
    { start: 22, end: 25 },
    { start: 24, end: 26 },
  ],
};

const MERGE_INTERVALS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines `merge(intervals)` function entry point taking a list of `[start, end]` intervals.",
    2: "Checks if `intervals` is empty (`if not intervals:`) to handle boundary empty input.",
    3: "Returns an empty list `[]` immediately if input is empty.",
    4: "Sorts intervals by their start time `intervals.sort(key=lambda x: x[0])` in $O(N \\log N)$ time, ensuring candidate overlaps occur contiguously.",
    5: "Initializes `merged` list seeded with the first sorted interval `[intervals[0]]`.",
    6: "Loops over each `current` interval in `intervals[1:]` in sorted order.",
    7: "Retrieves `prev = merged[-1]`, the active open merged interval block.",
    8: "Evaluates overlap condition `current[0] <= prev[1]`.",
    9: "Extends active block finish coordinate `prev[1] = max(prev[1], current[1])` to encompass the overlapping interval.",
    10: "Executes `else:` branch when current interval starts strictly after active block ends (`current[0] > prev[1]`).",
    11: "Appends non-overlapping `current` interval to `merged` list as a new active block.",
    12: "Returns `merged` list containing the minimal set of disjoint intervals covering the input range.",
  },
};

export const mergeIntervals: AlgorithmDefinition<MergeIntervalsInput> = {
  id: "merge-intervals",
  title: "Merge Intervals",
  category: "two_pointers",
  categories: ["two_pointers", "intervals"],
  difficulty: "Medium",
  description:
    "Merge all overlapping intervals into a minimal set of non-overlapping intervals that cover the exact same range as the input intervals.\n\n" +
    "### Problem Overview\n" +
    "Given a collection of intervals, merge all overlapping ranges into a minimal set of disjoint intervals. Sorting intervals by start coordinate $start_i$ allows overlap detection in a single $O(N)$ linear scan after an $O(N \\log N)$ sort.\n\n" +
    "### Key Insights & Invariants\n" +
    "- **Sorting Order**: Sorting by start time $start_i$ guarantees that if interval $B$ overlaps with any prior interval, it MUST overlap with the most recently added interval in the merged list.\n" +
    "- **Overlap Condition**: Two sorted intervals $[a, b]$ and $[c, d]$ overlap if $c \\le b$. They merge into $[a, \\max(b, d)]$.\n" +
    "- **Nested Protection**: Using $\\max(b, d)$ ensures nested intervals like $[1, 10]$ and $[2, 5]$ do not shrink the merged span.\n\n" +
    "### Complexity\n" +
    "- **Time**: $O(N \\log N)$ where $N$ is the number of intervals, dominated by sorting.\n" +
    "- **Space**: $O(N)$ auxiliary space for storing the merged output list.",
  constraints: [
    "1 <= intervals.length <= 10^4",
    "intervals[i].length == 2",
    "0 <= start_i <= end_i <= 10^4",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]",
      outputDisplay: "[[1, 6], [8, 10], [15, 18]]",
      title: "Basic Example",
      input: {
        intervals: [
          { start: 1, end: 3 },
          { start: 2, end: 6 },
          { start: 8, end: 10 },
          { start: 15, end: 18 },
        ],
      },
      output: "[[1,6], [8,10], [15,18]]",
      explanation: "Intervals [1,3] and [2,6] overlap since 2 <= 3; they merge into [1,6].",
    },
    {
      kind: "complex",
      inputDisplay: "intervals = [[1, 10], [2, 3], [4, 8], [9, 12]]",
      outputDisplay: "[[1, 12]]",
      title: "Complex Edge Case",
      input: {
        intervals: [
          { start: 1, end: 10 },
          { start: 2, end: 3 },
          { start: 4, end: 8 },
          { start: 9, end: 12 },
        ],
      },
      output: "[[1,12]]",
      explanation:
        "Enclosing interval [1,10] completely contains sub-intervals [2,3] and [4,8] and merges with overlapping [9,12] into one single span [1,12].",
    },
    {
      kind: "negative",
      inputDisplay: "intervals = [[1, 2], [3, 4], [5, 6]]",
      outputDisplay: "[[1, 2], [3, 4], [5, 6]]",
      title: "Failing / Boundary Case",
      input: {
        intervals: [
          { start: 1, end: 2 },
          { start: 3, end: 4 },
          { start: 5, end: 6 },
        ],
      },
      output: "[[1,2], [3,4], [5,6]]",
      explanation:
        "Disjoint intervals with non-zero gaps between each pair; no merges occur and all intervals remain unchanged.",
    },
  ],
  code: MERGE_INTERVALS_CODE,
  timeComplexity: {
    best: "O(N log N)",
    average: "O(N log N)",
    worst: "O(N log N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Sorting the intervals by start time dominates the work at O(N log N). After that, we make a single linear pass and compare each interval only with the last merged one, which adds just O(N) more. That is why best, average, and worst case are all O(N log N) — the sort always happens.",
    space:
      "The merged output list is what grows: when nothing overlaps it holds all N intervals, so extra memory is O(N).",
  },
  topicGuide: {
    overview:
      "Interval problems come with a hidden gift: an interval is defined by two coordinates $[start_i, end_i]$, and sorting by start coordinate collapses 2D interval interaction into a 1D left-to-right sweep. Merging overlapping intervals is the foundational pattern — given a set of ranges, produce the minimal set of disjoint ranges covering the exact same points. The core technique sorts by start coordinate in $O(N \\log N)$ time, then sweeps forward in $O(N)$ time comparing each interval against the active merged block.",
    sections: [
      {
        heading: "The core idea: sorting turns pair comparison into a scan",
        body: "Unsorted, deciding which ranges overlap requires checking $O(N^2)$ candidate pairs. Sorting by start coordinate $start_i$ guarantees that as you walk forward, every remaining interval begins at or after the current block's start. Therefore, a new interval can only ever touch or extend the active block currently being built, never anything sealed off earlier. One comparison per interval suffices, reducing overlap detection from $O(N^2)$ to a single $O(N)$ linear pass.",
      },
      {
        heading: "How the sweep works: one comparison per interval",
        body: "Initialize the merged result list with the first sorted interval $[start_0, end_0]$. For each subsequent interval $[start_i, end_i]$, compare $start_i$ against the active block's end coordinate $prev.end$. If $start_i \\le prev.end$, the two intervals overlap or touch, so extend the block to $\\max(prev.end, end_i)$. Otherwise, a gap exists: seal the previous block and append $[start_i, end_i]$ as the new active block.",
      },
      {
        heading: "Why taking the maximum end is what makes it correct",
        body: "Taking the maximum end $\\max(prev.end, end_i)$ correctly handles fully nested intervals. Merging $[1, 10]$ with $[3, 4]$ must retain the finish coordinate $10$, whereas blindly copying the newer interval's end $4$ would shrink the block and lose coverage. Maintaining the invariant that the merged list remains strictly sorted and disjoint guarantees total correctness without needing a post-processing pass.",
      },
      {
        heading: "Boundary cases that decide the answer",
        body: "Boundary touching such as $[1, 4]$ and $[4, 5]$ merge into $[1, 5]$ under the inclusive comparison $start_i \\le prev.end$. Empty inputs must return an empty list `[]` immediately before accessing index $0$. Zero-length intervals where $start = end$ are valid points and merge naturally without requiring special-case filtering logic.",
      },
      {
        heading: "When to sort by start versus other approaches",
        body: "Sorting by start coordinate is optimal when generating merged output ranges in order. For point-query metrics like maximum simultaneous overlaps or meeting room count, a line-sweep event algorithm sorting start/end events is preferable. For dynamic streaming inputs where intervals arrive online, a balanced binary search tree or interval tree avoids re-sorting the full dataset.",
      },
      {
        heading: "How the pattern generalises",
        body: "This pattern extends seamlessly to related interval problems. Inserting a new interval into pre-sorted intervals skips the sort step and merges in $O(N)$ time. Finding non-overlapping interval coverage (Activity Selection) sorts by end coordinate $end_i$. Intersecting two sorted interval lists uses a two-pointer sweep to extract overlapping segments in $O(N + M)$ time.",
      },
    ],
    keyTerms: [
      {
        term: "Overlap Condition ($c \\le b$)",
        definition:
          "Two sorted intervals $[a, b]$ and $[c, d]$ overlap if and only if $c \\le b$, simplifying comparison to a single inequality.",
      },
      {
        term: "Closed Interval",
        definition:
          "An interval including both endpoints $[start, end]$, allowing touching endpoints like $[1,4]$ and $[4,5]$ to merge.",
      },
      {
        term: "Sweep Line Strategy",
        definition:
          "Processing geometric events in sorted coordinate order while maintaining a dynamic state of active intervals.",
      },
      {
        term: "Coalesce",
        definition:
          "Combining multiple overlapping or contiguous intervals into a single equivalent interval spanning $[\\min(start), \\max(end)]$.",
      },
      {
        term: "Loop Invariant",
        definition:
          "A property holding true throughout loop execution: the output list remains strictly sorted, disjoint, and equivalent in union coverage.",
      },
    ],
  },
  trivia: MERGE_INTERVALS_TRIVIA,
  leetcode: {
    id: 56,
    url: "https://leetcode.com/problems/merge-intervals/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #56",
      leetcodeId: 56,
      url: "https://leetcode.com/problems/merge-intervals/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 6",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 6,
      section: "6.2 Scheduling",
    },
  ],
  generateSteps: generateMergeIntervalsSteps,
  defaultInput: DEFAULT_MERGE_INTERVALS_INPUT,
};

export default mergeIntervals;
