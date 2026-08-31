import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_affine_quantization_int8_c1_p2",
  pageNumber: 2,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "Affine Quantization: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: FP32 Linear Baseline",
          code: `import torch

def fp32_linear_forward(x: torch.Tensor, w: torch.Tensor) -> torch.Tensor:
    # x: [M, K] in FP32, w: [K, N] in FP32
    return torch.matmul(x, w)`,
          explanation:
            "Standard high-precision floating point matrix multiplication executing in 32-bit floats with 4 bytes per parameter.",
          timeComplexity: "O(M * N * K)",
          spaceComplexity: "O(K * N * 4) bytes for weights",
        },
        {
          label: "Stage 2: Quantize-Dequantize (Fake Quantization Emulation)",
          code: `import torch

def affine_quantize(x: torch.Tensor, qmin: int = 0, qmax: int = 255):
    # Dynamic scale and zero point calibration
    alpha = x.min()
    beta = x.max()
    scale = (beta - alpha) / float(qmax - qmin)
    scale = max(scale.item(), 1e-8)
    
    zero_point = qmin - round(alpha.item() / scale)
    zero_point = max(qmin, min(qmax, zero_point))
    
    q_x = torch.clamp(torch.round(x / scale) + zero_point, qmin, qmax)
    return q_x, scale, zero_point

def fake_quantized_linear(x: torch.Tensor, w: torch.Tensor) -> torch.Tensor:
    q_x, s_x, z_x = affine_quantize(x)
    q_w, s_w, z_w = affine_quantize(w)
    
    # Dequantize back to float
    x_dequant = s_x * (q_x - z_x)
    w_dequant = s_w * (q_w - z_w)
    
    return torch.matmul(x_dequant, w_dequant)`,
          explanation:
            "Simulates the quantization noise of INT8 arithmetic directly within PyTorch autograd graph (Quantization-Aware Training style).",
          timeComplexity: "O(M * N * K)",
          spaceComplexity: "O(M * K + K * N) emulated buffers",
        },
        {
          label: "Stage 3: Bare-Metal Integer INT8 GEMM with INT32 Accumulators",
          code: `import numpy as np

def low_level_int8_gemm(
    q_x: np.ndarray,      # [M, K] uint8
    q_w: np.ndarray,      # [K, N] uint8
    s_x: float, z_x: int,
    s_w: float, z_w: int,
) -> np.ndarray:
    """
    Simulates hardware Tensor Core INT8 GEMM.
    Multiplies 8-bit unsigned integers, accumulates in 32-bit integer registers,
    and applies algebraic zero-point corrections with float scaling.
    """
    M, K = q_x.shape
    _, N = q_w.shape
    
    # 1. Hardware INT8 x INT8 -> INT32 matrix multiplication (dp4a / Tensor Core)
    int32_acc = np.matmul(q_x.astype(np.int32), q_w.astype(np.int32))  # [M, N]
    
    # 2. Offline precomputed column sums for weights: [1, N]
    w_col_sums = np.sum(q_w.astype(np.int32), axis=0, keepdims=True)
    
    # 3. Online computed row sums for activations: [M, 1]
    x_row_sums = np.sum(q_x.astype(np.int32), axis=1, keepdims=True)
    
    # 4. Zero-point correction terms
    term1 = int32_acc
    term2 = z_w * x_row_sums
    term3 = z_x * w_col_sums
    term4 = K * z_x * z_w
    
    integer_corrected = term1 - term2 - term3 + term4  # [M, N] in INT32
    
    # 5. Final FP16/FP32 rescaling
    output_fp = (s_x * s_w) * integer_corrected.astype(np.float32)
    return output_fp`,
          explanation:
            "Simulates bare-metal CUDA / TensorRT INT8 kernel execution. Accumulates in 32-bit integers to prevent overflow, folding weight zero-point column sums offline.",
          timeComplexity: "O(M * N * K) hardware-accelerated INT8 TOPS",
          spaceComplexity: "O(K * N * 1) byte per weight + O(N) offline sums",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Activation Outlier Channels & SmoothQuant Mathematical Migration",
      content:
        "In modern LLMs (>6B parameters), systematic activation outliers emerge in specific hidden dimensions across all tokens, reaching magnitudes $100\\times$ larger than normal channels ($>6\\sigma$). In per-tensor INT8 quantization, these outlier spikes force scale factor $s$ to be enormous, compressing 99.9% of normal activation values into just 2-3 integer bins and destroying model perplexity.\\n\\n**SmoothQuant (Xiao et al., 2022)** proves a mathematically exact transformation: multiplying activations by an inverse diagonal scaling matrix $\\text{diag}(s)^{-1}$ and multiplying weight columns by $\\text{diag}(s)$:\\n$$Y = X W = (X \\cdot \\text{diag}(s)^{-1}) \\cdot (\\text{diag}(s) \\cdot W) = \\hat{X} \\hat{W}$$\\nwhere $s_j = \\frac{\\max(|X_j|)^\\alpha}{\\max(|W_j|)^{1-\\alpha}}$ (migration strength $\\alpha \\approx 0.5$). This migrates the quantization dynamic range difficulty from volatile activations to static weights, enabling seamless W8A8 quantization without quality degradation.",
    },
  ],
};
