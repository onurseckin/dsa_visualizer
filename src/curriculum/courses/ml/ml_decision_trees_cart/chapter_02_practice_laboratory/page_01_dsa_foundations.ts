import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_decision_trees_cart_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: Split Finders & Flat Tree Solvers",
  subtitle: "Interactive Implementation of Continuous Split Search and Flat Array Predictors",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_cart_best_split_finder",
      title: "Fast Gini Impurity Split Finder Engine",
      difficulty: "Hard",
      rationale:
        "Validates exact implementation of candidate threshold evaluations to find the global optimal feature split maximizing Gini reduction.",
      starterCode: `import numpy as np

def find_best_split(
    X: np.ndarray,
    y: np.ndarray,
    min_samples_leaf: int = 1
) -> tuple[int, float, float]:
    """
    Finds the optimal (feature_idx, threshold, gini_reduction) across all features in X.
    
    Args:
        X: Feature matrix (N, D)
        y: Binary or multiclass integer labels (N,)
        min_samples_leaf: Minimum samples required in each child leaf
        
    Returns:
        (best_feat, best_thresh, max_gain)
    """
    N, D = X.shape
    classes = np.unique(y)
    K = len(classes)
    
    # Parent Gini
    counts = np.bincount(y, minlength=K)
    p_parent = counts / N
    parent_gini = 1.0 - np.sum(p_parent ** 2)
    
    best_gain = -1.0
    best_feat = -1
    best_thresh = 0.0
    
    for j in range(D):
        x_col = X[:, j]
        sort_idx = np.argsort(x_col)
        x_sorted = x_col[sort_idx]
        y_sorted = y[sort_idx]
        
        # Cumulative class counts for left partition
        one_hot = np.zeros((N, K))
        one_hot[np.arange(N), y_sorted] = 1.0
        cum_left = np.cumsum(one_hot, axis=0)[:-1]  # (N-1, K)
        cum_right = counts - cum_left
        
        n_l = np.arange(1, N)
        n_r = N - n_l
        
        # Valid splits respecting min_samples_leaf and non-identical consecutive values
        valid = (n_l >= min_samples_leaf) & (n_r >= min_samples_leaf) & (x_sorted[:-1] != x_sorted[1:])
        if not np.any(valid):
            continue
            
        gini_l = 1.0 - np.sum((cum_left / n_l[:, None]) ** 2, axis=1)
        gini_r = 1.0 - np.sum((cum_right / n_r[:, None]) ** 2, axis=1)
        weighted_gini = (n_l / N) * gini_l + (n_r / N) * gini_r
        gain = parent_gini - weighted_gini
        
        gain[~valid] = -np.inf
        curr_best_idx = np.argmax(gain)
        if gain[curr_best_idx] > best_gain:
            best_gain = float(gain[curr_best_idx])
            best_feat = j
            best_thresh = float((x_sorted[curr_best_idx] + x_sorted[curr_best_idx + 1]) / 2.0)
            
    return best_feat, best_thresh, max(0.0, best_gain)

if __name__ == "__main__":
    X_test = np.array([[1.0, 10.0], [2.0, 20.0], [3.0, 10.0], [4.0, 20.0]])
    y_test = np.array([0, 0, 1, 1])
    f, t, g = find_best_split(X_test, y_test)
    print(f"Optimal split: Feature {f}, Threshold {t}, Gain {g:.4f}")
    assert f == 0 and t == 2.5, "Failed to identify optimal split on feature 0!"
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_flat_array_tree_evaluator",
      title: "Flat Array Binary Tree Evaluator Engine",
      difficulty: "Hard",
      rationale:
        "Evaluates batch queries through a contiguous Struct-of-Arrays flat decision tree representation without recursion.",
      starterCode: `import numpy as np

def evaluate_flat_tree(
    X_query: np.ndarray,
    feature_indices: np.ndarray,
    thresholds: np.ndarray,
    left_children: np.ndarray,
    right_children: np.ndarray,
    leaf_values: np.ndarray,
    is_leaf: np.ndarray
) -> np.ndarray:
    """
    Evaluates predictions for X_query (N, D) on flat tree buffers.
    """
    N = X_query.shape[0]
    curr_nodes = np.zeros(N, dtype=np.int32)
    active = np.ones(N, dtype=bool)
    preds = np.zeros(N, dtype=np.int32)
    
    while np.any(active):
        active_ids = np.where(active)[0]
        node_ids = curr_nodes[active_ids]
        
        leaves = is_leaf[node_ids]
        if np.any(leaves):
            leaf_samples = active_ids[leaves]
            preds[leaf_samples] = leaf_values[node_ids[leaves]]
            active[leaf_samples] = False
            
        non_leaves = active_ids[~leaves]
        if len(non_leaves) == 0:
            break
            
        nl_nodes = node_ids[~leaves]
        f_idx = feature_indices[nl_nodes]
        th = thresholds[nl_nodes]
        
        go_left = X_query[non_leaves, f_idx] <= th
        curr_nodes[non_leaves] = np.where(go_left, left_children[nl_nodes], right_children[nl_nodes])
        
    return preds
`,
    },
  ],
};
