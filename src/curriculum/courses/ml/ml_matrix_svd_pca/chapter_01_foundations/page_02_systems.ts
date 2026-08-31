import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_matrix_svd_pca_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage SVD/PCA Engine Progression",
  subtitle: "O(N^2) Memory Pitfalls, Randomized SVD, and Scalable Embedding Compression",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Microarchitecture Realities: Full SVD Memory Explosion vs Randomized SVD",
      content:
        "1. **Full SVD Memory Explosion**: Standard LAPACK `gesvd` computes full $U \\in \\mathbb{R}^{M \\times M}$ and $V \\in \\mathbb{R}^{N \\times N}$. For an embedding table with $M = 100{,}000$ tokens and $D = 4096$ hidden dimension, allocating full $U$ requires $100{,}000 \\times 100{,}000 \\times 4\\text{ bytes} = 40\\text{ GB}$ of RAM, immediately triggering Out-Of-Memory (OOM) crashes.\n2. **Randomized SVD (Halko et al., 2011)**: By projecting the $M \\times N$ matrix onto a random subspace of dimension $k + p$ (where $p \\approx 10$ is an oversampling parameter), Randomized SVD reduces the decomposition to a tiny $(k+p) \\times N$ matrix. This bounds peak memory to $\\mathcal{O}((M + N)(k + p))$, fully utilizing GPU Tensor Cores for massive $100\\times$ speedups.",
    },
    {
      type: "code_progression",
      title: "From Power Iteration to Randomized SVD (Halko Algorithm)",
      language: "python",
      stages: [
        {
          label: "Stage 1: Power Iteration with Deflation",
          code: `import numpy as np

def power_iteration_svd(A: np.ndarray, num_components: int = 2, max_iter: int = 100, tol: float = 1e-8) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Extracts top singular vectors via Power Iteration and Deflation.
    Finds leading eigenvector of A^T A without explicitly forming A^T A.
    """
    m, n = A.shape
    A_def = A.astype(np.float64).copy()
    
    U_list, S_list, V_list = [], [], []
    
    for _ in range(num_components):
        # Initialize random starting vector
        v = np.random.randn(n)
        v = v / np.linalg.norm(v)
        
        for _ in range(max_iter):
            # Compute v_next = A^T @ (A @ v) without materializing A^T A
            Av = np.dot(A_def, v)
            v_next = np.dot(A_def.T, Av)
            norm_next = np.linalg.norm(v_next)
            if norm_next < 1e-12:
                break
            v_next = v_next / norm_next
            
            if np.linalg.norm(v - v_next) < tol:
                v = v_next
                break
            v = v_next
            
        # Singular value sigma = ||A v||
        Av = np.dot(A_def, v)
        sigma = np.linalg.norm(Av)
        if sigma < 1e-12:
            break
        u = Av / sigma
        
        U_list.append(u)
        S_list.append(sigma)
        V_list.append(v)
        
        # Deflate: remove contribution of this component: A_def = A_def - sigma * u @ v^T
        A_def -= sigma * np.outer(u, v)
        
    return np.column_stack(U_list), np.array(S_list), np.column_stack(V_list)`,
          explanation:
            "Power iteration iteratively multiplies by $A^T A$ implicitly via $A^T(A v)$, extracting dominant singular triplets while deflating the matrix at each rank step.",
          timeComplexity: "O(k * max_iter * m * n)",
          spaceComplexity: "O(m * n)",
        },
        {
          label: "Stage 2: Full Vectorized PCA Pipeline with Direct SVD",
          code: `import numpy as np

class PCAPipeline:
    """
    Production-grade PCA via direct SVD on centered data matrix X_c.
    Avoids covariance matrix squaring and retains maximum numerical precision.
    """
    def __init__(self, n_components: int):
        self.n_components = n_components
        self.mean_: np.ndarray | None = None
        self.components_: np.ndarray | None = None  # Right singular vectors (V_k^T)
        self.singular_values_: np.ndarray | None = None
        self.explained_variance_ratio_: np.ndarray | None = None

    def fit(self, X: np.ndarray) -> "PCAPipeline":
        N, D = X.shape
        assert N > 1, "Need at least 2 samples"
        
        # 1. Compute empirical mean and center data
        self.mean_ = np.mean(X, axis=0)
        X_c = X - self.mean_
        
        # 2. Compute thin SVD directly on X_c (Shape: U (N, D), S (D,), Vt (D, D))
        U, S, Vt = np.linalg.svd(X_c, full_matrices=False)
        
        # 3. Store top k components
        self.singular_values_ = S[:self.n_components]
        self.components_ = Vt[:self.n_components]  # Shape: (k, D)
        
        # 4. Explained variance: lambda_i = S_i^2 / (N - 1)
        variances = (S ** 2) / (N - 1)
        total_var = np.sum(variances)
        self.explained_variance_ratio_ = (variances[:self.n_components]) / total_var
        
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        """Projects data onto principal component subspace."""
        X_c = X - self.mean_
        return np.dot(X_c, self.components_.T)  # (N, k)

    def inverse_transform(self, Z: np.ndarray) -> np.ndarray:
        """Reconstructs original feature space from principal scores."""
        return np.dot(Z, self.components_) + self.mean_`,
          explanation:
            "Applying SVD directly to the centered data matrix $X_c$ guarantees that variance ratios and orthogonal projections are computed with condition number $\\kappa(X_c)$ instead of $\\kappa(X_c)^2$.",
          timeComplexity: "O(N * D * min(N, D))",
          spaceComplexity: "O(N * D)",
        },
        {
          label: "Stage 3: High-Performance Randomized SVD (Halko-Martinsson-Tropp)",
          code: `import numpy as np

def randomized_svd(
    A: np.ndarray,
    n_components: int,
    n_oversamples: int = 10,
    n_iter: int = 4,
    random_state: int = 42
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Randomized SVD (Halko et al., 2011).
    Scales to massive matrices by projecting into a random low-dimensional subspace.
    
    Args:
        A: Input matrix (m, n)
        n_components: Target rank k
        n_oversamples: Buffer dimension p (typically 5-10)
        n_iter: Power iteration passes for rapid singular value spectrum decay
        
    Returns:
        (U_k, S_k, V_k^T): Truncated SVD factors
    """
    rng = np.random.default_rng(random_state)
    m, n = A.shape
    l = n_components + n_oversamples
    
    # 1. Sample random Gaussian test matrix Omega (n, l)
    Omega = rng.standard_normal((n, l), dtype=np.float64)
    
    # 2. Form sample matrix Y = A @ Omega (m, l)
    Y = np.dot(A, Omega)
    
    # 3. Subspace power iteration to enhance spectral decay
    for _ in range(n_iter):
        # Orthogonalize intermediate Y to prevent collapse
        Q, _ = np.linalg.qr(Y, mode="reduced")
        # Y = A @ (A^T @ Q)
        Y = np.dot(A, np.dot(A.T, Q))
        
    # 4. Orthonormalize Y to obtain basis Q for range(A)
    Q, _ = np.linalg.qr(Y, mode="reduced")  # Q is (m, l)
    
    # 5. Project A onto low-dim subspace: B = Q^T @ A (l, n)
    B = np.dot(Q.T, A)
    
    # 6. Compute SVD on small matrix B (l, n) -> FAST!
    U_hat, S, Vt = np.linalg.svd(B, full_matrices=False)
    
    # 7. Reconstruct left singular vectors: U = Q @ U_hat (m, l)
    U = np.dot(Q, U_hat)
    
    # 8. Truncate to target rank k
    return U[:, :n_components], S[:n_components], Vt[:n_components, :]`,
          explanation:
            "Randomized SVD reduces the SVD of an $M \\times N$ matrix to an $(k+p) \\times N$ matrix, converting memory-bound bottlenecks into BLAS-3 `GEMM` matrix products that saturate modern GPU architectures.",
          timeComplexity: "O(m * n * (k + p) * n_iter) with small constant factors",
          spaceComplexity: "O((m + n) * (k + p))",
        },
      ],
      stepByStep: [
        "1. Mean-center the data along feature columns: $X_c = X - \\mathbf{1} \\mu^T$.",
        "2. Generate random Gaussian matrix $\\Omega \\in \\mathbb{R}^{N \\times (k+p)}$.",
        "3. Power-iterate $Y = (A A^T)^q A \\Omega$ and extract orthonormal basis $Q = \\text{QR}(Y)$.",
        "4. Project to small core matrix $B = Q^T A$ and compute exact small-scale SVD $B = \\hat{U} \\Sigma V^T$.",
        "5. Recover full left singular vectors $U = Q \\hat{U}$.",
      ],
    },
  ],
};
