import type {
  AlgorithmDefinition,
  AlgorithmStep,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Static Range Minimum Query (RMQ) asks for the minimum element in subarray arr[L..R] over an immutable array.",
    primarySnapshot: {
      kind: "array",
      name: "inputArray",
      elements: [
        { id: "e0", value: 7, state: "default" },
        { id: "e1", value: 2, state: "default" },
        { id: "e2", value: 3, state: "default" },
        { id: "e3", value: 0, state: "default" },
        { id: "e4", value: 5, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Scanning subsegment elements linearly on each query takes linear O(N) time, which quickly becomes unacceptable under high query loads.",
    primarySnapshot: {
      kind: "array",
      name: "inputArray",
      elements: [
        { id: "e0", value: 7, state: "active" },
        { id: "e1", value: 2, state: "active" },
        { id: "e2", value: 3, state: "active" },
        { id: "e3", value: 0, state: "active" },
        { id: "e4", value: 5, state: "active" },
      ],
    },
  },
  {
    narrative:
      "Precomputing all pairwise answers for O(N²) ranges allows O(1) queries, but wastes quadratic O(N²) memory and setup time.",
    primarySnapshot: {
      kind: "matrix",
      rows: 3,
      cols: 3,
      cells: [
        { row: 0, col: 0, value: 7, state: "visited" },
        { row: 0, col: 1, value: 2, state: "visited" },
        { row: 0, col: 2, value: 2, state: "visited" },
        { row: 1, col: 1, value: 2, state: "visited" },
        { row: 1, col: 2, value: 2, state: "visited" },
        { row: 2, col: 2, value: 3, state: "visited" },
      ],
    },
  },
  {
    narrative:
      "Sparse Table resolves this dilemma by precomputing minimums only for range lengths that are exact powers of two (2^j = 1, 2, 4, 8, ...).",
    primarySnapshot: {
      kind: "matrix",
      rows: 4,
      cols: 3,
      colHeaders: ["j=0 (len 1)", "j=1 (len 2)", "j=2 (len 4)"],
      cells: [
        { row: 0, col: 0, value: 7, state: "active" },
        { row: 0, col: 1, value: 2, state: "active" },
        { row: 0, col: 2, value: 0, state: "active" },
        { row: 1, col: 0, value: 2, state: "default" },
        { row: 1, col: 1, value: 2, state: "default" },
        { row: 1, col: 2, value: 0, state: "default" },
        { row: 2, col: 0, value: 3, state: "default" },
        { row: 2, col: 1, value: 0, state: "default" },
        { row: 2, col: 2, value: 0, state: "default" },
        { row: 3, col: 0, value: 0, state: "default" },
        { row: 3, col: 1, value: 0, state: "default" },
        { row: 3, col: 2, value: 0, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Each table cell st[i][j] stores the minimum element in interval [i, i + 2^j - 1], which covers a power-of-two length of 2^j.",
    primarySnapshot: {
      kind: "matrix",
      rows: 4,
      cols: 3,
      colHeaders: ["j=0 (len 1)", "j=1 (len 2)", "j=2 (len 4)"],
      cells: [
        { row: 0, col: 0, value: 7, state: "default" },
        { row: 0, col: 1, value: 2, state: "swap" },
        { row: 0, col: 2, value: 0, state: "default" },
        { row: 1, col: 0, value: 2, state: "default" },
        { row: 1, col: 1, value: 2, state: "default" },
        { row: 1, col: 2, value: 0, state: "default" },
        { row: 2, col: 0, value: 3, state: "default" },
        { row: 2, col: 1, value: 0, state: "default" },
        { row: 2, col: 2, value: 0, state: "default" },
        { row: 3, col: 0, value: 0, state: "default" },
        { row: 3, col: 1, value: 0, state: "default" },
        { row: 3, col: 2, value: 0, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Dynamic programming fills the table by combining two overlapping half-intervals from the previous column: st[i][j] = min(st[i][j-1], st[i + 2^(j-1)][j-1]).",
    primarySnapshot: {
      kind: "matrix",
      rows: 4,
      cols: 3,
      colHeaders: ["j=0 (len 1)", "j=1 (len 2)", "j=2 (len 4)"],
      cells: [
        { row: 0, col: 0, value: 7, state: "compared" },
        { row: 0, col: 1, value: 2, state: "active" },
        { row: 0, col: 2, value: 0, state: "default" },
        { row: 1, col: 0, value: 2, state: "compared" },
        { row: 1, col: 1, value: 2, state: "default" },
        { row: 1, col: 2, value: 0, state: "default" },
        { row: 2, col: 0, value: 3, state: "default" },
        { row: 2, col: 1, value: 0, state: "default" },
        { row: 2, col: 2, value: 0, state: "default" },
        { row: 3, col: 0, value: 0, state: "default" },
        { row: 3, col: 1, value: 0, state: "default" },
        { row: 3, col: 2, value: 0, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Because minimum is an idempotent operation—meaning min(x, x) = x—overlapping two subsegments of the same length produces the exact minimum without double-counting errors.",
    primarySnapshot: {
      kind: "array",
      name: "idempotentConcept",
      elements: [
        { id: "c1", value: 2, label: "block 1 [L..L+2^k-1]", state: "active" },
        { id: "c2", value: 0, label: "overlap", state: "swap" },
        { id: "c3", value: 0, label: "block 2 [R-2^k+1..R]", state: "active" },
      ],
    },
  },
  {
    narrative:
      "To answer any range minimum query RMQ(L, R) of length len = R - L + 1, we set k = floor(log2(len)) and select the largest power of two that fits inside.",
    primarySnapshot: {
      kind: "matrix",
      rows: 4,
      cols: 3,
      colHeaders: ["j=0 (len 1)", "j=1 (len 2)", "j=2 (len 4)"],
      cells: [
        { row: 0, col: 0, value: 7, state: "default" },
        { row: 0, col: 1, value: 2, state: "default" },
        { row: 0, col: 2, value: 0, state: "active" },
        { row: 1, col: 0, value: 2, state: "default" },
        { row: 1, col: 1, value: 2, state: "default" },
        { row: 1, col: 2, value: 0, state: "visited" },
        { row: 2, col: 0, value: 3, state: "default" },
        { row: 2, col: 1, value: 0, state: "default" },
        { row: 2, col: 2, value: 0, state: "default" },
        { row: 3, col: 0, value: 0, state: "default" },
        { row: 3, col: 1, value: 0, state: "default" },
        { row: 3, col: 2, value: 0, state: "default" },
      ],
    },
  },
  {
    narrative:
      "The result is evaluated instantly in O(1) time as min(st[L][k], st[R - 2^k + 1][k]), completely eliminating tree traversals or iteration.",
    primarySnapshot: {
      kind: "array",
      name: "queryResult",
      elements: [
        { id: "q1", value: 0, label: "st[L][k] = 0", state: "active" },
        { id: "q2", value: 0, label: "st[R-2^k+1][k] = 0", state: "active" },
        { id: "q3", value: 0, label: "RMQ result = 0", state: "visited" },
      ],
    },
  },
  {
    narrative:
      "With O(N log N) precomputation and O(N log N) total space, Sparse Table achieves ultimate O(1) constant time range minimum queries.",
    primarySnapshot: {
      kind: "matrix",
      rows: 4,
      cols: 3,
      colHeaders: ["j=0 (len 1)", "j=1 (len 2)", "j=2 (len 4)"],
      cells: [
        { row: 0, col: 0, value: 7, state: "visited" },
        { row: 0, col: 1, value: 2, state: "visited" },
        { row: 0, col: 2, value: 0, state: "visited" },
        { row: 1, col: 0, value: 2, state: "visited" },
        { row: 1, col: 1, value: 2, state: "visited" },
        { row: 1, col: 2, value: 0, state: "visited" },
        { row: 2, col: 0, value: 3, state: "visited" },
        { row: 2, col: 1, value: 0, state: "visited" },
        { row: 2, col: 2, value: 0, state: "visited" },
        { row: 3, col: 0, value: 0, state: "visited" },
        { row: 3, col: 1, value: 0, state: "visited" },
        { row: 3, col: 2, value: 0, state: "visited" },
      ],
    },
  },
];

export const generateSparseTableRmqSteps = (input: SparseTableRmqInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  for (const intro of createIntroSnapshots()) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "intro",
        narrative: intro.narrative,
        primarySnapshot: intro.primarySnapshot,
      }),
    );
  }

  const safeInput = {
    array: Array.isArray(input?.array) ? input.array : DEFAULT_SPARSE_TABLE_RMQ_INPUT.array,
    queries: Array.isArray(input?.queries) ? input.queries : DEFAULT_SPARSE_TABLE_RMQ_INPUT.queries,
  };
  const arr = [...safeInput.array];
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
      name: "sparseTable",
      rows: n,
      cols: K,
      cells,
      rowHeaders,
      colHeaders,
    };
  };

  const addWalkthroughStep = (
    narrative: string,
    tableState: (number | string)[][],
    activeCells?: [number, number][],
    comparedCells?: [number, number][],
  ) => {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative,
        primarySnapshot: createMatrixSnapshot(tableState, activeCells, comparedCells),
      }),
    );
  };

  const currentTable: (number | string)[][] = Array.from({ length: n }, () => Array(K).fill("-"));

  addWalkthroughStep(
    `Initializing Sparse Table construction for array [${arr.join(", ")}] of length ${n}.`,
    currentTable,
  );

  if (n === 0) {
    addWalkthroughStep(
      "The input array is empty, so no Sparse Table can be precomputed.",
      currentTable,
    );
    return steps;
  }

  addWalkthroughStep(
    `Calculated max power-of-two level K = ${K} (max range length 2^${K - 1} = ${1 << (K - 1)}).`,
    currentTable,
    [[0, 0]],
  );

  const st: number[][] = Array.from({ length: n }, () => Array(K).fill(0));

  const baseActiveCells: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    st[i][0] = arr[i];
    currentTable[i][0] = arr[i];
    baseActiveCells.push([i, 0]);
  }

  addWalkthroughStep(
    `Precomputed base column j = 0 (interval length 2^0 = 1): st[i][0] stores single element values arr[i].`,
    currentTable,
    baseActiveCells,
  );

  for (let j = 1; 1 << j <= n; j++) {
    const len = 1 << j;
    const half = 1 << (j - 1);

    addWalkthroughStep(
      `Computing table column j = ${j} (range length 2^${j} = ${len}) by combining half-intervals of length ${half}.`,
      currentTable,
    );

    for (let i = 0; i + len <= n; i++) {
      const leftVal = st[i][j - 1];
      const rightVal = st[i + half][j - 1];
      st[i][j] = Math.min(leftVal, rightVal);
      currentTable[i][j] = st[i][j];

      addWalkthroughStep(
        `st[${i}][${j}] = min(st[${i}][${j - 1}] (${leftVal}), st[${i + half}][${j - 1}] (${rightVal})) = ${st[i][j]} for range [${i}..${i + len - 1}].`,
        currentTable,
        [[i, j]],
        [
          [i, j - 1],
          [i + half, j - 1],
        ],
      );
    }
  }

  addWalkthroughStep(
    `Sparse Table precomputation complete. All ${n} x ${K} power-of-two range minimums are cached.`,
    currentTable,
  );

  for (const q of safeInput.queries) {
    const { left, right } = q;
    if (left < 0 || right >= n || left > right) continue;

    const len = right - left + 1;
    const k = Math.floor(Math.log2(len));
    const twoK = 1 << k;
    const rightStart = right - twoK + 1;

    addWalkthroughStep(
      `Executing range minimum query RMQ(${left}, ${right}) covering length ${len}.`,
      currentTable,
      [[left, 0]],
    );

    const val1 = st[left][k];
    const val2 = st[rightStart][k];
    const ans = Math.min(val1, val2);

    addWalkthroughStep(
      `Query RMQ(${left}, ${right}): k = floor(log2(${len})) = ${k}. Overlapping blocks st[${left}][${k}] (${val1}) and st[${rightStart}][${k}] (${val2}) yield minimum = ${ans} in O(1) time.`,
      currentTable,
      [
        [left, k],
        [rightStart, k],
      ],
    );
  }

  addWalkthroughStep(
    "All Sparse Table queries executed successfully in O(1) constant time per query.",
    currentTable,
  );

  return steps;
};

const SPARSE_TABLE_RMQ_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>A <strong>Sparse Table</strong> precomputes range minimums for power-of-two interval lengths. Leveraging the idempotence of minimum operations, it achieves <code>O(N log N)</code> precomputation time and <code>O(1)</code> constant query time on static arrays.</p>",
  sections: [
    {
      heading: "Idempotence and O(1) Queries",
      body: "<p>Because <code>min(a, a) = a</code>, we can answer any range query [L, R] by combining two overlapping intervals of length <code>2^k</code> in constant time without double-counting errors.</p>",
    },
  ],
};

const SPARSE_TABLE_RMQ_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports math module.",
    31: "Returns min of overlapping intervals.",
  },
};

export const sparseTableRmq: AlgorithmDefinition<SparseTableRmqInput> = {
  id: "sparse-table-rmq",
  title: "Sparse Table (Range Minimum Query)",
  topicIds: ["advanced_range_queries"],
  difficulty: "Medium",
  description:
    "<p>A <strong>Sparse Table</strong> precomputes range minimums for power-of-two interval lengths. Leveraging the idempotence of minimum operations, it achieves <code>O(N log N)</code> precomputation time and <code>O(1)</code> constant query time on static arrays.</p><h3>Input Parameters</h3><ul><li><code>array</code>: Initial static numerical array.</li><li><code>queries</code>: Array of range minimum queries <code>[left, right]</code>.</li></ul><h3>Output</h3><ul><li><code>int / Array</code>: Range minimum answers for each query.</li></ul>",
  constraints: ["1 <= N <= 10^5", "1 <= Q <= 10^5", "-10^9 <= array[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
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
      scenario: "adversarial",
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
      scenario: "boundary",
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

export default sparseTableRmq;
