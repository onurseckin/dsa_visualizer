import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_svm_kernel_smo_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: Platt's SMO & RBF Kernel Solvers",
  subtitle: "Interactive Implementation of 2-Variable Coordinate Solvers and Kernel Evaluations",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_smo_two_variable_step",
      title: "Platt's SMO Analytical 2-Variable Step Engine",
      difficulty: "Hard",
      rationale:
        "Validates exact implementation of 2-variable coordinate updates with quadratic curvature eta and box clipping [L, H].",
      starterCode: `import numpy as np

def smo_two_variable_step(
    alpha1: float,
    alpha2: float,
    y1: int,
    y2: int,
    E1: float,
    E2: float,
    K11: float,
    K22: float,
    K12: float,
    C: float = 1.0
) -> tuple[float, float]:
    """
    Executes an analytical 2-variable SMO step for (alpha1, alpha2).
    
    Returns:
        (alpha1_new, alpha2_new)
    """
    # 1. Compute clipping bounds [L, H]
    if y1 != y2:
        L = max(0.0, alpha2 - alpha1)
        H = min(C, C + alpha2 - alpha1)
    else:
        L = max(0.0, alpha1 + alpha2 - C)
        H = min(C, alpha1 + alpha2)
        
    if L >= H:
        return alpha1, alpha2
        
    # 2. Curvature eta = 2 K12 - K11 - K22
    eta = 2.0 * K12 - K11 - K22
    if eta >= 0:
        return alpha1, alpha2  # Non-negative curvature
        
    # 3. Unclipped update
    alpha2_unclipped = alpha2 - (y2 * (E1 - E2)) / eta
    
    # 4. Box clipping
    alpha2_new = min(H, max(L, alpha2_unclipped))
    
    # 5. Coordinate update for alpha1
    alpha1_new = alpha1 + y1 * y2 * (alpha2 - alpha2_new)
    
    return float(alpha1_new), float(alpha2_new)

if __name__ == "__main__":
    a1, a2 = smo_two_variable_step(
        alpha1=0.2, alpha2=0.5,
        y1=1, y2=-1,
        E1=-0.5, E2=0.5,
        K11=1.0, K22=1.0, K12=0.2,
        C=1.0
    )
    print(f"Updated Alphas: alpha1={a1:.4f}, alpha2={a2:.4f}")
    assert 0 <= a1 <= 1.0 and 0 <= a2 <= 1.0, "Alphas violate [0, C] box constraints!"
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_rbf_kernel_support_vector_predictor",
      title: "RBF Support Vector Score Evaluator Engine",
      difficulty: "Hard",
      rationale:
        "Evaluates kernel decision function f(x) = sum alpha_i y_i exp(-gamma ||x_i - x||^2) + b over sparse support vectors.",
      starterCode: `import numpy as np

def rbf_svm_predict(
    X_query: np.ndarray,
    support_vectors: np.ndarray,
    dual_coefficients: np.ndarray,
    b: float,
    gamma: float = 0.1
) -> np.ndarray:
    """
    Evaluates predictions for query matrix X_query (N_test, D)
    given support vectors (N_sv, D) and dual_coefficients alpha_i * y_i (N_sv,).
    
    Returns:
        predictions: Integer array of shape (N_test,) with values in {-1, +1}
    """
    # 1. Squared Euclidean distances: (N_test, N_sv)
    q_sq = np.sum(X_query ** 2, axis=1, keepdims=True)            # (N_test, 1)
    sv_sq = np.sum(support_vectors ** 2, axis=1, keepdims=True)   # (N_sv, 1)
    sq_dists = q_sq - 2.0 * np.dot(X_query, support_vectors.T) + sv_sq.T  # (N_test, N_sv)
    
    # 2. Kernel evaluation K(X_query, SV)
    K = np.exp(-gamma * np.maximum(sq_dists, 0.0))
    
    # 3. Decision scores f(x) = K @ dual_coefficients + b
    scores = np.dot(K, dual_coefficients) + b
    
    return np.where(scores >= 0, 1, -1).astype(np.int32)
`,
    },
  ],
};
