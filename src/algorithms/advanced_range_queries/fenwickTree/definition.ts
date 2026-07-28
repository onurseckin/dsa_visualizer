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
    "A **Fenwick Tree** (also known as a **Binary Indexed Tree**, or **BIT**) is a remarkably space-efficient data structure for maintaining dynamic prefix sums of a sequence. It supports both point updates and prefix sum queries in $O(\\log N)$ time while requiring only $O(N)$ space stored in a single flat array without any pointer overhead. The key innovation relies on bitwise arithmetic—specifically the lowbit operation $i \\& -i$—to partition responsibility ranges and traverse an implicit tree structure.",
  sections: [
    {
      heading: "1. The Range Query vs Point Update Dilemma",
      body: "When dealing with dynamic range query problems over an array of size $N$:\n\n- **Naive Flat Array**: Point updates take $O(1)$ time, but range sum queries require iterating through elements in $O(N)$ time.\n- **Prefix Sum Array**: Range queries take $O(1)$ time via $P[R] - P[L-1]$, but a single point update requires recomputing all trailing prefix sums in $O(N)$ time.\n- **Fenwick Tree**: Achieves a balanced middle ground, executing both point updates and range queries in $O(\\log N)$ worst-case time with minimal memory overhead.",
    },
    {
      heading: "2. Mathematical Foundation: The Lowbit Operator ($i \\& -i$)",
      body: "In two's complement binary representation, $-i = \\sim i + 1$. The bitwise AND operation $i \\& -i$ isolates the lowest set bit (the least significant 1-bit) of index $i$.\n\n$$\\text{lowbit}(i) = i \\& -i$$\n\nEach 1-based index $i$ stores the sum of a contiguous subsegment of length $\\text{lowbit}(i)$ ending at index $i$, covering the index range:\n\n$$[i - \\text{lowbit}(i) + 1, \\, i]$$\n\nFor example:\n- Index $6$ (binary `110`, $\\text{lowbit}=2$) stores the sum of $2$ elements: $[5, 6]$.\n- Index $8$ (binary `1000`, $\\text{lowbit}=8$) stores the sum of $8$ elements: $[1, 8]$.",
    },
    {
      heading: "3. Traversal Mechanics: Queries and Updates",
      body: "The tree structure is traversed implicitly through bitwise mutations:\n\n- **Prefix Query ($1 \\dots K$)**: Start at index $i = K$ and sum $\\text{tree}[i]$. Jump to the preceding non-overlapping responsibility block by stripping the lowest set bit: $i \\leftarrow i - (i \\& -i)$. Repeat until $i = 0$. This visits at most $\\lfloor \\log_2 K \\rfloor + 1$ cells.\n- **Point Update at Index $K$**: Add $\\delta$ to $\\text{tree}[K]$. Ascend to the parent responsibility block that covers position $K$ by adding the lowest set bit: $i \\leftarrow i + (i \\& -i)$. Repeat while $i \\le N$.",
    },
    {
      heading: "4. Trade-offs: Fenwick Tree vs Segment Tree",
      body: "- **Memory**: Fenwick Trees require exactly $N+1$ integers vs $4N$ nodes for a Segment Tree.\n- **Cache Line Efficiency**: Iterating over a flat array using bitwise hops has low cache-miss rate and very small constant factor speed.\n- **Operations**: Fenwick Trees require the aggregate operation to be **invertible** (e.g., addition/subtraction or XOR) for range queries $[L \\dots R]$ using $\\text{query}(R) - \\text{query}(L-1)$. Non-invertible operations like Range Minimum Query (RMQ) require standard Segment Trees.",
    },
    {
      heading: "5. Interview Pitfalls & Code Mechanics",
      body: "- **1-Based Indexing Mandatory**: Index $0$ has $\\text{lowbit}(0) = 0 \\& 0 = 0$. Using 0-based indexing leads to infinite loops in $i \\pm (i \\& -i)$. Always offset 0-indexed inputs by $+1$.\n- **Range Updates**: A Fenwick Tree built over a difference array $D[i] = A[i] - A[i-1]$ allows $O(\\log N)$ range updates and $O(\\log N)$ point queries.",
    },
  ],
  keyTerms: [
    {
      term: "Prefix Sum",
      definition:
        "The aggregate sum of array elements from index 1 up to index $K$, computed in $O(\\log N)$ time.",
    },
    {
      term: "Lowbit (i & -i)",
      definition:
        "The numerical value of the least significant 1-bit in integer $i$, computed via two's complement bitwise AND.",
    },
    {
      term: "Responsibility Block",
      definition:
        "The subsegment $[i - (i \\& -i) + 1, i]$ whose element sum is stored inside cell tree[i].",
    },
    {
      term: "Invertible Operation",
      definition:
        "An operation with a mathematical inverse (like addition/subtraction), enabling range query calculation via prefix subtraction.",
    },
  ],
};

const FENWICK_TREE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Declares the FenwickTree class for efficient O(log N) prefix sums and point updates.",
    2: "Constructor accepting the size N of the sequence.",
    3: "Allocates size + 1 zeroed slots for 1-based indexing (slot 0 is unused).",
    4: "Blank line separating constructor.",
    5: "Defines update(index, delta) to add delta to element at index.",
    6: "Initializes loop variable i to the target 1-based update index.",
    7: "Loops while index i remains within array bounds (i < len(tree)).",
    8: "Adds delta to the current responsibility block sum at tree[i].",
    9: "Advances i to parent responsibility block by adding lowest set bit: i += i & -i.",
    10: "Blank line separating update method.",
    11: "Defines query(index) returning prefix sum from 1 to index.",
    12: "Initializes accumulator variable sum_val to 0.",
    13: "Initializes loop variable i to target query index.",
    14: "Loops while index i is positive (i > 0).",
    15: "Accumulates block sum tree[i] into total sum_val.",
    16: "Jumps to preceding disjoint block by subtracting lowest set bit: i -= i & -i.",
    17: "Returns computed prefix sum up to index.",
    18: "Blank line separating query method.",
    19: "Defines range_query(left, right) to compute sum over interval [left..right].",
    20: "Returns range sum using prefix subtraction: query(right) - query(left - 1).",
  },
};

export const fenwickTree: AlgorithmDefinition<FenwickTreeInput> = {
  id: "fenwick-tree",
  title: "Binary Indexed Tree (Fenwick Tree)",
  topicIds: ["advanced_range_queries"],
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
