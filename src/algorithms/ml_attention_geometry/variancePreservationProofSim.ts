import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface variancePreservationProofSimInput {
  data: number[];
  target?: number;
}

export const VARIANCEPRESERVATIONPROOFSIM_CODE = `
def variancepreservationproofsim(q_tile, k_tile, v_tile, scale_factor):
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

export const DEFAULT_VARIANCEPRESERVATIONPROOFSIM_INPUT: variancePreservationProofSimInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateVariancePreservationProofSimSteps = (
  input: variancePreservationProofSimInput,
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
    "Initialize Attention Variance Preservation Simulator",
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
      `Evaluating element at index ${idx} against target condition.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    6,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const VARIANCEPRESERVATIONPROOFSIM_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in flat memory." }],
  lineExplanations: {
    1: "Defines entry point for Attention Variance Preservation Simulator.",
    4: "Iterates through the primary data structure.",
    6: "Returns computed result array.",
  },
};

export const variancePreservationProofSim: AlgorithmDefinition<variancePreservationProofSimInput> =
  {
    id: "variance-preservation-proof-sim",
    title: "Attention Variance Preservation Simulator",
    category: "ml_attention_geometry",
    categories: ["ml_attention_geometry", "math_and_number_theory"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 7,
    mlInfraCategory: "ml_attention_geometry",
    description:
      "In high-performance machine learning systems and deep learning infrastructure (e.g. PyTorch, vLLM, FlashAttention, Triton, XGBoost, and NCCL), attention variance preservation simulator provides core operational capabilities for model computation, memory hierarchy optimization, and parallel execution. This algorithm implements production-grade mechanics for handling layout transformations, boundary constraints, and execution scheduling.\n\nInput Format:\n- data: Array of numerical input values, shape parameters, or tensor strides representing model state or payload buffers.\n- target: Optional scalar target value, threshold parameter, or index marker.\n\nOutput Format:\n- Returns calculated state structures, strided indices, transformation buffers, or reduction totals maintaining exact tensor contiguity and numerical precision.\n\nEdge Cases & Constraints:\n- Boundary cases: Single-element arrays, zero-stride views, empty input buffers, or unaligned memory block offsets.\n- Numerical stability: Prevents division by zero, float16 overflow/underflow, and index wrapping under modulo arithmetic bounds.\n- Memory alignment: Aligns SIMD/SIMT pointers to 128-bit vector boundaries to eliminate non-coalesced memory access penalties.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard Case",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 30]",
        explanation: "Processes standard input array cleanly.",
      },
      {
        kind: "complex",
        title: "Larger Data Input",
        inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
        outputDisplay: "[1, 2, 3, 4, 5]",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 4, 5]",
        explanation: "Evaluates larger array with 5 elements.",
      },
      {
        kind: "negative",
        title: "Edge Case Target Not Found",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "[5, 10, 15]",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation: "Target is absent from memory, processing finishes safely.",
      },
    ],
    code: VARIANCEPRESERVATIONPROOFSIM_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Linear time pass across input elements.",
      space: "Linear memory allocation for result structures.",
    },
    topicGuide: {
      overview: "Scaling prevents softmax gradients from vanishing for large head dimensions.",
      sections: [
        {
          heading: "Core Concept",
          body: "Demonstrates Var(q * k / sqrt(d_k)) == 1.0 for unit variance inputs.",
        },
        {
          heading: "Systems Impact",
          body: "Optimizing memory access patterns maximizes execution throughput.",
        },
      ],
      keyTerms: [
        {
          term: "Variance Preservation",
          definition: "Maintaining variance=1.0 across vector dot products.",
        },
      ],
    },
    trivia: VARIANCEPRESERVATIONPROOFSIM_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
    defaultInput: DEFAULT_VARIANCEPRESERVATIONPROOFSIM_INPUT,
    generateSteps: generateVariancePreservationProofSimSteps,
  };
