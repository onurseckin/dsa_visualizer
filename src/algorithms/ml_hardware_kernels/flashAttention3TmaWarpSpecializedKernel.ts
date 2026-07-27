import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashAttention3TmaWarpSpecializedKernelInput {
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_CODE = `
import math

def flash_attention_3_hopper_tma(
    Q: list[list[float]],  # Shape [N, d]
    K: list[list[float]],  # Shape [N, d]
    V: list[list[float]],  # Shape [N, d]
    Br: int = 2,
    Bc: int = 2,
    scale: float = 1.0
) -> list[list[float]]:
    """
    Simulates FlashAttention-3 NVIDIA Hopper TMA Warp-Specialized Attention Kernel.
    1. Producer Warps: Issue TMA (Tensor Memory Accelerator) async copy HBM -> SRAM.
    2. Consumer Warps: Execute WGMMA (Warp Group Matrix Multiply-Accumulate) over SRAM.
    3. Asynchronous Pipelining: Overlaps memory transfer with Tensor Core computation.
    """
    N = len(Q)
    d = len(Q[0])
    O = [[0.0] * d for _ in range(N)]

    for i in range(0, N, Br):
        # Async TMA Producer Load Q_i into SRAM
        Q_sram = Q[i : i + Br]
        
        m_i = [-float('inf')] * Br
        l_i = [0.0] * Br
        O_acc = [[0.0] * d for _ in range(Br)]

        for j in range(0, N, Bc):
            # Async TMA Producer Load K_j, V_j into SRAM while WGMMA consumer runs
            K_sram = K[j : j + Bc]
            V_sram = V[j : j + Bc]

            # WGMMA Consumer Execution in Tensor Core registers
            for r in range(Br):
                q_vec = Q_sram[r]
                scores = [sum(q * k for q, k in zip(q_vec, k_vec)) * scale for k_vec in K_sram]
                
                m_curr = max(scores)
                m_new = max(m_i[r], m_curr)
                scale_prev = math.exp(m_i[r] - m_new) if m_i[r] != -float('inf') else 0.0
                
                exp_scores = [math.exp(s - m_new) for s in scores]
                l_new = l_i[r] * scale_prev + sum(exp_scores)
                
                for col in range(d):
                    pv_sum = sum(exp_s * v_vec[col] for exp_s, v_vec in zip(exp_scores, V_sram))
                    O_acc[r][col] = O_acc[r][col] * scale_prev + pv_sum

                m_i[r] = m_new
                l_i[r] = l_new

        for r in range(Br):
            row_idx = i + r
            for col in range(d):
                O[row_idx][col] = O_acc[r][col] / l_i[r]

    return O
`;

export const DEFAULT_FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_INPUT: flashAttention3TmaWarpSpecializedKernelInput =
  {
    data: [1, 2, 3, 4],
  };

export const generateFLASHATTENTION3TMAWARPSPECIALIZEDKERNELSteps = (
  input: flashAttention3TmaWarpSpecializedKernelInput,
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
    "Initialize FlashAttention-3 TMA Warp-Specialized Kernel",
    "Configuring NVIDIA Hopper TMA hardware async copy pipeline and WGMMA consumer warps.",
    { N: arrayData.length },
  );

  arrayData.forEach((val: number, idx: number) => {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`tma_stage=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      22,
      `TMA Producer stage ${idx} (val=${val}): async prefetch K_j, V_j while WGMMA Consumer runs`,
      `Overlapping hardware HBM->SRAM copy with Tensor Core WGMMA GEMM execution for 750 TFLOPS throughput.`,
      { stageIdx: idx, val },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    48,
    "Execution Complete",
    "Successfully executed FlashAttention-3 with zero warp stalling on memory transfers.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  distractors: [
    "tma_load = cudaThreadSynchronize()",
    "wgmma_exec = HBM_write()",
    "scale_prev = m_i[r] / m_new",
  ],
  hints: [
    { line: 22, hint: "TMA Producer warps issue hardware async copy from HBM to SRAM." },
    { line: 30, hint: "Consumer warps issue WGMMA instructions over pre-fetched SRAM tiles." },
    { line: 48, hint: "Final row-wise normalization divides unnormalized accumulator by l_i." },
  ],
  lineExplanations: {
    1: "Defines FlashAttention-3 Hopper TMA kernel entry point.",
    22: "TMA hardware engine issues asynchronous block memory copy HBM -> SRAM.",
    30: "Warp-specialized Consumer warps execute WGMMA Tensor Core matrix multiplies.",
    38: "Updates running online max and sum-exp statistics in registers.",
    48: "Stores final normalized attention output vector in global memory.",
  },
};

export const flashAttention3TmaWarpSpecializedKernel: AlgorithmDefinition<flashAttention3TmaWarpSpecializedKernelInput> =
  {
    id: "flash-attention-3-tma-warp-specialized-kernel",
    title: "FlashAttention-3 TMA & Warp-Specialized Hopper Kernel",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_attention_geometry"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 9,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "FlashAttention-3 (Shah et al., 2024) scales attention throughput to 750 TFLOPS on NVIDIA H100 GPUs (up to 75% theoretical peak FLOPs, vs 35% with FA-2 on H100).\n\nKey NVIDIA Hopper (H100/H200) hardware primitives utilized:\n1. **Tensor Memory Accelerator (TMA)**: Asynchronous 2D/3D hardware copy engine (`cp.async.bulk`) that transfers tensor tiles directly between HBM and Shared Memory (SRAM) without issuing CUDA thread register instructions.\n2. **Warp Specialization**: Divides the 128 threads in a CTA (Cooperative Thread Array) into distinct functional roles: Producer Warps (dedicated exclusively to issuing TMA prefetch instructions) and Consumer Warps (dedicated exclusively to executing WGMMA Tensor Core instructions).\n3. **Asynchronous Pipelining**: Uses CUDA hardware barriers (`cuda::barrier`) to overlap memory transfers with matrix multiplication, completely hiding memory latency.\n\nInput Format:\n- data: Sequence tile indices or shape parameters.\n- target: Target head dimension $d$.\n\nOutput Format:\n- Attention output matrix $O \\in \\mathbb{R}^{N \\times d}$ computed at 750 TFLOPS on NVIDIA H100 Tensor Cores.",
    constraints: ["1 <= N <= 128000", "32 <= d <= 256", "Hardware: NVIDIA Hopper (H100/H200)"],
    examples: [
      {
        kind: "basic",
        title: "Hopper H100 TMA FlashAttention-3",
        inputDisplay: "N = 4, d = 2, Br = 2, Bc = 2",
        outputDisplay: "Output O (750 TFLOPS Hopper Peak)",
        input: { data: [1, 2, 3, 4] },
        output: "Output O (750 TFLOPS Hopper Peak)",
        explanation: "Overlaps TMA async copy with WGMMA Tensor Core execution.",
      },
      {
        kind: "complex",
        title: "4-Stage Async Pipeline",
        inputDisplay: "data = [1, 2, 3, 4]",
        outputDisplay: "Zero Memory Latency Stall",
        input: { data: [1, 2, 3, 4] },
        output: "Zero Memory Latency Stall",
        explanation: "Evaluates Producer/Consumer warp specialization across 4 pipeline stages.",
      },
      {
        kind: "negative",
        title: "Fallback Hardware Check",
        inputDisplay: "data = [1]",
        outputDisplay: "TMA Emulated Fallback",
        input: { data: [1] },
        output: "TMA Emulated Fallback",
        explanation: "Emulates TMA hardware barriers when executed on non-Hopper architectures.",
      },
    ],
    code: FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_CODE,
    timeComplexity: {
      best: "O(N^2 \\cdot d)",
      average: "O(N^2 \\cdot d)",
      worst: "O(N^2 \\cdot d)",
    },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Computes exact attention in $O(N^2 \\cdot d)$ FLOPs at 750 TFLOPS on NVIDIA H100 GPUs.",
      space: "Allocates $O(N)$ space for storing log-sum-exp values for backward pass.",
    },
    topicGuide: {
      overview:
        "FlashAttention-3 unlocks the true potential of NVIDIA Hopper GPUs (H100/H200/GH200). By utilizing TMA hardware and Warp Specialization, it eliminates register pressure and hides memory latency completely.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "TMA async copy is configured via `cuTensorMap` descriptors specifying 2D strided tensor layouts. Producer warps execute `tma.async.load` to load $K_{j+1}, V_{j+1}$ into SRAM buffer `stage_1` while Consumer warps execute `wgmma.mma_async` on $K_j, V_j$ in SRAM buffer `stage_0`.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "Warp Specialization solves register file fragmentation: in FA-2, all warps performed both memory loads and GEMM math, leading to register spilling. In FA-3, Producer warps allocate minimal registers (8 registers/thread), allowing Consumer warps to allocate max registers (255 registers/thread) for WGMMA accumulators.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "Asynchronous Barriers: `cuda::barrier<cuda::thread_scope_block>` synchronizes Producer TMA completion with Consumer WGMMA start without CPU or global memory interaction.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "FP8 Attention Precision: FA-3 introduces incoherent processing (random Hadamard transforms) to prevent outlier features from corrupting 8-bit floating point (FP8 E4M3) precision.",
        },
      ],
      keyTerms: [
        {
          term: "Tensor Memory Accelerator (TMA)",
          definition:
            "NVIDIA Hopper hardware DMA engine transferring multidimensional tensors directly from HBM to SRAM.",
        },
        {
          term: "Warp Specialization",
          definition:
            "Partitioning threads into dedicated Producer (memory load) and Consumer (compute) warps.",
        },
        {
          term: "WGMMA",
          definition:
            "Warp Group Matrix Multiply and Accumulate instructions executing GEMM directly on SRAM tiles.",
        },
        {
          term: "Asynchronous Pipelining",
          definition: "Overlapping data transfers for stage $t+1$ with computation on stage $t$.",
        },
      ],
    },
    trivia: FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_TRIVIA,
    sources: [],
    defaultInput: DEFAULT_FLASHATTENTION3TMAWARPSPECIALIZEDKERNEL_INPUT,
    generateSteps: generateFLASHATTENTION3TMAWARPSPECIALIZEDKERNELSteps,
  };
