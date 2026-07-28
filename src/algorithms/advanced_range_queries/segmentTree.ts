import type { AlgorithmDefinition } from "../../types/dsa";
import type { SegmentTreeInput, SegmentTreeOperation } from "./segment_tree/types";
import { SEGMENT_TREE_CODE, DEFAULT_SEGMENT_TREE_INPUT } from "./segment_tree/types";
import { generateSegmentTreeSteps } from "./segment_tree/stepGenerator";
import { SEGMENT_TREE_TOPIC_GUIDE, SEGMENT_TREE_TRIVIA } from "./segment_tree/metadata";

export type { SegmentTreeInput, SegmentTreeOperation };
export { SEGMENT_TREE_CODE, DEFAULT_SEGMENT_TREE_INPUT, generateSegmentTreeSteps };

export const segmentTree: AlgorithmDefinition<SegmentTreeInput> = {
  id: "segment-tree",
  title: "Segment Tree (Range Sum Query & Update)",
  topicIds: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "A **Segment Tree** structures an array into a balanced binary tree of nested intervals where leaves hold individual elements and internal nodes cache interval aggregates. It supports both range queries (e.g., sum, min, max) and point updates in $O(\\log N)$ time per operation.",
  constraints: ["1 <= N <= 10^5", "1 <= Q <= 10^5", "-10^9 <= array[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "arr = [1, 3, 5, 7, 9, 11], queries = [sum(1..3), update(2, 6), sum(1..3)]",
      outputDisplay: "Query 1: 15, Query 2: 16",
      title: "Basic Example",
      input: {
        array: [1, 3, 5, 7, 9, 11],
        operations: [
          { type: "query", left: 1, right: 3 },
          { type: "update", index: 2, value: 6 },
          { type: "query", left: 1, right: 3 },
        ],
      },
      output: "Query 1: 15, Query 2: 16",
      explanation:
        "Initial sum arr[1..3] = 3+5+7 = 15. Updating arr[2] from 5 to 6 changes range sum to 3+6+7 = 16.",
    },
    {
      kind: "complex",
      inputDisplay:
        "arr = [2, 4, 6, 8, 10, 12, 14, 16], queries = [sum(0..7), update(0, 10), update(7, 20), sum(0..7)]",
      outputDisplay: "Query 1: 72, Query 2: 90",
      title: "Complex Edge Case",
      input: {
        array: [2, 4, 6, 8, 10, 12, 14, 16],
        operations: [
          { type: "query", left: 0, right: 7 },
          { type: "update", index: 0, value: 10 },
          { type: "update", index: 7, value: 20 },
          { type: "query", left: 0, right: 7 },
        ],
      },
      output: "Query 1: 72, Query 2: 90",
      explanation:
        "8-element tree full range query; updates at extreme indices 0 and 7 recompute tree internal nodes log(8) = 3 levels up.",
    },
    {
      kind: "negative",
      inputDisplay: "arr = [5], queries = [sum(0..0)]",
      outputDisplay: "Query: 5",
      title: "Failing / Boundary Case",
      input: {
        array: [5],
        operations: [{ type: "query", left: 0, right: 0 }],
      },
      output: "Query: 5",
      explanation:
        "Single-element array N=1; leaf node directly matches query range [0..0] with sum 5.",
    },
  ],
  code: SEGMENT_TREE_CODE,
  timeComplexity: {
    best: "O(log n)",
    average: "O(log n)",
    worst: "O(log n)",
  },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "Every operation starts at the root and descends, and each level halves the interval, so the tree is only about log n levels deep. An update follows a single root-to-leaf path, and a query visits at most a constant number of nodes per level because fully covered branches return their cached sum immediately — so both cost O(log n) in every case. Building the tree visits each node exactly once, which is O(n).",
    space:
      "The tree stores one cached sum per interval node; an array of size 4n safely covers every level of the (possibly uneven) binary tree, so memory grows linearly with the input — O(n).",
  },
  topicGuide: SEGMENT_TREE_TOPIC_GUIDE,
  trivia: SEGMENT_TREE_TRIVIA,
  leetcode: {
    id: 307,
    url: "https://leetcode.com/problems/range-sum-query-mutable/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #307",
      leetcodeId: 307,
      url: "https://leetcode.com/problems/range-sum-query-mutable/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 9",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 9,
      section: "9.3 Segment tree",
    },
  ],
  defaultInput: DEFAULT_SEGMENT_TREE_INPUT,
  generateSteps: generateSegmentTreeSteps,
};
