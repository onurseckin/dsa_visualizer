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

  const createMatrixSnapshot = (
    activePidM?: number,
    activePidN?: number,
  ): MatrixCellItem[][] => {
    const grid: MatrixCellItem[][] = [];
    for (let r = 0; r < gridM; r++) {
      const rowItems: MatrixCellItem[] = [];
      for (let c = 0; c < gridN; c++) {
        const assignment = schedule.find((s) => s.pidM === r && s.pidN === c);

        let state: MatrixCellItem["state"] = "default";
        if (activePidM === r && activePidN === c) {
          state = "active";
        } else if (assignment) {
          state = "sorted";
        }

        const pidLabel = assignment !== undefined ? `PID ${assignment.programId}` : `Tile (${r},${c})`;

        rowItems.push({
          row: r,
          col: c,
          value: assignment ? assignment.programId : -1,
          label: pidLabel,
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
    activePidM?: number,
    activePidN?: number,
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: gridM,
        cols: gridN,
        cells: createMatrixSnapshot(activePidM, activePidN),
      },
      auxiliaryState: {
        customState: customState ?? {
          grid_shape: `[${gridM}, ${gridN}]`,
          group_size_m: String(groupSizeM),
          num_pid_in_group: String(numPidInGroup),
          l2_cache_strategy: "Super-Group Column-Major Swizzle",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Triton L2 Cache Swizzled GEMM Scheduler",
    `Setting up swizzled tile dispatch: grid_m=${gridM}, grid_n=${gridN}, group_size_m=${groupSizeM}.`,
    { grid_m: gridM, grid_n: gridN, group_size_m: groupSizeM },
  );

  addStep(
    3,
    `Calculate total_programs = grid_m * grid_n = ${gridM} * ${gridN} = ${totalPrograms}`,
    `Total GPU thread block Program IDs to schedule across SMs.`,
    { total_programs: totalPrograms },
  );

  addStep(
    4,
    "Initialize schedule output list",
    "Preparing container for mapped 2D tile assignments.",
    { capacity: totalPrograms },
  );

  addStep(
    6,
    `Calculate num_pid_in_group = group_size_m * grid_n = ${groupSizeM} * ${gridN} = ${numPidInGroup}`,
    `Each super-group contains ${numPidInGroup} program IDs iterating across ${gridN} column tiles.`,
    { num_pid_in_group: numPidInGroup },
  );

  for (let programId = 0; programId < totalPrograms; programId++) {
    addStep(
      8,
      `Loop program_id = ${programId}/${totalPrograms - 1}`,
      `Scheduling 1D program ID ${programId} to 2D matrix tile.`,
      { program_id: programId },
    );

    const groupId = Math.floor(programId / numPidInGroup);
    addStep(
      9,
      `Compute super-group ID group_id = program_id // num_pid_in_group = ${programId} // ${numPidInGroup} = ${groupId}`,
      `Program ${programId} belongs to super-group ${groupId}.`,
      { program_id: programId, group_id: groupId },
    );

    const firstPidM = groupId * groupSizeM;
    addStep(
      10,
      `Compute first_pid_m = group_id * group_size_m = ${groupId} * ${groupSizeM} = ${firstPidM}`,
      `Super-group ${groupId} starts at row tile index ${firstPidM}.`,
      { group_id: groupId, first_pid_m: firstPidM },
    );

    const groupSizeMAdj = Math.min(gridM - firstPidM, groupSizeM);
    addStep(
      11,
      `Compute group_size_m_adj = min(grid_m - first_pid_m, group_size_m) = min(${gridM - firstPidM}, ${groupSizeM}) = ${groupSizeMAdj}`,
      `Clamped row tile count for super-group ${groupId} (handles matrix boundary).`,
      { first_pid_m: firstPidM, group_size_m_adj: groupSizeMAdj },
    );

    const pidM = firstPidM + ((programId % numPidInGroup) % groupSizeMAdj);
    addStep(
      13,
      `Compute swizzled pid_m = first_pid_m + ((program_id % num_pid_in_group) % group_size_m_adj) = ${pidM}`,
      `Mapped 2D row tile index pid_m = ${pidM}.`,
      { program_id: programId, pid_m: pidM },
      pidM,
    );

    const pidN = Math.floor((programId % numPidInGroup) / groupSizeMAdj);
    addStep(
      14,
      `Compute swizzled pid_n = (program_id % num_pid_in_group) // group_size_m_adj = ${pidN}`,
      `Mapped 2D column tile index pid_n = ${pidN}. Reuses Matrix B column tile ${pidN} in L2 cache across ${groupSizeMAdj} concurrent SMs.`,
      { program_id: programId, pid_n: pidN },
      pidM,
      pidN,
    );

    schedule.push({
      programId,
      pidM,
      pidN,
      groupId,
    });

    addStep(
      16,
      `Append (program_id=${programId}, pid_m=${pidM}, pid_n=${pidN}) to schedule list`,
      `Program ${programId} assigned to SM tile block (${pidM}, ${pidN}) in super-group ${groupId}.`,
      { program_id: programId, pid_m: pidM, pid_n: pidN, group_id: groupId },
      pidM,
      pidN,
    );
  }

  addStep(
    18,
    "Return complete swizzled GEMM tile schedule",
    `Triton L2 Cache Swizzled GEMM Scheduler complete. Successfully mapped ${totalPrograms} program IDs to 2D tile blocks with ~40-60% DRAM bandwidth savings.`,
    { completed: true, total_programs: totalPrograms, total_scheduled: schedule.length },
  );

  return steps;
};

export const TRITONL2CACHESWIZZLEDGEMMSCHEDULER_TRIVIA: TriviaMeta = {
  skipLines: [2, 5, 7, 12, 15, 17],
  distractors: [
    "pid_m = program_id // grid_n",
    "pid_n = program_id % grid_m",
    "num_pid_in_group = grid_m * grid_n",
    "first_pid_m = group_id + group_size_m",
  ],
  hints: [
    { line: 9, hint: "Compute super-group ID group_id = program_id // num_pid_in_group." },
    { line: 13, hint: "Determine pid_m using group start offset and modulo adjusted group size." },
    { line: 14, hint: "Determine pid_n by integer division over adjusted group size." },
  ],
  lineExplanations: {
    1: "Defines triton_l2_cache_swizzled_gemm_scheduler signature with grid_m, grid_n, and group_size_m.",
    2: "Docstring explaining Triton L2 cache swizzled tile scheduler for GEMM GPU kernels.",
    3: "Calculates total_programs = grid_m * grid_n across all SM blocks.",
    4: "Initializes schedule output list.",
    5: "Blank line preceding group size calculation.",
    6: "Calculates total program IDs per super-group num_pid_in_group = group_size_m * grid_n.",
    7: "Blank line preceding main loop.",
    8: "Outer loop iterating program_id from 0 to total_programs - 1.",
    9: "Calculates super-group index group_id = program_id // num_pid_in_group.",
    10: "Calculates starting row tile index first_pid_m = group_id * group_size_m.",
    11: "Calculates dynamically clamped group size group_size_m_adj = min(grid_m - first_pid_m, group_size_m).",
    12: "Blank line preceding 2D coordinate calculations.",
    13: "Calculates swizzled row tile index pid_m within current super-group.",
    14: "Calculates swizzled column tile index pid_n within current super-group.",
    15: "Blank line preceding schedule append.",
    16: "Appends tuple (program_id, pid_m, pid_n) to schedule list.",
    17: "Blank line preceding return statement.",
    18: "Returns complete swizzled GEMM tile schedule with maximum L2 cache hit ratio.",
  },
};

export const tritonL2CacheSwizzledGemmScheduler: AlgorithmDefinition<tritonL2CacheSwizzledGemmSchedulerInput> = {
  id: "triton-l2-cache-swizzled-gemm-scheduler",
  title: "Triton L2 Cache Swizzled GEMM Tile Scheduler",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_hardware_kernels",
  description: `Master GPU L2 Cache Swizzling in OpenAI Triton: reorganize thread block launch order (\`tl.program_id(0)\`) to align hardware execution with GPU L2 cache memory locality during GEMM matrix multiplication.

### Why It Exists & What It Solves
In high-performance GPU matrix multiplication (Triton GEMM, CUTLASS), thread blocks ($\text{BLOCK\_M} \times \text{BLOCK\_N}$) are dispatched across Streaming Multiprocessors (SMs) using 1D Program IDs (\`tl.program_id(0)\`).

A naive row-major or column-major dispatch maps consecutive Program IDs to adjacent tiles of Matrix A, but accesses entirely different columns of Matrix B. As multiple SMs execute tiles concurrently, Matrix B memory blocks are repeatedly evicted from GPU L2 Cache, causing high DRAM memory traffic and memory bandwidth throttling.

The **Triton L2 Cache Swizzled GEMM Tile Scheduler** solves this by grouping \`GROUP_SIZE_M\` row tiles together into super-groups. Within each super-group, Program IDs iterate down the column dimension before advancing to the next row group:
- **Super-group size**: $N_{\text{group}} = \text{GROUP\_SIZE\_M} \times G_N$.
- **Group ID**: $g = \lfloor \text{pid} / N_{\text{group}} \rfloor$.
- **Starting Row Tile**: $M_0 = g \times \text{GROUP\_SIZE\_M}$.
- **Clamped Group Size**: $S_{\text{adj}} = \min(G_M - M_0, \text{GROUP\_SIZE\_M})$.
- **Swizzled Coordinates**:
  $$\text{pid\_m} = M_0 + ((\text{pid} \bmod N_{\text{group}}) \bmod S_{\text{adj}})$$
  $$\text{pid\_n} = (\text{pid} \bmod N_{\text{group}}) // S_{\text{adj}}$$

As a result, adjacent SMs process tiles sharing the same column of Matrix B simultaneously, maximizing L2 Cache tile hit ratios and reducing DRAM bandwidth overhead by **40-60%**.

### Step-by-Step Intuition
1. **Define Super-Group Size**: $N_{\text{group}} = \text{group\_size\_m} \times G_N$.
2. **Compute Group ID**: $g = \text{program\_id} // N_{\text{group}}$.
3. **Compute Super-Group Row Start**: $M_0 = g \times \text{group\_size\_m}$.
4. **Compute Adjusted Group Size**: $S_{\text{adj}} = \min(G_M - M_0, \text{group\_size\_m})$.
5. **Evaluate Swizzled Coordinates**:
   - $\text{pid\_m} = M_0 + ((\text{program\_id} \bmod N_{\text{group}}) \bmod S_{\text{adj}})$.
   - $\text{pid\_n} = (\text{program\_id} \bmod N_{\text{group}}) // S_{\text{adj}}$.

### Input Parameters
- \`grid_m\`: Number of row tiles ($G_M$).
- \`grid_n\`: Number of column tiles ($G_N$).
- \`group_size_m\`: Super-group row tile size (default 8).

### Output
- Returns list of mapped tuples: \`(program_id, pid_m, pid_n)\` maximizing L2 cache reuse.

### Trade-offs & Complexity
- **Time Complexity**: $O(G_M \cdot G_N)$ integer operations.
- **Space Complexity**: $O(G_M \cdot G_N)$ auxiliary schedule space.`,
  constraints: ["grid_m > 0", "grid_n > 0", "group_size_m > 0"],
  examples: [
    {
      kind: "basic",
      title: "4x4 Grid Swizzled Scheduling",
      inputDisplay: "grid_m = 4, grid_n = 4, group_size_m = 2",
      outputDisplay: "Swizzled 2D block sequence maximizing L2 reuse",
      input: { grid_m: 4, grid_n: 4, group_size_m: 2 },
      output: "[(0,0,0), (1,1,0), (2,0,1), (3,1,1), ...]",
      explanation: "Groups 2 rows per column iteration, enabling L2 cache reuse of matrix B col tiles.",
    },
    {
      kind: "complex",
      title: "8x8 Grid with Group Size 4",
      inputDisplay: "grid_m = 8, grid_n = 8, group_size_m = 4",
      outputDisplay: "64 tile blocks mapped with 4-way row swizzling",
      input: { grid_m: 8, grid_n: 8, group_size_m: 4 },
      output: "Mapped super-group tile schedule",
      explanation: "Processes 4 M-tiles per N-column, serving 4 concurrent SMs from L2 cache.",
    },
    {
      kind: "negative",
      title: "Single Row Matrix (Boundary Case)",
      inputDisplay: "grid_m = 1, grid_n = 4, group_size_m = 8",
      outputDisplay: "Adjusts group size dynamically to 1",
      input: { grid_m: 1, grid_n: 4, group_size_m: 8 },
      output: "[(0,0,0), (1,0,1), (2,0,2), (3,0,3)]",
      explanation: "Dynamically clamps group_size_m to grid_m - first_pid_m when grid size is smaller than group size.",
    },
  ],
  code: TRITONL2CACHESWIZZLEDGEMMSCHEDULER_CODE,
  timeComplexity: {
    best: "O(Grid_M * Grid_N)",
    average: "O(Grid_M * Grid_N)",
    worst: "O(Grid_M * Grid_N)",
  },
  spaceComplexity: "O(Grid_M * Grid_N)",
  complexityAnalysis: {
    time: "Calculates swizzled coordinates for all G_M x G_N tiles in O(G_M * G_N) time.",
    space: "Stores scheduled block mappings using O(G_M * G_N) space.",
  },
  topicGuide: {
    overview:
      "The Triton L2 Cache Swizzled GEMM Scheduler reorganizes thread block launch ordering to align hardware execution with GPU cache memory hierarchy. It is a key reason Triton GEMM performance matches or exceeds handwritten C++ CUTLASS kernels.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Given grid dimensions $G_M, G_N$ and group size $S_M$, total tiles per group is $N_{\\text{group}} = S_M \\cdot G_N$. For linear ID $p$, group index is $g = p // N_{\\text{group}}$ and base row is $M_0 = g \\cdot S_M$. Adjusted group size is $S_{\\text{adj}} = \\min(G_M - M_0, S_M)$. Swizzled coordinates are $pid_m = M_0 + ((p \\bmod N_{\\text{group}}) \\bmod S_{\\text{adj}})$ and $pid_n = (p \\bmod N_{\\text{group}}) // S_{\\text{adj}}$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "GPU L2 Cache capacity (e.g. 50 MB on NVIDIA H100) is shared across all 132 SMs. Without swizzling, parallel SMs fetch distinct columns of Matrix B, quickly evicting cache lines. Swizzling forces concurrent SMs to read identical Matrix B tiles, keeping data inside L2 Cache and saving terabytes of DRAM transfer bandwidth.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "In Triton kernels (`@triton.jit`), this scheduling logic is placed at the entry of the kernel before the main K-loop using `tl.program_id(0)`.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "When $G_M$ is not divisible by $S_M$, the final super-group contains fewer rows. The `min(grid_m - first_pid_m, group_size_m)` calculation prevents out-of-bounds row indexing.",
      },
    ],
    keyTerms: [
      {
        term: "Program ID Swizzling",
        definition:
          "A 1D-to-2D grid mapping transformation designed to maximize data locality across parallel thread blocks.",
      },
      {
        term: "L2 Cache Reuse",
        definition:
          "Exploiting shared GPU L2 cache memory by scheduling concurrent SMs to access identical tensor tiles.",
      },
      {
        term: "Super-Group",
        definition:
          "A collection of GROUP_SIZE_M row tiles processed sequentially across column tiles to enforce column-major cache traversal.",
      },
      {
        term: "DRAM Bandwidth Throttle",
        definition:
          "Performance slowdown occurring when hardware execution requests data faster than GPU DRAM memory channels can deliver.",
      },
    ],
  },
  trivia: TRITONL2CACHESWIZZLEDGEMMSCHEDULER_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_TRITONL2CACHESWIZZLEDGEMMSCHEDULER_INPUT,
  generateSteps: generateTRITONL2CACHESWIZZLEDGEMMSCHEDULERSteps,
};
