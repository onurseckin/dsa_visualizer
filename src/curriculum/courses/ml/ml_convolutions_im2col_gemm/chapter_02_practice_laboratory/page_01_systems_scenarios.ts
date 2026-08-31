import type { CoursePage } from "../../../../courseTypes";

export const page_01_systems_scenarios: CoursePage = {
  id: "ml_convolutions_im2col_gemm_c2_p1_systems",
  pageNumber: 2,
  title: "Silicon Scenarios: Tensor Core Layout Alignment & Implicit GEMM vs Im2Col",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Production System Scenario: Eliminating 10GB Im2Col Allocations in Stable Diffusion",
      content:
        "In high-resolution Diffusion models (Stable Diffusion XL, Flux), latent U-Net and DiT layers process $1024 \\times 1024$ spatial feature maps with batch sizes $B = 8$. A standard physical Im2Col unrolling on $3 \\times 3$ convolutions expands the input tensor by $9\\times$, requiring **11.8 GB of auxiliary DRAM buffers per layer** and causing immediate OOM on 16GB GPUs. By enabling **cuDNN Implicit GEMM** (which computes sliding window coordinates on-the-fly inside SM register files), auxiliary DRAM memory is reduced to **0 bytes**, cutting VRAM footprint by 75% and doubling batch throughput.",
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_convolutions_strided_layout",
      title: "Zero-Copy NHWC Virtual Strided View Generator",
      difficulty: "Hard",
      rationale:
        "Implement a zero-copy virtual strided view generator that maps a 4D NHWC tensor into an unfolded 6D sliding window without allocating intermediate DRAM arrays.",
      starterCode: `import numpy as np
from numpy.lib.stride_tricks import as_strided

def create_nhwc_strided_im2col_view(X: np.ndarray, Kh: int, Kw: int, stride: int = 1) -> np.ndarray:
    """
    Given X in NHWC layout [B, H, W, C], returns 6D view [B, H_out, W_out, Kh, Kw, C]
    with zero copy operations.
    """
    B, H, W, C = X.shape
    H_out = (H - Kh) // stride + 1
    W_out = (W - Kw) // stride + 1
    
    sB, sH, sW, sC = X.strides
    shape = (B, H_out, W_out, Kh, Kw, C)
    strides = (sB, sH * stride, sW * stride, sH, sW, sC)
    
    return as_strided(X, shape=shape, strides=strides)`,
    },
  ],
};

export const page2 = page_01_systems_scenarios;
