import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_distributions_covariance_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: Covariance Systems Diagnostics & Stress Tests",
  subtitle: "Question Bank Suite: Cholesky Failures, GMM Component Collapse, and Shrinkage",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_distributions_covariance",
      title: "Multivariate Distributions & Covariance Systems Suite",
      partA_dsaCoding: [
        {
          title: "Ledoit-Wolf Covariance Shrinkage Estimator",
          difficulty: "Hard",
          description:
            "Implement the Ledoit-Wolf optimal shrinkage estimator Sigma_shrunk = (1 - alpha) * Sigma_sample + alpha * (Tr(Sigma)/D) * I to stabilize covariance estimation in high dimensions when N < D.",
          problemStatement: "def ledoit_wolf_shrinkage(X: np.ndarray) -> np.ndarray:\n    pass",
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of Conditional Independence in Precision Matrix",
          statement:
            "Prove that for a zero-mean multivariate Gaussian X ~ N(0, Sigma) with precision matrix Theta = Sigma^{-1}, the conditional distribution of X_i given X_{-i} has mean - sum_{j != i} (Theta_{ij} / Theta_{ii}) X_j, implying X_i is conditionally independent of X_j iff Theta_{ij} = 0.",
          proofOutline:
            "Partition the precision matrix Theta and random vector X into [X_i, X_{-i}]^T. The quadratic form in the exponent is -0.5 * (Theta_{ii} x_i^2 + 2 x_i Theta_{i, -i} x_{-i} + x_{-i}^T Theta_{-i, -i} x_{-i}). Completing the square with respect to x_i yields a 1D Gaussian with mean - Theta_{i, -i} x_{-i} / Theta_{ii} and variance 1 / Theta_{ii}. If Theta_{ij} = 0, the mean is independent of x_j.",
          engineeringContext:
            "This property is the foundation of Graphical Lasso, enabling sparse precision matrix estimation to discover gene regulatory and financial market dependency graphs.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Cholesky Decomposition Failure Modes in Distributed Kalman Filters",
          prompt:
            "Why do covariance updates in high-rate tracking systems (e.g. self-driving perception) frequently crash with non-positive definite matrix errors, and how does the Joseph-form covariance update Sigma_new = (I - K H) Sigma (I - K H)^T + K R K^T guarantee stability?",
          engineeringContext:
            "The standard Kalman update Sigma_new = (I - K H) Sigma involves subtracting matrices, which in floating-point arithmetic can destroy symmetry and produce negative eigenvalues. The Joseph form is a sum of two symmetric positive semi-definite quadratic forms A Sigma A^T + B R B^T, guaranteeing exact PSD preservation in floating point.",
        },
      ],
      partD_stressTests: [
        {
          title: "Singularity Collapse in Gaussian Mixture Models",
          scenario:
            "During EM training of a 10-component GMM on 2D sensor data, component 7's variance drops to 1e-18 on iteration 14, causing the entire model to output NaN responsibilities.",
          failureMode:
            "If a GMM component centroid mu_k lands exactly on a single training data point x_n, the component responsibility gamma_{nk} -> 1, and the variance sigma_k^2 -> 0. As sigma_k -> 0, the probability density N(x_n | mu_k, sigma_k) -> +inf, creating a Dirac delta singularity that ruins the log-likelihood. Enforcing a minimum variance floor (reg_covar >= 1e-6) prevents component collapse.",
        },
      ],
    },
  ],
};
