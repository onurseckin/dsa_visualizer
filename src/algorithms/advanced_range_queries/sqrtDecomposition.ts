import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  MatrixCellItem,
  MatrixVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface SqrtDecompositionOp {
  type: "query" | "update";
  left?: number;
  right?: number;
  index?: number;
  value?: number;
}

export interface SqrtDecompositionInput {
  array: number[];
  operations: SqrtDecompositionOp[];
}

export const SQRT_DECOMPOSITION_CODE = `import math

class SqrtDecomposition:
    def __init__(self, arr: list[int]):
        self.arr = list(arr)
        self.n = len(arr)
        self.block_size = max(1, int(math.isqrt(self.n))) if self.n > 0 else 1
        num_blocks = math.ceil(self.n / self.block_size) if self.n > 0 else 0
        self.blocks = [0] * num_blocks
        for i in range(self.n):
            self.blocks[i // self.block_size] += self.arr[i]

    def update(self, idx: int, val: int):
        b_idx = idx // self.block_size
        diff = val - self.arr[idx]
        self.arr[idx] = val
        self.blocks[b_idx] += diff

    def query(self, left: int, right: int) -> int:
        b_left = left // self.block_size
        b_right = right // self.block_size
        total = 0
        if b_left == b_right:
            for i in range(left, right + 1):
                total += self.arr[i]
        else:
            for i in range(left, (b_left + 1) * self.block_size):
                total += self.arr[i]
            for b in range(b_left + 1, b_right):
                total += self.blocks[b]
            for i in range(b_right * self.block_size, right + 1):
                total += self.arr[i]
        return total`;

export const DEFAULT_SQRT_DECOMPOSITION_INPUT: SqrtDecompositionInput = {
  array: [1, 5, 2, 4, 6, 1, 3, 8, 9],
  operations: [
    { type: "query", left: 1, right: 7 },
    { type: "update", index: 3, value: 10 },
    { type: "query", left: 1, right: 7 },
  ],
};

export const generateSqrtDecompositionSteps = (input: SqrtDecompositionInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const safeInput = {
    array: Array.isArray(input?.array) ? input.array : DEFAULT_SQRT_DECOMPOSITION_INPUT.array,
    operations: Array.isArray(input?.operations)
      ? input.operations
      : DEFAULT_SQRT_DECOMPOSITION_INPUT.operations,
  };
  const arr = [...safeInput.array];
  const n = arr.length;
  const blockSize = n > 0 ? Math.max(1, Math.floor(Math.sqrt(n))) : 1;
  const numBlocks = n > 0 ? Math.ceil(n / blockSize) : 0;
  const blocks: number[] = Array(numBlocks).fill(0);

  const makeMatrixSnapshot = (
    activeIndices?: number[],
    compareIndices?: number[],
    activeBlocks?: number[],
    compareBlocks?: number[],
  ): MatrixVisualSnapshot => {
    const cols = Math.max(n, 1);
    const cells: MatrixCellItem[] = [];

    for (let i = 0; i < n; i++) {
      const bIdx = Math.floor(i / blockSize);
      let state: ElementState = "default";
      if (activeBlocks && activeBlocks.includes(bIdx)) {
        state = "active";
      } else if (compareBlocks && compareBlocks.includes(bIdx)) {
        state = "compare";
      }

      cells.push({
        row: 0,
        col: i,
        value: blocks[bIdx] ?? 0,
        state,
        label: `Block ${bIdx}`,
      });
    }

    for (let i = 0; i < n; i++) {
      let state: ElementState = "default";
      if (activeIndices && activeIndices.includes(i)) {
        state = "active";
      } else if (compareIndices && compareIndices.includes(i)) {
        state = "compare";
      }

      cells.push({
        row: 1,
        col: i,
        value: arr[i],
        state,
        label: `arr[${i}]`,
      });
    }

    return {
      kind: "matrix" as const,
      rows: 2,
      cols,
      cells,
      rowHeaders: ["Block Sums", "Array Elements"],
      colHeaders: Array.from({ length: cols }, (_, i) => `[${i}]`),
      title: "SQRT Decomposition (Block Sums & Array)",
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeIndices?: number[],
    compareIndices?: number[],
    activeBlocks?: number[],
    compareBlocks?: number[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: makeMatrixSnapshot(
        activeIndices,
        compareIndices,
        activeBlocks,
        compareBlocks,
      ),
      auxiliaryState: {
        customState: {
          blockSize,
          numBlocks,
        },
      },
      variables,
    });
  };

  addStep(
    4,
    "Initialize SQRT Decomposition",
    `Partitioning N=${n} array elements into blocks of size S=floor(sqrt(${n}))=${blockSize}. Total blocks K=${numBlocks}.`,
    { n, blockSize, numBlocks },
  );

  if (n === 0) {
    addStep(6, "Array is empty", "No elements or blocks to build for an empty array.", {
      n: 0,
      blockSize: 1,
      numBlocks: 0,
    });
    return steps;
  }

  for (let i = 0; i < n; i++) {
    const bIdx = Math.floor(i / blockSize);
    blocks[bIdx] += arr[i];
    addStep(
      11,
      `Accumulate arr[${i}] = ${arr[i]} into block ${bIdx}`,
      `Adding element ${i} (${arr[i]}) into block ${bIdx} sum (now ${blocks[bIdx]}).`,
      { i, val: arr[i], bIdx, currentBlockSum: blocks[bIdx] },
      [i],
      undefined,
      [bIdx],
    );
  }

  addStep(
    11,
    "Block precomputation complete",
    `Precomputed aggregate block sums: [${blocks.join(", ")}]. Block row now contains O(sqrt(N)) block sum values.`,
    { blockSize, blockSums: blocks.join(", ") },
    undefined,
    Array.from({ length: n }, (_, i) => i),
    Array.from({ length: numBlocks }, (_, b) => b),
  );

  const ops = safeInput.operations;
  for (let opIdx = 0; opIdx < ops.length; opIdx++) {
    const op = ops[opIdx];
    if (op.type === "update") {
      const idx = op.index ?? 0;
      const val = op.value ?? 0;
      if (idx < 0 || idx >= n) continue;

      const oldVal = arr[idx];
      const bIdx = Math.floor(idx / blockSize);
      const diff = val - oldVal;

      addStep(
        14,
        `Update arr[${idx}] from ${oldVal} to ${val}`,
        `Element index ${idx} maps to block ${bIdx}. Delta diff = ${val} - ${oldVal} = ${diff}.`,
        { opIndex: opIdx + 1, idx, oldVal, val, bIdx, diff },
        [idx],
        undefined,
        [bIdx],
      );

      arr[idx] = val;
      blocks[bIdx] += diff;

      addStep(
        17,
        `Point update applied: Block ${bIdx} sum = ${blocks[bIdx]}`,
        `Updated arr[${idx}] = ${val} and adjusted block ${bIdx} sum in O(1) constant time without re-scanning block elements.`,
        { bIdx, newBlockSum: blocks[bIdx] },
        [idx],
        undefined,
        [bIdx],
      );
    } else {
      const left = op.left ?? 0;
      const right = op.right ?? n - 1;
      const L = Math.max(0, Math.min(left, n - 1));
      const R = Math.max(L, Math.min(right, n - 1));

      const bLeft = Math.floor(L / blockSize);
      const bRight = Math.floor(R / blockSize);

      addStep(
        19,
        `Query operation ${opIdx + 1}: range sum over [${L}..${R}]`,
        `Initiating range sum query over [${L}..${R}]. Spans starting block ${bLeft} to ending block ${bRight}.`,
        { opIndex: opIdx + 1, L, R, bLeft, bRight },
        Array.from({ length: R - L + 1 }, (_, k) => L + k),
        undefined,
        Array.from({ length: bRight - bLeft + 1 }, (_, k) => bLeft + k),
      );

      let querySum = 0;
      if (bLeft === bRight) {
        for (let i = L; i <= R; i++) {
          querySum += arr[i];
        }
        addStep(
          25,
          `Single-block query sum over [${L}..${R}] = ${querySum}`,
          `Query range is completely contained within block ${bLeft}. Iterated over ${R - L + 1} elements directly in O(sqrt(N)) time.`,
          { L, R, block: bLeft, querySum },
          Array.from({ length: R - L + 1 }, (_, k) => L + k),
          undefined,
          [bLeft],
        );
      } else {
        const headEnd = (bLeft + 1) * blockSize - 1;
        let headSum = 0;
        const headIndices: number[] = [];
        for (let i = L; i <= headEnd; i++) {
          headSum += arr[i];
          headIndices.push(i);
        }

        addStep(
          28,
          `Partial head scan in block ${bLeft} [${L}..${headEnd}] = ${headSum}`,
          `Iterated through partial head elements from L=${L} to end of block ${bLeft} (index ${headEnd}).`,
          { bLeft, L, headEnd, headSum },
          headIndices,
          undefined,
          [bLeft],
        );

        let midSum = 0;
        const midBlocks: number[] = [];
        for (let b = bLeft + 1; b < bRight; b++) {
          midSum += blocks[b];
          midBlocks.push(b);
        }

        if (midBlocks.length > 0) {
          addStep(
            30,
            `Full middle block sums for blocks [${midBlocks.join(", ")}] = ${midSum}`,
            `Added precomputed block sums for ${midBlocks.length} full middle blocks directly in O(1) time per block.`,
            { midBlocks: midBlocks.join(", "), midSum },
            undefined,
            undefined,
            midBlocks,
          );
        }

        const tailStart = bRight * blockSize;
        let tailSum = 0;
        const tailIndices: number[] = [];
        for (let i = tailStart; i <= R; i++) {
          tailSum += arr[i];
          tailIndices.push(i);
        }

        addStep(
          32,
          `Partial tail scan in block ${bRight} [${tailStart}..${R}] = ${tailSum}`,
          `Iterated through partial tail elements from start of block ${bRight} (index ${tailStart}) to R=${R}.`,
          { bRight, tailStart, R, tailSum },
          tailIndices,
          undefined,
          [bRight],
        );

        querySum = headSum + midSum + tailSum;

        addStep(
          33,
          `Total range sum [${L}..${R}] = ${querySum}`,
          `Combined head (${headSum}) + full blocks (${midSum}) + tail (${tailSum}) to compute total range sum ${querySum} in O(sqrt(N)) time.`,
          { L, R, querySum, headSum, midSum, tailSum },
          Array.from({ length: R - L + 1 }, (_, k) => L + k),
          undefined,
          Array.from({ length: bRight - bLeft + 1 }, (_, k) => bLeft + k),
        );
      }
    }
  }

  return steps;
};

export const SQRT_DECOMPOSITION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p><strong>SQRT Decomposition</strong> is a versatile algorithmic technique that partitions an array of <code>N</code> elements into contiguous blocks of size <code>S = sqrt(N)</code>. By maintaining precomputed aggregate summaries for each of the blocks, range queries can be evaluated in <code>O(sqrt(N))</code> time and point updates executed in <code>O(1)</code> constant time. It provides a simple, flexible alternative to trees when operations are non-associative or when offline block reordering (like Mo's Algorithm) is required.</p>",
  sections: [
    {
      heading: "1. Block Partitioning & Index Mapping",
      body: "<p>An array of <code>N</code> elements is partitioned into <code>K = ceil(N / S)</code> blocks of size <code>S = floor(sqrt(N))</code>.</p><ul><li>Any index <code>i</code> belongs to block <code>b = floor(i / S)</code>.</li><li>Precomputing block sums takes <code>O(N)</code> time in a single linear pass.</li><li>For <code>N = 10,000</code>, <code>S = 100</code>, producing 100 blocks of 100 elements each.</li></ul>",
    },
    {
      heading: "2. Range Query Breakdown: Head, Middle, & Tail",
      body: "<p>A range query over <code>[L...R]</code> spans block <code>b_left = floor(L / S)</code> and block <code>b_right = floor(R / S)</code>:</p><ul><li><strong>Single Block (b_left = b_right)</strong>: Scan elements directly from <code>L</code> to <code>R</code> in <code>O(sqrt(N))</code> time.</li><li><strong>Multi Block (b_left &lt; b_right)</strong>:<ul><li><strong>Partial Head</strong>: Iterate through elements from <code>L</code> to the end of block <code>b_left</code>.</li><li><strong>Full Middle Blocks</strong>: Sum precomputed block totals <code>blocks[b]</code> for intermediate blocks <code>b_left + 1 ... b_right - 1</code> in <code>O(1)</code> time per block.</li><li><strong>Partial Tail</strong>: Iterate through elements from the start of block <code>b_right</code> to <code>R</code>.</li></ul></li></ul>",
    },
    {
      heading: "3. Constant Time O(1) Point Updates",
      body: "<p>Updating element <code>arr[idx]</code> to value <code>v</code> updates the block sum via delta adjustment:</p><p><code>Delta = v - arr[idx]</code><br /><code>arr[idx] = v</code><br /><code>blocks[floor(idx / S)] = blocks[floor(idx / S)] + Delta</code></p><p>This executes in <code>O(1)</code> time without re-scanning block elements or traversing tree branches.</p>",
    },
    {
      heading: "4. Trade-off Matrix: SQRT Decomposition vs Segment Tree",
      body: "<p>Comparing square-root block decomposition against dynamic tree structures:</p><ul><li><strong>Query Complexity</strong>: SQRT Decomposition runs in <code>O(sqrt(N))</code> versus Segment Tree's <code>O(log N)</code>.</li><li><strong>Update Complexity</strong>: SQRT Decomposition achieves <code>O(1)</code> point updates versus <code>O(log N)</code> for Segment Trees.</li><li><strong>Implementation</strong>: Array loops without recursion vs recursive binary trees.</li><li><strong>Flexibility</strong>: Easily supports nested data structures per block and offline query reordering.</li></ul>",
    },
    {
      heading: "5. Interview Pitfalls & Mo's Algorithm Extension",
      body: "<ul><li><strong>Block Size Choice</strong>: Choosing <code>S = sqrt(N)</code> minimizes total query operations (<code>S + N/S &ge; 2 * sqrt(N)</code> by AM-GM inequality).</li><li><strong>Mo's Algorithm</strong>: Offline range queries can be sorted by <code>(floor(L / S), R)</code> to answer <code>Q</code> queries in <code>O((N + Q) * sqrt(N))</code> time.</li></ul>",
    },
  ],
  keyTerms: [
    {
      term: "Block Size (S = sqrt N)",
      definition:
        "The optimal block size S = floor(sqrt(N)) balancing partial block scans and full block aggregations.",
    },
    {
      term: "Block Aggregate",
      definition:
        "The precomputed aggregate value (e.g., sum, minimum) representing an entire block of S elements.",
    },
    {
      term: "Partial Block",
      definition:
        "A boundary block only partially contained in query [L...R], requiring individual element iteration.",
    },
    {
      term: "Full Block",
      definition:
        "A block completely contained inside query [L...R], permitting O(1) aggregate additions.",
    },
  ],
};

export const SQRT_DECOMPOSITION_TRIVIA: TriviaMeta = {
  skipLines: [2, 12, 18],
  distractors: [
    "self.block_size = max(1, self.n // 2)",
    "blocks[idx // self.block_size] += val",
    "total += self.arr[i]",
    "return total // self.block_size",
  ],
  hints: [
    {
      line: 6,
      hint: "Determine optimal block size S = floor(sqrt(N)) and calculate total block count.",
    },
    {
      line: 16,
      hint: "When updating arr[idx], adjust precomputed block aggregate blocks[b] by value difference.",
    },
    {
      line: 23,
      hint: "If L and R lie within the same block, iterate linearly over range [L...R].",
    },
    {
      line: 30,
      hint: "Sum full intermediate blocks in O(1) time using precomputed block aggregates.",
    },
  ],
  lineExplanations: {
    1: "Imports math module for floor square root and ceiling operations.",
    2: "Blank line separating imports.",
    3: "Defines SqrtDecomposition class maintaining block aggregates for O(sqrt N) queries.",
    4: "Constructor taking input sequence arr.",
    5: "Creates a copy of input array arr.",
    6: "Stores array size n.",
    7: "Calculates optimal block size as max(1, int(math.isqrt(n))).",
    8: "Calculates number of blocks num_blocks = ceil(n / block_size).",
    9: "Allocates blocks array initialized to 0 for block sum aggregates.",
    10: "Loops over all array elements i to accumulate block totals.",
    11: "Adds arr[i] to its corresponding block sum: blocks[i // block_size].",
    12: "Blank line separating constructor.",
    13: "Defines update(idx, val) to update element at index idx to new value val.",
    14: "Determines parent block index: b_idx = idx // block_size.",
    15: "Computes delta difference: diff = val - arr[idx].",
    16: "Updates original array value arr[idx] = val.",
    17: "Adjusts parent block total: blocks[b_idx] += diff in O(1) time.",
    18: "Blank line separating update method.",
    19: "Defines query(left, right) returning range sum over [left..right].",
    20: "Determines starting block index b_left = left // block_size.",
    21: "Determines ending block index b_right = right // block_size.",
    22: "Initializes total sum accumulator variable to 0.",
    23: "Checks if query range falls entirely within a single block (b_left == b_right).",
    24: "Loops over elements from left to right within single block.",
    25: "Accumulates element arr[i] directly into total.",
    26: "Else branch when query spans multiple blocks.",
    27: "Loops over partial head elements in block b_left from left to end of block.",
    28: "Accumulates partial head elements arr[i] into total.",
    29: "Loops over complete middle blocks b from b_left + 1 to b_right - 1.",
    30: "Adds precomputed full block sums blocks[b] directly in O(1) time per block.",
    31: "Loops over partial tail elements in block b_right from start of block to right.",
    32: "Accumulates partial tail elements arr[i] into total.",
    33: "Returns computed range sum total.",
  },
};

export const sqrtDecomposition: AlgorithmDefinition<SqrtDecompositionInput> = {
  id: "sqrt-decomposition",
  title: "SQRT Decomposition (Range Queries & Updates)",
  topicIds: ["advanced_range_queries"],
  difficulty: "Medium",
  description:
    "<p><strong>SQRT Decomposition</strong> partitions an array into blocks of size <code>floor(sqrt(N))</code>. Point updates take <code>O(1)</code> time and range queries take <code>O(sqrt(N))</code> time by combining precomputed block aggregates with partial block scans.</p>",
  constraints: ["1 <= N <= 10^5", "1 <= Q <= 10^5", "-10^9 <= array[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Basic Example",
      inputDisplay:
        "arr = [1, 5, 2, 4, 6, 1, 3, 8, 9], ops = [query(1,7), update(3,10), query(1,7)]",
      outputDisplay: "Query 1: 29, Query 2: 35",
      input: {
        array: [1, 5, 2, 4, 6, 1, 3, 8, 9],
        operations: [
          { type: "query", left: 1, right: 7 },
          { type: "update", index: 3, value: 10 },
          { type: "query", left: 1, right: 7 },
        ],
      },
      output: "Query 1: 29, Query 2: 35",
      explanation:
        "Array of N=9 has block size 3. Range [1..7] spans block 0 tail, block 1 full, and block 2 head. Update changes arr[3] from 4 to 10.",
    },
    {
      kind: "complex",
      title: "Complex Edge Case",
      inputDisplay:
        "arr = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160], ops = [query(0,15)]",
      outputDisplay: "Query: 1360",
      input: {
        array: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160],
        operations: [{ type: "query", left: 0, right: 15 }],
      },
      output: "Query: 1360",
      explanation:
        "N=16 has block size 4. Full query aggregates 4 complete blocks in O(sqrt(N)) steps.",
    },
    {
      kind: "negative",
      title: "Failing / Boundary Case",
      inputDisplay: "arr = [5], ops = [query(0,0)]",
      outputDisplay: "Query: 5",
      input: {
        array: [5],
        operations: [{ type: "query", left: 0, right: 0 }],
      },
      output: "Query: 5",
      explanation: "Single element array N=1; block size 1, query returns arr[0] directly.",
    },
  ],
  code: SQRT_DECOMPOSITION_CODE,
  timeComplexity: {
    best: "O(sqrt n)",
    average: "O(sqrt n)",
    worst: "O(sqrt n)",
  },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "Point updates adjust one block sum in O(1) time. Range queries visit at most 2 partial blocks and O(sqrt n) full blocks, running in O(sqrt n) time per query.",
    space:
      "Requires O(n) space to store original array and O(sqrt n) space for block aggregate sums.",
  },
  topicGuide: SQRT_DECOMPOSITION_TOPIC_GUIDE,
  trivia: SQRT_DECOMPOSITION_TRIVIA,
  sources: [
    {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 9,
      section: "9.2 Sqrt decomposition",
      label: "Competitive Programmer's Handbook, Ch 9",
    },
  ],
  defaultInput: DEFAULT_SQRT_DECOMPOSITION_INPUT,
  generateSteps: generateSqrtDecompositionSteps,
};
