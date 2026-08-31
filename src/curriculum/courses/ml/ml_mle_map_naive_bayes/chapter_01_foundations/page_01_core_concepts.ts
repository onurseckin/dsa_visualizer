import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_mle_map_naive_bayes_c1_p1",
  pageNumber: 1,
  title: "Likelihood, MAP, Conjugate Priors, & Naive Bayes",
  subtitle: "Frequentist vs Bayesian Estimation, Dirichlet Conjugacy, and Conditional Independence",
  estimatedMinutes: 30,
  sections: [
    {
      type: "prose",
      title: "The Spectrum of Parameter Estimation: MLE to MAP",
      content:
        "Parametric machine learning models are fundamentally parameterized probability distributions $p(x; \\theta)$ (Stanford CS229 / MIT 18.065). Given observed dataset $\\mathcal{D} = \\{x_1, \\dots, x_N\\}$, we distinguish two philosophical frameworks for parameter estimation:\n\n1. **Maximum Likelihood Estimation (MLE - Frequentist)**:\n   Treats $\\theta$ as an unknown fixed constant and maximizes the probability of observing the data:\n   $$\\hat{\\theta}_{\\text{MLE}} = \\arg\\max_\\theta p(\\mathcal{D} \\mid \\theta) = \\arg\\max_\\theta \\sum_{i=1}^N \\ln p(x_i \\mid \\theta)$$\n   - High-data regime ($N \\to \\infty$): Asymptotically unbiased, efficient, and attains the Cramér-Rao lower bound.\n   - Low-data regime: Severely overfits, assigns zero probability to unseen events, and produces extreme parameters.\n\n2. **Maximum A Posteriori (MAP - Bayesian Regularization)**:\n   Treats $\\theta$ as a random variable endowed with a prior distribution $p(\\theta)$. By Bayes' Rule:\n   $$p(\\theta \\mid \\mathcal{D}) = \\frac{p(\\mathcal{D} \\mid \\theta) p(\\theta)}{p(\\mathcal{D})} \\propto p(\\mathcal{D} \\mid \\theta) p(\\theta)$$\n   $$\\hat{\\theta}_{\\text{MAP}} = \\arg\\max_\\theta \\left[ \\sum_{i=1}^N \\ln p(x_i \\mid \\theta) + \\ln p(\\theta) \\right]$$\n   The prior $\\ln p(\\theta)$ acts as an exact analytical regularizer (e.g. Gaussian prior $\\mathcal{N}(0, \\sigma^2) \\iff L_2$ weight decay; Laplace prior $\\iff L_1$ Lasso).\n\n3. **Conjugate Prior Families**:\n   A prior $p(\\theta)$ is **conjugate** to likelihood $p(\\mathcal{D} \\mid \\theta)$ if the posterior $p(\\theta \\mid \\mathcal{D})$ belongs to the exact same parametric distribution family:\n   - **Beta-Binomial**: Bernoulli likelihood with $\\text{Beta}(\\alpha, \\beta)$ prior $\\implies \\text{Beta}(k + \\alpha, n - k + \\beta)$ posterior.\n   - **Dirichlet-Multinomial**: Categorical counts with $\\text{Dir}(\\boldsymbol{\\alpha})$ prior $\\implies \\text{Dir}(\\mathbf{c} + \\boldsymbol{\\alpha})$ posterior (yielding Laplace smoothing).\n   - **Normal-Normal**: Gaussian likelihood with Gaussian prior $\\implies$ Gaussian posterior with summed precisions.\n\n4. **Naive Bayes Classification**:\n   Applies Bayes' theorem under the **conditional independence assumption**: features $x_1, \\dots, x_D$ are mutually independent given class label $y = c$:\n   $$p(x_1, \\dots, x_D \\mid y = c) = \\prod_{d=1}^D p(x_d \\mid y = c)$$\n   Classification decision rule in log-space:\n   $$\\hat{y} = \\arg\\max_c \\left[ \\ln p(y = c) + \\sum_{d=1}^D \\ln p(x_d \\mid y = c) \\right]$$",
    },
    {
      type: "mental_model",
      title: "Bayesian Tug-of-War: Prior vs Empirical Data",
      visualIntuition:
        "Coin Toss Experiment: 3 Heads out of 3 Flips (n=3, k=3):\n\nMLE Estimate: theta_MLE = 3/3 = 1.00 (Predicts Tails is IMPOSSIBLE! Extreme Overfitting)\n\nMAP Estimate with Beta(alpha=2, beta=2) Prior (Weak belief in a fair coin):\n  Posterior: Beta(3 + 2, 0 + 2) = Beta(5, 2)\n  theta_MAP = (5 - 1) / (5 + 2 - 2) = 4/5 = 0.80 (Regularized pull toward 0.5!)\n\nAs Data Grows (n=3000, k=3000):\n  theta_MAP = (3000 + 2 - 1) / (3000 + 2 - 2) = 3001 / 3002 = 0.9997\n  --> As N -> infinity, the data dominates and MAP asymptotically converges to MLE!",
      invariant:
        "Posterior Mode Invariant: theta_MAP = (k + alpha - 1) / (n + alpha + beta - 2). When alpha = beta = 1 (Uniform prior), theta_MAP = theta_MLE = k/n.",
      stateTransitions:
        "Define Prior p(theta) -> Observe Data D -> Compute Posterior p(theta | D) -> Find Mode theta_MAP -> Predict with Log-Space Naive Bayes.",
      naiveBottleneck:
        "Multiplying raw probabilities p(x_1|c) * ... * p(x_D|c) underflows to 0.0 in IEEE 754 floats for D > 30 features.",
      optimalInsight:
        "Transform conditional probability products into log-space sums, using Laplace-smoothed log-likelihood matrices for O(1) vectorized matrix multiplications.",
    },
    {
      type: "math_proof",
      title: "Analytical Derivation of the Beta-Bernoulli MAP Estimator",
      theorem:
        "Let $X_1, \\dots, X_n \\sim \\text{Bernoulli}(\\theta)$ with $k = \\sum_{i=1}^n x_i$ observed successes. Under a conjugate prior $\\theta \\sim \\text{Beta}(\\alpha, \\beta)$ with probability density $p(\\theta) = \\frac{1}{B(\\alpha, \\beta)} \\theta^{\\alpha - 1} (1 - \\theta)^{\\beta - 1}$ (where $\\alpha, \\beta > 1$), the Maximum A Posteriori (MAP) estimator is:\n$$\\hat{\\theta}_{\\text{MAP}} = \\frac{k + \\alpha - 1}{n + \\alpha + \\beta - 2}$$",
      proof:
        "1. Write the likelihood function for $k$ successes in $n$ independent Bernoulli trials:\n   $$p(\\mathcal{D} \\mid \\theta) = \\prod_{i=1}^n \\theta^{x_i} (1 - \\theta)^{1 - x_i} = \\theta^k (1 - \\theta)^{n - k}$$\n2. By Bayes' theorem, the posterior density $p(\\theta \\mid \\mathcal{D})$ is:\n   $$p(\\theta \\mid \\mathcal{D}) \\propto p(\\mathcal{D} \\mid \\theta) p(\\theta) = \\theta^k (1 - \\theta)^{n - k} \\cdot \\theta^{\\alpha - 1} (1 - \\theta)^{\\beta - 1} = \\theta^{k + \\alpha - 1} (1 - \\theta)^{n - k + \\beta - 1}$$\n3. Recognizing the kernel of a Beta distribution, the posterior is $\\text{Beta}(\\alpha' = k + \\alpha, \\beta' = n - k + \\beta)$.\n4. To find the MAP mode $\\hat{\\theta}$, take the natural logarithm of the unnormalized posterior:\n   $$\\ln p(\\theta \\mid \\mathcal{D}) = (k + \\alpha - 1) \\ln \\theta + (n - k + \\beta - 1) \\ln(1 - \\theta) + \\text{const}$$\n5. Differentiate with respect to $\\theta$ and set to zero:\n   $$\\frac{d}{d\\theta} \\ln p(\\theta \\mid \\mathcal{D}) = \\frac{k + \\alpha - 1}{\\theta} - \\frac{n - k + \\beta - 1}{1 - \\theta} = 0$$\n6. Cross-multiply to solve for $\\theta$:\n   $$(k + \\alpha - 1)(1 - \\theta) = (n - k + \\beta - 1)\\theta$$\n   $$(k + \\alpha - 1) - (k + \\alpha - 1)\\theta = (n - k + \\beta - 1)\\theta$$\n   $$(k + \\alpha - 1) = \\left[ (k + \\alpha - 1) + (n - k + \\beta - 1) \\right] \\theta = (n + \\alpha + \\beta - 2) \\theta$$\n7. Dividing through gives:\n   $$\\hat{\\theta}_{\\text{MAP}} = \\frac{k + \\alpha - 1}{n + \\alpha + \\beta - 2}$$\n8. For a flat uninformative prior $\\alpha = \\beta = 1$, this simplifies directly to $\\hat{\\theta}_{\\text{MLE}} = \\frac{k}{n}$. For $\\alpha = \\beta = 2$, this yields Laplace smoothing $\\frac{k + 1}{n + 2}$.",
    },
  ],
};
