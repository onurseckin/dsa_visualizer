import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { FENWICK_TREE_CODE } from "./pythonCode";
import { generateFenwickTreeSteps, type FenwickTreeInput } from "./stepGenerator";

export const DEFAULT_FENWICK_INPUT: FenwickTreeInput = {
  array: [3, 2, -1, 6, 5, 4, -3, 37],
  operations: [
    { type: "query", left: 1, right: 5 },
    { type: "update", index: 3, delta: 5 },
    { type: "query", left: 1, right: 5 },
  ],
};

const FENWICK_TREE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "A Fenwick tree, also called a binary indexed tree, is a compact array that keeps running totals of a changing sequence so you can still answer prefix-sum questions almost instantly. It exists to resolve a tension: a precomputed prefix-sum table answers queries in one step but must be rebuilt after every edit, while the raw array is trivial to edit but slow to sum. The Fenwick tree stores partial sums over cleverly chosen blocks so that any prefix is a handful of blocks and any single position belongs to only a handful of blocks. Remarkably, the entire structure is navigated with one bit trick on the index itself.",
  sections: [
    {
      heading: "The trade-off it resolves",
      body: "Consider the two obvious ways to answer the question of what the first k elements sum to. You can precompute every prefix sum, which makes queries free but forces you to rewrite the whole tail of that table whenever one element changes. Or you can keep the raw array and add up k values on demand, which makes edits free but queries slow. A Fenwick tree refuses to pick a side: it stores sums over blocks chosen so that any prefix is the disjoint union of a few blocks, and any single position sits inside only a few blocks. That symmetry between the two directions is exactly why both edits and queries stay cheap.",
    },
    {
      heading: "The lowbit decides who owns what",
      body: "Cell i of the tree stores the sum of a block that ends at position i and whose length is i & -i, the value of the lowest set bit of i. So cell 6, binary 110 with lowbit 2, covers positions 5 and 6, while cell 8, binary 1000 with lowbit 8, covers positions 1 through 8. To read a prefix sum up to i you repeatedly strip the lowbit with i -= i & -i, which walks leftward through blocks that tile the range 1 to i exactly once each. To apply a change at position i you repeatedly add the lowbit with i += i & -i, which visits precisely the cells whose blocks contain i. The two loops travel in opposite directions through the same bit structure, which is why each is only four lines long.",
    },
    {
      heading: "Why the blocks tile perfectly",
      body: "The invariant is that the blocks you reach by stripping lowbits from i have lengths matching the set bits of i, so together they cover positions 1 through i with no gap and no overlap. Stripping the lowest set bit subtracts the smallest power of two present in i, so every hop consumes one bit and the loop runs once per set bit. Update correctness is the mirror image: the cells reached by adding the lowbit are exactly the blocks that contain position i, so adding the delta to each keeps every stored block sum truthful. Because both walks agree about which block owns which position, a query issued right after an update sees the change exactly once, never twice and never zero times.",
    },
    {
      heading: "When to reach for it",
      body: "Choose a Fenwick tree when your aggregate is invertible, such as sums, counts, or XOR, and you need point updates together with prefix or range queries. It is smaller, faster in practice, and far shorter to write than a segment tree, which makes it the default tool for counting inversions, maintaining frequency tables, and order statistics over compressed values. The catch is invertibility: range sums work because you subtract the prefix ending before the left bound, but a range minimum has no subtraction, so a Fenwick tree cannot answer it in general. Once you need non-invertible merges, arbitrary range updates, or descents guided by complicated predicates, move up to a segment tree.",
    },
    {
      heading: "Indexing traps and edge cases",
      body: "The structure is one-indexed, and that is not a stylistic preference: cell 0 has a lowbit of zero, so the update loop would never advance, which is why slot 0 stays permanently unused. That means a user-facing index 0 becomes tree index 1, and a range query must subtract the prefix up to the left bound minus one, short-circuiting to zero when the left bound is already 1. Building by n separate point updates is correct but wasteful; you can instead copy the values in and let each cell push its total into cell i plus its lowbit in a single linear pass. Finally, remember the update takes a delta, not a target value, so assigning a new value means updating by the difference from the old one.",
    },
    {
      heading: "Variations built on the same trick",
      body: "Because the loops only care about combining block values, you can swap sums for XOR or counts without touching them. Two Fenwick trees side by side extend the structure to range updates with range queries: one holds a linear coefficient and the other a constant, and the pair reconstructs any prefix of the correction. Nesting the idea produces a two-dimensional Fenwick tree, where each cell of the outer tree holds an entire inner tree and rectangle sums on a grid become possible. And by walking bits from the highest downward instead of the lowest, you can binary-search inside the tree for the smallest prefix whose sum reaches a target, turning it into an order-statistics structure.",
    },
  ],
  keyTerms: [
    {
      term: "Prefix sum",
      definition:
        "The total of the first k elements of a sequence. Nearly every range question reduces to two prefix sums, since the sum over a window equals the prefix at its right end minus the prefix just before its left end.",
    },
    {
      term: "Lowbit (i & -i)",
      definition:
        "The value of the lowest set bit of i, equivalently the largest power of two dividing it. It is both the length of the block that cell i is responsible for and the step size that moves you to the next relevant cell.",
    },
    {
      term: "Responsibility range",
      definition:
        "The contiguous slice of the original array whose sum a given tree cell stores. It always ends at that cell index and contains exactly lowbit many elements.",
    },
    {
      term: "Point update",
      definition:
        "Changing a single position by a delta. In a Fenwick tree the change ripples upward through every cell whose block contains that position.",
    },
    {
      term: "Invertible aggregate",
      definition:
        "An operation that has an inverse, like addition paired with subtraction, which is what lets a window answer be assembled from two prefix answers. Minimum and maximum are not invertible, so Fenwick trees do not handle them directly.",
    },
  ],
};

const FENWICK_TREE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares the FenwickTree class — a compact array that answers prefix-sum queries and point updates in O(log n) using bit tricks on the index.",
    2: "The constructor takes the number of elements the tree will cover.",
    3: "Allocates size + 1 zeroed cells, one-indexed so index 0 is deliberately unused — it has no set bits, and the update/query hops would never move past it.",
    5: "Defines update(index, delta): applies a change at one position and ripples it through every cell whose responsibility range covers that position.",
    6: "Starts the climb at the target index — the position being changed.",
    7: "Keeps climbing as long as i is still inside the tree array.",
    8: "Folds delta into tree[i]: this cell's cached block-sum must include the change at the original index.",
    9: "Adds i's lowbit (i & -i) to jump to the next cell whose block also covers the original index — this bit trick is what keeps the climb to O(log n) cells.",
    11: "Defines query(index): returns the prefix sum of everything from position 1 up to index.",
    12: "Starts the running total at zero before folding in any blocks.",
    13: "Starts the descent at the given index.",
    14: "Keeps descending while i is still a valid, positive index — this loop also strips one bit per iteration, so it runs O(log n) times.",
    15: "Adds tree[i]'s cached block-sum into the running total — this cell owns the block ending at i.",
    16: "Subtracts i's lowbit to move to the previous, disjoint block, guaranteeing no position is ever counted twice.",
    17: "Returns the accumulated prefix sum once the descent reaches 0.",
    19: "Defines range_query(left, right): the tree only knows how to answer prefix sums, so any arbitrary range has to be built from two of them.",
    20: "Computes the range sum as query(right) minus query(left - 1) — subtracting off everything before the window cancels out whatever lies outside [left, right].",
  },
};

export const fenwickTree: AlgorithmDefinition<FenwickTreeInput> = {
  id: "fenwick-tree",
  title: "Binary Indexed Tree (Fenwick Tree)",
  category: "advanced_range_queries",
  categories: ["advanced_range_queries"],
  difficulty: "Hard",
  description:
    "A Binary Indexed Tree (Fenwick Tree) is a compact array-based structure that answers prefix-sum queries and applies point updates in O(log N) time. Each index i is responsible for a block of elements whose length equals its lowest set bit (i & -i), so updates and queries move through the array in short bit-arithmetic hops.",
  constraints: ["1 <= N <= 10^5", "1 <= Q <= 10^5", "-10^9 <= array[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      inputDisplay:
        "arr = [3, 2, -1, 6, 5, 4, -3, 37], queries = [sum(1..5), update(3, +5), sum(1..5)]",
      outputDisplay: "Query 1: 15, Query 2: 20",
      title: "Basic Example",
      input: {
        array: [3, 2, -1, 6, 5, 4, -3, 37],
        operations: [
          { type: "query", left: 1, right: 5 },
          { type: "update", index: 3, delta: 5 },
          { type: "query", left: 1, right: 5 },
        ],
      },
      output: "Query 1: 15, Query 2: 20",
      explanation:
        "Initial prefix sum up to index 5 is 3+2+(-1)+6+5 = 15. Adding 5 to index 3 updates tree elements responsibility ranges, increasing range sum to 20.",
    },
    {
      kind: "complex",
      inputDisplay: "arr = [1, 2, ..., 16], queries = [sum(1..16), update(8, +10), sum(1..16)]",
      outputDisplay: "Query 1: 136, Query 2: 146",
      title: "Complex Edge Case",
      input: {
        array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        operations: [
          { type: "query", left: 1, right: 16 },
          { type: "update", index: 8, delta: 10 },
          { type: "query", left: 1, right: 16 },
        ],
      },
      output: "Query 1: 136, Query 2: 146",
      explanation:
        "BIT over 16 elements (power of 2); updating index 8 (lowbit 8) propagates delta across high power-of-2 responsibility nodes.",
    },
    {
      kind: "negative",
      inputDisplay: "arr = [42], queries = [sum(1..1)]",
      outputDisplay: "Query: 42",
      title: "Failing / Boundary Case",
      input: {
        array: [42],
        operations: [{ type: "query", left: 1, right: 1 }],
      },
      output: "Query: 42",
      explanation:
        "Single-element array N=1 (1-indexed BIT slot 1); prefix sum directly matches single value 42.",
    },
  ],
  code: FENWICK_TREE_CODE,
  timeComplexity: {
    best: "O(log n)",
    average: "O(log n)",
    worst: "O(log n)",
  },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "Every update and prefix query walks the implicit tree by repeatedly adding or stripping the lowest set bit of the index, and an index below n has at most log n set bits to hop through. So each operation touches O(log n) cells regardless of the data — best and worst case are identical. Building the tree by inserting all n values as point updates costs O(n log n) up front.",
    space:
      "The whole structure is one flat array with a single cell per element (plus an unused slot 0), so extra memory grows linearly with the input — O(n).",
  },
  topicGuide: FENWICK_TREE_TOPIC_GUIDE,
  trivia: FENWICK_TREE_TRIVIA,
  sources: [
    {
      kind: "standard",
      label: "Standard Algorithm",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 9",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 9,
      section: "9.2 Binary indexed tree",
    },
  ],
  defaultInput: DEFAULT_FENWICK_INPUT,
  generateSteps: generateFenwickTreeSteps,
};

export default fenwickTree;
