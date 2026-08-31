import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_decision_trees_cart_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage Decision Tree Progression",
  subtitle: "Pointer-Chasing Cache Thrashing, Histogram Quantization, and Flat Array Trees",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Microarchitecture Realities: Pointer-Chasing Cache Thrashing & Histogram Binning",
      content:
        "1. **Pointer-Chasing Cache Thrashing**: Standard object-oriented tree nodes (`node.left`, `node.right`) allocate small structs randomly across heap memory. Traversing an ensemble of 100 deep trees causes thousands of random 64-byte L1/L2 data cache evictions, dropping CPU execution efficiency to $<5\\%$ of peak FLOPS. Flattening tree topologies into contiguous 1D primitive buffers (`int32` feature indices, `float32` thresholds, `int32` child offsets) enables sequential hardware prefetching.\n2. **Feature Sorting Complexity ($O(D \\cdot N \\log N)$)**: Re-sorting continuous features at every internal node of the tree is the primary computational bottleneck of classical CART. Modern engines (e.g. LightGBM, XGBoost) pre-quantize continuous features into $B = 256$ discrete bins (`uint8`). Evaluating all candidate splits per feature then reduces from an $O(N \\log N)$ sort to an $O(N)$ histogram accumulation and an $O(B)$ linear prefix scan.",
    },
    {
      type: "code_progression",
      title: "From Object Pointer Trees to Flat-Array SIMD Decision Trees",
      language: "python",
      stages: [
        {
          label: "Stage 1: Recursive Object-Oriented Decision Tree Node",
          code: `class TreeNode:
    """
    Standard recursive pointer-based decision tree node.
    WARNING: Allocates fragmented heap objects, causing severe L1 cache thrashing.
    """
    def __init__(self, is_leaf: bool = False, value: int = 0, feature: int = 0, threshold: float = 0.0):
        self.is_leaf = is_leaf
        self.value = value
        self.feature = feature
        self.threshold = threshold
        self.left: TreeNode | None = None
        self.right: TreeNode | None = None

def naive_predict_row(node: TreeNode, x: list[float]) -> int:
    if node.is_leaf:
        return node.value
    if x[node.feature] <= node.threshold:
        return naive_predict_row(node.left, x)
    else:
        return naive_predict_row(node.right, x)`,
          explanation:
            "Pointer-chasing node traversal causes unpredictable branch branches and random DRAM memory fetches for each sample.",
          timeComplexity: "O(TreeDepth) per sample",
          spaceComplexity: "O(Nodes * PointerSize) fragmented memory",
        },
        {
          label: "Stage 2: Vectorized Continuous Split Finder via Cumulative Histograms",
          code: `import numpy as np

def find_best_split_vectorized(
    X_col: np.ndarray,
    y: np.ndarray,
    num_classes: int
) -> tuple[float, float, int]:
    """
    Finds the optimal Gini split threshold for a single feature column in O(N log N) time
    using vectorized cumulative sums.
    
    Args:
        X_col: 1D continuous feature values (N,)
        y: 1D integer class labels (N,)
        num_classes: Number of distinct classes K
        
    Returns:
        (best_gini_reduction, best_threshold, best_split_idx)
    """
    N = len(y)
    if N <= 1:
        return 0.0, 0.0, -1
        
    # 1. Sort feature values and align labels
    sort_idx = np.argsort(X_col)
    x_sorted = X_col[sort_idx]
    y_sorted = y[sort_idx]
    
    # 2. Convert labels to one-hot matrix: (N, K)
    one_hot = np.zeros((N, num_classes), dtype=np.float64)
    one_hot[np.arange(N), y_sorted] = 1.0
    
    # 3. Compute cumulative class counts along the left partition: (N, K)
    cum_left = np.cumsum(one_hot, axis=0)[:-1]          # (N-1, K)
    total_counts = np.sum(one_hot, axis=0)              # (K,)
    cum_right = total_counts - cum_left                  # (N-1, K)
    
    # Left and Right partition sample sizes
    n_l = np.arange(1, N)                               # (N-1,)
    n_r = N - n_l                                       # (N-1,)
    
    # 4. Gini impurities: 1 - sum((counts / n)^2)
    gini_left = 1.0 - np.sum((cum_left / n_l[:, None]) ** 2, axis=1)
    gini_right = 1.0 - np.sum((cum_right / n_r[:, None]) ** 2, axis=1)
    
    # Weighted impurity of candidate splits
    weighted_gini = (n_l / N) * gini_left + (n_r / N) * gini_right
    
    # Only consider splits where consecutive feature values differ
    split_mask = x_sorted[:-1] != x_sorted[1:]
    if not np.any(split_mask):
        return 0.0, 0.0, -1
        
    weighted_gini[~split_mask] = np.inf
    best_idx = int(np.argmin(weighted_gini))
    
    # Parent Gini
    parent_p = total_counts / N
    parent_gini = 1.0 - np.sum(parent_p ** 2)
    best_reduction = parent_gini - weighted_gini[best_idx]
    best_threshold = (x_sorted[best_idx] + x_sorted[best_idx + 1]) / 2.0
    
    return float(best_reduction), float(best_threshold), best_idx`,
          explanation:
            "Cumulative one-hot summation evaluates all $N-1$ split candidates across a sorted feature in a single vectorized pass without inner loops.",
          timeComplexity: "O(N log N + N * K)",
          spaceComplexity: "O(N * K) for cumulative matrix",
        },
        {
          label: "Stage 3: High-Performance Flat-Array Decision Tree Engine",
          code: `import numpy as np

class FlatArrayDecisionTree:
    """
    Memory-Contiguous Struct-of-Arrays Flat Decision Tree.
    Stores nodes inside aligned 1D primitive arrays for maximum hardware prefetching.
    """
    def __init__(self, max_depth: int = 6):
        self.max_depth = max_depth
        # Contiguous flattened node arrays
        self.feature_idx = np.empty(0, dtype=np.int32)
        self.thresholds = np.empty(0, dtype=np.float32)
        self.left_children = np.empty(0, dtype=np.int32)
        self.right_children = np.empty(0, dtype=np.int32)
        self.leaf_values = np.empty(0, dtype=np.int32)
        self.is_leaf = np.empty(0, dtype=bool)

    def batch_predict(self, X: np.ndarray) -> np.ndarray:
        """
        Vectorized batch prediction traversing contiguous array nodes.
        X has shape (N_samples, D_features).
        """
        N = X.shape[0]
        # Start all samples at root node (index 0)
        curr_nodes = np.zeros(N, dtype=np.int32)
        active = np.ones(N, dtype=bool)
        predictions = np.zeros(N, dtype=np.int32)
        
        while np.any(active):
            active_idx = np.where(active)[0]
            node_ids = curr_nodes[active_idx]
            
            # Check for leaves
            leaf_mask = self.is_leaf[node_ids]
            if np.any(leaf_mask):
                leaves = active_idx[leaf_mask]
                predictions[leaves] = self.leaf_values[node_ids[leaf_mask]]
                active[leaves] = False
                
            # Advance non-leaf samples
            non_leaves = active_idx[~leaf_mask]
            if len(non_leaves) == 0:
                break
                
            non_leaf_nodes = node_ids[~leaf_mask]
            feats = self.feature_idx[non_leaf_nodes]
            threshs = self.thresholds[non_leaf_nodes]
            
            # Branch decision: X[sample, feat] <= thresh
            sample_feats = X[non_leaves, feats]
            go_left = sample_feats <= threshs
            
            curr_nodes[non_leaves] = np.where(
                go_left,
                self.left_children[non_leaf_nodes],
                self.right_children[non_leaf_nodes]
            )
            
        return predictions`,
          explanation:
            "Flat array indexing keeps tree metadata in contiguous RAM buffers, allowing the CPU to evaluate batch tree paths using SIMD instructions with zero pointer overhead.",
          timeComplexity: "O(N * Depth) vectorized memory streaming",
          spaceComplexity: "O(NumNodes) cache-aligned flat arrays",
        },
      ],
      stepByStep: [
        "1. Quantize continuous input features into discrete 8-bit histogram bins (`uint8`).",
        "2. Compute cumulative class counts across candidates to find maximum Gini impurity reduction $\\Delta I$.",
        "3. Recursively partition dataset into left and right subsets.",
        "4. Flatten the resulting binary tree into aligned 1D primitive buffers (feature index, threshold, child offsets).",
        "5. Execute batch vectorized inference via flat array index stepping.",
      ],
    },
  ],
};
