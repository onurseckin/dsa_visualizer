import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tritonTensorCoreMmaSwizzleInput {
  pid_1d?: number;
  num_pid_m?: number;
  num_pid_n?: number;
  group_size?: number;
  program_ids?: number[];
}

export const TRITONTENSORCOREMMASWIZZLE_CODE = `def triton_tensor_core_mma_swizzle(pid_1d, num_pid_m, num_pid_n, group_size=8):
    num_pids_in_group = group_size * num_pid_n
    group_id = pid_1d // num_pids_in_group
    first_pid_m = group_id * group_size
    group_size_m = min(num_pid_m - first_pid_m, group_size)

    pid_m = first_pid_m + (pid_1d % group_size_m)
    pid_n = (pid_1d % num_pids_in_group) // group_size_m

    return pid_m, pid_n`;

export const DEFAULT_TRITONTENSORCOREMMASWIZZLE_INPUT: tritonTensorCoreMmaSwizzleInput = {
  pid_1d: 5,
  num_pid_m: 4,
  num_pid_n: 4,
  group_size: 2,
  program_ids: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
};

export const generateTritonTensorCoreMmaSwizzleSteps = (
  input: tritonTensorCoreMmaSwizzleInput,
): AlgorithmStep[] => {
  const num_pid_m = input.num_pid_m ?? 4;
  const num_pid_n = input.num_pid_n ?? 4;
  const group_size = input.group_size ?? 2;
  const targetPid1d = input.pid_1d ?? 5;
  const program_ids = input.program_ids ?? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // Map storing mapped (pid_m, pid_n) for each pid_1d
  const mappedGrid: Map<string, number> = new Map();

  const createMatrixSnapshot = (
    activeM?: number,
    activeN?: number,
    activePid?: number,
    completed = false,
    titleExtra = "",
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < num_pid_m; r++) {
      for (let c = 0; c < num_pid_n; c++) {
        const key = `${r},${c}`;
        const mappedPid = mappedGrid.get(key);
        let state: "default" | "active" | "compared" | "sorted" | "pivot" | "inactive" = "default";
        let label: string | undefined;

        if (completed) {
          state = "sorted";
          label = mappedPid !== undefined ? `pid:${mappedPid}` : undefined;
        } else if (r === activeM && c === activeN) {
          state = "active";
          label = `pid:${activePid}`;
        } else if (mappedPid !== undefined) {
          state = "sorted";
          label = `pid:${mappedPid}`;
        }

        cells.push({
          row: r,
          col: c,
          value: mappedPid !== undefined ? mappedPid : "-",
          label: label ?? `[${r},${c}]`,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows: num_pid_m,
      cols: num_pid_n,
      rowHeaders: Array.from({ length: num_pid_m }, (_, r) => `Tile Row ${r}`),
      colHeaders: Array.from({ length: num_pid_n }, (_, c) => `Tile Col ${c}`),
      title: `Triton CTA 2D Tile Grid (${num_pid_m}x${num_pid_n})${titleExtra}`,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeM?: number,
    activeN?: number,
    activePid?: number,
    completed = false,
    titleExtra = "",
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: createMatrixSnapshot(activeM, activeN, activePid, completed, titleExtra),
      auxiliaryState: {
        customState: {
          num_pid_m,
          num_pid_n,
          group_size,
          mappedCount: mappedGrid.size,
        },
      },
      variables,
    });
  };

  // Line 1: Function init
  addStep(
    1,
    "Initialize Triton Tensor Core MMA Layout Swizzler",
    `Grid dimensions: ${num_pid_m} M tiles x ${num_pid_n} N tiles. Macro-tile group size = ${group_size}.`,
    { num_pid_m, num_pid_n, group_size },
  );

  // First perform detailed step trace for the primary target pid_1d
  {
    const pid_1d = targetPid1d;
    const num_pids_in_group = group_size * num_pid_n;
    const group_id = Math.floor(pid_1d / num_pids_in_group);
    const first_pid_m = group_id * group_size;
    const group_size_m = Math.min(num_pid_m - first_pid_m, group_size);
    const pid_m = first_pid_m + (pid_1d % group_size_m);
    const pid_n = Math.floor((pid_1d % num_pids_in_group) / group_size_m);

    addStep(
      1,
      `Select Target 1D CTA Program ID: pid_1d = ${pid_1d}`,
      `Compute 2D tile location (pid_m, pid_n) for CTA program ID ${pid_1d}.`,
      { pid_1d, num_pid_m, num_pid_n, group_size },
    );

    addStep(
      2,
      `Calculate Group Size: num_pids_in_group = group_size * num_pid_n (${group_size} * ${num_pid_n} = ${num_pids_in_group})`,
      "Calculate total program IDs assigned to one macro-tile group.",
      { pid_1d, num_pids_in_group },
    );

    addStep(
      3,
      `Calculate Group ID: group_id = pid_1d // num_pids_in_group (${pid_1d} // ${num_pids_in_group} = ${group_id})`,
      `Identify macro-tile group containing program ID ${pid_1d}.`,
      { pid_1d, group_id, num_pids_in_group },
    );

    addStep(
      4,
      `Calculate First M Tile: first_pid_m = group_id * group_size (${group_id} * ${group_size} = ${first_pid_m})`,
      "Determine starting M row block index for current macro-tile group.",
      { group_id, first_pid_m },
    );

    addStep(
      5,
      `Calculate Effective Group Height: group_size_m = min(${num_pid_m} - ${first_pid_m}, ${group_size}) (${group_size_m})`,
      "Clamp group size for boundary tail groups near edge of M dimension.",
      { num_pid_m, first_pid_m, group_size_m },
    );

    addStep(
      7,
      `Calculate Swizzled Row Tile: pid_m = first_pid_m + (pid_1d % group_size_m) (${first_pid_m} + (${pid_1d} % ${group_size_m}) = ${pid_m})`,
      `Compute swizzled 2D M row coordinate: pid_m = ${pid_m}.`,
      { pid_1d, first_pid_m, group_size_m, pid_m },
      pid_m,
      pid_n,
      pid_1d,
    );

    addStep(
      8,
      `Calculate Swizzled Col Tile: pid_n = (pid_1d % num_pids_in_group) // group_size_m (${pid_n})`,
      `Compute swizzled 2D N column coordinate: pid_n = ${pid_n}.`,
      { pid_1d, num_pids_in_group, group_size_m, pid_n },
      pid_m,
      pid_n,
      pid_1d,
    );

    mappedGrid.set(`${pid_m},${pid_n}`, pid_1d);

    addStep(
      10,
      `Return Swizzled Coordinates: (pid_m, pid_n) = (${pid_m}, ${pid_n}) for pid_1d = ${pid_1d}`,
      `Successfully mapped 1D program ID ${pid_1d} to 2D CTA tile (${pid_m}, ${pid_n}).`,
      { pid_1d, pid_m, pid_n },
      pid_m,
      pid_n,
      pid_1d,
    );
  }

  // Next sweep through the remaining program IDs to populate the entire CTA grid
  addStep(
    1,
    "Sweep Remaining CTA Launch Grid Program IDs",
    "Swizzle all 1D program IDs to visualize complete L2 cache block grouping.",
    { total_pids: program_ids.length },
  );

  for (const pid_1d of program_ids) {
    const num_pids_in_group = group_size * num_pid_n;
    const group_id = Math.floor(pid_1d / num_pids_in_group);
    const first_pid_m = group_id * group_size;
    const group_size_m = Math.min(num_pid_m - first_pid_m, group_size);
    const pid_m = first_pid_m + (pid_1d % group_size_m);
    const pid_n = Math.floor((pid_1d % num_pids_in_group) / group_size_m);

    mappedGrid.set(`${pid_m},${pid_n}`, pid_1d);

    addStep(
      7,
      `Swizzle pid_1d = ${pid_1d} -> (pid_m = ${pid_m}, pid_n = ${pid_n})`,
      `Macro-tile group ${group_id} maps 1D ID ${pid_1d} to tile [${pid_m}, ${pid_n}].`,
      { pid_1d, group_id, pid_m, pid_n },
      pid_m,
      pid_n,
      pid_1d,
    );
  }

  // Final complete step
  addStep(
    10,
    "Triton Tensor Core MMA Layout Swizzle Complete",
    "All CTA program IDs mapped into 2D L2-cache friendly macro-tile layout.",
    { completed: true },
    undefined,
    undefined,
    undefined,
    true,
    " - Complete",
  );

  return steps;
};

export const TRITONTENSORCOREMMASWIZZLE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "pid_m = pid_1d // num_pid_n",
    "pid_n = pid_1d % num_pid_n",
    "num_pids_in_group = group_size * num_pid_m",
  ],
  hints: [
    { line: 2, hint: "Total PIDs in a group is group_size * num_pid_n." },
    { line: 3, hint: "Macro-tile group ID is pid_1d // num_pids_in_group." },
    { line: 5, hint: "group_size_m accounts for boundary tail groups using min()." },
    { line: 7, hint: "Swizzled row pid_m is first_pid_m + (pid_1d % group_size_m)." },
  ],
  lineExplanations: {
    1: "Defines Triton tensor core MMA program ID swizzle function signature.",
    2: "Calculates total program IDs in a macro-tile group num_pids_in_group = group_size * num_pid_n.",
    3: "Calculates macro-tile group ID = pid_1d // num_pids_in_group.",
    4: "Calculates starting row tile index first_pid_m = group_id * group_size.",
    5: "Calculates effective group height group_size_m handling tail boundary conditions.",
    6: "Blank line separating group calculation from coordinate swizzling.",
    7: "Calculates swizzled row CTA coordinate pid_m = first_pid_m + (pid_1d % group_size_m).",
    8: "Calculates swizzled column CTA coordinate pid_n = (pid_1d % num_pids_in_group) // group_size_m.",
    9: "Blank line separating coordinate calculation from return statement.",
    10: "Returns swizzled 2D CTA tile coordinate tuple (pid_m, pid_n).",
  },
};

export const tritonTensorCoreMmaSwizzle: AlgorithmDefinition<tritonTensorCoreMmaSwizzleInput> = {
  id: "triton-tensor-core-mma-swizzle",
  title: "Triton Tensor Core MMA Layout Swizzler",
  topicIds: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Hard",
  description:
    "When launching thread blocks (CTAs) for matrix multiplication on GPUs (e.g. OpenAI Triton GEMM kernels on NVIDIA Tensor Cores), mapping 1D CTA program IDs (`pid_1d`) sequentially row-by-row causes adjacent thread blocks executing in parallel to request different columns of Matrix $B$. This leads to heavy L2 cache line thrashing and low hit rates ($\\approx 20\\%$).\n\nSwizzling program IDs maps sequential 1D CTA program IDs into 2D macro-tile groups (e.g., $G$ CTAs tall by $N_{\\text{tiles}}$ CTAs wide):\n$$\\text{group\\_id} = \\lfloor \\frac{\\text{pid}_{1\\text{d}}}{G \\times N_{\\text{tiles}}} \\rfloor$$\n$$\\text{pid}_m = \\text{first\\_pid}_m + (\\text{pid}_{1\\text{d}} \\bmod G_{\\text{m}}), \\quad \\text{pid}_n = \\lfloor \\frac{\\text{pid}_{1\\text{d}} \\bmod (G \\times N_{\\text{tiles}})}{G_{\\text{m}}} \\rfloor$$\nThread blocks inside the same macro-tile group run simultaneously and share loaded Matrix $B$ tiles directly from GPU L2 cache, boosting L2 hit rates up to $>85\\%$ and significantly increasing GEMM FLOPS.",
  constraints: [
    "0 <= pid_1d < num_pid_m * num_pid_n",
    "1 <= num_pid_m <= 1024",
    "1 <= num_pid_n <= 1024",
    "1 <= group_size <= 64",
  ],
  examples: [
    {
      kind: "basic",
      title: "CTA Program ID Swizzle",
      inputDisplay: "pid_1d = 5, num_pid_m = 4, num_pid_n = 4, group_size = 2",
      outputDisplay: "(pid_m = 1, pid_n = 2)",
      input: DEFAULT_TRITONTENSORCOREMMASWIZZLE_INPUT,
      output: "(1, 2)",
      explanation: "Maps 1D program ID 5 into 2D CTA tile (1, 2) inside macro-tile group 0.",
    },
    {
      kind: "complex",
      title: "Group Boundary Swizzle",
      inputDisplay: "pid_1d = 8, num_pid_m = 4, num_pid_n = 4, group_size = 2",
      outputDisplay: "(pid_m = 2, pid_n = 0)",
      input: {
        pid_1d: 8,
        num_pid_m: 4,
        num_pid_n: 4,
        group_size: 2,
      },
      output: "(2, 0)",
      explanation: "Program ID 8 moves to group_id 1 starting at first_pid_m = 2.",
    },
  ],
  code: TRITONTENSORCOREMMASWIZZLE_CODE,
  timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "O(1) constant time integer arithmetic operations (division, modulo, min).",
    space: "O(1) auxiliary space.",
  },
  topicGuide: {
    overview:
      "L2 Cache Swizzling is an indispensable optimization technique used in modern GPU JIT compilers like OpenAI Triton. By re-ordering CTA execution scheduling into 2D macro-tiles, parallel thread blocks cooperate in hardware cache line reuse, drastically reducing global DRAM memory bandwidth bottlenecks.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Standard CUDA grid launch schedules CTAs in 1D order `pid_1d = blockIdx.x`. In naive GEMM, adjacent thread blocks process different $N$ columns of Matrix $B$. Because GPU L2 cache capacity is limited, loading distinct matrix columns causes cache eviction. Macro-tile swizzling groups CTAs vertically ($G$ CTAs tall) so multiple CTAs access the same Matrix $B$ column tiles simultaneously.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "CTA swizzling solves severe L2 cache thrashing in Triton GEMM kernels, FlashAttention tile scheduling, Fused Linear Layers, and quantized INT8/FP8 GEMMs in production vLLM and TensorRT engines.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "1. Compute group size $N_{\\text{group}} = G \\times N_{\\text{tiles}}$.\n2. Determine group ID: $\\text{group\\_id} = \\lfloor \\text{pid}_{1\\text{d}} / N_{\\text{group}} \\rfloor$.\n3. Compute starting M tile: $\\text{first\\_pid}_m = \\text{group\\_id} \\times G$.\n4. Handle tail boundaries: $G_m = \\min(M_{\\text{tiles}} - \\text{first\\_pid}_m, G)$.\n5. Compute 2D grid coordinates:\n$$\\text{pid}_m = \\text{first\\_pid}_m + (\\text{pid}_{1\\text{d}} \\bmod G_m)$$\n$$\\text{pid}_n = \\lfloor \\frac{\\text{pid}_{1\\text{d}} \\bmod N_{\\text{group}}}{G_m} \\rfloor$$",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "Group size selection depends on GPU L2 cache capacity and grid dimension shapes. Too small a group size fails to maximize L2 hit rates; too large a group size creates imbalance across Streaming Multiprocessors (SMs) on grid boundary tails.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(1)$ integer arithmetic per thread block. Space Complexity: $\\mathcal{O}(1)$ auxiliary registers.",
      },
    ],
    keyTerms: [
      {
        term: "CTA Program ID (pid)",
        definition:
          "Unique 1D hardware identifier assigned to a GPU thread block tile during grid launch.",
      },
      {
        term: "L2 Cache Swizzling",
        definition:
          "Re-ordering CTA block launch sequence to maximize L2 cache line reuse across parallel thread blocks.",
      },
      {
        term: "Macro-Tile Group",
        definition:
          "A 2D cluster of CTA blocks scheduled together to share matrix data loads in GPU L2 cache.",
      },
      {
        term: "Warp Divergence",
        definition:
          "Performance penalty occurring when threads within a GPU warp take different execution paths.",
      },
    ],
  },
  trivia: TRITONTENSORCOREMMASWIZZLE_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_TRITONTENSORCOREMMASWIZZLE_INPUT,
  generateSteps: generateTritonTensorCoreMmaSwizzleSteps,
};
