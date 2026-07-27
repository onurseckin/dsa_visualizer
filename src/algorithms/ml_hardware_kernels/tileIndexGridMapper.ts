import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ProgramMappingResult {
  pid1d: number;
  pidM: number;
  pidN: number;
  startRow: number;
  startCol: number;
  globalPtrOffset: number;
}

export interface tileIndexGridMapperInput {
  pids?: number[];
  numPidM?: number;
  numPidN?: number;
  blockM?: number;
  blockN?: number;
  strideM?: number;
  strideN?: number;
  data?: number[];
  [key: string]: unknown;
}

export const TILEINDEXGRIDMAPPER_CODE = `def map_1d_program_id_to_2d_tile(pid_1d: int, num_pid_m: int, num_pid_n: int, block_m: int = 128, block_n: int = 128, stride_m: int = 4096, stride_n: int = 1) -> tuple[int, int, int, int, int]:
    """Maps a 1D GPU Thread Block Program ID (tl.program_id(0)) into 2D tile matrix coordinates (pid_m, pid_n)."""
    pid_m = pid_1d // num_pid_n
    pid_n = pid_1d % num_pid_n

    start_row = pid_m * block_m
    start_col = pid_n * block_n

    global_ptr_offset = start_row * stride_m + start_col * stride_n

    return pid_m, pid_n, start_row, start_col, global_ptr_offset`;

export const DEFAULT_TILEINDEXGRIDMAPPER_INPUT: tileIndexGridMapperInput = {
  pids: [0, 1, 2, 3, 4, 5, 6, 7],
  numPidM: 2,
  numPidN: 4,
  blockM: 128,
  blockN: 128,
  strideM: 4096,
  strideN: 1,
};

export const generateTILEINDEXGRIDMAPPERSteps = (
  input: tileIndexGridMapperInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const pids = input.pids || DEFAULT_TILEINDEXGRIDMAPPER_INPUT.pids!;
  const numPidM = input.numPidM || 2;
  const numPidN = input.numPidN || 4;
  const blockM = input.blockM || 128;
  const blockN = input.blockN || 128;
  const strideM = input.strideM || 4096;
  const strideN = input.strideN || 1;

  const mappings: ProgramMappingResult[] = [];

  const createMatrixSnapshot = (
    activePid1d?: number,
  ): MatrixCellItem[][] => {
    const grid: MatrixCellItem[][] = [];
    for (let r = 0; r < numPidM; r++) {
      const rowItems: MatrixCellItem[] = [];
      for (let c = 0; c < numPidN; c++) {
        const pidVal = r * numPidN + c;
        const mapping = mappings.find((m) => m.pid1d === pidVal);

        let state: MatrixCellItem["state"] = "default";
        if (activePid1d === pidVal) {
          state = "active";
        } else if (mapping) {
          state = "sorted";
        }

        const offsetVal = mapping ? mapping.globalPtrOffset : 0;

        rowItems.push({
          row: r,
          col: c,
          value: pidVal,
          label: mapping ? `PID ${pidVal}: (${r},${c}) Off:${offsetVal}` : `PID ${pidVal}`,
          state,
        });
      }
      grid.push(rowItems);
    }
    return grid;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activePid1d?: number,
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: numPidM,
        cols: numPidN,
        cells: createMatrixSnapshot(activePid1d),
      },
      auxiliaryState: {
        customState: customState ?? {
          grid_shape: `[${numPidM}, ${numPidN}]`,
          tile_shape: `[${blockM}, ${blockN}]`,
          stride_m: String(strideM),
          stride_n: String(strideN),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize GPU 1D-to-2D Tile Index Grid Mapper",
    `Setting up 1D Program ID mapping: 2D grid shape [${numPidM}, ${numPidN}], tile size [${blockM}, ${blockN}], DRAM strides (${strideM}, ${strideN}).`,
    { num_pid_m: numPidM, num_pid_n: numPidN, block_m: blockM, block_n: blockN, stride_m: strideM },
  );

  addStep(
    2,
    "Inspect GPU 1D Program ID launch list",
    `Processing ${pids.length} 1D Program IDs across ${numPidM * numPidN} total grid tiles.`,
    { num_programs: pids.length },
  );

  pids.forEach((pid1d) => {
    addStep(
      1,
      `Map 1D Program ID ${pid1d}: map_1d_program_id_to_2d_tile(pid_1d=${pid1d})`,
      `Translating 1D CUDA thread block index pid_1d=${pid1d} into 2D matrix tile coordinates.`,
      { pid_1d: pid1d },
      pid1d,
    );

    const pidM = Math.floor(pid1d / numPidN);
    addStep(
      3,
      `Compute row block index pid_m = ${pid1d} // ${numPidN} = ${pidM}`,
      `Dividing 1D program ID by grid column count ${numPidN} yields row block index ${pidM}.`,
      { pid_1d: pid1d, num_pid_n: numPidN, pid_m: pidM },
      pid1d,
    );

    const pidN = pid1d % numPidN;
    addStep(
      4,
      `Compute column block index pid_n = ${pid1d} % ${numPidN} = ${pidN}`,
      `Modulo of 1D program ID by grid column count ${numPidN} yields column block index ${pidN}.`,
      { pid_1d: pid1d, num_pid_n: numPidN, pid_n: pidN },
      pid1d,
    );

    const startRow = pidM * blockM;
    addStep(
      6,
      `Compute starting matrix row start_row = pid_m * block_m = ${pidM} * ${blockM} = ${startRow}`,
      `Multiplying row tile index ${pidM} by tile height ${blockM} gives starting row ${startRow}.`,
      { pid_m: pidM, block_m: blockM, start_row: startRow },
      pid1d,
    );

    const startCol = pidN * blockN;
    addStep(
      7,
      `Compute starting matrix column start_col = pid_n * block_n = ${pidN} * ${blockN} = ${startCol}`,
      `Multiplying column tile index ${pidN} by tile width ${blockN} gives starting column ${startCol}.`,
      { pid_n: pidN, block_n: blockN, start_col: startCol },
      pid1d,
    );

    const globalPtrOffset = startRow * strideM + startCol * strideN;
    addStep(
      9,
      `Compute global DRAM byte pointer offset global_ptr_offset = ${startRow} * ${strideM} + ${startCol} * ${strideN} = ${globalPtrOffset}`,
      `Linearizing 2D matrix tile offset using tensor strides in DRAM.`,
      { start_row: startRow, stride_m: strideM, start_col: startCol, stride_n: strideN, global_ptr_offset: globalPtrOffset },
      pid1d,
    );

    mappings.push({
      pid1d,
      pidM,
      pidN,
      startRow,
      startCol,
      globalPtrOffset,
    });

    addStep(
      11,
      `Return (pid_m=${pidM}, pid_n=${pidN}, start_row=${startRow}, start_col=${startCol}, offset=${globalPtrOffset})`,
      `Mapping complete for 1D Program ID ${pid1d}: assigned to SM tile (${pidM}, ${pidN}) with DRAM offset ${globalPtrOffset}.`,
      { pid_m: pidM, pid_n: pidN, start_row: startRow, start_col: startCol, offset: globalPtrOffset },
      pid1d,
    );
  });

  addStep(
    11,
    "1D-to-2D GPU Grid Mapping Execution Complete",
    `Successfully mapped ${pids.length} 1D GPU Program IDs to 2D matrix tiles and global memory DRAM pointer offsets.`,
    { completed: true, total_mapped: mappings.length },
  );

  return steps;
};

export const TILEINDEXGRIDMAPPER_TRIVIA: TriviaMeta = {
  skipLines: [5, 8, 10],
  distractors: [
    "pid_m = pid_1d % num_pid_m",
    "global_ptr_offset = start_row + start_col",
    "start_row = pid_m // block_m",
    "pid_n = pid_1d // num_pid_n",
  ],
  hints: [
    { line: 3, hint: "Compute pid_m = pid_1d // num_pid_n for row tile index." },
    { line: 4, hint: "Compute pid_n = pid_1d % num_pid_n for column tile index." },
    { line: 9, hint: "Calculate global DRAM pointer offset start_row * stride_m + start_col * stride_n." },
  ],
  lineExplanations: {
    1: "Defines map_1d_program_id_to_2d_tile signature with 1D program ID, 2D grid dimensions, block sizes, and DRAM strides.",
    2: "Docstring explaining GPU 1D thread block Program ID translation into 2D matrix tile coordinates.",
    3: "Calculates 2D row tile index pid_m = pid_1d // num_pid_n using integer division.",
    4: "Calculates 2D column tile index pid_n = pid_1d % num_pid_n using modulo arithmetic.",
    5: "Blank line preceding row/col range calculations.",
    6: "Calculates starting matrix row index start_row = pid_m * block_m.",
    7: "Calculates starting matrix column index start_col = pid_n * block_n.",
    8: "Blank line preceding global pointer calculation.",
    9: "Calculates absolute global memory DRAM byte pointer offset start_row * stride_m + start_col * stride_n.",
    10: "Blank line preceding return statement.",
    11: "Returns tuple of (pid_m, pid_n, start_row, start_col, global_ptr_offset) for GPU SM tile allocation.",
  },
};

export const tileIndexGridMapper: AlgorithmDefinition<tileIndexGridMapperInput> = {
  id: "tile-index-grid-mapper",
  title: "GPU 1D-to-2D Tile Index Grid Mapper",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_hardware_kernels",
  description: `Master GPU Program ID Grid Mapping: convert 1D thread block indices (\`tl.program_id(0)\`) into 2D matrix tile coordinates \`(pid_m, pid_n)\` and global DRAM pointer offsets.

### Why It Exists & What It Solves
In OpenAI Triton and CUDA kernel launches, grid dimensions are launched as 1D arrays of Thread Blocks (\`grid = (num_programs,)\`). However, matrix multiplication (GEMM) and attention operators operate on 2D matrices of shape $[M, N]$ partitioned into tiles of size \`BLOCK_M\` $\\times$ \`BLOCK_N\`.

**Tile Index Grid Mapper** computes the mathematical mapping from a 1D Program ID \`pid = tl.program_id(0)\` to 2D tile matrix coordinates \`(pid_m, pid_n)\` and global memory pointer offsets:
$$\\text{pid\\_m} = \\lfloor \\text{pid} / N_{\\text{blocks\\_n}} \\rfloor, \\quad \\text{pid\\_n} = \\text{pid} \\bmod N_{\\text{blocks\\_n}}$$

$$\\text{start\\_row} = \\text{pid\\_m} \\times \\text{BLOCK\\_M}, \\quad \\text{start\\_col} = \\text{pid\\_n} \\times \\text{BLOCK\\_N}$$

$$\\text{ptr\\_offset} = \\text{start\\_row} \\times S_m + \\text{start\\_col} \\times S_n$$

where $S_m, S_n$ are the tensor strides in DRAM.

This allows GPU hardware schedulers to map contiguous 1D thread blocks across 2D matrix tiles with zero overhead.

### Step-by-Step Intuition
1. **Row Tile Index \`pid_m\`**: Divide 1D program ID by column grid count: $\\lfloor \\text{pid} / N_{\\text{blocks\\_n}} \\rfloor$.
2. **Col Tile Index \`pid_n\`**: Take modulo of 1D program ID by column grid count: $\\text{pid} \\bmod N_{\\text{blocks\\_n}}$.
3. **Matrix Row Start**: $\\text{start\\_row} = \\text{pid\\_m} \\times \\text{BLOCK\\_M}$.
4. **Matrix Col Start**: $\\text{start\\_col} = \\text{pid\\_n} \\times \\text{BLOCK\\_N}$.
5. **DRAM Byte Offset**: $\\text{ptr\\_offset} = \\text{start\\_row} \\times S_m + \\text{start\\_col} \\times S_n$.

### Input Parameters
- \`pids\`: Array of 1D program IDs.
- \`numPidM\`: Grid row count ($M_{\\text{blocks}}$).
- \`numPidN\`: Grid column count ($N_{\\text{blocks}}$).
- \`blockM\`: Tile height (\`BLOCK_M\`).
- \`blockN\`: Tile width (\`BLOCK_N\`).
- \`strideM\`: DRAM stride along matrix row dimension.
- \`strideN\`: DRAM stride along matrix column dimension.

### Output
- Returns tuple \`(pid_m, pid_n, start_row, start_col, global_ptr_offset)\` for each GPU thread block.

### Trade-offs & Complexity
- **Time Complexity**: $O(1)$ integer operations per program ID.
- **Space Complexity**: $O(1)$ auxiliary space.`,
  constraints: ["0 <= pid_1d < num_pid_m * num_pid_n", "stride_m >= 1"],
  examples: [
    {
      kind: "basic",
      title: "1D-to-2D Mapping (Grid 2x4)",
      inputDisplay: "pid = 5, Grid [2, 4], Tile [128, 128]",
      outputDisplay: "pid_m = 1, pid_n = 1 (Row 128, Col 128)",
      input: {
        pids: [0, 1, 2, 3, 4, 5, 6, 7],
        numPidM: 2,
        numPidN: 4,
        blockM: 128,
        blockN: 128,
        strideM: 4096,
        strideN: 1,
      },
      output: "pid_m = 1, pid_n = 1",
      explanation: "Program ID 5 maps to row block 1 and col block 1 in a 2x4 grid.",
    },
    {
      kind: "complex",
      title: "8-Program ID Grid Launch",
      inputDisplay: "pids = [0..7], Grid [2, 4]",
      outputDisplay: "Pointer Offsets Computed",
      input: {
        pids: [0, 1, 2, 3, 4, 5, 6, 7],
        numPidM: 2,
        numPidN: 4,
        blockM: 128,
        blockN: 128,
        strideM: 4096,
        strideN: 1,
      },
      output: "Pointer Offsets Computed",
      explanation: "Evaluates 2D tile pointer offsets across 8 parallel GPU thread blocks.",
    },
    {
      kind: "negative",
      title: "Program ID 0 Origin Check",
      inputDisplay: "pid = 0",
      outputDisplay: "pid_m = 0, pid_n = 0 (Offset 0)",
      input: {
        pids: [0],
        numPidM: 2,
        numPidN: 4,
        blockM: 128,
        blockN: 128,
        strideM: 4096,
        strideN: 1,
      },
      output: "pid_m = 0, pid_n = 0",
      explanation: "Program ID 0 maps to top-left matrix origin (0, 0) with zero offset.",
    },
  ],
  code: TILEINDEXGRIDMAPPER_CODE,
  timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Computes 1D-to-2D tile index mapping in O(1) integer division and modulo operations.",
    space: "Requires O(1) auxiliary space per thread block.",
  },
  topicGuide: {
    overview:
      "Program ID grid mapping is used in every GPU kernel. By translating 1D grid launch indices into 2D/3D tensor coordinates, thread blocks navigate contiguous DRAM layouts without runtime bounds checks.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Row-major grid ordering maps 1D index $p \\in [0, M_b N_b - 1]$ to $(i, j)$ via $i = \\lfloor p / N_b \\rfloor, j = p \\bmod N_b$. Column-major grid ordering uses $j = \\lfloor p / M_b \\rfloor, i = p \\bmod M_b$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "GPU Thread Block Scheduling: NVIDIA GPU Hardware GigaThread Engine schedules thread blocks onto SMs. Row-major vs Column-major grid mapping impacts L2 cache hit rates during GEMM execution.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "In Triton kernels: `pid = tl.program_id(0)`. Memory pointer vector is constructed using `offs_m = pid_m * BLOCK_M + tl.arange(0, BLOCK_M)` and `offs_n = pid_n * BLOCK_N + tl.arange(0, BLOCK_N)`. 2D pointer matrix is `a_ptr + offs_m[:, None] * stride_a_m + offs_n[None, :] * stride_a_n`.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Swizzled Grid Mapping: Standard row-major mapping can cause L2 cache thrashing when $N$ is large. Triton GEMM kernels apply L2 cache swizzling (`GROUP_SIZE_M = 8`) to group neighboring thread blocks into 2D clusters, boosting L2 cache hit rates by 30%.",
      },
    ],
    keyTerms: [
      {
        term: "Program ID (pid)",
        definition:
          "The 1D or 2D thread block identifier returned by tl.program_id(axis) in OpenAI Triton.",
      },
      {
        term: "Grid Dimensions",
        definition:
          "The number of parallel thread blocks launched across GPU Streaming Multiprocessors.",
      },
      {
        term: "Tensor Strides",
        definition:
          "The physical DRAM distance between consecutive elements along each tensor dimension.",
      },
      {
        term: "L2 Cache Cluster Swizzling",
        definition:
          "Grouping adjacent thread blocks into 2D clusters to reuse data in GPU L2 cache.",
      },
    ],
  },
  trivia: TILEINDEXGRIDMAPPER_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_TILEINDEXGRIDMAPPER_INPUT,
  generateSteps: generateTILEINDEXGRIDMAPPERSteps,
};
