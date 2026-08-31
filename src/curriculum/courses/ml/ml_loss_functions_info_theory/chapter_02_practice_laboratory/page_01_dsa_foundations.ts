import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_loss_functions_info_theory_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: Loss Engines & Contrastive Mining",
  subtitle: "Interactive Implementation of Fused LogSoftmax and InfoNCE Loss",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_stable_cross_entropy_backward",
      title: "Fused Stable Cross-Entropy & Backward Residual Engine",
      difficulty: "Hard",
      rationale:
        "Validates exact implementation of Log-Sum-Exp fused with negative log likelihood to compute loss and analytical gradient without instantiating intermediate un-normalized exponentials.",
      starterCode: `import numpy as np

def fused_cross_entropy_forward_backward(
    logits: np.ndarray,
    targets: np.ndarray
) -> tuple[float, np.ndarray]:
    """
    Computes numerically stable Cross-Entropy loss and analytical gradient dL/dz.
    
    Args:
        logits: Array of shape (B, K)
        targets: Integer class index array of shape (B,)
        
    Returns:
        (loss, grad): Scalar loss and (B, K) gradient array.
    """
    B, K = logits.shape
    
    # 1. Max trick for stability
    m = np.max(logits, axis=1, keepdims=True)  # (B, 1)
    shifted = logits - m
    
    # 2. Compute logsumexp and log-probs
    lse = m + np.log(np.sum(np.exp(shifted), axis=1, keepdims=True))
    log_probs = logits - lse
    
    # 3. Compute mean NLL loss
    loss = -np.mean(log_probs[np.arange(B), targets])
    
    # 4. Compute gradient (probs - one_hot) / B
    probs = np.exp(log_probs)
    probs[np.arange(B), targets] -= 1.0
    grad = probs / B
    
    return float(loss), grad

if __name__ == "__main__":
    logits_test = np.array([[1000.0, 1001.0, 1002.0], [-1000.0, -1001.0, -1002.0]])
    targets_test = np.array([2, 0])
    loss, grad = fused_cross_entropy_forward_backward(logits_test, targets_test)
    print(f"Computed loss: {loss:.4f}")
    assert not np.isnan(loss) and not np.isinf(loss), "Loss overflowed or underflowed to NaN/Inf!"
    print("Fused cross entropy verification passed!")
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_infonce_contrastive_engine",
      title: "InfoNCE Batch Similarity & Contrastive Loss Engine",
      difficulty: "Hard",
      rationale:
        "Implements pairwise feature cosine normalization, temperature-scaled similarity matrix multiplication, and symmetric contrastive loss.",
      starterCode: `import numpy as np

def infonce_loss(
    q: np.ndarray,
    k: np.ndarray,
    temperature: float = 0.07
) -> float:
    """
    Computes symmetrical InfoNCE loss over batch representations.
    
    Args:
        q: Query embeddings of shape (B, D)
        k: Key embeddings of shape (B, D)
        temperature: Scalar tau
        
    Returns:
        Scalar InfoNCE contrastive loss.
    """
    B, D = q.shape
    # 1. L2 Normalize along feature dimension
    q_norm = q / np.linalg.norm(q, axis=1, keepdims=True)
    k_norm = k / np.linalg.norm(k, axis=1, keepdims=True)
    
    # 2. Similarity matrix S = Q @ K^T / tau (B, B)
    sim_matrix = np.dot(q_norm, k_norm.T) / temperature
    
    # 3. Labels are diagonal elements (indices 0..B-1)
    labels = np.arange(B)
    
    # 4. Cross entropy along rows and cols
    # Row-wise: Query predicting Key
    m_row = np.max(sim_matrix, axis=1, keepdims=True)
    lse_row = m_row + np.log(np.sum(np.exp(sim_matrix - m_row), axis=1, keepdims=True))
    loss_q2k = -np.mean(sim_matrix[np.arange(B), labels, None] - lse_row)
    
    # Col-wise: Key predicting Query
    sim_T = sim_matrix.T
    m_col = np.max(sim_T, axis=1, keepdims=True)
    lse_col = m_col + np.log(np.sum(np.exp(sim_T - m_col), axis=1, keepdims=True))
    loss_k2q = -np.mean(sim_T[np.arange(B), labels, None] - lse_col)
    
    return float(0.5 * (loss_q2k + loss_k2q))
`,
    },
  ],
};

export const page1 = page_01_dsa_foundations;
