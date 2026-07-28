import type { AlgorithmDefinition } from "../../types/dsa";
import type { SegmentTreeLazyInput, LazySegmentTreeOperation } from "./segment_tree_lazy/types";
import { SEGMENT_TREE_LAZY_CODE, DEFAULT_SEGMENT_TREE_LAZY_INPUT } from "./segment_tree_lazy/types";
import { generateSegmentTreeLazySteps } from "./segment_tree_lazy/stepGenerator";
import {
  SEGMENT_TREE_LAZY_TOPIC_GUIDE,
  SEGMENT_TREE_LAZY_TRIVIA,
} from "./segment_tree_lazy/metadata";

export type { SegmentTreeLazyInput, LazySegmentTreeOperation };
export { SEGMENT_TREE_LAZY_CODE, DEFAULT_SEGMENT_TREE_LAZY_INPUT, generateSegmentTreeLazySteps };

export const segmentTreeLazy: AlgorithmDefinition<SegmentTreeLazyInput> = {
  id: "segment-tree-lazy",
  title: "Segment Tree (Lazy Propagation)",
  topicIds: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "A **Segment Tree with Lazy Propagation** supports both range updates and range sum queries in $O(\\log N)$ time per operation. By deferring updates to child subtrees via pending lazy tags and pushing them down strictly on demand, it avoids touching individual leaves during range modifications.",
  constraints: ["1 <= N <= 10^5", "1 <= Q <= 10^5", "-10^9 <= val <= 10^9"],
  examples: [
    {
      kind: "basic",
      inputDisplay:
        "arr = [1, 2, 3, 4, 5], queries = [sum(1..3), rangeUpdate(1..3, +5), sum(1..3)]",
      outputDisplay: "Query 1: 9, Query 2: 24",
      title: "Basic Example",
      input: {
        array: [1, 2, 3, 4, 5],
        operations: [
          { type: "rangeQuery", left: 1, right: 3 },
          { type: "rangeUpdate", left: 1, right: 3, value: 5 },
          { type: "rangeQuery", left: 1, right: 3 },
        ],
      },
      output: "Query 1: 9, Query 2: 24",
      explanation:
        "Initial sum arr[1..3] = 2+3+4 = 9. Adding 5 to range [1..3] updates 3 elements by 5 (+15 total), giving new sum 24.",
    },
    {
      kind: "complex",
      inputDisplay:
        "arr = [10, 20, 30, 40, 50, 60, 70, 80], queries = [rangeUpdate(0..7, +10), rangeUpdate(2..5, +5), sum(0..7)]",
      outputDisplay: "Query: 460",
      title: "Complex Edge Case",
      input: {
        array: [10, 20, 30, 40, 50, 60, 70, 80],
        operations: [
          { type: "rangeUpdate", left: 0, right: 7, value: 10 },
          { type: "rangeUpdate", left: 2, right: 5, value: 5 },
          { type: "rangeQuery", left: 0, right: 7 },
        ],
      },
      output: "Query: 460",
      explanation:
        "Layered range updates propagate lazy tags down tree levels upon broad range queries.",
    },
    {
      kind: "negative",
      inputDisplay: "arr = [7], queries = [rangeUpdate(0..0, +3), sum(0..0)]",
      outputDisplay: "Query: 10",
      title: "Failing / Boundary Case",
      input: {
        array: [7],
        operations: [
          { type: "rangeUpdate", left: 0, right: 0, value: 3 },
          { type: "rangeQuery", left: 0, right: 0 },
        ],
      },
      output: "Query: 10",
      explanation:
        "N=1 single-element array; lazy tags apply directly to leaf node [0..0] without child pushdown.",
    },
  ],
  code: SEGMENT_TREE_LAZY_CODE,
  timeComplexity: {
    best: "O(log n)",
    average: "O(log n)",
    worst: "O(log n)",
  },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "A range update no longer visits every element in the range: once a node's interval fits entirely inside the update, we adjust its sum, leave a lazy tag, and stop descending. Each level halves the interval, so both range updates and range queries touch only O(log n) nodes; pending tags get pushed down one level at a time as later operations pass through. Building the tree once up front is O(n).",
    space:
      "We keep two arrays of about 4n entries each — the interval sums and their lazy tags — so memory grows linearly with the input, O(n).",
  },
  topicGuide: SEGMENT_TREE_LAZY_TOPIC_GUIDE,
  trivia: SEGMENT_TREE_LAZY_TRIVIA,
  sources: [
    {
      kind: "standard",
      label: "Standard Algorithm",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 28",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 28,
      section: "28.1 Lazy propagation",
    },
  ],
  defaultInput: DEFAULT_SEGMENT_TREE_LAZY_INPUT,
  generateSteps: generateSegmentTreeLazySteps,
};
