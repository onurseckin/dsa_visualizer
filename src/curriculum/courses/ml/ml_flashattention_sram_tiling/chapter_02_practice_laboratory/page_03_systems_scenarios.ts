import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_flashattention_sram_tiling_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: FlashAttention",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_flashattention_sram_tiling",
      title: "FlashAttention SRAM Tiling Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Backward Pass Recomputation (Zero-HBM Checkpointing)",
          description:
            "Implement the FlashAttention backward pass recomputation logic. Instead of storing the $N \\times N$ attention matrix $P$ in DRAM during the forward pass, store only the logsumexp vector $L = m + \\log(l)$ ($N$ elements). Recompute $P_{\\text{tile}}$ on-chip in SRAM during backpropagation to calculate $\\nabla_Q, \\nabla_K, \\nabla_V$.",
          problemStatement:
            "Given Q, K, V, dO, and saved logsumexp vector L, recompute attention probabilities block-by-block and accumulate gradients directly into dQ, dK, dV.",
        },
      ],
      partB_mathProofs: [
        {
          title: "FlashAttention Backward Pass Gradient Invariance",
          prompt:
            "Derive the recomputed gradient formula for query weights $dQ = P(dO \\cdot V^T - D) \\odot Q$ where $D_i = \\sum_d dO_{id} O_{id}$, and prove that this formulation avoids ever storing intermediate probabilities in HBM.",
          statement:
            "Prove that the scalar offset vector $D = \\text{rowsum}(dO \\odot O)$ permits single-pass gradient accumulation.",
          proofOutline:
            "1. Express $\\nabla_S \\mathcal{L} = P \\odot (\\nabla_P \\mathcal{L} - \\text{diag}(P \\nabla_P \\mathcal{L}^T \\mathbf{1}))$.\\n2. Substitute $\\nabla_P \\mathcal{L} = dO \\cdot V^T$ and $O = PV$ to show $P \\nabla_P \\mathcal{L}^T \\mathbf{1} = \\text{rowsum}(dO \\odot O) = D$.\\n3. Conclude $\\nabla_S \\mathcal{L} = P \\odot (dO \\cdot V^T - D \\mathbf{1}^T)$, which requires only $O, dO, V$ and on-chip recomputed $P$.",
          engineeringContext:
            "Eliminates activation memory bottleneck during large model training, enabling 8x longer sequence lengths within fixed GPU VRAM.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Hopper H100 Asynchronous TMA & WGMMA Warp Specialization",
          prompt:
            "How does FlashAttention-3 leverage Hopper's Tensor Memory Accelerator (TMA) and Warp-Group Matrix Multiply-Accumulate (WGMMA) instructions to overlap global memory loads with Tensor Core computation asynchronously?",
          engineeringContext:
            "Achieves over 75% theoretical compute utilization (>750 TFLOP/s FP16 on H100 SXM5).",
        },
      ],
      partD_stressTests: [
        {
          title: "Non-Divisible Sequence Length & Boundary Masking",
          scenario:
            "When sequence length $N = 2050$ and block size $B_r = 128$, the final block has only 2 valid tokens and 126 out-of-bound padding elements. If out-of-bound elements are unmasked or initialized to 0 rather than $-\\infty$, the running max and logsumexp accumulate garbage non-zero exponent sums.",
          failureMode:
            "Silent probability mass corruption and incorrect attention output normalization at sequence boundaries.",
        },
      ],
    },
  ],
};

export const page_03_systems_scenarios = page3;
