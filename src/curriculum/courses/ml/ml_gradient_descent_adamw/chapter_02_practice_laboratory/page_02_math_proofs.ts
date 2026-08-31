import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_gradient_descent_adamw_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Bias Correction & Weight Decay Inequivalence",
  subtitle: "Analytical Proofs of EMA Unbiasing and L2-Decoupled Non-Equivalence",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "Exponential Moving Average (EMA) Initialization Bias Correction Proof",
      theorem:
        "Let sequence $m_t = \\beta_1 m_{t-1} + (1 - \\beta_1) g_t$ with initial condition $m_0 = 0$. Under the assumption that the underlying gradients $g_i$ have stationary expectation $\\mathbb{E}[g_i] = \\mathbb{E}[g_t]$ for all $1 \\le i \\le t$, the uncorrected estimator $m_t$ has expectation $\\mathbb{E}[m_t] = \\mathbb{E}[g_t](1 - \\beta_1^t)$. Thus, the unbiased estimator is $\\hat{m}_t = \\frac{m_t}{1 - \\beta_1^t}$.",
      proof:
        "1. Unroll the recursive definition of $m_t$:\n   $$m_1 = (1 - \\beta_1) g_1$$\n   $$m_2 = \\beta_1 m_1 + (1 - \\beta_1) g_2 = \\beta_1 (1 - \\beta_1) g_1 + (1 - \\beta_1) g_2$$\n   $$m_t = (1 - \\beta_1) \\sum_{i=1}^t \\beta_1^{t - i} g_i$$\n2. Take mathematical expectation on both sides:\n   $$\\mathbb{E}[m_t] = \\mathbb{E}\\left[ (1 - \\beta_1) \\sum_{i=1}^t \\beta_1^{t - i} g_i \\right] = (1 - \\beta_1) \\sum_{i=1}^t \\beta_1^{t - i} \\mathbb{E}[g_i]$$\n3. Assuming stationary expectation $\\mathbb{E}[g_i] = \\mathbb{E}[g_t]$:\n   $$\\mathbb{E}[m_t] = \\mathbb{E}[g_t] (1 - \\beta_1) \\sum_{i=1}^t \\beta_1^{t - i}$$\n4. The sum is a finite geometric series $\\sum_{j=0}^{t-1} \\beta_1^j = \\frac{1 - \\beta_1^t}{1 - \\beta_1}$:\n   $$\\mathbb{E}[m_t] = \\mathbb{E}[g_t] (1 - \\beta_1) \\cdot \\frac{1 - \\beta_1^t}{1 - \\beta_1} = \\mathbb{E}[g_t] (1 - \\beta_1^t)$$\n5. For small $t$, $1 - \\beta_1^t \\ll 1$ (e.g. for $\\beta_1 = 0.9$ and $t=1$, $1 - 0.9^1 = 0.1$, so $m_1$ is 10x too small). Dividing by $1 - \\beta_1^t$ yields $\\mathbb{E}[\\hat{m}_t] = \\mathbb{E}[g_t]$ for all $t \\ge 1$.\n6. The exact identical proof applies to the second raw moment $v_t = \\beta_2 v_{t-1} + (1-\\beta_2) g_t^2$ yielding $\\hat{v}_t = \\frac{v_t}{1 - \\beta_2^t}$.",
    },
    {
      type: "math_proof",
      title: "Non-Equivalence of L2 Regularization and Weight Decay in Adaptive Optimizers",
      theorem:
        "For standard SGD with constant step size, $L_2$ regularization $\\mathcal{L}(\\theta) + \\frac{\\lambda}{2} \\|\\theta\\|^2$ is mathematically identical to weight decay. For adaptive gradient optimizers (Adam, RMSProp), $L_2$ regularization is strictly NOT equivalent to weight decay, because $L_2$ regularization scales the decay rate inversely with the historical gradient magnitude $\\sqrt{v_t}$.",
      proof:
        "1. In standard SGD, adding $L_2$ penalty modifies the gradient: $\\tilde{g}_t = \\nabla \\mathcal{L}(\\theta_t) + \\lambda \\theta_t$.\n2. The parameter update is:\n   $$\\theta_{t+1} = \\theta_t - \\eta \\tilde{g}_t = \\theta_t - \\eta \\nabla \\mathcal{L}(\\theta_t) - \\eta \\lambda \\theta_t = (1 - \\eta \\lambda) \\theta_t - \\eta \\nabla \\mathcal{L}(\\theta_t)$$\n   This is identical to weight decay with rate $\\lambda$.\n3. In standard Adam with $L_2$ regularization, the regularized gradient $\\tilde{g}_t = g_t + \\lambda \\theta_t$ is tracked inside the moments:\n   $$\\tilde{m}_t = \\beta_1 \\tilde{m}_{t-1} + (1 - \\beta_1) (g_t + \\lambda \\theta_t)$$\n   $$\\tilde{v}_t = \\beta_2 \\tilde{v}_{t-1} + (1 - \\beta_2) (g_t + \\lambda \\theta_t)^2$$\n4. The resulting update step is:\n   $$\\theta_{t+1} = \\theta_t - \\frac{\\eta}{\\sqrt{\\hat{\\tilde{v}}_t} + \\epsilon} \\hat{\\tilde{m}}_t$$\n5. Approximating the effective decay term for a parameter with small gradient $g_t \\approx 0$:\n   $$\\Delta \\theta_{\\text{decay}} \\approx - \\frac{\\eta \\lambda \\theta_t}{\\sqrt{\\lambda^2 \\theta_t^2} + \\epsilon} = - \\eta \\cdot \\text{sign}(\\theta_t)$$\n   The effective decay is independent of $\\theta_t$'s magnitude and acts like $L_1$ regularization!\n6. Conversely, for parameters with very large gradients ($g_t^2 \\gg 1$), $\\sqrt{\\tilde{v}_t} \\gg 1$, which suppresses the decay rate to near zero ($\\Delta \\theta_{\\text{decay}} \\propto \\frac{\\lambda \\theta_t}{|g_t|}$).\n7. In contrast, AdamW applies true decoupled weight decay $\\theta_{t+1} = (1 - \\eta \\lambda) \\theta_t - \\frac{\\eta}{\\sqrt{\\hat{v}_t} + \\epsilon} \\hat{m}_t$, restoring uniform regularization across all coordinates.",
    },
  ],
};

export const page2 = page_02_math_proofs;
