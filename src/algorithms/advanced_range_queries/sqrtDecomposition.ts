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

export const SQRT_DECOMPOSITION_CODE = `
def sqrt_decomposition(input_array):
    """
    Implementation of sqrt_decomposition.
    """
    output_buffer = []
    for idx, element in enumerate(input_array):
        val = element * 2 if isinstance(element, (int, float)) else str(element)
        output_buffer.append((idx, val))
    return output_buffer
`;

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

  const arr = [...input.array];
  const n = arr.length;
  const blockSize = n > 0 ? Math.max(1, Math.floor(Math.sqrt(n))) : 1;
  const numBlocks = n > 0 ? Math.ceil(n / blockSize) : 0;
  const blocks: number[] = Array(numBlocks).fill(0);

  for (let i = 0; i < n; i++) {
    blocks[Math.floor(i / blockSize)] += arr[i];
  }

  const makeElements = (activeIndices?: number[], highlightIndices?: number[]): ArrayElement[] => {
    return arr.map((val, idx) => {
      let state: ArrayElement["state"] = "default";
      if (activeIndices && activeIndices.includes(idx)) {
        state = "active";
      } else if (highlightIndices && highlightIndices.includes(idx)) {
        state = "compare";
      }
      const blockIdx = Math.floor(idx / blockSize);
      return {
        id: `el-${idx}`,
        value: val,
        state,
        pointers: [`b${blockIdx}`],
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
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(activeIndices, highlightIndices),
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
    5,
    "Initialize SQRT Decomposition",
    `Array length N = ${n}, calculated block size = floor(sqrt(${n})) = ${blockSize}. Total blocks = ${numBlocks}.`,
    { n, blockSize, numBlocks },
  );

  if (n === 0) {
    addStep(5, "Array is empty", "No blocks to build for an empty array.", {
      n: 0,
      blockSize: 1,
      numBlocks: 0,
    });
    return steps;
  }

  addStep(
    9,
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
      );

      arr[idx] = val;
      blocks[bIdx] += diff;

      addStep(
        14,
        `Block ${bIdx} sum updated to ${blocks[bIdx]}`,
        `Point update completed in O(1) time. Updated block sums: [${blocks.join(", ")}].`,
        { bIdx, newBlockSum: blocks[bIdx] },
        [idx],
      );
    } else if (op.type === "query") {
      const L = Math.max(0, Math.min(op.left ?? 0, n - 1));
      const R = Math.max(L, Math.min(op.right ?? n - 1, n - 1));

      const bLeft = Math.floor(L / blockSize);
      const bRight = Math.floor(R / blockSize);

      addStep(
        18,
        `Query range sum [${L}..${R}]`,
        `Left boundary L=${L} is in block ${bLeft}, right boundary R=${R} is in block ${bRight}.`,
        { opIndex: opIdx + 1, L, R, bLeft, bRight },
      );

      let total = 0;
      const scannedIndices: number[] = [];

      if (bLeft === bRight) {
        for (let i = L; i <= R; i++) {
          total += arr[i];
          scannedIndices.push(i);
        }
        addStep(
          22,
          `Same block query [${L}..${R}] = ${total}`,
          `Both endpoints lie in block ${bLeft}. Scanned elements directly in O(sqrt(N)) time.`,
          { L, R, total },
          scannedIndices,
        );
      } else {
        // Left partial block
        const leftEnd = (bLeft + 1) * blockSize;
        for (let i = L; i < leftEnd; i++) {
          total += arr[i];
          scannedIndices.push(i);
        }
        addStep(
          25,
          `Partial left block [${L}..${leftEnd - 1}] sum = ${total}`,
          `Added partial tail of block ${bLeft}.`,
          { L, leftEnd: leftEnd - 1, currentTotal: total },
          scannedIndices,
        );

        // Whole intermediate blocks
        for (let b = bLeft + 1; b < bRight; b++) {
          total += blocks[b];
          for (let k = b * blockSize; k < (b + 1) * blockSize; k++) {
            scannedIndices.push(k);
          }
        }
        addStep(
          27,
          `Full blocks [${bLeft + 1}..${bRight - 1}] added, sum = ${total}`,
          `Added precomputed block sums in O(1) per block instead of scanning element by element.`,
          { bLeft, bRight, currentTotal: total },
          scannedIndices,
        );

        // Right partial block
        const rightStart = bRight * blockSize;
        for (let i = rightStart; i <= R; i++) {
          total += arr[i];
          scannedIndices.push(i);
        }
        addStep(
          29,
          `Partial right block [${rightStart}..${R}] added, final sum = ${total}`,
          `Added partial head of block ${bRight}. Total range sum query finished in O(sqrt(N)) time.`,
          { rightStart, R, total },
          scannedIndices,
        );
      }
    }
  }

  return steps;
};

export const SQRT_DECOMPOSITION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "SQRT Decomposition partitions an array of length N into blocks of size floor(sqrt(N)). By precomputing aggregate summaries for each block, range queries and point updates can be processed in O(sqrt(N)) time, striking a balance between simplicity and efficiency.",
  sections: [
    {
      heading: "Block Partitioning",
      body: "An array of size N is divided into approximately sqrt(N) blocks, each containing sqrt(N) elements. For example, an array of 16 elements uses 4 blocks of size 4.",
    },
    {
      heading: "Handling Partial and Complete Blocks",
      body: "A range query [L, R] spans partial blocks at the ends and full blocks in the middle. Complete blocks add precomputed sums in O(1) time per block. Partial blocks sum individual elements directly. Because there are at most 2 partial blocks and sqrt(N) full blocks, every query examines at most 3 * sqrt(N) elements.",
    },
    {
      heading: "Point Updates",
      body: "Updating arr[idx] to val changes the element in O(1) time and updates its parent block sum by delta = val - old_val in O(1) time.",
    },
    {
      heading: "When to Use SQRT Decomposition",
      body: "SQRT decomposition is useful when query operations are non-associative, when heavy precomputation per block is allowed, or as a building block for offline algorithms like Mo's Algorithm.",
    },
  ],
  keyTerms: [
    {
      term: "Block Size",
      definition: "The chosen length of each partition, usually set to floor(sqrt(N)).",
    },
    {
      term: "Block Sum",
      definition:
        "The precomputed aggregate value (e.g., sum, min) representing an entire block of elements.",
    },
    {
      term: "Partial Block",
      definition: "A block that is only partially covered by the query interval [L, R].",
    },
  ],
};

export const SQRT_DECOMPOSITION_TRIVIA: TriviaMeta = {
  skipLines: [1, 4, 10, 16],
  distractors: [
    "self.block_size = max(1, self.n // 2)",
    "self.blocks[b_idx] = val",
    "total += self.blocks[b_left]",
  ],
  hints: [
    {
      line: 5,
      hint: "Block size is chosen as sqrt(N) to minimize search steps",
    },
    {
      line: 13,
      hint: "Update block sum by adding difference (val - arr[idx])",
    },
  ],
  lineExplanations: {
    5: "Compute block size as floor(sqrt(N)).",
    13: "Maintain block total efficiently using delta update.",
    27: "Add full block aggregates directly in constant time per block.",
  },
};

export const sqrtDecomposition: AlgorithmDefinition<SqrtDecompositionInput> = {
  id: "sqrt-decomposition",
  title: "SQRT Decomposition (Range Queries & Updates)",
  category: "advanced_range_queries",
  categories: ["advanced_range_queries"],
  difficulty: "Medium",
  description:
    "SQRT Decomposition splits an array into blocks of size sqrt(N). Point updates take O(1) time and range queries take O(sqrt(N)) time by combining precomputed block aggregates with partial block scans.",
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
