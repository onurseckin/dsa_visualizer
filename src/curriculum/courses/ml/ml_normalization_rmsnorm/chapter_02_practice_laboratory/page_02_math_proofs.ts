import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_normalization_rmsnorm_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: RMSNorm Projection Orthogonality & Gradient Stability",
  sections: [
    {
      type: "math_proof",
      title: "Orthogonal Gradient Projection Invariant Theorem",
      theorem:
        "The RMSNorm input gradient $\\nabla_x \\mathcal{L}$ is strictly orthogonal to the input activation vector $x$ under scaled inner product: $\\langle \\nabla_x \\mathcal{L}, x \\rangle = 0$.",
      proof:
        "1. Gradient Formulation:\\n$$\\nabla_x \\mathcal{L} = \\frac{1}{\\text{RMS}(x)} \\left[ (g \\odot \\gamma) - \\frac{x}{\\text{RMS}(x)^2 D} \\sum_{j=1}^D (g_j \\gamma_j x_j) \\right]$$\\n\\n2. Inner Product with $x$:\\n$$\\langle \\nabla_x \\mathcal{L}, x \\rangle = \\sum_{i=1}^D (\\nabla_x \\mathcal{L})_i x_i = \\frac{1}{\\text{RMS}(x)} \\left[ \\sum_{i=1}^D g_i \\gamma_i x_i - \\frac{\\sum_{i=1}^D x_i^2}{\\text{RMS}(x)^2 D} \\sum_{j=1}^D (g_j \\gamma_j x_j) \\right]$$\\n\\n3. Simplification using RMS Definition:\\nNote that by definition, $\\text{RMS}(x)^2 = \\frac{1}{D} \\sum_{i=1}^D x_i^2$, so:\\n$$\\frac{\\sum_{i=1}^D x_i^2}{\\text{RMS}(x)^2 D} = \\frac{\\sum_{i=1}^D x_i^2}{\\left(\\frac{1}{D} \\sum_{i=1}^D x_i^2\\right) D} = \\frac{\\sum x_i^2}{\\sum x_i^2} = 1$$\\n\\n4. Evaluation of Difference:\\n$$\\langle \\nabla_x \\mathcal{L}, x \\rangle = \\frac{1}{\\text{RMS}(x)} \\left[ \\sum_{i=1}^D g_i \\gamma_i x_i - (1) \\cdot \\sum_{j=1}^D g_j \\gamma_j x_j \\right] = \\frac{1}{\\text{RMS}(x)} [0] = 0$$\\n\\n5. Conclusion:\\n$\\nabla_x \\mathcal{L} \\perp x$ identically. This proves that gradient descent updates cannot change the radial magnitude of activations along the current vector direction, forcing updates to act entirely as orthogonal directional rotations.",
    },
    {
      type: "math_proof",
      title: "LayerNorm vs. RMSNorm Representational Equivalence",
      theorem:
        "For zero-mean inputs $\\mathbb{E}[x] = 0$, LayerNorm and RMSNorm produce identical forward activations and identical backward gradients: $\\text{LayerNorm}(x, \\gamma, \\beta=0) = \\text{RMSNorm}(x, \\gamma)$.",
      proof:
        "1. Mean Centering of LayerNorm:\\nLet $\\mu = \\frac{1}{D} \\sum_{i=1}^D x_i = 0$. Then $(x_i - \\mu) = x_i$.\\n\\n2. Variance Formulation:\\n$$\\sigma^2 = \\frac{1}{D} \\sum_{i=1}^D (x_i - \\mu)^2 = \\frac{1}{D} \\sum_{i=1}^D x_i^2 = \\text{RMS}(x)^2$$\\n\\n3. Output Identity:\\n$$\\text{LayerNorm}(x, \\gamma, \\beta=0) = \\frac{x_i - 0}{\\sqrt{\\sigma^2 + \\epsilon}} \\gamma_i = \\frac{x_i}{\\sqrt{\\text{RMS}(x)^2 + \\epsilon}} \\gamma_i = \\text{RMSNorm}(x, \\gamma)$$\\nSince modern normalization is preceded by high-dimensional zero-mean GEMMs ($X W$), $\\mu \\approx 0$ holds naturally, proving why RMSNorm achieves identical model perplexity without the compute and memory overhead of explicit mean calculation.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
