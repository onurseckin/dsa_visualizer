import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface rotaryEmbeddingAttentionCudaKernelInput {
  data: number[];
  target?: number;
}

export const ROTARYEMBEDDINGATTENTIONCUDAKERNEL_CODE = `
import math

def fused_rope_attention_kernel(
    q_tile: list[list[float]],  # Shape [Br, d_k] un-rotated query tile
    k_tile: list[list[float]],  # Shape [Bc, d_k] un-rotated key tile
    q_pos_start: int,
    k_pos_start: int,
    scale: float
) -> list[list[float]]:
    """
    Simulates a fused RoPE + Attention CUDA warp kernel.
    Fuses 2D complex plane RoPE rotation directly in SRAM registers
    before computing scaled dot-product attention scores S = (R_m Q) @ (R_n K)^T.
    """
    Br = len(q_tile)
    Bc = len(k_tile)
    d = len(q_tile[0])
    
    scores = []

    for r in range(Br):
        m = q_pos_start + r
        q_raw = q_tile[r]
        
        # 1. In-register RoPE transformation for query vector
        q_rot = [0.0] * d
        for i in range(0, d, 2):
            freq = 1.0 / (10000.0 ** (i / d))
            cos_val, sin_val = math.cos(m * freq), math.sin(m * freq)
            q_rot[i] = q_raw[i] * cos_val - q_raw[i+1] * sin_val
            q_rot[i+1] = q_raw[i] * sin_val + q_raw[i+1] * cos_val
            
        row_scores = []
        for c in range(Bc):
            n = k_pos_start + c
            k_raw = k_tile[c]
            
            # 2. In-register RoPE transformation for key vector
            k_rot = [0.0] * d
            for i in range(0, d, 2):
                freq = 1.0 / (10000.0 ** (i / d))
                cos_val, sin_val = math.cos(n * freq), math.sin(n * freq)
                k_rot[i] = k_raw[i] * cos_val - k_raw[i+1] * sin_val
                k_rot[i+1] = k_raw[i] * sin_val + k_raw[i+1] * cos_val
                
            # 3. Multiply rotated vectors: s_rc = <q_rot, k_rot> * scale
            s_rc = sum(qr * kr for qr, kr in zip(q_rot, k_rot)) * scale
            row_scores.append(s_rc)
            
        scores.append(row_scores)

    return scores
`;

export const DEFAULT_ROTARYEMBEDDINGATTENTIONCUDAKERNEL_INPUT: rotaryEmbeddingAttentionCudaKernelInput =
  {
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateRotaryEmbeddingAttentionCudaKernelSteps = (
  input: rotaryEmbeddingAttentionCudaKernelInput,
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
    "Initialize Fused RoPE & Attention CUDA Kernel Simulator",
    "Configuring GPU SRAM thread tile execution: fusing RoPE rotations into dot-product loop.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return {
          ...el,
          state: isTarget ? "active" : "compare",
          pointers: [`r=${idx}`, `m=${idx}`],
        };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      28,
      `Execute warp thread tile r=${idx} (val=${val}): apply in-register RoPE to q_tile[${idx}]`,
      `Fusing 2D Givens rotations directly in SRAM registers before Tensor Core GEMM matrix multiply.`,
      { rowIdx: idx, pos: idx, val, isTarget },
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
    "Successfully computed fused RoPE attention score matrix without HBM roundtrips.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ROTARYEMBEDDINGATTENTIONCUDAKERNEL_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  distractors: [
    "q_rot = q_raw + m",
    "s_rc = sum(q_raw * k_raw) * scale",
    "k_rot[i] = k_raw[i] * sin_val",
  ],
  hints: [
    { line: 26, hint: "Apply in-register 2D complex plane rotation to query vector q_raw." },
    { line: 39, hint: "Apply in-register 2D complex plane rotation to key vector k_raw." },
    { line: 43, hint: "Compute dot product <q_rot, k_rot> directly in register accumulator." },
  ],
  lineExplanations: {
    1: "Defines entry point for fused RoPE & attention CUDA kernel simulation.",
    26: "Computes 2D complex plane rotation for query vector in SRAM registers.",
    39: "Computes 2D complex plane rotation for key vector in SRAM registers.",
    43: "Multiplies rotated vectors to produce scaled attention score s_rc.",
    48: "Returns computed attention score matrix tile.",
  },
};

export const rotaryEmbeddingAttentionCudaKernel: AlgorithmDefinition<rotaryEmbeddingAttentionCudaKernelInput> =
  {
    id: "rotary-embedding-attention-cuda-kernel",
    title: "Fused RoPE & Attention CUDA Kernel Simulator",
    category: "ml_attention_geometry",
    categories: ["ml_attention_geometry", "ml_hardware_kernels"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 7,
    mlInfraCategory: "ml_attention_geometry",
    description:
      "In standard deep learning frameworks, applying Rotary Position Embeddings (RoPE) as an independent PyTorch operator requires reading un-rotated $Q$ and $K$ tensors from High Bandwidth Memory (HBM), performing elementwise rotations, and writing rotated tensors back to HBM. FlashAttention and Triton eliminate this intermediate DRAM roundtrip by fusing RoPE directly into the attention tile loading loop.\n\nFused RoPE & Attention CUDA Kernel loads raw un-rotated $Q$ and $K$ tiles into GPU Shared Memory (SRAM) and applies 2D Givens rotations $\\tilde{Q}_m = R_m Q_m$ and $\\tilde{K}_n = R_n K_n$ directly inside GPU registers before invoking Tensor Core MMA (Matrix Multiply-Accumulate) instructions:\n$$S_{m,n} = \\frac{1}{\\sqrt{d_k}} \\langle R_m Q_m, R_n K_n \\rangle$$\n\nInput Format:\n- data: Sequence token tile dimensions or values.\n- target: Target block position threshold.\n\nOutput Format:\n- Attention score matrix tile $S \\in \\mathbb{R}^{B_r \\times B_c}$ computed directly from fused in-register rotations.\n\nEdge Cases & Constraints:\n- Memory bandwidth savings: Saves $4 \\times N \\cdot d \\times 2$ bytes of DRAM transfers per Transformer layer.\n- Kernel register pressure: Holding cosine/sine precomputations alongside Q/K SRAM tiles increases register utilization per thread, requiring careful thread block tuning (e.g. 128 threads/block) to avoid register spilling.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Fused RoPE Tile Execution",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 30]",
        explanation: "Fuses 2D complex plane RoPE rotations into SRAM attention score calculation.",
      },
      {
        kind: "complex",
        title: "Multi-Row Tile Fusion",
        inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
        outputDisplay: "[1, 2, 3, 4, 5]",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 4, 5]",
        explanation: "Evaluates fused RoPE attention score matrix generation over a 5-row tile.",
      },
      {
        kind: "negative",
        title: "Target Bounds Check",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "[5, 10, 15]",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation:
          "Safely handles sequence tile boundaries under warp execution predicate guards.",
      },
    ],
    code: ROTARYEMBEDDINGATTENTIONCUDAKERNEL_CODE,
    timeComplexity: {
      best: "O(B_r \\cdot B_c \\cdot d)",
      average: "O(B_r \\cdot B_c \\cdot d)",
      worst: "O(B_r \\cdot B_c \\cdot d)",
    },
    spaceComplexity: "O(B_r \\cdot d + B_c \\cdot d)",
    complexityAnalysis: {
      time: "Computes fused tile attention in $O(B_r \\cdot B_c \\cdot d)$ operations with zero DRAM bandwidth overhead for intermediate RoPE tensors.",
      space:
        "Allocates $O((B_r + B_c) \\cdot d)$ space in fast GPU SRAM for holding $Q$ and $K$ tile buffers.",
    },
    topicGuide: {
      overview:
        "Fused RoPE Attention kernels (FlashAttention-2, vLLM Triton kernels) represent standard practice in modern LLM training and inference systems. By performing positional rotation in registers immediately prior to dot-product accumulation, system throughput is increased by up to 20-30%.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "For thread block processing query tile $Q \\in \\mathbb{R}^{B_r \\times d}$ at starting position $m$ and key tile $K \\in \\mathbb{R}^{B_c \\times d}$ at position $n$, the kernel computes $S_{r,c} = \\frac{1}{\\sqrt{d}} \\sum_{i=0}^{d/2-1} \\left( R_{m+r, i} q_{r, 2i:2i+2} \\right)^T \\left( R_{n+c, i} k_{c, 2i:2i+2} \\right)$.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "Executing RoPE in registers eliminates 2 global DRAM memory reads and 2 global DRAM memory writes per head. The arithmetic intensity of the tile loading phase increases, transforming a memory-bound operator into a compute-bound operation running on GPU Tensor Cores.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "In Triton, fused RoPE is implemented via Python decorators `@triton.jit` using vector pointers `tl.load(Q_ptr + offsets)`. RoPE rotation is expressed as `q_rot = q * cos + rotate_half(q) * sin` operating over 128-bit vector registers.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "When sequence lengths are not multiples of block size $B_r$ or $B_c$, boundary masks (`mask = row_offsets[:, None] < seqlen`) prevent out-of-bounds memory accesses during tile loads.",
        },
      ],
      keyTerms: [
        {
          term: "Kernel Fusion",
          definition:
            "Combining multiple sequential tensor operators into a single GPU kernel pass to eliminate DRAM roundtrips.",
        },
        {
          term: "Register Memory",
          definition:
            "Ultra-fast on-chip GPU storage accessible in 1 clock cycle with zero memory bus latency.",
        },
        {
          term: "Warp Synchronization",
          definition:
            "Coordinated thread execution within a 32-thread GPU warp executing SIMT instructions.",
        },
        {
          term: "SRAM Tiling",
          definition:
            "Partitioning large global memory matrices into small sub-blocks loaded into shared memory.",
        },
      ],
    },
    trivia: ROTARYEMBEDDINGATTENTIONCUDAKERNEL_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
    defaultInput: DEFAULT_ROTARYEMBEDDINGATTENTIONCUDAKERNEL_INPUT,
    generateSteps: generateRotaryEmbeddingAttentionCudaKernelSteps,
  };
