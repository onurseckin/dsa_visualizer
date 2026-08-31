import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_mle_map_naive_bayes_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: Naive Bayes Systems Diagnostics & Stress Tests",
  subtitle:
    "Question Bank Suite: Sparse Vocabulary Matrix Caching, OOV Annihilation, and Floating Point Bounds",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_mle_map_naive_bayes",
      title: "MLE, MAP & Naive Bayes Systems Suite",
      partA_dsaCoding: [
        {
          title: "Sparse CSR Matrix Fast Naive Bayes Inference",
          difficulty: "Hard",
          description:
            "Write a Python function that executes Multinomial Naive Bayes inference on a Scipy Compressed Sparse Row (CSR) matrix, iterating only over non-zero token occurrences to achieve O(nnz) inference latency.",
          problemStatement:
            "def sparse_csr_naive_bayes_predict(csr_matrix, log_likelihoods: np.ndarray, log_priors: np.ndarray) -> np.ndarray:\n    pass",
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of Normal-Normal Posterior Precision Summation",
          statement:
            "Prove that for observations X_1..X_N ~ N(mu, sigma^2) with known variance sigma^2 and prior mu ~ N(mu_0, sigma_0^2), the posterior precision 1/sigma_N^2 equals 1/sigma_0^2 + N/sigma^2.",
          proofOutline:
            "Combine the Gaussian exponent of the prior -0.5 * (mu - mu_0)^2 / sigma_0^2 with the likelihood exponent -0.5 * sum (x_i - mu)^2 / sigma^2. The quadratic coefficient of mu^2 is 1/sigma_0^2 + N/sigma^2, which defines the inverse variance (precision) of the Gaussian posterior.",
          engineeringContext:
            "This confirms that each independent observation adds exactly 1/sigma^2 units of precision (information) to the model's posterior belief.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Precomputed Log-Likelihood Matrix Memory Layout & Cache Alignment",
          prompt:
            "In high-frequency email spam filtering classifying 10,000 incoming emails/second over 100,000 vocabulary words across 20 spam categories, why must the log-likelihood matrix be stored in Fortran (column-major) or C (row-major) order depending on batch size?",
          engineeringContext:
            "When classifying one email at a time (sparse query vector), column-major storage clusters each word's class weights in contiguous memory. When classifying high-throughput dense batches X (N x V), storing W in C-contiguous format (V x C) allows Level-3 BLAS GEMM to vectorize inner products across CPU AVX-512 registers.",
        },
      ],
      partD_stressTests: [
        {
          title: "Out-Of-Vocabulary (OOV) Zero Probability Annihilation",
          scenario:
            "A sentiment classifier trained without Laplace smoothing (alpha = 0) is deployed to production. A single test review containing the word 'iPhone16' receives predicted probability 0.0 for BOTH Positive and Negative classes.",
          failureMode:
            "Because 'iPhone16' was never seen in the training corpus, count(iPhone16, c) = 0 for all classes. With alpha = 0, p(iPhone16 | c) = 0. Multiplying 0 across the joint probability sets p(c | doc) = 0 for all classes, causing a 0/0 NaN division when normalizing posterior probabilities. Setting alpha >= 1 fixes the crash.",
        },
      ],
    },
  ],
};
