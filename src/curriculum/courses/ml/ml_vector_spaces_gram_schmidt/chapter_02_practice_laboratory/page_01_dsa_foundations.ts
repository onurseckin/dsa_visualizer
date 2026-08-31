import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_vector_spaces_gram_schmidt_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: Modified Gram-Schmidt & QR Engine",
  subtitle: "Interactive Implementation of Orthonormalization and Back-Substitution",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_mgs_qr_factorization",
      title: "Modified Gram-Schmidt QR Factorization Engine",
      difficulty: "Hard",
      rationale:
        "Validates exact implementation of the Modified Gram-Schmidt algorithm to prevent loss of orthogonality when decomposing matrices.",
      starterCode: `import numpy as np

def mgs_qr(A: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Computes thin QR decomposition A = Q @ R using Modified Gram-Schmidt.
    
    Args:
        A: Real matrix of shape (m, n) with m >= n.
        
    Returns:
        (Q, R): Q of shape (m, n) with orthonormal columns, R of shape (n, n) upper triangular.
    """
    m, n = A.shape
    Q = np.zeros((m, n), dtype=np.float64)
    R = np.zeros((n, n), dtype=np.float64)
    V = A.astype(np.float64).copy()
    
    # TODO: Implement MGS loop:
    # For k = 0..n-1:
    #   Compute R[k, k] = norm(V[:, k])
    #   Q[:, k] = V[:, k] / R[k, k]
    #   For j = k+1..n-1:
    #     R[k, j] = Q[:, k] . V[:, j]
    #     V[:, j] -= R[k, j] * Q[:, k]
    pass

if __name__ == "__main__":
    np.random.seed(42)
    A_test = np.random.randn(6, 4)
    Q, R = mgs_qr(A_test)
    assert np.allclose(Q.T @ Q, np.eye(4), atol=1e-10), "Q columns are not orthonormal!"
    assert np.allclose(Q @ R, A_test, atol=1e-10), "Reconstruction A != Q @ R!"
    print("MGS QR verification passed!")
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_qr_least_squares_solver",
      title: "Least Squares Regression via QR Decomposition",
      difficulty: "Hard",
      rationale:
        "Solves the overdetermined linear system min ||Ax - b||_2 using QR factorization and backward substitution without forming the ill-conditioned normal equations A^T A.",
      starterCode: `import numpy as np

def qr_least_squares(A: np.ndarray, b: np.ndarray) -> np.ndarray:
    """
    Solves min_x ||A x - b||_2 using QR decomposition.
    
    Args:
        A: Feature matrix (m, n) with m >= n
        b: Target vector (m,)
        
    Returns:
        x: Optimal weight vector (n,)
    """
    m, n = A.shape
    Q, R = np.linalg.qr(A)  # Thin QR
    
    # Step 1: Compute d = Q^T @ b (shape: n,)
    d = Q.T @ b
    
    # Step 2: Solve upper triangular system R x = d via back-substitution
    x = np.zeros(n, dtype=np.float64)
    for i in range(n - 1, -1, -1):
        x[i] = (d[i] - np.dot(R[i, i + 1:], x[i + 1:])) / R[i, i]
        
    return x
`,
    },
  ],
};

export const page1 = page_01_dsa_foundations;
