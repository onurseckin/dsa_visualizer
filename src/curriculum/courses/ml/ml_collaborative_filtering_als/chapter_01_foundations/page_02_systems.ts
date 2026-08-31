import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_collaborative_filtering_als_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage Collaborative Filtering Progression",
  subtitle: "Dual CSR/CSC Indexing, Embarrassing Thread Parallelism, and Fast Gram ALS",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Microarchitecture Realities: Dual CSR/CSC Indexing & Lock-Free Thread Scaling",
      content:
        "1. **Dual CSR / CSC Sparse Representations**: During the user update step, the algorithm queries rows $R_{u, :}$ sequentially (requiring Compressed Sparse Row - CSR format). During the item update step, it queries columns $R_{:, i}$ sequentially (requiring Compressed Sparse Column - CSC format). Transposing a 100-million non-zero CSR matrix dynamically inside the training loop wastes memory bandwidth. Pre-allocating paired CSR and CSC buffers enables zero-copy cache-aligned streaming across both update phases.\n2. **Lock-Free Multi-Threaded Partitioning**: Because user factors $u_u$ depend solely on item matrix $V$ (which is frozen during the user phase), all $M$ user updates are completely decoupled and embarrassingly parallel. Threads process disjoint user chunks with zero synchronization locks or atomic contention, achieving linear speedup across CPU cores and GPU streaming multiprocessors.",
    },
    {
      type: "code_progression",
      title: "From SGD Matrix Factorization to High-Throughput Implicit ALS",
      language: "python",
      stages: [
        {
          label: "Stage 1: Pure Python SGD Matrix Factorization",
          code: `class PurePythonSGDMatrixFactorization:
    """
    Naive SGD Matrix Factorization on explicit rating tuples (u, i, r).
    """
    def __init__(self, n_users: int, n_items: int, n_factors: int = 16, lr: float = 0.01, reg: float = 0.02):
        import random
        self.lr = lr
        self.reg = reg
        self.U = [[random.uniform(-0.1, 0.1) for _ in range(n_factors)] for _ in range(n_users)]
        self.V = [[random.uniform(-0.1, 0.1) for _ in range(n_factors)] for _ in range(n_items)]

    def train_step(self, ratings: list[tuple[int, int, float]]):
        for u, i, r in ratings:
            # Predict: dot(u_u, v_i)
            pred = sum(self.U[u][f] * self.V[i][f] for f in range(len(self.U[0])))
            err = r - pred
            # Gradient updates
            for f in range(len(self.U[0])):
                u_f = self.U[u][f]
                v_f = self.V[i][f]
                self.U[u][f] += self.lr * (err * v_f - self.reg * u_f)
                self.V[i][f] += self.lr * (err * u_f - self.reg * v_f)`,
          explanation:
            "SGD updates factors one rating at a time, suffering from random memory lookups and high interpreter overhead.",
          timeComplexity: "O(Ratings * Factors)",
          spaceComplexity: "O(M * F + N * F)",
        },
        {
          label: "Stage 2: Vectorized Explicit Alternating Least Squares (ALS)",
          code: `import numpy as np

class VectorizedExplicitALS:
    """
    Vectorized Explicit ALS for observed ratings.
    Solves normal equations: u_u = (V_obs^T V_obs + lambda I)^{-1} V_obs^T r_u.
    """
    def __init__(self, n_users: int, n_items: int, n_factors: int = 32, l2_reg: float = 0.1, max_iter: int = 10):
        self.M = n_users
        self.N = n_items
        self.F = n_factors
        self.l2_reg = l2_reg
        self.max_iter = max_iter
        rng = np.random.default_rng(42)
        self.U = rng.normal(0.0, 0.1, (n_users, n_factors))
        self.V = rng.normal(0.0, 0.1, (n_items, n_factors))

    def fit(self, user_item_ratings: dict[int, list[tuple[int, float]]], item_user_ratings: dict[int, list[tuple[int, float]]]):
        eye_f = self.l2_reg * np.eye(self.F)
        
        for iteration in range(self.max_iter):
            # 1. Update Users: U_u = (V_i^T V_i + reg * I)^-1 V_i^T r
            for u in range(self.M):
                items = user_item_ratings.get(u, [])
                if not items:
                    continue
                item_indices = [it[0] for it in items]
                r_vals = np.array([it[1] for it in items])
                V_sub = self.V[item_indices]  # (K, F)
                
                A = np.dot(V_sub.T, V_sub) + eye_f
                b = np.dot(V_sub.T, r_vals)
                self.U[u] = np.linalg.solve(A, b)
                
            # 2. Update Items: V_i = (U_u^T U_u + reg * I)^-1 U_u^T r
            for i in range(self.N):
                users = item_user_ratings.get(i, [])
                if not users:
                    continue
                user_indices = [us[0] for us in users]
                r_vals = np.array([us[1] for us in users])
                U_sub = self.U[user_indices]  # (K, F)
                
                A = np.dot(U_sub.T, U_sub) + eye_f
                b = np.dot(U_sub.T, r_vals)
                self.V[i] = np.linalg.solve(A, b)`,
          explanation:
            "Explicit ALS solves exact least squares subproblems alternating between user and item matrices.",
          timeComplexity: "O(Iters * (Ratings * F^2 + (M + N) * F^3))",
          spaceComplexity: "O(M * F + N * F)",
        },
        {
          label: "Stage 3: High-Performance Implicit ALS Engine with Fast Gram Precomputation",
          code: `import numpy as np
import scipy.sparse as sp

class FastImplicitALSEngine:
    """
    High-Performance Implicit ALS Recommender Engine.
    Uses precomputed Gram matrices (V^T V) and Cholesky solvers for O(|R_u| F^2 + F^3) updates.
    """
    def __init__(self, n_factors: int = 64, l2_reg: float = 0.01, alpha: float = 40.0, max_iter: int = 15):
        self.F = n_factors
        self.l2_reg = l2_reg
        self.alpha = alpha
        self.max_iter = max_iter
        self.U: np.ndarray | None = None
        self.V: np.ndarray | None = None

    def fit(self, C_ui_csr: sp.csr_matrix) -> "FastImplicitALSEngine":
        """
        C_ui_csr: Sparse CSR interaction matrix (Users, Items)
        """
        M, N = C_ui_csr.shape
        # Create transposed CSC matrix for fast item slicing
        C_ui_csc = C_ui_csr.tocsc()
        
        rng = np.random.default_rng(42)
        self.U = np.ascontiguousarray(rng.normal(0.0, 0.01, (M, self.F)), dtype=np.float64)
        self.V = np.ascontiguousarray(rng.normal(0.0, 0.01, (N, self.F)), dtype=np.float64)
        eye_f = self.l2_reg * np.eye(self.F, dtype=np.float64)

        for iteration in range(self.max_iter):
            # --- Phase 1: User Updates ---
            # Precompute Global Gram Matrix V^T V: O(N * F^2)
            VtV = np.dot(self.V.T, self.V) + eye_f  # (F, F)
            
            for u in range(M):
                start, end = C_ui_csr.indptr[u], C_ui_csr.indptr[u + 1]
                if start == end:
                    continue  # Cold user
                item_indices = C_ui_csr.indices[start:end]
                r_values = C_ui_csr.data[start:end]
                
                # Confidence: c = 1 + alpha * r => (c - 1) = alpha * r
                c_minus_one = self.alpha * r_values
                V_sub = self.V[item_indices]  # (K, F)
                
                # Fast rank-1 update: A = V^T V + V_sub^T @ diag(c-1) @ V_sub
                # Vectorized: (V_sub * sqrt(c-1))^T @ (V_sub * sqrt(c-1))
                V_weighted = V_sub * np.sqrt(c_minus_one)[:, None]
                A = VtV + np.dot(V_weighted.T, V_weighted)  # (F, F)
                
                # Right-hand side b = V_sub^T @ (c * p) where p=1 => V_sub^T @ (1 + alpha * r)
                c_values = 1.0 + c_minus_one
                b = np.dot(V_sub.T, c_values)  # (F,)
                
                # Cholesky solve: A @ u_u = b
                L = np.linalg.cholesky(A)
                self.U[u] = np.linalg.solve(L.T, np.linalg.solve(L, b))

            # --- Phase 2: Item Updates ---
            # Precompute Global Gram Matrix U^T U: O(M * F^2)
            UtU = np.dot(self.U.T, self.U) + eye_f  # (F, F)
            
            for i in range(N):
                start, end = C_ui_csc.indptr[i], C_ui_csc.indptr[i + 1]
                if start == end:
                    continue  # Cold item
                user_indices = C_ui_csc.indices[start:end]
                r_values = C_ui_csc.data[start:end]
                
                c_minus_one = self.alpha * r_values
                U_sub = self.U[user_indices]
                
                U_weighted = U_sub * np.sqrt(c_minus_one)[:, None]
                A = UtU + np.dot(U_weighted.T, U_weighted)
                
                c_values = 1.0 + c_minus_one
                b = np.dot(U_sub.T, c_values)
                
                L = np.linalg.cholesky(A)
                self.V[i] = np.linalg.solve(L.T, np.linalg.solve(L, b))

        return self`,
          explanation:
            "Implicit ALS combines dual CSR/CSC sparse representations, precomputed $F \\times F$ Gram matrices ($V^T V, U^T U$), and fast lower-triangular Cholesky solves to process billions of implicit interactions in minutes.",
          timeComplexity: "O(Iters * (NNZ * F^2 + (M + N) * F^3))",
          spaceComplexity: "O(M * F + N * F + NNZ)",
        },
      ],
      stepByStep: [
        "1. Load sparse interaction ratings into paired CSR (row-major) and CSC (column-major) matrices.",
        "2. Compute the global Gram matrix $V^T V = \\sum v_i v_i^T + \\lambda I_F$ in $O(N F^2)$ time.",
        "3. For each user $u$, form linear system $A = V^T V + \\sum_{i \\in \\mathcal{R}_u} \\alpha r_{ui} v_i v_i^T$.",
        "4. Solve the $F \\times F$ system via Cholesky factorization $L L^T u_u = b$ in $O(F^3/3)$ time.",
        "5. Swap roles, precompute $U^T U$, and solve for all item factors $v_i$ using the CSC matrix.",
      ],
    },
  ],
};
