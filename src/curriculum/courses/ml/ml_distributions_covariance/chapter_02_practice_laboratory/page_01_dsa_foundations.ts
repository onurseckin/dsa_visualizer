import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_distributions_covariance_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: Cholesky Gaussian & Mahalanobis Engines",
  subtitle: "Interactive Implementation of Multivariate Samplers and Distance Engines",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_cholesky_gaussian_sampler",
      title: "Cholesky-Based Multivariate Gaussian Sampling Engine",
      difficulty: "Hard",
      rationale:
        "Validates implementation of Cholesky decomposition, lower triangular transformation, and reparameterization sampling without inverting covariance matrices.",
      starterCode: `import numpy as np

def sample_multivariate_gaussian(
    mean: np.ndarray,
    cov: np.ndarray,
    num_samples: int = 1000
) -> np.ndarray:
    """
    Generates exact samples from N(mean, cov) via Cholesky decomposition.
    
    Args:
        mean: 1D array of shape (D,)
        cov: 2D symmetric positive-definite covariance array of shape (D, D)
        num_samples: Number of vectors to sample
        
    Returns:
        samples: Array of shape (num_samples, D)
    """
    D = len(mean)
    # Step 1: Compute lower triangular Cholesky factor L (D, D)
    L = np.linalg.cholesky(cov)
    
    # Step 2: Draw standard normal noise Z (num_samples, D)
    Z = np.random.randn(num_samples, D)
    
    # Step 3: Transform X = Z @ L^T + mean
    samples = np.dot(Z, L.T) + mean
    
    return samples

if __name__ == "__main__":
    np.random.seed(42)
    mu = np.array([2.0, -1.0])
    Sigma = np.array([[2.0, 0.8], [0.8, 1.5]])
    s = sample_multivariate_gaussian(mu, Sigma, num_samples=100000)
    emp_mu = np.mean(s, axis=0)
    emp_cov = np.cov(s, rowvar=False)
    print("Empirical Mean:", emp_mu)
    print("Empirical Covariance:\\n", emp_cov)
    assert np.allclose(emp_mu, mu, atol=0.05), "Mean mismatch!"
    assert np.allclose(emp_cov, Sigma, atol=0.05), "Covariance mismatch!"
    print("Sampling verification passed!")
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_mahalanobis_distance_engine",
      title: "Fast Batch Mahalanobis Distance Engine",
      difficulty: "Hard",
      rationale:
        "Computes Mahalanobis distances across a batch of query vectors using forward substitution with Cholesky factor L rather than explicit matrix inversion.",
      starterCode: `import numpy as np

def batch_mahalanobis_distance(
    X: np.ndarray,
    mean: np.ndarray,
    cov: np.ndarray
) -> np.ndarray:
    """
    Computes sqrt((x - mean)^T Sigma^{-1} (x - mean)) for all rows in X (N, D).
    
    Args:
        X: Query matrix (N, D)
        mean: Center vector (D,)
        cov: Covariance matrix (D, D)
        
    Returns:
        distances: 1D array of shape (N,)
    """
    D = len(mean)
    L = np.linalg.cholesky(cov)  # (D, D)
    diff = X - mean              # (N, D)
    
    # Solve L @ v = diff.T => v is (D, N)
    v = np.linalg.solve(L, diff.T)
    
    # D_M = sqrt( sum(v^2, axis=0) )
    dists = np.sqrt(np.sum(v ** 2, axis=0))
    return dists
`,
    },
  ],
};
