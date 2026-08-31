import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_hypothesis_testing_bootstrap_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage Testing Engine Progression",
  subtitle: "Bootstrap Memory Scaling, PRNG Seed Reproducibility, and Vectorized FDR Controllers",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Microarchitecture Realities: Bootstrap Memory Explosion & PRNG Concurrency",
      content:
        "1. **Bootstrap Memory Explosion**: For an evaluation set of $N = 100{,}000$ LLM completions and $B = 10{,}000$ bootstrap resamples, instantiating the full index matrix $(B, N)$ requires $10{,}000 \\times 100{,}000 \\times 8\\text{ bytes} = 8\\text{ GB}$ of RAM. Chunking resamples into micro-batches of size $b = 500$ bounds working memory to $<400\\text{ MB}$ while maximizing SIMD throughput.\n2. **PRNG Concurrency Traps in Multi-Threaded Testing**: When parallelizing bootstrap loops across Python `multiprocessing` workers or CUDA streams, copying the default random seed causes all worker threads to generate identical resamples, collapsing bootstrap variance to zero and generating falsely narrow confidence intervals. Independent SeedSequence streams (`np.random.SeedSequence`) guarantee orthogonality across workers.",
    },
    {
      type: "code_progression",
      title: "From Parametric T-Tests to Vectorized Non-Parametric Bootstrap & FDR Engines",
      language: "python",
      stages: [
        {
          label: "Stage 1: Parametric Two-Sample Student's T-Test",
          code: `import math

def two_sample_t_test_naive(sample_a: list[float], sample_b: list[float]) -> tuple[float, float]:
    """
    Standard parametric two-sample Student's t-test with pooled variance.
    WARNING: Assumes exact normal distributions and equal variances.
    """
    n1, n2 = len(sample_a), len(sample_b)
    mean1 = sum(sample_a) / n1
    mean2 = sum(sample_b) / n2
    
    # Sample variances
    var1 = sum((x - mean1) ** 2 for x in sample_a) / (n1 - 1)
    var2 = sum((x - mean2) ** 2 for x in sample_b) / (n2 - 1)
    
    # Pooled standard deviation
    sp = math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))
    t_stat = (mean1 - mean2) / (sp * math.sqrt(1.0 / n1 + 1.0 / n2))
    
    # Approximate two-tailed p-value via normal CDF for large degrees of freedom
    # (Simplified Gaussian tail approximation)
    p_val = 2.0 * (1.0 - 0.5 * (1.0 + math.erf(abs(t_stat) / math.sqrt(2.0))))
    
    return t_stat, p_val`,
          explanation:
            "Parametric t-test relies strictly on Gaussian assumptions, failing on skewed error distributions or heavy-tailed model latency benchmarks.",
          timeComplexity: "O(n1 + n2)",
          spaceComplexity: "O(1)",
        },
        {
          label: "Stage 2: Vectorized Non-Parametric Bootstrap Confidence Interval Engine",
          code: `import numpy as np
from typing import Callable

def bootstrap_confidence_interval(
    data: np.ndarray,
    stat_fn: Callable[[np.ndarray], float] = np.mean,
    num_bootstrap: int = 10000,
    confidence_level: float = 0.95,
    chunk_size: int = 1000,
    random_state: int = 42
) -> tuple[float, float, float]:
    """
    Memory-efficient chunked non-parametric bootstrap engine.
    
    Args:
        data: 1D array of observed samples (N,)
        stat_fn: Function mapping 1D array to scalar summary statistic
        num_bootstrap: Total resamples B
        confidence_level: Target CI coverage (e.g. 0.95)
        chunk_size: Micro-batch size to prevent memory explosion
        
    Returns:
        (point_estimate, ci_lower, ci_upper)
    """
    N = len(data)
    rng = np.random.default_rng(random_state)
    point_estimate = float(stat_fn(data))
    
    bootstrap_stats = []
    num_chunks = int(np.ceil(num_bootstrap / chunk_size))
    
    for _ in range(num_chunks):
        # Draw (chunk_size, N) index array with replacement
        current_b = min(chunk_size, num_bootstrap - len(bootstrap_stats))
        idx_matrix = rng.integers(0, N, size=(current_b, N))
        resamples = data[idx_matrix]  # (current_b, N)
        
        # Evaluate statistic along rows
        chunk_stats = np.apply_along_axis(stat_fn, axis=1, arr=resamples)
        bootstrap_stats.extend(chunk_stats)
        
    bootstrap_stats_arr = np.array(bootstrap_stats)
    alpha = 1.0 - confidence_level
    ci_lower = float(np.percentile(bootstrap_stats_arr, 100.0 * (alpha / 2.0)))
    ci_upper = float(np.percentile(bootstrap_stats_arr, 100.0 * (1.0 - alpha / 2.0)))
    
    return point_estimate, ci_lower, ci_upper`,
          explanation:
            "Vectorized chunked bootstrap avoids memory allocations while evaluating non-parametric empirical quantiles to construct distribution-free confidence intervals.",
          timeComplexity: "O(B * N)",
          spaceComplexity: "O(chunk_size * N) bounded memory",
        },
        {
          label: "Stage 3: Vectorized Permutation Test & Benjamini-Hochberg FDR Controller",
          code: `import numpy as np

def permutation_test_two_sample(
    sample_a: np.ndarray,
    sample_b: np.ndarray,
    num_permutations: int = 10000,
    random_state: int = 42
) -> float:
    """
    Vectorized exact permutation test for difference in means: H0: mean(A) == mean(B).
    """
    rng = np.random.default_rng(random_state)
    n_a, n_b = len(sample_a), len(sample_b)
    obs_diff = np.abs(np.mean(sample_a) - np.mean(sample_b))
    
    combined = np.concatenate([sample_a, sample_b])
    total_len = n_a + n_b
    
    # Vectorized permutation matrix of indices: (num_permutations, total_len)
    permuted_diffs = np.zeros(num_permutations)
    for i in range(num_permutations):
        shuffled = rng.permutation(combined)
        diff = np.abs(np.mean(shuffled[:n_a]) - np.mean(shuffled[n_a:]))
        permuted_diffs[i] = diff
        
    p_value = (np.sum(permuted_diffs >= obs_diff) + 1.0) / (num_permutations + 1.0)
    return float(p_value)

def benjamini_hochberg_fdr(p_values: np.ndarray, q_target: float = 0.05) -> tuple[np.ndarray, np.ndarray]:
    """
    Benjamini-Hochberg False Discovery Rate (FDR) Controller for multiple hypothesis testing.
    
    Args:
        p_values: 1D array of uncorrected p-values for M hypotheses
        q_target: Target FDR rate (e.g. 0.05)
        
    Returns:
        (rejected_mask, adjusted_p_values):
        rejected_mask: Boolean array where True indicates statistically significant discovery.
    """
    M = len(p_values)
    p_vals = np.asarray(p_values, dtype=np.float64)
    
    # 1. Sort p-values in ascending order
    sorted_indices = np.argsort(p_vals)
    sorted_p = p_vals[sorted_indices]
    
    # 2. BH Critical threshold: (i / M) * q_target for i = 1..M
    ranks = np.arange(1, M + 1)
    thresholds = (ranks / M) * q_target
    
    # 3. Find largest index k where sorted_p[k-1] <= thresholds[k-1]
    significant = sorted_p <= thresholds
    if not np.any(significant):
        max_k = -1
    else:
        max_k = np.max(np.where(significant)[0])
        
    # 4. Construct rejected boolean mask in original order
    rejected_mask = np.zeros(M, dtype=bool)
    if max_k >= 0:
        rejected_mask[sorted_indices[:max_k + 1]] = True
        
    # 5. Compute adjusted p-values (q-values)
    # q_i = min_{j >= i} (M / j) * p_{(j)}
    q_values = np.zeros(M)
    accum_min = 1.0
    for i in range(M - 1, -1, -1):
        raw_q = (M / (i + 1)) * sorted_p[i]
        accum_min = min(accum_min, raw_q)
        q_values[i] = min(1.0, accum_min)
        
    # Restore original order for adjusted p-values
    adjusted_p = np.zeros(M)
    adjusted_p[sorted_indices] = q_values
    
    return rejected_mask, adjusted_p`,
          explanation:
            "Permutation testing constructs exact non-parametric empirical null distributions, and the Benjamini-Hochberg controller controls false discoveries across massive model evaluation suites.",
          timeComplexity: "O(P * (n_a + n_b)) for permutation test, O(M log M) for BH FDR",
          spaceComplexity: "O(M) memory",
        },
      ],
      stepByStep: [
        "1. Collect evaluation metrics across model variants and benchmark tasks.",
        "2. Draw $B$ bootstrap replicates to construct distribution-free percentile confidence intervals.",
        "3. Evaluate empirical null p-values via permutation testing.",
        "4. Sort $M$ p-values in ascending order $p_{(1)} \\le p_{(2)} \\dots \\le p_{(M)}$.",
        "5. Apply Benjamini-Hochberg thresholding to discover significant performance gains at bounded FDR.",
      ],
    },
  ],
};

export const page2 = page_02_systems;
