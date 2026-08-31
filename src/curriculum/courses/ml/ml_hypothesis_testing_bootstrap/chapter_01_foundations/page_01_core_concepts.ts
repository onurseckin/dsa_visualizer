import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_hypothesis_testing_bootstrap_c1_p1",
  pageNumber: 1,
  title: "Hypothesis Testing, Bootstrap Resampling, & FDR Control",
  subtitle:
    "Frequentist Hypothesis Tests, Non-Parametric Bootstrap, and Multiple Testing Corrections",
  estimatedMinutes: 30,
  sections: [
    {
      type: "prose",
      title: "Statistical Inference & Rigorous Model Evaluation",
      content:
        "Evaluating whether a new machine learning model (e.g. LLM fine-tune) statistically outperforms a baseline requires rigorous statistical hypothesis testing (Stanford CS229 / CS336). Point metric comparisons (e.g., accuracy $88.2\\%$ vs $87.9\\%$) are meaningless without quantifying sampling variance and bounding decision error probabilities.\n\nKey foundational pillars of hypothesis testing:\n1. **Hypothesis Formulation & Error Matrix**:\n   - Null Hypothesis $H_0$: There is no true difference between distributions ($F_A = F_B$).\n   - Alternative Hypothesis $H_1$: A statistically significant difference exists ($F_A \\ne F_B$).\n   - **Type I Error ($\\alpha$)**: False Positive — Rejecting $H_0$ when $H_0$ is true (significance level, typically $\\alpha = 0.05$).\n   - **Type II Error ($\\beta$)**: False Negative — Failing to reject $H_0$ when $H_1$ is true.\n   - **Statistical Power ($1 - \\beta$)**: Probability of correctly detecting a true effect.\n2. **p-Value**: The probability, under the assumption that $H_0$ is true, of observing a test statistic as extreme as or more extreme than the empirical value $t_{\\text{obs}}$:\n   $$p = P(T(X) \\ge t_{\\text{obs}} \\mid H_0)$$\n3. **Non-Parametric Bootstrap (Bradley Efron, 1979)**:\n   When data distributions are non-Gaussian or sample sizes are finite, parametric t-tests fail. The bootstrap replaces the unknown population distribution $F$ with the empirical distribution $\\hat{F}_n = \\frac{1}{n} \\sum_{i=1}^n \\delta_{x_i}$. By drawing $B$ resamples with replacement $\\mathbf{x}^{*(b)} \\sim \\hat{F}_n$, we evaluate empirical standard errors and percentile confidence intervals $[q_{\\alpha/2}, q_{1-\\alpha/2}]$ with zero parametric distribution assumptions.\n4. **Multiple Testing & False Discovery Rate (FDR)**:\n   When testing $M$ parallel hypotheses (e.g., evaluating model performance across 100 sub-tasks):\n   - **Bonferroni Correction (FWER)**: Controls family-wise error rate $P(\\ge 1 \\text{ false positive}) \\le \\alpha$ by testing each hypothesis at $\\alpha' = \\alpha / M$. Severe statistical power loss for large $M$.\n   - **Benjamini-Hochberg Procedure (FDR)**: Controls the expected proportion of false discoveries $\\text{FDR} = \\mathbb{E}[V / R \\mid R > 0] \\le q^*$ by ranking p-values $p_{(1)} \\le \\dots \\le p_{(M)}$ and finding threshold $k = \\max \\{i \\mid p_{(i)} \\le \\frac{i}{M} q^*\\}$.",
    },
    {
      type: "mental_model",
      title: "The Bootstrap Sampling Universe & Multiple Hypothesis Discovery",
      visualIntuition:
        "True Population F (Unknown)  ---> Sample Data x_1..x_n (Empirical CDF F_n)\n                                        |\n                               +--------+--------+\n                               | (Resample with  |\n                               |  replacement)   |\n                               v                 v\n                          Sample x*_(1)     Sample x*_(B)\n                               |                 |\n                               v                 v\n                          Stat theta*_(1)   Stat theta*_(B)\n                                        |\n                                        v\n                   Empirical Distribution of theta* (Quantiles -> 95% CI)\n\nBenjamini-Hochberg FDR Threshold:\n  p-value ^\n          |      * (p_3)\n          |     * (p_2)     / (Linear threshold: (i / M) * q*)\n          |    * (p_1)    /\n          |              /\n          +-------------+---------------------> Rank i\n                        k (Cutoff: Reject all H_1..H_k!)",
      invariant:
        "Bootstrap Plug-in Principle: Var_F(theta(X)) approx Var_{F_n}(theta(X*)). Under H_0, p-values are uniformly distributed U(0, 1).",
      stateTransitions:
        "Collect Model Evaluation Scores -> Form Empirical Distribution -> Draw B Bootstrap Replicates -> Extract Percentile CI -> Apply BH FDR Control.",
      naiveBottleneck:
        "Running uncorrected hypothesis tests at alpha=0.05 across 100 benchmark tasks yields 1 - (1-0.05)^100 = 99.4% probability of at least one false discovery.",
      optimalInsight:
        "Benjamini-Hochberg FDR control adapts the significance threshold dynamically with sample evidence, maximizing discovery power while bounding false positive rates.",
    },
    {
      type: "math_proof",
      title: "Glivenko-Cantelli Theorem & Bonferroni Union Bound",
      theorem:
        "1. **Glivenko-Cantelli Theorem (Fundamental Theorem of Statistics)**: Let $X_1, X_2, \\dots, X_n$ be i.i.d. random variables with cumulative distribution function $F(x)$. Let $\\hat{F}_n(x) = \\frac{1}{n} \\sum_{i=1}^n \\mathbf{1}_{\\{X_i \\le x\\}}$ be the empirical distribution. Then $\\hat{F}_n$ converges uniformly to $F$ almost surely:\n   $$\\lim_{n \\to \\infty} \\sup_{x \\in \\mathbb{R}} |\\hat{F}_n(x) - F(x)| = 0 \\quad \\text{almost surely}$$\n2. **Bonferroni Inequality (FWER Control)**: For $M$ null hypotheses $H_1, \\dots, H_M$ tested at individual significance levels $\\alpha_i = \\alpha / M$, the Family-Wise Error Rate is bounded by $\\alpha$:\n   $$\\text{FWER} = P\\left( \\bigcup_{i=1}^M \\{ \\text{Reject } H_i \\mid H_i \\text{ is True} \\} \\right) \\le \\alpha$$",
      proof:
        "1. **Proof of Glivenko-Cantelli**:\n   For any fixed $x$, the indicator $\\mathbf{1}_{\\{X_i \\le x\\}}$ is an i.i.d. Bernoulli random variable with expectation $\\mathbb{E}[\\mathbf{1}_{\\{X_i \\le x\\}}] = P(X_i \\le x) = F(x)$.\n   By the Strong Law of Large Numbers (SLLN), $\\hat{F}_n(x) = \\frac{1}{n} \\sum_{i=1}^n \\mathbf{1}_{\\{X_i \\le x\\}} \\xrightarrow{a.s.} F(x)$ pointwise for any fixed $x$.\n   To establish uniform convergence, partition the real line into $k$ intervals using quantiles $x_j = \\inf \\{ x \\mid F(x) \\ge j/k \\}$ for $j=1,\\dots,k-1$.\n   For any $x \\in [x_{j-1}, x_j]$, monotonicity of CDFs yields:\n   $$\\hat{F}_n(x) - F(x) \\le \\hat{F}_n(x_j) - F(x_{j-1}) = \\hat{F}_n(x_j) - F(x_j) + \\frac{1}{k}$$\n   $$\\hat{F}_n(x) - F(x) \\ge \\hat{F}_n(x_{j-1}) - F(x_j) = \\hat{F}_n(x_{j-1}) - F(x_{j-1}) - \\frac{1}{k}$$\n   Taking the supremum over all $x$ and the limit $n \\to \\infty$ yields $\\limsup_{n \\to \\infty} \\sup_x |\\hat{F}_n(x) - F(x)| \\le \\frac{1}{k}$. Since $k$ is arbitrary, taking $k \\to \\infty$ establishes uniform almost-sure convergence.\n\n2. **Proof of Bonferroni Inequality**:\n   Let $E_i$ denote the event of making a Type I error on hypothesis $i$ (rejecting $H_i$ when $H_i$ is true), so $P(E_i) \\le \\alpha_i$.\n   The event of making at least one Type I error across all $M$ tests is the union $\\bigcup_{i=1}^M E_i$.\n   By Boole's inequality (subadditivity of probability measures):\n   $$P\\left( \\bigcup_{i=1}^M E_i \\right) \\le \\sum_{i=1}^M P(E_i) \\le \\sum_{i=1}^M \\alpha_i = \\sum_{i=1}^M \\frac{\\alpha}{M} = M \\cdot \\frac{\\alpha}{M} = \\alpha$$\n   This proves that individual significance threshold $\\alpha/M$ strictly bounds the family-wise false positive probability to at most $\\alpha$.",
    },
  ],
};
