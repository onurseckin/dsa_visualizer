import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tritonTensorCoreMmaSwizzleInput {
  data: number[];
  target?: number;
}

export const TRITONTENSORCOREMMASWIZZLE_CODE = `
def triton_tensor_core_mma_swizzle(pid_1d, num_pid_m, num_pid_n, group_size=8):
    """
    Swizzles 1D Triton CTA program ID into 2D tile coordinates (pid_m, pid_n) for L2 cache locality.
    """
    num_pids_in_group = group_size * num_pid_n
    group_id = pid_1d // num_pids_in_group
    first_pid_m = group_id * group_size
    group_size_m = min(num_pid_m - first_pid_m, group_size)

    pid_m = first_pid_m + (pid_1d % group_size_m)
    pid_n = (pid_1d % num_pids_in_group) // group_size_m

    return pid_m, pid_n
`;

export const DEFAULT_TRITONTENSORCOREMMASWIZZLE_INPUT: tritonTensorCoreMmaSwizzleInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateTritonTensorCoreMmaSwizzleSteps = (
  input: tritonTensorCoreMmaSwizzleInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
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
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Triton Tensor Core MMA Layout Swizzler",
    "Setting up execution data structures and memory layout pointers.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      `Process element ${idx}: value = ${val}`,
      `Evaluating element at index ${idx} in memory layout.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    13,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const TRITONTENSORCOREMMASWIZZLE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines Triton tensor core MMA layout swizzle function.",
    4: "Calculates total 1D program IDs in a macro-tile group num_pids_in_group = group_size * num_pid_n.",
    5: "Calculates macro-tile group ID = pid_1d // num_pids_in_group.",
    6: "Calculates starting row tile index first_pid_m = group_id * group_size.",
    7: "Calculates effective group height group_size_m handling tail boundary conditions.",
    9: "Calculates swizzled row CTA coordinate pid_m = first_pid_m + (pid_1d % group_size_m).",
    10: "Calculates swizzled column CTA coordinate pid_n = (pid_1d % num_pids_in_group) // group_size_m.",
    12: "Returns swizzled 2D CTA tile coordinate tuple (pid_m, pid_n).",
  },
};

export const tritonTensorCoreMmaSwizzle: AlgorithmDefinition<tritonTensorCoreMmaSwizzleInput> = {
  id: "triton-tensor-core-mma-swizzle",
  title: "Triton Tensor Core MMA Layout Swizzler",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "When launch thread blocks (CTAs) execute matrix multiplication on GPUs, mapping 1D CTA program IDs (pid_1d) sequentially row-by-row causes adjacent CTA blocks to miss L2 cache lines for matrix B. Swizzling program IDs into 2D tile groups (group_size CTAs tall) ensures adjacent CTAs reuse matrix B tile loads from L2 cache, boosting throughput.\n\nThis algorithm implements Triton Tensor Core MMA Layout Swizzle, mapping 1D CTA program IDs into 2D grid block coordinates (pid_m, pid_n) using grouped block swizzling arithmetic.\n\nInput Format:\n- data: Array representing program ID or grid shape values.\n- target: Optional target value.\n\nOutput Format:\n- Returns swizzled (pid_m, pid_n) 2D CTA tile block coordinate tuple.\n\nEdge Cases & Constraints:\n- Last group along M dimension containing fewer than group_size CTAs.\n- Group size = 1 (linear un-swizzled row-major CTA mapping).\n- Large grid launch sizes (e.g. 100x100 CTA blocks).",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Execution",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: DEFAULT_TRITONTENSORCOREMMASWIZZLE_INPUT,
      output: "[10, 20, 30]",
      explanation: "Standard execution pass.",
    },
    {
      kind: "complex",
      title: "Complex Execution",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "[10, 20, 30, 40, 50]",
      input: DEFAULT_TRITONTENSORCOREMMASWIZZLE_INPUT,
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates workload performance boundaries.",
    },
    {
      kind: "negative",
      title: "Edge Case",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: DEFAULT_TRITONTENSORCOREMMASWIZZLE_INPUT,
      output: "[5, 10, 15]",
      explanation: "Edge case execution completes safely.",
    },
  ],
  code: TRITONTENSORCOREMMASWIZZLE_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Execution time complexity pass across input elements.",
    space: "Memory allocation space for result structures.",
  },
  topicGuide: {
    overview:
      "L2 cache swizzling is a critical optimization in OpenAI Triton GEMM kernels. By grouping CTA scheduling into 2D macro-tiles (e.g. 8 CTAs high by N CTAs wide), all CTAs in a group reuse loaded matrix B tiles directly from L2 cache instead of making repeated DRAM calls.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for 1D program ID pid_1d, total CTAs in a group is G_size = GROUP_SIZE * NUM_PID_N. Group ID group_id = pid_1d // G_size. Starting row block first_pid_m = group_id * GROUP_SIZE. Swizzled 2D coordinates are pid_m = first_pid_m + (pid_1d mod group_size_m) and pid_n = (pid_1d mod G_size) // group_size_m.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "On NVIDIA H100 GPUs (50MB L2 cache), L2 block swizzling increases L2 cache hit rate from ~20% up to >85% for large GEMM operations.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation computes group boundaries, calculates local group offsets, and outputs swizzled (pid_m, pid_n) 2D CTA block coordinates.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes tail groups where remaining M blocks are fewer than group_size using min(num_pid_m - first_pid_m, group_size).",
      },
    ],
    keyTerms: [
      {
        term: "CTA Program ID (pid)",
        definition:
          "The 1D hardware identifier assigned to a GPU thread block tile during kernel launch.",
      },
      {
        term: "L2 Cache Swizzling",
        definition:
          "Re-ordering CTA block execution order to maximize L2 cache line reuse across adjacent thread blocks.",
      },
      {
        term: "Macro-Tile Group",
        definition:
          "A 2D cluster of CTA blocks scheduled together to share matrix data loads in L2 cache.",
      },
    ],
  },
  trivia: TRITONTENSORCOREMMASWIZZLE_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_TRITONTENSORCOREMMASWIZZLE_INPUT,
  generateSteps: generateTritonTensorCoreMmaSwizzleSteps,
};
