import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  MatrixCellItem,
  MatrixVisualSnapshot,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

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

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "SQRT Decomposition partitions an array of N elements into B = floor(sqrt(N)) contiguous blocks of size B to balance query and update performance.",
    primarySnapshot: {
      kind: "array",
      name: "inputArray",
      elements: [
        { id: "e0", value: 1, state: "default" },
        { id: "e1", value: 5, state: "default" },
        { id: "e2", value: 2, state: "default" },
        { id: "e3", value: 4, state: "default" },
        { id: "e4", value: 6, state: "default" },
        { id: "e5", value: 1, state: "default" },
        { id: "e6", value: 3, state: "default" },
        { id: "e7", value: 8, state: "default" },
        { id: "e8", value: 9, state: "default" },
      ],
    },
  },
  {
    narrative:
      "A raw array allows O(1) point updates but suffers from O(N) range queries; prefix sums allow O(1) queries but suffer from O(N) point updates.",
    primarySnapshot: {
      kind: "array",
      name: "inputArray",
      elements: [
        { id: "e0", value: 1, state: "active" },
        { id: "e1", value: 5, state: "active" },
        { id: "e2", value: 2, state: "active" },
        { id: "e3", value: 4, state: "active" },
        { id: "e4", value: 6, state: "active" },
        { id: "e5", value: 1, state: "active" },
        { id: "e6", value: 3, state: "active" },
        { id: "e7", value: 8, state: "active" },
        { id: "e8", value: 9, state: "active" },
      ],
    },
  },
  {
    narrative:
      "By grouping elements into sqrt(N) blocks, each block caches the precomputed aggregate (such as sum, min, or max) of its constituent items.",
    primarySnapshot: {
      kind: "matrix",
      name: "blocksMatrix",
      rows: 2,
      cols: 9,
      rowHeaders: ["Block Sums", "Elements"],
      cells: [
        { row: 0, col: 0, value: 8, label: "Block 0", state: "active" },
        { row: 0, col: 1, value: 8, label: "Block 0", state: "active" },
        { row: 0, col: 2, value: 8, label: "Block 0", state: "active" },
        { row: 0, col: 3, value: 11, label: "Block 1", state: "visited" },
        { row: 0, col: 4, value: 11, label: "Block 1", state: "visited" },
        { row: 0, col: 5, value: 11, label: "Block 1", state: "visited" },
        { row: 0, col: 6, value: 20, label: "Block 2", state: "compare" },
        { row: 0, col: 7, value: 20, label: "Block 2", state: "compare" },
        { row: 0, col: 8, value: 20, label: "Block 2", state: "compare" },
        { row: 1, col: 0, value: 1, state: "default" },
        { row: 1, col: 1, value: 5, state: "default" },
        { row: 1, col: 2, value: 2, state: "default" },
        { row: 1, col: 3, value: 4, state: "default" },
        { row: 1, col: 4, value: 6, state: "default" },
        { row: 1, col: 5, value: 1, state: "default" },
        { row: 1, col: 6, value: 3, state: "default" },
        { row: 1, col: 7, value: 8, state: "default" },
        { row: 1, col: 8, value: 9, state: "default" },
      ],
    },
  },
  {
    narrative:
      "A point update modifies element arr[i] and adjusts block sum blocks[i / B] in O(1) constant time without affecting other blocks.",
    primarySnapshot: {
      kind: "matrix",
      name: "blocksMatrix",
      rows: 2,
      cols: 9,
      rowHeaders: ["Block Sums", "Elements"],
      cells: [
        { row: 0, col: 0, value: 8, label: "Block 0", state: "default" },
        { row: 0, col: 1, value: 8, label: "Block 0", state: "default" },
        { row: 0, col: 2, value: 8, label: "Block 0", state: "default" },
        { row: 0, col: 3, value: 17, label: "Block 1", state: "swap" },
        { row: 0, col: 4, value: 17, label: "Block 1", state: "swap" },
        { row: 0, col: 5, value: 17, label: "Block 1", state: "swap" },
        { row: 0, col: 6, value: 20, label: "Block 2", state: "default" },
        { row: 0, col: 7, value: 20, label: "Block 2", state: "default" },
        { row: 0, col: 8, value: 20, label: "Block 2", state: "default" },
        { row: 1, col: 0, value: 1, state: "default" },
        { row: 1, col: 1, value: 5, state: "default" },
        { row: 1, col: 2, value: 2, state: "default" },
        { row: 1, col: 3, value: 10, state: "swap" },
        { row: 1, col: 4, value: 6, state: "default" },
        { row: 1, col: 5, value: 1, state: "default" },
        { row: 1, col: 6, value: 3, state: "default" },
        { row: 1, col: 7, value: 8, state: "default" },
        { row: 1, col: 8, value: 9, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Range queries over subsegment [L, R] break into three portions: the left partial block, middle complete blocks, and right partial block.",
    primarySnapshot: {
      kind: "matrix",
      name: "blocksMatrix",
      rows: 2,
      cols: 9,
      rowHeaders: ["Block Sums", "Elements"],
      cells: [
        { row: 0, col: 0, value: 8, label: "Block 0", state: "default" },
        { row: 0, col: 1, value: 8, label: "Block 0", state: "default" },
        { row: 0, col: 2, value: 8, label: "Block 0", state: "default" },
        { row: 0, col: 3, value: 11, label: "Block 1", state: "active" },
        { row: 0, col: 4, value: 11, label: "Block 1", state: "active" },
        { row: 0, col: 5, value: 11, label: "Block 1", state: "active" },
        { row: 0, col: 6, value: 20, label: "Block 2", state: "default" },
        { row: 0, col: 7, value: 20, label: "Block 2", state: "default" },
        { row: 0, col: 8, value: 20, label: "Block 2", state: "default" },
        { row: 1, col: 0, value: 1, state: "default" },
        { row: 1, col: 1, value: 5, state: "compare" },
        { row: 1, col: 2, value: 2, state: "compare" },
        { row: 1, col: 3, value: 4, state: "default" },
        { row: 1, col: 4, value: 6, state: "default" },
        { row: 1, col: 5, value: 1, state: "default" },
        { row: 1, col: 6, value: 3, state: "compare" },
        { row: 1, col: 7, value: 8, state: "compare" },
        { row: 1, col: 8, value: 9, state: "default" },
      ],
    },
  },
  {
    narrative:
      "Elements in the left partial block are iterated individually, taking at most B = O(sqrt N) steps.",
    primarySnapshot: {
      kind: "array",
      name: "leftPartialBlock",
      elements: [
        { id: "l1", value: 5, label: "arr[1]", state: "active" },
        { id: "l2", value: 2, label: "arr[2]", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Complete middle blocks contribute their precomputed block sums directly in O(1) time per block, stepping through at most O(sqrt N) blocks.",
    primarySnapshot: {
      kind: "array",
      name: "middleBlocks",
      elements: [{ id: "m1", value: 11, label: "blocks[1]", state: "visited" }],
    },
  },
  {
    narrative:
      "Elements in the right partial block are scanned individually, taking at most B = O(sqrt N) steps.",
    primarySnapshot: {
      kind: "array",
      name: "rightPartialBlock",
      elements: [
        { id: "r1", value: 3, label: "arr[6]", state: "active" },
        { id: "r2", value: 8, label: "arr[7]", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Summing the partial head, full middle blocks, and partial tail yields the range sum in at most 3 * sqrt(N) total operations.",
    primarySnapshot: {
      kind: "array",
      name: "sumResult",
      elements: [
        { id: "s1", value: 7, label: "head sum (5+2)", state: "active" },
        { id: "s2", value: 11, label: "middle blocks[1]", state: "visited" },
        { id: "s3", value: 11, label: "tail sum (3+8)", state: "active" },
        { id: "s4", value: 29, label: "total range sum", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "SQRT Decomposition achieves O(sqrt N) query time and O(1) update time with simple flat array structures and zero tree pointer overhead.",
    primarySnapshot: {
      kind: "matrix",
      name: "blocksMatrix",
      rows: 2,
      cols: 9,
      rowHeaders: ["Block Sums", "Elements"],
      cells: [
        { row: 0, col: 0, value: 8, label: "Block 0", state: "sorted" },
        { row: 0, col: 1, value: 8, label: "Block 0", state: "sorted" },
        { row: 0, col: 2, value: 8, label: "Block 0", state: "sorted" },
        { row: 0, col: 3, value: 11, label: "Block 1", state: "sorted" },
        { row: 0, col: 4, value: 11, label: "Block 1", state: "sorted" },
        { row: 0, col: 5, value: 11, label: "Block 1", state: "sorted" },
        { row: 0, col: 6, value: 20, label: "Block 2", state: "sorted" },
        { row: 0, col: 7, value: 20, label: "Block 2", state: "sorted" },
        { row: 0, col: 8, value: 20, label: "Block 2", state: "sorted" },
        { row: 1, col: 0, value: 1, state: "sorted" },
        { row: 1, col: 1, value: 5, state: "sorted" },
        { row: 1, col: 2, value: 2, state: "sorted" },
        { row: 1, col: 3, value: 4, state: "sorted" },
        { row: 1, col: 4, value: 6, state: "sorted" },
        { row: 1, col: 5, value: 1, state: "sorted" },
        { row: 1, col: 6, value: 3, state: "sorted" },
        { row: 1, col: 7, value: 8, state: "sorted" },
        { row: 1, col: 8, value: 9, state: "sorted" },
      ],
    },
  },
];

export const generateSqrtDecompositionSteps = (input: SqrtDecompositionInput): AlgorithmStep[] => {
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
      name: "sqrtDecomposition",
      rows: 2,
      cols,
      cells,
      rowHeaders: ["Block Sums", "Array Elements"],
      colHeaders: Array.from({ length: cols }, (_, i) => `[${i}]`),
    };
  };

  const addWalkthroughStep = (
    narrative: string,
    activeIndices?: number[],
    compareIndices?: number[],
    activeBlocks?: number[],
    compareBlocks?: number[],
  ) => {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative,
        primarySnapshot: makeMatrixSnapshot(
          activeIndices,
          compareIndices,
          activeBlocks,
          compareBlocks,
        ),
      }),
    );
  };

  addWalkthroughStep(
    `Initializing SQRT Decomposition for array [${arr.join(", ")}] of size ${n} with block size B=${blockSize} (${numBlocks} blocks).`,
  );

  if (n === 0) {
    addWalkthroughStep("The input array is empty, so no blocks can be constructed.");
    return steps;
  }

  for (let i = 0; i < n; i++) {
    const bIdx = Math.floor(i / blockSize);
    blocks[bIdx] += arr[i];
    addWalkthroughStep(
      `Added element arr[${i}] (${arr[i]}) into block ${bIdx} sum (accumulated sum = ${blocks[bIdx]}).`,
      [i],
      undefined,
      [bIdx],
    );
  }

  addWalkthroughStep(
    `Completed block precomputation: block sums are [${blocks.join(", ")}].`,
    undefined,
    undefined,
    Array.from({ length: numBlocks }, (_, b) => b),
  );

  for (const op of safeInput.operations) {
    if (op.type === "query" && op.left !== undefined && op.right !== undefined) {
      const { left, right } = op;
      addWalkthroughStep(
        `Starting range sum query for range [${left}..${right}].`,
        Array.from({ length: right - left + 1 }, (_, k) => left + k),
      );

      const bLeft = Math.floor(left / blockSize);
      const bRight = Math.floor(right / blockSize);
      let total = 0;

      if (bLeft === bRight) {
        for (let i = left; i <= right; i++) {
          total += arr[i];
          addWalkthroughStep(
            `Single block range [${left}..${right}]: added arr[${i}] (${arr[i]}) (running sum = ${total}).`,
            [i],
            undefined,
            [bLeft],
          );
        }
      } else {
        const firstBlockEnd = Math.min((bLeft + 1) * blockSize - 1, n - 1);
        for (let i = left; i <= firstBlockEnd; i++) {
          total += arr[i];
          addWalkthroughStep(
            `Left partial block ${bLeft}: added arr[${i}] (${arr[i]}) (running sum = ${total}).`,
            [i],
            undefined,
            [bLeft],
          );
        }

        for (let b = bLeft + 1; b < bRight; b++) {
          total += blocks[b];
          addWalkthroughStep(
            `Middle full block ${b}: added block sum blocks[${b}] (${blocks[b]}) in O(1) time (running sum = ${total}).`,
            undefined,
            undefined,
            [b],
          );
        }

        const lastBlockStart = bRight * blockSize;
        for (let i = lastBlockStart; i <= right; i++) {
          total += arr[i];
          addWalkthroughStep(
            `Right partial block ${bRight}: added arr[${i}] (${arr[i]}) (running sum = ${total}).`,
            [i],
            undefined,
            [bRight],
          );
        }
      }

      addWalkthroughStep(
        `Completed range sum query for [${left}..${right}], obtaining total sum = ${total}.`,
        Array.from({ length: right - left + 1 }, (_, k) => left + k),
      );
    } else if (op.type === "update" && op.index !== undefined && op.value !== undefined) {
      const { index, value } = op;
      const bIdx = Math.floor(index / blockSize);
      const oldVal = arr[index];
      const diff = value - oldVal;
      arr[index] = value;
      blocks[bIdx] += diff;

      addWalkthroughStep(
        `Point update at index ${index}: changed value from ${oldVal} to ${value}, adjusting block ${bIdx} sum by ${diff} (new block sum = ${blocks[bIdx]}).`,
        [index],
        undefined,
        [bIdx],
      );
    }
  }

  addWalkthroughStep(
    "All SQRT Decomposition operations finished successfully. Queries executed in O(sqrt N) time and point updates in O(1) time.",
  );

  return steps;
};

const SQRT_DECOMPOSITION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p><strong>SQRT Decomposition</strong> partitions an array into blocks of size <code>floor(sqrt(N))</code>. Point updates take <code>O(1)</code> time and range queries take <code>O(sqrt(N))</code> time by combining precomputed block aggregates with partial block scans.</p>",
  sections: [
    {
      heading: "Block Division",
      body: "<p>By balancing block size to approximately <code>sqrt(N)</code>, both full block additions and partial block scans take at most <code>O(sqrt(N))</code> steps.</p>",
    },
  ],
};

const SQRT_DECOMPOSITION_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports math module.",
    30: "Calculates block size.",
  },
};

export const sqrtDecomposition: AlgorithmDefinition<SqrtDecompositionInput> = {
  id: "sqrt-decomposition",
  title: "SQRT Decomposition (Range Queries & Updates)",
  topicIds: ["advanced_range_queries"],
  difficulty: "Medium",
  description:
    "<p><strong>SQRT Decomposition</strong> partitions an array into blocks of size <code>floor(sqrt(N))</code>. Point updates take <code>O(1)</code> time and range queries take <code>O(sqrt(N))</code> time by combining precomputed block aggregates with partial block scans.</p><h3>Input Parameters</h3><ul><li><code>array</code>: Initial numerical sequence.</li><li><code>operations</code>: Array of point update and range query operations.</li></ul><h3>Output</h3><ul><li><code>int / Array</code>: Range query answers and updated block aggregates.</li></ul>",
  constraints: ["1 <= N <= 10^5", "1 <= Q <= 10^5", "-10^9 <= array[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
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
      scenario: "adversarial",
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
      scenario: "boundary",
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
      chapter: 27,
      section: "Chapter introduction: square-root range structure",
      label: "Competitive Programmer's Handbook, Ch 27",
    },
  ],
  defaultInput: DEFAULT_SQRT_DECOMPOSITION_INPUT,
  generateSteps: generateSqrtDecompositionSteps,
};

export default sqrtDecomposition;
