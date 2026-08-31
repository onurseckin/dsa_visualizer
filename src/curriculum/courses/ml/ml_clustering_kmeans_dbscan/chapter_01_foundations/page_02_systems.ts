import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_clustering_kmeans_dbscan_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage Clustering Progression",
  subtitle: "Distance Matrix GEMM Expansion, K-D Tree Range Queries, and K-Means++ Engines",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Microarchitecture Realities: Pairwise Distance Broadcasting & Spatial Tree Pruning",
      content:
        "1. **Pairwise Broadcasting Memory Wall**: Evaluating distances via naive broadcasting `(X[:, None, :] - centroids[None, :, :]) ** 2` creates an intermediate tensor of shape $(N, K, D)$. For $N = 1{,}000{,}000$, $K = 100$, and $D = 128$, this tensor requires $10^6 \\times 100 \\times 128 \\times 8\\text{ bytes} = 102.4\\text{ GB}$ of RAM, triggering immediate out-of-memory crashes. The **GEMM Algebraic Expansion** evaluates distances without intermediate 3D tensors: $\\|x - \\mu\\|_2^2 = \\|x\\|^2 - 2 x^T \\mu + \\|\\mu\\|^2$.\n2. **Spatial Indexing Range Pruning for DBSCAN**: Evaluating all $N^2$ pairwise distances in DBSCAN costs $O(N^2)$ time. Building a $D$-dimensional **K-D Tree** or **Ball Tree** partitions the space in $O(N \\log N)$ time, pruning remote bounding boxes via the triangle inequality and evaluating $\\epsilon$-range queries in $O(\\log N)$ expected time.",
    },
    {
      type: "code_progression",
      title: "From Naive Iterations to K-Means++ and Spatial-Index DBSCAN",
      language: "python",
      stages: [
        {
          label: "Stage 1: Pure Python Iterative K-Means Baseline",
          code: `import math

def euclidean_distance(a: list[float], b: list[float]) -> float:
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))

class PurePythonKMeans:
    """
    Naive Python K-Means with random initialization.
    """
    def __init__(self, k: int = 3, max_iter: int = 100):
        self.k = k
        self.max_iter = max_iter
        self.centroids: list[list[float]] = []

    def fit(self, X: list[list[float]]):
        # Pick first k samples as centroids
        self.centroids = [X[i][:] for i in range(self.k)]
        
        for _ in range(self.max_iter):
            clusters = [[] for _ in range(self.k)]
            # Assign points
            for row in X:
                dists = [euclidean_distance(row, c) for c in self.centroids]
                best_c = dists.index(min(dists))
                clusters[best_c].append(row)
                
            # Update centroids
            for i in range(self.k):
                if len(clusters[i]) > 0:
                    dim = len(X[0])
                    self.centroids[i] = [
                        sum(pt[d] for pt in clusters[i]) / len(clusters[i])
                        for d in range(dim)
                    ]`,
          explanation:
            "Pure-Python scalar loops allocate nested lists and compute pairwise Euclidean distances one by one, suffering from high interpreter latency.",
          timeComplexity: "O(Iters * N * K * D)",
          spaceComplexity: "O(N + K * D)",
        },
        {
          label: "Stage 2: Vectorized K-Means++ with GEMM Distance Expansion",
          code: `import numpy as np

class VectorizedKMeansPlusPlus:
    """
    Vectorized K-Means++ with GEMM Algebraic Distance Expansion.
    Eliminates 3D tensor broadcasting: ||X - C||^2 = ||X||^2 - 2 X C^T + ||C||^2.
    """
    def __init__(self, n_clusters: int = 8, max_iter: int = 300, tol: float = 1e-4, random_state: int = 42):
        self.K = n_clusters
        self.max_iter = max_iter
        self.tol = tol
        self.random_state = random_state
        self.centroids: np.ndarray | None = None

    def _compute_sq_distances(self, X: np.ndarray, C: np.ndarray) -> np.ndarray:
        """Computes pairwise squared Euclidean distances (N, K) via BLAS-3 GEMM."""
        # X: (N, D), C: (K, D)
        x_norm_sq = np.sum(X ** 2, axis=1, keepdims=True)  # (N, 1)
        c_norm_sq = np.sum(C ** 2, axis=1, keepdims=True)  # (K, 1)
        # ||x - c||^2 = ||x||^2 - 2 X @ C^T + ||c||^2
        sq_dists = x_norm_sq - 2.0 * np.dot(X, C.T) + c_norm_sq.T  # (N, K)
        return np.maximum(sq_dists, 0.0)

    def _init_kmeans_plus_plus(self, X: np.ndarray) -> np.ndarray:
        N, D = X.shape
        rng = np.random.default_rng(self.random_state)
        centroids = np.empty((self.K, D), dtype=X.dtype)
        
        # 1. First center uniformly at random
        first_idx = rng.integers(0, N)
        centroids[0] = X[first_idx]
        
        # 2. Minimum squared distance to existing centers
        min_sq_dists = self._compute_sq_distances(X, centroids[0:1])[:, 0]  # (N,)
        
        # 3. Sample remaining K-1 centers using D^2 distribution
        for k in range(1, self.K):
            total_potential = np.sum(min_sq_dists)
            probs = min_sq_dists / max(total_potential, 1e-12)
            chosen_idx = rng.choice(N, p=probs)
            centroids[k] = X[chosen_idx]
            
            # Update min distances with newly added center
            new_dists = self._compute_sq_distances(X, centroids[k:k+1])[:, 0]
            min_sq_dists = np.minimum(min_sq_dists, new_dists)
            
        return centroids

    def fit(self, X: np.ndarray) -> "VectorizedKMeansPlusPlus":
        self.centroids = self._init_kmeans_plus_plus(X)
        
        for _ in range(self.max_iter):
            sq_dists = self._compute_sq_distances(X, self.centroids)  # (N, K)
            labels = np.argmin(sq_dists, axis=1)                      # (N,)
            
            # Vectorized centroid update
            new_centroids = np.empty_like(self.centroids)
            for k in range(self.K):
                mask = labels == k
                if np.any(mask):
                    new_centroids[k] = np.mean(X[mask], axis=0)
                else:
                    new_centroids[k] = self.centroids[k]
                    
            if np.linalg.norm(new_centroids - self.centroids) < self.tol:
                break
            self.centroids = new_centroids
            
        return self`,
          explanation:
            "K-Means++ accelerates convergence while GEMM expansion eliminates 3D array memory allocations, utilizing fast BLAS Level-3 matrix multiplication.",
          timeComplexity: "O(K * N * D + Iters * (N * K * D))",
          spaceComplexity: "O(N * K) bounded distance matrix",
        },
        {
          label: "Stage 3: High-Performance Spatial Index DBSCAN Engine",
          code: `import numpy as np
from scipy.spatial import KDTree

class SpatialIndexDBSCAN:
    """
    High-Performance DBSCAN using K-D Tree spatial range indexing.
    Reduces neighbor lookup complexity from O(N^2) to O(N log N).
    """
    def __init__(self, eps: float = 0.5, min_samples: int = 5):
        self.eps = eps
        self.min_samples = min_samples
        self.labels_: np.ndarray | None = None

    def fit(self, X: np.ndarray) -> "SpatialIndexDBSCAN":
        N = X.shape[0]
        # 1. Build K-D Tree spatial index: O(N log N)
        tree = KDTree(X)
        
        # 2. Query all epsilon-neighborhoods efficiently
        # Returns list of neighboring index lists
        neighbors_list = tree.query_ball_tree(tree, r=self.eps)
        
        # 3. Label array: -1 represents unvisited / noise
        labels = np.full(N, -1, dtype=np.int32)
        cluster_id = 0
        
        # 4. Density-Connected Core Point Traversal
        for i in range(N):
            if labels[i] != -1:
                continue  # Already clustered
                
            neighbors = neighbors_list[i]
            if len(neighbors) < self.min_samples:
                # Mark as noise (can be converted to border point later)
                labels[i] = -1
                continue
                
            # Start new cluster from core point i
            labels[i] = cluster_id
            queue = list(neighbors)
            head = 0
            
            while head < len(queue):
                neighbor_idx = queue[head]
                head += 1
                
                # If previously marked as noise, claim as border point
                if labels[neighbor_idx] == -1:
                    labels[neighbor_idx] = cluster_id
                    
                if labels[neighbor_idx] != -1 and labels[neighbor_idx] != cluster_id:
                    continue  # Already in another cluster
                    
                labels[neighbor_idx] = cluster_id
                
                # Expand queue if neighbor is also a core point
                neighbor_neighbors = neighbors_list[neighbor_idx]
                if len(neighbor_neighbors) >= self.min_samples:
                    for nn in neighbor_neighbors:
                        if labels[nn] == -1:
                            queue.append(nn)
                            
            cluster_id += 1
            
        self.labels_ = labels
        return self`,
          explanation:
            "Spatial indexing via K-D Tree queries evaluates $\\epsilon$-neighborhoods without instantiating pairwise distance matrices, running in $O(N \\log N)$ total time.",
          timeComplexity: "O(N log N) with K-D Tree indexing",
          spaceComplexity: "O(N) neighbor lists",
        },
      ],
      stepByStep: [
        "1. In K-Means++, sample initial centers using squared distance probabilities $D(x)^2 / \\sum D(y)^2$.",
        "2. Evaluate pairwise distances via GEMM algebraic expansion: $\\|x - c\\|^2 = \\|x\\|^2 - 2 X C^T + \\|c\\|^2$.",
        "3. In DBSCAN, build a spatial K-D tree or grid index over the input coordinates.",
        "4. Query $\\epsilon$-balls for all points, identifying core points ($|N_\\epsilon| \\ge \\text{MinPts}$).",
        "5. Execute a breadth-first search (BFS) over density-connected core components to assign maximal cluster labels.",
      ],
    },
  ],
};
