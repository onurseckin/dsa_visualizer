import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_clustering_kmeans_dbscan_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: K-Means++ & DBSCAN Density Engines",
  subtitle: "Interactive Implementation of D2 Sampling and Spatial Index Clustering",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_kmeans_plus_plus_init_engine",
      title: "K-Means++ D2 Probability Sampling Engine",
      difficulty: "Hard",
      rationale:
        "Validates exact implementation of Arthur-Vassilvitskii D^2 sampling for initializing well-dispersed cluster centers.",
      starterCode: `import numpy as np

def kmeans_plus_plus_init(
    X: np.ndarray,
    k: int,
    random_seed: int = 42
) -> np.ndarray:
    """
    Initializes k centers using the K-Means++ D^2 probability distribution.
    
    Args:
        X: Dataset array (N, D)
        k: Number of cluster centers to select
        random_seed: Random state seed
        
    Returns:
        centers: Selected center coordinates (k, D)
    """
    N, D = X.shape
    rng = np.random.default_rng(random_seed)
    centers = np.empty((k, D), dtype=X.dtype)
    
    # 1. First center uniformly at random
    c0_idx = rng.integers(0, N)
    centers[0] = X[c0_idx]
    
    # 2. Track min squared distance to any selected center: D(x)^2
    # ||x - c_0||^2
    min_sq_dists = np.sum((X - centers[0]) ** 2, axis=1)  # (N,)
    
    # 3. Iteratively pick centers 1..k-1
    for i in range(1, k):
        # Probability proportional to min_sq_dists
        total_dist = np.sum(min_sq_dists)
        probs = min_sq_dists / total_dist
        
        # Sample next center index
        chosen_idx = rng.choice(N, p=probs)
        centers[i] = X[chosen_idx]
        
        # Update minimum squared distances
        new_dists = np.sum((X - centers[i]) ** 2, axis=1)
        min_sq_dists = np.minimum(min_sq_dists, new_dists)
        
    return centers

if __name__ == "__main__":
    X_syn = np.array([[0.0, 0.0], [0.1, 0.1], [10.0, 10.0], [10.1, 10.1]])
    c = kmeans_plus_plus_init(X_syn, k=2)
    print("Sampled Centers:\\n", c)
    # The two centers should be drawn from the two separate clusters (around (0,0) and (10,10))
    dist_between_centers = np.linalg.norm(c[0] - c[1])
    assert dist_between_centers > 5.0, "K-Means++ failed to separate distinct cluster modes!"
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_dbscan_cluster_engine",
      title: "DBSCAN Density Graph Clustering Engine",
      difficulty: "Hard",
      rationale:
        "Implements density-connected neighborhood expansion to discover non-convex clusters and identify noise points.",
      starterCode: `import numpy as np

def dbscan_cluster(
    X: np.ndarray,
    eps: float = 1.0,
    min_pts: int = 3
) -> np.ndarray:
    """
    Executes DBSCAN clustering on X (N, D).
    
    Returns:
        labels: 1D array (N,) where -1 is noise, and 0..C-1 are cluster IDs.
    """
    N = X.shape[0]
    # Compute pairwise Euclidean distance matrix
    dists = np.linalg.norm(X[:, None, :] - X[None, :, :], axis=-1)
    
    labels = np.full(N, -1, dtype=np.int32)
    visited = np.zeros(N, dtype=bool)
    cluster_id = 0
    
    for i in range(N):
        if visited[i]:
            continue
        visited[i] = True
        
        neighbors = np.where(dists[i] <= eps)[0]
        if len(neighbors) < min_pts:
            labels[i] = -1  # Noise
            continue
            
        # Core point: start new cluster
        labels[i] = cluster_id
        queue = list(neighbors)
        head = 0
        
        while head < len(queue):
            curr = queue[head]
            head += 1
            
            if not visited[curr]:
                visited[curr] = True
                curr_neighbors = np.where(dists[curr] <= eps)[0]
                if len(curr_neighbors) >= min_pts:
                    queue.extend(curr_neighbors)
                    
            if labels[curr] == -1:
                labels[curr] = cluster_id
                
        cluster_id += 1
        
    return labels
`,
    },
  ],
};
