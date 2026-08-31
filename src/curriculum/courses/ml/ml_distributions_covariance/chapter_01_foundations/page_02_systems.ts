import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_distributions_covariance_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage Gaussian Engine Progression",
  subtitle: "Cholesky Breakdown, Tikhonov Jitter Regularization, and Vectorized GMMs",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title:
        "Microarchitecture Realities: Cholesky Breakdown & High-Dimensional Covariance Starvation",
      content:
        "1. **Cholesky Numerical Breakdown**: Computing $\\Sigma = L L^T$ requires taking square roots of diagonal pivots $L_{ii} = \\sqrt{\\Sigma_{ii} - \\sum_{k<i} L_{ik}^2}$. If $\\Sigma$ is near-singular (condition number $\\kappa(\\Sigma) > 10^{14}$ or in high dimensions with small samples $N < D$), floating-point roundoff causes the pivot expression to become negative, triggering a catastrophic `LinAlgError: Matrix is not positive definite`.\n2. **Tikhonov Jitter Regularization**: Robust production systems (e.g. PyTorch `torch.distributions.MultivariateNormal`, GMMs, Kalman filters) add diagonal jitter $\\Sigma_{\\text{reg}} = \\Sigma + \\epsilon I_D$ with $\\epsilon = 10^{-6} \\cdot \\text{Tr}(\\Sigma)/D$, shifting all eigenvalues into the strictly positive domain while preserving principal correlation axes.",
    },
    {
      type: "code_progression",
      title: "Multivariate Gaussian Engines: From Univariate Loops to Cholesky GMMs",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive Independent Univariate Gaussian Loop",
          code: `import math

def gaussian_pdf_naive_diagonal(x: list[float], mean: list[float], var: list[float]) -> float:
    """
    Naive product of 1D independent Gaussians.
    WARNING: Assumes zero covariance (diagonal Sigma). Fails completely on correlated data.
    """
    D = len(x)
    prob = 1.0
    for d in range(D):
        diff = x[d] - mean[d]
        v = var[d]
        coeff = 1.0 / math.sqrt(2 * math.pi * v)
        prob *= coeff * math.exp(-0.5 * (diff ** 2) / v)
    return prob`,
          explanation:
            "Univariate products assume diagonal covariance $\\Sigma = \\text{diag}(\\sigma_1^2, \\dots, \\sigma_D^2)$ and cannot capture feature correlations.",
          timeComplexity: "O(D) operations",
          spaceComplexity: "O(1) memory",
        },
        {
          label: "Stage 2: Full Vectorized Multivariate Gaussian PDF & EM GMM",
          code: `import numpy as np

class GaussianMixtureModel:
    """
    Gaussian Mixture Model (GMM) with full covariance matrices trained via Expectation-Maximization (EM).
    """
    def __init__(self, n_components: int = 3, max_iter: int = 100, tol: float = 1e-4, reg_covar: float = 1e-6):
        self.K = n_components
        self.max_iter = max_iter
        self.tol = tol
        self.reg_covar = reg_covar
        self.weights: np.ndarray | None = None  # (K,)
        self.means: np.ndarray | None = None    # (K, D)
        self.covars: np.ndarray | None = None   # (K, D, D)

    def _estimate_log_prob(self, X: np.ndarray) -> np.ndarray:
        """Computes log N(x_i | mu_k, Sigma_k) for all i and k using Cholesky."""
        N, D = X.shape
        log_prob = np.zeros((N, self.K))
        
        for k in range(self.K):
            diff = X - self.means[k]  # (N, D)
            # Add Tikhonov regularization
            cov_k = self.covars[k] + self.reg_covar * np.eye(D)
            L = np.linalg.cholesky(cov_k)  # (D, D)
            
            # Solve L @ v = diff.T => v = L^{-1} diff.T
            # Mahalanobis distance D_M^2 = sum(v^2, axis=0)
            v = np.linalg.solve(L, diff.T)  # (D, N)
            maha_sq = np.sum(v ** 2, axis=0)  # (N,)
            
            # log det(Sigma) = 2 * sum(log(diag(L)))
            log_det = 2.0 * np.sum(np.log(np.diag(L)))
            log_prob[:, k] = -0.5 * (D * np.log(2 * np.pi) + log_det + maha_sq)
            
        return log_prob

    def fit(self, X: np.ndarray) -> "GaussianMixtureModel":
        N, D = X.shape
        # Initialize means with random subset, uniform weights, identity covars
        rng = np.random.default_rng(42)
        self.means = X[rng.choice(N, self.K, replace=False)].copy()
        self.weights = np.ones(self.K) / self.K
        self.covars = np.array([np.eye(D) for _ in range(self.K)])

        prev_ll = -np.inf
        for iteration in range(self.max_iter):
            # --- E-Step: Compute responsibilities gamma_ik ---
            log_prob = self._estimate_log_prob(X)  # (N, K)
            log_weighted = log_prob + np.log(self.weights)  # (N, K)
            m = np.max(log_weighted, axis=1, keepdims=True)
            log_norm = m + np.log(np.sum(np.exp(log_weighted - m), axis=1, keepdims=True))
            resp = np.exp(log_weighted - log_norm)  # Responsibilities (N, K)
            
            current_ll = np.sum(log_norm)
            if abs(current_ll - prev_ll) < self.tol:
                break
            prev_ll = current_ll

            # --- M-Step: Update parameters ---
            N_k = np.sum(resp, axis=0)  # (K,)
            self.weights = N_k / N
            self.means = (resp.T @ X) / N_k[:, None]
            
            for k in range(self.K):
                diff = X - self.means[k]  # (N, D)
                self.covars[k] = (resp[:, k, None] * diff).T @ diff / N_k[k]

        return self`,
          explanation:
            "Vectorized EM algorithm evaluates responsibilities using Cholesky factorizations and triangular solves $\\mathcal{O}(D^3/3)$, guaranteeing numerical stability across EM iterations.",
          timeComplexity: "O(Iterations * (K * N * D + K * D^3))",
          spaceComplexity: "O(K * D^2 + N * K)",
        },
        {
          label: "Stage 3: High-Performance Cholesky Sampler & Mahalanobis Engine",
          code: `import numpy as np

class FastMultivariateGaussian:
    """
    High-Performance Cholesky-based Gaussian Engine.
    Provides O(1) sampling and O(D^2) Mahalanobis distance evaluation per sample.
    """
    def __init__(self, mean: np.ndarray, cov: np.ndarray, jitter: float = 1e-6):
        self.mean = np.ascontiguousarray(mean, dtype=np.float64)
        D = len(mean)
        # Ensure symmetric positive definite with jitter
        cov_sym = 0.5 * (cov + cov.T) + jitter * np.eye(D)
        self.L = np.linalg.cholesky(cov_sym)  # Lower triangular Cholesky factor
        self.log_det = 2.0 * np.sum(np.log(np.diag(self.L)))
        self.dim = D

    def sample(self, num_samples: int = 1, random_state: int | None = None) -> np.ndarray:
        """
        Reparameterization Sampling: x = mu + L @ z where z ~ N(0, I).
        """
        rng = np.random.default_rng(random_state)
        # 1. Sample standard normal noise Z (num_samples, D)
        Z = rng.standard_normal((num_samples, self.dim))
        # 2. Correlate and translate: X = Z @ L^T + mu
        return np.dot(Z, self.L.T) + self.mean

    def mahalanobis_squared(self, X: np.ndarray) -> np.ndarray:
        """
        Computes (x - mu)^T Sigma^{-1} (x - mu) via triangular solve L v = (x - mu)^T.
        """
        diff = X - self.mean  # (N, D)
        # Forward substitution with lower triangular matrix L
        v = np.linalg.solve(self.L, diff.T)  # (D, N)
        return np.sum(v ** 2, axis=0)        # (N,)`,
          explanation:
            "Sampling transforms standard white noise $z \\sim \\mathcal{N}(0, I)$ into exact correlated samples via $x = \\mu + L z$. Triangular solves compute Mahalanobis distances in $\\mathcal{O}(D^2)$ per point.",
          timeComplexity: "O(D^3) precomputation, O(N * D^2) evaluation",
          spaceComplexity: "O(D^2) for Cholesky factor L",
        },
      ],
      stepByStep: [
        "1. Symmetrize empirical covariance $\\Sigma = \\frac{1}{2}(\\Sigma + \\Sigma^T)$ and add diagonal jitter $\\epsilon I$.",
        "2. Compute lower-triangular Cholesky factor $L = \\text{cholesky}(\\Sigma)$ such that $\\Sigma = L L^T$.",
        "3. Evaluate $\\log \\det(\\Sigma) = 2 \\sum \\ln L_{ii}$ in $\\mathcal{O}(D)$ time.",
        "4. Draw independent Gaussian noise $z \\sim \\mathcal{N}(0, I)$ and project $x = \\mu + L z$.",
        "5. Solve triangular systems $L v = (x - \\mu)$ to evaluate Mahalanobis distances $\\|v\\|_2^2$.",
      ],
    },
  ],
};
