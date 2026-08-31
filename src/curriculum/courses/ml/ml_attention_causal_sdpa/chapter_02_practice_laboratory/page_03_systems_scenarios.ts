import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_attention_causal_sdpa_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: Causal SDPA",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_attention_causal_sdpa",
      title: "Causal Attention & SDPA Systems Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "In-Place Causal Mask Kernel Simulation",
          description:
            "Implement an in-place causal masked score generator that avoids allocating a dense $N \\times N$ boolean mask matrix in HBM. Use coordinate arithmetic ($j > i$) to conditionally bypass un-needed dot-product evaluations.",
          problemStatement:
            "Given query tensor Q and key tensor K of shape [seq_len, head_dim], compute the lower-triangular score matrix S directly into a preallocated buffer without materializing full rectangular masks.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Exact FLOP Count for Causal vs. Bidirectional Attention",
          prompt:
            "Prove that causal masking cuts the theoretical FLOP count of the attention score calculation $QK^T$ and value contraction $PV$ by exactly half compared to bidirectional attention.",
          proofOutline:
            "1. Bidirectional SDPA evaluates $N \\times N$ dot products of length $d$: $2 N^2 d$ FLOPs for $QK^T$ and $2 N^2 d$ for $PV$, totaling $4 N^2 d$ FLOPs.\\n2. Causal SDPA only evaluates positions $j \\le i$, which corresponds to $\\sum_{i=1}^N i = \\frac{N(N+1)}{2}$ elements.\\n3. Total FLOPs = $2 \\times \\frac{N(N+1)}{2} d + 2 \\times \\frac{N(N+1)}{2} d = 2 N(N+1) d \\approx 2 N^2 d$ FLOPs, representing an exact 50% computational reduction as $N \\to \\infty$.",
          engineeringContext:
            "Enables runtime schedulers to budget exact FLOP/s and energy dissipation for autoregressive training workloads.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "HBM Memory Bandwidth Saturation on A100 vs. H100",
          prompt:
            "Calculate whether a batch size of 64 with sequence length 2048 and hidden dimension 4096 on an NVIDIA A100 (80GB SXM4, 2039 GB/s memory bandwidth, 312 TFLOP/s FP16 Tensor Core compute) is memory-bound or compute-bound during the SDPA layer.",
          engineeringContext:
            "Determines whether kernel fusion or tiling is necessary to eliminate memory bus stalls.",
        },
      ],
      partD_stressTests: [
        {
          title: "Half-Precision (FP16) Dot-Product Exponent Overflow",
          scenario:
            "In FP16, numbers above 65,504 overflow to +Infinity. If $d_k = 128$ and query/key vectors contain values around $\\sim 25.0$, their dot product reaches $128 \\times 25 \\times 25 = 80{,}000$. If the scaling factor $1/\\sqrt{128}$ is applied after the dot product rather than folded into the matrix multiplication, the intermediate accumulator immediately overflows to +Inf, yielding all-NaN outputs in softmax.",
          failureMode:
            "Immediate NaN loss explosion in training or silent garbage output during inference due to FP16 accumulator overflow.",
        },
      ],
    },
  ],
};
