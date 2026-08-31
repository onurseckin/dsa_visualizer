import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_mle_map_naive_bayes_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: Naive Bayes Classifiers & Log-Likelihood Solvers",
  subtitle: "Interactive Implementation of Multinomial & Gaussian Naive Bayes Engines",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_multinomial_naive_bayes_engine",
      title: "Multinomial Naive Bayes with Log-Space Inference",
      difficulty: "Hard",
      rationale:
        "Validates implementation of Laplace-smoothed categorical log-likelihood estimation and log-space matrix dot product inference.",
      starterCode: `import numpy as np

def multinomial_nb_fit_predict(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    alpha: float = 1.0
) -> np.ndarray:
    """
    Fits Multinomial Naive Bayes on X_train, y_train and predicts class labels on X_test.
    
    Args:
        X_train: Word count matrix (N_train, V)
        y_train: Integer class labels (N_train,)
        X_test: Word count query matrix (N_test, V)
        alpha: Laplace smoothing constant
        
    Returns:
        y_pred: Integer array of shape (N_test,)
    """
    N_train, V = X_train.shape
    classes = np.unique(y_train)
    C = len(classes)
    
    # 1. Class priors in log-space
    class_counts = np.bincount(y_train, minlength=C)
    log_priors = np.log(class_counts / N_train)
    
    # 2. Compute Laplace smoothed feature log probabilities
    feature_counts = np.zeros((C, V), dtype=np.float64)
    for c in range(C):
        feature_counts[c] = np.sum(X_train[y_train == c], axis=0)
        
    smoothed_counts = feature_counts + alpha
    smoothed_totals = np.sum(smoothed_counts, axis=1, keepdims=True)
    log_likelihoods = np.log(smoothed_counts / smoothed_totals)  # (C, V)
    
    # 3. Predict on X_test: LogPosterior = X_test @ log_likelihoods.T + log_priors
    log_scores = np.dot(X_test, log_likelihoods.T) + log_priors  # (N_test, C)
    
    return classes[np.argmax(log_scores, axis=1)]

if __name__ == "__main__":
    X_tr = np.array([[2, 1, 0], [0, 1, 2], [1, 2, 0], [0, 0, 3]])
    y_tr = np.array([0, 1, 0, 1])
    X_te = np.array([[1, 1, 0], [0, 0, 2]])
    preds = multinomial_nb_fit_predict(X_tr, y_tr, X_te)
    print("Predictions:", preds)
    assert np.array_equal(preds, [0, 1]), "Prediction mismatch!"
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_gaussian_naive_bayes_variance_floor",
      title: "Gaussian Naive Bayes with Variance Regularization",
      difficulty: "Hard",
      rationale:
        "Implements Gaussian Naive Bayes with continuous features and variance flooring to prevent division by zero on zero-variance features.",
      starterCode: `import numpy as np

def gaussian_nb_predict(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    var_smoothing: float = 1e-9
) -> np.ndarray:
    """
    Computes Gaussian Naive Bayes predictions with variance smoothing:
    sigma^2_smoothed = sigma^2 + var_smoothing * max(variance across dataset).
    """
    N, D = X_train.shape
    classes = np.unique(y_train)
    C = len(classes)
    
    # Global variance floor
    global_max_var = np.max(np.var(X_train, axis=0))
    floor = var_smoothing * global_max_var
    
    # Calculate means and variances per class
    means = np.zeros((C, D))
    vars_ = np.zeros((C, D))
    log_priors = np.zeros(C)
    
    for idx, c in enumerate(classes):
        X_c = X_train[y_train == c]
        means[idx] = np.mean(X_c, axis=0)
        vars_[idx] = np.var(X_c, axis=0) + floor
        log_priors[idx] = np.log(len(X_c) / N)
        
    # Evaluate log Gaussian PDF on X_test for each class
    # log N(x | mu, sigma^2) = -0.5 * log(2 pi sigma^2) - 0.5 * (x - mu)^2 / sigma^2
    N_test = X_test.shape[0]
    log_scores = np.zeros((N_test, C))
    
    for idx in range(C):
        mu_c = means[idx]
        var_c = vars_[idx]
        log_pdf = -0.5 * np.sum(np.log(2.0 * np.pi * var_c)) - 0.5 * np.sum(((X_test - mu_c) ** 2) / var_c, axis=1)
        log_scores[:, idx] = log_priors[idx] + log_pdf
        
    return classes[np.argmax(log_scores, axis=1)]
`,
    },
  ],
};
