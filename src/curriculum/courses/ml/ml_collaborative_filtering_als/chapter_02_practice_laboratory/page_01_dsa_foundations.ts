import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_collaborative_filtering_als_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: Fast Implicit ALS & CSR Solvers",
  subtitle: "Interactive Implementation of Gram Factorization and Sparse Recommendation Solvers",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_implicit_als_user_step_engine",
      title: "Fast Implicit ALS User Update Engine",
      difficulty: "Hard",
      rationale:
        "Validates exact implementation of Gram matrix precomputation, sparse rank-1 confidence updates, and Cholesky linear solves.",
      starterCode: `import numpy as np

def implicit_als_user_update(
    item_indices: np.ndarray,
    r_values: np.ndarray,
    V: np.ndarray,
    VtV: np.ndarray,
    alpha: float = 40.0,
    l2_reg: float = 0.01
) -> np.ndarray:
    """
    Computes optimal user latent vector u_u in O(|R_u| F^2 + F^3) time.
    
    Args:
        item_indices: 1D array of interacted item indices (K,)
        r_values: 1D array of interaction counts / ratings (K,)
        V: Complete item matrix (N_items, F)
        VtV: Precomputed global Gram matrix V^T V + lambda * I (F, F)
        alpha: Confidence scale
        l2_reg: L2 regularization constant
        
    Returns:
        u_u: Updated user factor vector (F,)
    """
    F = V.shape[1]
    if len(item_indices) == 0:
        return np.zeros(F, dtype=np.float64)
        
    V_sub = V[item_indices]  # (K, F)
    # c_ui = 1 + alpha * r => (c_ui - 1) = alpha * r
    c_minus_one = alpha * r_values
    
    # Form A = VtV + sum (c_ui - 1) v_i v_i^T
    # Vectorized: (V_sub * sqrt(c-1))^T @ (V_sub * sqrt(c-1))
    V_weighted = V_sub * np.sqrt(c_minus_one)[:, None]
    A = VtV + np.dot(V_weighted.T, V_weighted)
    
    # Form b = sum c_ui v_i = sum (1 + alpha * r) v_i
    c_values = 1.0 + c_minus_one
    b = np.dot(V_sub.T, c_values)
    
    # Solve A @ u_u = b via Cholesky
    L = np.linalg.cholesky(A)
    u_u = np.linalg.solve(L.T, np.linalg.solve(L, b))
    
    return u_u

if __name__ == "__main__":
    np.random.seed(42)
    F = 4
    N = 10
    V_mock = np.random.randn(N, F)
    VtV_mock = np.dot(V_mock.T, V_mock) + 0.1 * np.eye(F)
    it_idx = np.array([1, 4, 7])
    r_val = np.array([2.0, 5.0, 1.0])
    u_vec = implicit_als_user_update(it_idx, r_val, V_mock, VtV_mock)
    print("Computed User Vector:", np.round(u_vec, 4))
    assert u_vec.shape == (F,) and not np.isnan(u_vec).any(), "User vector computation failed!"
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_matrix_factorization_top_k_recommender",
      title: "Latent Dot-Product Top-K Recommendation Engine",
      difficulty: "Hard",
      rationale:
        "Computes dot-product preference scores u_u^T v_i across items, masking out already interacted items and returning top-K recommendations.",
      starterCode: `import numpy as np

def recommend_top_k(
    user_vector: np.ndarray,
    item_matrix: np.ndarray,
    seen_items: set[int],
    k: int = 10
) -> list[tuple[int, float]]:
    """
    Computes top-k item recommendations for a user given their latent vector.
    
    Args:
        user_vector: (F,) array
        item_matrix: (N_items, F) array
        seen_items: Set of item IDs to filter out
        k: Number of recommendations to return
        
    Returns:
        recommendations: List of (item_id, score) sorted descending
    """
    # 1. Compute dot product scores: (N_items,)
    scores = np.dot(item_matrix, user_vector)
    
    # 2. Mask out already seen items
    if seen_items:
        scores[list(seen_items)] = -np.inf
        
    # 3. Extract top-k indices
    top_indices = np.argsort(scores)[::-1][:k]
    return [(int(idx), float(scores[idx])) for idx in top_indices]
`,
    },
  ],
};
