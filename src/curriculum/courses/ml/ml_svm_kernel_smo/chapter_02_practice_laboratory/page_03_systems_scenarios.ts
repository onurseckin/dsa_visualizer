import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_svm_kernel_smo_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: SVM Systems Diagnostics & Stress Tests",
  subtitle:
    "Question Bank Suite: Random Fourier Features, RBF Gamma Collapse, and Kernel Cache Evictions",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_svm_kernel_smo",
      title: "Support Vector Machines Systems Suite",
      partA_dsaCoding: [
        {
          title: "Random Fourier Features (RFF) Linear Kernel Approximator",
          difficulty: "Hard",
          description:
            "Implement Rahimi & Recht Random Fourier Features in Python to approximate the Gaussian RBF kernel via randomized cosine feature projections z(x) = sqrt(2/D_RFF) * cos(W x + b), reducing inference complexity from O(N_SV) to O(D_RFF).",
          problemStatement:
            "class RandomFourierFeatures:\n    def __init__(self, gamma: float = 0.1, n_components: int = 500):\n        pass",
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of SVM Support Vector Sparsity via KKT Stationarity",
          statement:
            "Prove that any training sample x_i with functional margin y_i(w^T phi(x_i) + b) > 1 strictly has dual multiplier alpha_i = 0, proving that only margin-boundary and misclassified points become support vectors.",
          proofOutline:
            "By KKT complementary slackness, alpha_i (y_i (w^T phi(x_i) + b) - 1 + xi_i) = 0 and mu_i xi_i = 0 with alpha_i + mu_i = C. If functional margin > 1, slack variable xi_i = 0 (since xi_i = max(0, 1 - margin) = 0). Then the margin constraint term is strictly positive (> 0), forcing alpha_i = 0.",
          engineeringContext:
            "This mathematical sparsity property ensures that dual prediction time depends solely on the number of support vectors rather than total dataset size.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "LIBSVM Shrinking & Working Set Caching Architecture",
          prompt:
            "In LIBSVM/scikit-learn, how does the 'shrinking' heuristic temporarily remove bounded multipliers (alpha_i = 0 or alpha_i = C) from the active optimization set during SMO iterations to achieve 5x-10x speedups on large datasets?",
          engineeringContext:
            "Variables that hit bounds 0 or C early in optimization rarely change in later stages. The shrinking heuristic identifies variables that are unlikely to change, shrinks the working set size to only free variables (0 < alpha_i < C), and performs SMO iterations on this tiny active subset. At convergence, a single full pass verifies KKT conditions across all samples.",
        },
      ],
      partD_stressTests: [
        {
          title: "Hyperparameter Collapse: Infinite Gamma Overfitting Spike",
          scenario:
            "An engineer trains an RBF SVM with gamma = 1000.0 on a 2D dataset. Training accuracy is 100.0%, but test accuracy drops to 50.0% (random guessing).",
          failureMode:
            "When gamma -> inf, K(x_i, x_j) = exp(-1000 ||x_i - x_j||^2) -> 0 for any distinct points x_i != x_j. The Gram matrix becomes the identity matrix I_N. Every training point becomes an isolated delta-spike support vector (alpha_i = C), and the decision boundary forms tiny pinholes around training samples, losing all generalization capability. Tuning gamma via cross-validation (e.g. gamma in [1/D, 0.01]) resolves this.",
        },
      ],
    },
  ],
};
