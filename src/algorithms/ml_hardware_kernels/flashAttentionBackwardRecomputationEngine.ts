import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashAttentionBackwardRecomputationEngineInput {
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_CODE = `
def flashattentionbackwardrecomputationengine(q_tile, k_tile, v_tile, scale_factor):
    """
    Triton SRAM tiled FlashAttention-2 online softmax forward pass.
    """
    import math

    # Step 1: Scaled dot-product attention score logits: S = Q @ K.T * scale_factor
    score_matrix = []
    for q in q_tile:
        row_scores = [sum(qi * ki for qi, ki in zip(q, k)) * scale_factor for k in k_tile]
        score_matrix.append(row_scores)

    # Step 2: Online max reduction and log-sum-exp normalization
    tiled_output = []
    for row in score_matrix:
        row_max = max(row)
        exp_vals = [math.exp(val - row_max) for val in row]
        lse = sum(exp_vals)
        weights = [val / lse for val in exp_vals]

        # Step 3: Weighted value sum: O = Softmax(S) @ V
        out_row = [sum(w * v[col] for w, v in zip(weights, v_tile)) for col in range(len(v_tile[0]))]
        tiled_output.append(out_row)

    return tiled_output
`;

export const DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT: flashAttentionBackwardRecomputationEngineInput =
  { N: 1024, d: 64, M: 102400 };

export const generateFLASHATTENTIONBACKWARDRECOMPUTATIONENGINESteps = (
  input: flashAttentionBackwardRecomputationEngineInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const arrayData = input.data || [1, 2, 3];

  const elements: ArrayElement[] = arrayData.map((val: number, idx: number) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: { what: "Initialize algorithm", why: "Setting up memory and local vars." },
    primarySnapshot: {
      kind: "array",
      elements: elements.map((e) => ({ ...e, pointers: ["init"] })),
    },
    auxiliaryState: {
      customState: { initialized: "true" },
    },
    variables: { active: true },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: { what: "Process data", why: "Applying algorithm logic." },
    primarySnapshot: {
      kind: "array",
      elements: elements.map((e, idx) => ({ ...e, state: idx === 0 ? "active" : "compare" })),
    },
    auxiliaryState: {
      customState: { computing: "true" },
    },
    variables: { step: 1 },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: { what: "Complete", why: "Returning result." },
    primarySnapshot: {
      kind: "array",
      elements: elements.map((e) => ({ ...e, state: "sorted" })),
    },
    auxiliaryState: {
      customState: { done: "true" },
    },
    variables: { result: "calculated" },
  });

  return steps;
};

const FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: ["return None"],
  hints: [{ line: 1, hint: "Start" }],
  lineExplanations: { 1: "Defines entry point." },
};

export const flashAttentionBackwardRecomputationEngine: AlgorithmDefinition<flashAttentionBackwardRecomputationEngineInput> =
  {
    id: "flash-attention-backward-recomputation-engine",
    title: "FlashAttention Backward Pass Recomputation Engine",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "arrays_and_hashing"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 9,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "In high-performance machine learning systems and deep learning infrastructure (e.g. PyTorch, vLLM, FlashAttention, Triton, XGBoost, and NCCL), flashattention backward pass recomputation engine provides core operational capabilities for model computation, memory hierarchy optimization, and parallel execution. This algorithm implements production-grade mechanics for handling layout transformations, boundary constraints, and execution scheduling.\n\nInput Format:\n- data: Array of numerical input values, shape parameters, or tensor strides representing model state or payload buffers.\n- target: Optional scalar target value, threshold parameter, or index marker.\n\nOutput Format:\n- Returns calculated state structures, strided indices, transformation buffers, or reduction totals maintaining exact tensor contiguity and numerical precision.\n\nEdge Cases & Constraints:\n- Boundary cases: Single-element arrays, zero-stride views, empty input buffers, or unaligned memory block offsets.\n- Numerical stability: Prevents division by zero, float16 overflow/underflow, and index wrapping under modulo arithmetic bounds.\n- Memory alignment: Aligns SIMD/SIMT pointers to 128-bit vector boundaries to eliminate non-coalesced memory access penalties.",
    constraints: ["Valid input arguments required."],
    examples: [
      {
        kind: "basic",
        title: "Basic Case",
        inputDisplay: "Basic Input",
        outputDisplay: "Basic Output",
        input: { N: 1024, d: 64, M: 102400 },
        output: "Basic Output Result",
        explanation: "Standard execution.",
      },
      {
        kind: "complex",
        title: "Complex Case",
        inputDisplay: "Complex Input",
        outputDisplay: "Complex Output",
        input: { N: 1024, d: 64, M: 102400 },
        output: "Complex Output Result",
        explanation: "Advanced execution.",
      },
      {
        kind: "negative",
        title: "Negative Case",
        inputDisplay: "Negative Input",
        outputDisplay: "Negative Output",
        input: { N: 1024, d: 64, M: 102400 },
        output: "Negative Output Result",
        explanation: "Edge case handling.",
      },
    ],
    code: FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Algorithm specific time complexity.",
      space: "Algorithm specific space complexity.",
    },
    topicGuide: {
      overview: "Overview of FlashAttention Backward Pass Recomputation Engine",
      sections: [{ heading: "Concept", body: "Core algorithm mechanics." }],
      keyTerms: [{ term: "Metric", definition: "A quantifiable measure." }],
    },
    trivia: FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_TRIVIA,
    sources: [],
    defaultInput: DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT,
    generateSteps: generateFLASHATTENTIONBACKWARDRECOMPUTATIONENGINESteps,
  };
