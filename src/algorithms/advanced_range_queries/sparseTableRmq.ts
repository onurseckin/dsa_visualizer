import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  TopicGuide,
} from "../../types/dsa";
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

def build_sparse_table(arr: list[int]) -> list[list[int]]:
    n = len(arr)
    if n == 0:
        return []
    K = int(math.log2(n)) + 1
    st = [[0] * K for _ in range(n)]
    for i in range(n):
        st[i][0] = arr[i]
    j = 1
    while (1 << j) <= n:
        i = 0
        while i + (1 << j) <= n:
            st[i][j] = min(st[i][j - 1], st[i + (1 << (j - 1))][j - 1])
            i += 1
        j += 1
    return st

def query_rmq(st: list[list[int]], L: int, R: int) -> int:
    length = R - L + 1
    k = int(math.log2(length))
    return min(st[L][k], st[R - (1 << k) + 1][k])`;

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

  const makeElements = (
    activeRange?: [number, number],
    highlightRange?: [number, number],
  ): ArrayElement[] => {
    return arr.map((val, idx) => {
      let state: ArrayElement["state"] = "default";
      if (activeRange && idx >= activeRange[0] && idx <= activeRange[1]) {
        state = "active";
      } else if (highlightRange && idx >= highlightRange[0] && idx <= highlightRange[1]) {
        state = "compare";
      }
      return {
        id: `el-${idx}`,
        value: val,
        state,
      };
    });
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRange?: [number, number],
    highlightRange?: [number, number],
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(activeRange, highlightRange),
      },
      auxiliaryState: {
        customState: customState ?? {
          arrayLength: String(n),
        },
      },
      variables,
    });
  };

  addStep(
    4,
    "Initialize Sparse Table construction",
    `Building Sparse Table for array of length N = ${n}. Precomputation takes O(N log N) time to enable O(1) Range Minimum Queries.`,
    { n },
  );

  if (n === 0) {
    addStep(
      6,
      "Array is empty",
      "Sparse Table cannot be constructed for an empty array. Returning empty table.",
      { n: 0 },
    );
    return steps;
  }

  const K = Math.floor(Math.log2(n)) + 1;
  const st: number[][] = Array.from({ length: n }, () => Array(K).fill(0));

  // Base case j = 0
  for (let i = 0; i < n; i++) {
    st[i][0] = arr[i];
  }

  addStep(
    10,
    "Base case: len = 1 (j = 0)",
    "st[i][0] contains the minimum for length 2^0 = 1 starting at index i, which is arr[i].",
    { j: 0, length: 1 },
    undefined,
    undefined,
    { stage: "Base case precomputation" },
  );

  // Dynamic programming to compute st[i][j]
  for (let j = 1; (1 << j) <= n; j++) {
    const len = 1 << j;
    const half = 1 << (j - 1);

    addStep(
      12,
      `Computing table row j = ${j} (length = 2^${j} = ${len})`,
      `Combining two overlapping halves of size ${half} to find minimums for range length ${len}.`,
      { j, length: len, halfLength: half },
    );

    for (let i = 0; i + len <= n; i++) {
      const leftVal = st[i][j - 1];
      const rightVal = st[i + half][j - 1];
      st[i][j] = Math.min(leftVal, rightVal);

      addStep(
        15,
        `st[${i}][${j}] = min(st[${i}][${j - 1}], st[${i + half}][${j - 1}]) = ${st[i][j]}`,
        `Minimum of interval [${i}..${i + half - 1}] (${leftVal}) and interval [${i + half}..${i + len - 1}] (${rightVal}) is ${st[i][j]}.`,
        { i, j, leftVal, rightVal, minVal: st[i][j] },
        [i, i + len - 1],
      );
    }
  }

  addStep(
    18,
    "Sparse Table construction complete",
    "All intervals of length 2^j precomputed. Ready to answer O(1) range minimum queries.",
    { n, K },
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
      21,
      `Query ${qIdx + 1}: RMQ(${L}, ${R})`,
      `Range length = ${len}. Largest power of 2 fitting in ${len} is 2^${k} = ${1 << k}.`,
      { queryIndex: qIdx + 1, L, R, length: len, k },
      [L, R],
    );

    addStep(
      23,
      `RMQ(${L}, ${R}) = min(st[${L}][${k}], st[${R - (1 << k) + 1}][${k}]) = ${queryMin}`,
      `Combining overlapping intervals [${L}..${L + (1 << k) - 1}] (min ${leftPartMin}) and [${R - (1 << k) + 1}..${R}] (min ${rightPartMin}) yields overall minimum ${queryMin} in O(1) time.`,
      { L, R, k, leftPartMin, rightPartMin, queryMin },
      [L, R],
      [L, R],
      { queryResult: String(queryMin) },
    );
  }

  return steps;
};

export const SPARSE_TABLE_RMQ_TOPIC_GUIDE: TopicGuide = {
  overview:
    "A Sparse Table precomputes answers for all range intervals of length 2^k starting at index i. By overlapping two intervals of length 2^k, any idempotent range query (such as min, max, or gcd) can be answered in O(1) worst-case time after O(N log N) preprocessing.",
  sections: [
    {
      heading: "Interval Covering via Powers of 2",
      body: "Instead of computing answers for arbitrary range sizes, Sparse Table only builds values for range lengths that are exact powers of 2. For an array of size N, there are only floor(log2 N) + 1 possible power-of-2 lengths.",
    },
    {
      heading: "Idempotent Operations and Overlapping Ranges",
      body: "Because min(x, x) = x, an operation like minimum is idempotent. When querying range [L, R] of length len, we pick k = floor(log2 len). The two ranges [L, L + 2^k - 1] and [R - 2^k + 1, R] together cover all elements of [L, R] with an overlap in the middle. Computing min of these two values gives the exact minimum of [L, R] in O(1) time.",
    },
    {
      heading: "Building the Table",
      body: "The table st[i][j] stores the result for interval [i, i + 2^j - 1]. The base row j=0 stores original array values arr[i]. Row j is built from row j-1 using the recurrence st[i][j] = min(st[i][j-1], st[i + 2^(j-1)][j-1]).",
    },
    {
      heading: "Trade-offs and Limitations",
      body: "Sparse Table provides fast O(1) queries but does not support point or range updates without rebuilding the table (O(N log N)). For dynamic arrays with updates, Segment Trees or Fenwick Trees are preferred.",
    },
  ],
  keyTerms: [
    {
      term: "RMQ",
      definition: "Range Minimum Query: finding the minimum value in a subarray arr[L..R].",
    },
    {
      term: "Idempotence",
      definition: "A operation property where f(a, a) = a, allowing overlapping intervals to be combined without error.",
    },
    {
      term: "Sparse Table",
      definition: "A 2D array st[i][j] holding precomputed query answers for intervals of length 2^j starting at index i.",
    },
  ],
};

export const SPARSE_TABLE_RMQ_TRIVIA: TriviaMeta = {
  skipLines: [1, 5, 8, 20],
  distractors: [
    "return min(st[L][k], st[R][k])",
    "st[i][j] = st[i][j - 1] + st[i + (1 << j)][j - 1]",
    "k = int(math.log2(R - L))",
  ],
  hints: [
    {
      line: 15,
      hint: "Combine left interval st[i][j-1] and right interval st[i + 2^(j-1)][j-1]",
    },
    {
      line: 23,
      hint: "Use floor(log2(R - L + 1)) to get largest power of 2 length",
    },
  ],
  lineExplanations: {
    6: "Handle boundary check for empty array.",
    15: "Fill table via dynamic programming over powers of two.",
    23: "Look up two overlapping intervals in constant O(1) time.",
  },
};

export const sparseTableRmq: AlgorithmDefinition<SparseTableRmqInput> = {
  id: "sparse-table-rmq",
  title: "Sparse Table (Range Minimum Query)",
  category: "advanced_range_queries",
  difficulty: "Medium",
  description:
    "Sparse Table precomputes range minimums for intervals of power-of-two lengths. It achieves O(N log N) precomputation time and O(1) query time for idempotent operations like minimum and maximum.",
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
