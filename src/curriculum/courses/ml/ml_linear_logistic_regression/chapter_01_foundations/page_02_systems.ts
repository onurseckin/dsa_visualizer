import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_linear_logistic_regression_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage Regression Engine Progression",
  subtitle: "Collinear Condition Squaring, Coordinate Descent Lasso, and Cholesky IRLS Solvers",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Microarchitecture Realities: Condition Number Squaring & Feature Scaling Traps",
      content:
        "1. **Condition Number Squaring in Normal Equations**: If the design matrix $X$ has condition number $\\kappa(X) = \\sigma_{\\max} / \\sigma_{\\min} = 10^5$, the Gram matrix $X^T X$ has condition number $\\kappa(X^T X) = (10^5)^2 = 10^{10}$. In IEEE 754 64-bit floating point (53-bit mantissa $\\approx 15-17$ decimal digits), solving $(X^T X) w = X^T y$ loses 10 digits of accuracy to roundoff. Ridge regularization $X^T X + \\lambda I$ bounds the condition number to $\\le (\\sigma_{\\max}^2 + \\lambda)/\\lambda$.\n2. **Feature Scale Sensitivity in Regularized Optimization**: Regularization penalties $\\lambda \\|w\\|_1$ and $\\lambda \\|w\\|_2^2$ assume all features have comparable variances. If feature $x_1$ is measured in millimeters ($1000\\times$ larger) and $x_2$ in meters, the optimal coefficient $w_1$ will be $1000\\times$ smaller, causing the penalty to disproportionately penalize $w_2$ and preserve $w_1$. Standardizing features ($z = (x - \\mu)/\\sigma$) prior to fitting is mandatory.",
    },
    {
      type: "code_progression",
      title: "From Gradient Descent to Coordinate Descent Lasso & Cholesky IRLS",
      language: "python",
      stages: [
        {
          label: "Stage 1: Pure Python Gradient Descent OLS Baseline",
          code: `class PurePythonLinearRegression:
    """
    Naive first-order gradient descent for Linear Regression.
    """
    def __init__(self, lr: float = 0.01, num_iters: int = 1000):
        self.lr = lr
        self.num_iters = num_iters
        self.weights: list[float] = []

    def fit(self, X: list[list[float]], y: list[float]):
        N = len(X)
        D = len(X[0])
        self.weights = [0.0] * D
        
        for _ in range(self.num_iters):
            # Compute predictions: y_pred = X @ w
            preds = [sum(X[i][j] * self.weights[j] for j in range(D)) for i in range(N)]
            # Compute gradient: grad = (2/N) * X^T (preds - y)
            for j in range(D):
                grad_j = (2.0 / N) * sum(X[i][j] * (preds[i] - y[i]) for i in range(N))
                self.weights[j] -= self.lr * grad_j`,
          explanation:
            "Iterative gradient descent on raw Python lists is memory-inefficient and slow to converge when features are poorly scaled.",
          timeComplexity: "O(Iters * N * D)",
          spaceComplexity: "O(D) weights",
        },
        {
          label: "Stage 2: Vectorized Lasso with Coordinate Descent & Soft-Thresholding",
          code: `import numpy as np

def soft_threshold(v: float, tau: float) -> float:
    """Soft-thresholding operator S_tau(v) = sign(v) * max(0, |v| - tau)."""
    if v > tau:
        return v - tau
    elif v < -tau:
        return v + tau
    else:
        return 0.0

class LassoCoordinateDescent:
    """
    Lasso L1-regularized regression solved via exact Coordinate Descent.
    Computes exact sparse coefficients without gradient step size tuning.
    """
    def __init__(self, alpha: float = 1.0, max_iter: int = 1000, tol: float = 1e-4):
        self.alpha = alpha
        self.max_iter = max_iter
        self.tol = tol
        self.coef_: np.ndarray | None = None

    def fit(self, X: np.ndarray, y: np.ndarray) -> "LassoCoordinateDescent":
        N, D = X.shape
        w = np.zeros(D, dtype=np.float64)
        
        # Precompute feature column norms: z_j = sum(x_{ij}^2)
        z = np.sum(X ** 2, axis=0)  # (D,)
        
        for iteration in range(self.max_iter):
            w_old = w.copy()
            for j in range(D):
                if z[j] == 0:
                    continue
                # Compute partial residual: r_{-j} = y - sum_{k != j} X_k w_k
                # Efficient in-place computation: rho_j = X_j^T (y - X w + X_j w_j)
                pred = np.dot(X, w)
                rho_j = np.dot(X[:, j], y - pred + X[:, j] * w[j])
                
                # Apply soft thresholding
                w[j] = soft_threshold(rho_j, self.alpha) / z[j]
                
            # Convergence check
            if np.max(np.abs(w - w_old)) < self.tol:
                break
                
        self.coef_ = w
        return self`,
          explanation:
            "Coordinate descent iterates through coordinates, solving exact 1D subproblems via soft-thresholding to produce exact zero-weight sparsity.",
          timeComplexity: "O(Iterations * N * D)",
          spaceComplexity: "O(D) coefficients",
        },
        {
          label: "Stage 3: High-Performance IRLS Newton-Raphson Logistic Regression",
          code: `import numpy as np

class FastIRLSLogisticRegression:
    """
    Iteratively Reweighted Least Squares (IRLS / Newton-Raphson) Logistic Regression Solver.
    Uses Cholesky factorization of the Hessian for quadratic convergence.
    """
    def __init__(self, max_iter: int = 50, tol: float = 1e-6, l2_reg: float = 1e-4):
        self.max_iter = max_iter
        self.tol = tol
        self.l2_reg = l2_reg
        self.coef_: np.ndarray | None = None

    def fit(self, X: np.ndarray, y: np.ndarray) -> "FastIRLSLogisticRegression":
        N, D = X.shape
        w = np.zeros(D, dtype=np.float64)
        
        for iteration in range(self.max_iter):
            # 1. Compute sigmoid probabilities p = 1 / (1 + exp(-X w))
            logits = np.dot(X, w)
            # Numerically stable sigmoid
            p = np.where(logits >= 0, 1.0 / (1.0 + np.exp(-logits)), np.exp(logits) / (1.0 + np.exp(logits)))
            
            # 2. Compute weights W_ii = p_i * (1 - p_i) + eps (variance floor)
            w_diag = p * (1.0 - p) + 1e-8  # (N,)
            
            # 3. Compute Gradient: g = X^T (p - y) + l2_reg * w
            grad = np.dot(X.T, p - y) + self.l2_reg * w  # (D,)
            
            # 4. Compute Hessian: H = X^T W X + l2_reg * I_D
            # Vectorized computation: X^T @ diag(w_diag) @ X = (X * sqrt(w))^T @ (X * sqrt(w))
            X_weighted = X * np.sqrt(w_diag)[:, None]  # (N, D)
            H = np.dot(X_weighted.T, X_weighted) + self.l2_reg * np.eye(D)  # (D, D)
            
            # 5. Solve Newton step: H @ delta_w = -grad via Cholesky factorization
            L = np.linalg.cholesky(H)
            delta_w = -np.linalg.solve(L.T, np.linalg.solve(L, grad))
            
            w += delta_w
            
            # Quadratic convergence check
            if np.linalg.norm(delta_w) < self.tol:
                break
                
        self.coef_ = w
        return self`,
          explanation:
            "IRLS achieves quadratic convergence in 5-10 iterations by evaluating the true second-order Hessian $H = X^T W X$ and solving via lower-triangular Cholesky factorization.",
          timeComplexity: "O(Iterations * (N * D^2 + D^3 / 3))",
          spaceComplexity: "O(D^2) Hessian buffer",
        },
      ],
      stepByStep: [
        "1. Standardize features to zero mean and unit variance ($z = (x - \\mu)/\\sigma$).",
        "2. In Lasso, execute coordinate descent cycles applying soft-thresholding $\\mathcal{S}_\\lambda(\\cdot)$.",
        "3. In Logistic Regression, compute sigmoid probabilities $p = \\sigma(X w)$.",
        "4. Form the positive-definite Hessian $H = X^T W X + \\lambda I$.",
        "5. Factorize $H = L L^T$ via Cholesky decomposition and apply the Newton step $\\Delta w = -H^{-1} g$.",
      ],
    },
  ],
};
