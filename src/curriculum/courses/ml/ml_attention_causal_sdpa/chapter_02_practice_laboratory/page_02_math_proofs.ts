import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_attention_causal_sdpa_c2_p2",
  pageNumber: 2,
  title: "First-Principles Mathematical Proofs: Attention Jacobians & Backpropagation",
  sections: [
    {
      type: "math_proof",
      title: "Softmax Jacobian & Vanishing Gradient Under Scaled Logits",
      theorem:
        "The Jacobian matrix of the row-wise softmax transformation $\\sigma(z)_i = \\frac{e^{z_i}}{\\sum_k e^{z_k}}$ is given by $\\frac{\\partial \\sigma(z)_i}{\\partial z_j} = \\sigma(z)_i (\\delta_{ij} - \\sigma(z)_j)$. As logits scale arbitrarily large with magnitude $\\Delta z = z_{\\max} - z_{\\text{second}} \\gg 0$, the maximum eigenvalue of the Jacobian decays exponentially: $\\|J_\\sigma(z)\\|_2 \\le 2 e^{-\\Delta z}$.",
      proof:
        "Let $S = \\sum_{k=1}^N e^{z_k}$ and $p_i = \\sigma(z)_i = \\frac{e^{z_i}}{S}$.\\n\\nCase 1 ($i = j$):\\n$$\\frac{\\partial p_i}{\\partial z_i} = \\frac{e^{z_i} S - e^{z_i} e^{z_i}}{S^2} = \\frac{e^{z_i}}{S} \\left(1 - \\frac{e^{z_i}}{S}\\right) = p_i (1 - p_i)$$\\n\\nCase 2 ($i \\ne j$):\\n$$\\frac{\\partial p_i}{\\partial z_j} = \\frac{0 \\cdot S - e^{z_i} e^{z_j}}{S^2} = -\\frac{e^{z_i}}{S} \\frac{e^{z_j}}{S} = -p_i p_j$$\\n\\nCombining both cases using the Kronecker delta $\\delta_{ij}$:\\n$$\\frac{\\partial p_i}{\\partial z_j} = p_i (\\delta_{ij} - p_j)$$\\n\\nNow, consider the logit vector $z = \\frac{q^T K}{\\tau}$. If the temperature scaling factor $\\tau = \\sqrt{d_k}$ is omitted and $d_k$ is large, with high probability one logit $z_m$ exceeds all others by $\\Delta z = z_m - \\max_{j \\ne m} z_j > 0$. Then:\\n$$p_m = \\frac{e^{z_m}}{e^{z_m} + \\sum_{j \\ne m} e^{z_j}} = \\frac{1}{1 + \\sum_{j \\ne m} e^{z_j - z_m}} \\ge 1 - (N-1)e^{-\\Delta z}$$\\nAnd for any $j \\ne m$, $p_j \\le e^{-\\Delta z}$.\\n\\nEvaluating the diagonal entries of the Jacobian: $\\frac{\\partial p_m}{\\partial z_m} = p_m(1 - p_m) \\le 1 \\cdot (N-1)e^{-\\Delta z}$, and for $j \\ne m$, $\\frac{\\partial p_j}{\\partial z_j} = p_j(1 - p_j) \\le e^{-\\Delta z}$. Off-diagonal entries satisfy $|-p_i p_j| \\le e^{-\\Delta z}$.\\n\\nTherefore, without the $\\frac{1}{\\sqrt{d_k}}$ variance-damping normalizer, the backpropagated gradient $\\frac{\\partial \\mathcal{L}}{\\partial z} = J_\\sigma(z)^T \\frac{\\partial \\mathcal{L}}{\\partial p}$ is attenuated exponentially by $e^{-\\Delta z}$, freezing query and key weight updates during training.",
    },
    {
      type: "math_proof",
      title: "Causal Attention Backward Pass Gradient Derivation",
      theorem:
        "Let $O = PV$ where $P = \\text{softmax}(S + M)$ and $S = \\frac{QK^T}{\\sqrt{d_k}}$ with upper-triangular causal mask $M$. The analytic gradients with respect to $Q, K, V$ maintain strict causal sparsity: $\\frac{\\partial \\mathcal{L}}{\\partial S_{ij}} = 0$ for all $j > i$.",
      proof:
        "Given incoming gradient $\\nabla_O \\mathcal{L} \\in \\mathbb{R}^{N \\times d_v}$:\\n\\n1. Gradient w.r.t. Values $V$:\\nSince $O_{id} = \\sum_{j=1}^N P_{ij} V_{jd}$, applying the chain rule yields:\\n$$\\frac{\\partial \\mathcal{L}}{\\partial V_{jd}} = \\sum_{i=1}^N \\frac{\\partial \\mathcal{L}}{\\partial O_{id}} P_{ij} \\implies \\nabla_V \\mathcal{L} = P^T (\\nabla_O \\mathcal{L})$$\\n\\n2. Gradient w.r.t. Attention Probabilities $P$:\\n$$\\nabla_P \\mathcal{L} = (\\nabla_O \\mathcal{L}) V^T$$\\n\\n3. Gradient w.r.t. Pre-Softmax Scores $S$:\\nUsing the softmax Jacobian: $\\nabla_S \\mathcal{L} = P \\odot \\left( \\nabla_P \\mathcal{L} - \\left( (\\nabla_P \\mathcal{L} \\odot P) \\mathbf{1} \\right) \\mathbf{1}^T \\right)$.\\nBecause $P_{ij} = 0$ for all $j > i$ (enforced by the causal mask $M_{ij} = -\\infty$), the Hadamard product $P_{ij} (\\dots)$ is identically $0$ for all future token indices $j > i$. Thus $\\nabla_S \\mathcal{L}$ is strictly lower-triangular.\\n\\n4. Gradients w.r.t. Queries $Q$ and Keys $K$:\\n$$\\nabla_Q \\mathcal{L} = \\frac{1}{\\sqrt{d_k}} (\\nabla_S \\mathcal{L}) K, \\quad \\nabla_K \\mathcal{L} = \\frac{1}{\\sqrt{d_k}} (\\nabla_S \\mathcal{L})^T Q$$\\nThis guarantees that backpropagation honors causal temporal boundaries without introducing gradient leakage across time steps.",
    },
  ],
};
