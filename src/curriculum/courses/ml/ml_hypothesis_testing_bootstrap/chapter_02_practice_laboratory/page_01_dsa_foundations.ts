import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_hypothesis_testing_bootstrap_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: Bootstrap Resampling & FDR Engines",
  subtitle: "Interactive Implementation of Non-Parametric CIs and Benjamini-Hochberg Controls",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_bootstrap_percentile_ci_engine",
      title: "Non-Parametric Bootstrap Standard Error & Percentile CI Engine",
      difficulty: "Hard",
      rationale:
        "Validates implementation of vectorized bootstrap resampling with replacement, calculating empirical standard error and confidence intervals.",
      starterCode: `import numpy as np

def bootstrap_percentile_ci(
    data: np.ndarray,
    num_resamples: int = 5000,
    alpha: float = 0.05
) -> tuple[float, float, float]:
    """
    Computes empirical bootstrap mean, standard error, and (1 - alpha) percentile CI.
    
    Args:
        data: 1D array of observations (N,)
        num_resamples: Number of bootstrap iterations B
        alpha: Significance level (0.05 for 95% CI)
        
    Returns:
        (stat_mean, stat_se, ci_lower, ci_upper)
    """
    N = len(data)
    # Draw (num_resamples, N) index array with replacement
    indices = np.random.randint(0, N, size=(num_resamples, N))
    resamples = data[indices]  # (num_resamples, N)
    
    # Evaluate statistic (mean) along rows
    bootstrap_means = np.mean(resamples, axis=1)
    
    stat_mean = float(np.mean(bootstrap_means))
    stat_se = float(np.std(bootstrap_means, ddof=1))
    ci_lower = float(np.percentile(bootstrap_means, 100.0 * (alpha / 2.0)))
    ci_upper = float(np.percentile(bootstrap_means, 100.0 * (1.0 - alpha / 2.0)))
    
    return stat_mean, stat_se, ci_lower, ci_upper

if __name__ == "__main__":
    np.random.seed(42)
    sample = np.random.exponential(scale=2.0, size=100)
    mean_val, se_val, low, high = bootstrap_percentile_ci(sample, num_resamples=10000)
    print(f"Bootstrap Mean: {mean_val:.3f} +/- {se_val:.3f}, 95% CI: [{low:.3f}, {high:.3f}]")
    assert low < mean_val < high, "Confidence interval invalid!"
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_benjamini_hochberg_engine",
      title: "Benjamini-Hochberg False Discovery Rate (FDR) Controller",
      difficulty: "Hard",
      rationale:
        "Implements rank-based p-value thresholding and monotonic q-value adjustment to control false discovery rate across multiple benchmark tests.",
      starterCode: `import numpy as np

def control_fdr_benjamini_hochberg(
    p_values: list[float],
    fdr_q: float = 0.05
) -> tuple[list[bool], list[float]]:
    """
    Controls FDR at level fdr_q across M statistical tests.
    
    Args:
        p_values: List of unadjusted p-values [p_1, ..., p_M]
        fdr_q: Target FDR threshold
        
    Returns:
        (is_significant, adjusted_q_values):
        is_significant: List of booleans indicating rejection of H0.
        adjusted_q_values: List of adjusted q-values.
    """
    M = len(p_values)
    p_arr = np.asarray(p_values, dtype=np.float64)
    sorted_order = np.argsort(p_arr)
    sorted_p = p_arr[sorted_order]
    
    ranks = np.arange(1, M + 1)
    crit_vals = (ranks / M) * fdr_q
    
    # Find largest rank k where sorted_p <= crit_val
    passing = sorted_p <= crit_vals
    if np.any(passing):
        max_k = np.max(np.where(passing)[0])
    else:
        max_k = -1
        
    is_sig = np.zeros(M, dtype=bool)
    if max_k >= 0:
        is_sig[sorted_order[:max_k + 1]] = True
        
    return list(is_sig), []
`,
    },
  ],
};

export const page1 = page_01_dsa_foundations;
