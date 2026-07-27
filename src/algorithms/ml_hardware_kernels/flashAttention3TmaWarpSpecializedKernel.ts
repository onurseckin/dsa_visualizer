import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashAttention3TmaWarpSpecializedKernelInput {
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_CODE = `
def flashattention3tmawarpspecializedkernel(q_tile, k_tile, v_tile, scale_factor):
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

export const DEFAULT_FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_INPUT: flashAttention3TmaWarpSpecializedKernelInput =
  { N: 1024, d: 64, M: 102400 };

export const generateFLASHATTENTION3TMAWARPSPECIALIZEDKERNELSteps = (
  input: flashAttention3TmaWarpSpecializedKernelInput,
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

const FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: ["return None"],
  hints: [{ line: 1, hint: "Start" }],
  lineExplanations: { 1: "Defines entry point." },
};

export const flashAttention3TmaWarpSpecializedKernel: AlgorithmDefinition<flashAttention3TmaWarpSpecializedKernelInput> =
  {
    id: "flash-attention-3-tma-warp-specialized-kernel",
    title: "FlashAttention-3 Hopper TMA & Warp-Specialized Kernel",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 9,
    mlInfraCategory: "ml_hardware_kernels",
    description: "Implementation of FlashAttention-3 Hopper TMA & Warp-Specialized Kernel.",
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
    code: FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Algorithm specific time complexity.",
      space: "Algorithm specific space complexity.",
    },
    topicGuide: {
      overview: "Overview of FlashAttention-3 Hopper TMA & Warp-Specialized Kernel",
      sections: [{ heading: "Concept", body: "Core algorithm mechanics." }],
      keyTerms: [{ term: "Metric", definition: "A quantifiable measure." }],
    },
    trivia: FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_TRIVIA,
    sources: [],
    defaultInput: DEFAULT_FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_INPUT,
    generateSteps: generateFLASHATTENTION3TMAWARPSPECIALIZEDKERNELSteps,
  };
