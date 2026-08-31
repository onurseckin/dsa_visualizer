import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_rope_gqa_attention_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: RoPE & Grouped-Query Attention Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_rope_gqa_attention",
      title: "Implement RoPE & GQA Forward Engine",
      difficulty: "Hard",
      rationale:
        "Build a complete RoPE and GQA attention module capable of applying frequency-based rotary positional transformations to query/key projections and computing grouped multi-head attention with causal masking.",
      starterCode: `import numpy as np
from typing import Dict, Tuple

class Solution:
    """
    RoPE and Grouped-Query Attention (GQA) execution kernel.
    Applies rotary positional embeddings to Queries and Keys,
    and calculates GQA with shared Key-Value heads.
    """
    def execute(self, inputs: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """
        Args:
            inputs: Dictionary containing:
                - "Q": Query tensor of shape [batch, seq_len, num_q_heads, head_dim]
                - "K": Key tensor of shape [batch, seq_len, num_kv_heads, head_dim]
                - "V": Value tensor of shape [batch, seq_len, num_kv_heads, head_dim]
                - "theta_base": float scalar, base frequency (e.g., 10000.0 or 500000.0)
        Returns:
            Dictionary containing:
                - "output": Attention output tensor of shape [batch, seq_len, num_q_heads, head_dim]
                - "Q_rot": Rotated queries of shape [batch, seq_len, num_q_heads, head_dim]
                - "K_rot": Rotated keys of shape [batch, seq_len, num_kv_heads, head_dim]
        """
        Q = inputs["Q"]
        K = inputs["K"]
        V = inputs["V"]
        theta_base = float(inputs["theta_base"].item()) if isinstance(inputs["theta_base"], np.ndarray) else float(inputs["theta_base"])

        B, N, H_Q, D = Q.shape
        _, _, H_KV, _ = K.shape
        assert H_Q % H_KV == 0, "num_q_heads must be divisible by num_kv_heads"
        assert D % 2 == 0, "head_dim must be even for RoPE"
        G = H_Q // H_KV

        # 1. Compute RoPE angles
        # inv_freq: [D / 2]
        inv_freq = 1.0 / (theta_base ** (np.arange(0, D, 2, dtype=np.float64) / D))
        # positions: [N]
        positions = np.arange(N, dtype=np.float64)
        # angles: [N, D / 2]
        angles = np.outer(positions, inv_freq)
        
        # Build cos and sin caches: [1, N, 1, D]
        cos_table = np.repeat(np.cos(angles), 2, axis=-1)[None, :, None, :]
        sin_table = np.repeat(np.sin(angles), 2, axis=-1)[None, :, None, :]

        # Helper for 2D pairwise rotation: [-x2, x1, -x4, x3, ...]
        def rotate_interleaved(x: np.ndarray) -> np.ndarray:
            x_rot = np.empty_like(x)
            x_rot[..., 0::2] = -x[..., 1::2]
            x_rot[..., 1::2] = x[..., 0::2]
            return x_rot

        # 2. Apply RoPE
        Q_rot = (Q * cos_table) + (rotate_interleaved(Q) * sin_table)
        K_rot = (K * cos_table) + (rotate_interleaved(K) * sin_table)

        # 3. Transpose to [B, H, N, D] for multi-head dot products
        q_h = Q_rot.transpose(0, 2, 1, 3)     # [B, H_Q, N, D]
        k_h = K_rot.transpose(0, 2, 1, 3)     # [B, H_KV, N, D]
        v_h = V.transpose(0, 2, 1, 3)         # [B, H_KV, N, D]

        # 4. Expand KV heads across groups: [B, H_KV, G, N, D] -> [B, H_Q, N, D]
        k_expanded = np.repeat(k_h[:, :, None, :, :], G, axis=2).reshape(B, H_Q, N, D)
        v_expanded = np.repeat(v_h[:, :, None, :, :], G, axis=2).reshape(B, H_Q, N, D)

        # 5. Scaled Dot-Product Attention with Causal Mask
        scale = 1.0 / np.sqrt(D)
        scores = np.matmul(q_h, k_expanded.transpose(0, 1, 3, 2)) * scale  # [B, H_Q, N, N]
        
        causal_mask = np.triu(np.ones((N, N), dtype=bool), k=1)
        scores_masked = np.where(causal_mask[None, None, :, :], -1e9, scores)

        # Safe Softmax
        m = np.max(scores_masked, axis=-1, keepdims=True)
        exp_s = np.exp(scores_masked - m)
        exp_s = np.where(causal_mask[None, None, :, :], 0.0, exp_s)
        attn_weights = exp_s / (np.sum(exp_s, axis=-1, keepdims=True) + 1e-12)

        # 6. Value Contraction: [B, H_Q, N, D] -> [B, N, H_Q, D]
        context = np.matmul(attn_weights, v_expanded).transpose(0, 2, 1, 3)

        return {
            "output": context,
            "Q_rot": Q_rot,
            "K_rot": K_rot,
        }`,
    },
  ],
};
