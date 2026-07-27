import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface causalLowerTriangularMaskInput {
  data: number[];
  target?: number;
}

export const CAUSALLOWERTRIANGULARMASK_CODE = `
def causal_lower_triangular_mask(q_seq_len: int, kv_seq_len: int) -> list[list[float]]:
    """
    Constructs a causal lower-triangular mask matrix for autoregressive attention.
    Positions where query token index i < key token index j are assigned -inf
    to enforce strictly causal autoregressive attention bounds.
    """
    mask = []
    for i in range(q_seq_len):
        row = []
        for j in range(kv_seq_len):
            if j <= i:
                row.append(0.0)
            else:
                row.append(float('-inf'))
        mask.append(row)
    return mask
`;

export const DEFAULT_CAUSALLOWERTRIANGULARMASK_INPUT: causalLowerTriangularMaskInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateCausalLowerTriangularMaskSteps = (
  input: causalLowerTriangularMaskInput,
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
    "Initialize Causal Lower-Triangular Mask Generator",
    "Setting up execution data structures and memory layout pointers for autoregressive masking.",
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
      8,
      `Evaluate causal mask row i=${idx} (token value=${val})`,
      `Applying lower-triangular check: for key indices j <= ${idx}, mask value is 0.0; for j > ${idx}, mask is -inf.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    15,
    "Execution Complete",
    "Successfully constructed causal lower-triangular attention mask boundaries.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const CAUSALLOWERTRIANGULARMASK_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6],
  distractors: [
    "row.append(1.0 if j == i else 0.0)",
    "mask = [[0.0] * kv_seq_len] * q_seq_len",
    "if j >= i: row.append(float('-inf'))",
  ],
  hints: [
    { line: 8, hint: "Check if key index j is less than or equal to query index i." },
    { line: 9, hint: "Assign 0.0 to unmasked causal positions." },
    { line: 11, hint: "Assign -inf to future positions to prohibit lookahead attention." },
  ],
  lineExplanations: {
    1: "Defines entry point for Causal Lower-Triangular Mask Generator.",
    7: "Iterates through query sequence length row by row.",
    8: "Checks whether key token index j is less than or equal to query token index i.",
    9: "Sets mask value to 0.0 for valid historical and current tokens.",
    11: "Sets mask value to -inf for future tokens to prevent information leak.",
    13: "Returns the constructed lower-triangular causal mask matrix.",
  },
};

export const causalLowerTriangularMask: AlgorithmDefinition<causalLowerTriangularMaskInput> = {
  id: "causal-lower-triangular-mask",
  title: "Causal Lower-Triangular Mask Generator",
  category: "ml_attention_geometry",
  categories: ["ml_attention_geometry", "math_and_number_theory"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 7,
  mlInfraCategory: "ml_attention_geometry",
  description:
    "In autoregressive Transformer models (such as GPT-4, LLaMA-3, and Claude), causal self-attention prevents tokens from attending to future positions $j > i$. Causal Lower-Triangular Masking constructs an explicit or implicit mask matrix $M \\in \\mathbb{R}^{N \\times N}$ where $M_{ij} = 0$ for $j \\le i$ and $M_{ij} = -\\infty$ for $j > i$.\n\nWhen added to unscaled attention score logits $S = Q K^T / \\sqrt{d_k}$, the $-\\infty$ values evaluate to $e^{-\\infty} = 0$ after Softmax normalization, guaranteeing zero attention weight on subsequent tokens.\n\nInput Format:\n- data: Sequence lengths or token ID array representing prompt and generated sequence length $N$.\n- target: Optional parameter specifying sequence length threshold or block boundary.\n\nOutput Format:\n- Returns a lower-triangular matrix or boolean mask view where non-causal entries are set to $-\\infty$ (or False), enforcing strictly unidirectional causal attention.\n\nEdge Cases & Constraints:\n- Boundary cases: Single-token sequences ($N=1$), prefix-cached offset sequences where query index $i$ starts at offset $K$.\n- Numerical stability: Uses float32 $-\\infty$ or IEEE 754 half-precision minimum finite representation to avoid NaN propagation during Softmax exponentiation.\n- Memory alignment: High-performance kernels (FlashAttention) synthesize this mask on the fly using grid position comparison `thread_idx_j <= thread_idx_i`, bypassing explicit HBM allocation.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Causal Masking",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Computes lower-triangular valid score bounds for 3 tokens.",
    },
    {
      kind: "complex",
      title: "5-Token Sequence Masking",
      inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
      outputDisplay: "[1, 2, 3, 4, 5]",
      input: { data: [1, 2, 3, 4, 5], target: 4 },
      output: "[1, 2, 3, 4, 5]",
      explanation: "Evaluates causal lower-triangular bounds across a 5-token context.",
    },
    {
      kind: "negative",
      title: "Target Out-of-Bounds",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Safely processes sequence boundaries when target index exceeds current length.",
    },
  ],
  code: CAUSALLOWERTRIANGULARMASK_CODE,
  timeComplexity: { best: "O(N^2)", average: "O(N^2)", worst: "O(N^2)" },
  spaceComplexity: "O(N^2)",
  complexityAnalysis: {
    time: "Requires quadratic O(N^2) evaluation across all query-key token pairs in standard dense attention, or O(1) per thread block in fused tile kernels.",
    space:
      "O(N^2) for explicit mask matrix storage, or O(1) auxiliary memory when computed implicitly in SRAM/registers.",
  },
  topicGuide: {
    overview:
      "Causal Lower-Triangular Masking is a cornerstone of autoregressive Transformer architecture. It guarantees that during both prefill and generation phases, predictions for token $i$ depend exclusively on tokens $1 \\dots i$. In modern deep learning engines like vLLM, FlashAttention, and PyTorch SDPA, causal masking is implemented via mathematical bounds, avoiding memory bandwidth bottlenecks by fusing mask checking directly into CUDA warp loops.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "The causal attention mechanism modifies raw dot-product logits $S = Q K^T / \\sqrt{d_k}$ by adding an additive mask matrix $M$: $A = \\text{Softmax}(S + M) V$. The mask entries are defined as $M_{ij} = 0.0$ if $j \\le i$ and $M_{ij} = -\\infty$ if $j > i$. During exponentiation, $\\exp(S_{ij} - \\infty) = 0$, driving the attention probability strictly to zero for future tokens.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Materializing explicit $N \\times N$ floating-point mask matrices in GPU High Bandwidth Memory (HBM) consumes immense memory bandwidth ($O(N^2)$ bytes per layer). Modern GPU hardware kernels (FlashAttention-2/3, Triton) eliminate explicit mask tensors entirely. Kernels load tiles of $Q$ and $K$ into SRAM and apply conditional bounds (`if col_idx > row_idx`) directly in GPU registers, achieving 100% compute bound throughput.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "In batch inference with variable prompt lengths, causal masks are combined with padding masks or prefix cache block offsets (PagedAttention). For KV cache reuse, the effective key sequence length $L_K$ often exceeds the query length $L_Q$, requiring offset adjustments: $j \\le i + \\text{kv\\_offset}$.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "In FP16 precision, numerical $-\\infty$ must be represented carefully (e.g., `-65504.0` or float32 `1e-9` scale factors) to avoid IEEE 754 NaN overflows during softmax reduction. Out-of-bounds array access is guarded by warp lane predicates during parallel grid dispatch.",
      },
    ],
    keyTerms: [
      {
        term: "Causal Mask",
        definition:
          "A lower-triangular additive mask enforcing non-lookahead constraints in sequence modeling.",
      },
      {
        term: "Implicit Mask Tiling",
        definition:
          "A CUDA/Triton optimization technique evaluating $j \\le i$ on-the-fly inside SRAM without DRAM allocations.",
      },
      {
        term: "Autoregressive Decoding",
        definition:
          "Sequential token generation where each token relies on past tokens generated in prior iterations.",
      },
      {
        term: "Prefix Cache Offset",
        definition:
          "The index offset added to key positions when attending over pre-computed KV cache history.",
      },
    ],
  },
  trivia: CAUSALLOWERTRIANGULARMASK_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_CAUSALLOWERTRIANGULARMASK_INPUT,
  generateSteps: generateCausalLowerTriangularMaskSteps,
};
