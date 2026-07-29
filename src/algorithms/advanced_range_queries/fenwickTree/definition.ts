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
    "<p>A <strong>Fenwick Tree</strong> (or <strong>Binary Indexed Tree / BIT</strong>) maintains dynamic prefix sums over a sequence of <code>N</code> elements in <code>O(log N)</code> time per operation while using only <code>O(N)</code> space in a flat array. Bitwise arithmetic—specifically the lowbit operation <code>i &amp; -i</code>—organizes element responsibilities into an implicit tree structure.</p>",
  sections: [
    {
      heading: "Range Query vs Point Update Balance",
      body: "<p>Fenwick Trees balance the trade-off between naive arrays and static prefix sum arrays:</p><ul><li><strong>Flat Array:</strong> <code>O(1)</code> updates, but <code>O(N)</code> range queries.</li><li><strong>Static Prefix Sum:</strong> <code>O(1)</code> range queries, but <code>O(N)</code> point updates.</li><li><strong>Fenwick Tree:</strong> Achieves <code>O(log N)</code> for both operations with minimal cache-friendly memory.</li></ul>",
    },
    {
      heading: "Lowbit Mathematics",
      body: "<p>In two's complement arithmetic, <code>-i = ~i + 1</code>. The bitwise operation <code>lowbit(i) = i &amp; -i</code> isolates the lowest set bit. Each 1-based index <code>i</code> stores the sum of the subsegment <code>[i - lowbit(i) + 1, i]</code>.</p>",
    },
    {
      heading: "Query and Update Mechanics",
      body: "<p>Operations traverse the implicit tree structure via bitwise hops:</p><ul><li><strong>Prefix Query (1...K):</strong> Start at <code>i = K</code>, sum <code>tree[i]</code>, and jump to the preceding block via <code>i &minus;= i &amp; -i</code>.</li><li><strong>Point Update at K:</strong> Add delta to <code>tree[K]</code> and ascend to parent covering blocks via <code>i += i &amp; -i</code>.</li></ul>",
    },
    {
      heading: "Fenwick Tree vs Segment Tree",
      body: "<p>Fenwick Trees require only <code>N+1</code> memory cells compared to <code>4N</code> for Segment Trees, featuring smaller constant-factor overhead. However, range queries <code>[L...R]</code> via <code>query(R) - query(L-1)</code> require invertible operations (such as addition or XOR). Non-invertible operations like Range Minimum Query require Segment Trees.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Prefix Sum",
      definition:
        "The aggregate sum of array elements from index 1 up to index K, computed in O(log N) time.",
    },
    {
      term: "Lowbit (i & -i)",
      definition:
        "The numerical value of the least significant 1-bit in integer i, computed via two's complement bitwise AND.",
    },
    {
      term: "Responsibility Block",
      definition:
        "The subsegment [i - (i & -i) + 1, i] whose element sum is stored inside cell tree[i].",
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
    "<p>A <strong>Binary Indexed Tree (Fenwick Tree)</strong> is a compact array-based data structure that answers prefix sum queries and executes point updates in <code>O(log N)</code> time. Each 1-based index <code>i</code> stores the sum of a subsegment whose length equals its lowest set bit <code>lowbit(i) = i &amp; -i</code>, allowing queries and updates to hop through the tree in logarithmic steps without pointer overhead.</p><h3>State Representation</h3><p>The state is stored as a 1D array <code>tree[1 ... N]</code> where cell <code>tree[i]</code> holds the precomputed sum of a range of length <code>i &amp; -i</code> ending at index <code>i</code>.</p><h3>Input Parameters</h3><ul><li><code>array</code>: Initial array of numbers.</li><li><code>operations</code>: Array of point update or range query operations.</li></ul><h3>Output</h3><ul><li><code>int / Array</code>: Results of range queries and final tree state.</li></ul><h3>Edge Cases &amp; Constraints</h3><ul><li><strong>1-Based Indexing:</strong> Index 0 is unused because <code>lowbit(0) = 0</code> causes infinite loops.</li><li><strong>Invertibility:</strong> Range queries <code>[L...R]</code> require an invertible operator like addition via <code>query(R) - query(L-1)</code>.</li></ul>",
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
    time: "Every update and prefix query walks the implicit tree by repeatedly adding or stripping the lowest set bit of the index, executing in O(log n) time per operation.",
    space:
      "The whole structure is one flat array with a single cell per element (plus unused slot 0), taking O(n) space.",
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
