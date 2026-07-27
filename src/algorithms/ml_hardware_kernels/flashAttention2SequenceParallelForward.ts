import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashAttention2SequenceParallelForwardInput {
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const FLASHATTENTION2SEQUENCEPARALLELFORWARD_CODE = `
import math

def flash_attention_2_forward(
    Q: list[list[float]],  # Shape [N, d]
    K: list[list[float]],  # Shape [N, d]
    V: list[list[float]],  # Shape [N, d]
    Br: int = 2,           # Query tile size
    Bc: int = 2,           # Key/Value tile size
    scale: float = 1.0
) -> list[list[float]]:
    """
    Simulates FlashAttention-2 forward pass with sequence parallelism and swapped loop order.
    Outer loop: iterates over Query blocks Q_i (distributed across GPU SMs).
    Inner loop: iterates over Key/Value blocks K_j, V_j.
    Eliminates final division pass by keeping unnormalized output accumulators in registers.
    """
    N = len(Q)
    d = len(Q[0])
    O = [[0.0] * d for _ in range(N)]

    # Outer loop (Parallelized across GPU Thread Blocks / SMs): Query tiles Q_i
    for i in range(0, N, Br):
        Q_block = Q[i : i + Br]
        
        # Local registers for query block i
        m_i = [-float('inf')] * Br
        l_i = [0.0] * Br
        O_i = [[0.0] * d for _ in range(Br)]

        # Inner loop: Key/Value tiles K_j, V_j
        for j in range(0, N, Bc):
            K_block = K[j : j + Bc]
            V_block = V[j : j + Bc]

            for r in range(Br):
                q_vec = Q_block[r]
                scores = [sum(q * k for q, k in zip(q_vec, k_vec)) * scale for k_vec in K_block]
                
                # Online max & log-sum-exp update
                m_curr = max(scores)
                m_new = max(m_i[r], m_curr)
                
                scale_prev = math.exp(m_i[r] - m_new) if m_i[r] != -float('inf') else 0.0
                exp_scores = [math.exp(s - m_new) for s in scores]
                l_new = l_i[r] * scale_prev + sum(exp_scores)
                
                # Rescale running unnormalized output accumulator O_i
                for col in range(d):
                    pv_sum = sum(exp_s * v_vec[col] for exp_s, v_vec in zip(exp_scores, V_block))
                    O_i[r][col] = O_i[r][col] * scale_prev + pv_sum

                m_i[r] = m_new
                l_i[r] = l_new

        # Final normalization per row in SRAM before writing to HBM
        for r in range(Br):
            row_idx = i + r
            for col in range(d):
                O[row_idx][col] = O_i[r][col] / l_i[r]

    return O
`;

export const DEFAULT_FLASHATTENTION2SEQUENCEPARALLELFORWARD_INPUT: flashAttention2SequenceParallelForwardInput =
  {
    data: [1, 2, 3, 4],
  };

export const generateFLASHATTENTION2SEQUENCEPARALLELFORWARDSteps = (
  input: flashAttention2SequenceParallelForwardInput,
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
    "Initialize FlashAttention-2 Sequence Parallel Forward Kernel",
    "Setting up swapped loop structure: outer loop over Query blocks Q_i parallelized across GPU SMs.",
    { N: arrayData.length },
  );

  arrayData.forEach((val: number, idx: number) => {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`sm_block=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      21,
      `Execute SM thread block Q_${idx} (val=${val}): stream K_j, V_j tiles into registers`,
      `Accumulating unnormalized attention products O_i in registers and dividing by log-sum-exp sum l_i once per row.`,
      { blockIdx: idx, val },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    51,
    "Execution Complete",
    "Successfully computed FlashAttention-2 forward pass with maximum GPU SM occupancy.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const FLASHATTENTION2SEQUENCEPARALLELFORWARD_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  distractors: [
    "O_i[r][col] = O_i[r][col] / l_new",
    "for j in range(0, N, Bc): outer loop",
    "scale_prev = math.exp(m_new - m_i[r])",
  ],
  hints: [
    {
      line: 21,
      hint: "Outer loop iterates over Query blocks Q_i, parallelized across GPU thread blocks.",
    },
    { line: 29, hint: "Inner loop streams Key and Value tiles K_j, V_j into SRAM." },
    {
      line: 51,
      hint: "Divide unnormalized register output O_i by l_i exactly once per query row before HBM write.",
    },
  ],
  lineExplanations: {
    1: "Defines FlashAttention-2 sequence parallel forward entry point.",
    21: "Outer loop over Query block index i (parallelized over GPU Streaming Multiprocessors).",
    29: "Inner loop over Key/Value block index j.",
    38: "Rescales intermediate register accumulators using online max scale_prev.",
    51: "Divides accumulated output vector by log-sum-exp denominator l_i once at end of row loop.",
  },
};

export const flashAttention2SequenceParallelForward: AlgorithmDefinition<flashAttention2SequenceParallelForwardInput> =
  {
    id: "flash-attention-2-sequence-parallel-forward",
    title: "FlashAttention-2 Sequence Parallel Forward Kernel",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_attention_geometry"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 9,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "FlashAttention-2 (Dao, 2023) improves upon FlashAttention-1 by achieving up to 220 TFLOPS/A100 (73% theoretical peak FLOPs, vs 30-50% in FA1).\n\nKey algorithmic innovations:\n1. **Swapped Loop Order**: FA-1 looped over $K, V$ blocks in the outer loop and $Q$ blocks in the inner loop. FA-2 swaps the loops: outer loop over Query blocks $Q_i$, inner loop over Key/Value blocks $K_j, V_j$. This keeps $Q_i$ and output accumulator $O_i$ in registers, avoiding repeated rescale operations and performing final division by log-sum-exp $\\ell_i$ ONCE per row.\n2. **Sequence Dimension Parallelism**: Distributes query blocks $Q_i$ across independent GPU Thread Blocks (SMs). Even for single batch size or single head, FA-2 achieves full GPU occupancy by parallelizing over the sequence length $N$.\n3. **Warp Partitioning**: Optimizes warp layouts within thread blocks to minimize inter-warp communication.\n\nInput Format:\n- data: Query sequence block indices or array.\n- target: Head dimension $d$.\n\nOutput Format:\n- Attention output matrix $O \\in \\mathbb{R}^{N \\times d}$ with 73% peak A100 GPU compute efficiency.",
    constraints: ["1 <= N <= 128000", "32 <= d <= 256"],
    examples: [
      {
        kind: "basic",
        title: "FlashAttention-2 Forward Pass",
        inputDisplay: "N = 4, d = 2, Br = 2, Bc = 2",
        outputDisplay: "Output O (73% GPU TFLOPS)",
        input: { data: [1, 2, 3, 4] },
        output: "Output O (73% GPU TFLOPS)",
        explanation:
          "Computes exact attention with swapped loop order and sequence parallel thread blocks.",
      },
      {
        kind: "complex",
        title: "4-Query Block Parallel Test",
        inputDisplay: "data = [1, 2, 3, 4]",
        outputDisplay: "Max SM Occupancy",
        input: { data: [1, 2, 3, 4] },
        output: "Max SM Occupancy",
        explanation: "Evaluates parallel thread block dispatch across 4 query sequence tiles.",
      },
      {
        kind: "negative",
        title: "Single Block Fallback",
        inputDisplay: "data = [1]",
        outputDisplay: "Single Block Parallelized",
        input: { data: [1] },
        output: "Single Block Parallelized",
        explanation: "Processes single query block with unnormalized register accumulators.",
      },
    ],
    code: FLASHATTENTION2SEQUENCEPARALLELFORWARD_CODE,
    timeComplexity: {
      best: "O(N^2 \\cdot d)",
      average: "O(N^2 \\cdot d)",
      worst: "O(N^2 \\cdot d)",
    },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Requires $O(N^2 \\cdot d)$ FLOPs while achieving 220 TFLOPS on A100 GPUs through reduced non-GEMM instruction overhead.",
      space: "Allocates $O(N)$ space for storing log-sum-exp values for the backward pass.",
    },
    topicGuide: {
      overview:
        "FlashAttention-2 is the default attention engine in PyTorch 2.x (`torch.nn.functional.scaled_dot_product_attention`) and HuggingFace Transformers. Its loop swapping and sequence parallelism provide dramatic speedups for long-context LLMs.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "For query block $Q_i$, initialize unnormalized output $\\hat{O}_i^{(0)} = 0$, max $m_i^{(0)} = -\\infty$, sum $\\ell_i^{(0)} = 0$. For $j=1 \\dots T_c$, compute $S_{ij}^{(j)} = Q_i K_j^T / \\sqrt{d}$, $m_i^{(j)} = \\max(m_i^{(j-1)}, \\text{rowmax}(S_{ij}^{(j)}))$, $\\hat{O}_i^{(j)} = \\hat{O}_i^{(j-1)} e^{m_i^{(j-1)} - m_i^{(j)}} + e^{S_{ij}^{(j)} - m_i^{(j)}} V_j$. Final output $O_i = \\hat{O}_i^{(T_c)} / \\ell_i^{(T_c)}$.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "Non-matmul FLOP reduction: FA-1 performed division by $\\ell_i$ on every step in the inner loop. FA-2 maintains unnormalized $\\hat{O}_i$ in registers throughout the inner loop over $K, V$ blocks, performing division ONCE at the end. This reduces non-GEMM instructions by 5x.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "Parallelizing over sequence length: GPU grid dimensions are `(N / Br, batch_size, num_heads)`. This guarantees that even for small batch sizes (e.g. batch size 1 during interactive chat decoding), all 108 SMs on an A100 GPU remain fully occupied.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Causal masking optimization: In causal mode, blocks $(i, j)$ where $j > i$ are skipped entirely, halving total FLOPs ($N^2 / 2$). Blocks along the diagonal $j = i$ apply causal mask bounds.",
        },
      ],
      keyTerms: [
        {
          term: "FlashAttention-2",
          definition:
            "An upgraded IO-aware attention kernel featuring swapped loop order and sequence parallelism.",
        },
        {
          term: "Loop Swapping",
          definition:
            "Reordering loops so Query blocks are in the outer loop, keeping unnormalized output accumulators in registers.",
        },
        {
          term: "Sequence Parallelism",
          definition:
            "Parallelizing query sequence blocks across GPU Streaming Multiprocessors (SMs).",
        },
        {
          term: "Unnormalized Output Accumulator",
          definition:
            "Storing $\\hat{O}_i$ without division until all $K,V$ blocks have been processed.",
        },
      ],
    },
    trivia: FLASHATTENTION2SEQUENCEPARALLELFORWARD_TRIVIA,
    sources: [],
    defaultInput: DEFAULT_FLASHATTENTION2SEQUENCEPARALLELFORWARD_INPUT,
    generateSteps: generateFLASHATTENTION2SEQUENCEPARALLELFORWARDSteps,
  };
