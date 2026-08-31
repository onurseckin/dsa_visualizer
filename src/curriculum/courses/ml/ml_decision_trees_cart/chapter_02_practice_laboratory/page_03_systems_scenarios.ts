import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_decision_trees_cart_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: Tree Systems Diagnostics & Stress Tests",
  subtitle: "Question Bank Suite: Quantized Histogram Binning, Depth Blowups, and XOR Parity Traps",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_decision_trees_cart",
      title: "Decision Trees & CART Systems Suite",
      partA_dsaCoding: [
        {
          title: "Histogram-Based Best Split Evaluator (uint8 Bins)",
          difficulty: "Hard",
          description:
            "Write a Python function that finds the optimal split over pre-binned uint8 feature values in O(B) time using class count histogram arrays.",
          problemStatement:
            "def histogram_best_split(bin_indices: np.ndarray, y: np.ndarray, num_bins: int = 256) -> tuple[int, float]:\n    pass",
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of Maximum Gini Gain Equivalence to Chi-Square Test",
          statement:
            "Prove that for binary classification, maximizing Gini impurity reduction Delta I_G across a 2x2 contingency table is mathematically equivalent to maximizing the Pearson Chi-Square test statistic for independence between the feature split and class label.",
          proofOutline:
            "Write the Gini reduction in terms of table counts n_L0, n_L1, n_R0, n_R1. Show that Delta I_G = 2 * (n_L0 n_R1 - n_L1 n_R0)^2 / (N * n_L * n_R). The Pearson chi-square statistic is chi^2 = N * (n_L0 n_R1 - n_L1 n_R0)^2 / (n_L * n_R * n_0 * n_1) = (N / (2 n_0 n_1)) * Delta I_G.",
          engineeringContext:
            "This mathematical equivalence bridges information-theoretic tree splitting with classical hypothesis testing.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Pre-Sorting vs Histogram-Based Split Memory Bandwidth",
          prompt:
            "In training decision trees on 10 million rows and 500 continuous features, why does pre-sorting feature columns require 40 GB of RAM and thrash CPU caches, while 8-bit histogram binning reduces memory to 5 GB and runs 15x faster?",
          engineeringContext:
            "Pre-sorting requires storing full float32 feature values and int32 permutation indices (8 bytes per entry = 40 GB). 8-bit binning converts each feature to a single uint8 byte (1 byte per entry = 5 GB). Furthermore, evaluating splits on 256 histogram bins fits entirely inside L1/L2 cache (1 KB per histogram), eliminating DRAM bottlenecks.",
        },
      ],
      partD_stressTests: [
        {
          title: "Greedy Split Horizon Effect on XOR Parity Problems",
          scenario:
            "A decision tree is trained on a 2D XOR dataset where y = x_1 XOR x_2. At the root node, evaluating splits on x_1 or x_2 yields exactly 0.0 Information Gain. The tree terminates immediately as a single leaf with 50% training error.",
          failureMode:
            "CART evaluates splits greedily one axis at a time. For XOR parity distributions, projecting onto either axis produces a 50/50 class balance for any orthogonal cut, masking the 2D interaction. Oblique decision trees (hyperplane splits) or random forests / gradient boosting with depth >= 2 resolve this horizon effect.",
        },
      ],
    },
  ],
};
