import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_activations_online_softmax_c2_p2",
  pageNumber: 3,
  title: "Mathematical Proofs: Softmax Jacobian & Log-Sum-Exp Convexity",
  sections: [
    {
      type: "math_proof",
      title: "Softmax Jacobian Matrix Analytical Derivation",
      theorem:
        "Let $p = \\text{Softmax}(z) \\in \\mathbb{R}^N$ with $p_i = \\frac{e^{z_i}}{\\sum_{k=1}^N e^{z_k}}$. The Jacobian matrix $J = \\frac{\\partial p}{\\partial z} \\in \\mathbb{R}^{N \\times N}$ has elements $J_{ij} = \\frac{\\partial p_i}{\\partial z_j} = p_i (\\delta_{ij} - p_j) = \\text{diag}(p) - p p^T$, which is symmetric and positive semi-definite.",
      proof:
        "1. Case 1 ($i = j$, diagonal elements):\\nUsing the quotient rule on $p_i = \\frac{e^{z_i}}{\\sum_k e^{z_k}}$:\\n$$\\frac{\\partial p_i}{\\partial z_i} = \\frac{e^{z_i} (\\sum_k e^{z_k}) - e^{z_i} (e^{z_i})}{\\left(\\sum_k e^{z_k}\\right)^2} = \\frac{e^{z_i}}{\\sum_k e^{z_k}} - \\left(\\frac{e^{z_i}}{\\sum_k e^{z_k}}\\right)^2 = p_i - p_i^2 = p_i(1 - p_i)$$\\n\\n2. Case 2 ($i \\ne j$, off-diagonal elements):\\n$$\\frac{\\partial p_i}{\\partial z_j} = \\frac{0 \\cdot (\\sum_k e^{z_k}) - e^{z_i} (e^{z_j})}{\\left(\\sum_k e^{z_k}\\right)^2} = - \\frac{e^{z_i}}{\\sum_k e^{z_k}} \\frac{e^{z_j}}{\\sum_k e^{z_k}} = - p_i p_j$$\\n\\n3. Matrix Representation:\\nCombining both cases using the Kronecker delta $\\delta_{ij}$:\\n$$J_{ij} = p_i (\\delta_{ij} - p_j) \\implies J = \\text{diag}(p) - p p^T$$\\n\\n4. Vector Product with Incoming Adjoint $g = \\nabla_p \\mathcal{L}$:\\n$$\\nabla_z \\mathcal{L} = J^T g = (\\text{diag}(p) - p p^T) g = p \\odot g - p (p^T g) = p \\odot (g - \\langle p, g \\rangle \\mathbf{1})$$\\nThis proves that the backward pass through Softmax computes the centered probability projection in $O(N)$ time with zero $O(N^2)$ Jacobian materialization.",
    },
    {
      type: "math_proof",
      title: "Log-Sum-Exp Smooth Maximum Convexity Theorem",
      theorem:
        "The function $\\text{LSE}(z) = \\ln \\left( \\sum_{i=1}^N e^{z_i} \\right)$ is strictly convex on $\\mathbb{R}^N$ and satisfies the tight bounds $\\max_i z_i \\le \\text{LSE}(z) \\le \\max_i z_i + \\ln N$.",
      proof:
        "1. Gradient of LSE:\\n$$\\nabla_z \\text{LSE}(z) = \\frac{1}{\\sum_k e^{z_k}} \\begin{pmatrix} e^{z_1} \\\\ \\vdots \\\\ e^{z_N} \\end{pmatrix} = \\text{Softmax}(z) = p$$\\n\\n2. Hessian Matrix of LSE:\\n$$\\nabla^2 \\text{LSE}(z) = \\frac{\\partial p}{\\partial z} = \\text{diag}(p) - p p^T$$\\nFor any non-zero vector $v \\in \\mathbb{R}^N$:\\n$$v^T (\\nabla^2 \\text{LSE}(z)) v = v^T \\text{diag}(p) v - (v^T p)^2 = \\sum_{i=1}^N p_i v_i^2 - \\left( \\sum_{i=1}^N p_i v_i \\right)^2 = \\text{Var}_p(v) \\ge 0$$\\nSince the variance is non-negative, the Hessian is positive semi-definite (PSD), proving that $\\text{LSE}(z)$ is convex.\\n\\n3. Bounding Inequalities:\\nLet $m = \\max_i z_i$. Then $e^m \\le \\sum_{i=1}^N e^{z_i} \\le N e^m$.\\nTaking natural logarithms:\\n$$\\ln(e^m) \\le \\ln\\left(\\sum_{i=1}^N e^{z_i}\\right) \\le \\ln(N e^m) \\implies m \\le \\text{LSE}(z) \\le m + \\ln N$$\\nproving that LSE is a smooth, differentiable upper bound for the max operator.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
