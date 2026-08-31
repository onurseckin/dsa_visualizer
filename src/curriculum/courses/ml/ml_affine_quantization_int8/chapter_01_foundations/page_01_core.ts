import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_affine_quantization_int8_c1_p1",
  pageNumber: 1,
  title: "Affine Quantization: Integer Mapping & Zero-Point Mechanics",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Physical Quantization Crisis: Memory Footprint & ALU Efficiency",
      content:
        "Modern frontier models (70B-405B parameters) require hundreds of gigabytes to terabytes of GPU memory in FP16 (2 bytes per weight). Storing weights in **INT8** (1 byte) halves the memory footprint and doubles memory bus bandwidth efficiency. Furthermore, modern GPU Tensor Cores (NVIDIA Ampere/Hopper) execute INT8 matrix multiplications at **2x the peak TFLOP/s** of FP16/BF16 (e.g. 1978 TOPS INT8 vs 989 TFLOPS FP16 on H100). However, floating-point distributions are continuous, asymmetric, and contain extreme outliers ($>6\\sigma$). Mapping continuous real numbers $x \\in [\\alpha, \\beta]$ onto discrete 8-bit integers $q \\in [-128, 127]$ (signed) or $[0, 255]$ (unsigned) requires exact affine transformations with zero-point correction to prevent catastrophic loss of precision.",
    },
    {
      type: "mental_model",
      title: "Mental Model: Affine Scale and Zero-Point Projection",
      visualIntuition:
        "[ Real Float Domain: [alpha, beta] ] --( Scale s = (beta - alpha) / (q_max - q_min) )--> [ Shifted Domain ] --( + ZeroPoint z )--> [ Discrete Quantized Grid: {0, 1, ..., 255} ]",
      invariant:
        "Exact Dequantization Invariant: x_approx = s * (q - z). The zero-point z ensures that real value 0.0 maps exactly to an integer, preventing zero-padding in tensors from introducing numerical bias.",
      stateTransitions:
        "FP32 Tensor -> Calibrate Dynamic Range [alpha, beta] -> Compute Scale s & Zero-Point z -> Quantize q = clamp(round(x / s) + z, q_min, q_max) -> INT8 Tensor -> Integer GEMM Accumulation in INT32 -> Dequantize back to FP16/FP32.",
      naiveBottleneck:
        "Symmetric quantization forces zero-point z = 0. For asymmetric activation distributions (e.g. post-ReLU/GELU activations where values are strictly non-negative), symmetric quantization wastes 50% of the discrete integer range on empty negative bins.",
      optimalInsight:
        "Uniform affine quantization dynamically shifts the integer grid via zero-point z, preserving maximum representational resolution across asymmetric distributions.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Integer GEMM Zero-Point Expansion",
      theorem:
        "Let $X \\in \\mathbb{R}^{M \\times K}$ and $W \\in \\mathbb{R}^{K \\times N}$ be quantized as $X \\approx s_x (Q_X - z_x \\mathbf{1}_{M \\times K})$ and $W \\approx s_w (Q_W - z_w \\mathbf{1}_{K \\times N})$. The matrix product $X W$ is evaluated via integer matrix multiplication with 3 low-rank correction terms: $X W \\approx s_x s_w \\left( Q_X Q_W - z_w (Q_X \\mathbf{1}) \\mathbf{1}^T - z_x \\mathbf{1} (\\mathbf{1}^T Q_W) + K z_x z_w \\mathbf{1}_{M \\times N} \\right)$.",
      proof:
        "1. Direct Matrix Expansion:\\n$$\\begin{aligned} X W &= \\left( s_x (Q_X - z_x \\mathbf{1}_{M \\times K}) \\right) \\left( s_w (Q_W - z_w \\mathbf{1}_{K \\times N}) \\right) \\\\ &= s_x s_w (Q_X - z_x \\mathbf{1}_{M \\times K}) (Q_W - z_w \\mathbf{1}_{K \\times N}) \\\\ &= s_x s_w \\left( Q_X Q_W - z_w Q_X \\mathbf{1}_{K \\times N} - z_x \\mathbf{1}_{M \\times K} Q_W + z_x z_w \\mathbf{1}_{M \\times K} \\mathbf{1}_{K \\times N} \\right) \\end{aligned}$$\\n\\n2. Algebraic Simplification of Outer Products:\\n- $Q_X Q_W$: Evaluated as a pure integer Matrix-Matrix Multiplication (INT8 $\\times$ INT8 $\\to$ INT32) on Tensor Cores.\\n- $Q_X \\mathbf{1}_{K \\times N} = (Q_X \\mathbf{1}_K) \\mathbf{1}_N^T$: Outer product of the row-sums of $Q_X$ with a vector of ones.\\n- $\\mathbf{1}_{M \\times K} Q_W = \\mathbf{1}_M (\\mathbf{1}_K^T Q_W)$: Outer product of a vector of ones with the column-sums of $Q_W$ (which can be precomputed offline!).\\n- $\\mathbf{1}_{M \\times K} \\mathbf{1}_{K \\times N} = K \\mathbf{1}_{M \\times N}$: Scalar multiple of a matrix of ones.\\n\\n3. Computational Efficiency:\\nBecause $W$ is static during inference, $z_x \\mathbf{1}_M (\\mathbf{1}_K^T Q_W)$ and $K z_x z_w$ are pre-calculated offline. During runtime, only the row-sums $Q_X \\mathbf{1}_K$ are computed online, requiring only $O(M K)$ additions compared to $O(M N K)$ GEMM operations.",
    },
  ],
};
