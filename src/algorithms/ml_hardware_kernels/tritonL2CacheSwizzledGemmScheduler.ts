import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tritonL2CacheSwizzledGemmSchedulerInput {
  grid_m?: number;
  grid_n?: number;
  group_size_m?: number;
  data?: number[];
  [key: string]: unknown;
}

export const TRITONL2CACHESWIZZLEDGEMMSCHEDULER_CODE = `def triton_l2_cache_swizzled_gemm_scheduler(
    grid_m: int,
    grid_n: int,
    group_size_m: int = 8
) -> list[tuple[int, int, int]]:
    """
    Simulates Triton's L2 Cache Swizzled Tile Scheduler for GEMM kernels.
    Maps 1D program_id (0..grid_m*grid_n - 1) to 2D matrix block coordinates (pid_m, pid_n).
    Grouping by GROUP_SIZE_M maximizes L2 cache tile reuse for matrix B across parallel SMs.
    Returns: list of (program_id, pid_m, pid_n) assignments.
    """
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

    return schedule
`;

export const DEFAULT_TRITONL2CACHESWIZZLEDGEMMSCHEDULER_INPUT: tritonL2CacheSwizzledGemmSchedulerInput =
  {
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

  const initialElements: ArrayElement[] = [];
  for (let pid = 0; pid < totalPrograms; pid++) {
    initialElements.push({
      id: `pid-${pid}`,
      value: `PID ${pid}`,
      state: "default",
    });
  }

  // Step 1: Initialize Scheduler
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Initialize Triton L2 Swizzled GEMM Tile Scheduler (Grid: ${gridM}x${gridN}, GroupM: ${groupSizeM})`,
      why: "Mapping 1D launch program IDs to 2D GEMM tile blocks to maximize GPU L2 Cache tile reuse.",
    },
    primarySnapshot: {
      kind: "array",
      elements: initialElements.map((e) => ({ ...e, pointers: ["Unscheduled"] })),
    },
    auxiliaryState: {
      customState: {
        grid_m: String(gridM),
        grid_n: String(gridN),
        group_size_m: String(groupSizeM),
        total_programs: String(totalPrograms),
        l2_cache_strategy: "Super-Group Column-Major Swizzle",
      },
    },
    variables: { gridM, gridN, groupSizeM, totalPrograms },
  });

  const scheduledElements: ArrayElement[] = [];
  for (let programId = 0; programId < totalPrograms; programId++) {
    const groupId = Math.floor(programId / numPidInGroup);
    const firstPidM = groupId * groupSizeM;
    const groupSizeMAdj = Math.min(gridM - firstPidM, groupSizeM);

    const pidM = firstPidM + ((programId % numPidInGroup) % groupSizeMAdj);
    const pidN = Math.floor((programId % numPidInGroup) / groupSizeMAdj);

    scheduledElements.push({
      id: `pid-${programId}`,
      value: `PID ${programId} -> (${pidM},${pidN})`,
      state: "active",
      pointers: [`Grp ${groupId}`, `Tile[${pidM},${pidN}]`],
    });

    const stepElements: ArrayElement[] = initialElements.map((el, i) => {
      if (i === programId) {
        return {
          id: el.id,
          value: `PID ${programId} => Tile(${pidM},${pidN})`,
          state: "active",
          pointers: [`Group ${groupId}`],
        };
      }
      if (i < programId) {
        return scheduledElements[i];
      }
      return el;
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Map Program ID ${programId} to Tile Block (M=${pidM}, N=${pidN}) [Group ${groupId}]`,
        why: `Grouping ${groupSizeMAdj} rows per column iteration reuses Matrix B tile (${pidN}) across ${groupSizeMAdj} concurrent SMs in L2 Cache.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: stepElements,
      },
      auxiliaryState: {
        customState: {
          program_id: String(programId),
          group_id: String(groupId),
          pid_m: String(pidM),
          pid_n: String(pidN),
          l2_reuse: `Matrix B col tile ${pidN} shared by ${groupSizeMAdj} SM blocks`,
        },
      },
      variables: { programId, groupId, pidM, pidN },
    });
  }

  // Final Step: Complete Swizzled Schedule Grid
  const finalElements: ArrayElement[] = scheduledElements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 24,
    explanation: {
      what: "L2 Swizzled Tile Scheduling Complete",
      why: "All program blocks dispatched with optimal L2 cache hit ratios, avoiding redundant DRAM fetches.",
    },
    primarySnapshot: {
      kind: "array",
      elements: finalElements,
    },
    auxiliaryState: {
      customState: {
        status: "Completed",
        total_mapped: String(totalPrograms),
        l2_cache_hitrate_boost: "~40-60% DRAM bandwidth savings",
      },
    },
    variables: { completed: true },
  });

  return steps;
};

const TRITONL2CACHESWIZZLEDGEMMSCHEDULER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  distractors: [
    "pid_m = program_id // grid_n",
    "pid_n = program_id % grid_m",
    "num_pid_in_group = grid_m * grid_n",
  ],
  hints: [
    { line: 15, hint: "Calculate group ID using total program count per group." },
    { line: 19, hint: "Determine pid_m using group start offset and modulo adjusted group size." },
    { line: 20, hint: "Determine pid_n by integer division over adjusted group size." },
  ],
  lineExplanations: {
    1: "Defines Triton L2 cache swizzled GEMM tile scheduler entry point.",
    15: "Computes super-group ID based on GROUP_SIZE_M * grid_n.",
    19: "Maps 1D program ID to 2D row tile index pid_m with swizzling.",
    20: "Maps 1D program ID to 2D col tile index pid_n for L2 cache locality.",
  },
};

export const tritonL2CacheSwizzledGemmScheduler: AlgorithmDefinition<tritonL2CacheSwizzledGemmSchedulerInput> =
  {
    id: "triton-l2-cache-swizzled-gemm-scheduler",
    title: "Triton L2 Cache Swizzled GEMM Tile Scheduler",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 9,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "In high-performance GPU matrix multiplication (Triton GEMM, CUTLASS), thread blocks ($BLOCK\\_M \\times BLOCK\\_N$) are dispatched across Streaming Multiprocessors (SMs) using 1D Program IDs (`tl.program_id(0)`). A naive row-major or column-major dispatch maps consecutive Program IDs to adjacent tiles of Matrix A, but accesses entirely different columns of Matrix B. As multiple SMs execute tiles concurrently, Matrix B memory blocks are repeatedly evicted from GPU L2 Cache, causing high DRAM memory traffic.\n\nThe **Triton L2 Cache Swizzled GEMM Tile Scheduler** solves this by grouping `GROUP_SIZE_M` row tiles together into super-groups. Within each super-group, Program IDs iterate down the column dimension before advancing to the next row group. As a result, adjacent SMs process tiles sharing the same column of Matrix B simultaneously, maximizing L2 Cache tile hit ratios and reducing DRAM bandwidth overhead by up to 60%.\n\nInput Format:\n- grid_m: Total number of tile blocks along matrix M dimension.\n- grid_n: Total number of tile blocks along matrix N dimension.\n- group_size_m: Number of row tiles grouped together for L2 cache reuse (e.g. 8).\n\nOutput Format:\n- Returns list of mapped tuples: (program_id, pid_m, pid_n).",
    constraints: ["grid_m > 0", "grid_n > 0", "group_size_m > 0"],
    examples: [
      {
        kind: "basic",
        title: "4x4 Grid Swizzled Scheduling",
        inputDisplay: "grid_m = 4, grid_n = 4, group_size_m = 2",
        outputDisplay: "Swizzled 2D block sequence maximizing L2 reuse",
        input: { grid_m: 4, grid_n: 4, group_size_m: 2 },
        output: "[(0,0,0), (1,1,0), (2,0,1), (3,1,1), ...]",
        explanation:
          "Groups 2 rows per column iteration, enabling L2 cache reuse of matrix B col tiles.",
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
        explanation:
          "Dynamically clamps group_size_m to grid_m - first_pid_m when grid size is smaller than group size.",
      },
    ],
    code: TRITONL2CACHESWIZZLEDGEMMSCHEDULER_CODE,
    timeComplexity: {
      best: "O(Grid_M · Grid_N)",
      average: "O(Grid_M · Grid_N)",
      worst: "O(Grid_M · Grid_N)",
    },
    spaceComplexity: "O(Grid_M · Grid_N)",
    complexityAnalysis: {
      time: "Calculates swizzled coordinates for all $G_M \\times G_N$ tiles in $O(G_M \\cdot G_N)$ time.",
      space: "Stores scheduled block mappings using $O(G_M \\cdot G_N)$ space.",
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
