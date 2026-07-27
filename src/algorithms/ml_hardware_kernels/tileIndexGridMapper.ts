import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tileIndexGridMapperInput {
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const TILEINDEXGRIDMAPPER_CODE = `
def map_1d_program_id_to_2d_tile(
    pid_1d: int,
    num_pid_m: int,
    num_pid_n: int,
    block_m: int = 128,
    block_n: int = 128,
    stride_m: int = 4096,
    stride_n: int = 1
) -> tuple[int, int, int, int, int]:
    """
    Maps a 1D GPU Thread Block Program ID (tl.program_id(0)) into 2D tile matrix coordinates (pid_m, pid_n).
    Calculates starting row/col indices and global memory byte pointer offset.
    - pid_m = pid_1d // num_pid_n
    - pid_n = pid_1d % num_pid_n
    - start_row = pid_m * block_m
    - start_col = pid_n * block_n
    - global_ptr_offset = start_row * stride_m + start_col * stride_n
    """
    pid_m = pid_1d // num_pid_n
    pid_n = pid_1d % num_pid_n
    
    start_row = pid_m * block_m
    start_col = pid_n * block_n
    
    global_ptr_offset = start_row * stride_m + start_col * stride_n

    return pid_m, pid_n, start_row, start_col, global_ptr_offset
`;

export const DEFAULT_TILEINDEXGRIDMAPPER_INPUT: tileIndexGridMapperInput = {
  data: [0, 1, 2, 3, 4, 5, 6, 7],
};

export const generateTILEINDEXGRIDMAPPERSteps = (
  input: tileIndexGridMapperInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const arrayData = input.data || [0, 1, 2, 3, 4, 5, 6, 7];

  const elements: ArrayElement[] = arrayData.map((val: number, idx: number) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          block_m: "128",
          block_n: "128",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Tile Index Grid Mapper",
    "Configuring 1D-to-2D GPU grid mapping: mapping pid_1d -> (pid_m, pid_n).",
    { num_programs: arrayData.length },
  );

  arrayData.forEach((val: number, idx: number) => {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`pid=${val}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    const pidM = Math.floor(val / 4);
    const pidN = val % 4;

    addStep(
      18,
      `Map 1D program_id=${val} to 2D tile (pid_m=${pidM}, pid_n=${pidN})`,
      `Calculating global memory starting row=${pidM * 128}, col=${pidN * 128} and pointer offset.`,
      { pid1d: val, pidM, pidN },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    25,
    "Execution Complete",
    "Successfully mapped 1D GPU program IDs to 2D matrix tile pointer offsets.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const TILEINDEXGRIDMAPPER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  distractors: [
    "pid_m = pid_1d % num_pid_m",
    "global_ptr_offset = start_row + start_col",
    "start_row = pid_m // block_m",
  ],
  hints: [
    { line: 18, hint: "Compute pid_m = pid_1d // num_pid_n for row tile index." },
    { line: 19, hint: "Compute pid_n = pid_1d % num_pid_n for column tile index." },
    {
      line: 24,
      hint: "Calculate global DRAM pointer offset start_row * stride_m + start_col * stride_n.",
    },
  ],
  lineExplanations: {
    1: "Defines 1D-to-2D GPU tile index grid mapper entry point.",
    18: "Calculates 2D row block index pid_m using integer division.",
    19: "Calculates 2D column block index pid_n using modulo arithmetic.",
    21: "Multiplies pid_m by block_m to find starting matrix row.",
    22: "Multiplies pid_n by block_n to find starting matrix column.",
    24: "Calculates absolute global memory pointer byte offset for DRAM access.",
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
  description:
    "In OpenAI Triton and CUDA kernel launches, grid dimensions can be launched as 1D arrays of Thread Blocks (`grid = (num_programs,)`). However, matrix multiplication (GEMM) and attention operators operate on 2D matrices of shape $[M, N]$ partitioned into tiles of size `BLOCK_M` $\\times$ `BLOCK_N`.\n\n**Tile Index Grid Mapper** computes the mathematical mapping from a 1D Program ID `pid = tl.program_id(0)` to 2D tile matrix coordinates `(pid_m, pid_n)` and global memory pointer offsets:\n$$\\text{pid\\_m} = \\lfloor \\text{pid} / N_{\\text{blocks\\_n}} \\rfloor, \\quad \\text{pid\\_n} = \\text{pid} \\bmod N_{\\text{blocks\\_n}}$$\n$$\\text{start\\_row} = \\text{pid\\_m} \\times \\text{BLOCK\\_M}, \\quad \\text{start\\_col} = \\text{pid\\_n} \\times \\text{BLOCK\\_N}$$\n$$\\text{ptr\\_offset} = \\text{start\\_row} \\times S_m + \\text{start\\_col} \\times S_n$$\nwhere $S_m, S_n$ are the tensor strides in DRAM.\n\nInput Format:\n- data: Array of 1D program IDs `[0, 1, 2, ...]`.\n- target: Target matrix dimension $M$.\n\nOutput Format:\n- Tuple `(pid_m, pid_n, start_row, start_col, global_ptr_offset)` for each GPU thread block.",
  constraints: ["0 <= pid_1d < num_pid_m * num_pid_n", "stride_m >= 1"],
  examples: [
    {
      kind: "basic",
      title: "1D-to-2D Mapping (Grid 2x4)",
      inputDisplay: "pid = 5, num_pid_n = 4, BLOCK = 128",
      outputDisplay: "pid_m = 1, pid_n = 1 (Row 128, Col 128)",
      input: { data: [0, 1, 2, 3, 4, 5, 6, 7] },
      output: "pid_m = 1, pid_n = 1",
      explanation: "Program ID 5 maps to row block 1 and col block 1 in a 2x4 grid.",
    },
    {
      kind: "complex",
      title: "8-Program ID Grid Launch",
      inputDisplay: "data = [0, 1, 2, 3, 4, 5, 6, 7]",
      outputDisplay: "Pointer Offsets Computed",
      input: { data: [0, 1, 2, 3, 4, 5, 6, 7] },
      output: "Pointer Offsets Computed",
      explanation: "Evaluates 2D tile pointer offsets across 8 parallel GPU thread blocks.",
    },
    {
      kind: "negative",
      title: "Program ID 0 Origin Check",
      inputDisplay: "data = [0]",
      outputDisplay: "pid_m = 0, pid_n = 0 (Offset 0)",
      input: { data: [0] },
      output: "pid_m = 0, pid_n = 0",
      explanation: "Program ID 0 maps to top-left matrix origin (0, 0) with zero offset.",
    },
  ],
  code: TILEINDEXGRIDMAPPER_CODE,
  timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Computes 1D-to-2D tile index mapping in $O(1)$ integer division and modulo operations.",
    space: "Requires $O(1)$ auxiliary space per thread block.",
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
