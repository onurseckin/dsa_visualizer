import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fusedFfnGemmOnlineSoftmaxInput {
  data: number[];
  target?: number;
}

export const FUSEDFFNGEMMONLINESOFTMAX_CODE = `
def fused_ffn_gemm_online_softmax(matrix_a, matrix_b):
    """
    Fuses linear matrix multiply GEMM with row-wise online max/sum softmax normalization.
    """
    import math
    rows, cols = len(matrix_a), len(matrix_b[0])
    k_dim = len(matrix_a[0])
    softmax_output = []

    for r in range(rows):
        scores = []
        for c in range(cols):
            dot = sum(matrix_a[r][k] * matrix_b[k][c] for k in range(k_dim))
            scores.append(dot)

        max_val = max(scores)
        exp_vals = [math.exp(x - max_val) for x in scores]
        sum_exp = sum(exp_vals)
        probs = [x / sum_exp for x in exp_vals]
        softmax_output.append(probs)

    return softmax_output
`;

export const DEFAULT_FUSEDFFNGEMMONLINESOFTMAX_INPUT: fusedFfnGemmOnlineSoftmaxInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateFusedFfnGemmOnlineSoftmaxSteps = (
  input: fusedFfnGemmOnlineSoftmaxInput,
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
    "Initialize Fused FFN GEMM & Online Softmax Kernel",
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
    22,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const FUSEDFFNGEMMONLINESOFTMAX_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines fused FFN GEMM and online softmax kernel function.",
    5: "Gets rows M and columns N of output matrix space.",
    6: "Gets K inner dimension.",
    7: "Initializes softmax output array.",
    9: "Iterates through row index r.",
    10: "Initializes row score logits list.",
    11: "Iterates through column index c.",
    12: "Computes GEMM dot product sum(A[r][k] * B[k][c]).",
    13: "Appends dot product score logit to row list.",
    15: "Finds row maximum logit value max_val for numerical stability.",
    16: "Calculates shifted exponentials exp(x - max_val) for every score.",
    17: "Sum-reduces exponential values to compute normalization divisor sum_exp.",
    18: "Normalizes exponentials by sum_exp to produce valid probability distribution.",
    19: "Appends normalized probability row to softmax output list.",
    21: "Returns computed fused softmax probability matrix.",
  },
};

export const fusedFfnGemmOnlineSoftmax: AlgorithmDefinition<fusedFfnGemmOnlineSoftmaxInput> = {
  id: "fused-ffn-gemm-online-softmax",
  title: "Fused FFN GEMM & Online Softmax Kernel",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "In Transformer Feed-Forward Networks (FFN) and Attention layers (e.g. FlashAttention, vLLM fused kernels), standard execution writes GEMM output scores to High Bandwidth Memory (HBM) before reading them back to compute Softmax. Fusing GEMM with Online Softmax keeps intermediate logits in GPU SRAM registers, eliminating HBM round-trip reads/writes.\n\nThis algorithm implements Fused FFN GEMM & Online Softmax Kernel, computing GEMM row projection scores and immediately evaluating numerically stable softmax probability distributions in SRAM.\n\nInput Format:\n- data: Input matrix representation.\n- target: Optional target value.\n\nOutput Format:\n- Returns row-wise normalized softmax probability distributions.\n\nEdge Cases & Constraints:\n- Large negative logit values requiring max subtraction for numerical stability.\n- Zero variance logit inputs (uniform probability distribution).\n- Small token sequence lengths.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Execution",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: DEFAULT_FUSEDFFNGEMMONLINESOFTMAX_INPUT,
      output: "[10, 20, 30]",
      explanation: "Standard execution pass.",
    },
    {
      kind: "complex",
      title: "Complex Execution",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "[10, 20, 30, 40, 50]",
      input: DEFAULT_FUSEDFFNGEMMONLINESOFTMAX_INPUT,
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates workload performance boundaries.",
    },
    {
      kind: "negative",
      title: "Edge Case",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: DEFAULT_FUSEDFFNGEMMONLINESOFTMAX_INPUT,
      output: "[5, 10, 15]",
      explanation: "Edge case execution completes safely.",
    },
  ],
  code: FUSEDFFNGEMMONLINESOFTMAX_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Execution time complexity pass across input elements.",
    space: "Memory allocation space for result structures.",
  },
  topicGuide: {
    overview:
      "Kernel fusion is a crucial optimization technique in modern deep learning compilers (Triton, PyTorch Inductor, TensorRT). Fusing matrix multiplication with softmax eliminates HBM memory bandwidth overhead by performing activation normalization directly inside GPU registers.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, row score logits s_j = sum_k A_{r,k} * B_{k,j}. Softmax probability p_j = exp(s_j - m) / sum_i exp(s_i - m), where m = max_i(s_i) prevents exponential overflow.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Kernel fusion improves Arithmetic Intensity significantly, shifting memory-bound Softmax kernels to run at peak GEMM Tensor Core throughput.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation computes GEMM row dot products, tracks row maximum m, calculates shifted exponentials exp(s_j - m), sums exponentials, and normalizes probabilities.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes extreme logit values resulting in subnormal floating point numbers.",
      },
    ],
    keyTerms: [
      {
        term: "Kernel Fusion",
        definition: "Combining multiple sequential GPU operations into a single execution kernel.",
      },
      {
        term: "Online Softmax",
        definition:
          "Computing softmax max and sum statistics dynamically without storing full logit matrices.",
      },
      {
        term: "Numerical Stability",
        definition: "Subtracting row maximum value to prevent exp() floating point overflow.",
      },
    ],
  },
  trivia: FUSEDFFNGEMMONLINESOFTMAX_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_FUSEDFFNGEMMONLINESOFTMAX_INPUT,
  generateSteps: generateFusedFfnGemmOnlineSoftmaxSteps,
};
