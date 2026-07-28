import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
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

  const arr = input.array ? [...input.array] : [];
  const n = arr.length;
  const blockSize = n > 0 ? Math.max(1, Math.floor(Math.sqrt(n))) : 1;
  const numBlocks = n > 0 ? Math.ceil(n / blockSize) : 0;
  const blocks: number[] = Array(numBlocks).fill(0);

  const makeElements = (
    activeIndices?: number[],
    highlightIndices?: number[],
    pointerMap?: Record<number, string[]>,
  ): ArrayElement[] => {
    return arr.map((val, idx) => {
      let state: ArrayElement["state"] = "default";
      if (activeIndices && activeIndices.includes(idx)) {
        state = "active";
      } else if (highlightIndices && highlightIndices.includes(idx)) {
        state = "compare";
      }
      const ptrs = pointerMap && pointerMap[idx] ? pointerMap[idx] : undefined;
      return {
        id: `el-${idx}`,
        value: val,
        state,
        pointers: ptrs,
      };
    });
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeIndices?: number[],
    highlightIndices?: number[],
    pointerMap?: Record<number, string[]>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(activeIndices, highlightIndices, pointerMap),
      },
      auxiliaryState: {
        customState: {
          blockSize: String(blockSize),
          numBlocks: String(numBlocks),
          blockSums: JSON.stringify(blocks),
        },
      },
      variables,
    });
  };

  addStep(
    4,
    "Initialize SQRT Decomposition",
    `Array length N = ${n}, calculated block size = floor(sqrt(${n})) = ${blockSize}. Total blocks = ${numBlocks}.`,
    { n, blockSize, numBlocks },
  );

  if (n === 0) {
    addStep(6, "Array is empty", "No blocks to build for an empty array.", {
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
      `Add arr[${i}] = ${arr[i]} to block ${bIdx}`,
      `Accumulating element ${i} into block ${bIdx}. Current block ${bIdx} sum is ${blocks[bIdx]}.`,
      { i, val: arr[i], bIdx, currentBlockSum: blocks[bIdx] },
      [i],
      undefined,
      { [i]: [`i`, `b${bIdx}`] },
    );
  }

  addStep(
    11,
    "Block precomputation complete",
    `Precomputed sum for each block of size ${blockSize}: [${blocks.join(", ")}]. Each element belongs to block i // ${blockSize}.`,
    { blockSize, blockSums: blocks.join(", ") },
  );

  const ops = input.operations ?? [];
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
        13,
        `Update arr[${idx}] from ${oldVal} to ${val}`,
        `Element index ${idx} falls into block ${bIdx}. Updating arr[${idx}] and adjusting block ${bIdx} sum by delta ${diff}.`,
        { opIndex: opIdx + 1, idx, oldVal, val, bIdx, diff },
        [idx],
        undefined,
        { [idx]: [`idx`] },
      );

      arr[idx] = val;
      blocks[bIdx] += diff;

      addStep(
        17,
        `Block ${bIdx} sum updated to ${blocks[bIdx]}`,
        `Point update completed in O(1) time. Updated block sums: [${blocks.join(", ")}].`,
        { bIdx, newBlockSum: blocks[bIdx] },
        [idx],
        undefined,
        { [idx]: [`idx`, `b${bIdx}`] },
      );
    } else if (op.type === "query") {
      const L = Math.max(0, Math.min(op.left ?? 0, n - 1));
      const R = Math.max(L, Math.min(op.right ?? n - 1, n - 1));

      const bLeft = Math.floor(L / blockSize);
      const bRight = Math.floor(R / blockSize);

      addStep(
        19,
        `Query range sum [${L}..${R}]`,
        `Left boundary L=${L} is in block ${bLeft}, right boundary R=${R} is in block ${bRight}.`,
        { opIndex: opIdx + 1, L, R, bLeft, bRight },
        undefined,
        undefined,
        { [L]: [`L`], [R]: [`R`] },
      );

      let total = 0;
      const scannedIndices: number[] = [];

      if (bLeft === bRight) {
        for (let i = L; i <= R; i++) {
          total += arr[i];
          scannedIndices.push(i);
          addStep(
            25,
            `Scan element arr[${i}] = ${arr[i]} in same block ${bLeft}`,
            `Single-block query: adding element ${i} to running total = ${total}.`,
            { i, val: arr[i], total },
            [i],
            undefined,
            { [L]: [`L`], [R]: [`R`], [i]: [`i`] },
          );
        }
        addStep(
          33,
          `Same block query [${L}..${R}] = ${total}`,
          `Both endpoints lie in block ${bLeft}. Scanned elements directly in O(sqrt(N)) time.`,
          { L, R, total },
          scannedIndices,
          undefined,
          { [L]: [`L`], [R]: [`R`] },
        );
      } else {
        // Left partial block
        const leftEnd = (bLeft + 1) * blockSize;
        for (let i = L; i < leftEnd; i++) {
          total += arr[i];
          scannedIndices.push(i);
          addStep(
            28,
            `Scan partial left element arr[${i}] = ${arr[i]} in block ${bLeft}`,
            `Partial head scan: adding element ${i} to running total = ${total}.`,
            { i, val: arr[i], total },
            [i],
            undefined,
            { [L]: [`L`], [R]: [`R`], [i]: [`i`] },
          );
        }
        addStep(
          28,
          `Partial left block [${L}..${leftEnd - 1}] sum = ${total}`,
          `Added partial tail of block ${bLeft}.`,
          { L, leftEnd: leftEnd - 1, currentTotal: total },
          scannedIndices,
          undefined,
          { [L]: [`L`], [R]: [`R`] },
        );

        // Whole intermediate blocks
        for (let b = bLeft + 1; b < bRight; b++) {
          total += blocks[b];
          const blockIndices: number[] = [];
          for (let k = b * blockSize; k < (b + 1) * blockSize; k++) {
            scannedIndices.push(k);
            blockIndices.push(k);
          }
          addStep(
            30,
            `Add full block ${b} sum = ${blocks[b]}`,
            `Full block skip: adding precomputed sum of block ${b} in O(1) time. Running total = ${total}.`,
            { block: b, blockSum: blocks[b], total },
            blockIndices,
            undefined,
            { [L]: [`L`], [R]: [`R`] },
          );
        }
        addStep(
          30,
          `Full blocks [${bLeft + 1}..${bRight - 1}] added, running sum = ${total}`,
          `Added precomputed block sums in O(1) per block instead of scanning element by element.`,
          { bLeft, bRight, currentTotal: total },
          scannedIndices,
          undefined,
          { [L]: [`L`], [R]: [`R`] },
        );

        // Right partial block
        const rightStart = bRight * blockSize;
        for (let i = rightStart; i <= R; i++) {
          total += arr[i];
          scannedIndices.push(i);
          addStep(
            32,
            `Scan partial right element arr[${i}] = ${arr[i]} in block ${bRight}`,
            `Partial tail scan: adding element ${i} to running total = ${total}.`,
            { i, val: arr[i], total },
            [i],
            undefined,
            { [L]: [`L`], [R]: [`R`], [i]: [`i`] },
          );
        }
        addStep(
          33,
          `Partial right block [${rightStart}..${R}] added, final sum = ${total}`,
          `Added partial head of block ${bRight}. Total range sum query finished in O(sqrt(N)) time.`,
          { rightStart, R, total },
          scannedIndices,
          undefined,
          { [L]: [`L`], [R]: [`R`] },
        );
      }
    }
  }

  return steps;
};

export const SQRT_DECOMPOSITION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "**SQRT Decomposition** is a versatile algorithmic technique that partitions an array of $N$ elements into contiguous blocks of size $S = \\lfloor \\sqrt{N} \\rfloor$. By maintaining precomputed aggregate summaries for each of the $\\approx \\sqrt{N}$ blocks, range queries can be evaluated in $O(\\sqrt{N})$ time and point updates executed in $O(1)$ constant time. It provides a simple, flexible alternative to trees when operations are non-associative or when offline block reordering (like Mo's Algorithm) is required.",
  sections: [
    {
      heading: "1. Block Partitioning & Index Mapping",
      body: "An array of $N$ elements is partitioned into $K = \\lceil N / S \\rceil$ blocks of size $S = \\lfloor \\sqrt{N} \\rfloor$.\n\n- Any index $i$ belongs to block $b = i \\ // \\ S$.\n- Precomputing block sums takes $O(N)$ time in a single linear pass.\n- For $N = 10,000$, $S = 100$, producing $100$ blocks of $100$ elements each.",
    },
    {
      heading: "2. Range Query Breakdown: Head, Middle, & Tail",
      body: "A range query over $[L \\dots R]$ spans block $b_{\\text{left}} = L // S$ and block $b_{\\text{right}} = R // S$:\n\n- **Single Block** ($b_{\\text{left}} = b_{\\text{right}}$): Scan elements directly from $L$ to $R$ in $O(\\sqrt{N})$ time.\n- **Multi Block** ($b_{\\text{left}} < b_{\\text{right}}$):\n  1. **Partial Head**: Iterate through elements from $L$ to the end of block $b_{\\text{left}}$.\n  2. **Full Middle Blocks**: Sum precomputed block totals $\\text{blocks}[b]$ for intermediate blocks $b_{\\text{left}} + 1 \\dots b_{\\text{right}} - 1$ in $O(1)$ time per block.\n  3. **Partial Tail**: Iterate through elements from the start of block $b_{\\text{right}}$ to $R$.",
    },
    {
      heading: "3. Constant Time $O(1)$ Point Updates",
      body: "Updating element $\\text{arr}[\\text{idx}]$ to value $v$ updates the block sum via delta adjustment:\n\n$$\\Delta = v - \\text{arr}[\\text{idx}]$$\n$$\\text{arr}[\\text{idx}] \\leftarrow v$$\n$$\\text{blocks}[\\text{idx} // S] \\leftarrow \\text{blocks}[\\text{idx} // S] + \\Delta$$\n\nThis executes in $O(1)$ time without re-scanning block elements or traversing tree branches.",
    },
    {
      heading: "4. Trade-off Matrix: SQRT Decomposition vs Segment Tree",
      body: "| Feature | SQRT Decomposition | Segment Tree |\n| :--- | :--- | :--- |\n| **Query Complexity** | $O(\\sqrt{N})$ | $O(\\log N)$ |\n| **Update Complexity** | $O(1)$ point update | $O(\\log N)$ point/range update |\n| **Implementation** | Array loops, no recursion | Recursive binary tree |\n| **Flexibility** | Supports nested data structures per block | Requires associative operations |",
    },
    {
      heading: "5. Interview Pitfalls & Mo's Algorithm Extension",
      body: "- **Block Size Choice**: Choosing $S = \\sqrt{N}$ minimizes total query operations ($S + N/S \\ge 2\\sqrt{N}$ by AM-GM inequality).\n- **Mo's Algorithm**: Offline range queries can be sorted by $(L // S, R)$ to answer $Q$ queries in $O((N + Q) \\sqrt{N})$ time.",
    },
  ],
  keyTerms: [
    {
      term: "Block Size (S = sqrt N)",
      definition:
        "The optimal block size $S = \\lfloor \\sqrt{N} \\rfloor$ balancing partial block scans and full block aggregations.",
    },
    {
      term: "Block Aggregate",
      definition:
        "The precomputed aggregate value (e.g., sum, minimum) representing an entire block of $S$ elements.",
    },
    {
      term: "Partial Block",
      definition:
        "A boundary block only partially contained in query $[L \\dots R]$, requiring individual element iteration.",
    },
    {
      term: "Full Block",
      definition:
        "A block completely contained inside query $[L \\dots R]$, permitting $O(1)$ aggregate additions.",
    },
  ],
};

export const SQRT_DECOMPOSITION_TRIVIA: TriviaMeta = {
  skipLines: [2, 12, 18],
  distractors: [
    "self.block_size = max(1, self.n // 2)",
    "self.blocks[b_idx] = val",
    "total += self.blocks[b_left]",
  ],
  hints: [
    {
      line: 7,
      hint: "Block size is chosen as sqrt(N) to minimize search steps",
    },
    {
      line: 17,
      hint: "Update block sum by adding difference (val - arr[idx])",
    },
  ],
  lineExplanations: {
    1: "Imports the math module for floor square root and ceiling operations.",
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
    "**SQRT Decomposition** partitions an array into blocks of size $\\lfloor \\sqrt{N} \\rfloor$. Point updates take $O(1)$ time and range queries take $O(\\sqrt{N})$ time by combining precomputed block aggregates with partial block scans.",
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
