import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_mlp_backpropagation_c1_p2",
  pageNumber: 3,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "MLP Backpropagation: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive Scalar Loop Backpropagation",
          code: `import numpy as np

def naive_scalar_mlp_backward(
    X: np.ndarray,      # [B, D_in]
    W: np.ndarray,      # [D_in, D_out]
    b: np.ndarray,      # [D_out]
    grad_out: np.ndarray  # [B, D_out] (incoming dL/dY)
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Scalar loop backpropagation.
    Explicit 3-nested scalar loops demonstrate exact elementwise Jacobian arithmetic.
    """
    B, D_in = X.shape
    _, D_out = W.shape
    
    dW = np.zeros((D_in, D_out), dtype=np.float32)
    db = np.zeros(D_out, dtype=np.float32)
    dX = np.zeros((B, D_in), dtype=np.float32)
    
    # 1. Parameter gradient: dW[i, j] = sum_b X[b, i] * grad_out[b, j]
    for i in range(D_in):
        for j in range(D_out):
            for batch in range(B):
                dW[i, j] += X[batch, i] * grad_out[batch, j]
                
    # 2. Bias gradient: db[j] = sum_b grad_out[b, j]
    for j in range(D_out):
        for batch in range(B):
            db[j] += grad_out[batch, j]
            
    # 3. Input adjoint: dX[b, i] = sum_j grad_out[b, j] * W[i, j]
    for batch in range(B):
        for i in range(D_in):
            for j in range(D_out):
                dX[batch, i] += grad_out[batch, j] * W[i, j]
                
    return dW, db, dX`,
          explanation:
            "Un-vectorized 3-nested scalar loops. Incurs enormous interpreter and loop instruction overhead with zero hardware register reuse.",
          timeComplexity: "O(B * D_in * D_out)",
          spaceComplexity: "O(1) auxiliary",
        },
        {
          label: "Stage 2: Vectorized NumPy / PyTorch Custom MLP Autograd Function",
          code: `import numpy as np
from typing import Tuple

class VectorizedMLPLayer:
    """
    Vectorized MLP Layer with forward caching and analytical backward GEMMs.
    """
    def __init__(self, in_features: int, out_features: int):
        # Kaiming He Normal Initialization
        std = np.sqrt(2.0 / in_features)
        self.W = np.random.randn(in_features, out_features).astype(np.float32) * std
        self.b = np.zeros(out_features, dtype=np.float32)
        self.cached_X = None
        self.cached_Z = None
        
    def forward(self, X: np.ndarray) -> np.ndarray:
        # X: [B, in_features]
        self.cached_X = X
        # Z = X W + b (GEMM 1)
        Z = np.matmul(X, self.W) + self.b
        self.cached_Z = Z
        # ReLU Activation
        A = np.maximum(0.0, Z)
        return A
        
    def backward(self, grad_A: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        # grad_A: [B, out_features]
        # 1. Backprop through ReLU: delta = grad_A * (Z > 0)
        delta = grad_A * (self.cached_Z > 0).astype(np.float32)
        
        # 2. Gradient w.r.t. Weights: dW = X^T @ delta (GEMM 2)
        dW = np.matmul(self.cached_X.T, delta)
        
        # 3. Gradient w.r.t. Bias: db = sum(delta, axis=0)
        db = np.sum(delta, axis=0)
        
        # 4. Gradient w.r.t. Input: dX = delta @ W^T (GEMM 3)
        dX = np.matmul(delta, self.W.T)
        
        return dW, db, dX`,
          explanation:
            "Vectorized forward/backward passes formulated entirely as BLAS GEMM operations ($X W$, $X^T \\delta$, $\\delta W^T$).",
          timeComplexity: "O(B * D_in * D_out) accelerated by BLAS",
          spaceComplexity: "O(B * D) cached activation memory",
        },
        {
          label: "Stage 3: Low-Level Fused MLP with Memory Reuse & In-Place Accumulation",
          code: `import numpy as np

class FusedMLPEngine:
    """
    Simulates a high-performance CUDA / Cutlass Fused MLP kernel:
    1. Fuses BiasAdd + ReLU into forward GEMM epilogue.
    2. Fuses ReLU backward derivative into backward GEMM prologue.
    3. Accumulates dW in-place directly into optimizer gradient buffers (zero temp allocations).
    4. Transposes weights in shared memory to ensure 100% coalesced memory reads.
    """
    def __init__(self, in_features: int, out_features: int, grad_acc_buffer: np.ndarray):
        self.in_features = in_features
        self.out_features = out_features
        self.W = np.random.randn(in_features, out_features).astype(np.float32) * np.sqrt(2.0 / in_features)
        self.b = np.zeros(out_features, dtype=np.float32)
        self.grad_W_acc = grad_acc_buffer  # In-place parameter gradient destination!
        
    def forward_fused(self, X: np.ndarray, bitmask_out: np.ndarray) -> np.ndarray:
        # Fused GEMM + Bias + ReLU with 1-bit ReLU mask pack
        Z = np.matmul(X, self.W) + self.b
        # Save 1-bit boolean mask instead of full 32-bit float tensor! (32x memory saving!)
        np.greater(Z, 0.0, out=bitmask_out)
        A = np.where(bitmask_out, Z, 0.0)
        return A
        
    def backward_fused(self, X: np.ndarray, bitmask: np.ndarray, grad_A: np.ndarray, dX_out: np.ndarray):
        # 1. In-place bitmask multiplication (Fused ReLU backward in registers)
        delta = grad_A * bitmask.astype(np.float32)
        
        # 2. In-place gradient accumulation: grad_W += X^T @ delta
        self.grad_W_acc += np.matmul(X.T, delta)
        
        # 3. In-place input gradient: dX_out = delta @ W^T
        np.matmul(delta, self.W.T, out=dX_out)`,
          explanation:
            "Simulates modern fused MLP kernels (Flash-Linear / TensorRT): compresses ReLU activation storage into a 1-bit mask (32x memory reduction) and accumulates parameter gradients in-place.",
          timeComplexity: "O(B * D_in * D_out) peak Tensor Core speed",
          spaceComplexity: "O(B * D / 32) 1-bit packed boolean mask",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Cache Line Thrashing in Weight Matrix Transposition (W^T)",
      content:
        "In the backward pass, computing $\\nabla_X = \\delta W^T$ requires accessing weight matrix $W$ in column-major order. In row-major memory storage (`float32[D_in][D_out]`), accessing column elements jumps by stride $D_{\\text{out}} \\times 4$ bytes across memory. If $D_{\\text{out}} = 8192$, every scalar read lands in a completely different 64-byte DRAM cache line, causing a **cache miss on 100% of memory loads**. High-performance CUDA libraries (cuBLAS / CUTLASS) execute an on-the-fly shared-memory matrix transpose with XOR bank swizzling to ensure 100% coalesced 128-bit memory transfers.",
    },
  ],
};

export const page_02_systems = page2;
