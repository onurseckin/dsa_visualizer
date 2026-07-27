import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ProgramAssignment {
  programId: number;
  pidM: number;
  pidN: number;
  groupId: number;
}

export interface tritonL2CacheSwizzledGemmSchedulerInput {
  grid_m?: number;
  grid_n?: number;
  group_size_m?: number;
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const TRITONL2CACHESWIZZLEDGEMMSCHEDULER_CODE = `def triton_l2_cache_swizzled_gemm_scheduler(grid_m: int, grid_n: int, group_size_m: int = 8) -> list[tuple[int, int, int]]:
    """Simulates Triton's L2 Cache Swizzled Tile Scheduler for GEMM kernels."""
    total_programs = grid_m * grid_n
    schedule = []

    num_pid_in_group = group_size_m * grid_n

    for program_id in range(total_programs):
        group_id = program_id // num_pid_in_group
        first_pid_m = group_id * group_size_m
        group_size_m_adj = min(grid_m - first_pid_m, group_size_m)

        pid_m = first_pid_m + ((program_id % num_pid_in_group) % group_size_m_adj)
        pid_n = (program_id % num_pid_in_group) // group_size_m_adj

        schedule.append((program_id, pid_m, pid_n))

    return schedule`;

export const DEFAULT_TRITONL2CACHESWIZZLEDGEMMSCHEDULER_INPUT: tritonL2CacheSwizzledGemmSchedulerInput = {
  grid_m: 4,
  grid_n: 4,
  group_size_m: 2,
  data: [4, 4, 2],
  target: 0,
};

export const generateTRITONL2CACHESWIZZLEDGEMMSCHEDULERSteps = (
  input: tritonL2CacheSwizzledGemmSchedulerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const gridM = input.grid_m !== undefined ? input.grid_m : 4;
  const gridN = input.grid_n !== undefined ? input.grid_n : 4;
  const groupSizeM = input.group_size_m !== undefined ? input.group_size_m : 2;

  const totalPrograms = gridM * gridN;
  const numPidInGroup = groupSizeM * gridN;

  const schedule: ProgramAssignment[] = [];

  const getSnapshot = (
    activePidM: number = -1,
    activePidN: number = -1,
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < gridM; r++) {
      for (let c = 0; c < gridN; c++) {
        const assignment = schedule.find((s) => s.pidM === r && s.pidN === c);
        const isCurrent = activePidM === r && activePidN === c;
        const state = isCurrent ? "active" : assignment ? "sorted" : "default";
        const pidLabel = assignment !== undefined ? `PID ${assignment.programId}` : `Tile (${r},${c})`;

        cells.push({
          row: r,
          col: c,
          value: assignment ? assignment.programId : -1,
          label: pidLabel,
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
      title: `Triton L2 Cache Swizzled Tile Scheduler Grid (${gridM}x${gridN}, GROUP_SIZE_M=${groupSizeM})`,
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
          "Algorithm": "Triton L2 Cache Swizzled GEMM Scheduler (Grouped Block Scheduling)",
          "GEMM Tile Grid": `${gridM} x ${gridN}`,
          "Group Size M": String(groupSizeM),
          "Programs per Group": String(numPidInGroup),
          "L2 Cache Hit Rate Boost": "40%-60% Increase in SRAM/L2 Reuse of Matrix B",
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Triton L2 Cache Swizzled GEMM Scheduler Entry",
    `Started L2 Cache Swizzled Scheduling across ${totalPrograms} GPU Thread Block Programs (grid ${gridM}x${gridN}, GROUP_SIZE_M=${groupSizeM}).`,
    { gridM, gridN, groupSizeM },
  );

  // Step 2: Calculate total_programs (3)
  addStep(
    3,
    `Calculate Total GPU Programs: total_programs = ${gridM} * ${gridN} = ${totalPrograms}`,
    `Total GPU thread block programs count = ${totalPrograms}.`,
    { total_programs: totalPrograms },
  );

  // Step 3: Init schedule (4)
  addStep(
    4,
    "Allocate Empty schedule [] List",
    "Allocated list to log swizzled program execution order.",
    { schedule_len: 0 },
  );

  // Step 4: Calculate num_pid_in_group (6)
  addStep(
    6,
    `Calculate Group Size Factor: num_pid_in_group = ${groupSizeM} * ${gridN} = ${numPidInGroup}`,
    `Number of thread block programs in each L2 swizzled group = ${numPidInGroup}.`,
    { num_pid_in_group: numPidInGroup },
  );

  // Loop over program IDs (8..16)
  for (let pid = 0; pid < totalPrograms; pid++) {
    addStep(
      8,
      `Program Loop ${pid + 1}/${totalPrograms}: Process program_id = ${pid}`,
      `Scheduling 1D program_id = ${pid} using Triton Grouped Block Scheduling logic.`,
      { program_id: pid },
    );

    const groupId = Math.floor(pid / numPidInGroup);
    addStep(
      9,
      `Calculate Group Index: group_id = ${pid} // ${numPidInGroup} = ${groupId}`,
      `Evaluated L2 cache swizzle group index group_id = ${groupId}.`,
      { pid, num_pid_in_group: numPidInGroup, group_id: groupId },
    );

    const firstPidM = groupId * groupSizeM;
    addStep(
      10,
      `Calculate Group First Row: first_pid_m = ${groupId} * ${groupSizeM} = ${firstPidM}`,
      `Evaluated first row tile index in group first_pid_m = ${firstPidM}.`,
      { groupId, groupSizeM, first_pid_m: firstPidM },
    );

    const groupSizeMAdj = Math.min(gridM - firstPidM, groupSizeM);
    addStep(
      11,
      `Adjust Boundary Group Size: group_size_m_adj = min(${gridM - firstPidM}, ${groupSizeM}) = ${groupSizeMAdj}`,
      `Evaluated boundary-adjusted group height group_size_m_adj = ${groupSizeMAdj}.`,
      { gridM, firstPidM, group_size_m_adj: groupSizeMAdj },
    );

    const pidM = firstPidM + ((pid % numPidInGroup) % groupSizeMAdj);
    addStep(
      13,
      `Calculate Swizzled Row Tile Index: pid_m = ${firstPidM} + ((${pid} % ${numPidInGroup}) % ${groupSizeMAdj}) = ${pidM}`,
      `Evaluated L2 swizzled row block coordinate pid_m = ${pidM}.`,
      { firstPidM, pid, numPidInGroup, groupSizeMAdj, pid_m: pidM },
    );

    const pidN = Math.floor((pid % numPidInGroup) / groupSizeMAdj);
    addStep(
      14,
      `Calculate Swizzled Col Tile Index: pid_n = (${pid} % ${numPidInGroup}) // ${groupSizeMAdj} = ${pidN}`,
      `Evaluated L2 swizzled column block coordinate pid_n = ${pidN}. Mapped Program ID ${pid} -> Tile (${pidM}, ${pidN}).`,
      { pid, numPidInGroup, groupSizeMAdj, pid_n: pidN },
      pidM,
      pidN,
    );

    schedule.push({
      programId: pid,
      pidM,
      pidN,
      groupId,
    });

    addStep(
      16,
      `Append (PID ${pid}, Tile (${pidM}, ${pidN})) to Schedule`,
      `Logged swizzled program assignment for Program ID ${pid}.`,
      { program_id: pid, pidM, pidN },
      pidM,
      pidN,
    );
  }

  // Return step (18)
  addStep(
    18,
    "Execution Complete: Return L2 Cache Swizzled GEMM Schedule",
    `Completed Triton L2 Cache Swizzled Tile Scheduling. Program IDs mapped into column-interleaved group blocks, increasing L2 cache reuse of Matrix B by 40%-60%!`,
    { totalPrograms, scheduledCount: schedule.length, completed: true },
  );

  return steps;
};

const TRITONL2CACHESWIZZLEDGEMMSCHEDULER_TRIVIA: TriviaMeta = {
  skipLines: [2, 5, 7, 12, 15, 17],
  distractors: [
    "pid_m = program_id // grid_n",
    "pid_n = program_id % grid_n",
    "group_id = program_id * group_size_m",
    "num_pid_in_group = grid_m * grid_n",
  ],
  hints: [
    { line: 9, hint: "Triton swizzled row tile calculation: pid_m = first_pid_m + ((program_id % num_pid_in_group) % group_size_m_adj)." },
    { line: 14, hint: "Triton swizzled column tile calculation: pid_n = (program_id % num_pid_in_group) // group_size_m_adj." },
  ],
  lineExplanations: {
    1: "Defines entry point for triton_l2_cache_swizzled_gemm_scheduler function implementing Triton Grouped Block Scheduling.",
    2: "Docstring describing Triton's L2 Cache Swizzled Tile Scheduler for GEMM kernels.",
    3: "Calculates total GPU thread block programs total_programs = grid_m * grid_n.",
    4: "Initializes empty list schedule to log swizzled program execution order.",
    5: "Blank line before group size calculation.",
    6: "Calculates total programs per L2 swizzled group num_pid_in_group = group_size_m * grid_n.",
    7: "Blank line before program iteration loop.",
    8: "Iterates over program_id from 0 to total_programs - 1.",
    9: "Calculates group index group_id = program_id // num_pid_in_group.",
    10: "Calculates first row tile index in group first_pid_m = group_id * group_size_m.",
    11: "Calculates boundary-adjusted group height group_size_m_adj = min(grid_m - first_pid_m, group_size_m).",
    12: "Blank line before swizzled tile index calculations.",
    13: "Calculates L2 swizzled row block coordinate pid_m = first_pid_m + ((program_id % num_pid_in_group) % group_size_m_adj).",
    14: "Calculates L2 swizzled column block coordinate pid_n = (program_id % num_pid_in_group) // group_size_m_adj.",
    15: "Blank line before appending to schedule.",
    16: "Appends tuple of (program_id, pid_m, pid_n) to schedule list.",
    17: "Blank line separating program loop from return statement.",
    18: "Returns completed schedule list of swizzled program tile assignments.",
  },
};

export const tritonL2CacheSwizzledGemmScheduler: AlgorithmDefinition<tritonL2CacheSwizzledGemmSchedulerInput> =
  {
    id: "tritonL2CacheSwizzledGemmScheduler",
    title: "Triton L2 Cache Swizzled GEMM Scheduler Engine",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "The Triton L2 Cache Swizzled GEMM Scheduler Engine implements OpenAI Triton's **Grouped Block Scheduling** algorithm for General Matrix Multiplication (GEMM). In standard row-major thread block scheduling (`pid_m = pid // grid_n`), thread blocks sweep horizontally across matrix $C = A \\cdot B$. This causes GPU Streaming Multiprocessors (SMs) to repeatedly load matrix $A$ tiles from HBM DRAM, dropping GPU L2 cache hit rates to zero. Grouped Block Scheduling groups `GROUP_SIZE_M = 8` consecutive rows together, scheduling program execution down vertical column strips to maximize **L2 Cache Reuse of Matrix $B$**.\n\n### Why It Exists\nIn large matrix multiplication ($M=4096, N=4096, K=4096$), matrix $B$ is too large to fit entirely in the GPU's 50 MB L2 cache. By reordering the execution sequence of 1D program IDs into 2D swizzled groups, SMs process 8 adjacent row tiles ($A$) against the *same* column tile ($B$), increasing L2 cache hit rate by **40% to 60%** and boosting overall GEMM TFLOPS by up to **1.8x**!\n\n### Mathematical Formulation\nFor 1D Program ID $pid \\in \\{0, 1, \\dots, \\text{grid}_m \\cdot \\text{grid}_n - 1\\}$, 2D grid bounds $\\text{grid}_m, \\text{grid}_n$, and group height $G_m = \\text{GROUP\\_SIZE\\_M} = 8$:\n\n$$1. \\quad N_{group} = G_m \\cdot \\text{grid}_n \\quad (\\text{Programs per Group})$$\n\n$$2. \\quad \\text{group}_{id} = \\lfloor \\frac{pid}{N_{group}} \\rfloor, \\quad \\text{first}_{pid_m} = \\text{group}_{id} \\cdot G_m$$\n\n$$3. \\quad G_{adj} = \\min(\\text{grid}_m - \\text{first}_{pid_m}, G_m) \\quad (\\text{Boundary Adjusted Height})$$\n\n$$4. \\quad \\text{pid}_m = \\text{first}_{pid_m} + \\left( (pid \\bmod N_{group}) \\bmod G_{adj} \\right) \\quad (\\text{Swizzled Row Tile})$$\n\n$$5. \\quad \\text{pid}_n = \\lfloor \\frac{pid \\bmod N_{group}}{G_{adj}} \\rfloor \\quad (\\text{Swizzled Column Tile})$$\n\n### Step-by-Step Intuition\n1. **Group Size Definition**: Define `GROUP_SIZE_M = 8` (8 row blocks per swizzled group strip).\n2. **Group ID Calculation**: Divide 1D program ID by `num_pid_in_group` ($G_m \\cdot \\text{grid}_n$).\n3. **Boundary Adjustment**: Handle right/bottom boundary edge cases where $\\text{grid}_m$ is not divisible by $G_m$.\n4. **Column-Interleaved Mapping**: Compute swizzled tile coordinates $(\\text{pid}_m, \\text{pid}_n)$ such that consecutive program IDs execute down columns within the 8-row group.\n5. **L2 Cache Hit Rate Optimization**: Multiple SMs execute adjacent tiles in parallel, sharing cached matrix $B$ tile data inside GPU L2 cache.\n\n### Key Trade-Offs & Hardware Execution\n- **Zero Kernel Launch Overhead**: The swizzling logic executes inside GPU registers in $< 5$ clock cycles per block before memory loading begins.\n- **Standard in Official Triton Tutorials**: This exact swizzled tile scheduler is the core architecture powering OpenAI Triton's official `03-matrix-multiplication.py` kernel.",
    constraints: [
      "grid_m >= 1",
      "grid_n >= 1",
      "1 <= group_size_m <= 32",
    ],
    examples: [
      {
        kind: "basic",
        title: "4x4 GEMM Grid L2 Cache Swizzled Scheduler (group_size_m=2)",
        inputDisplay: "4x4 Grid (16 Programs), group_size_m = 2",
        outputDisplay: "Program ID Schedule: PID 0->(0,0), PID 1->(1,0), PID 2->(0,1), PID 3->(1,1)",
        input: DEFAULT_TRITONL2CACHESWIZZLEDGEMMSCHEDULER_INPUT,
        output: "Swizzled Schedule [(0,0,0), (1,1,0), (2,0,1), (3,1,1), ...]",
        explanation: "Swizzles 16 program IDs into 2-row column strips. Programs 0 and 1 execute (0,0) and (1,0) vertically, sharing matrix B column tile 0 in L2 cache.",
      },
    ],
    code: TRITONL2CACHESWIZZLEDGEMMSCHEDULER_CODE,
    timeComplexity: { best: "O(K)", average: "O(K)", worst: "O(K)" },
    spaceComplexity: "O(K)",
    complexityAnalysis: {
      time: "Linear in the total number of programs $K = \\text{grid}_m \\cdot \\text{grid}_n$, taking $O(1)$ operations per program ID.",
      space: "Requires $O(K)$ memory space to record swizzled tile schedule.",
    },
    topicGuide: {
      overview:
        "The Triton L2 Cache Swizzled GEMM Scheduler Engine implements Grouped Block Scheduling to maximize L2 cache reuse of Matrix B during GPU GEMM execution.",
      sections: [
        {
          heading: "Core Concept & L2 Cache Swizzling",
          body: "Grouped Block Scheduling swizzles 1D program IDs into 2D tile coordinates (pid_m, pid_n), scheduling execution down vertical column strips of height GROUP_SIZE_M = 8.",
        },
        {
          heading: "Maximizing Matrix B L2 Cache Reuse",
          body: "Naive row-major scheduling sweeps across rows, repeatedly purging matrix B from L2 cache. Swizzled scheduling executes 8 adjacent row tiles against the same column tile, boosting L2 cache hit rate by 40%-60%.",
        },
        {
          heading: "Boundary Group Size Adjustment (group_size_m_adj)",
          body: "Handles boundary cases when grid_m is not a multiple of GROUP_SIZE_M using group_size_m_adj = min(grid_m - first_pid_m, group_size_m).",
        },
        {
          heading: "Official OpenAI Triton GEMM Kernel",
          body: "This exact swizzle scheduler is used in OpenAI Triton's official GEMM tutorial (03-matrix-multiplication.py) to achieve peak TFLOPS on A100/H100 GPUs.",
        },
      ],
      keyTerms: [
        {
          term: "L2 Cache Swizzling",
          definition: "Reordering GPU thread block execution sequence to maximize L2 cache reuse of matrix operands.",
        },
        {
          term: "Grouped Block Scheduling",
          definition: "Triton tile scheduling strategy grouping GROUP_SIZE_M rows into vertical column execution strips.",
        },
        {
          term: "Program ID (pid)",
          definition: "1D GPU thread block index returned by Triton tl.program_id(0).",
        },
        {
          term: "Cache Hit Rate",
          definition: "Percentage of memory accesses satisfied by fast GPU L2 cache (2 TB/s) rather than slow HBM DRAM.",
        },
      ],
    },
    trivia: TRITONL2CACHESWIZZLEDGEMMSCHEDULER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_TRITONL2CACHESWIZZLEDGEMMSCHEDULER_INPUT,
    generateSteps: generateTRITONL2CACHESWIZZLEDGEMMSCHEDULERSteps,
  };
