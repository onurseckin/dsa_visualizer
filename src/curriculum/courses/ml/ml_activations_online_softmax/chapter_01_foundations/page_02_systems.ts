import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_activations_online_softmax_c1_p2",
  pageNumber: 3,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "Softmax & Activations: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Standard 3-Pass Softmax Baseline",
          code: `import numpy as np

def standard_3pass_softmax(x: np.ndarray) -> np.ndarray:
    """
    Standard 3-Pass Softmax (Safe Softmax).
    Pass 1: Find maximum (m = max(x)) -> 1 read pass from DRAM.
    Pass 2: Exponentiate and sum (d = sum(exp(x - m))) -> 1 read pass, 1 write pass.
    Pass 3: Normalize (p = exp(x - m) / d) -> 1 read pass, 1 write pass.
    Total: 3 reads, 2 writes per element from slow HBM!
    """
    # x: [B, N]
    # Pass 1: Row max
    m = np.max(x, axis=-1, keepdims=True)
    # Pass 2: Exponentiate and sum
    shifted_exp = np.exp(x - m)
    d = np.sum(shifted_exp, axis=-1, keepdims=True)
    # Pass 3: Normalize
    p = shifted_exp / d
    return p`,
          explanation:
            "Executes 3 distinct global memory passes over the tensor, incurring severe memory bandwidth bottlenecks.",
          timeComplexity: "O(B * N)",
          spaceComplexity: "O(B * N) intermediate memory buffers in DRAM",
        },
        {
          label: "Stage 2: Vectorized SwiGLU & Fast GELU Layer",
          code: `import numpy as np
import math

class VectorizedSwiGLU:
    """
    SwiGLU FFN Layer (Llama-3 Architecture):
    SwiGLU(x) = (SiLU(x @ W_gate) * (x @ W_up)) @ W_down
    """
    def __init__(self, d_model: int, d_ffn: int):
        self.w_gate = np.random.randn(d_model, d_ffn).astype(np.float32) * math.sqrt(2.0 / d_model)
        self.w_up = np.random.randn(d_model, d_ffn).astype(np.float32) * math.sqrt(2.0 / d_model)
        self.w_down = np.random.randn(d_ffn, d_model).astype(np.float32) * math.sqrt(2.0 / d_ffn)
        
    def forward(self, x: np.ndarray) -> np.ndarray:
        # 1. Parallel Projections: [B, S, d_ffn]
        h_gate = np.matmul(x, self.w_gate)
        h_up = np.matmul(x, self.w_up)
        
        # 2. SiLU Activation on gate: h_gate / (1 + exp(-h_gate))
        silu_gate = h_gate / (1.0 + np.exp(-h_gate))
        
        # 3. Multiplicative Gating
        gated = silu_gate * h_up
        
        # 4. Down Projection: [B, S, d_model]
        out = np.matmul(gated, self.w_down)
        return out`,
          explanation:
            "Vectorized SwiGLU forward pass with parallel linear projections and elementwise SiLU multiplicative gating.",
          timeComplexity: "O(3 * B * S * d_model * d_ffn)",
          spaceComplexity: "O(B * S * d_ffn) intermediate activations",
        },
        {
          label: "Stage 3: Fused Single-Pass Online Softmax Kernel Simulation",
          code: `import numpy as np

def fused_online_softmax_simulation(x: np.ndarray, block_size: int = 128) -> np.ndarray:
    """
    Simulates a high-performance GPU Online Softmax Kernel (FlashAttention-style):
    Processes the row in SRAM tiles of size 'block_size'.
    Maintains running row maximum (m) and running denominator (d),
    updating them on-the-fly without intermediate DRAM roundtrips!
    """
    B, N = x.shape
    out = np.zeros_like(x, dtype=np.float32)
    
    for b in range(B):
        row = x[b]
        
        # Running statistics in registers / SRAM
        m_prev = -float('inf')
        d_prev = 0.0
        
        # 1. Single-pass online streaming through SRAM tiles
        for i in range(0, N, block_size):
            tile = row[i : min(i + block_size, N)]
            
            # Local tile max and tile exp sum
            m_tile = np.max(tile)
            m_curr = max(m_prev, m_tile)
            
            # Rescale previous denominator and compute current tile sum
            scale_prev = np.exp(m_prev - m_curr) if m_prev != -float('inf') else 0.0
            d_curr = d_prev * scale_prev + np.sum(np.exp(tile - m_curr))
            
            m_prev = m_curr
            d_prev = d_curr
            
        # 2. Second fast streaming writeback pass using exact global m and d
        # (In FlashAttention, this is fused directly with the V-matrix multiplication!)
        for i in range(0, N, block_size):
            i_end = min(i + block_size, N)
            out[b, i:i_end] = np.exp(row[i:i_end] - m_prev) / d_prev
            
    return out`,
          explanation:
            "Simulates the FlashAttention online softmax kernel pipeline: tracks running maximums and normalizers across SRAM tiles, completely eliminating intermediate HBM allocation.",
          timeComplexity: "O(B * N) strictly 1 read and 1 write pass",
          spaceComplexity: "O(block_size) on-chip SRAM footprint",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Special Function Unit (SFU) Bottlenecks & Fast Approximations",
      content:
        "Evaluating standard GELU requires the Gaussian Error Function $\\text{erf}(x)$, which requires multiple SFU transcendental instruction cycles. In production training kernels, PyTorch and Triton replace exact $\\text{erf}(x)$ with the **Fast Tanh Approximation**: $\\text{GELU}(x) \\approx 0.5 x (1 + \\tanh(0.79788456 (x + 0.044715 x^3)))$ or the **QuickGELU** formulation: $\\text{QuickGELU}(x) = x \\cdot \\sigma(1.702 x)$. This reduces instruction latency from 32 clock cycles down to 4 clock cycles on NVIDIA Ampere/Hopper architectures.",
    },
  ],
};

export const page_02_systems = page2;
