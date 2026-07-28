import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ProgramIdMappingRecord {
  programId: number;
  pidM: number;
  pidN: number;
  groupId: number;
}

export interface tritonProgramId1dTo2dMapInput {
  program_id?: number;
  grid_m?: number;
  grid_n?: number;
  group_size_m?: number;
  pids?: number[];
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const TRITONPROGRAMID1DTO2DMAP_CODE = `def triton_program_id_1d_to_2d_map(program_id: int, grid_m: int, grid_n: int, group_size_m: int = 8) -> tuple[int, int]:
    num_pid_in_group = group_size_m * grid_n
    group_id = program_id // num_pid_in_group
    first_pid_m = group_id * group_size_m
    group_size_m_adj = min(grid_m - first_pid_m, group_size_m)

    pid_m = first_pid_m + ((program_id % num_pid_in_group) % group_size_m_adj)
    pid_n = (program_id % num_pid_in_group) // group_size_m_adj

    return pid_m, pid_n`;

export const DEFAULT_TRITONPROGRAMID1DTO2DMAP_INPUT: tritonProgramId1dTo2dMapInput = {
  program_id: 5,
  grid_m: 4,
  grid_n: 4,
  group_size_m: 2,
  data: [5, 4, 4, 2],
  target: 0,
};

export const generateTRITONPROGRAMID1DTO2DMAPSteps = (
  input: tritonProgramId1dTo2dMapInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const targetPid = input.program_id !== undefined ? input.program_id : 5;
  const gridM = input.grid_m !== undefined ? input.grid_m : 4;
  const gridN = input.grid_n !== undefined ? input.grid_n : 4;
  const groupSizeM = input.group_size_m !== undefined ? input.group_size_m : 2;

  const totalPrograms = gridM * gridN;
  const pids = input.pids || Array.from({ length: totalPrograms }, (_, i) => i);

  const mappings: ProgramIdMappingRecord[] = [];

  const getSnapshot = (activePidM: number = -1, activePidN: number = -1) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < gridM; r++) {
      for (let c = 0; c < gridN; c++) {
        const mapping = mappings.find((m) => m.pidM === r && m.pidN === c);
        const isCurrent = activePidM === r && activePidN === c;
        const state = isCurrent
          ? "active"
          : mapping
            ? mapping.programId === targetPid
              ? "sorted"
              : "compared"
            : "default";
        const labelStr = mapping !== undefined ? `PID ${mapping.programId}` : `Tile (${r},${c})`;

        cells.push({
          row: r,
          col: c,
          value: mapping ? mapping.programId : -1,
          label: labelStr,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows: gridM,
      cols: gridN,
      rowHeaders: Array.from({ length: gridM }, (_, r) => `Row Tile ${r}`),
      colHeaders: Array.from({ length: gridN }, (_, c) => `Col Tile ${c}`),
      cells,
      title: `Triton 1D-to-2D Swizzled Program Mapping Grid (${gridM}x${gridN}, GROUP_SIZE_M=${groupSizeM})`,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activePidM: number = -1,
    activePidN: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activePidM, activePidN),
      auxiliaryState: {
        customState: {
          Algorithm: "Triton 1D-to-2D Program ID Mapper (tl.program_id(0))",
          "Target Program ID": String(targetPid),
          "GEMM Tile Grid": `${gridM} x ${gridN}`,
          "Group Size M": String(groupSizeM),
          "L2 Cache Efficiency": "Maximizes SRAM & L2 Cache Hit Rate for Matrix B",
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Triton 1D-to-2D Program ID Mapper Entry",
    `Started 1D-to-2D program mapping for program_id = ${targetPid} across ${pids.length} programs in ${gridM}x${gridN} grid.`,
    { targetPid, gridM, gridN, groupSizeM },
  );

  for (let idx = 0; idx < pids.length; idx++) {
    const pid = pids[idx];

    addStep(
      1,
      `Program ${idx + 1}/${pids.length}: Decode program_id = ${pid}`,
      `Executing Triton 1D-to-2D mapping equations for program_id = ${pid} (tl.program_id(0)).`,
      { program_id: pid },
    );

    const numPidInGroup = groupSizeM * gridN;
    addStep(
      2,
      `Calculate Group Size: num_pid_in_group = ${groupSizeM} * ${gridN} = ${numPidInGroup}`,
      `Evaluated programs count per L2 cache group: num_pid_in_group = ${numPidInGroup}.`,
      { groupSizeM, gridN, num_pid_in_group: numPidInGroup },
    );

    const groupId = Math.floor(pid / numPidInGroup);
    addStep(
      3,
      `Calculate Group Index: group_id = ${pid} // ${numPidInGroup} = ${groupId}`,
      `Evaluated L2 swizzle group index group_id = ${groupId}.`,
      { pid, num_pid_in_group: numPidInGroup, group_id: groupId },
    );

    const firstPidM = groupId * groupSizeM;
    addStep(
      4,
      `Calculate Group Start Row: first_pid_m = ${groupId} * ${groupSizeM} = ${firstPidM}`,
      `Evaluated first row tile index in group first_pid_m = ${firstPidM}.`,
      { groupId, groupSizeM, first_pid_m: firstPidM },
    );

    const groupSizeMAdj = Math.min(gridM - firstPidM, groupSizeM);
    addStep(
      5,
      `Calculate Adjusted Group Height: group_size_m_adj = min(${gridM - firstPidM}, ${groupSizeM}) = ${groupSizeMAdj}`,
      `Evaluated boundary-adjusted group height group_size_m_adj = ${groupSizeMAdj}.`,
      { gridM, firstPidM, groupSizeM, group_size_m_adj: groupSizeMAdj },
    );

    const pidM = firstPidM + ((pid % numPidInGroup) % groupSizeMAdj);
    addStep(
      7,
      `Calculate 2D Swizzled Row Index: pid_m = ${firstPidM} + ((${pid} % ${numPidInGroup}) % ${groupSizeMAdj}) = ${pidM}`,
      `Evaluated 2D matrix row block index pid_m = ${pidM}.`,
      { firstPidM, pid, numPidInGroup, groupSizeMAdj, pid_m: pidM },
    );

    const pidN = Math.floor((pid % numPidInGroup) / groupSizeMAdj);
    addStep(
      8,
      `Calculate 2D Swizzled Col Index: pid_n = (${pid} % ${numPidInGroup}) // ${groupSizeMAdj} = ${pidN}`,
      `Evaluated 2D matrix column block index pid_n = ${pidN}. Program ID ${pid} -> Tile (${pidM}, ${pidN}).`,
      { pid, num_pid_in_group: numPidInGroup, group_size_m_adj: groupSizeMAdj, pid_n: pidN },
      pidM,
      pidN,
    );

    mappings.push({
      programId: pid,
      pidM,
      pidN,
      groupId,
    });

    addStep(
      10,
      `Return (pid_m=${pidM}, pid_n=${pidN}) for Program ID ${pid}`,
      `Successfully mapped Program ID ${pid} to 2D tile coordinate (${pidM}, ${pidN}).`,
      { program_id: pid, pid_m: pidM, pid_n: pidN },
      pidM,
      pidN,
    );
  }

  // Final step
  const targetRecord = mappings.find((m) => m.programId === targetPid);
  addStep(
    10,
    `Execution Complete: Target Program ID ${targetPid} mapped to Tile (${targetRecord?.pidM}, ${targetRecord?.pidN})`,
    `Completed 1D-to-2D swizzled mapping for target program_id = ${targetPid} -> Tile (${targetRecord?.pidM}, ${targetRecord?.pidN}).`,
    {
      targetPid,
      targetM: targetRecord?.pidM ?? -1,
      targetN: targetRecord?.pidN ?? -1,
      completed: true,
    },
    targetRecord?.pidM,
    targetRecord?.pidN,
  );

  return steps;
};

const TRITONPROGRAMID1DTO2DMAP_TRIVIA: TriviaMeta = {
  skipLines: [6, 9],
  distractors: [
    "pid_m = program_id // grid_n",
    "pid_n = program_id % grid_n",
    "group_id = program_id * group_size_m",
    "num_pid_in_group = grid_m * grid_n",
  ],
  hints: [
    {
      line: 7,
      hint: "Triton 2D row index equation: pid_m = first_pid_m + ((program_id % num_pid_in_group) % group_size_m_adj).",
    },
    {
      line: 8,
      hint: "Triton 2D column index equation: pid_n = (program_id % num_pid_in_group) // group_size_m_adj.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for triton_program_id_1d_to_2d_map function implementing Triton Grouped Block Scheduling.",
    2: "Calculates total programs per L2 swizzled group num_pid_in_group = group_size_m * grid_n.",
    3: "Calculates group index group_id = program_id // num_pid_in_group.",
    4: "Calculates first row tile index in group first_pid_m = group_id * group_size_m.",
    5: "Calculates boundary-adjusted group height group_size_m_adj = min(grid_m - first_pid_m, group_size_m).",
    6: "Blank line before swizzled tile index calculations.",
    7: "Calculates 2D swizzled row block index pid_m = first_pid_m + ((program_id % num_pid_in_group) % group_size_m_adj).",
    8: "Calculates 2D swizzled column block index pid_n = (program_id % num_pid_in_group) // group_size_m_adj.",
    9: "Blank line separating logic from return statement.",
    10: "Returns tuple of (pid_m, pid_n).",
  },
};

export const tritonProgramId1dTo2dMap: AlgorithmDefinition<tritonProgramId1dTo2dMapInput> = {
  id: "triton-program-id-1d-to-2d-map",
  title: "Triton 1D-to-2D Program ID Mapper (tl.program_id(0))",
  topicIds: ["ml_hardware_kernels", "ml_gemm_roofline"],
  difficulty: "Medium",
  description:
    "The Triton 1D-to-2D Program ID Mapper implements the exact indexing function used inside OpenAI Triton GPU kernels (`tl.program_id(0)`). GPU hardware launches thread blocks as a flat 1D sequence of program IDs (`0, 1, 2, ...`). To maximize GPU L2 cache hit rates during matrix multiplication (GEMM), Triton swizzles 1D program IDs into 2D tile coordinates `(pid_m, pid_n)` grouped into 8-row vertical strips.\n\n### Why It Exists\nIn GPU matrix multiplication ($C = A \\cdot B$), standard 2D layout mapping sweeps row-by-row, forcing matrix $B$ out of L2 cache on every row transition. Triton's 1D-to-2D swizzle reorders block launch execution so SMs process vertical 8-row column strips, boosting matrix $B$ L2 cache hit rate by **40% to 60%**.\n\n### Mathematical Formulation\nFor 1D program ID `program_id`, 2D tile grid bounds `grid_m, grid_n`, and group height `group_size_m = 8`:\n\n$$1. \\quad N_{group} = \\text{group\\_size}_m \\cdot \\text{grid}_n \\quad (\\text{Programs per Group})$$\n\n$$2. \\quad \\text{group}_{id} = \\lfloor \\frac{\\text{program\\_id}}{N_{group}} \\rfloor, \\quad \\text{first}_{pid_m} = \\text{group}_{id} \\cdot \\text{group\\_size}_m$$\n\n$$3. \\quad G_{adj} = \\min(\\text{grid}_m - \\text{first}_{pid_m}, \\text{group\\_size}_m) \\quad (\\text{Boundary Adjusted Group Height})$$\n\n$$4. \\quad \\text{pid}_m = \\text{first}_{pid_m} + \\left( (\\text{program\\_id} \\bmod N_{group}) \\bmod G_{adj} \\right) \\quad (\\text{2D Row Tile Index})$$\n\n$$5. \\quad \\text{pid}_n = \\lfloor \\frac{\\text{program\\_id} \\bmod N_{group}}{G_{adj}} \\rfloor \\quad (\\text{2D Column Tile Index})$$\n\n### Step-by-Step Intuition\n1. **Group Height Selection**: Choose `group_size_m = 8` (8 adjacent row blocks per swizzle group).\n2. **Group Indexing**: Calculate `group_id = program_id // num_pid_in_group`.\n3. **Boundary Safety**: Compute `group_size_m_adj = min(grid_m - first_pid_m, group_size_m)` to handle non-divisible matrix boundary edges.\n4. **2D Tile Coordinate Decoding**: Compute row block `pid_m` and column block `pid_n` within the 8-row vertical strip.\n5. **Tensor Memory Access**: Compute DRAM pointer offsets `start_row = pid_m * block_m` and `start_col = pid_n * block_n` for vector loads.\n\n### Key Trade-Offs & Hardware Execution\n- **Zero ALU Latency**: Executed in $< 5$ clock cycles on GPU Streaming Multiprocessors before memory loads begin.\n- **Standard Triton Swizzling**: Universal indexing helper found in nearly every production Triton GEMM and Attention kernel.",
  constraints: [
    "0 <= program_id <= 1000000",
    "grid_m >= 1",
    "grid_n >= 1",
    "1 <= group_size_m <= 32",
  ],
  examples: [
    {
      kind: "basic",
      title: "Mapping 1D Program ID 5 in 4x4 Grid (group_size_m=2)",
      inputDisplay: "program_id = 5, grid 4x4, group_size_m = 2",
      outputDisplay: "Tile Coordinate (pid_m = 1, pid_n = 2)",
      input: DEFAULT_TRITONPROGRAMID1DTO2DMAP_INPUT,
      output: "(1, 2)",
      explanation:
        "Maps 1D program_id=5 to 2D matrix tile coordinate (1, 2) in a 2-row swizzled column strip.",
    },
  ],
  code: TRITONPROGRAMID1DTO2DMAP_CODE,
  timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Constant time $O(1)$, evaluating 2D swizzled tile coordinates in a fixed sequence of integer division and modulo math.",
    space: "Constant space $O(1)$, requiring zero additional memory storage.",
  },
  topicGuide: {
    overview:
      "The Triton 1D-to-2D Program ID Mapper decodes 1D launch program IDs into 2D swizzled tile coordinates (pid_m, pid_n) for GPU GEMM kernels.",
    sections: [
      {
        heading: "Core Concept & 1D-to-2D Swizzle Mapping",
        body: "GPU launches 1D grids of program IDs (tl.program_id(0)). Triton swizzles 1D IDs into 2D tile coordinates (pid_m, pid_n) grouped in vertical column strips.",
      },
      {
        heading: "Maximizing Matrix B L2 Cache Reuse",
        body: "Standard row-major mapping sweeps across rows, constantly evicting matrix B from L2 cache. Swizzling 8 adjacent row blocks against the same column tile boosts L2 cache hit rate by 40%-60%.",
      },
      {
        heading: "Boundary Group Size Adjustment (group_size_m_adj)",
        body: "Handles matrix edge boundary conditions when grid_m is not a multiple of group_size_m using min(grid_m - first_pid_m, group_size_m).",
      },
      {
        heading: "Zero-Cost PTX Execution",
        body: "Integer division // and modulo % decode program IDs in < 5 clock cycles before GPU memory pipelines start loading data.",
      },
    ],
    keyTerms: [
      {
        term: "tl.program_id(0)",
        definition: "Triton intrinsic returning 1D thread block index launched on GPU grid axis 0.",
      },
      {
        term: "2D Tile Coordinate",
        definition: "Tuple (pid_m, pid_n) identifying 2D matrix sub-block owned by a thread block.",
      },
      {
        term: "Grouped Block Scheduling",
        definition:
          "Swizzled tile ordering grouping 8 adjacent row blocks into vertical column execution strips.",
      },
      {
        term: "L2 Cache Hit Rate",
        definition: "Percentage of DRAM memory requests served directly from fast GPU L2 cache.",
      },
    ],
  },
  trivia: TRITONPROGRAMID1DTO2DMAP_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_TRITONPROGRAMID1DTO2DMAP_INPUT,
  generateSteps: generateTRITONPROGRAMID1DTO2DMAPSteps,
};
