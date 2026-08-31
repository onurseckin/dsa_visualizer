import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_normalization_rmsnorm_c1_p2",
  pageNumber: 3,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "RMSNorm: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive Python LayerNorm & RMSNorm Loops",
          code: `import numpy as np

def naive_layernorm_forward(x: np.ndarray, gamma: np.ndarray, beta: np.ndarray, eps: float = 1e-5) -> np.ndarray:
    # 2 sequential reduction passes (mean and variance)
    mu = np.mean(x, axis=-1, keepdims=True)
    var = np.var(x, axis=-1, keepdims=True)
    return ((x - mu) / np.sqrt(var + eps)) * gamma + beta

def naive_rmsnorm_forward(x: np.ndarray, gamma: np.ndarray, eps: float = 1e-5) -> np.ndarray:
    # 1 reduction pass (sum of squares)
    rms = np.sqrt(np.mean(x ** 2, axis=-1, keepdims=True) + eps)
    return (x / rms) * gamma`,
          explanation:
            "Demonstrates the fundamental architectural difference: RMSNorm eliminates the mean centering step ($\\mu = 0$) and bias parameter $\\beta$.",
          timeComplexity: "O(B * D)",
          spaceComplexity: "O(1) auxiliary",
        },
        {
          label: "Stage 2: Vectorized PyTorch / NumPy Custom Autograd RMSNorm",
          code: `import numpy as np
from typing import Tuple

class VectorizedRMSNormAutograd:
    """
    Custom Autograd implementation of RMSNorm forward and exact backward passes.
    """
    def __init__(self, d_model: int, eps: float = 1e-5):
        self.gamma = np.ones(d_model, dtype=np.float32)
        self.eps = eps
        self.cached_x = None
        self.cached_rms = None
        
    def forward(self, x: np.ndarray) -> np.ndarray:
        # x: [B, D]
        self.cached_x = x
        # 1. Compute RMS: sqrt(mean(x^2) + eps)
        rms = np.sqrt(np.mean(x ** 2, axis=-1, keepdims=True) + self.eps)
        self.cached_rms = rms
        # 2. Normalize and scale by gamma
        x_norm = x / rms
        return x_norm * self.gamma
        
    def backward(self, grad_out: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        # grad_out: [B, D] (incoming dL/dy)
        x = self.cached_x
        rms = self.cached_rms
        D = x.shape[-1]
        
        # 1. Parameter gradient: dL/dgamma = sum(grad_out * (x / rms), axis=0)
        grad_gamma = np.sum(grad_out * (x / rms), axis=0)
        
        # 2. Input gradient: dL/dx
        # term1 = grad_out * gamma
        # term2 = (x / (rms^2 * D)) * sum(grad_out * gamma * x)
        g_gamma = grad_out * self.gamma
        dot_term = np.sum(g_gamma * x, axis=-1, keepdims=True)
        grad_x = (1.0 / rms) * (g_gamma - (x / (rms ** 2 * D)) * dot_term)
        
        return grad_x, grad_gamma`,
          explanation:
            "Vectorized forward and analytical backward passes evaluating the exact orthogonal projection gradient without numerical approximation.",
          timeComplexity: "O(B * D)",
          spaceComplexity: "O(B * D) cached activation tensor",
        },
        {
          label: "Stage 3: Fused Triton / CUDA Kernel Simulation with Residual Add",
          code: `import numpy as np

def fused_residual_rmsnorm_kernel_sim(
    x: np.ndarray,
    residual: np.ndarray,
    gamma: np.ndarray,
    eps: float = 1e-5
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Simulates a fused CUDA / Triton kernel: x_out, y = Fused_RMSNorm(x + residual, gamma)
    1. Loads x and residual into registers in a single memory pass.
    2. Computes in-place sum x_acc = x + residual.
    3. Executes fast shared-memory warp-shuffle reduction for sum(x_acc^2).
    4. Writes normalized y and updated residual x_acc directly back to HBM.
    Cuts DRAM memory bandwidth consumption by exactly 50%!
    """
    B, D = x.shape
    # Simulated register execution:
    # 1. In-place residual addition in registers
    x_acc = x + residual
    
    # 2. Warp-level parallel reduction for sum of squares
    mean_sq = np.mean(x_acc ** 2, axis=-1, keepdims=True)
    inv_rms = 1.0 / np.sqrt(mean_sq + eps)
    
    # 3. Vectorized normalization and scaling
    norm_out = (x_acc * inv_rms) * gamma
    
    return norm_out, x_acc`,
          explanation:
            "Simulates the production Triton / Flash-Attention fused normalization kernel: combines residual addition and RMSNorm into a single kernel launch, eliminating 1 DRAM write and 1 DRAM read.",
          timeComplexity: "O(B * D) strictly 1 memory read & 1 write",
          spaceComplexity: "O(1) fast SRAM scratchpad",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Warp Shuffle Reductions & Shared Memory Bank Alignment",
      content:
        "In GPU microarchitecture, computing the sum of squares $\\sum x_i^2$ across 1024 threads in a thread block is accelerated using **Warp Shuffle Instructions** (`__shfl_down_sync`). In 5 clock cycles, 32 threads in a warp reduce their local registers without touching shared memory or global DRAM. A final 32-element reduction in shared memory completes the root mean square calculation in under 15 clock cycles.",
    },
  ],
};

export const page_02_systems = page2;
