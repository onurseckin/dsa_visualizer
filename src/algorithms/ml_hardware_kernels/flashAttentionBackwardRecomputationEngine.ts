import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashAttentionBackwardRecomputationEngineInput {
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_CODE = `
import math

def flash_attention_backward_recompute(
    Q: list[list[float]],     # Shape [N, d]
    K: list[list[float]],     # Shape [N, d]
    V: list[list[float]],     # Shape [N, d]
    O: list[list[float]],     # Forward output [N, d]
    dO: list[list[float]],    # Output gradient [N, d]
    L: list[float],           # Forward log-sum-exp vector L_i = m_i + ln(l_i) [N]
    scale: float = 1.0
) -> tuple[list[list[float]], list[list[float]], list[list[float]]]:
    """
    Simulates FlashAttention backward pass with on-the-fly attention score recomputation.
    Recomputes P_ij = exp(Q_i @ K_j.T * scale - L_i) directly in SRAM registers
    to compute gradients dQ, dK, dV without storing N x N attention matrix in HBM.
    """
    N = len(Q)
    d = len(Q[0])
    
    dQ = [[0.0] * d for _ in range(N)]
    dK = [[0.0] * d for _ in range(N)]
    dV = [[0.0] * d for _ in range(N)]

    # Compute D_i scalar gradient term D_i = rowsum(dO_i * O_i)
    D = [sum(do * o for do, o in zip(dO[i], O[i])) for i in range(N)]

    # Recompute attention probabilities P_ij on-the-fly and compute gradients
    for i in range(N):
        for j in range(N):
            # 1. Recompute score logit and probability directly in SRAM registers
            s_ij = sum(q * k for q, k in zip(Q[i], K[j])) * scale
            p_ij = math.exp(s_ij - L[i])

            # 2. Gradient dV_j += P_ij * dO_i
            for col in range(d):
                dV[j][col] += p_ij * dO[i][col]

            # 3. Gradient dP_ij = dO_i @ V_j.T
            dp_ij = sum(do * v for do, v in zip(dO[i], V[j]))
            
            # 4. Gradient dS_ij = P_ij * (dP_ij - D_i)
            ds_ij = p_ij * (dp_ij - D[i])

            # 5. Accumulate dQ_i and dK_j
            for col in range(d):
                dQ[i][col] += scale * ds_ij * K[j][col]
                dK[j][col] += scale * ds_ij * Q[i][col]

    return dQ, dK, dV
`;

export const DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT: flashAttentionBackwardRecomputationEngineInput =
  {
    data: [1, 2, 3, 4],
  };

export const generateFLASHATTENTIONBACKWARDRECOMPUTATIONENGINESteps = (
  input: flashAttentionBackwardRecomputationEngineInput,
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
          recomputation: "true",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize FlashAttention Backward Recomputation Engine",
    "Setting up backward pass: reading saved log-sum-exp vector L_i to recompute P_ij on-the-fly.",
    { N: arrayData.length },
  );

  arrayData.forEach((val: number, idx: number) => {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`recompute=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      28,
      `Recompute tile P_${idx} (val=${val}): P_ij = exp(Q_i @ K_j.T - L_i)`,
      `Recomputing attention probabilities in SRAM registers without DRAM activation memory reads.`,
      { sampleIdx: idx, val },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    47,
    "Execution Complete",
    "Successfully computed exact gradients dQ, dK, dV via on-the-fly SRAM recomputation.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  distractors: ["p_ij = math.exp(s_ij)", "ds_ij = dp_ij - D[i]", "dQ[i][col] = ds_ij * V[j][col]"],
  hints: [
    { line: 24, hint: "Compute scalar D_i = sum(dO_i * O_i) for Softmax backward pass." },
    { line: 30, hint: "Recompute attention probability P_ij = exp(S_ij - L_i) in registers." },
    { line: 38, hint: "Compute Softmax logit gradient dS_ij = P_ij * (dP_ij - D_i)." },
  ],
  lineExplanations: {
    1: "Defines FlashAttention backward recomputation engine entry point.",
    24: "Computes Softmax backward row scalar D_i = sum(dO_i * O_i).",
    30: "Recomputes exact Softmax probability P_ij = exp(S_ij - L_i) in SRAM registers.",
    38: "Calculates logit gradient dS_ij = P_ij * (dP_ij - D_i).",
    42: "Accumulates gradients dQ_i and dK_j via tensor products.",
    47: "Returns calculated gradient tensors dQ, dK, dV.",
  },
};

export const flashAttentionBackwardRecomputationEngine: AlgorithmDefinition<flashAttentionBackwardRecomputationEngineInput> =
  {
    id: "flash-attention-backward-recomputation-engine",
    title: "FlashAttention Backward Recomputation Engine",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_autograd_dags"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 9,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "In standard PyTorch autograd, training LLMs requires saving all intermediate activations—including the $N \\times N$ attention weight matrix $P = \\text{Softmax}(Q K^T / \\sqrt{d})$—in GPU HBM during the forward pass to evaluate backward gradients $dQ, dK, dV$.\n\nFlashAttention Backward Recomputation Engine eliminates the $O(N^2)$ activation memory bottleneck. During the forward pass, it saves ONLY the $O(N)$ log-sum-exp vector $L_i = m_i + \\ln \\ell_i$. During the backward pass, tiles of $Q, K, V$ are re-loaded into SRAM, and $P_{ij} = \\exp(Q_i K_j^T / \\sqrt{d} - L_i)$ is **recomputed on-the-fly** directly in GPU registers:\n$$dS_{ij} = P_{ij} (dP_{ij} - D_i), \\quad \\text{where } D_i = \\sum_{c} dO_{i,c} \\cdot O_{i,c}$$\n\nInput Format:\n- data: Sequence indices or block array.\n- target: Head dimension $d$.\n\nOutput Format:\n- Gradient matrices $dQ, dK, dV \\in \\mathbb{R}^{N \\times d}$ computed with zero $O(N^2)$ DRAM activation storage.",
    constraints: ["1 <= N <= 128000", "32 <= d <= 256"],
    examples: [
      {
        kind: "basic",
        title: "Backward Recomputation Pass",
        inputDisplay: "Q, K, V, O, dO, L",
        outputDisplay: "Gradients dQ, dK, dV computed via SRAM recomputation",
        input: { data: [1, 2, 3, 4] },
        output: "Gradients dQ, dK, dV computed",
        explanation:
          "Recomputes P_ij in registers to evaluate gradients without N^2 DRAM activation memory.",
      },
      {
        kind: "complex",
        title: "4-Tile Gradient Accumulation",
        inputDisplay: "data = [1, 2, 3, 4]",
        outputDisplay: "Exact Gradient Accumulation",
        input: { data: [1, 2, 3, 4] },
        output: "Exact Gradient Accumulation",
        explanation: "Evaluates gradient accumulation across 4 sequence blocks.",
      },
      {
        kind: "negative",
        title: "Single Tile Check",
        inputDisplay: "data = [1]",
        outputDisplay: "Single Tile Recomputed",
        input: { data: [1] },
        output: "Single Tile Recomputed",
        explanation: "Computes single tile gradients using saved scalar L_i.",
      },
    ],
    code: FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_CODE,
    timeComplexity: {
      best: "O(N^2 \\cdot d)",
      average: "O(N^2 \\cdot d)",
      worst: "O(N^2 \\cdot d)",
    },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Requires $O(N^2 \\cdot d)$ FLOPs for recomputing attention scores and gradients in SRAM.",
      space: "Saves $O(N^2)$ HBM memory by storing only $O(N)$ log-sum-exp vector $L_i$.",
    },
    topicGuide: {
      overview:
        "Backward recomputation is the key to training ultra-long context LLMs (128k+ tokens) on finite GPU memory. Trading cheap FLOPs for expensive DRAM memory reads enables massive batch sizes.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Given output gradient $dO$, value gradient is $dV_j = \\sum_i P_{ij} dO_i$. Softmax gradient: $dP_{ij} = dO_i V_j^T$. Scalar reduction $D_i = \\sum_c dO_{i,c} O_{i,c}$. Score logit gradient $dS_{ij} = P_{ij} (dP_{ij} - D_i)$. Query gradient $dQ_i = \\frac{1}{\\sqrt{d}} \\sum_j dS_{ij} K_j$. Key gradient $dK_j = \\frac{1}{\\sqrt{d}} \\sum_i dS_{ij} Q_i$.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "Recomputation vs Memory Bandwidth: Recomputing $P_{ij}$ in SRAM adds ~15% extra FLOPs, but avoids reading $N \\times N$ floating-point attention matrices from HBM, yielding a net 2.5x speedup for the backward pass.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "The scalar $D_i = \\sum_c dO_{i,c} O_{i,c}$ is pre-computed in a separate fast vector kernel before the main tile loop, allowing $dS_{ij}$ to be computed directly in warp registers.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Dropout masking in backward pass: If dropout is enabled in forward pass, the pseudo-random seed and offset are saved to regenerate identical dropout bitmasks in SRAM during backward recomputation.",
        },
      ],
      keyTerms: [
        {
          term: "Activation Recomputation",
          definition:
            "Re-evaluating forward activation tensors on-the-fly during the backward pass to save memory.",
        },
        {
          term: "Log-Sum-Exp Vector L_i",
          definition:
            "The $O(N)$ scalar vector $L_i = m_i + \\ln \\ell_i$ saved during forward pass for exact Softmax reconstruction.",
        },
        {
          term: "Softmax Backward Derivative",
          definition:
            "The formula $dS_{ij} = P_{ij} (dP_{ij} - \\text{rowsum}(dO_i \\cdot O_i))$ for backpropagating through Softmax.",
        },
        {
          term: "DRAM Memory Wall",
          definition:
            "Performance bottleneck caused by slow HBM read/write bandwidth relative to fast GPU Tensor Cores.",
        },
      ],
    },
    trivia: FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_TRIVIA,
    sources: [],
    defaultInput: DEFAULT_FLASHATTENTIONBACKWARDRECOMPUTATIONENGINE_INPUT,
    generateSteps: generateFLASHATTENTIONBACKWARDRECOMPUTATIONENGINESteps,
  };
