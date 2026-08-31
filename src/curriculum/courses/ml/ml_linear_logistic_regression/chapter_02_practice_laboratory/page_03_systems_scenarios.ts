import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_linear_logistic_regression_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: Linear Systems Diagnostics & Stress Tests",
  subtitle:
    "Question Bank Suite: Collinear Inversion Breakdown, Perfect Separation Divergence, and FTRL-Proximal",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_linear_logistic_regression",
      title: "Linear & Logistic Regression Systems Suite",
      partA_dsaCoding: [
        {
          title: "Fast FTRL-Proximal Sparse Logistic Regression",
          difficulty: "Hard",
          description:
            "Implement an online Follow-The-Regularized-Leader (FTRL-Proximal) optimizer in Python for large-scale click-through-rate (CTR) prediction with per-coordinate adaptive learning rates and L1/L2 regularization.",
          problemStatement:
            "class FTRLProximalLogisticRegression:\n    def __init__(self, alpha: float, beta: float, l1: float, l2: float):\n        pass",
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of Ridge Regression Shrinkage via SVD",
          statement:
            "Prove that the Ridge regression predictions y_hat_ridge = sum_i (sigma_i^2 / (sigma_i^2 + lambda)) u_i (u_i^T y) shrink the OLS predictions along each principal component by factor sigma_i^2 / (sigma_i^2 + lambda).",
          proofOutline:
            "Substitute the Singular Value Decomposition X = U Sigma V^T into the Ridge formula w_ridge = (V Sigma^2 V^T + lambda I)^{-1} V Sigma U^T y = V (Sigma^2 + lambda I)^{-1} Sigma U^T y. Then X w_ridge = U Sigma V^T V (Sigma^2 + lambda I)^{-1} Sigma U^T y = U (Sigma^2 / (Sigma^2 + lambda I)) U^T y.",
          engineeringContext:
            "This proves that Ridge shrinkage disproportionately penalizes components with small singular values (high noise), stabilizing predictions.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Out-of-Core Normal Equations via Distributed QR / TSQR",
          prompt:
            "When dataset matrix X has 1 billion rows and 1000 columns (8 TB in FP64), computing X^T X directly in RAM is impossible. How does Tall-Skinny QR (TSQR) or MapReduce Gram accumulation compute exact OLS coefficients without memory thrashing?",
          engineeringContext:
            "Chunk X into M row-blocks X_k of size (1M x 1000). Each worker node computes the local 1000x1000 matrix G_k = X_k^T X_k and vector v_k = X_k^T y_k in parallel. A single coordinator sums G = sum G_k and v = sum v_k (only 8 MB of communication) and solves the 1000x1000 system with Cholesky factorization in milliseconds.",
        },
      ],
      partD_stressTests: [
        {
          title: "Perfect Separation Divergence in Unregularized Logistic Regression",
          scenario:
            "A fraud detection model is trained using unregularized Logistic Regression. Because a synthetic feature perfectly separates fraud from non-fraud, the loss decreases towards 0.0 but weights explode to ||w|| > 10^12 and IRLS crashes with singular Hessian errors.",
          failureMode:
            "When data is linearly separable, optimal sigmoid probabilities p_i -> 1 for positive examples and p_i -> 0 for negative examples. To achieve p_i = 1, logits w^T x_i -> +inf, driving weights to infinity. Furthermore, W_ii = p_i(1-p_i) -> 0, collapsing the Hessian H = X^T W X to rank 0. Adding L2 regularization lambda ||w||^2 bounds weights and prevents singularity.",
        },
      ],
    },
  ],
};
