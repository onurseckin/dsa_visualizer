import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "ml_convolutions_im2col_gemm_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic Suite: Convolutions & Im2Col GEMM",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_convolutions_im2col_gemm",
      title: "Convolutions, Im2Col & Winograd Systems Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Winograd F(2x2, 3x3) Fast 2D Convolution Kernel",
          description:
            "Implement a Winograd $F(2 \\times 2, 3 \\times 3)$ fast convolution algorithm that transforms $4 \\times 4$ input tiles with matrices $B^T, G, A^T$ to evaluate output tiles in 16 multiplications instead of 36.",
          problemStatement:
            "Given 2D input image and 3x3 filter, execute Winograd minimal filtering and verify exact output within floating point tolerance.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Depthwise Separable Convolution FLOP Reduction Ratio",
          prompt:
            "Prove that replacing standard 2D convolution ($K_H \\times K_W \\times C_{\\text{in}} \\times C_{\\text{out}}$) with Depthwise Separable Convolution (Depthwise $K_H \\times K_W \\times C_{\\text{in}} +$ Pointwise $1 \\times 1 \\times C_{\\text{in}} \\times C_{\\text{out}}$) reduces total FLOPs and parameter count by factor $\\frac{1}{C_{\\text{out}}} + \\frac{1}{K_H K_W} \\approx \\frac{1}{9}$ for $3 \\times 3$ kernels.",
          statement:
            "Derive the computational efficiency ratio of MobileNet depthwise separable convolutions.",
          proofOutline:
            "1. Standard Conv FLOPs: $F_{\\text{standard}} = 2 \\cdot H \\cdot W \\cdot C_{\\text{in}} \\cdot C_{\\text{out}} \\cdot K_H \\cdot K_W$.\\n2. Depthwise Conv FLOPs: $F_{\\text{depthwise}} = 2 \\cdot H \\cdot W \\cdot C_{\\text{in}} \\cdot K_H \\cdot K_W$.\\n3. Pointwise Conv FLOPs: $F_{\\text{pointwise}} = 2 \\cdot H \\cdot W \\cdot C_{\\text{in}} \\cdot C_{\\text{out}}$.\\n4. Ratio: $\\frac{F_{\\text{sep}}}{F_{\\text{standard}}} = \\frac{2 H W C_{\\text{in}} (K_H K_W + C_{\\text{out}})}{2 H W C_{\\text{in}} C_{\\text{out}} K_H K_W} = \\frac{1}{C_{\\text{out}}} + \\frac{1}{K_H K_W}$. For $K=3, C_{\\text{out}}=512$: $\\frac{1}{512} + \\frac{1}{9} \\approx 11.3\\%$ ($8.9\\times$ reduction).",
          engineeringContext:
            "Core architectural efficiency driver in edge vision networks (MobileNetV3, EfficientNet).",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "cuDNN Convolution Heuristic Engine Selection Algorithm",
          prompt:
            "How does the cuDNN auto-tuner (`cudnnFindConvolutionForwardAlgorithm`) choose between `IMPLICIT_GEMM`, `WINOGRAD`, `FFT`, and `DIRECT_GEMM` based on kernel size ($1 \\times 1$ vs $3 \\times 3$ vs $7 \\times 7$), batch size, and available workspace memory?",
          engineeringContext:
            "Directly governs inference and training latency in PyTorch/TensorFlow vision pipelines.",
        },
      ],
      partD_stressTests: [
        {
          title: "Col2Im Boundary Atomic Race Condition in Stride > 1",
          scenario:
            "A developer writes a custom CUDA kernel for Col2Im without atomic additions. Because sliding window receptive fields overlap across adjacent pixels, multiple threads simultaneously write partial gradients to the same global memory address `dX[b, c, h, w]`, causing non-deterministic write collisions and dropping 30% of gradient energy.",
          failureMode:
            "Severe gradient underestimation and loss plateaus during backpropagation; resolved using `atomicAdd` or shared-memory conflict-free reductions.",
        },
      ],
    },
  ],
};

export const page = page3;
export const page_03_systems_scenarios = page3;
