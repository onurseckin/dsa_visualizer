import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_sampling_top_p_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Entropy Monotonicity & Gumbel-Softmax Limit",
  subtitle: "Thermodynamic Entropy Scaling and Gumbel-Softmax Convergence Theorems",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "Monotonicity of Shannon Entropy with Temperature Scaling",
      theorem:
        "Let $z \\in \\mathbb{R}^V$ be a fixed non-constant logit vector, and let $p_i(T) = \\frac{\\exp(z_i / T)}{\\sum_{j=1}^V \\exp(z_j / T)}$ be the temperature-scaled Boltzmann distribution. The Shannon entropy $H(T) = -\\sum_{i=1}^V p_i(T) \\ln p_i(T)$ is a strictly monotonically increasing function of temperature $T > 0$ ($\\frac{dH}{dT} > 0$).",
      proof:
        "1. Define the free energy / log-partition function $A(T) = \\ln \\sum_{j=1}^V \\exp(z_j / T)$.\n2. Note that $\\ln p_i(T) = \\frac{z_i}{T} - A(T)$. The entropy can be expressed as:\n   $$H(T) = -\\sum_{i=1}^V p_i(T) \\left( \\frac{z_i}{T} - A(T) \\right) = -\\frac{1}{T} \\mathbb{E}_{p(T)}[z] + A(T)$$\n3. Differentiate $H(T)$ with respect to $T$ using the product rule:\n   $$\\frac{dH}{dT} = \\frac{1}{T^2} \\mathbb{E}_{p(T)}[z] - \\frac{1}{T} \\frac{d}{dT} \\mathbb{E}_{p(T)}[z] + \\frac{dA}{dT}$$\n4. Compute the derivative of $A(T)$:\n   $$\\frac{dA}{dT} = \\frac{1}{\\sum_{j=1}^V \\exp(z_j / T)} \\sum_{j=1}^V \\exp(z_j / T) \\left( -\\frac{z_j}{T^2} \\right) = -\\frac{1}{T^2} \\mathbb{E}_{p(T)}[z]$$\n5. Notice that $\\frac{1}{T^2} \\mathbb{E}_{p(T)}[z]$ cancels out with $\\frac{dA}{dT}$ identically!\n   $$\\frac{dH}{dT} = -\\frac{1}{T} \\frac{d}{dT} \\mathbb{E}_{p(T)}[z]$$\n6. Differentiate $\\mathbb{E}_{p(T)}[z] = \\sum_{i=1}^V z_i p_i(T)$ with respect to $T$:\n   $$\\frac{d}{dT} p_i(T) = p_i(T) \\left( -\\frac{z_i}{T^2} + \\frac{1}{T^2} \\mathbb{E}[z] \\right) = -\\frac{1}{T^2} p_i(T) (z_i - \\mathbb{E}[z])$$\n   $$\\frac{d}{dT} \\mathbb{E}_{p(T)}[z] = -\\frac{1}{T^2} \\sum_{i=1}^V z_i p_i(T) (z_i - \\mathbb{E}[z]) = -\\frac{1}{T^2} \\text{Var}_{p(T)}(z)$$\n7. Substitute this back into the entropy derivative:\n   $$\\frac{dH}{dT} = -\\frac{1}{T} \\left( -\\frac{1}{T^2} \\text{Var}_{p(T)}(z) \\right) = \\frac{1}{T^3} \\text{Var}_{p(T)}(z)$$\n8. Since $z$ is not constant and $T > 0$, the variance $\\text{Var}_{p(T)}(z) > 0$. Therefore, $\\frac{dH}{dT} = \\frac{\\text{Var}_{p(T)}(z)}{T^3} > 0$, proving that entropy increases strictly monotonically with temperature.",
    },
    {
      type: "math_proof",
      title: "Convergence of Gumbel-Softmax Continuous Relaxation",
      theorem:
        "Let $y_i(\\tau) = \\frac{\\exp((z_i + g_i) / \\tau)}{\\sum_{j=1}^V \\exp((z_j + g_j) / \\tau)}$ be the Gumbel-Softmax relaxation with temperature $\\tau > 0$, where $g_i \\sim \\text{Gumbel}(0, 1)$. As temperature $\\tau \\to 0^+$, the random vector $y(\\tau)$ converges almost surely to the one-hot categorical indicator vector $e_{k^*}$ where $k^* = \\arg\\max_i (z_i + g_i)$.",
      proof:
        "1. Let $k^* = \\arg\\max_{i} (z_i + g_i)$. Because standard Gumbel variables are continuous random variables, the probability of a tie $(z_i + g_i = z_j + g_j)$ is 0.\n2. Therefore, there exists a strictly positive gap $\\delta = (z_{k^*} + g_{k^*}) - \\max_{j \\ne k^*} (z_j + g_j) > 0$.\n3. For the winning index $k^*$, divide numerator and denominator of $y_{k^*}(\\tau)$ by $\\exp((z_{k^*} + g_{k^*}) / \\tau)$:\n   $$y_{k^*}(\\tau) = \\frac{1}{1 + \\sum_{j \\ne k^*} \\exp\\left( -\\frac{(z_{k^*} + g_{k^*}) - (z_j + g_j)}{\\tau} \\right)}$$\n4. For every $j \\ne k^*$, the exponent is at most $-\\delta / \\tau < 0$. As $\\tau \\to 0^+$, $-\\delta / \\tau \\to -\\infty$, so $\\exp(-\\delta / \\tau) \\to 0$.\n5. Therefore, $\\lim_{\\tau \\to 0^+} y_{k^*}(\\tau) = \\frac{1}{1 + 0} = 1$.\n6. For any losing index $j \\ne k^*$, $\\lim_{\\tau \\to 0^+} y_j(\\tau) = 0$.\n7. Hence $\\lim_{\\tau \\to 0^+} y(\\tau) = e_{k^*}$ almost surely, establishing that Gumbel-Softmax is an asymptotically exact smooth surrogate for discrete categorical sampling.",
    },
  ],
};

export const page2 = page_02_math_proofs;
