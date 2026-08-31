import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "page_01_core_concepts",
  pageNumber: 1,
  title: "Causal Scaled Dot-Product Attention: Mathematical Derivations",
  sections: [
    {
      type: "prose",
      title: "First-Principles Autoregressive Conditioning",
      content:
        "Autoregressive language models factor the joint probability of a token sequence $X = (x_1, x_2, \\dots, x_N)$ via the chain rule of probability: $\\mathbb{P}(X) = \\prod_{i=1}^N \\mathbb{P}(x_i \\mid x_1, \\dots, x_{i-1})$. To maintain this probabilistic factorization across multi-layer transformer architectures without information leakage from future tokens, every attention layer must enforce a strictly lower-triangular dependency graph via causal masking.",
    },
    {
      type: "math_proof",
      title: "Variance Scaling Invariant & Gradient Preservation",
      theorem:
        "For independent query and key vectors $q, k \\in \\mathbb{R}^{d_k}$ with zero mean and unit variance components, the variance of their dot product is $\\text{Var}(q^T k) = d_k$. The scaling factor $\\frac{1}{\\sqrt{d_k}}$ preserves unit variance $\\text{Var}\\left(\\frac{q^T k}{\\sqrt{d_k}}\\right) = 1$, preventing softmax saturation and vanishing gradients.",
      proof:
        "Let $q = (q_1, \\dots, q_{d_k})^T$ and $k = (k_1, \\dots, k_{d_k})^T$, where $\\mathbb{E}[q_a] = \\mathbb{E}[k_b] = 0$, $\\text{Var}(q_a) = \\text{Var}(k_b) = 1$, and all components are mutually independent.\\n\\nThe dot product is $Z = q^T k = \\sum_{a=1}^{d_k} q_a k_a$.\\n\\n1. Expected Value:\\n$$\\mathbb{E}[Z] = \\sum_{a=1}^{d_k} \\mathbb{E}[q_a k_a] = \\sum_{a=1}^{d_k} \\mathbb{E}[q_a]\\mathbb{E}[k_a] = 0$$\\n\\n2. Variance:\\n$$\\text{Var}(Z) = \\sum_{a=1}^{d_k} \\text{Var}(q_a k_a) = \\sum_{a=1}^{d_k} \\left(\\mathbb{E}[(q_a k_a)^2] - (\\mathbb{E}[q_a k_a])^2\\right)$$\\nSince $q_a, k_a$ are independent, $\\mathbb{E}[q_a^2 k_a^2] = \\mathbb{E}[q_a^2]\\mathbb{E}[k_a^2] = 1 \\times 1 = 1$. Thus:\\n$$\\text{Var}(Z) = \\sum_{a=1}^{d_k} 1 = d_k$$\\n\\n3. Scaled Variance:\\nFor any scalar $c > 0$, $\\text{Var}(c Z) = c^2 \\text{Var}(Z) = c^2 d_k$. Setting $c = \\frac{1}{\\sqrt{d_k}}$ yields:\\n$$\\text{Var}\\left(\\frac{q^T k}{\\sqrt{d_k}}\\right) = \\left(\\frac{1}{\\sqrt{d_k}}\\right)^2 d_k = \\frac{d_k}{d_k} = 1$$\\n\\nIf unscaled, as $d_k$ increases (e.g., $d_k = 128$), the standard deviation of logits grows to $\\sqrt{128} \\approx 11.31$. Large magnitude logits push softmax probabilities toward one-hot vectors, where the Jacobian $\\frac{\\partial \\text{softmax}(z)_i}{\\partial z_j} = P_i (\\delta_{ij} - P_j)$ asymptotically approaches zero, completely vanishing the backpropagated gradient.",
    },
    {
      type: "mental_model",
      title: "The Causal Attention Grid & Numerical Stabilization",
      visualIntuition:
        "Visualize an N x N score matrix S. Causal masking replaces the upper triangle with -inf. During row-wise softmax, we subtract the row maximum m_i = max_{j <= i} S_{ij} before computing exp(S_{ij} - m_i) to prevent FP16/FP32 numerical overflow.",
      invariant:
        "Numerical Stability Invariant: max_j (S_{ij} - m_i) = 0.0, ensuring exp(S_{ij} - m_i) in (0, 1] for all valid positions j <= i, and exp(-inf) = 0 for all j > i.",
      stateTransitions:
        "Compute raw logits S = Q K^T / sqrt(d_k) -> Apply additive causal mask M -> Compute row maximum m = max(S + M) -> Subtract maximum S_stable = (S + M) - m -> Exponentiate P_unnorm = exp(S_stable) -> Compute row normalizer l = sum(P_unnorm) -> Normalize P = P_unnorm / l -> Contract O = P V.",
      naiveBottleneck:
        "Computing exp(S_{ij}) without subtracting the row maximum causes exponent overflow in IEEE 754 half-precision (FP16 max value is 65,504; exp(x) overflows for x > 11.09).",
      optimalInsight:
        "Safe softmax subtraction m_i guarantees bounded exponents in [0, 1], guaranteeing numerical stability across all hardware precisions.",
    },
  ],
};
