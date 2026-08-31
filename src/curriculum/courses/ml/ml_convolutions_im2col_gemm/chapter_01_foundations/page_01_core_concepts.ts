import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_convolutions_im2col_gemm_c1_p1_concepts",
  pageNumber: 2,
  title: "Core Concepts: Implicit GEMM & Tensor Layout Formats (NCHW vs NHWC)",
  sections: [
    {
      type: "prose",
      title: "The Im2Col Memory Blowup: The 9x Footprint Expansion",
      content:
        "While Im2Col maps spatial convolutions to high-throughput GEMM, materializing the unfolded matrix $X_{\\text{col}}$ in DRAM creates a massive **$K_H \\times K_W$ memory blowup**. For a standard $3 \\times 3$ convolution on a high-resolution feature map (e.g. $B=16, C=64, H=256, W=256$), the raw input tensor occupies $16 \\times 64 \\times 256 \\times 256 \\times 4\\text{ bytes} = 268\\text{ MB}$. Materializing $X_{\\text{col}}$ duplicates overlapping pixels across sliding windows, expanding the memory buffer by **$9\\times$ up to 2.41 GB** for a single layer! In high-resolution vision models and Diffusion networks, this memory explosion limits batch size and triggers GPU out-of-memory errors.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Implicit GEMM (cuDNN) Virtual Coordinate Translation",
      visualIntuition:
        "Standard Im2Col: [ Input Image ] --( Allocates 2.4 GB in DRAM )--> [ X_col Matrix ] --( GEMM )--> [ Output ]\\nImplicit GEMM:    [ Input Image (268 MB) ] -----------------------------------------------> [ Output ]\\n                   \\-> Tensor Core MMA kernel computes 6D coordinates (b, c, h, w) on-the-fly inside SM registers!\\n                   (Zero bytes of intermediate Im2Col matrix allocated in DRAM!)",
      invariant:
        "Implicit GEMM Invariant: Thread tile loads in the GEMM reduction loop fetch memory addresses calculated dynamically as addr = b * S_b + c * S_c + (h * s + kh) * S_h + (w * s + kw) * S_w, achieving 100% compute efficiency with zero memory blowup.",
      stateTransitions:
        "GEMM Thread Block (M_tile, N_tile, K_tile) -> Map GEMM row/col indices to (Batch, Channel, Height, Width) -> Issue strided hardware DMA load directly into Shared Memory SRAM -> Compute Tensor Core MMA -> Output.",
      naiveBottleneck:
        "Allocating full Im2Col buffers in global DRAM saturates HBM bandwidth on redundant memory writes and reads.",
      optimalInsight:
        "Implicit GEMM performs virtual index address arithmetic inside fast register arithmetic units, saving gigabytes of VRAM.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Tensor Memory Coalescing (NCHW vs. NHWC Channels-Last)",
      theorem:
        "On GPU architectures with 128-bit (16-byte) vectorized memory instructions (e.g. `LDS.128` / `ld.global.v4`), storing 4D tensors in **NHWC (Channels-Last)** format guarantees 100% memory coalescing during Im2Col reductions when channel dimension $C_{\\text{in}}$ is a multiple of 8 (for FP16) or 4 (for FP32), whereas **NCHW (Channels-First)** format induces un-coalesced strided memory transactions.",
      proof:
        "1. Memory Stride Formulation for NCHW:\\nIn NCHW, adjacent spatial pixels in width $W$ are contiguous in memory (stride 1). However, during spatial reduction across channels $C_{\\text{in}}$, moving from channel $c$ to $c+1$ requires jumping by $H \\times W$ elements ($H W \\times 4$ bytes).\\nFor large feature maps ($H = W = 64$), $H W \\times 4 = 16{,}384$ bytes, landing threads in completely disjoint memory pages and causing severe DRAM channel serialization.\\n\\n2. Memory Stride Formulation for NHWC (Channels-Last):\\nIn NHWC, the channel dimension $C_{\\text{in}}$ is the contiguous innermost dimension (stride 1 in memory):\\n$$\\text{offset}(n, h, w, c) = n (H W C) + h (W C) + w (C) + c$$\\n\\n3. Vectorized Memory Transaction Coalescing:\\nConsecutive threads in a warp load consecutive channels $c, c+1, c+2, \\dots, c+7$ for the same spatial pixel $(n, h, w)$.\\nWhen $C_{\\text{in}}$ is a multiple of 8 in FP16 (16 bytes), each warp executes a single 128-bit coalesced memory load that perfectly aligns with a single 128-byte DRAM cache line, achieving 100% theoretical bus efficiency.",
    },
  ],
};
