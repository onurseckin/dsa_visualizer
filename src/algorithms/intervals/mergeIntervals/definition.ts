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
  topicIds: ["two_pointers", "intervals"],
  difficulty: "Medium",
  description:
    "<p>Merge all overlapping intervals into a minimal set of non-overlapping intervals that cover the exact same range as the input intervals.</p>" +
    "<h3>Problem Overview</h3>" +
    "<p>Given a collection of intervals, merge all overlapping ranges into a minimal set of disjoint intervals. Sorting intervals by start coordinate <code>start_i</code> allows overlap detection in a single <span>O(N)</span> linear scan after an <span>O(N log N)</span> sort.</p>" +
    "<h3>Key Insights &amp; Invariants</h3>" +
    "<ul><li><strong>Sorting Order:</strong> Sorting by start time guarantees that if interval B overlaps with any prior interval, it MUST overlap with the most recently added interval in the merged list.</li>" +
    "<li><strong>Overlap Condition:</strong> Two sorted intervals <code>[a, b]</code> and <code>[c, d]</code> overlap if <code>c &le; b</code>. They merge into <code>[a, max(b, d)]</code>.</li>" +
    "<li><strong>Nested Protection:</strong> Using <code>max(b, d)</code> ensures nested intervals like <code>[1, 10]</code> and <code>[2, 5]</code> do not shrink the merged span.</li></ul>" +
    "<h3>Complexity</h3>" +
    "<ul><li><strong>Time:</strong> <span>O(N log N)</span> where N is the number of intervals, dominated by sorting.</li>" +
    "<li><strong>Space:</strong> <span>O(N)</span> auxiliary space for storing the merged output list.</li></ul>",
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
      "<p>Interval problems come with a structural advantage: an interval is defined by two coordinates <code>[start_i, end_i]</code>, and sorting by start coordinate collapses 2D interval interaction into a 1D left-to-right sweep. Merging overlapping intervals is the foundational pattern — given a set of ranges, produce the minimal set of disjoint ranges covering the exact same points. The core technique sorts by start coordinate in <span>O(N log N)</span> time, then sweeps forward in <span>O(N)</span> time comparing each interval against the active merged block.</p>",
    sections: [
      {
        heading: "The core idea: sorting turns pair comparison into a scan",
        body: "<p>Unsorted, deciding which ranges overlap requires checking <span>O(N&sup2;)</span> candidate pairs. Sorting by start coordinate <code>start_i</code> guarantees that as you walk forward, every remaining interval begins at or after the current block's start. Therefore, a new interval can only ever touch or extend the active block currently being built, never anything sealed off earlier. One comparison per interval suffices, reducing overlap detection from <span>O(N&sup2;)</span> to a single <span>O(N)</span> linear pass.</p>",
      },
      {
        heading: "How the sweep works: one comparison per interval",
        body: "<p>Initialize the merged result list with the first sorted interval <code>[start_0, end_0]</code>. For each subsequent interval <code>[start_i, end_i]</code>, compare <code>start_i</code> against the active block's end coordinate <code>prev.end</code>. If <code>start_i &le; prev.end</code>, the two intervals overlap or touch, so extend the block to <code>max(prev.end, end_i)</code>. Otherwise, a gap exists: seal the previous block and append <code>[start_i, end_i]</code> as the new active block.</p>",
      },
      {
        heading: "Why taking the maximum end is what makes it correct",
        body: "<p>Taking the maximum end <code>max(prev.end, end_i)</code> correctly handles fully nested intervals. Merging <code>[1, 10]</code> with <code>[3, 4]</code> must retain the finish coordinate <code>10</code>, whereas blindly copying the newer interval's end <code>4</code> would shrink the block and lose coverage. Maintaining the invariant that the merged list remains strictly sorted and disjoint guarantees total correctness without needing a post-processing pass.</p>",
      },
      {
        heading: "Boundary cases that decide the answer",
        body: "<p>Boundary touching such as <code>[1, 4]</code> and <code>[4, 5]</code> merge into <code>[1, 5]</code> under the inclusive comparison <code>start_i &le; prev.end</code>. Empty inputs must return an empty list <code>[]</code> immediately before accessing index 0. Zero-length intervals where <code>start = end</code> are valid points and merge naturally without requiring special-case filtering logic.</p>",
      },
      {
        heading: "When to sort by start versus other approaches",
        body: "<p>Sorting by start coordinate is optimal when generating merged output ranges in order. For point-query metrics like maximum simultaneous overlaps or meeting room count, a line-sweep event algorithm sorting start/end events is preferable. For dynamic streaming inputs where intervals arrive online, a balanced binary search tree or interval tree avoids re-sorting the full dataset.</p>",
      },
      {
        heading: "How the pattern generalises",
        body: "<p>This pattern extends seamlessly to related interval problems. Inserting a new interval into pre-sorted intervals skips the sort step and merges in <span>O(N)</span> time. Finding non-overlapping interval coverage (Activity Selection) sorts by end coordinate <code>end_i</code>. Intersecting two sorted interval lists uses a two-pointer sweep to extract overlapping segments in <span>O(N + M)</span> time.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Overlap Condition (c <= b)",
        definition:
          "Two sorted intervals [a, b] and [c, d] overlap if and only if c <= b, simplifying comparison to a single inequality.",
      },
      {
        term: "Closed Interval",
        definition:
          "An interval including both endpoints [start, end], allowing touching endpoints like [1,4] and [4,5] to merge.",
      },
      {
        term: "Sweep Line Strategy",
        definition:
          "Processing geometric events in sorted coordinate order while maintaining a dynamic state of active intervals.",
      },
      {
        term: "Coalesce",
        definition:
          "Combining multiple overlapping or contiguous intervals into a single equivalent interval spanning [min(start), max(end)].",
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
