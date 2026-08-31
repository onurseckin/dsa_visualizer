import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_svm_kernel_smo_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage SVM Progression",
  subtitle: "Kernel Row Caching, Working Set Selection Heuristics, and Platt's SMO Engine",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Microarchitecture Realities: Kernel Matrix Memory Wall & Working Set Heuristics",
      content:
        "1. **$O(N^2)$ Kernel Matrix Memory Explosion**: Storing the full $N \\times N$ Gram matrix for $N = 100{,}000$ in 64-bit float requires $100{,}000^2 \\times 8\\text{ bytes} = 80\\text{ GB}$ of RAM. In practice, only the non-zero support vectors (typically $<10\\%$ of data) are active. Platt's SMO uses a **Dynamic LRU Kernel Row Cache** (e.g. 500 MB) to store hot support vector rows, computing cold rows on-the-fly to eliminate memory crashes.\n2. **SMO Working Set Selection Heuristics**: Naive random selection of $(\\alpha_1, \\alpha_2)$ requires $O(N^2)$ iterations to converge. Platt's dual-heuristic strategy:\n   - **Outer Loop**: Iterates over non-bound examples ($0 < \\alpha_i < C$) violating KKT conditions.\n   - **Inner Loop**: Selects $\\alpha_2$ to maximize the step magnitude $|E_1 - E_2|$, driving the largest possible dual objective increase in a single update.",
    },
    {
      type: "code_progression",
      title: "From Subgradient Descent to Platt's Vectorized SMO Solver",
      language: "python",
      stages: [
        {
          label: "Stage 1: Linear SVM via Primal Subgradient Descent",
          code: `class PrimalSubgradientSVM:
    """
    Primal Soft-Margin Linear SVM using Subgradient Descent.
    Minimizes: 0.5 * ||w||^2 + C * sum(max(0, 1 - y_i (w^T x_i + b)))
    """
    def __init__(self, C: float = 1.0, lr: float = 0.01, num_iters: int = 1000):
        self.C = C
        self.lr = lr
        self.num_iters = num_iters
        self.w: list[float] = []
        self.b: float = 0.0

    def fit(self, X: list[list[float]], y: list[int]):
        N, D = len(X), len(X[0])
        self.w = [0.0] * D
        self.b = 0.0
        
        for _ in range(self.num_iters):
            for i in range(N):
                # Margin condition: y_i (w^T x_i + b)
                margin = y[i] * (sum(self.w[j] * X[i][j] for j in range(D)) + self.b)
                if margin < 1.0:
                    # Subgradient step for margin violation
                    for j in range(D):
                        self.w[j] -= self.lr * (self.w[j] / N - self.C * y[i] * X[i][j])
                    self.b += self.lr * self.C * y[i]
                else:
                    # Only regularizer gradient
                    for j in range(D):
                        self.w[j] -= self.lr * (self.w[j] / N)`,
          explanation:
            "First-order subgradient descent in primal space only handles linear boundaries and converges slowly ($O(1/\\sqrt{T})$).",
          timeComplexity: "O(Iters * N * D)",
          spaceComplexity: "O(D) weights",
        },
        {
          label: "Stage 2: Vectorized Kernel SVM Dual Matrix Formulation",
          code: `import numpy as np

def rbf_kernel(X1: np.ndarray, X2: np.ndarray, gamma: float = 0.1) -> np.ndarray:
    """Computes RBF Gram matrix K(x_i, x_j) = exp(-gamma * ||x_i - x_j||^2)."""
    # X1: (N, D), X2: (M, D)
    x1_sq = np.sum(X1 ** 2, axis=1, keepdims=True)  # (N, 1)
    x2_sq = np.sum(X2 ** 2, axis=1, keepdims=True)  # (M, 1)
    sq_dists = x1_sq - 2.0 * np.dot(X1, X2.T) + x2_sq.T
    return np.exp(-gamma * np.maximum(sq_dists, 0.0))

class DualKernelSVM:
    """
    Evaluates Dual SVM predictions: f(x) = sum_{i in SV} alpha_i y_i K(x_i, x) + b.
    """
    def __init__(self, gamma: float = 0.1):
        self.gamma = gamma
        self.support_vectors_: np.ndarray | None = None
        self.dual_coef_: np.ndarray | None = None  # alpha_i * y_i
        self.b_: float = 0.0

    def predict(self, X: np.ndarray) -> np.ndarray:
        # K(support_vectors, X) -> (N_sv, N_test)
        K = rbf_kernel(self.support_vectors_, X, gamma=self.gamma)
        scores = np.dot(self.dual_coef_, K) + self.b_
        return np.sign(scores).astype(np.int32)`,
          explanation:
            "Dual Kernel SVM evaluates predictions strictly through inner products with non-zero support vectors.",
          timeComplexity: "O(N_support_vectors * N_test * D)",
          spaceComplexity: "O(N_sv * D) support vectors",
        },
        {
          label: "Stage 3: Platt's Fast Sequential Minimal Optimization (SMO) Solver",
          code: `import numpy as np

class PlattSMOSolver:
    """
    Fast Platt Sequential Minimal Optimization (SMO) Dual Solver with RBF Kernel.
    Analytically solves 2-variable coordinate updates with KKT violation heuristics.
    """
    def __init__(self, C: float = 1.0, gamma: float = 0.1, tol: float = 1e-3, max_passes: int = 10):
        self.C = C
        self.gamma = gamma
        self.tol = tol
        self.max_passes = max_passes
        self.alphas: np.ndarray | None = None
        self.b: float = 0.0
        self.X: np.ndarray | None = None
        self.y: np.ndarray | None = None

    def _kernel(self, x1: np.ndarray, x2: np.ndarray) -> float:
        return float(np.exp(-self.gamma * np.sum((x1 - x2) ** 2)))

    def _predict_raw(self, x: np.ndarray) -> float:
        """Computes f(x) = sum alpha_i y_i K(x_i, x) + b for active alphas."""
        active = self.alphas > 1e-7
        if not np.any(active):
            return self.b
        sv_alphas = self.alphas[active]
        sv_y = self.y[active]
        sv_X = self.X[active]
        # Dot product with active SVs
        sq_diffs = np.sum((sv_X - x) ** 2, axis=1)
        k_vals = np.exp(-self.gamma * sq_diffs)
        return float(np.sum(sv_alphas * sv_y * k_vals) + self.b)

    def fit(self, X: np.ndarray, y: np.ndarray) -> "PlattSMOSolver":
        N, D = X.shape
        self.X = X
        self.y = y.astype(np.float64)
        self.alphas = np.zeros(N, dtype=np.float64)
        self.b = 0.0
        
        passes = 0
        while passes < self.max_passes:
            num_changed_alphas = 0
            for i in range(N):
                Ei = self._predict_raw(X[i]) - y[i]
                
                # Check KKT condition violation
                if (y[i] * Ei < -self.tol and self.alphas[i] < self.C) or \\
                   (y[i] * Ei > self.tol and self.alphas[i] > 0):
                    
                    # Select j != i randomly (or via max step heuristic)
                    j = np.random.randint(0, N - 1)
                    if j >= i:
                        j += 1
                        
                    Ej = self._predict_raw(X[j]) - y[j]
                    alpha_i_old = self.alphas[i]
                    alpha_j_old = self.alphas[j]
                    
                    # Compute L and H box bounds
                    if y[i] != y[j]:
                        L = max(0.0, alpha_j_old - alpha_i_old)
                        H = min(self.C, self.C + alpha_j_old - alpha_i_old)
                    else:
                        L = max(0.0, alpha_i_old + alpha_j_old - self.C)
                        H = min(self.C, alpha_i_old + alpha_j_old)
                        
                    if abs(L - H) < 1e-7:
                        continue
                        
                    # Compute eta = 2 K_12 - K_11 - K_22
                    k11 = self._kernel(X[i], X[i])
                    k22 = self._kernel(X[j], X[j])
                    k12 = self._kernel(X[i], X[j])
                    eta = 2.0 * k12 - k11 - k22
                    
                    if eta >= 0:
                        continue
                        
                    # Unclipped update for alpha_j
                    alpha_j_new = alpha_j_old - (y[j] * (Ei - Ej)) / eta
                    # Clip to [L, H]
                    alpha_j_new = min(H, max(L, alpha_j_new))
                    
                    if abs(alpha_j_new - alpha_j_old) < 1e-5:
                        continue
                        
                    # Compute alpha_i_new
                    alpha_i_new = alpha_i_old + y[i] * y[j] * (alpha_j_old - alpha_j_new)
                    
                    # Update threshold b
                    b1 = self.b - Ei - y[i] * (alpha_i_new - alpha_i_old) * k11 - y[j] * (alpha_j_new - alpha_j_old) * k12
                    b2 = self.b - Ej - y[i] * (alpha_i_new - alpha_i_old) * k12 - y[j] * (alpha_j_new - alpha_j_old) * k22
                    
                    if 0 < alpha_i_new < self.C:
                        self.b = b1
                    elif 0 < alpha_j_new < self.C:
                        self.b = b2
                    else:
                        self.b = (b1 + b2) / 2.0
                        
                    self.alphas[i] = alpha_i_new
                    self.alphas[j] = alpha_j_new
                    num_changed_alphas += 1
                    
            if num_changed_alphas == 0:
                passes += 1
            else:
                passes = 0
                
        return self`,
          explanation:
            "Platt's SMO solves the dual quadratic program analytically in $O(1)$ arithmetic steps per coordinate pair without requiring dense matrix inversion.",
          timeComplexity: "O(Passes * N * D_SV)",
          spaceComplexity: "O(N + N_SV * D)",
        },
      ],
      stepByStep: [
        "1. Initialize all Lagrange multipliers $\\alpha_i = 0$ and threshold $b = 0$.",
        "2. Identify multiplier $\\alpha_1$ violating KKT complementarity conditions.",
        "3. Select $\\alpha_2$ maximizing error gap $|E_1 - E_2|$ via working set selection heuristics.",
        "4. Compute 1D curvature $\\eta = 2 K_{12} - K_{11} - K_{22}$ and update unclipped $\\alpha_2$.",
        "5. Clip $\\alpha_2$ to feasible line segment $[L, H]$ and update $\\alpha_1$ and threshold $b$.",
      ],
    },
  ],
};
