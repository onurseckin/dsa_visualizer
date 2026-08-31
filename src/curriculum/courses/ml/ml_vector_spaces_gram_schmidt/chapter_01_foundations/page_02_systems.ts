import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_vector_spaces_gram_schmidt_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage Orthogonalization Engine Progression",
  subtitle: "Catastrophic Cancellation, BLAS Level-3 Block Reflectors, and QR Solvers",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title:
        "Microarchitecture Realities: BLAS-2 Memory Bandwidth Stalls vs BLAS-3 Block WY Reflectors",
      content:
        "1. **BLAS Level-2 Bottleneck**: Standard Gram-Schmidt algorithms (both CGS and MGS) operate column-by-column, relying on matrix-vector products (BLAS-2 `GEMV`) and vector updates (BLAS-1 `AXPY`). BLAS-2 routines have an arithmetic intensity of $\\mathcal{O}(1)$ FLOPs per byte loaded, causing memory bus saturation on modern GPUs and CPUs.\n2. **Householder Block WY Representation**: Production linear algebra libraries (LAPACK `dgeqrf`, PyTorch `torch.linalg.qr`) group $B$ Householder reflections $H_1 H_2 \\dots H_B$ into a block representation $Q_B = I - W Y^T$ where $W, Y \\in \\mathbb{R}^{m \\times B}$. This transforms column updates into BLAS-3 matrix multiplications (`GEMM`), increasing arithmetic intensity to $\\mathcal{O}(B)$ and saturating GPU Tensor Cores.",
    },
    {
      type: "code_progression",
      title: "Orthogonalization Algorithms: CGS vs MGS vs Householder QR Solver",
      language: "python",
      stages: [
        {
          label: "Stage 1: Classical Gram-Schmidt (CGS) Baseline",
          code: `import numpy as np

def gram_schmidt_classical(A: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Classical Gram-Schmidt (CGS) orthogonalization.
    A has shape (m, n) with m >= n.
    Returns (Q, R) such that A = Q @ R, Q^T @ Q = I, R is upper triangular.
    WARNING: Numerically unstable for ill-conditioned matrices (large kappa(A)).
    """
    m, n = A.shape
    Q = np.zeros((m, n), dtype=np.float64)
    R = np.zeros((n, n), dtype=np.float64)

    for k in range(n):
        v = A[:, k].copy()
        for j in range(k):
            # Inner product against original un-updated components
            R[j, k] = np.dot(Q[:, j], A[:, k])
            v -= R[j, k] * Q[:, j]
            
        norm_v = np.linalg.norm(v)
        R[k, k] = norm_v
        if norm_v > 1e-12:
            Q[:, k] = v / norm_v
        else:
            Q[:, k] = 0.0

    return Q, R`,
          explanation:
            "CGS evaluates $R[j, k] = q_j^T a_k$ against the raw input vector $a_k$. In floating-point arithmetic with ill-conditioned matrices, roundoff errors compound and destroy orthogonality ($Q^T Q \\not\\approx I$).",
          timeComplexity: "O(m * n^2) FLOPs",
          spaceComplexity: "O(m * n + n^2) memory",
        },
        {
          label: "Stage 2: Modified Gram-Schmidt (MGS) Vectorized",
          code: `import numpy as np

def gram_schmidt_modified(A: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Modified Gram-Schmidt (MGS) orthogonalization.
    Sequentially projects remaining columns against newly formed basis vectors.
    Numerically stable with orthogonality loss bounded by O(eps * kappa(A)).
    """
    m, n = A.shape
    # Work on a copy of A columns in-place
    V = A.astype(np.float64).copy()
    Q = np.zeros((m, n), dtype=np.float64)
    R = np.zeros((n, n), dtype=np.float64)

    for k in range(n):
        norm_v = np.linalg.norm(V[:, k])
        R[k, k] = norm_v
        if norm_v > 1e-12:
            Q[:, k] = V[:, k] / norm_v
        else:
            Q[:, k] = 0.0
            
        # Immediately project q_k out of ALL remaining future columns V[:, k+1:n]
        if k < n - 1:
            # Vectorized outer product projection
            # R[k, k+1:n] = Q[:, k]^T @ V[:, k+1:n]
            r_row = np.dot(Q[:, k], V[:, k+1:])
            R[k, k+1:] = r_row
            # V[:, k+1:] -= Q[:, k, None] @ r_row[None, :]
            V[:, k+1:] -= np.outer(Q[:, k], r_row)

    return Q, R`,
          explanation:
            "MGS immediately projects the current basis vector $q_k$ out of all future columns $V_{:, k+1:n}$. This orthogonalization against intermediate residuals guarantees stability in floating point.",
          timeComplexity: "O(m * n^2) FLOPs",
          spaceComplexity: "O(m * n + n^2)",
        },
        {
          label: "Stage 3: Householder QR Factorization with Least-Squares Solver",
          code: `import numpy as np

def householder_qr_solve(A: np.ndarray, b: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Householder QR Factorization and Least Squares Solver: min ||A x - b||_2.
    Uses orthogonal Householder reflection matrices H_k = I - 2 * v v^T / (v^T v).
    Zero loss of orthogonality (to machine precision).
    """
    m, n = A.shape
    R = A.astype(np.float64).copy()
    Q = np.eye(m, dtype=np.float64)
    
    for k in range(n):
        # Extract column below diagonal
        x = R[k:, k]
        norm_x = np.linalg.norm(x)
        if norm_x < 1e-12:
            continue
            
        # Construct Householder reflector vector v
        # Choose sign to avoid catastrophic cancellation: alpha = -sign(x[0]) * norm(x)
        alpha = -np.copysign(norm_x, x[0])
        v = x.copy()
        v[0] -= alpha
        v_norm = np.linalg.norm(v)
        if v_norm < 1e-12:
            continue
        v = v / v_norm  # Unit Householder vector
        
        # Apply reflector H_k = I - 2 * v v^T to R[k:, k:]
        # R[k:, k:] = R[k:, k:] - 2 * v @ (v^T @ R[k:, k:])
        v_dot_R = np.dot(v, R[k:, k:])
        R[k:, k:] -= 2.0 * np.outer(v, v_dot_R)
        
        # Accumulate into Q: Q[:, k:] = Q[:, k:] - 2 * (Q[:, k:] @ v) @ v^T
        Q_dot_v = np.dot(Q[:, k:], v)
        Q[:, k:] -= 2.0 * np.outer(Q_dot_v, v)
        
    # Solve R_top x = Q[:, :n]^T b via back-substitution
    R_top = R[:n, :n]
    d = np.dot(Q[:, :n].T, b)
    x = np.zeros(n, dtype=np.float64)
    for i in range(n - 1, -1, -1):
        x[i] = (d[i] - np.dot(R_top[i, i + 1:], x[i + 1:])) / R_top[i, i]
        
    return Q[:, :n], R_top, x`,
          explanation:
            "Householder reflections eliminate entire sub-diagonal columns via orthogonal transformations $H = I - 2 v v^T / \\|v\\|^2$. This eliminates rounding errors and provides exact machine-precision orthogonality.",
          timeComplexity: "O(2 m n^2 - 2/3 n^3) FLOPs",
          spaceComplexity: "O(m * n + n^2)",
        },
      ],
      stepByStep: [
        "1. Identify condition number $\\kappa(A) = \\sigma_{\\max} / \\sigma_{\\min}$ to assess cancellation risk.",
        "2. For $k = 0 \\dots n-1$, compute Householder reflector $v_k = x_k + \\text{sign}(x_{k,0})\\|x_k\\| e_1$.",
        "3. Apply orthogonal reflector in-place: $R \\leftarrow R - 2 v_k (v_k^T R)$.",
        "4. Solve the upper-triangular linear system $R x = Q^T b$ via backward substitution.",
      ],
    },
  ],
};
