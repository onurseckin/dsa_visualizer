import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_linear_logistic_regression_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: Coordinate Descent Lasso & IRLS Solvers",
  subtitle: "Interactive Implementation of Sparse Lasso Solvers and Second-Order Logistic Solvers",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_lasso_coordinate_descent_engine",
      title: "Lasso Coordinate Descent Optimization Engine",
      difficulty: "Hard",
      rationale:
        "Validates exact implementation of soft-thresholding coordinate updates for non-smooth L1 regularized regression.",
      starterCode: `import numpy as np

def lasso_coordinate_descent(
    X: np.ndarray,
    y: np.ndarray,
    alpha: float = 1.0,
    max_iter: int = 500,
    tol: float = 1e-4
) -> np.ndarray:
    """
    Fits Lasso regression w via coordinate descent on 0.5 * ||y - X w||^2 + alpha * ||w||_1.
    
    Args:
        X: Feature matrix (N, D)
        y: Target vector (N,)
        alpha: Regularization strength
        max_iter: Max coordinate cycles
        tol: Convergence tolerance
        
    Returns:
        w: Learned sparse weight vector (D,)
    """
    N, D = X.shape
    w = np.zeros(D, dtype=np.float64)
    z = np.sum(X ** 2, axis=0)  # (D,)
    
    for _ in range(max_iter):
        w_old = w.copy()
        for j in range(D):
            if z[j] == 0:
                continue
            # Partial residual: rho_j = X_j^T (y - X w + X_j w_j)
            pred = np.dot(X, w)
            rho_j = np.dot(X[:, j], y - pred + X[:, j] * w[j])
            
            # Soft thresholding
            if rho_j > alpha:
                w[j] = (rho_j - alpha) / z[j]
            elif rho_j < -alpha:
                w[j] = (rho_j + alpha) / z[j]
            else:
                w[j] = 0.0
                
        if np.max(np.abs(w - w_old)) < tol:
            break
            
    return w

if __name__ == "__main__":
    np.random.seed(42)
    X_syn = np.random.randn(50, 5)
    true_w = np.array([3.0, 0.0, 0.0, -2.0, 0.0])
    y_syn = np.dot(X_syn, true_w) + 0.05 * np.random.randn(50)
    w_fit = lasso_coordinate_descent(X_syn, y_syn, alpha=0.5)
    print("Fitted Lasso Weights:", np.round(w_fit, 3))
    assert w_fit[1] == 0.0 and w_fit[2] == 0.0 and w_fit[4] == 0.0, "Lasso failed to recover exact sparsity!"
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_irls_logistic_regression_engine",
      title: "Newton-Raphson IRLS Logistic Solver Engine",
      difficulty: "Hard",
      rationale:
        "Implements Iteratively Reweighted Least Squares with Cholesky factorization of the weighted Hessian.",
      starterCode: `import numpy as np

def irls_logistic_solve(
    X: np.ndarray,
    y: np.ndarray,
    max_iter: int = 30,
    reg: float = 1e-4
) -> np.ndarray:
    """
    Computes optimal logistic regression weights using Newton-Raphson IRLS.
    
    Args:
        X: Feature matrix (N, D)
        y: Binary target vector (N,) with entries in {0, 1}
        max_iter: Max iterations
        reg: L2 regularization constant
        
    Returns:
        w: Weight vector of shape (D,)
    """
    N, D = X.shape
    w = np.zeros(D, dtype=np.float64)
    
    for _ in range(max_iter):
        logits = np.dot(X, w)
        p = 1.0 / (1.0 + np.exp(-np.clip(logits, -20.0, 20.0)))
        
        # Diagonal weights W = p * (1 - p)
        w_diag = p * (1.0 - p) + 1e-8
        
        # Gradient g = X^T (p - y) + reg * w
        grad = np.dot(X.T, p - y) + reg * w
        
        # Hessian H = X^T W X + reg * I
        X_w = X * np.sqrt(w_diag)[:, None]
        H = np.dot(X_w.T, X_w) + reg * np.eye(D)
        
        # Solve delta_w = - H^{-1} grad via Cholesky
        L = np.linalg.cholesky(H)
        delta_w = -np.linalg.solve(L.T, np.linalg.solve(L, grad))
        
        w += delta_w
        if np.linalg.norm(delta_w) < 1e-6:
            break
            
    return w
`,
    },
  ],
};
