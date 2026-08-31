import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_mle_map_naive_bayes_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage Naive Bayes Progression",
  subtitle: "Log-Space Underflow Prevention, Laplace Smoothing, and GEMM Log-Likelihood Engines",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Microarchitecture Realities: IEEE 754 Underflow & GEMM Log-Likelihood Acceleration",
      content:
        "1. **Floating-Point Probability Annihilation**: In text classification with vocabulary $|V| = 50{,}000$, multiplying 100 word probabilities $p = \\prod_{i=1}^{100} p(w_i \\mid c) \\approx 10^{-400}$ severely underflows the minimum normal 64-bit IEEE 754 float ($2.22 \\times 10^{-308}$), evaluating to `0.0` identically across all classes. Working strictly in log-space $\\ln p(c) + \\sum \\ln p(w_i \\mid c)$ replaces products with additions and eliminates underflow.\n2. **Zero-Probability Collapse & Laplace Smoothing**: If an unseen token $w$ appears in a test document, empirical $p(w \\mid c) = 0$, which instantly annihilates the joint probability of class $c$ regardless of all other evidence. Additive Laplace smoothing $\\hat{p}(w \\mid c) = \\frac{\\text{count}(w, c) + \\alpha}{\\text{count}(c) + \\alpha |V|}$ bounds minimum log-probabilities.\n3. **GEMM Log-Likelihood Acceleration**: By precomputing the log-prior vector $b_c = \\ln p(c)$ and log-likelihood matrix $W_{c, d} = \\ln p(x_d \\mid c)$, multi-class inference across a batch of $N$ documents reduces to a single hardware-accelerated matrix multiplication: $\\text{Scores} = X W^T + b$.",
    },
    {
      type: "code_progression",
      title: "From Naive Probability Products to High-Throughput GEMM Naive Bayes",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive Probability Product (Prone to Underflow)",
          code: `def naive_multinomial_predict(
    doc_word_counts: dict[str, int],
    class_priors: dict[str, float],
    word_probs: dict[str, dict[str, float]]
) -> str:
    """
    Naive implementation multiplying raw probabilities.
    WARNING: Collapses to 0.0 for long documents or unseen words.
    """
    best_class = None
    best_prob = -1.0
    
    for c, prior in class_priors.items():
        prob = prior
        for word, count in doc_word_counts.items():
            if word in word_probs[c]:
                prob *= (word_probs[c][word] ** count)
            else:
                prob = 0.0  # Zero frequency collapse!
                
        if prob > best_prob:
            best_prob = prob
            best_class = c
            
    return best_class`,
          explanation:
            "Direct multiplication of probabilities causes floating-point underflow to zero and fails catastrophically on out-of-vocabulary words.",
          timeComplexity: "O(Classes * DistinctWords)",
          spaceComplexity: "O(1) memory",
        },
        {
          label: "Stage 2: Vectorized Multinomial Naive Bayes with Laplace Smoothing",
          code: `import numpy as np

class MultinomialNaiveBayes:
    """
    Vectorized Multinomial Naive Bayes with Additive Laplace (alpha) Smoothing.
    Operates strictly in log-space to prevent underflow.
    """
    def __init__(self, alpha: float = 1.0):
        self.alpha = alpha
        self.log_priors_: np.ndarray | None = None          # (C,)
        self.feature_log_prob_: np.ndarray | None = None     # (C, V)
        self.classes_: np.ndarray | None = None             # (C,)

    def fit(self, X: np.ndarray, y: np.ndarray) -> "MultinomialNaiveBayes":
        """
        X: Word count matrix of shape (N_samples, V_vocab)
        y: Integer class labels of shape (N_samples,)
        """
        N, V = X.shape
        self.classes_ = np.unique(y)
        C = len(self.classes_)
        
        # 1. Compute empirical class priors: ln P(y = c)
        class_counts = np.bincount(y, minlength=C)
        self.log_priors_ = np.log(class_counts / N)
        
        # 2. Compute Laplace-smoothed feature log-probabilities: ln P(x_d | c)
        # Sum word counts per class: (C, V)
        count_per_class = np.zeros((C, V), dtype=np.float64)
        for c in range(C):
            count_per_class[c] = np.sum(X[y == c], axis=0)
            
        # Add-alpha smoothing: (count + alpha) / (total_words_in_class + alpha * V)
        smoothed_counts = count_per_class + self.alpha
        smoothed_totals = np.sum(smoothed_counts, axis=1, keepdims=True)
        self.feature_log_prob_ = np.log(smoothed_counts / smoothed_totals)
        
        return self

    def predict_log_proba(self, X: np.ndarray) -> np.ndarray:
        """Matrix product: log_p(y | x) = X @ log_p(x|c)^T + log_p(c)."""
        # (N, V) @ (V, C) + (C,) -> (N, C)
        return np.dot(X, self.feature_log_prob_.T) + self.log_priors_

    def predict(self, X: np.ndarray) -> np.ndarray:
        log_probs = self.predict_log_proba(X)
        return self.classes_[np.argmax(log_probs, axis=1)]`,
          explanation:
            "Vectorized NumPy implementation fits word counts across all classes simultaneously and performs classification in log-space with Laplace smoothing.",
          timeComplexity: "O(N * V) fitting, O(N_test * C * V) prediction",
          spaceComplexity: "O(C * V) parameter storage",
        },
        {
          label: "Stage 3: High-Throughput GEMM Log-Likelihood Engine",
          code: `import numpy as np

class FastLogSpaceNaiveBayes:
    """
    High-Throughput BLAS-3 Accelerated Log-Space Inference Engine.
    Pre-packs weights into contiguous C-order matrices for maximum AVX-512/GPU throughput.
    """
    def __init__(self, log_priors: np.ndarray, log_likelihoods: np.ndarray):
        # Ensure contiguous FP64/FP32 memory layouts
        self.log_priors = np.ascontiguousarray(log_priors, dtype=np.float64)        # (C,)
        self.W = np.ascontiguousarray(log_likelihoods.T, dtype=np.float64)          # (V, C)
        self.num_classes = len(log_priors)

    def batch_classify(self, X_batch: np.ndarray) -> np.ndarray:
        """
        Executes batch classification using a single hardware GEMM operation.
        X_batch has shape (Batch, V).
        """
        # BLAS Level-3 matrix-matrix multiplication: Scores = X @ W + b
        # Saturates CPU/GPU memory bandwidth
        log_scores = np.dot(X_batch, self.W) + self.log_priors  # (Batch, C)
        
        # Extract highest scoring class per row
        return np.argmax(log_scores, axis=1)`,
          explanation:
            "Pre-transposing the log-likelihood matrix $W \\in \\mathbb{R}^{V \\times C}$ enables direct Level-3 BLAS `GEMM` matrix multiplication, classifying millions of documents per second.",
          timeComplexity: "O(Batch * V * C) hardware-accelerated GEMM",
          spaceComplexity: "O(Batch * C) output log-scores",
        },
      ],
      stepByStep: [
        "1. Aggregate feature counts per class across the dataset matrix $X$.",
        "2. Apply additive Laplace smoothing $\\hat{p}(x_d \\mid c) = \\frac{\\text{count}(x_d, c) + \\alpha}{\\sum_k \\text{count}(x_k, c) + \\alpha D}$.",
        "3. Convert all probabilities into natural log-space $\\ln \\hat{p}(x_d \\mid c)$ and $\\ln \\hat{p}(c)$.",
        "4. Pack log-probabilities into contiguous weight matrix $W \\in \\mathbb{R}^{D \\times C}$.",
        "5. Evaluate class posterior log-scores via Level-3 BLAS: $\\text{Scores} = X W + b$.",
      ],
    },
  ],
};
