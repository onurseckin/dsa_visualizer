import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_normalization_rmsnorm_c1_p1_concepts",
  pageNumber: 2,
  title: "Core Concepts: Normalization Taxonomy & Exact Backward Calculus",
  sections: [
    {
      type: "prose",
      title: "The Normalization Taxonomy: BatchNorm vs LayerNorm vs RMSNorm",
      content:
        "Deep learning normalizers differ strictly by the subset of tensor dimensions $(B, C, H, W)$ or $(B, S, D)$ reduced during computation:\\n\\n1. **BatchNorm (Ioffe & Szegedy, 2015)**: Normalizes across batch $B$ and spatial dimensions for each channel $C$ independently. Depends on batch size and fails during autoregressive sequential decoding ($B=1$).\\n2. **LayerNorm (Ba et al., 2016)**: Normalizes across all hidden channels $D$ for each token independently: $y = \\frac{x - \\mu}{\\sigma} \\odot \\gamma + \\beta$.\\n3. **RMSNorm (Zhang & Sennrich, 2019)**: Eliminates mean $\\mu$ and bias $\\beta$, scaling strictly by root mean square energy: $y = \\frac{x}{\\text{RMS}(x)} \\odot \\gamma$.\\n4. **GroupNorm / InstanceNorm**: Normalizes across sub-groups of channels or spatial pixels (predominantly in Vision/Diffusion models).",
    },
    {
      type: "mental_model",
      title: "Mental Model: Arithmetic Intensity of Normalization Layers",
      visualIntuition:
        "GEMM Layer: [ Input (10 MB) ] x [ Weight (500 MB) ] --> [ Output (10 MB) ]\\n  Arithmetic Intensity = 2 * M * N * K / (Bytes) ~ 200-300 FLOP/byte (COMPUTE BOUND!)\\nRMSNorm Layer: [ Input (10 MB) ] --> Reads 10 MB, executes 2 FLOPs per byte, Writes 10 MB\\n  Arithmetic Intensity = 2 FLOP/byte (EXTREMELY MEMORY BANDWIDTH BOUND!)\\nSolution: Kernel Fusion fuses RMSNorm directly with Residual Add (x = RMSNorm(x + res)).",
      invariant:
        "Orthogonal Projection Invariant: The backward gradient through RMSNorm projects the incoming gradient g onto the subspace orthogonal to input vector x, ensuring that scaling x does not induce spurious energy growth.",
      stateTransitions:
        "Incoming Adjoint g = dL/dy -> Compute Dot Product <g * gamma, x> -> Scale by 1 / (RMS(x)^2 * D) -> Subtract from scaled gradient -> Multiply by 1 / RMS(x) -> Output Input Adjoint dL/dx.",
      naiveBottleneck:
        "Executing separate kernels for Residual Add and RMSNorm requires writing and re-reading the full activation tensor from DRAM.",
      optimalInsight:
        "Fusing `Residual Add + RMSNorm` keeps intermediate sums in fast on-chip registers, cutting DRAM traffic by 50%.",
    },
    {
      type: "math_proof",
      title: "Mathematical Proof: Complete RMSNorm Backward Pass Analytical Derivation",
      theorem:
        "Let $y_i = \\frac{x_i}{\\text{RMS}(x)} \\gamma_i$ where $\\text{RMS}(x) = \\sqrt{\\frac{1}{D} \\sum_{j=1}^D x_j^2 + \\epsilon}$. Given incoming adjoint $g = \\nabla_y \\mathcal{L}$, the analytical gradients with respect to input $x$ and gain $\\gamma$ are $\\nabla_\\gamma \\mathcal{L} = g \\odot \\frac{x}{\\text{RMS}(x)}$ and $\\nabla_x \\mathcal{L} = \\frac{1}{\\text{RMS}(x)} \\left[ g \\odot \\gamma - \\frac{x}{\\text{RMS}(x)^2 D} \\sum_{j=1}^D (g_j \\gamma_j x_j) \\right]$.",
      proof:
        "1. Gradient w.r.t. Learnable Gain $\\gamma$:\\n$$\\frac{\\partial \\mathcal{L}}{\\partial \\gamma_i} = \\frac{\\partial \\mathcal{L}}{\\partial y_i} \\frac{\\partial y_i}{\\partial \\gamma_i} = g_i \\cdot \\frac{x_i}{\\text{RMS}(x)} \\implies \\nabla_\\gamma \\mathcal{L} = g \\odot \\frac{x}{\\text{RMS}(x)}$$\\n\\n2. Gradient w.r.t. Input Elements $x_i$:\\nUsing the multivariate chain rule:\\n$$\\frac{\\partial \\mathcal{L}}{\\partial x_i} = \\sum_{j=1}^D g_j \\frac{\\partial y_j}{\\partial x_i}$$\\nLet $R = \\text{RMS}(x) = \\left( \\frac{1}{D} \\sum_{k=1}^D x_k^2 + \\epsilon \\right)^{1/2}$. Differentiating $R$ w.r.t. $x_i$:\\n$$\\frac{\\partial R}{\\partial x_i} = \\frac{1}{2 R} \\left( \\frac{2 x_i}{D} \\right) = \\frac{x_i}{D \\cdot R}$$\\n\\n3. Evaluating Jacobian Elements $\\frac{\\partial y_j}{\\partial x_i}$:\\n$$y_j = \\gamma_j x_j R^{-1} \\implies \\frac{\\partial y_j}{\\partial x_i} = \\gamma_j \\left[ \\delta_{ij} R^{-1} - x_j R^{-2} \\frac{\\partial R}{\\partial x_i} \\right] = \\gamma_j \\left[ \\frac{\\delta_{ij}}{R} - \\frac{x_j x_i}{D \\cdot R^3} \\right]$$\\n\\n4. Contracting with Incoming Gradient $g$:\\n$$\\frac{\\partial \\mathcal{L}}{\\partial x_i} = \\sum_{j=1}^D g_j \\gamma_j \\left[ \\frac{\\delta_{ij}}{R} - \\frac{x_j x_i}{D \\cdot R^3} \\right] = \\frac{g_i \\gamma_i}{R} - \\frac{x_i}{D \\cdot R^3} \\sum_{j=1}^D (g_j \\gamma_j x_j)$$\\nFactoring out $\\frac{1}{R}$:\\n$$\\nabla_x \\mathcal{L} = \\frac{1}{\\text{RMS}(x)} \\left[ g \\odot \\gamma - \\frac{x}{\\text{RMS}(x)^2 D} \\langle g \\odot \\gamma, x \\rangle \\right]$$\\nThis proves the exact closed-form gradient implemented in high-performance Triton and CUDA RMSNorm backward kernels.",
    },
  ],
};
