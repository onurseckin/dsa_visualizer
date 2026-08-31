import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_convolutions_im2col_gemm_c1_p2",
  pageNumber: 3,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "2D Convolution: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive 6-Nested Loop Spatial Convolution",
          code: `import numpy as np

def naive_conv2d_forward(
    X: np.ndarray,      # [B, C_in, H, W]
    W: np.ndarray,      # [C_out, C_in, K_h, K_w]
    bias: np.ndarray,   # [C_out]
    stride: int = 1,
    padding: int = 0
) -> np.ndarray:
    """
    6-Nested scalar loop 2D convolution.
    Incurs extreme instruction overhead and redundant DRAM loads.
    """
    B, C_in, H, W = X.shape
    C_out, _, K_h, K_w = W.shape
    
    # Calculate output spatial dimensions
    H_out = (H + 2 * padding - K_h) // stride + 1
    W_out = (W + 2 * padding - K_w) // stride + 1
    
    # Pad input
    X_pad = np.pad(X, ((0, 0), (0, 0), (padding, padding), (padding, padding)), mode='constant')
    Y = np.zeros((B, C_out, H_out, W_out), dtype=np.float32)
    
    # 6-nested loop execution
    for b in range(B):
        for c_out in range(C_out):
            for h in range(H_out):
                for w in range(W_out):
                    val = bias[c_out]
                    h_start = h * stride
                    w_start = w * stride
                    for c_in in range(C_in):
                        for kh in range(K_h):
                            for kw in range(K_w):
                                val += X_pad[b, c_in, h_start + kh, w_start + kw] * W[c_out, c_in, kh, kw]
                    Y[b, c_out, h, w] = val
                    
    return Y`,
          explanation:
            "Executes 6-nested scalar loops with zero SIMD utilization, achieving less than 0.5% of hardware compute capacity.",
          timeComplexity: "O(B * C_out * H_out * W_out * C_in * K_h * K_w)",
          spaceComplexity: "O(1) auxiliary",
        },
        {
          label: "Stage 2: Vectorized Im2Col + GEMM Convolution Engine",
          code: `import numpy as np

def im2col_indices(
    X: np.ndarray,
    K_h: int, K_w: int,
    padding: int = 1,
    stride: int = 1
) -> np.ndarray:
    """
    Unrolls input patches into 2D column matrix X_col of shape [(C_in * K_h * K_w), (B * H_out * W_out)].
    """
    B, C, H, W = X.shape
    H_out = (H + 2 * padding - K_h) // stride + 1
    W_out = (W + 2 * padding - K_w) // stride + 1
    
    X_pad = np.pad(X, ((0, 0), (0, 0), (padding, padding), (padding, padding)), mode='constant')
    cols = np.zeros((C * K_h * K_w, B * H_out * W_out), dtype=X.dtype)
    
    col_idx = 0
    for b in range(B):
        for h in range(H_out):
            for w in range(W_out):
                h_start = h * stride
                w_start = w * stride
                patch = X_pad[b, :, h_start:h_start+K_h, w_start:w_start+K_w]
                cols[:, col_idx] = patch.reshape(-1)
                col_idx += 1
                
    return cols

def im2col_gemm_conv2d(
    X: np.ndarray,
    W: np.ndarray,
    bias: np.ndarray,
    stride: int = 1,
    padding: int = 0
) -> np.ndarray:
    B, C_in, H, W = X.shape
    C_out, _, K_h, K_w = W.shape
    H_out = (H + 2 * padding - K_h) // stride + 1
    W_out = (W + 2 * padding - K_w) // stride + 1
    
    # 1. Unroll image to columns: [(C_in * K_h * K_w), (B * H_out * W_out)]
    X_col = im2col_indices(X, K_h, K_w, padding, stride)
    
    # 2. Flatten weights: [C_out, (C_in * K_h * K_w)]
    W_flat = W.reshape(C_out, -1)
    
    # 3. High-Performance GEMM: [C_out, (B * H_out * W_out)]
    out_col = np.matmul(W_flat, X_col) + bias[:, None]
    
    # 4. Reshape back to 4D Output Tensor: [B, C_out, H_out, W_out]
    out = out_col.reshape(C_out, B, H_out, W_out).transpose(1, 0, 2, 3)
    return out`,
          explanation:
            "Unrolls spatial receptive fields into columns and executes a single BLAS GEMM operation.",
          timeComplexity: "O(Im2Col) + O(GEMM) ~ peak BLAS throughput",
          spaceComplexity: "O(C_in * K_h * K_w * B * H_out * W_out) column buffer",
        },
        {
          label: "Stage 3: Fast Zero-Copy Strided Views & Col2Im Gradient Accumulator",
          code: `import numpy as np
from numpy.lib.stride_tricks import as_strided

def fast_strided_im2col(X: np.ndarray, K_h: int, K_w: int, stride: int = 1, padding: int = 0) -> np.ndarray:
    """
    Zero-Copy Im2Col using NumPy memory strides (as_strided).
    Generates a 6D virtual sliding window view without memory allocation!
    """
    B, C, H, W = X.shape
    H_out = (H + 2 * padding - K_h) // stride + 1
    W_out = (W + 2 * padding - K_w) // stride + 1
    
    if padding > 0:
        X = np.pad(X, ((0, 0), (0, 0), (padding, padding), (padding, padding)), mode='constant')
        
    sB, sC, sH, sW = X.strides
    
    # Create 6D sliding window view: [B, C, H_out, W_out, K_h, K_w]
    shape = (B, C, H_out, W_out, K_h, K_w)
    strides = (sB, sC, sH * stride, sW * stride, sH, sW)
    
    view = as_strided(X, shape=shape, strides=strides)
    # Permute and reshape to 2D column matrix for GEMM
    cols = view.transpose(1, 4, 5, 0, 2, 3).reshape(C * K_h * K_w, B * H_out * W_out)
    return cols

def col2im_accumulate_gradients(
    dX_col: np.ndarray,
    X_shape: tuple,
    K_h: int, K_w: int,
    stride: int = 1,
    padding: int = 0
) -> np.ndarray:
    """
    Col2Im: Accumulates overlapping spatial gradient contributions back into 4D tensor dX.
    """
    B, C, H, W = X_shape
    H_out = (H + 2 * padding - K_h) // stride + 1
    W_out = (W + 2 * padding - K_w) // stride + 1
    
    H_pad, W_pad = H + 2 * padding, W + 2 * padding
    dX_pad = np.zeros((B, C, H_pad, W_pad), dtype=np.float32)
    
    # Reshape dX_col to [C, K_h, K_w, B, H_out, W_out]
    dX_reshaped = dX_col.reshape(C, K_h, K_w, B, H_out, W_out)
    
    # In-place accumulation across overlapping receptive fields
    for kh in range(K_h):
        for kw in range(K_w):
            h_lim = H_out * stride
            w_lim = W_out * stride
            # Overlap summation
            for b in range(B):
                for c in range(C):
                    for h in range(H_out):
                        for w in range(W_out):
                            dX_pad[b, c, h * stride + kh, w * stride + kw] += dX_reshaped[c, kh, kw, b, h, w]
                            
    if padding > 0:
        return dX_pad[:, :, padding:-padding, padding:-padding]
    return dX_pad`,
          explanation:
            "Zero-copy strided memory views eliminate redundant buffer copies during forward passes, while Col2Im correctly accumulates overlapping backward gradients.",
          timeComplexity: "O(1) memory view setup + O(GEMM)",
          spaceComplexity: "O(1) auxiliary forward allocation",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "cuDNN Implicit GEMM vs. Physical Im2Col",
      content:
        "In production cuDNN / TensorRT engines, physical Im2Col buffers are never allocated. Instead, cuDNN executes **Implicit GEMM**: CUDA threads in each threadblock calculate spatial receptive field offsets on-the-fly inside SM register arithmetic logic, streaming pixel bytes directly from DRAM into shared memory as if the Im2Col matrix were physically materialized.",
    },
  ],
};

export const page_02_systems = page2;
