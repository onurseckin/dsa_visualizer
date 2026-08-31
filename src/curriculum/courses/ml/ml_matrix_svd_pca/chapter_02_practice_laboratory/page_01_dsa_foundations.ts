import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_matrix_svd_pca_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: Randomized SVD & PCA Reconstruction Engine",
  subtitle: "Interactive Implementation of Halko SVD and Low-Rank Reconstruction",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_randomized_svd_engine",
      title: "Halko-Martinsson-Tropp Randomized SVD Implementation",
      difficulty: "Hard",
      rationale:
        "Validates implementation of random Gaussian projection, power-iteration subspace orthogonalization, and low-rank projection for memory-bounded SVD.",
      starterCode: `import numpy as np

def rsvd(A: np.ndarray, k: int, p: int = 10, q: int = 2) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Computes rank-k truncated SVD approximation A approx U @ diag(S) @ V^T via Randomized SVD.
    
    Args:
        A: Input matrix (m, n)
        k: Target rank
        p: Oversampling parameter
        q: Number of power iteration steps
        
    Returns:
        (U, S, Vt): Left singular vectors (m, k), singular values (k,), right singular vectors (k, n)
    """
    m, n = A.shape
    l = k + p
    
    # Step 1: Draw Gaussian test matrix Omega ~ N(0, 1) of shape (n, l)
    Omega = np.random.randn(n, l)
    
    # Step 2: Form sample matrix Y = A @ Omega
    Y = A @ Omega
    
    # Step 3: Perform q power iteration passes: Y = (A @ A^T)^q @ Y
    for _ in range(q):
        Q_temp, _ = np.linalg.qr(Y)
        Y = A @ (A.T @ Q_temp)
        
    # Step 4: Orthonormalize Y to obtain basis Q (m, l)
    Q, _ = np.linalg.qr(Y)
    
    # Step 5: Form low-dimensional matrix B = Q^T @ A (l, n)
    B = Q.T @ A
    
    # Step 6: Compute standard SVD of small matrix B
    U_hat, S_full, Vt_full = np.linalg.svd(B, full_matrices=False)
    
    # Step 7: Recover left singular vectors U = Q @ U_hat
    U_full = Q @ U_hat
    
    # Step 8: Return truncated rank-k factors
    return U_full[:, :k], S_full[:k], Vt_full[:k, :]

if __name__ == "__main__":
    np.random.seed(42)
    # Generate low rank matrix: rank 5 plus small noise
    A_true = np.random.randn(100, 5) @ np.random.randn(5, 50) + 1e-4 * np.random.randn(100, 50)
    U, S, Vt = rsvd(A_true, k=5)
    A_recon = U @ np.diag(S) @ Vt
    rel_error = np.linalg.norm(A_true - A_recon) / np.linalg.norm(A_true)
    print(f"RSVD Relative Reconstruction Error: {rel_error:.6f}")
    assert rel_error < 1e-3, "RSVD error exceeded tolerance!"
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_pca_explained_variance",
      title: "Cumulative Energy & Dimensionality Selection",
      difficulty: "Medium",
      rationale:
        "Selects the minimal number of principal components required to preserve a specified target variance threshold (e.g., 95% or 99%).",
      starterCode: `import numpy as np

def select_pca_components(X: np.ndarray, variance_threshold: float = 0.95) -> int:
    """
    Determines minimal number of principal components k to retain at least variance_threshold of total variance.
    
    Args:
        X: Uncentered data matrix (N, D)
        variance_threshold: Value in (0, 1]
        
    Returns:
        k: Integer number of components
    """
    N, D = X.shape
    X_c = X - np.mean(X, axis=0)
    # Compute singular values
    _, S, _ = np.linalg.svd(X_c, full_matrices=False)
    
    variances = S ** 2
    cumulative_variance_ratio = np.cumsum(variances) / np.sum(variances)
    
    # Find first index where cumulative ratio >= variance_threshold
    k = int(np.argmax(cumulative_variance_ratio >= variance_threshold) + 1)
    return k
`,
    },
  ],
};

export const page1 = page_01_dsa_foundations;
