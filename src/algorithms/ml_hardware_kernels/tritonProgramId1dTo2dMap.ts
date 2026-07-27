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
  [key: string]: unknown;
}

export const TRITONPROGRAMID1DTO2DMAP_CODE = `def triton_program_id_1d_to_2d_map(program_id: int, grid_m: int, grid_n: int, group_size_m: int = 8) -> tuple[int, int]:
    """Maps a 1D launch program_id (from tl.program_id(0)) to 2D matrix tile coordinates (pid_m, pid_n)."""
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

  const createMatrixSnapshot = (
    activePidM?: number,
    activePidN?: number,
  ): MatrixCellItem[][] => {
    const grid: MatrixCellItem[][] = [];
    for (let r = 0; r < gridM; r++) {
      const rowItems: MatrixCellItem[] = [];
      for (let c = 0; c < gridN; c++) {
        const mapping = mappings.find((m) => m.pidM === r && m.pidN === c);

        let state: MatrixCellItem["state"] = "default";
        if (activePidM === r && activePidN === c) {
          state = "active";
        } else if (mapping) {
          state = mapping.programId === targetPid ? "sorted" : "compare";
        }

        const labelStr = mapping !== undefined ? `PID ${mapping.programId}` : `Tile (${r},${c})`;

        rowItems.push({
          row: r,
          col: c,
          value: mapping ? mapping.programId : -1,
          label: labelStr,
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
        matrix: createMatrixSnapshot(activePidM, activePidN),
      },
      auxiliaryState: {
        customState: customState ?? {
          target_program_id: String(targetPid),
          grid_shape: `[${gridM}, ${gridN}]`,
          group_size_m: String(groupSizeM),
          l2_cache_strategy: "Swizzled Column-Major Grouping",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Triton `tl.program_id` 1D-to-2D Coordinate Mapper",
    `Configuring mapper for program_id=${targetPid} in grid [${gridM}, ${gridN}] with group_size_m=${groupSizeM}.`,
    { program_id: targetPid, grid_m: gridM, grid_n: gridN, group_size_m: groupSizeM },
  );

  addStep(
    2,
    "Inspect 1D Program ID mapping sequence",
    `Translating 1D program launch IDs across ${totalPrograms} total grid tiles.`,
    { total_programs: totalPrograms },
  );

  pids.forEach((pid) => {
    addStep(
      1,
      `Map 1D Program ID ${pid}: triton_program_id_1d_to_2d_map(program_id=${pid})`,
      `Translating 1D program ID ${pid} into 2D matrix tile coordinates (pid_m, pid_n).`,
      { program_id: pid },
    );

    const numPidInGroup = groupSizeM * gridN;
    addStep(
      3,
      `Calculate num_pid_in_group = group_size_m * grid_n = ${groupSizeM} * ${gridN} = ${numPidInGroup}`,
      `Number of PIDs per super-group chunk.`,
      { group_size_m: groupSizeM, grid_n: gridN, num_pid_in_group: numPidInGroup },
    );

    const groupId = Math.floor(pid / numPidInGroup);
    addStep(
      4,
      `Calculate group_id = program_id // num_pid_in_group = ${pid} // ${numPidInGroup} = ${groupId}`,
      `Super-group index for program ID ${pid}.`,
      { program_id: pid, group_id: groupId },
    );

    const firstPidM = groupId * groupSizeM;
    addStep(
      5,
      `Calculate first_pid_m = group_id * group_size_m = ${groupId} * ${groupSizeM} = ${firstPidM}`,
      `Starting row tile index for super-group ${groupId}.`,
      { group_id: groupId, first_pid_m: firstPidM },
    );

    const groupSizeMAdj = Math.min(gridM - firstPidM, groupSizeM);
    addStep(
      6,
      `Calculate group_size_m_adj = min(grid_m - first_pid_m, group_size_m) = min(${gridM - firstPidM}, ${groupSizeM}) = ${groupSizeMAdj}`,
      `Clamped row tile count for super-group ${groupId}.`,
      { first_pid_m: firstPidM, group_size_m_adj: groupSizeMAdj },
    );

    const pidM = firstPidM + ((pid % numPidInGroup) % groupSizeMAdj);
    addStep(
      8,
      `Compute swizzled row tile pid_m = ${pidM}`,
      `Mapped 2D row tile index pid_m = ${pidM}.`,
      { program_id: pid, pid_m: pidM },
      pidM,
    );

    const pidN = Math.floor((pid % numPidInGroup) / groupSizeMAdj);
    addStep(
      9,
      `Compute swizzled col tile pid_n = ${pidN}`,
      `Mapped 2D column tile index pid_n = ${pidN}. Reuses Matrix B column tile in GPU L2 cache.`,
      { program_id: pid, pid_n: pidN },
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
      11,
      `Return (pid_m = ${pidM}, pid_n = ${pidN}) for Program ID ${pid}`,
      `1D-to-2D mapping complete: Program ID ${pid} assigned to tile block (${pidM}, ${pidN}).`,
      { program_id: pid, pid_m: pidM, pid_n: pidN },
      pidM,
      pidN,
    );
  });

  addStep(
    11,
    "Triton `tl.program_id` 1D-to-2D Coordinate Mapper Execution Complete",
    `Successfully mapped 1D Program IDs to 2D tile coordinates (pid_m, pid_n) with L2 cache group swizzling.`,
    { completed: true, total_mapped: mappings.length },
  );

  return steps;
};

export const TRITONPROGRAMID1DTO2DMAP_TRIVIA: TriviaMeta = {
  skipLines: [2, 7, 10],
  distractors: [
    "pid_m = program_id // grid_n",
    "pid_n = program_id % grid_m",
    "group_id = program_id * group_size_m",
    "first_pid_m = group_id + group_size_m",
  ],
  hints: [
    { line: 4, hint: "Calculate group ID using integer division over total group PID count." },
    { line: 8, hint: "Compute pid_m using base row offset and modulo adjusted group size." },
    { line: 9, hint: "Compute pid_n by integer division over adjusted group size." },
  ],
  lineExplanations: {
    1: "Defines triton_program_id_1d_to_2d_map signature with program_id, grid dimensions, and group_size_m.",
    2: "Docstring explaining Triton tl.program_id 1D-to-2D swizzled coordinate mapper.",
    3: "Calculates total program IDs per super-group num_pid_in_group = group_size_m * grid_n.",
    4: "Calculates super-group index group_id = program_id // num_pid_in_group.",
    5: "Calculates starting row tile index first_pid_m = group_id * group_size_m.",
    6: "Calculates dynamically clamped group size group_size_m_adj = min(grid_m - first_pid_m, group_size_m).",
    7: "Blank line preceding 2D tile coordinate calculation.",
    8: "Calculates swizzled row tile index pid_m = first_pid_m + ((program_id % num_pid_in_group) % group_size_m_adj).",
    9: "Calculates swizzled column tile index pid_n = (program_id % num_pid_in_group) // group_size_m_adj.",
    10: "Blank line preceding return statement.",
    11: "Returns tuple of (pid_m, pid_n) mapped tile coordinates for GPU SM block execution.",
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
  description: `Master GPU Program ID Coordinate Mapping in OpenAI Triton: translate 1D linear thread block launch IDs (\`tl.program_id(0)\`) into 2D block row (\`pid_m\`) and block column (\`pid_n\`) coordinates with L2 cache super-group swizzling.

### Why It Exists & What It Solves
In OpenAI Triton GPU programming, kernels are launched across a 1D grid of program instances where each thread block obtains its unique linear index via \`tl.program_id(0)\`. To process 2D matrix tiles ($\text{BLOCK\_M} \times \text{BLOCK\_N}$), the kernel must translate this 1D Program ID into 2D block row (\`pid_m\`) and block column (\`pid_n\`) coordinates.

The **Triton \`tl.program_id\` 1D-to-2D Coordinate Mapper** incorporates **group swizzling** (\`GROUP_SIZE_M\`). Instead of standard row-major indexing ($pid_m = id // G_N, pid_n = id \bmod G_N$), the mapper groups \`GROUP_SIZE_M\` rows into super-groups, causing consecutive program IDs to step vertically down columns before moving horizontally:
- **Super-Group Size**: $N_{\text{group}} = \text{GROUP\_SIZE\_M} \times G_N$.
- **Group ID**: $g = \text{program\_id} // N_{\text{group}}$.
- **Base Row**: $M_0 = g \times \text{GROUP\_SIZE\_M}$.
- **Clamped Size**: $S_{\text{adj}} = \min(G_M - M_0, \text{GROUP\_SIZE\_M})$.
- **Coordinates**:
  $$\text{pid\_m} = M_0 + ((\text{program\_id} \bmod N_{\text{group}}) \bmod S_{\text{adj}})$$
  $$\text{pid\_n} = (\text{program\_id} \bmod N_{\text{group}}) // S_{\text{adj}}$$

This aligns GPU hardware launch scheduling with L2 Cache locality, enabling parallel SMs to share Matrix B column tiles in cache and saving DRAM memory bandwidth.

### Step-by-Step Intuition
1. **Compute Group Capacity**: $N_{\text{group}} = \text{group\_size\_m} \times G_N$.
2. **Determine Group ID**: $g = \text{program\_id} // N_{\text{group}}$.
3. **Determine Base Row**: $M_0 = g \times \text{group\_size\_m}$.
4. **Determine Adjusted Row Count**: $S_{\text{adj}} = \min(G_M - M_0, \text{group\_size\_m})$.
5. **Evaluate Mapped Coordinates**:
   - $\text{pid\_m} = M_0 + ((\text{program\_id} \bmod N_{\text{group}}) \bmod S_{\text{adj}})$.
   - $\text{pid\_n} = (\text{program\_id} \bmod N_{\text{group}}) // S_{\text{adj}}$.

### Input Parameters
- \`program_id\`: 1D program launch index (e.g. 5).
- \`grid_m\`: Total block tile rows ($G_M$).
- \`grid_n\`: Total block tile columns ($G_N$).
- \`group_size_m\`: Grouping factor (e.g. 2 or 8).

### Output
- Returns tuple of mapped 2D coordinates: \`(pid_m, pid_n)\`.

### Trade-offs & Complexity
- **Time Complexity**: $O(1)$ constant integer operations.
- **Space Complexity**: $O(1)$ auxiliary space.`,
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
      explanation: "Maps 1D program ID 5 to 2D block tile (1, 1) using 2-row super-group swizzling.",
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
    time: "Computes 2D tile coordinates from 1D program ID in O(1) constant time arithmetic.",
    space: "Requires O(1) auxiliary space.",
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
