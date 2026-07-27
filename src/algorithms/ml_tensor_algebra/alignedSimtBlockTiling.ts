import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface alignedSimtBlockTilingInput {
  data: number[];
  blockSize?: number;
  alignment?: number;
  target?: number;
}

export const ALIGNEDSIMTBLOCKTILING_CODE = `def aligned_simt_block_tiling(data, block_size=4, alignment=16):
    """
    Computes SIMD/SIMT 128-bit aligned memory block tiling and padding.
    """
    n = len(data)
    padding = (alignment - (n % alignment)) % alignment
    padded_len = n + padding
    tiled_blocks = []

    for b in range(0, padded_len, block_size):
        block = []
        for offset in range(block_size):
            idx = b + offset
            val = data[idx] if idx < n else 0
            block.append(val)
        tiled_blocks.append(block)

    return tiled_blocks, padding`;

export const DEFAULT_ALIGNEDSIMTBLOCKTILING_INPUT: alignedSimtBlockTilingInput = {
  data: [10, 20, 30, 40, 50, 60],
  blockSize: 4,
  alignment: 8,
  target: 30,
};

export const generateAlignedSimtBlockTilingSteps = (
  input: alignedSimtBlockTilingInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const data = input.data && input.data.length > 0 ? input.data : [10, 20, 30, 40, 50, 60];
  const blockSize = Math.max(1, input.blockSize ?? 4);
  const alignment = Math.max(1, input.alignment ?? 8);
  const n = data.length;
  const padding = (alignment - (n % alignment)) % alignment;
  const paddedLen = n + padding;
  const numBlocks = Math.ceil(paddedLen / blockSize);

  const buildCells = (
    activeRow?: number,
    activeCol?: number,
    completedRows: number[] = [],
  ): MatrixCellItem[] => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < numBlocks; r++) {
      const bStart = r * blockSize;
      for (let c = 0; c < blockSize; c++) {
        const globalIdx = bStart + c;
        const isData = globalIdx < n;
        const val = isData ? data[globalIdx] : 0;
        let state: MatrixCellItem["state"] = "default";

        if (completedRows.includes(r)) {
          state = "sorted";
        } else if (r === activeRow) {
          if (c === activeCol) {
            state = "active";
          } else {
            state = "compared";
          }
        } else if (!isData) {
          state = "inactive";
        }

        cells.push({
          row: r,
          col: c,
          value: val,
          label: isData ? `D[${globalIdx}]` : `PAD[${globalIdx}]`,
          state,
        });
      }
    }
    return cells;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow?: number,
    activeCol?: number,
    completedRows: number[] = [],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: numBlocks,
        cols: blockSize,
        cells: buildCells(activeRow, activeCol, completedRows),
        rowHeaders: Array.from({ length: numBlocks }, (_, i) => `Block ${i}`),
        colHeaders: Array.from({ length: blockSize }, (_, i) => `Offset ${i}`),
        title: "SIMT Aligned Memory Tiling Grid",
      },
      auxiliaryState: {
        customState: {
          data: `[${data.join(", ")}]`,
          blockSize: String(blockSize),
          alignment: String(alignment),
          padding: String(padding),
          paddedLen: String(paddedLen),
        },
      },
      variables,
    });
  };

  // Step 1: Init function
  addStep(
    1,
    "Initialize SIMD/SIMT Aligned Memory Tiling Engine",
    "Setting up parameters for memory tiling, block sizes, and boundary alignment.",
    { n, block_size: blockSize, alignment },
  );

  addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Computes SIMD/SIMT 128-bit aligned memory block tiling and padding.",
    {},
  );

  addStep(
    3,
    "Docstring body: algorithm description",
    "See the Python docstring for the contract and purpose of this algorithm.",
    {},
  );

  addStep(
    4,
    "End of docstring",
    "Docstring complete. Entering the function body.",
    {},
  );

  // Step 2: Compute n
  addStep(
    5,
    "Compute Input Memory Length",
    `Calculated unpadded input tensor length n = ${n}.`,
    { n },
  );

  // Step 3: Compute padding
  addStep(
    6,
    "Calculate Alignment Padding",
    `padding = (${alignment} - (${n} % ${alignment})) % ${alignment} = ${padding} zero-padding elements required.`,
    { padding, alignment, n },
  );

  // Step 4: Compute padded length
  addStep(
    7,
    "Determine Total Padded Buffer Length",
    `padded_len = ${n} + ${padding} = ${paddedLen} elements.`,
    { padded_len: paddedLen, padding },
  );

  // Step 5: Init tiled_blocks
  addStep(
    8,
    "Initialize Tiled Blocks Container",
    "Allocated empty list tiled_blocks to store partitioned tile blocks.",
    { tiled_blocks_len: 0 },
  );

  const completedRows: number[] = [];

  // Outer loop: b from 0 to paddedLen in block_size steps
  for (let b = 0, r = 0; b < paddedLen; b += blockSize, r++) {
    addStep(
      10,
      `Begin Tile Block ${r} (Byte Offset b=${b})`,
      `Outer loop iteration for b = ${b} of total padded length ${paddedLen}.`,
      { b, block_size: blockSize, padded_len: paddedLen },
      r,
    );

    addStep(
      11,
      `Initialize Storage for Block ${r}`,
      `Created empty list block for tile ${r}.`,
      { b, block_row: r },
      r,
    );

    for (let offset = 0; offset < blockSize; offset++) {
      const idx = b + offset;
      const isData = idx < n;
      const val = isData ? data[idx] : 0;

      addStep(
        12,
        `Loop Offset ${offset} in Block ${r}`,
        `Evaluating inner block offset ${offset}/${blockSize - 1}.`,
        { b, offset, block_size: blockSize },
        r,
        offset,
        completedRows,
      );

      addStep(
        13,
        `Calculate Global Index idx = ${b} + ${offset} = ${idx}`,
        `Computed global buffer offset idx = ${idx}.`,
        { idx, b, offset },
        r,
        offset,
        completedRows,
      );

      addStep(
        14,
        `Fetch Value at Global Index ${idx}`,
        isData
          ? `Extracted data element data[${idx}] = ${val}.`
          : `Global index ${idx} >= n (${n}); padding with zero scalar 0.`,
        { idx, val, is_padded: !isData },
        r,
        offset,
        completedRows,
      );

      addStep(
        15,
        `Append Value ${val} to Block ${r}`,
        `Stored value ${val} into current tile block at offset ${offset}.`,
        { idx, val, block_offset: offset },
        r,
        offset,
        completedRows,
      );
    }

    completedRows.push(r);
    addStep(
      16,
      `Finalize and Append Block ${r}`,
      `Successfully registered block ${r} with ${blockSize} elements.`,
      { block_idx: r, completed_blocks: completedRows.length },
      undefined,
      undefined,
      completedRows,
    );
  }

  // Return step
  addStep(
    18,
    "Return Tiled Blocks and Padding Count",
    `Execution complete. Produced ${numBlocks} tiled blocks with ${padding} padding elements.`,
    { completed: true, total_blocks: numBlocks, padding },
    undefined,
    undefined,
    completedRows,
  );

  return steps;
};

const ALIGNEDSIMTBLOCKTILING_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4],
  distractors: [
    "padding = alignment - (n % alignment)",
    "for b in range(0, n, block_size):",
    "tiled_blocks = data.reshape(-1, block_size)",
  ],
  hints: [
    {
      line: 6,
      hint: "Modular arithmetic (alignment - (n % alignment)) % alignment guarantees padding is 0 when n is already aligned.",
    },
    {
      line: 14,
      hint: "Use conditional expression data[idx] if idx < n else 0 to safely pad out-of-bounds tile slots.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for SIMD/SIMT memory block tiling algorithm with default 4-element blocks and 16-element alignment.",
    2: "Starts docstring for aligned SIMT memory block tiling function.",
    3: "Explains purpose of calculating 128-bit vector aligned memory partitions and zero padding.",
    4: "Closes docstring for aligned block tiling function.",
    5: "Measures actual number of elements N in unpadded input memory buffer.",
    6: "Calculates required zero-padding element count to reach target SIMT memory alignment boundary.",
    7: "Computes total padded memory buffer length N_padded = N + padding.",
    8: "Initializes empty list tiled_blocks to hold partitioned block arrays.",
    9: "Blank line before block slicing loop.",
    10: "Iterates through padded buffer starting indices b in steps of block_size.",
    11: "Initializes empty temporary list block for building current tile.",
    12: "Loops across relative element offsets (0 to block_size - 1) within current tile.",
    13: "Calculates global buffer index idx = b + offset.",
    14: "Fetches element value from data[idx] if within bounds, otherwise pads with scalar zero.",
    15: "Appends fetched or padded value into current tile block.",
    16: "Appends complete block tile to tiled_blocks list.",
    17: "Blank line before return statement.",
    18: "Returns tuple containing list of tiled memory blocks and total padding element count.",
  },
};

export const alignedSimtBlockTiling: AlgorithmDefinition<alignedSimtBlockTilingInput> = {
  id: "aligned-simt-block-tiling",
  title: "SIMD/SIMT Aligned Memory Tiling Engine",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "In high-performance GPU execution pipelines (e.g., PyTorch ATen, Triton, CUDA, and vLLM), memory operations must be coalesced and aligned to 128-bit SIMD/SIMT vector boundaries. When tensor shapes are not exact multiples of block sizes, memory transactions incur unaligned access penalties, leading to multiple DRAM cycles and warp divergence.\n\nThis algorithm computes 128-bit aligned memory block partitions by calculating exact zero-padding element counts ($P = (A - (N \\bmod A)) \\bmod A$) and packing flat 1D memory buffers into fixed-width SIMD execution tiles. Tile elements outside unpadded memory boundaries are dynamically filled with scalar zero padding.\n\n### Problem Solved & ML Compiler Relevance\nGPU global memory transactions achieve peak bandwidth (up to 3.35 TB/s on NVIDIA H100) when 32 threads in a warp read contiguous 128-bit vector words aligned to 16-byte address boundaries. Unaligned accesses force the GPU memory controller to split a single transaction into two uncoalesced memory requests. SIMT block tiling ensures that every thread block reads perfectly aligned memory buffers.\n\n### Step-by-Step Execution\n1. **Unpadded Length Calculation**: Measure total scalar elements $N$ in input buffer.\n2. **Alignment Padding**: Derive zero-padding $P = (A - (N \\bmod A)) \\bmod A$ where $A$ is hardware vector alignment.\n3. **Padded Length Determination**: Set total padded length $N_{padded} = N + P$.\n4. **Tile Slicing & Padding**: Step through $N_{padded}$ in strides of $B$ (block size). For each offset $0 \\le o < B$, fetch $D[b+o]$ if $b+o < N$, else assign padding zero.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Aligned Memory Block Partition",
      inputDisplay: "data = [10, 20, 30, 40, 50, 60], blockSize = 4, alignment = 8",
      outputDisplay: "Blocks: [[10, 20, 30, 40], [50, 60, 0, 0]], Padding: 2",
      input: { data: [10, 20, 30, 40, 50, 60], blockSize: 4, alignment: 8 },
      output: "[[10, 20, 30, 40], [50, 60, 0, 0]], padding = 2",
      explanation:
        "Pads 6 input elements to 8 aligned slots with 2 zeros and forms two 4-element tile blocks.",
    },
    {
      kind: "complex",
      title: "Already Aligned Input Buffer",
      inputDisplay: "data = [1, 2, 3, 4, 5, 6, 7, 8], blockSize = 4, alignment = 8",
      outputDisplay: "Blocks: [[1..4], [5..8]], Padding: 0",
      input: { data: [1, 2, 3, 4, 5, 6, 7, 8], blockSize: 4, alignment: 8 },
      output: "[[1, 2, 3, 4], [5, 6, 7, 8]], padding = 0",
      explanation: "Input buffer length 8 is already a multiple of alignment 8; zero padding added.",
    },
    {
      kind: "negative",
      title: "Single Element Buffer with Large Alignment",
      inputDisplay: "data = [42], blockSize = 4, alignment = 8",
      outputDisplay: "Blocks: [[42, 0, 0, 0], [0, 0, 0, 0]], Padding: 7",
      input: { data: [42], blockSize: 4, alignment: 8 },
      output: "[[42, 0, 0, 0], [0, 0, 0, 0]], padding = 7",
      explanation: "Pads single element with 7 zeros to fulfill 8-slot alignment.",
    },
  ],
  code: ALIGNEDSIMTBLOCKTILING_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time O(N + P) sweep over input and padded memory elements.",
    space: "O(N + P) auxiliary storage for padded tiled block arrays.",
  },
  topicGuide: {
    overview:
      "Aligned memory tiling is foundational to high-performance CUDA and Triton kernel programming. Modern GPU microarchitectures achieve maximum memory throughput when 32 threads in a warp issue memory loads aligned to 128-bit vector boundaries (e.g., `float4` or `int4`). Unaligned memory loads require the memory controller to split single hardware transactions into multiple DRAM accesses, drastically lowering effective memory bandwidth.\n\nBy computing exact alignment padding $P = (A - (N \\bmod A)) \\bmod A$ and tile offsets at host setup time or in Triton program headers, machine learning compilers eliminate unaligned global memory transactions before launching GPU grids.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "On NVIDIA H100/A100 hardware, global memory requests are issued in 32-byte or 128-byte segments. If a warp attempts to read unaligned data across cache line boundaries, the memory sub-system issues multiple memory transactions, effectively cutting memory bandwidth in half. Mathematically, given input length $N$ and alignment requirement $A$, required padding $P = (A - (N \\bmod A)) \\bmod A$ enforces that $N_{\\text{padded}} = N + P$ is an exact multiple of $A$.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "In PyTorch ATen, vLLM, and OpenAI Triton, tensor kernels process irregular sequence lengths and batch sizes. Aligned block tiling pads irregular tensor dimensions to 16/32/64 element boundaries so Triton `tl.load` and CUDA vectorized `LDG.128` instructions can execute at maximum physical memory throughput $\\approx 3.35\\text{ TB/s}$.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "Consider a buffer `data = [10, 20, 30, 40, 50, 60]` ($N=6$), with block size $B = 4$ and alignment $A = 8$.\n1. $N \\bmod A = 6 \\bmod 8 = 6$. Padding required: $P = (8 - 6) \\bmod 8 = 2$.\n2. Total padded length: $N_{\\text{padded}} = 6 + 2 = 8$.\n3. Tile 0 ($b=0$): extracts $\\text{data}[0..3] = [10, 20, 30, 40]$.\n4. Tile 1 ($b=4$): extracts $\\text{data}[4..5] = [50, 60]$ and pads remaining 2 slots with scalar zero $\\rightarrow [50, 60, 0, 0]$.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "Inserting padding increases VRAM footprint slightly by $P$ elements, but yields substantial throughput improvements ($1.8\\times - 2.5\\times$ speedups in GEMM and attention kernels). Hardware Tensor Cores (e.g., `WMMA` and `mma.sync` instructions) mandate $16 \\times 16$ matrix shape alignment.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(N + P)$ linear time sweep over input and padding elements. Space Complexity: $\\mathcal{O}(N + P)$ auxiliary storage for padded tiled block arrays.",
      },
    ],
    keyTerms: [
      {
        term: "SIMT Alignment",
        definition:
          "Structuring memory addresses to align with 128-bit hardware vector instruction boundaries.",
      },
      {
        term: "Memory Coalescing",
        definition:
          "Combining memory accesses from adjacent GPU threads into a single DRAM transaction.",
      },
      {
        term: "Tile Padding",
        definition:
          "Inserting dummy zero elements to pad buffer dimensions to exact hardware block boundaries.",
      },
      {
        term: "Vectorized Load (LDG.128)",
        definition:
          "CUDA hardware instruction that loads 128 bits (4x float32) from global memory in a single transaction.",
      },
    ],
  },
  trivia: ALIGNEDSIMTBLOCKTILING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_ALIGNEDSIMTBLOCKTILING_INPUT,
  generateSteps: generateAlignedSimtBlockTilingSteps,
};
