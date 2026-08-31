import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "ml_matrix_svd_pca_c2_p3",
  pageNumber: 3,
  title: "Silicon Battleground: SVD & PCA Systems Scenarios & Diagnostics",
  subtitle: "Question Bank Suite: Embedding Compression, Memory OOM, and Condition Squaring",
  estimatedMinutes: 35,
  sections: [
    {
      type: "question_bank_suite",
      topicId: "ml_matrix_svd_pca",
      title: "Matrix SVD & PCA Systems Suite",
      partA_dsaCoding: [
        {
          title: "Low-Rank Image / Weight Matrix Compression",
          difficulty: "Hard",
          description:
            "Write a function that compresses a large Linear layer weight matrix W (D_out x D_in) into two smaller low-rank matrices A (D_out x rank) and B (rank x D_in) using truncated SVD, absorbing singular values into A.",
          problemStatement:
            'def compress_weight_lora_svd(W: np.ndarray, rank: int) -> tuple[np.ndarray, np.ndarray]:\n    """Return A (D_out, rank) and B (rank, D_in) such that W approx A @ B."""\n    pass',
        },
      ],
      partB_mathProofs: [
        {
          title: "Proof of Total Reconstruction Error Equality to Discarded Eigenvalues",
          statement:
            "Prove that the total squared reconstruction error of PCA projecting N centered D-dimensional data points onto k principal components equals (N-1) * sum_{j=k+1}^D lambda_j.",
          proofOutline:
            "Reconstruction error is ||X_c - X_c V_k V_k^T||_F^2 = ||X_c (I - V_k V_k^T)||_F^2. Substituting X_c = U Sigma V^T yields ||U Sigma V^T (I - V_k V_k^T)||_F^2 = ||U Sigma (V_{>k} V_{>k}^T)||_F^2 = ||Sigma_{>k}||_F^2 = sum_{j=k+1}^D sigma_j^2 = (N-1) * sum_{j=k+1}^D lambda_j.",
          engineeringContext:
            "This gives machine learning practitioners an exact analytical closed-form for the information loss incurred when compressing embeddings or dataset features.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Large-Scale LLM Embedding Decomposition: Out-Of-Core SVD",
          prompt:
            "When compressing a 256,000 x 8192 embedding vocabulary table on a single GPU with 24GB VRAM, standard torch.linalg.svd fails with CUDA OOM. How does block-wise randomized SVD solve this?",
          engineeringContext:
            "Full SVD requires materializing massive intermediate orthogonal matrices. Block-wise RSVD streams chunks of the 256K rows through GPU VRAM in mini-batches to compute the small (k+p) x 8192 projection B, requiring only a fraction of GPU memory.",
        },
      ],
      partD_stressTests: [
        {
          title: "Catastrophic Precision Loss in Covariance Matrix Squaring",
          scenario:
            "A genomics dataset has 50,000 features where the ratio of largest to smallest feature variation is 10^5 (condition number kappa = 10^5). A practitioner computes np.linalg.eigh(np.cov(X.T)) in FP32 and finds that all trailing 25,000 eigenvalues are reported as negative numbers.",
          failureMode:
            "In FP32 (24 bits of mantissa, ~7 decimal digits of precision), squaring the condition number produces kappa^2 = 10^10, which exceeds 10^7. The smallest eigenvalues underflow into numerical noise and roundoff error generates false negative eigenvalues. Switching to direct SVD on X_c (without forming cov(X)) solves the problem.",
        },
      ],
    },
  ],
};

export const page3 = page_03_systems_scenarios;
