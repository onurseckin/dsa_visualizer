import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_ensemble_xgboost_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: XGBoost Systems Diagnostics & Stress Tests",
  subtitle:
    "Question Bank Suite: GPU Histogram Building, Hessian Vanishing, and Multi-Core Thread Contention",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_ensemble_xgboost",
      title: "Ensemble Learning & XGBoost Systems Suite",
      partA_dsaCoding: [
        {
          title: "GPU-Accelerated Parallel Gradient Histogram Accumulator",
          difficulty: "Hard",
          description:
            "Write a Python function using NumPy that accumulates gradient and hessian statistics into 256 discrete bins in parallel across D features.",
          problemStatement:
            "def batch_feature_histograms(binned_X: np.ndarray, g: np.ndarray, h: np.ndarray, num_bins: int = 256) -> tuple[np.ndarray, np.ndarray]:\n    pass",
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of Out-of-Bag (OOB) Sample Probability 1 - 1/e",
          statement:
            "Prove that when drawing N bootstrap samples with replacement from a dataset of size N, the probability that a specific sample is NOT selected in the bootstrap sample converges to 1/e approx 36.8% as N -> inf, leaving ~63.2% unique samples.",
          proofOutline:
            "The probability of not choosing sample i in a single draw is 1 - 1/N. For N independent draws with replacement, P(not chosen) = (1 - 1/N)^N. Taking the limit lim_{N -> inf} (1 - 1/N)^N = e^{-1} = 1/e approx 0.3679. Therefore, exactly 1 - 1/e approx 63.2% of samples are included.",
          engineeringContext:
            "This mathematical invariant allows Random Forests to evaluate generalization error on the ~36.8% Out-of-Bag (OOB) samples with zero cross-validation computational overhead.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "GPU Shared Memory Atomic Collisions in Histogram Construction",
          prompt:
            "When computing gradient histograms on GPUs (e.g. CUDA `atomicAdd` to 256 shared memory bins across 1024 threads in a block), how do bank conflicts and atomic serialization degrade throughput, and how does per-warp sub-histogram aggregation resolve this?",
          engineeringContext:
            "If 1024 threads in a threadblock all execute atomicAdd on the same bin (e.g. bin 0 for sparse zero features), hardware serializes the writes, stalling SM warps. Per-warp sub-histograms allocate 32 separate 256-bin buffers in shared memory so warps write independently, followed by a fast final reduction.",
        },
      ],
      partD_stressTests: [
        {
          title: "Hessian Vanishing in Imbalanced Logistic Classification",
          scenario:
            "An XGBoost model trained on a 1:1000 imbalanced fraud dataset predicts p_i = 10^{-6}. At step 20, the second order Hessian h_i = p_i(1-p_i) collapses to 10^{-6}, and leaf weights w_j = -G_j / (H_j + lambda) explode wildly when lambda = 0.",
          failureMode:
            "When predictions are confident, logistic Hessian h_i = p_i(1-p_i) -> 0. In an unregularized tree (lambda = 0), a leaf containing confident negatives has H_j -> 0, making the denominator negligible and causing optimal leaf weights to diverge to extreme values (+/- 10^5). Setting min_child_weight >= 1.0 and lambda >= 1.0 regularizes the denominator.",
        },
      ],
    },
  ],
};

export const page3 = page_03_systems_scenarios;
