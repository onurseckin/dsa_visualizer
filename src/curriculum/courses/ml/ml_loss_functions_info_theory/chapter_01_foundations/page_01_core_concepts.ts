import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_loss_functions_info_theory_c1_p1",
  pageNumber: 1,
  title: "Information Theory & Loss Functions: Entropy to InfoNCE",
  subtitle: "Shannon Entropy, KL Divergence, Gibbs' Inequality, and Contrastive Geometry",
  estimatedMinutes: 30,
  sections: [
    {
      type: "prose",
      title: "Information Theoretic Foundations of Supervised & Self-Supervised Losses",
      content:
        "Loss functions in modern machine learning are rooted in Claude Shannon's Information Theory (Stanford CS336 / MIT 18.065). Rather than measuring arbitrary geometric distances, training a probabilistic model is fundamentally equivalent to minimizing the code length required to compress the empirical data distribution under the model's hypothesized distribution.\n\nWe define the fundamental information-theoretic quantities:\n1. **Self-Information (Surprisal)**: For an event with probability $p(x)$, $I(x) = -\\log_2 p(x)$ bits.\n2. **Shannon Entropy**: The expected surprisal / minimum theoretical code length of distribution $P$:\n   $$H(P) = -\\sum_{x \\in \\mathcal{X}} p(x) \\log p(x) = \\mathbb{E}_{x \\sim P}[-\\log p(x)]$$\n3. **Cross-Entropy**: The expected code length when events sampled from true distribution $P$ are encoded using an optimal code constructed for predicted distribution $Q$:\n   $$H(P, Q) = -\\sum_{x \\in \\mathcal{X}} p(x) \\log q(x) = \\mathbb{E}_{x \\sim P}[-\\log q(x)]$$\n4. **Kullback-Leibler (KL) Divergence (Relative Entropy)**: The excess coding penalty paid for encoding $P$ using $Q$:\n   $$D_{\\text{KL}}(P \\parallel Q) = \\sum_{x \\in \\mathcal{X}} p(x) \\log \\frac{p(x)}{q(x)} = H(P, Q) - H(P)$$\n   Because $H(P)$ is fixed with respect to model parameters, minimizing Cross-Entropy $H(P, Q)$ is mathematically identical to minimizing $D_{\\text{KL}}(P \\parallel Q)$.\n\n5. **Focal Loss (Lin et al., 2017)**: Adds a modulating factor $(1 - p_t)^\\gamma$ to cross-entropy to suppress gradients from easy negatives and focus training on hard class boundaries:\n   $$\\text{FL}(p_t) = -\\alpha_t (1 - p_t)^\\gamma \\log(p_t)$$\n\n6. **InfoNCE Contrastive Loss (Oord et al., 2018)**: Maximizes mutual information $I(X; Y)$ between positive query-key pairs $(q, k_+)$ against $K$ negative distractors $(k_i)$ on a unit hypersphere with temperature hyperparameter $\\tau$:\n   $$\\mathcal{L}_{\\text{InfoNCE}} = -\\log \\frac{\\exp(\\text{sim}(q, k_+) / \\tau)}{\\sum_{i=0}^K \\exp(\\text{sim}(q, k_i) / \\tau)}$$",
    },
    {
      type: "mental_model",
      title: "Entropy, KL Divergence, & Gradient Residual Cancellation",
      visualIntuition:
        "Codebook Length Analogy:\n[ H(P): True Irreducible Information ] + [ D_KL(P || Q): Modeling Imperfection Penalty ]\n=========================================================================\n[                      H(P, Q): Cross-Entropy Loss                      ]\n\nWhy Cross-Entropy + Softmax Eliminates Gradient Vanishing:\n  MSE Loss: L = 0.5 * (sigma(z) - y)^2\n  --> dL/dz = (sigma(z) - y) * sigma(z) * (1 - sigma(z))  <-- Vanishes when sigma(z) -> 0 or 1!\n\n  Softmax Cross-Entropy Loss: L = - log(p_y) = - z_y + log(sum exp(z_j))\n  --> dL/dz_i = p_i - y_i\n  --> Pure linear residual! The log cancels the exponential in softmax,\n      guaranteeing strong constant gradient signals even for severely misclassified samples.",
      invariant:
        "Gibbs' Invariant: D_KL(P || Q) >= 0 with equality iff P = Q almost everywhere. Softmax Cross-Entropy gradient is the exact probability error vector p - y.",
      stateTransitions:
        "Raw Logits z -> Exponentiation exp(z) -> Normalization p = Softmax(z) -> Negative Log-Likelihood -log(p_y) -> Linear Residual Gradient (p - y).",
      naiveBottleneck:
        "Evaluating Cross-Entropy as -sum(y * log(softmax(z))) causes log(0) = -inf underflow when softmax output drops below FP16/FP32 precision.",
      optimalInsight:
        "Evaluate fused LogSoftmax via Log-Sum-Exp trick: log(p_i) = z_i - max(z) - log(sum exp(z_j - max(z))), guaranteeing numerical stability.",
    },
    {
      type: "math_proof",
      title: "Gibbs' Inequality & Softmax Cross-Entropy Gradient Derivation",
      theorem:
        "1. **Gibbs' Inequality**: For any two discrete probability distributions $P$ and $Q$ over $\\mathcal{X}$, the KL divergence is strictly non-negative: $D_{\\text{KL}}(P \\parallel Q) \\ge 0$, with $D_{\\text{KL}}(P \\parallel Q) = 0 \\iff P = Q$.\n2. **Softmax Cross-Entropy Gradient**: For one-hot target $y \\in \\{0, 1\\}^K$ and logits $z \\in \\mathbb{R}^K$, the gradient of loss $\\mathcal{L} = -\\sum_{k=1}^K y_k \\log p_k$ where $p_k = \\frac{\\exp(z_k)}{\\sum_j \\exp(z_j)}$ is:\n$$\\frac{\\partial \\mathcal{L}}{\\partial z_i} = p_i - y_i$$",
      proof:
        "1. **Proof of Gibbs' Inequality**:\n   Using the standard inequality $\\ln x \\le x - 1$ for all $x > 0$, with equality if and only if $x = 1$:\n   $$-D_{\\text{KL}}(P \\parallel Q) = -\\sum_{x \\in \\mathcal{X}} p(x) \\ln \\frac{p(x)}{q(x)} = \\sum_{x \\in \\mathcal{X}} p(x) \\ln \\frac{q(x)}{p(x)}$$\n   Applying the inequality $\\ln(q(x)/p(x)) \\le \\frac{q(x)}{p(x)} - 1$:\n   $$-D_{\\text{KL}}(P \\parallel Q) \\le \\sum_{x \\in \\mathcal{X}} p(x) \\left( \\frac{q(x)}{p(x)} - 1 \\right) = \\sum_{x \\in \\mathcal{X}} q(x) - \\sum_{x \\in \\mathcal{X}} p(x) = 1 - 1 = 0$$\n   Multiplying by $-1$ flips the inequality: $D_{\\text{KL}}(P \\parallel Q) \\ge 0$.\n   Equality holds if and only if $\\frac{q(x)}{p(x)} = 1$ for all $x$, i.e., $P = Q$.\n\n2. **Proof of Softmax Cross-Entropy Gradient**:\n   Rewrite the cross-entropy loss by substituting $p_k = \\frac{\\exp(z_k)}{\\sum_j \\exp(z_j)}$:\n   $$\\mathcal{L} = -\\sum_{k=1}^K y_k \\left( z_k - \\ln \\sum_{j=1}^K \\exp(z_j) \\right) = -\\sum_{k=1}^K y_k z_k + \\left( \\sum_{k=1}^K y_k \\right) \\ln \\sum_{j=1}^K \\exp(z_j)$$\n   Since $y$ is a probability distribution (or one-hot vector), $\\sum_{k=1}^K y_k = 1$:\n   $$\\mathcal{L} = -\\sum_{k=1}^K y_k z_k + \\ln \\sum_{j=1}^K \\exp(z_j)$$\n   Differentiating with respect to logit $z_i$:\n   $$\\frac{\\partial \\mathcal{L}}{\\partial z_i} = -y_i + \\frac{1}{\\sum_{j=1}^K \\exp(z_j)} \\cdot \\frac{\\partial}{\\partial z_i} \\left( \\sum_{j=1}^K \\exp(z_j) \\right) = -y_i + \\frac{\\exp(z_i)}{\\sum_{j=1}^K \\exp(z_j)} = p_i - y_i$$\n   This proves that the backward gradient is the exact prediction error vector $p - y$.",
    },
  ],
};
