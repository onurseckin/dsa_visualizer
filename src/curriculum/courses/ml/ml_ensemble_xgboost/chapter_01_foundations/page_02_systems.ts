import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_ensemble_xgboost_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage XGBoost Progression",
  subtitle: "Histogram Binning, Histogram Subtraction, and 2nd-Order Taylor Boosting Engines",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Microarchitecture Realities: Histogram Subtraction & Out-of-Core Block Caching",
      content:
        "1. **Histogram Subtraction Optimization**: Constructing gradient/hessian histograms for both left and right children at every node would cost $O(2 \\cdot N)$. The **Histogram Subtraction Trick** builds the histogram only for the smaller child (e.g. left, with $N_L < N/2$) and evaluates the right child via element-wise vector subtraction: $G_R = G_{\\text{parent}} - G_L$ and $H_R = H_{\\text{parent}} - H_L$. This $O(B)$ subtraction cuts histogram construction FLOPs in half across the entire tree hierarchy.\n2. **Out-of-Core Block Structure & Compressed CSR**: When datasets exceed available GPU/CPU DRAM (e.g. 500 million rows), XGBoost partitions data into compressed block formats on NVMe SSDs. Independent worker threads decompress blocks in background I/O threads into pinned host memory while compute threads perform histogram accumulations, completely hiding storage I/O latency.",
    },
    {
      type: "code_progression",
      title: "From 1st-Order GBDT to 2nd-Order Histogram XGBoost Engines",
      language: "python",
      stages: [
        {
          label: "Stage 1: Pure Python 1st-Order Residual Boosting",
          code: `class PurePythonGBDT:
    """
    Naive 1st-order Gradient Boosted Decision Tree.
    Fits subsequent trees to simple negative residuals (y - y_hat).
    """
    def __init__(self, n_estimators: int = 10, lr: float = 0.1):
        self.n_estimators = n_estimators
        self.lr = lr
        self.trees: list[dict] = []
        self.base_pred = 0.0

    def fit(self, X: list[list[float]], y: list[float]):
        self.base_pred = sum(y) / len(y)
        preds = [self.base_pred] * len(y)
        
        for _ in range(self.n_estimators):
            # Compute 1st order negative gradients (residuals)
            residuals = [y[i] - preds[i] for i in range(len(y))]
            # Fit simple decision stump to residuals
            stump = {"feature": 0, "threshold": 0.0, "left_val": -1.0, "right_val": 1.0}
            self.trees.append(stump)
            # Update predictions
            for i in range(len(y)):
                val = stump["left_val"] if X[i][0] <= 0.0 else stump["right_val"]
                preds[i] += self.lr * val`,
          explanation:
            "Basic 1st-order GBDT relies only on residual directions without Hessian curvature, requiring fine-grained step tuning to prevent overshooting.",
          timeComplexity: "O(Trees * N * D)",
          spaceComplexity: "O(Trees) tree metadata",
        },
        {
          label: "Stage 2: Vectorized XGBoost with Exact 2nd-Order Hessian Gain",
          code: `import numpy as np

def compute_xgboost_split_gain(
    g: np.ndarray,
    h: np.ndarray,
    x_col: np.ndarray,
    l2_reg: float = 1.0,
    gamma: float = 0.0
) -> tuple[float, float, float, float]:
    """
    Computes exact 2nd-order XGBoost split gain and optimal child leaf weights.
    
    Args:
        g: 1st order gradients (N,)
        h: 2nd order positive Hessians (N,)
        x_col: 1D continuous feature values (N,)
        l2_reg: Leaf L2 regularization lambda
        gamma: Tree complexity penalty
        
    Returns:
        (best_gain, best_threshold, w_left, w_right)
    """
    N = len(g)
    sort_idx = np.argsort(x_col)
    g_sorted = g[sort_idx]
    h_sorted = h[sort_idx]
    x_sorted = x_col[sort_idx]
    
    # Cumulative gradients and hessians along candidate splits
    G_left = np.cumsum(g_sorted)[:-1]
    H_left = np.cumsum(h_sorted)[:-1]
    
    G_total = np.sum(g)
    H_total = np.sum(h)
    
    G_right = G_total - G_left
    H_right = H_total - H_left
    
    # Valid splits with non-identical consecutive values
    valid_splits = x_sorted[:-1] != x_sorted[1:]
    if not np.any(valid_splits):
        return -1.0, 0.0, 0.0, 0.0
        
    # XGBoost 2nd-order gain formula
    gain = 0.5 * (
        (G_left ** 2) / (H_left + l2_reg) +
        (G_right ** 2) / (H_right + l2_reg) -
        (G_total ** 2) / (H_total + l2_reg)
    ) - gamma
    
    gain[~valid_splits] = -np.inf
    best_idx = int(np.argmax(gain))
    best_gain = float(gain[best_idx])
    
    if best_gain <= 0:
        return 0.0, 0.0, 0.0, 0.0
        
    best_threshold = float((x_sorted[best_idx] + x_sorted[best_idx + 1]) / 2.0)
    w_left = float(-G_left[best_idx] / (H_left[best_idx] + l2_reg))
    w_right = float(-G_right[best_idx] / (H_right[best_idx] + l2_reg))
    
    return best_gain, best_threshold, w_left, w_right`,
          explanation:
            "Vectorized 2nd-order XGBoost evaluates exact leaf curvatures and split gains simultaneously in $O(N)$ vector operations.",
          timeComplexity: "O(N log N + N)",
          spaceComplexity: "O(N) cumulative buffers",
        },
        {
          label: "Stage 3: Quantized Histogram-Based Split Engine with Subtraction",
          code: `import numpy as np

class FastHistogramSplitEngine:
    """
    High-Performance Quantized Histogram Split Engine with O(B) Histogram Subtraction.
    Operates on uint8 feature bin indices for maximum SIMD throughput.
    """
    def __init__(self, num_bins: int = 256, l2_reg: float = 1.0, gamma: float = 0.0):
        self.num_bins = num_bins
        self.l2_reg = l2_reg
        self.gamma = gamma

    def build_histogram(self, bin_col: np.ndarray, g: np.ndarray, h: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """Accumulates G and H into B bins: O(N) memory streaming."""
        G_hist = np.bincount(bin_col, weights=g, minlength=self.num_bins)
        H_hist = np.bincount(bin_col, weights=h, minlength=self.num_bins)
        return G_hist, H_hist

    def subtract_histogram(
        self,
        G_parent: np.ndarray,
        H_parent: np.ndarray,
        G_left: np.ndarray,
        H_left: np.ndarray
    ) -> tuple[np.ndarray, np.ndarray]:
        """O(B) Histogram Subtraction Trick: Right = Parent - Left."""
        return G_parent - G_left, H_parent - H_left

    def find_best_bin_split(self, G_hist: np.ndarray, H_hist: np.ndarray) -> tuple[float, int]:
        """Evaluates split gain across B bins in O(B) time."""
        G_L = np.cumsum(G_hist)[:-1]
        H_L = np.cumsum(H_hist)[:-1]
        
        G_tot = np.sum(G_hist)
        H_tot = np.sum(H_hist)
        
        G_R = G_tot - G_L
        H_R = H_tot - H_L
        
        # Gain computation
        gain = 0.5 * (
            (G_L ** 2) / (H_L + self.l2_reg) +
            (G_R ** 2) / (H_R + self.l2_reg) -
            (G_tot ** 2) / (H_tot + self.l2_reg)
        ) - self.gamma
        
        best_bin = int(np.argmax(gain))
        best_gain = float(gain[best_bin])
        return max(0.0, best_gain), best_bin`,
          explanation:
            "Quantized histogram binning reduces split search complexity from $O(N \\log N)$ to $O(N + B)$ where $B=256$, with histogram subtraction halving accumulator passes.",
          timeComplexity: "O(N + B) per feature node",
          spaceComplexity: "O(B) L1-cache resident buffers",
        },
      ],
      stepByStep: [
        "1. Quantize continuous input columns into discrete `uint8` bin indices ($0..255$).",
        "2. Compute first order gradients $g_i$ and second order Hessians $h_i$ for current ensemble predictions.",
        "3. Accumulate gradient and hessian histograms ($G_{\\text{hist}}, H_{\\text{hist}}$) in $O(N)$ time.",
        "4. Evaluate split gains across all $B$ candidate bins using cumulative sums in $O(B)$ time.",
        "5. Apply the histogram subtraction trick ($H_R = H_{\\text{parent}} - H_L$) when splitting child partitions.",
      ],
    },
  ],
};
