import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_ensemble_xgboost_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: XGBoost 2nd-Order Engines & Histogram Splitters",
  subtitle: "Interactive Implementation of Exact Gain Evaluators and Histogram Subtraction",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_xgboost_leaf_gain_engine",
      title: "XGBoost 2nd-Order Leaf & Gain Evaluation Engine",
      difficulty: "Hard",
      rationale:
        "Validates exact implementation of XGBoost 2nd-order Taylor objective score, optimal leaf weights, and split gain.",
      starterCode: `import numpy as np

def compute_leaf_weight_and_gain(
    g_left: np.ndarray,
    h_left: np.ndarray,
    g_right: np.ndarray,
    h_right: np.ndarray,
    l2_reg: float = 1.0,
    gamma: float = 0.0
) -> tuple[float, float, float]:
    """
    Computes optimal leaf weights for left/right children and total split gain.
    
    Args:
        g_left: 1st order gradients for left child (N_L,)
        h_left: 2nd order positive Hessians for left child (N_L,)
        g_right: 1st order gradients for right child (N_R,)
        h_right: 2nd order positive Hessians for right child (N_R,)
        l2_reg: L2 leaf weight penalty lambda
        gamma: Complexity penalty per leaf
        
    Returns:
        (w_left, w_right, split_gain)
    """
    G_L = float(np.sum(g_left))
    H_L = float(np.sum(h_left))
    G_R = float(np.sum(g_right))
    H_R = float(np.sum(h_right))
    
    # 1. Optimal leaf weights w* = - G / (H + lambda)
    w_L = -G_L / (H_L + l2_reg)
    w_R = -G_R / (H_R + l2_reg)
    
    # 2. Split Gain
    G_tot = G_L + G_R
    H_tot = H_L + H_R
    
    gain = 0.5 * (
        (G_L ** 2) / (H_L + l2_reg) +
        (G_R ** 2) / (H_R + l2_reg) -
        (G_tot ** 2) / (H_tot + l2_reg)
    ) - gamma
    
    return w_L, w_R, gain

if __name__ == "__main__":
    g_l = np.array([-2.0, -3.0])
    h_l = np.array([1.0, 1.0])
    g_r = np.array([4.0, 5.0])
    h_r = np.array([1.0, 1.0])
    w_l, w_r, gain = compute_leaf_weight_and_gain(g_l, h_l, g_r, h_r, l2_reg=1.0, gamma=0.1)
    print(f"w_left: {w_l:.3f}, w_right: {w_r:.3f}, gain: {gain:.3f}")
    assert w_l > 0 and w_r < 0 and gain > 0, "Incorrect XGBoost leaf weight or gain calculation!"
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_histogram_subtraction_engine",
      title: "Fast Histogram Subtraction Split Engine",
      difficulty: "Hard",
      rationale:
        "Implements the O(B) histogram subtraction optimization for child node split evaluations.",
      starterCode: `import numpy as np

def histogram_subtraction_split(
    G_parent: np.ndarray,
    H_parent: np.ndarray,
    bin_col_left: np.ndarray,
    g_left: np.ndarray,
    h_left: np.ndarray,
    num_bins: int = 256,
    l2_reg: float = 1.0,
    gamma: float = 0.0
) -> tuple[int, float]:
    """
    Builds histogram for left child, computes right histogram via subtraction,
    and returns optimal (split_bin, max_gain).
    """
    # 1. Accumulate left histogram: O(N_L)
    G_L_hist = np.bincount(bin_col_left, weights=g_left, minlength=num_bins)
    H_L_hist = np.bincount(bin_col_left, weights=h_left, minlength=num_bins)
    
    # 2. Histogram Subtraction: Right = Parent - Left in O(B)
    G_R_hist = G_parent - G_L_hist
    H_R_hist = H_parent - H_L_hist
    
    # 3. Cumulative prefix sums
    cum_G_L = np.cumsum(G_L_hist)[:-1]
    cum_H_L = np.cumsum(H_L_hist)[:-1]
    
    G_tot = np.sum(G_parent)
    H_tot = np.sum(H_parent)
    
    cum_G_R = G_tot - cum_G_L
    cum_H_R = H_tot - cum_H_L
    
    gains = 0.5 * (
        (cum_G_L ** 2) / (cum_H_L + l2_reg) +
        (cum_G_R ** 2) / (cum_H_R + l2_reg) -
        (G_tot ** 2) / (H_tot + l2_reg)
    ) - gamma
    
    best_bin = int(np.argmax(gains))
    return best_bin, float(max(0.0, gains[best_bin]))
`,
    },
  ],
};

export const page1 = page_01_dsa_foundations;
