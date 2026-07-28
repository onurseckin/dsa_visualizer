import type { AlgorithmDefinition, AlgorithmStep, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface SparseTableQuery {
  left: number;
  right: number;
}

export interface SparseTableRmqInput {
  array: number[];
  queries: SparseTableQuery[];
}

export const SPARSE_TABLE_RMQ_CODE = `import math

class SparseTableRMQ:
    def __init__(self, arr: list[int]):
        self.n = len(arr)
        if self.n == 0:
            return
        self.k = math.floor(math.log2(self.n)) + 1
        self.st = [[0] * self.k for _ in range(self.n)]
        for i in range(self.n):
            self.st[i][0] = arr[i]
        for j in range(1, self.k):
            length = 1 << j
            half = 1 << (j - 1)
            for i in range(self.n - length + 1):
                self.st[i][j] = min(self.st[i][j - 1], self.st[i + half][j - 1])

    def query(self, left: int, right: int) -> int:
        length = right - left + 1
        k = math.floor(math.log2(length))
        return min(self.st[left][k], self.st[right - (1 << k) + 1][k])`;

export const DEFAULT_SPARSE_TABLE_RMQ_INPUT: SparseTableRmqInput = {
  array: [7, 2, 3, 0, 5, 10, 3, 12],
  queries: [
    { left: 0, right: 4 },
    { left: 2, right: 6 },
    { left: 5, right: 7 },
  ],
};

export const generateSparseTableRmqSteps = (input: SparseTableRmqInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arr = [...input.array];
  const n = arr.length;
  const K = n > 0 ? Math.floor(Math.log2(n)) + 1 : 0;

  const createMatrixSnapshot = (
    currentTable: (number | string)[][],
    activeCells?: [number, number][],
    comparedCells?: [number, number][],
  ) => {
    const cells = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < K; c++) {
        let state: "default" | "active" | "compared" | "sorted" | "pivot" | "inactive" = "default";
        const val = currentTable[r]?.[c] ?? "-";
        const isValidRange = r + (1 << c) <= n;

        if (!isValidRange) {
          state = "inactive";
        } else if (activeCells?.some(([ar, ac]) => ar === r && ac === c)) {
          state = "active";
        } else if (comparedCells?.some(([cr, cc]) => cr === r && cc === c)) {
          state = "compared";
        }

        cells.push({
          row: r,
          col: c,
          value: val,
          label: isValidRange ? `[${r}..${r + (1 << c) - 1}]` : "N/A",
          state,
        });
      }
    }

    const rowHeaders = arr.map((val, idx) => `i=${idx} (${val})`);
    const colHeaders = Array.from({ length: K }, (_, j) => `j=${j} (len ${1 << j})`);

    return {
      kind: "matrix" as const,
      rows: n,
      cols: K,
      cells,
      rowHeaders,
      colHeaders,
      title: "Sparse Table st[i][j]",
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    tableState: (number | string)[][],
    activeCells?: [number, number][],
    comparedCells?: [number, number][],
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: createMatrixSnapshot(tableState, activeCells, comparedCells),
      auxiliaryState: {
        customState: customState ?? {
          arrayLength: String(n),
          array: arr.join(", "),
        },
      },
      variables,
    });
  };

  const currentTable: (number | string)[][] = Array.from({ length: n }, () => Array(K).fill("-"));

  addStep(
    4,
    "Initialize Sparse Table construction",
    `Building Sparse Table for array of length N = ${n}. Precomputation takes O(N log N) time to enable O(1) Range Minimum Queries.`,
    { n, array: arr.join(", ") },
    currentTable,
  );

  if (n === 0) {
    addStep(
      6,
      "Array is empty",
      "Sparse Table cannot be constructed for an empty array.",
      { n: 0 },
      currentTable,
    );
    addStep(7, "Return empty table", "Returning empty Sparse Table.", { n: 0 }, currentTable);
    return steps;
  }

  addStep(
    8,
    `Calculate max log capacity K = ${K}`,
    `For N = ${n}, max power level K = floor(log2(${n})) + 1 = ${K}. Maximum sub-interval length is 2^${K - 1} = ${1 << (K - 1)}.`,
    { n, K },
    currentTable,
  );

  const st: number[][] = Array.from({ length: n }, () => Array(K).fill(0));

  addStep(
    9,
    `Allocate st matrix of size ${n} x ${K}`,
    `Sparse Table dimensions are N x K (${n} rows, ${K} columns).`,
    { n, K },
    currentTable,
  );

  // Base case j = 0
  const baseActiveCells: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    st[i][0] = arr[i];
    currentTable[i][0] = arr[i];
    baseActiveCells.push([i, 0]);
  }

  addStep(
    11,
    "Base case precomputation: j = 0 (length = 2^0 = 1)",
    "st[i][0] stores the minimum for range [i..i] of length 1, which equals arr[i].",
    { j: 0, length: 1 },
    currentTable,
    baseActiveCells,
    undefined,
    { stage: "Base case precomputation" },
  );

  // Dynamic programming to compute st[i][j]
  for (let j = 1; 1 << j <= n; j++) {
    const len = 1 << j;
    const half = 1 << (j - 1);

    addStep(
      12,
      `Computing table column j = ${j} (length = 2^${j} = ${len})`,
      `Combining two overlapping sub-intervals of size ${half} from column j-1 = ${j - 1} to compute range minimums for length ${len}.`,
      { j, length: len, halfLength: half },
      currentTable,
    );

    for (let i = 0; i + len <= n; i++) {
      const leftVal = st[i][j - 1];
      const rightVal = st[i + half][j - 1];
      st[i][j] = Math.min(leftVal, rightVal);
      currentTable[i][j] = st[i][j];

      addStep(
        16,
        `st[${i}][${j}] = min(st[${i}][${j - 1}], st[${i + half}][${j - 1}]) = ${st[i][j]}`,
        `Minimum of interval [${i}..${i + half - 1}] (${leftVal}) and interval [${i + half}..${i + len - 1}] (${rightVal}) is ${st[i][j]}.`,
        { i, j, leftVal, rightVal, minVal: st[i][j] },
        currentTable,
        [[i, j]],
        [
          [i, j - 1],
          [i + half, j - 1],
        ],
      );
    }
  }

  addStep(
    16,
    "Sparse Table construction complete",
    "All power-of-two intervals precomputed. Sparse Table is ready to execute O(1) range minimum queries.",
    { n, K },
    currentTable,
    undefined,
    undefined,
    { status: "Table ready" },
  );

  // Process queries
  const queries = input.queries ?? [];
  for (let qIdx = 0; qIdx < queries.length; qIdx++) {
    const { left, right } = queries[qIdx];
    const L = Math.max(0, Math.min(left, n - 1));
    const R = Math.max(L, Math.min(right, n - 1));
    const len = R - L + 1;
    const k = Math.floor(Math.log2(len));

    const leftPartMin = st[L][k];
    const rightPartMin = st[R - (1 << k) + 1][k];
    const queryMin = Math.min(leftPartMin, rightPartMin);

    addStep(
      18,
      `Query ${qIdx + 1}: RMQ(${L}, ${R})`,
      `Requesting range minimum for subarray arr[${L}..${R}] of length ${len}.`,
      { queryIndex: qIdx + 1, L, R, length: len },
      currentTable,
      [
        [L, k],
        [R - (1 << k) + 1, k],
      ],
    );

    addStep(
      20,
      `Calculate range coverage exponent k = ${k}`,
      `Largest power of 2 fitting within range length ${len} is 2^${k} = ${1 << k}.`,
      { L, R, length: len, k, powerOf2: 1 << k },
      currentTable,
      [
        [L, k],
        [R - (1 << k) + 1, k],
      ],
    );

    addStep(
      21,
      `RMQ(${L}, ${R}) = min(st[${L}][${k}], st[${R - (1 << k) + 1}][${k}]) = ${queryMin}`,
      `Combining overlapping sub-intervals [${L}..${L + (1 << k) - 1}] (min ${leftPartMin}) and [${R - (1 << k) + 1}..${R}] (min ${rightPartMin}) yields overall range minimum ${queryMin} in O(1) time.`,
      { L, R, k, leftPartMin, rightPartMin, queryMin },
      currentTable,
      [
        [L, k],
        [R - (1 << k) + 1, k],
      ],
      undefined,
      { queryResult: String(queryMin) },
    );
  }

  return steps;
};

export const SPARSE_TABLE_RMQ_TOPIC_GUIDE: TopicGuide = {
  overview:
    "A **Sparse Table** is an advanced static range query data structure that precomputes answers for all sub-intervals whose lengths are exact powers of $2$. Leveraging the algebraic property of **idempotence** ($f(x, x) = x$, such as $\\min$, $\\max$, or $\\text{GCD}$), any query range $[L \\dots R]$ can be completely covered by overlapping two precomputed power-of-2 sub-intervals. This enables Range Minimum Queries (RMQ) to execute in $O(1)$ constant time after $O(N \\log N)$ dynamic programming precomputation.",
  sections: [
    {
      heading: "1. Power-of-Two Sub-interval Precomputation",
      body: "Instead of precomputing all $O(N^2)$ possible contiguous sub-intervals, a Sparse Table computes values only for sub-intervals of length $2^j$ starting at index $i$, where $0 \\le j \\le \\lfloor \\log_2 N \\rfloor$.\n\n- Entry `st[i][j]` stores the minimum for interval $[i \\dots i + 2^j - 1]$.\n- Table dimensions are $N \\times (\\lfloor \\log_2 N \\rfloor + 1)$, requiring $O(N \\log N)$ space.",
    },
    {
      heading: "2. Dynamic Programming Precomputation",
      body: "The table is built bottom-up by powers of two:\n\n- **Base Case ($j=0$, length $2^0=1$)**: `st[i][0] = arr[i]`.\n- **Inductive Step ($j \\ge 1$, length $2^j$)**: Split the length-$2^j$ interval into two adjacent halves of length $2^{j-1}$:\n\n$$\\text{st}[i][j] = \\min\\left(\\text{st}[i][j-1], \\, \\text{st}[i + 2^{j-1}][j-1]\\right)$$",
    },
    {
      heading: "3. Constant Time $O(1)$ Overlapping Query Mechanics",
      body: "To query range $[L \\dots R]$:\n\n1. Compute length $\\text{len} = R - L + 1$ and power exponent $k = \\lfloor \\log_2(\\text{len}) \\rfloor$.\n2. The range is covered by two overlapping intervals of length $2^k$:\n   - Left subsegment $[L \\dots L + 2^k - 1]$ stored at `st[L][k]`.\n   - Right subsegment $[R - 2^k + 1 \\dots R]$ stored at `st[R - 2^k + 1][k]`.\n3. Return the minimum of the two parts:\n\n$$\\text{RMQ}(L, R) = \\min\\left(\\text{st}[L][k], \\, \\text{st}[R - 2^k + 1][k]\\right)$$",
    },
    {
      heading: "4. Trade-off Matrix: Sparse Table vs Segment Tree",
      body: "| Feature | Sparse Table | Segment Tree |\n| :--- | :--- | :--- |\n| **Query Complexity** | $O(1)$ constant time | $O(\\log N)$ logarithmic time |\n| **Update Complexity** | Static Only ($O(N \\log N)$ rebuild) | $O(\\log N)$ point/range updates |\n| **Supported Operations** | Idempotent Only ($min$, $max$, $\\text{GCD}$) | Any Associative Operation (including Sum) |",
    },
    {
      heading: "5. Interview Pitfalls & Common Bugs",
      body: "- **Non-Idempotent Operations**: Never use Sparse Tables for Range Sum queries in $O(1)$ time, as overlapping elements would be counted twice.\n- **0-Based Index Math**: Ensure $R - 2^k + 1$ is calculated correctly to align the right-hand covering interval with boundary $R$.",
    },
  ],
  keyTerms: [
    {
      term: "RMQ (Range Minimum Query)",
      definition: "The problem of finding the minimum element in a subarray arr[L..R].",
    },
    {
      term: "Idempotence",
      definition:
        "A mathematical property where combining a value with itself yields the same value: $f(x, x) = x$ (e.g. $\\min(a, a) = a$).",
    },
    {
      term: "Power-of-Two Interval",
      definition: "A sub-interval whose length is an exact power of 2 ($1, 2, 4, 8, \\dots$).",
    },
    {
      term: "Overlapping Coverage",
      definition:
        "Covering range $[L \\dots R]$ using two overlapping intervals of length $2^k$ in $O(1)$ time without double-counting errors.",
    },
  ],
};

export const SPARSE_TABLE_RMQ_TRIVIA: TriviaMeta = {
  skipLines: [2, 17],
  distractors: [
    "return min(st[L][k], st[R][k])",
    "st[i][j] = st[i][j - 1] + st[i + (1 << j)][j - 1]",
    "k = int(math.log2(R - L))",
  ],
  hints: [
    {
      line: 16,
      hint: "Combine left interval st[i][j-1] and right interval st[i + 2^(j-1)][j-1]",
    },
    {
      line: 21,
      hint: "Use floor(log2(R - L + 1)) to get largest power of 2 length",
    },
  ],
  lineExplanations: {
    1: "Imports math module for log2 calculation.",
    2: "Blank line separating imports.",
    3: "Defines SparseTableRMQ class for static O(1) Range Minimum Queries.",
    4: "Constructor taking input array arr.",
    5: "Stores array length n.",
    6: "Checks if input array is empty.",
    7: "Returns early for empty input array.",
    8: "Calculates max power of 2 exponent level k = floor(log2(n)) + 1.",
    9: "Allocates 2D table st of size n x k initialized to 0.",
    10: "Iterates over element index i to fill base row j=0.",
    11: "Fills base row st[i][0] with arr[i] (range length 2^0 = 1).",
    12: "Iterates over power-of-two levels j from 1 to k-1.",
    13: "Calculates full interval length: length = 1 << j (2^j).",
    14: "Calculates half interval length: half = 1 << (j - 1) (2^(j-1)).",
    15: "Iterates over valid starting indices i up to n - length + 1.",
    16: "Computes st[i][j] as min of left half st[i][j-1] and right half st[i+half][j-1].",
    17: "Blank line separating constructor.",
    18: "Defines query(left, right) returning minimum in subarray [left..right].",
    19: "Calculates total query range length: length = right - left + 1.",
    20: "Calculates largest power-of-two exponent k = floor(log2(length)).",
    21: "Returns min of two overlapping power-of-2 intervals covering [left..right] in O(1) time.",
  },
};

export const sparseTableRmq: AlgorithmDefinition<SparseTableRmqInput> = {
  id: "sparse-table-rmq",
  title: "Sparse Table (Range Minimum Query)",
  topicIds: ["advanced_range_queries"],
  difficulty: "Medium",
  description:
    "A **Sparse Table** precomputes range minimums for power-of-two interval lengths. Leveraging the idempotence of minimum operations, it achieves $O(N \\log N)$ precomputation time and $O(1)$ constant query time on static arrays.",
  constraints: ["1 <= N <= 10^5", "1 <= Q <= 10^5", "-10^9 <= array[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Basic Example",
      inputDisplay: "arr = [7, 2, 3, 0, 5, 10, 3, 12], queries = [RMQ(0,4), RMQ(2,6), RMQ(5,7)]",
      outputDisplay: "RMQ(0,4) = 0, RMQ(2,6) = 0, RMQ(5,7) = 3",
      input: {
        array: [7, 2, 3, 0, 5, 10, 3, 12],
        queries: [
          { left: 0, right: 4 },
          { left: 2, right: 6 },
          { left: 5, right: 7 },
        ],
      },
      output: "RMQ(0,4) = 0, RMQ(2,6) = 0, RMQ(5,7) = 3",
      explanation:
        "Subarray [0..4] contains 0 at index 3. Subarray [2..6] also contains 0. Subarray [5..7] is [10, 3, 12] with min 3.",
    },
    {
      kind: "complex",
      title: "Complex Edge Case",
      inputDisplay: "arr = [15, 8, 2, 4, 11, 1, 9, 7], queries = [RMQ(0,7), RMQ(1,3), RMQ(4,6)]",
      outputDisplay: "RMQ(0,7) = 1, RMQ(1,3) = 2, RMQ(4,6) = 1",
      input: {
        array: [15, 8, 2, 4, 11, 1, 9, 7],
        queries: [
          { left: 0, right: 7 },
          { left: 1, right: 3 },
          { left: 4, right: 6 },
        ],
      },
      output: "RMQ(0,7) = 1, RMQ(1,3) = 2, RMQ(4,6) = 1",
      explanation:
        "Full array query RMQ(0,7) finds minimum 1 across 8 elements; range queries test power of 2 boundaries.",
    },
    {
      kind: "negative",
      title: "Failing / Boundary Case",
      inputDisplay: "arr = [42], queries = [RMQ(0,0)]",
      outputDisplay: "RMQ(0,0) = 42",
      input: {
        array: [42],
        queries: [{ left: 0, right: 0 }],
      },
      output: "RMQ(0,0) = 42",
      explanation: "Single element array N=1; base case j=0 directly yields 42.",
    },
  ],
  code: SPARSE_TABLE_RMQ_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(1)",
    worst: "O(1)",
  },
  spaceComplexity: "O(n log n)",
  complexityAnalysis: {
    time: "Preprocessing fills an n x log(n) table in O(n log n) time. Each range query computes floor(log2(len)) and does a single constant-time min lookup of two precomputed values, taking O(1) time.",
    space: "Stores a 2D table st[n][log2(n) + 1], requiring O(n log n) total memory.",
  },
  topicGuide: SPARSE_TABLE_RMQ_TOPIC_GUIDE,
  trivia: SPARSE_TABLE_RMQ_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 9,
      section: "9.1 Sparse table",
      label: "Competitive Programmer's Handbook, Ch 9",
    },
  ],
  defaultInput: DEFAULT_SPARSE_TABLE_RMQ_INPUT,
  generateSteps: generateSparseTableRmqSteps,
};
