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
  target?: number;
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
  data: [0, 1, 2, 3, 4, 5, 6, 7],
  target: 0,
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

  const getSnapshot = (
    activePid1d: number = -1,
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < numPidM; r++) {
      for (let c = 0; c < numPidN; c++) {
        const pidVal = r * numPidN + c;
        const mapping = mappings.find((m) => m.pid1d === pidVal);
        const isCurrent = activePid1d === pidVal;
        const state = isCurrent ? "active" : mapping ? "sorted" : "default";
        const offsetVal = mapping ? mapping.globalPtrOffset : 0;

        cells.push({
          row: r,
          col: c,
          value: pidVal,
          label: mapping ? `PID ${pidVal}: (${r},${c}) Off:${offsetVal}` : `PID ${pidVal}`,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows: numPidM,
      cols: numPidN,
      rowHeaders: Array.from({ length: numPidM }, (_, r) => `pid_m ${r}`),
      colHeaders: Array.from({ length: numPidN }, (_, c) => `pid_n ${c}`),
      cells,
      title: `Triton 1D Program ID to 2D Grid Tile Mapper (${numPidM}x${numPidN} Grid, ${blockM}x${blockN} Tiles)`,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activePid1d: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activePid1d),
      auxiliaryState: {
        customState: {
          "Algorithm": "Triton 1D Program ID to 2D Tile Grid Mapper",
          "Grid Size": `${numPidM} x ${numPidN}`,
          "Tile Size": `${blockM} x ${blockN}`,
          "Global Memory Strides": `strideM=${strideM}, strideN=${strideN}`,
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Triton 1D Program ID to 2D Tile Grid Mapper Entry",
    `Started 2D grid index calculation for ${pids.length} 1D GPU Thread Block Program IDs (grid ${numPidM}x${numPidN}).`,
    { numPidM, numPidN, blockM, blockN, strideM, strideN },
  );

  for (let idx = 0; idx < pids.length; idx++) {
    const pid1d = pids[idx];

    addStep(
      1,
      `Program ID ${idx + 1}/${pids.length}: Process pid_1d = ${pid1d}`,
      `Processing 1D Triton Program ID pid_1d = ${pid1d} (tl.program_id(0)).`,
      { pid1d },
      pid1d,
    );

    const pidM = Math.floor(pid1d / numPidN);
    addStep(
      3,
      `Calculate 2D Row Block Index: pid_m = ${pid1d} // ${numPidN} = ${pidM}`,
      `Evaluated row block coordinate pid_m = ${pid1d} // ${numPidN} = ${pidM}.`,
      { pid1d, numPidN, pidM },
      pid1d,
    );

    const pidN = pid1d % numPidN;
    addStep(
      4,
      `Calculate 2D Col Block Index: pid_n = ${pid1d} % ${numPidN} = ${pidN}`,
      `Evaluated column block coordinate pid_n = ${pid1d} % ${numPidN} = ${pidN}. Tile coordinate: (${pidM}, ${pidN}).`,
      { pid1d, numPidN, pidN },
      pid1d,
    );

    const startRow = pidM * blockM;
    addStep(
      6,
      `Calculate Tensor Start Row: start_row = ${pidM} * ${blockM} = ${startRow}`,
      `Evaluated top-left tensor row offset start_row = ${startRow}.`,
      { pidM, blockM, startRow },
      pid1d,
    );

    const startCol = pidN * blockN;
    addStep(
      7,
      `Calculate Tensor Start Col: start_col = ${pidN} * ${blockN} = ${startCol}`,
      `Evaluated top-left tensor column offset start_col = ${startCol}. Tile span: rows ${startRow}..${startRow + blockM - 1}, cols ${startCol}..${startCol + blockN - 1}.`,
      { pidN, blockN, startCol },
      pid1d,
    );

    const globalPtrOffset = startRow * strideM + startCol * strideN;
    addStep(
      9,
      `Calculate HBM DRAM Pointer Offset: global_ptr_offset = ${startRow} * ${strideM} + ${startCol} * ${strideN} = ${globalPtrOffset}`,
      `Evaluated linear byte pointer offset in global DRAM memory: ${globalPtrOffset} bytes.`,
      { startRow, strideM, startCol, strideN, globalPtrOffset },
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
      `Return Tile Mapping: pid_1d ${pid1d} -> Tile (${pidM}, ${pidN}), DRAM Offset ${globalPtrOffset}`,
      `Successfully mapped pid_1d ${pid1d} to 2D tile (${pidM}, ${pidN}) starting at DRAM offset ${globalPtrOffset}.`,
      { pid1d, pidM, pidN, startRow, startCol, globalPtrOffset },
      pid1d,
    );
  }

  // Final step
  addStep(
    11,
    "Execution Complete: Return 2D Tile Mappings",
    `Successfully mapped all ${pids.length} 1D GPU Program IDs into 2D tile matrix coordinates and DRAM memory offsets.`,
    { mappedCount: mappings.length, completed: true },
  );

  return steps;
};

const TILEINDEXGRIDMAPPER_TRIVIA: TriviaMeta = {
  skipLines: [2, 5, 8, 10],
  distractors: [
    "pid_m = pid_1d % num_pid_m",
    "pid_n = pid_1d // num_pid_m",
    "start_row = pid_1d * block_m",
    "global_ptr_offset = start_row + start_col",
  ],
  hints: [
    { line: 3, hint: "Row block index calculation: pid_1d // num_pid_n." },
    { line: 4, hint: "Column block index calculation: pid_1d % num_pid_n." },
    { line: 9, hint: "Linear pointer offset formula: start_row * stride_m + start_col * stride_n." },
  ],
  lineExplanations: {
    1: "Defines entry point for map_1d_program_id_to_2d_tile function.",
    2: "Docstring describing 1D GPU Thread Block Program ID to 2D tile matrix coordinate mapping.",
    3: "Calculates 2D row block coordinate pid_m = pid_1d // num_pid_n.",
    4: "Calculates 2D column block coordinate pid_n = pid_1d % num_pid_n.",
    5: "Blank line before row/col pixel offset calculation.",
    6: "Calculates top-left row offset start_row = pid_m * block_m.",
    7: "Calculates top-left column offset start_col = pid_n * block_n.",
    8: "Blank line before global memory pointer offset calculation.",
    9: "Calculates linear HBM DRAM pointer offset global_ptr_offset = start_row * stride_m + start_col * stride_n.",
    10: "Blank line separating logic from return statement.",
    11: "Returns tuple of (pid_m, pid_n, start_row, start_col, global_ptr_offset).",
  },
};

export const tileIndexGridMapper: AlgorithmDefinition<tileIndexGridMapperInput> = {
  id: "tileIndexGridMapper",
  title: "Triton 1D Program ID to 2D Tile Grid Mapper",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_hardware_kernels",
  description:
    "The Triton 1D Program ID to 2D Tile Grid Mapper implements the foundational 2D grid index calculation used in OpenAI Triton GPU kernels (`tl.program_id(0)`). When launching GPU grid grids for matrix multiplication (GEMM), FlashAttention, or Convolution, Tritonlaunches a **1D flat grid** of Program IDs (`pid_1d = 0, 1, 2, ...`). The kernel decodes `pid_1d` into 2D matrix tile coordinates `(pid_m, pid_n)` and computes HBM DRAM memory offsets using matrix strides `stride_m` and `stride_n`.\n\n### Why It Exists\nCUDA GPUs launch thread blocks across 1D, 2D, or 3D grid dimensions. In Triton, launching a 1D grid of program IDs and decoding them inside the kernel simplifies grid launch code and allows advanced L2 cache swizzling (such as Grouped Block Scheduling) to maximize DRAM cache hit rates.\n\n### Mathematical Formulation\nFor 1D Program ID `pid_1d`, 2D grid dimension `num_pid_n`, block tile dimensions `block_m, block_n`, and matrix strides `stride_m, stride_n`:\n\n$$1. \\quad \\text{pid}_m = \\lfloor \\frac{\\text{pid}_{1d}}{\\text{num\\_pid}_n} \\rfloor \\quad (\\text{Row Block Index})$$\n\n$$2. \\quad \\text{pid}_n = \\text{pid}_{1d} \\pmod{\\text{num\\_pid}_n} \\quad (\\text{Column Block Index})$$\n\n$$3. \\quad \\text{start}_{row} = \\text{pid}_m \\cdot \\text{block}_m, \\quad \\text{start}_{col} = \\text{pid}_n \\cdot \\text{block}_n$$\n\n$$4. \\quad \\text{offset}_{DRAM} = \\text{start}_{row} \\cdot \\text{stride}_m + \\text{start}_{col} \\cdot \\text{stride}_n$$\n\n### Step-by-Step Intuition\n1. **1D ID Fetch**: Fetch 1D program ID `pid_1d = tl.program_id(0)`.\n2. **2D Coordinate Division**: Perform integer division `pid_m = pid_1d // num_pid_n` to find the row tile index.\n3. **2D Coordinate Modulo**: Perform modulo `pid_n = pid_1d % num_pid_n` to find the column tile index.\n4. **Pixel Coordinate Bounds**: Multiply by block sizes `start_row = pid_m * block_m` and `start_col = pid_n * block_n`.\n5. **DRAM Pointer Calculation**: Compute linear byte offset in HBM DRAM `offset = start_row * stride_m + start_col * stride_n` for vector pointers.\n\n### Key Trade-Offs & Hardware Execution\n- **Zero Overhead Division**: GPU ALUs execute integer division `//` and modulo `%` in a single clock cycle using bitwise shifts when `num_pid_n` is a power of two.\n- **Foundation for Swizzling**: Decoding 1D IDs into 2D coordinates is the pre-requisite step before applying L2 cache swizzling (Grouped Block Scheduling).",
  constraints: [
    "0 <= pid_1d <= 1000000",
    "numPidM >= 1",
    "numPidN >= 1",
  ],
  examples: [
    {
      kind: "basic",
      title: "Mapping 8 Program IDs across 2x4 Tile Grid",
      inputDisplay: "PIDs [0..7], Grid 2x4 (numPidM=2, numPidN=4), Tiles 128x128",
      outputDisplay: "PID 5 -> Tile (1, 1), start_row=128, start_col=128, DRAM offset=524416",
      input: DEFAULT_TILEINDEXGRIDMAPPER_INPUT,
      output: "Mappings for PIDs 0..7",
      explanation: "Decodes 8 1D program IDs into 2x4 2D matrix tile coordinates and calculates global DRAM memory offsets.",
    },
  ],
  code: TILEINDEXGRIDMAPPER_CODE,
  timeComplexity: { best: "O(K)", average: "O(K)", worst: "O(K)" },
  spaceComplexity: "O(K)",
  complexityAnalysis: {
    time: "Linear in the number of Program IDs $K$, taking $O(1)$ operations per ID.",
    space: "Requires $O(K)$ memory to log 2D tile mapping results.",
  },
  topicGuide: {
    overview:
      "The Triton 1D Program ID to 2D Tile Grid Mapper decodes 1D GPU program IDs into 2D matrix tile coordinates and DRAM memory offsets.",
    sections: [
      {
        heading: "Core Concept & Triton Grid Mapping",
        body: "Triton launches 1D grids of program IDs (tl.program_id(0)). Inside the kernel, pid_1d is mapped into 2D matrix tile coordinates (pid_m, pid_n) = (pid // num_pid_n, pid % num_pid_n).",
      },
      {
        heading: "Tile Boundary Coordinates (start_row, start_col)",
        body: "Top-left matrix tile boundaries are computed as start_row = pid_m * block_m and start_col = pid_n * block_n, defining the M x N sub-matrix owned by the thread block.",
      },
      {
        heading: "Global DRAM Memory Strides",
        body: "Linear byte pointer offset global_ptr_offset = start_row * stride_m + start_col * stride_n maps tile coordinates directly into row-major or column-major HBM DRAM memory.",
      },
      {
        heading: "Foundation for L2 Cache Swizzling",
        body: "2D tile coordinate mapping is the required pre-requisite for Grouped Block Scheduling, which swizzles program IDs to optimize GPU L2 cache reuse.",
      },
    ],
    keyTerms: [
      {
        term: "Program ID (pid)",
        definition: "1D GPU thread block identifier returned by Triton tl.program_id(0).",
      },
      {
        term: "2D Tile Coordinate",
        definition: "Tuple (pid_m, pid_n) identifying 2D matrix sub-block owned by a thread block.",
      },
      {
        term: "Matrix Stride",
        definition: "Number of elements in memory between adjacent rows (stride_m) or columns (stride_n).",
      },
      {
        term: "Global Pointer Offset",
        definition: "Linear memory address offset in HBM DRAM calculated as start_row * stride_m + start_col * stride_n.",
      },
    ],
  },
  trivia: TILEINDEXGRIDMAPPER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_TILEINDEXGRIDMAPPER_INPUT,
  generateSteps: generateTILEINDEXGRIDMAPPERSteps,
};
