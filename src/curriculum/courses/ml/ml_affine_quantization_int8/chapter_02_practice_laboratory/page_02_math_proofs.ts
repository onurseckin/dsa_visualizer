import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_affine_quantization_int8_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Quantization Error Bounds & SmoothQuant Invariance",
  sections: [
    {
      type: "math_proof",
      title: "Optimal Scale Factor Minimizing Mean Squared Error",
      theorem:
        "Let real-valued continuous activation $X$ have probability density function $p(x)$ with zero mean and variance $\\sigma^2$. For a uniform $b$-bit quantizer with step size $\\Delta$, the expected quantization error decomposes into granular rounding noise and clipping distortion: $\\mathbb{E}[(X - \\hat{X})^2] = \\frac{\\Delta^2}{12} \\int_{-\\beta}^\\beta p(x) dx + 2 \\int_\\beta^\\infty (x - \\beta)^2 p(x) dx$.",
      proof:
        "1. Decomposition of Error Domain:\\nLet the clipping threshold be $\\beta = \\frac{2^b - 1}{2} \\Delta$. The total real line $\\mathbb{R}$ is partitioned into the granular region $[-\\beta, \\beta]$ and overload/clipping regions $(-\\infty, -\\beta) \\cup (\\beta, \\infty)$.\\n\\n2. Granular Error Integral:\\nWithin $[-\\beta, \\beta]$, rounding error $e = x - \\text{round}(x/\\Delta)\\Delta$ is uniformly distributed over $[-\\Delta/2, \\Delta/2]$ with variance $\\mathbb{E}[e^2] = \\frac{\\Delta^2}{12}$. Thus:\\n$$\\mathcal{E}_{\\text{granular}} = \\int_{-\\beta}^\\beta \\frac{\\Delta^2}{12} p(x) dx$$\\n\\n3. Clipping Error Integral:\\nFor $|x| > \\beta$, values are clamped to $\\pm \\beta$. For symmetric distributions $p(x) = p(-x)$:\\n$$\\mathcal{E}_{\\text{clipping}} = 2 \\int_\\beta^\\infty (x - \\beta)^2 p(x) dx$$\\n\\n4. Total Mean Squared Error (MSE):\\n$$\\text{MSE}(\\Delta) = \\frac{\\Delta^2}{12} \\int_{-\\beta}^\\beta p(x) dx + 2 \\int_\\beta^\\infty (x - \\beta)^2 p(x) dx$$\\nDifferentiating with respect to $\\Delta$ and setting $\\frac{\\partial \\text{MSE}}{\\partial \\Delta} = 0$ yields the optimal scale step size $\\Delta^*$, proving that minimizing MSE requires trading off granular rounding variance against clipping tail truncation.",
    },
    {
      type: "math_proof",
      title: "SmoothQuant Diagonal Equivalence & Outlier Channel Migration",
      theorem:
        "For any invertible diagonal scaling matrix $S = \\text{diag}(s_1, s_2, \\dots, s_K) \\in \\mathbb{R}^{K \\times K}$, the linear transformation $Y = X W$ is mathematically identical to $Y = \\hat{X} \\hat{W}$ where $\\hat{X} = X S^{-1}$ and $\\hat{W} = S W$.",
      proof:
        "1. Associativity of Matrix Multiplication:\\n$$\\hat{X} \\hat{W} = (X S^{-1}) (S W) = X (S^{-1} S) W = X I_K W = X W$$\\n\\n2. Channel-wise Element Formulation:\\nFor the $j$-th feature channel ($j \\in \\{1, \\dots, K\\}$):\\n$$\\hat{X}_{ij} = \\frac{X_{ij}}{s_j}, \\quad \\hat{W}_{jk} = s_j W_{jk}$$\\n\\n3. Optimal Migration Exponent:\\nSetting $s_j = \\frac{\\max_{i} |X_{ij}|^\\alpha}{\\max_{k} |W_{jk}|^{1 - \\alpha}}$ balances the dynamic range across both matrices. When $\\alpha = 0.5$, the maximum absolute values in channel $j$ for both activations and weights become identically $\\sqrt{\\max |X_{ij}| \\cdot \\max |W_{jk}|}$, completely eliminating activation outlier spikes before integer quantization.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
