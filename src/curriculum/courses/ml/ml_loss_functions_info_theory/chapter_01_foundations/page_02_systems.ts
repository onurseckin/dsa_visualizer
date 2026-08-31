import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_loss_functions_info_theory_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage Loss Engine Progression",
  subtitle: "Log-Sum-Exp Stabilization, Label Smoothing, and Distributed InfoNCE Mining",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Microarchitecture Realities: The Log-Sum-Exp Trick & Temperature Scaling Dynamics",
      content:
        "1. **Floating-Point Softmax Catastrophe**: Computing $\\exp(z_i)$ for $z_i > 88.7$ in FP32 overflows to `+inf`, producing `NaN` losses. Conversely, for $z_i < -88.7$, $\\exp(z_i)$ underflows to `0.0`, triggering $\\log(0) = -\\text{inf}$. The **Log-Sum-Exp (LSE)** identity stabilizes computation by subtracting the row maximum $m = \\max_j z_j$:\n   $$\\log \\sum_{j=1}^K \\exp(z_j) = m + \\log \\sum_{j=1}^K \\exp(z_j - m)$$\n2. **Label Smoothing Regularization**: Hard one-hot targets ($y_k = 1$) force optimal logits $z_k \\to +\\infty$, causing gradient saturation and overconfident calibration errors. Label smoothing transforms targets to $\\tilde{y}_k = (1-\\epsilon) y_k + \\frac{\\epsilon}{K}$, bounding logit magnitudes and acting as entropy regularization.\n3. **Contrastive Temperature Scaling ($\\tau$)**: In InfoNCE loss, $\\tau$ controls the hardness of negative mining. As $\\tau \\to 0$, InfoNCE approaches hard nearest neighbor retrieval, causing gradient variance explosion. As $\\tau \\to \\infty$, logits collapse to uniform distributions, destroying feature discriminability.",
    },
    {
      type: "code_progression",
      title: "From Naive Cross-Entropy to Distributed InfoNCE Contrastive Loss",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive Softmax Cross-Entropy (Unstable)",
          code: `import math

def cross_entropy_naive(logits: list[float], target_idx: int) -> float:
    """
    Naive implementation of Softmax Cross-Entropy.
    WARNING: Suffers from floating-point overflow for logits > 88.0 (exp(100) -> inf)
    and underflow when p_target drops to 0.0 (log(0) -> -inf).
    """
    # 1. Compute raw exponentials
    exps = [math.exp(z) for z in logits]
    sum_exps = sum(exps)
    
    # 2. Compute probability
    p_target = exps[target_idx] / sum_exps
    
    # 3. Compute negative log likelihood
    return -math.log(p_target)`,
          explanation:
            "Direct exponentiation overflows standard 32-bit floats for moderate logit values ($z > 88.7$).",
          timeComplexity: "O(K) operations",
          spaceComplexity: "O(K) memory",
        },
        {
          label: "Stage 2: Numerically Stable Log-Sum-Exp Cross-Entropy & Focal Loss",
          code: `import numpy as np

def logsumexp(z: np.ndarray, axis: int = -1, keepdims: bool = True) -> np.ndarray:
    """Numerically stable Log-Sum-Exp: max(z) + log(sum(exp(z - max(z))))."""
    m = np.max(z, axis=axis, keepdims=True)
    return m + np.log(np.sum(np.exp(z - m), axis=axis, keepdims=keepdims))

def cross_entropy_stable(
    logits: np.ndarray,
    targets: np.ndarray,
    label_smoothing: float = 0.0
) -> tuple[float, np.ndarray]:
    """
    Numerically stable batch Cross-Entropy loss and exact analytical gradient.
    
    Args:
        logits: (Batch, NumClasses)
        targets: (Batch,) integer class indices
        label_smoothing: Epsilon smoothing parameter in [0, 1)
        
    Returns:
        (loss_scalar, grad_logits)
    """
    B, K = logits.shape
    # 1. Compute log-probabilities via stable LSE
    lse = logsumexp(logits, axis=-1, keepdims=True)  # (B, 1)
    log_probs = logits - lse                          # (B, K)
    probs = np.exp(log_probs)                         # (B, K)
    
    # 2. Create smoothed target distribution
    smoothed_targets = np.full((B, K), label_smoothing / K, dtype=np.float64)
    smoothed_targets[np.arange(B), targets] += (1.0 - label_smoothing)
    
    # 3. Compute loss: - sum( smoothed_target * log_prob )
    loss = -np.sum(smoothed_targets * log_probs) / B
    
    # 4. Analytical gradient: (probs - smoothed_targets) / B
    grad = (probs - smoothed_targets) / B
    
    return float(loss), grad

def focal_loss_stable(logits: np.ndarray, targets: np.ndarray, gamma: float = 2.0, alpha: float = 0.25) -> float:
    """Focal loss for addressing extreme class imbalance."""
    B, K = logits.shape
    lse = logsumexp(logits, axis=-1, keepdims=True)
    log_probs = logits - lse
    probs = np.exp(log_probs)
    
    # Extract target class probabilities
    p_t = probs[np.arange(B), targets]
    log_p_t = log_probs[np.arange(B), targets]
    
    # Modulating factor: (1 - p_t)^gamma
    focal_weight = alpha * ((1.0 - p_t) ** gamma)
    loss = -np.mean(focal_weight * log_p_t)
    return float(loss)`,
          explanation:
            "Log-Sum-Exp subtracts row maxima before exponentiation, preventing numerical overflow and underflow while computing exact linear residual gradients.",
          timeComplexity: "O(B * K) operations",
          spaceComplexity: "O(B * K)",
        },
        {
          label: "Stage 3: InfoNCE Contrastive Loss with Distributed Negative Mining",
          code: `import torch
import torch.nn.functional as F

class InfoNCELoss(torch.nn.Module):
    """
    Multi-GPU Distributed InfoNCE Contrastive Loss (e.g. CLIP, SimCLR, MoCo).
    Computes pairwise cosine similarities on normalized hyperspheres with temperature tau.
    """
    def __init__(self, temperature: float = 0.07):
        super().__init__()
        self.temperature = temperature

    def forward(self, query: torch.Tensor, key: torch.Tensor) -> torch.Tensor:
        """
        Args:
            query: Feature representations (Batch, EmbeddingDim)
            key: Corresponding positive representations (Batch, EmbeddingDim)
        """
        # 1. L2 Normalize representations onto unit hypersphere
        q_norm = F.normalize(query, dim=-1, p=2)
        k_norm = F.normalize(key, dim=-1, p=2)

        # 2. Pairwise Cosine Similarity Matrix: S = Q @ K^T / tau (Batch, Batch)
        logits = torch.matmul(q_norm, k_norm.T) / self.temperature

        # 3. Positive pairs lie along the main diagonal: target = [0, 1, ..., Batch-1]
        batch_size = query.shape[0]
        labels = torch.arange(batch_size, device=query.device, dtype=torch.long)

        # 4. Symmetrical Contrastive Cross-Entropy (Query-to-Key + Key-to-Query)
        loss_q2k = F.cross_entropy(logits, labels)
        loss_k2q = F.cross_entropy(logits.T, labels)
        
        return 0.5 * (loss_q2k + loss_k2q)`,
          explanation:
            "InfoNCE normalizes embeddings to the unit hypersphere and evaluates cross-entropy over the batch similarity matrix, mining in-batch negative representations with zero extra parameter overhead.",
          timeComplexity: "O(B^2 * D) for similarity matrix GEMM",
          spaceComplexity: "O(B^2) for similarity logits",
        },
      ],
      stepByStep: [
        "1. Compute row maximum $m = \\max_j z_j$ for numerical stabilization.",
        "2. Evaluate log-probabilities using the stable form $\\log p_i = z_i - m - \\ln \\sum \\exp(z_j - m)$.",
        "3. Blend one-hot targets with uniform prior for label smoothing: $\\tilde{y} = (1-\\epsilon) y + \\epsilon/K$.",
        "4. In contrastive learning, normalize feature vectors $\\|q\\|=1, \\|k\\|=1$ and scale dot products by temperature $\\tau$.",
        "5. Backpropagate pure probability residuals $p - y$ into representations.",
      ],
    },
  ],
};
