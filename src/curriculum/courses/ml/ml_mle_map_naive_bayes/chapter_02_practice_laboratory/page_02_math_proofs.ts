import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_mle_map_naive_bayes_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Dirichlet MAP & Gaussian NB to Logistic Equivalence",
  subtitle: "Dirichlet-Multinomial Smoothing and Linear Boundary Derivations",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "Dirichlet-Multinomial MAP Estimation (Laplace Add-Alpha Smoothing)",
      theorem:
        "Let word counts $\\mathbf{x} = (x_1, \\dots, x_V)$ follow a Multinomial distribution $\\text{Multinomial}(n, \\boldsymbol{\\theta})$ with parameter vector $\\boldsymbol{\\theta} = (\\theta_1, \\dots, \\theta_V)$ on the simplex $\\sum_{v=1}^V \\theta_v = 1$. Under a symmetric Dirichlet conjugate prior $\\boldsymbol{\\theta} \\sim \\text{Dir}(\\alpha, \\dots, \\alpha)$ with prior density $p(\\boldsymbol{\\theta}) \\propto \\prod_{v=1}^V \\theta_v^{\\alpha - 1}$, the Maximum A Posteriori (MAP) probability estimator is:\n$$\\hat{\\theta}_{v, \\text{MAP}} = \\frac{x_v + \\alpha - 1}{\\sum_{j=1}^V x_j + V(\\alpha - 1)}$$",
      proof:
        "1. The multinomial likelihood of observed counts $\\mathbf{x}$ is $p(\\mathbf{x} \\mid \\boldsymbol{\\theta}) = \\frac{n!}{\\prod x_v!} \\prod_{v=1}^V \\theta_v^{x_v}$.\n2. By Bayes' theorem, the posterior density is:\n   $$p(\\boldsymbol{\\theta} \\mid \\mathbf{x}) \\propto \\prod_{v=1}^V \\theta_v^{x_v} \\cdot \\prod_{v=1}^V \\theta_v^{\\alpha - 1} = \\prod_{v=1}^V \\theta_v^{x_v + \\alpha - 1}$$\n3. Recognizing the kernel of a Dirichlet distribution, the posterior is $\\text{Dir}(x_1 + \\alpha, \\dots, x_V + \\alpha)$.\n4. To find the MAP mode on the probability simplex $\\sum_{v=1}^V \\theta_v = 1$, construct the Lagrangian with multiplier $\\lambda$:\n   $$\\mathcal{L}(\\boldsymbol{\\theta}, \\lambda) = \\sum_{v=1}^V (x_v + \\alpha - 1) \\ln \\theta_v - \\lambda \\left( \\sum_{v=1}^V \\theta_v - 1 \\right)$$\n5. Differentiate with respect to $\\theta_v$ and set to zero:\n   $$\\frac{\\partial \\mathcal{L}}{\\partial \\theta_v} = \\frac{x_v + \\alpha - 1}{\\theta_v} - \\lambda = 0 \\implies \\theta_v = \\frac{x_v + \\alpha - 1}{\\lambda}$$\n6. Summing over all $v \\in \\{1, \\dots, V\\}$ and enforcing $\\sum_{v=1}^V \\theta_v = 1$:\n   $$1 = \\sum_{v=1}^V \\frac{x_v + \\alpha - 1}{\\lambda} = \\frac{\\sum_{v=1}^V x_v + V(\\alpha - 1)}{\\lambda} \\implies \\lambda = \\sum_{v=1}^V x_v + V(\\alpha - 1)$$\n7. Substituting $\\lambda$ back yields the exact MAP estimate $\\hat{\\theta}_{v, \\text{MAP}} = \\frac{x_v + \\alpha - 1}{\\sum_{j=1}^V x_j + V(\\alpha - 1)}$.\n8. When $\\alpha = 2$ (prior pseudo-count of 1 for all vocabulary words), this produces standard Laplace Add-1 smoothing: $\\hat{\\theta}_v = \\frac{x_v + 1}{n + V}$.",
    },
    {
      type: "math_proof",
      title: "Gaussian Naive Bayes with Shared Variance Equivalence to Logistic Regression",
      theorem:
        "For binary classification $y \\in \\{0, 1\\}$ with continuous features $x \\in \\mathbb{R}^D$, if each feature is modeled as Gaussian $x_d \\mid y=c \\sim \\mathcal{N}(\\mu_{c, d}, \\sigma_d^2)$ with class-independent shared variances $\\sigma_d^2$, the posterior class probability $P(y=1 \\mid x)$ is an exact Logistic Sigmoid function $P(y=1 \\mid x) = \\sigma(w^T x + b)$.",
      proof:
        "1. By Bayes' theorem, the posterior log-odds ratio is:\n   $$\\ln \\frac{P(y=1 \\mid x)}{P(y=0 \\mid x)} = \\ln \\frac{P(y=1) \\prod_{d=1}^D p(x_d \\mid y=1)}{P(y=0) \\prod_{d=1}^D p(x_d \\mid y=0)} = \\ln \\frac{P(y=1)}{P(y=0)} + \\sum_{d=1}^D \\ln \\frac{p(x_d \\mid y=1)}{p(x_d \\mid y=0)}$$\n2. Substitute the 1D Gaussian density formulas with shared variance $\\sigma_d^2$:\n   $$\\ln \\frac{p(x_d \\mid y=1)}{p(x_d \\mid y=0)} = \\ln \\left( \\frac{\\frac{1}{\\sqrt{2\\pi\\sigma_d^2}} \\exp\\left( -\\frac{(x_d - \\mu_{1, d})^2}{2\\sigma_d^2} \\right)}{\\frac{1}{\\sqrt{2\\pi\\sigma_d^2}} \\exp\\left( -\\frac{(x_d - \\mu_{0, d})^2}{2\\sigma_d^2} \\right)} \\right) = -\\frac{(x_d - \\mu_{1, d})^2}{2\\sigma_d^2} + \\frac{(x_d - \\mu_{0, d})^2}{2\\sigma_d^2}$$\n3. Expanding the quadratic terms:\n   $$= \\frac{-(x_d^2 - 2 x_d \\mu_{1, d} + \\mu_{1, d}^2) + (x_d^2 - 2 x_d \\mu_{0, d} + \\mu_{0, d}^2)}{2\\sigma_d^2} = \\left( \\frac{\\mu_{1, d} - \\mu_{0, d}}{\\sigma_d^2} \\right) x_d - \\frac{\\mu_{1, d}^2 - \\mu_{0, d}^2}{2\\sigma_d^2}$$\n4. Notice that the quadratic term $x_d^2$ cancels out identically because variances are shared!\n5. Summing over all $d=1..D$, the log-odds is linear in $x$: $\\ln \\frac{P(y=1 \\mid x)}{P(y=0 \\mid x)} = w^T x + b$, where $w_d = \\frac{\\mu_{1, d} - \\mu_{0, d}}{\\sigma_d^2}$ and $b = \\ln \\frac{P(y=1)}{P(y=0)} - \\sum_{d=1}^D \\frac{\\mu_{1, d}^2 - \\mu_{0, d}^2}{2\\sigma_d^2}$.\n6. Applying the logistic sigmoid transformation $\\sigma(a) = \\frac{1}{1 + e^{-a}}$ establishes $P(y=1 \\mid x) = \\sigma(w^T x + b)$, proving linear decision boundaries.",
    },
  ],
};
