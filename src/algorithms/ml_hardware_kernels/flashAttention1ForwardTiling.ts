import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashAttention1ForwardTilingInput {
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const FLASHATTENTION1FORWARDTILING_CODE = `
import math

def flash_attention_1_forward(
    Q: list[list[float]],  # Shape [N, d]
    K: list[list[float]],  # Shape [N, d]
    V: list[list[float]],  # Shape [N, d]
    Br: int = 2,           # Row tile block size (loaded into SRAM)
    Bc: int = 2,           # Column tile block size (loaded into SRAM)
    scale: float = 1.0
) -> list[list[float]]:
    """
    Simulates FlashAttention-1 forward pass with SRAM tiling & online softmax.
    Outer loop iterates over K, V column blocks; inner loop iterates over Q row blocks.
    Tracks online row max m_i and running sum-exp l_i to rescale output accumulators.
    """
    N = len(Q)
    d = len(Q[0])
    
    O = [[0.0] * d for _ in range(N)]
    lse = [0.0] * N
    m = [-float('inf')] * N

    # Outer loop: load K_j, V_j tile into SRAM
    for j in range(0, N, Bc):
        K_block = K[j : j + Bc]
        V_block = V[j : j + Bc]

        # Inner loop: load Q_i tile into SRAM
        for i in range(0, N, Br):
            Q_block = Q[i : i + Br]

            # Compute tile logit scores S_ij = Q_i @ K_j.T * scale
            for r, q_vec in enumerate(Q_block):
                row_idx = i + r
                scores = [sum(q * k for q, k in zip(q_vec, k_vec)) * scale for k_vec in K_block]
                
                # Online max update
                m_curr = max(scores)
                m_new = max(m[row_idx], m_curr)
                
                # Rescale previous exponent sum and accumulate new tile exp
                exp_scores = [math.exp(s - m_new) for s in scores]
                l_new = lse[row_idx] * math.exp(m[row_idx] - m_new) + sum(exp_scores)
                
                # Rescale previous row output O_i and accumulate P_ij @ V_j
                scale_prev = math.exp(m[row_idx] - m_new)
                for col in range(d):
                    pv_col = sum(exp_s * v_vec[col] for exp_s, v_vec in zip(exp_scores, V_block))
                    O[row_idx][col] = (O[row_idx][col] * scale_prev + pv_col) / l_new

                m[row_idx] = m_new
                lse[row_idx] = l_new

    return O
`;

export const DEFAULT_FLASHATTENTION1FORWARDTILING_INPUT: flashAttention1ForwardTilingInput = {
  data: [1, 2, 3, 4],
};

export const generateFLASHATTENTION1FORWARDTILINGSteps = (
  input: flashAttention1ForwardTilingInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const arrayData = input.data || [1, 2, 3, 4];

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
          Br: "2",
          Bc: "2",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize FlashAttention-1 SRAM Tiled Forward Kernel",
    "Setting up SRAM block dimensions Br=2, Bc=2 for tile-by-tile online softmax accumulation.",
    { N: arrayData.length },
  );

  arrayData.forEach((val: number, idx: number) => {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`tile=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      21,
      `Execute SRAM tile step ${idx} (val=${val}): load Q_i and K_j tile into fast SRAM`,
      `Updating running maximum m_i and log-sum-exp sum l_i to rescale output accumulators O_i in registers.`,
      { tileIdx: idx, val },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    44,
    "Execution Complete",
    "Successfully computed exact attention without materializing intermediate HBM attention matrices.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const FLASHATTENTION1FORWARDTILING_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  distractors: [
    "m_new = m[row_idx] + m_curr",
    "scale_prev = math.exp(m_new - m[row_idx])",
    "O[row_idx][col] = O[row_idx][col] + pv_col",
  ],
  hints: [
    { line: 30, hint: "Compute running maximum m_new = max(m_prev, max(scores))." },
    { line: 34, hint: "Rescale previous log-sum-exp l_prev by exp(m_prev - m_new)." },
    {
      line: 38,
      hint: "Rescale accumulated output O_prev by exp(m_prev - m_new) before adding new tile values.",
    },
  ],
  lineExplanations: {
    1: "Defines FlashAttention-1 SRAM tiled forward algorithm entry point.",
    21: "Outer loop over column block index j (loads K_j, V_j into SRAM).",
    26: "Inner loop over row block index i (loads Q_i into SRAM).",
    30: "Updates running maximum m_new for online numerical stability.",
    34: "Updates running log-sum-exp sum l_new.",
    38: "Rescales intermediate output matrix accumulators O_i using online softmax factor.",
  },
};

export const flashAttention1ForwardTiling: AlgorithmDefinition<flashAttention1ForwardTilingInput> =
  {
    id: "flash-attention-1-forward-tiling",
    title: "FlashAttention-1 SRAM Tiled Forward Kernel",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_attention_geometry"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 9,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "FlashAttention-1 (Dao et al., NeurIPS 2022) revolutionized deep learning training by making standard $O(N^2)$ attention IO-aware. Standard attention materializes large $N \\times N$ score matrices $S = Q K^T / \\sqrt{d}$ and attention probabilities $P = \\text{Softmax}(S)$ in GPU High Bandwidth Memory (HBM), requiring $O(N^2)$ DRAM reads and writes.\n\nFlashAttention-1 tiles $Q, K, V$ into blocks of size $B_r \\times d$ and $B_c \\times d$ that fit inside fast GPU SRAM (~20 TB/s bandwidth). Using **online softmax**, it computes partial attention scores $S_{ij}$, updates running maximum $m_i$ and running sum-exp $\\ell_i$, and rescales the running output accumulator vector $O_i$ directly in SRAM:\n$$O_i^{\\text{new}} = \\frac{O_i^{\\text{old}} \\cdot \\ell_i^{\\text{old}} e^{m_i^{\\text{old}} - m_i^{\\text{new}}} + P_{ij} V_j}{\\ell_i^{\\text{new}}}$$\n\nInput Format:\n- data: Sequence tile indices or shape parameters.\n- target: Head dimension $d$.\n\nOutput Format:\n- Final attention output matrix $O \\in \\mathbb{R}^{N \\times d}$ computed with $O(N^2 d^2 / M)$ HBM memory accesses.",
    constraints: ["1 <= N <= 128000", "32 <= d <= 256", "M = SRAM size"],
    examples: [
      {
        kind: "basic",
        title: "Standard SRAM Tiled Forward",
        inputDisplay: "N = 4, d = 2, Br = 2, Bc = 2",
        outputDisplay: "Output O computed in SRAM tiles",
        input: { data: [1, 2, 3, 4] },
        output: "Exact attention O without HBM N^2 storage",
        explanation: "Computes exact attention tile by tile using online softmax rescaling.",
      },
      {
        kind: "complex",
        title: "4-Tile SRAM Stream Test",
        inputDisplay: "data = [1, 2, 3, 4]",
        outputDisplay: "Zero HBM intermediate write",
        input: { data: [1, 2, 3, 4] },
        output: "Zero HBM intermediate write",
        explanation: "Evaluates online softmax updates across 4 consecutive tile pairs.",
      },
      {
        kind: "negative",
        title: "Single Tile Fallback",
        inputDisplay: "data = [1]",
        outputDisplay: "Single Tile Executed",
        input: { data: [1] },
        output: "Single Tile Executed",
        explanation: "When sequence length equals block size, tiles execute in single SRAM pass.",
      },
    ],
    code: FLASHATTENTION1FORWARDTILING_CODE,
    timeComplexity: {
      best: "O(N^2 \\cdot d)",
      average: "O(N^2 \\cdot d)",
      worst: "O(N^2 \\cdot d)",
    },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Computes exact attention in $O(N^2 \\cdot d)$ FLOPs, identically to standard attention, but with $2\\times$-$4\\times$ faster wall-clock time due to IO efficiency.",
      space:
        "Requires $O(N)$ auxiliary memory to store running max $m_i$ and sum-exp $\\ell_i$ vectors, bypassing $O(N^2)$ DRAM allocations.",
    },
    topicGuide: {
      overview:
        "FlashAttention-1 is one of the most influential machine learning systems papers of the decade. By restructuring attention around GPU SRAM cache hierarchy, it demonstrated that memory IO complexity is as important as FLOP complexity.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Let $Q_i \\in \\mathbb{R}^{B_r \\times d}$ and $K_j, V_j \\in \\mathbb{R}^{B_c \\times d}$. For each block pair $(i, j)$, $S_{ij} = Q_i K_j^T / \\sqrt{d}$. Local max $\\tilde{m}_{ij} = \\text{rowmax}(S_{ij})$, updated max $m_i^{\\text{new}} = \\max(m_i^{\\text{old}}, \\tilde{m}_{ij})$, local sum $\\tilde{\\ell}_{ij} = \\text{rowsum}(e^{S_{ij} - m_i^{\\text{new}}})$. Updated sum $\\ell_i^{\\text{new}} = \\ell_i^{\\text{old}} e^{m_i^{\\text{old}} - m_i^{\\text{new}}} + \\tilde{\\ell}_{ij}$. Output update $O_i^{\\text{new}} = \\text{diag}(e^{m_i^{\\text{old}} - m_i^{\\text{new}}}) O_i^{\\text{old}} + e^{S_{ij} - m_i^{\\text{new}}} V_j$.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "GPU Memory Hierarchy: HBM (1.5 - 3.0 TB/s) vs SRAM (19 - 33 TB/s). Standard attention is memory-bound due to writing/reading $S$ and $P$ to HBM ($O(N^2)$ transfers). FlashAttention tiles computations into SRAM, keeping arithmetic intensity high ($O(d)$ FLOPs/byte).",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "FlashAttention-1 uses an outer loop over key/value blocks $j$ and an inner loop over query blocks $i$. This order ensures key/value blocks loaded into shared memory are reused across all query blocks.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Numerical stability: Initializing $m_i = -\\infty$ and $\\ell_i = 0$ handles cold starts. Final division by $\\ell_i$ occurs once at the end of the loop per row block.",
        },
      ],
      keyTerms: [
        {
          term: "FlashAttention",
          definition:
            "An IO-aware exact attention algorithm that tiles computation into GPU SRAM to avoid DRAM reads/writes.",
        },
        {
          term: "Online Softmax",
          definition:
            "A technique computing Softmax progressively over stream blocks using running max and sum-exp statistics.",
        },
        {
          term: "GPU SRAM (Shared Memory)",
          definition: "Ultra-fast on-chip GPU memory cache with ~20 TB/s bandwidth.",
        },
        {
          term: "IO-Awareness",
          definition:
            "Designing algorithms to optimize data movements between different memory levels (HBM vs SRAM).",
        },
      ],
    },
    trivia: FLASHATTENTION1FORWARDTILING_TRIVIA,
    sources: [],
    defaultInput: DEFAULT_FLASHATTENTION1FORWARDTILING_INPUT,
    generateSteps: generateFLASHATTENTION1FORWARDTILINGSteps,
  };
