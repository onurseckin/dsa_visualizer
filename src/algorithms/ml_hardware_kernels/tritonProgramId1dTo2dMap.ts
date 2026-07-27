import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tritonProgramId1dTo2dMapInput {
  program_id?: number;
  grid_m?: number;
  grid_n?: number;
  group_size_m?: number;
  data?: number[];
  [key: string]: unknown;
}

export const TRITONPROGRAMID1DTO2DMAP_CODE = `def triton_program_id_1d_to_2d_map(
    program_id: int,
    grid_m: int,
    grid_n: int,
    group_size_m: int = 8
) -> tuple[int, int]:
    """
    Maps a 1D launch program_id (from tl.program_id(0)) to 2D matrix tile coordinates (pid_m, pid_n).
    Employs group-swizzling to improve GPU L2 cache hit ratios across concurrent SMs.
    """
    num_pid_in_group = group_size_m * grid_n
    group_id = program_id // num_pid_in_group
    first_pid_m = group_id * group_size_m
    group_size_m_adj = min(grid_m - first_pid_m, group_size_m)

    pid_m = first_pid_m + ((program_id % num_pid_in_group) % group_size_m_adj)
    pid_n = (program_id % num_pid_in_group) // group_size_m_adj

    return pid_m, pid_n
`;

export const DEFAULT_TRITONPROGRAMID1DTO2DMAP_INPUT: tritonProgramId1dTo2dMapInput = {
  program_id: 5,
  grid_m: 4,
  grid_n: 4,
  group_size_m: 2,
};

export const generateTRITONPROGRAMID1DTO2DMAPSteps = (
  input: tritonProgramId1dTo2dMapInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const pid = input.program_id !== undefined ? input.program_id : 5;
  const gridM = input.grid_m !== undefined ? input.grid_m : 4;
  const gridN = input.grid_n !== undefined ? input.grid_n : 4;
  const groupSizeM = input.group_size_m !== undefined ? input.group_size_m : 2;

  const numPidInGroup = groupSizeM * gridN;
  const totalPrograms = gridM * gridN;

  const initialElements: ArrayElement[] = [];
  for (let i = 0; i < totalPrograms; i++) {
    initialElements.push({
      id: `pid-${i}`,
      value: `PID ${i}`,
      state: i === pid ? "active" : "default",
    });
  }

  // Step 1: Initialize Mapper
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Initialize Triton tl.program_id 1D-to-2D Mapper for PID ${pid}`,
      why: "Triton launches 1D grid of thread blocks; kernel must translate 1D ID to 2D tile coordinates (pid_m, pid_n).",
    },
    primarySnapshot: {
      kind: "array",
      elements: initialElements.map((e) => ({
        ...e,
        pointers: e.state === "active" ? ["Target PID"] : undefined,
      })),
    },
    auxiliaryState: {
      customState: {
        program_id: String(pid),
        grid_shape: `${gridM}x${gridN}`,
        group_size_m: String(groupSizeM),
        total_programs: String(totalPrograms),
      },
    },
    variables: { pid, gridM, gridN, groupSizeM },
  });

  const groupId = Math.floor(pid / numPidInGroup);
  const firstPidM = groupId * groupSizeM;
  const groupSizeMAdj = Math.min(gridM - firstPidM, groupSizeM);

  // Step 2: Compute Group Index
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 12,
    explanation: {
      what: `Compute Group ID = ${groupId} (Group Size M = ${groupSizeMAdj})`,
      why: `Super-group contains ${numPidInGroup} PIDs covering row range [${firstPidM}, ${firstPidM + groupSizeMAdj - 1}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: initialElements.map((e, idx) => ({
        ...e,
        state:
          idx === pid
            ? "active"
            : Math.floor(idx / numPidInGroup) === groupId
              ? "queued"
              : "default",
        pointers: idx === pid ? [`Group ${groupId}`] : undefined,
      })),
    },
    auxiliaryState: {
      customState: {
        group_id: String(groupId),
        first_pid_m: String(firstPidM),
        group_size_m_adj: String(groupSizeMAdj),
      },
    },
    variables: { groupId, firstPidM, groupSizeMAdj },
  });

  const pidM = firstPidM + ((pid % numPidInGroup) % groupSizeMAdj);
  const pidN = Math.floor((pid % numPidInGroup) / groupSizeMAdj);

  // Step 3: Compute Swizzled pid_m and pid_n
  const finalElements: ArrayElement[] = initialElements.map((el, idx) => {
    if (idx === pid) {
      return {
        id: el.id,
        value: `PID ${pid} -> (${pidM},${pidN})`,
        state: "sorted",
        pointers: [`Tile[${pidM},${pidN}]`],
      };
    }
    return el;
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: `Mapped Program ID ${pid} -> Tile Block (pid_m = ${pidM}, pid_n = ${pidN})`,
      why: "Swizzled coordinate mapping ensures adjacent SMs fetch Matrix B column tiles concurrently from L2 cache.",
    },
    primarySnapshot: {
      kind: "array",
      elements: finalElements,
    },
    auxiliaryState: {
      customState: {
        mapped_pid_m: String(pidM),
        mapped_pid_n: String(pidN),
        l2_cache_strategy: "Swizzled Column-Major Grouping",
      },
    },
    variables: { pidM, pidN, completed: true },
  });

  return steps;
};

const TRITONPROGRAMID1DTO2DMAP_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  distractors: [
    "pid_m = program_id // grid_n",
    "pid_n = program_id % grid_m",
    "group_id = program_id * group_size_m",
  ],
  hints: [
    { line: 11, hint: "Calculate group ID using integer division over total group PID count." },
    { line: 15, hint: "Compute pid_m using base row offset and modulo adjusted group size." },
    { line: 16, hint: "Compute pid_n by integer division over adjusted group size." },
  ],
  lineExplanations: {
    1: "Defines Triton program ID 1D-to-2D coordinate mapper function.",
    11: "Calculates super-group ID based on group_size_m * grid_n.",
    15: "Maps 1D program ID to 2D row tile index pid_m.",
    16: "Maps 1D program ID to 2D col tile index pid_n.",
  },
};

export const tritonProgramId1dTo2dMap: AlgorithmDefinition<tritonProgramId1dTo2dMapInput> = {
  id: "triton-program-id-1d-to-2d-map",
  title: "Triton `tl.program_id` 1D-to-2D Coordinate Mapper",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_hardware_kernels",
  description:
    "In OpenAI Triton GPU programming, kernels are launched across a 1D grid of program instances where each thread block obtains its unique linear index via `tl.program_id(0)`. To process 2D matrix tiles ($BLOCK\\_M \\times BLOCK\\_N$), the kernel must translate this 1D Program ID into 2D block row (`pid_m`) and block column (`pid_n`) coordinates.\n\nThe **Triton `tl.program_id` 1D-to-2D Coordinate Mapper** incorporates **group swizzling** (`GROUP_SIZE_M`). Instead of standard row-major indexing ($pid_m = id // G_N, pid_n = id \\bmod G_N$), the mapper groups `GROUP_SIZE_M` rows into super-groups, causing consecutive program IDs to step vertically down columns before moving horizontally. This aligns GPU hardware launch scheduling with L2 Cache locality, enabling parallel SMs to share Matrix B column tiles in cache.\n\nInput Format:\n- program_id: 1D program launch index (e.g. 5).\n- grid_m: Total block tile rows.\n- grid_n: Total block tile columns.\n- group_size_m: Grouping factor (e.g. 8).\n\nOutput Format:\n- Tuple of mapped 2D coordinates: (pid_m, pid_n).",
  constraints: [
    "0 <= program_id < grid_m * grid_n",
    "grid_m > 0",
    "grid_n > 0",
    "group_size_m > 0",
  ],
  examples: [
    {
      kind: "basic",
      title: "Program ID 5 Mapping in 4x4 Grid",
      inputDisplay: "program_id = 5, grid_m = 4, grid_n = 4, group_size_m = 2",
      outputDisplay: "(pid_m = 1, pid_n = 1)",
      input: { program_id: 5, grid_m: 4, grid_n: 4, group_size_m: 2 },
      output: "(1, 1)",
      explanation:
        "Maps 1D program ID 5 to 2D block tile (1, 1) using 2-row super-group swizzling.",
    },
    {
      kind: "complex",
      title: "Program ID 0 (Origin Tile)",
      inputDisplay: "program_id = 0, grid_m = 8, grid_n = 8, group_size_m = 4",
      outputDisplay: "(pid_m = 0, pid_n = 0)",
      input: { program_id: 0, grid_m: 8, grid_n: 8, group_size_m: 4 },
      output: "(0, 0)",
      explanation: "Program ID 0 maps to top-left matrix block (0,0).",
    },
    {
      kind: "negative",
      title: "Last Program ID in Grid",
      inputDisplay: "program_id = 15, grid_m = 4, grid_n = 4, group_size_m = 2",
      outputDisplay: "(pid_m = 3, pid_n = 3)",
      input: { program_id: 15, grid_m: 4, grid_n: 4, group_size_m: 2 },
      output: "(3, 3)",
      explanation: "Maps the final thread block to bottom-right matrix tile (3, 3).",
    },
  ],
  code: TRITONPROGRAMID1DTO2DMAP_CODE,
  timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Computes 2D tile coordinates from 1D program ID in $O(1)$ constant time arithmetic.",
    space: "Requires $O(1)$ auxiliary space.",
  },
  topicGuide: {
    overview:
      "Triton `tl.program_id` 1D-to-2D Coordinate Mapper translates linear thread block launch IDs into 2D tile coordinates while optimizing GPU L2 Cache tile reuse for GEMM and Attention kernels.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Given program ID $p$, grid size $G_M, G_N$, and group size $S_M$, group size per column is $N_{\\text{group}} = S_M \\cdot G_N$. Group index is $g = p // N_{\\text{group}}$. Base row is $M_0 = g \\cdot S_M$ with adjusted size $S_{\\text{adj}} = \\min(G_M - M_0, S_M)$. Row coordinate is $pid_m = M_0 + ((p \\bmod N_{\\text{group}}) \\bmod S_{\\text{adj}})$ and column coordinate is $pid_n = (p \\bmod N_{\\text{group}}) // S_{\\text{adj}}$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Standard row-major mapping dispatches consecutive blocks along matrix rows, forcing concurrent SMs to access different columns of Matrix B and thrashing L2 cache lines. Swizzled coordinate mapping ensures parallel SMs access identical Matrix B tile columns simultaneously, maximizing L2 cache hits.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "In Triton Python (`@triton.jit`), this coordinate calculation is executed at the very beginning of the kernel using scalar integer arithmetic on `tl.program_id(0)`.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "When $G_M$ is not divisible by $S_M$, the last super-group has fewer row tiles. The calculation `min(grid_m - first_pid_m, group_size_m)` prevents indexing out-of-bounds row tiles.",
      },
    ],
    keyTerms: [
      {
        term: "tl.program_id",
        definition:
          "Triton built-in function returning the 1D launch index of the executing thread block CTA.",
      },
      {
        term: "Group Swizzling",
        definition:
          "Tiling transformation grouping rows together to align thread block execution order with L2 cache locality.",
      },
      {
        term: "CTA (Cooperative Thread Array)",
        definition:
          "A block of concurrent GPU threads executing on a single SM with access to shared memory.",
      },
      {
        term: "Tile Coordinate",
        definition:
          "The 2D block row (pid_m) and column (pid_n) indices identifying a tensor block in memory.",
      },
    ],
  },
  trivia: TRITONPROGRAMID1DTO2DMAP_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_TRITONPROGRAMID1DTO2DMAP_INPUT,
  generateSteps: generateTRITONPROGRAMID1DTO2DMAPSteps,
};
