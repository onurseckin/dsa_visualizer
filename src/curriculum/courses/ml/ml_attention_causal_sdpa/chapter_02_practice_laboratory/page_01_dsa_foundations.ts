import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_attention_causal_sdpa_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: Causal Multi-Head Attention Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_attention_causal_sdpa",
      title: "Implement Causal Multi-Head Attention Engine",
      difficulty: "Hard",
      rationale:
        "Engineers must implement a production-grade Causal Multi-Head Scaled Dot-Product Attention operator with explicit multi-head tensor splitting, numerical stabilization, dynamic causal masking, and head projection concatenation.",
      starterCode: `import numpy as np
from typing import Dict, Tuple

class Solution:
    """
    Causal Scaled Dot-Product Multi-Head Attention Engine.
    Implements multi-head projection splitting, scaled attention with causal masking,
    max-subtraction numerical stabilization, and output projection.
    """
    def execute(self, inputs: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """
        Args:
            inputs: Dictionary containing:
                - "Q": Query tensor of shape [batch, seq_len, d_model]
                - "K": Key tensor of shape [batch, seq_len, d_model]
                - "V": Value tensor of shape [batch, seq_len, d_model]
                - "num_heads": int scalar wrapped as array, number of attention heads H
                - "W_o": Output projection matrix of shape [d_model, d_model]
        Returns:
            Dictionary containing:
                - "output": Projected context tensor of shape [batch, seq_len, d_model]
                - "attention_weights": Normalized causal attention probabilities [batch, num_heads, seq_len, seq_len]
        """
        Q = inputs["Q"]
        K = inputs["K"]
        V = inputs["V"]
        num_heads = int(inputs["num_heads"].item()) if isinstance(inputs["num_heads"], np.ndarray) else int(inputs["num_heads"])
        W_o = inputs["W_o"]

        B, N, D_model = Q.shape
        assert D_model % num_heads == 0, "d_model must be divisible by num_heads"
        d_k = D_model // num_heads
        scale = 1.0 / np.sqrt(d_k)

        # 1. Reshape and transpose to [B, num_heads, N, d_k]
        q_heads = Q.reshape(B, N, num_heads, d_k).transpose(0, 2, 1, 3)
        k_heads = K.reshape(B, N, num_heads, d_k).transpose(0, 2, 1, 3)
        v_heads = V.reshape(B, N, num_heads, d_k).transpose(0, 2, 1, 3)

        # 2. Compute Raw Scores: [B, H, N, N]
        scores = np.matmul(q_heads, k_heads.transpose(0, 1, 3, 2)) * scale

        # 3. Construct Causal Mask: Upper triangle (j > i) set to -infinity
        causal_mask = np.triu(np.ones((N, N), dtype=bool), k=1)
        scores_masked = np.where(causal_mask[None, None, :, :], -1e9, scores)

        # 4. Numerically Stable Softmax across last dimension
        max_scores = np.max(scores_masked, axis=-1, keepdims=True)
        exp_scores = np.exp(scores_masked - max_scores)
        # Re-zero masked out regions to prevent precision leaks
        exp_scores = np.where(causal_mask[None, None, :, :], 0.0, exp_scores)
        sum_exp = np.sum(exp_scores, axis=-1, keepdims=True)
        attention_weights = exp_scores / (sum_exp + 1e-12)

        # 5. Context Contraction & Concatenation: [B, H, N, d_k] -> [B, N, D_model]
        context = np.matmul(attention_weights, v_heads)
        context_concat = context.transpose(0, 2, 1, 3).reshape(B, N, D_model)

        # 6. Final Output Linear Projection
        output = np.matmul(context_concat, W_o)

        return {
            "output": output,
            "attention_weights": attention_weights,
        }`,
    },
  ],
};
