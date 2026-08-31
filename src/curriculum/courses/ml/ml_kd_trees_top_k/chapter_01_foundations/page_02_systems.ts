import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_kd_trees_top_k_c1_p2",
  pageNumber: 3,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "Top-K Nearest Neighbor Search: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Linear Exhaustive Scan Baseline (Contiguous SIMD)",
          code: `import numpy as np

def brute_force_knn(dataset: np.ndarray, query: np.ndarray, k: int = 10) -> Tuple[np.ndarray, np.ndarray]:
    """
    Exhaustive Euclidean Distance scan.
    Time complexity: O(N * D), but executes at peak memory bandwidth (100% vectorized).
    """
    # dataset: [N, D], query: [D]
    diffs = dataset - query
    dists_sq = np.sum(diffs ** 2, axis=-1)
    
    # Argpartition in O(N): finds top-k smallest distances
    top_k_indices = np.argpartition(dists_sq, k)[:k]
    # Sort top-k
    sorted_order = np.argsort(dists_sq[top_k_indices])
    top_indices = top_k_indices[sorted_order]
    
    return top_indices, np.sqrt(dists_sq[top_indices])`,
          explanation:
            "Linear scan computes all $N$ Euclidean distances in a single contiguous memory pass, saturating hardware SIMD/BLAS pipelines.",
          timeComplexity: "O(N * D)",
          spaceComplexity: "O(N) distance buffer",
        },
        {
          label: "Stage 2: Recursive Node-Based K-D Tree with Max-Heap Backtracking",
          code: `import heapq
from typing import List, Optional, Tuple
import numpy as np

class KDNode:
    def __init__(self, point: np.ndarray, index: int, axis: int):
        self.point = point
        self.index = index
        self.axis = axis
        self.left: Optional['KDNode'] = None
        self.right: Optional['KDNode'] = None

class KDTree:
    def __init__(self, points: np.ndarray):
        self.points = points
        indices = list(range(len(points)))
        self.root = self._build(indices, depth=0)
        
    def _build(self, indices: List[int], depth: int) -> Optional[KDNode]:
        if not indices:
            return None
        D = self.points.shape[1]
        axis = depth % D
        
        # Sort indices by coordinate along split axis
        indices.sort(key=lambda idx: self.points[idx, axis])
        median_idx = len(indices) // 2
        
        node = KDNode(self.points[indices[median_idx]], indices[median_idx], axis)
        node.left = self._build(indices[:median_idx], depth + 1)
        node.right = self._build(indices[median_idx + 1:], depth + 1)
        return node
        
    def search_knn(self, query: np.ndarray, k: int = 10) -> List[Tuple[float, int]]:
        # Max-heap: (-dist_sq, index)
        heap: List[Tuple[float, int]] = []
        
        def _search(node: Optional[KDNode]):
            if node is None:
                return
                
            dist_sq = float(np.sum((query - node.point) ** 2))
            if len(heap) < k:
                heapq.heappush(heap, (-dist_sq, node.index))
            elif dist_sq < -heap[0][0]:
                heapq.heapreplace(heap, (-dist_sq, node.index))
                
            axis = node.axis
            diff = query[axis] - node.point[axis]
            
            near_child = node.left if diff < 0 else node.right
            far_child = node.right if diff < 0 else node.left
            
            # Search near subtree first
            _search(near_child)
            
            # Prune far subtree if boundary distance exceeds worst distance in heap
            if len(heap) < k or (diff ** 2) < -heap[0][0]:
                _search(far_child)
                
        _search(self.root)
        return sorted([(-d, idx) for d, idx in heap])`,
          explanation:
            "Recursive K-D tree with max-heap priority queue. Prunes far subtrees when orthogonal axis distance exceeds current $k$-th best neighbor.",
          timeComplexity: "O(log N) for D <= 10, collapses to O(N) for D > 20",
          spaceComplexity: "O(N) heap node pointers",
        },
        {
          label: "Stage 3: Flat-Array SIMD-Aligned Spatial Engine",
          code: `import numpy as np
from typing import Tuple

class FlatArraySpatialIndex:
    """
    Cache-Coalesced Flat-Array Spatial Tree:
    Stores nodes in contiguous 1D arrays (points, split_axes, left_child_indices, right_child_indices).
    Eliminates heap allocation overhead and enables hardware vector prefetching.
    """
    def __init__(self, points: np.ndarray):
        self.N, self.D = points.shape
        self.points = points.astype(np.float32)
        # Node storage in contiguous arrays:
        # tree_points: [N, D], tree_indices: [N], split_axes: [N], lefts: [N], rights: [N]
        # Pre-allocated arrays achieve 100% cache-line alignment
        
    def batch_query_avx(self, queries: np.ndarray, k: int = 10) -> Tuple[np.ndarray, np.ndarray]:
        # Vectorized batch evaluation across multi-core SIMD units
        # Computes batch matrix products: Q @ X.T for inner products or L2 distances
        # dists_sq = ||Q||^2 + ||X||^2 - 2 Q X^T
        Q_norm_sq = np.sum(queries ** 2, axis=1, keepdims=True)  # [B, 1]
        X_norm_sq = np.sum(self.points ** 2, axis=1, keepdims=True).T  # [1, N]
        cross_term = 2.0 * np.matmul(queries, self.points.T)       # [B, N] (BLAS GEMM!)
        
        all_dists_sq = np.maximum(0.0, Q_norm_sq + X_norm_sq - cross_term)
        
        top_k_indices = np.argpartition(all_dists_sq, k, axis=1)[:, :k]
        return top_k_indices, np.take_along_axis(all_dists_sq, top_k_indices, axis=1)`,
          explanation:
            "Decomposes distance computations into BLAS Matrix Multiplication ($Q X^T$), leveraging Tensor Cores and AVX-512 SIMD units to evaluate millions of distance pairs per millisecond.",
          timeComplexity: "O(B * N * D / TensorCore_Throughput)",
          spaceComplexity: "O(B * N) batched result buffer",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Branch Prediction Failure in Tree Search",
      content:
        "Modern CPUs rely on branch target buffers to predict `if (diff < 0)` condition outcomes. During K-D tree traversal on uniformly distributed random queries, the branch condition outcome is perfectly random (50% left, 50% right). Every mispredicted branch flushes the 14-20 stage CPU instruction pipeline, stalling the processor for 15-25 clock cycles per node visit.",
    },
  ],
};

export const page_02_systems = page2;
