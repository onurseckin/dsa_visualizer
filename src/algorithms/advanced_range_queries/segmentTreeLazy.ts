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
  category: "advanced_range_queries",
  difficulty: "Hard",
  description:
    "A Segment Tree with Lazy Propagation supports both range updates and range sum queries in O(log N) time. Instead of touching every element in an updated range, it records the pending change as a lazy tag on the highest covering nodes and pushes those tags down only when a later query or update actually walks into the affected subtree.",
  constraints: ["1 <= N <= 10^5", "1 <= Q <= 10^5", "-10^9 <= val <= 10^9"],
  examples: [
    {
      input:
        "array = [1, 2, 3, 4, 5], operations = [Range Query [1..3], Range Update [1..3] += 5, Range Query [1..3]]",
      output: "Query 1: 9, Query 2: 24",
      explanation:
        "Initial sum arr[1..3] = 2+3+4 = 9. Adding 5 to range [1..3] updates 3 elements by 5 (+15 total), giving new sum 24.",
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

export default segmentTreeLazy;
