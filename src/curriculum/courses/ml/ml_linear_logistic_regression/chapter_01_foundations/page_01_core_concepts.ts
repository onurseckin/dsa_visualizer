import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_linear_logistic_regression_c1_p1",
  pageNumber: 1,
  title: "Linear & Logistic Regression: OLS, Regularization, & IRLS",
  subtitle:
    "Orthogonal Projections, Gauss-Markov Optimality, Lasso Proximal Operators, and Newton-Raphson IRLS",
  estimatedMinutes: 30,
  sections: [
    {
      type: "prose",
      title: "The Geometric Foundations of Linear & Generalized Linear Models",
      content:
        "Linear and Logistic Regression form the bedrock of statistical machine learning (Stanford CS229 / MIT 18.065). Given design matrix $X \\in \\mathbb{R}^{N \\times D}$ and response vector $y \\in \\mathbb{R}^N$:\n\n1. **Ordinary Least Squares (OLS)**:\n   Assumes $y = X w + \\epsilon$ with $\\mathbb{E}[\\epsilon] = 0$ and $\\text{Cov}(\\epsilon) = \\sigma^2 I_N$. Minimizing residual sum of squares $\\|y - X w\\|_2^2$ yields the **Normal Equations**:\n   $$X^T X w = X^T y \\implies \\hat{w}_{\\text{OLS}} = (X^T X)^{-1} X^T y$$\n   The fitted predictions $\\hat{y} = X \\hat{w} = P y$ are the orthogonal projection of $y$ onto the column space $\\text{col}(X)$ via the **Hat Matrix** $P = X (X^T X)^{-1} X^T$ ($P^2 = P, P^T = P$).\n\n2. **Ridge Regression (Tikhonov $L_2$ Regularization)**:\n   $$\\min_w \\|y - X w\\|_2^2 + \\lambda \\|w\\|_2^2 \\implies \\hat{w}_{\\text{Ridge}} = (X^T X + \\lambda I_D)^{-1} X^T y$$\n   Adds $\\lambda > 0$ to all eigenvalues of $X^T X$, regularizing ill-conditioned matrices and shrinking weights smoothly.\n\n3. **Lasso Regression ($L_1$ Sparsity & Proximal Gradient)**:\n   $$\\min_w \\frac{1}{2} \\|y - X w\\|_2^2 + \\lambda \\|w\\|_1$$\n   The non-smooth $L_1$ penalty induces exact zero coefficients. Under coordinate descent with orthogonal features, the exact closed-form update is given by the **Soft-Thresholding Operator** $\\mathcal{S}_\\lambda(v) = \\text{sgn}(v) \\max(0, |v| - \\lambda)$.\n\n4. **Logistic Regression & IRLS (Newton-Raphson)**:\n   Models binary probabilities $p_i = P(y_i = 1 \\mid x_i) = \\sigma(w^T x_i) = \\frac{1}{1 + e^{-w^T x_i}}$.\n   Minimizing negative log-likelihood $\\mathcal{L}(w) = -\\sum [y_i \\ln p_i + (1-y_i) \\ln(1-p_i)]$:\n   - Gradient: $g(w) = X^T (p - y) \\in \\mathbb{R}^D$\n   - Hessian: $H(w) = X^T W X \\in \\mathbb{R}^{D \\times D}$ where $W = \\text{diag}(p_i(1-p_i))$\n   - **Iteratively Reweighted Least Squares (IRLS)** update:\n     $$w_{t+1} = (X^T W_t X)^{-1} X^T W_t z_t \\quad \\text{where } z_t = X w_t + W_t^{-1} (y - p_t)$$",
    },
    {
      type: "mental_model",
      title: "Orthogonal Projections & L1 Diamond vs L2 Sphere Geometry",
      visualIntuition:
        "OLS Orthogonal Projection in R^N:\n           y (Target Vector in R^N)\n          /|\n         / |  e = (I - P)y (Residual vector orthogonal to col(X))\n        /  |\n       +---+-----> col(X) (Subspace spanned by features)\n         y_hat = P y = X w_hat\n\nL1 (Lasso) vs L2 (Ridge) Regularization Contours in Weight Space:\n     w_2 ^                  w_2 ^\n         |   /\\                 |   ***\n         |  /  \\ (L1 Diamond)   |  *   * (L2 Sphere)\n         | /    \\               | *     *\n   ------+-------+--> w_1 ------+---------+--> w_1\n         | \\    /               | *     *\n         |  \\  /                |  *   *\n         |   \\/                 |   ***\n  Loss contours hit the Sharp Corners of the L1 diamond on coordinate axes -> Exact Sparsity (w_2 = 0)!\n  Loss contours hit smooth tangent points of L2 sphere -> Small non-zero weights.",
      invariant:
        "Gauss-Markov Invariant: OLS estimator w_hat has minimal variance among all linear unbiased estimators. Hat matrix is symmetric idempotent: P^T = P, P^2 = P.",
      stateTransitions:
        "Raw Features X -> Standardize Features -> Compute Normal Equations / Iterative IRLS -> Extract Sparse/Regularized Weights -> Predict Class Probabilities.",
      naiveBottleneck:
        "Inverting X^T X directly when features are collinear (kappa > 10^8) causes numerical explosion and wild weight oscillations.",
      optimalInsight:
        "Use Ridge regularization (X^T X + lambda I) or Cholesky factorization of the Hessian (X^T W X = L L^T) to guarantee numerical stability and quadratic convergence.",
    },
    {
      type: "math_proof",
      title: "Gauss-Markov Theorem & Soft-Thresholding Derivation",
      theorem:
        "1. **Gauss-Markov Theorem**: Under the linear regression model $y = X w + \\epsilon$ with $\\mathbb{E}[\\epsilon] = 0$ and $\\text{Cov}(\\epsilon) = \\sigma^2 I_N$, the OLS estimator $\\hat{w} = (X^T X)^{-1} X^T y$ is the Best Linear Unbiased Estimator (BLUE): for any arbitrary unbiased linear estimator $\\tilde{w} = C y$, the covariance difference $\\text{Cov}(\\tilde{w}) - \\text{Cov}(\\hat{w})$ is positive semi-definite.\n2. **Lasso Soft-Thresholding Operator**: For the 1D objective $\\min_w \\frac{1}{2} (w - v)^2 + \\lambda |w|$, the unique global minimizer is given by $\\hat{w} = \\mathcal{S}_\\lambda(v) = \\text{sgn}(v) \\max(0, |v| - \\lambda)$.",
      proof:
        "1. **Proof of Gauss-Markov Theorem**:\n   Let $\\tilde{w} = C y$ be an arbitrary linear estimator. Let $C = (X^T X)^{-1} X^T + D$.\n   For $\\tilde{w}$ to be unbiased for all $w$:\n   $$\\mathbb{E}[\\tilde{w}] = \\mathbb{E}[C (X w + \\epsilon)] = C X w = ((X^T X)^{-1} X^T + D) X w = w + D X w = w \\implies D X = 0$$\n   Now evaluate the covariance matrix of $\\tilde{w}$:\n   $$\\text{Cov}(\\tilde{w}) = \\text{Cov}(C y) = C \\text{Cov}(y) C^T = \\sigma^2 C C^T$$\n   $$C C^T = ((X^T X)^{-1} X^T + D)((X^T X)^{-1} X^T + D)^T$$\n   $$= (X^T X)^{-1} X^T X (X^T X)^{-1} + (X^T X)^{-1} X^T D^T + D X (X^T X)^{-1} + D D^T$$\n   Since $D X = 0$ and $X^T D^T = (D X)^T = 0$:\n   $$C C^T = (X^T X)^{-1} + D D^T$$\n   Therefore:\n   $$\\text{Cov}(\\tilde{w}) = \\sigma^2 (X^T X)^{-1} + \\sigma^2 D D^T = \\text{Cov}(\\hat{w}_{\\text{OLS}}) + \\sigma^2 D D^T$$\n   Since $D D^T$ is positive semi-definite for any matrix $D$, $\\text{Cov}(\\tilde{w}) - \\text{Cov}(\\hat{w}_{\\text{OLS}}) = \\sigma^2 D D^T \\succeq 0$, proving OLS is strictly BLUE.\n\n2. **Proof of Soft-Thresholding Operator**:\n   The subdifferential of $g(w) = \\frac{1}{2}(w - v)^2 + \\lambda |w|$ with respect to $w$ is:\n   $$\\partial g(w) = (w - v) + \\lambda \\partial |w| = \\begin{cases} w - v + \\lambda & \\text{if } w > 0 \\\\ [-v - \\lambda, -v + \\lambda] & \\text{if } w = 0 \\\\ w - v - \\lambda & \\text{if } w < 0 \\end{cases}$$\n   Setting $0 \\in \\partial g(w)$:\n   - If $v > \\lambda$: $w^* - v + \\lambda = 0 \\implies w^* = v - \\lambda > 0$.\n   - If $v < -\\lambda$: $w^* - v - \\lambda = 0 \\implies w^* = v + \\lambda < 0$.\n   - If $|v| \\le \\lambda$: $0 \\in [-v - \\lambda, -v + \\lambda] \\implies w^* = 0$.\n   Combining all three cases yields $\\hat{w} = \\text{sgn}(v) \\max(0, |v| - \\lambda)$.",
    },
  ],
};
