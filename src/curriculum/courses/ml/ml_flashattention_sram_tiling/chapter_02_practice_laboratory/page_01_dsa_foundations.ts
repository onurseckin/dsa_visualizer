import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_flashattention_sram_tiling_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: FlashAttention-2 Block-Tiled Forward Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_flashattention_sram_tiling",
      title: "Implement FlashAttention-2 Tiled Attention Forward Engine",
      difficulty: "Hard",
      rationale:
        "Implement the core tiled online softmax forward pass algorithm of FlashAttention-2, handling arbitrary sequence lengths, query block size $B_r$, key/value block size $B_c$, causal masking, and register-level rescaling.",
      starterCode: `import numpy as np
from typing import Dict, Tuple

class Solution:
    """
    FlashAttention-2 Forward Pass Block-Tiling Engine.
    Executes block-by-block online softmax accumulation without
    materializing the full (seq_len x seq_len) intermediate attention matrix.
    """
    def execute(self, inputs: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """
        Args:
            inputs: Dictionary containing:
                - "Q": Query tensor of shape [batch, num_heads, seq_len, head_dim]
                - "K": Key tensor of shape [batch, num_heads, seq_len, head_dim]
                - "V": Value tensor of shape [batch, num_heads, seq_len, head_dim]
                - "block_r": int scalar wrapped in array, query block size (e.g. 32 or 64)
                - "block_c": int scalar wrapped in array, key/value block size (e.g. 32 or 64)
                - "is_causal": bool scalar, whether to apply causal masking
        Returns:
            Dictionary containing:
                - "O": Attention output tensor of shape [batch, num_heads, seq_len, head_dim]
                - "L": Logsumexp normalizers of shape [batch, num_heads, seq_len]
        """
        Q = inputs["Q"]
        K = inputs["K"]
        V = inputs["V"]
        Br = int(inputs["block_r"].item()) if isinstance(inputs["block_r"], np.ndarray) else int(inputs["block_r"])
        Bc = int(inputs["block_c"].item()) if isinstance(inputs["block_c"], np.ndarray) else int(inputs["block_c"])
        is_causal = bool(inputs["is_causal"].item()) if isinstance(inputs["is_causal"], np.ndarray) else bool(inputs["is_causal"])

        B, H, N, D = Q.shape
        scale = 1.0 / np.sqrt(D)

        O = np.zeros_like(Q)
        L = np.zeros((B, H, N), dtype=np.float64)

        Tr = (N + Br - 1) // Br
        Tc = (N + Bc - 1) // Bc

        for b in range(B):
            for h in range(H):
                # Outer loop over Query blocks
                for i in range(Tr):
                    r_start = i * Br
                    r_end = min(r_start + Br, N)
                    cur_Br = r_end - r_start

                    Qi = Q[b, h, r_start:r_end, :]  # Shape: [cur_Br, D]

                    # Initialize running stats in simulated SRAM registers
                    m_prev = np.full((cur_Br, 1), -np.inf, dtype=np.float64)
                    l_prev = np.zeros((cur_Br, 1), dtype=np.float64)
                    acc_O = np.zeros((cur_Br, D), dtype=np.float64)

                    # Inner loop over Key/Value blocks
                    max_j = (r_end + Bc - 1) // Bc if is_causal else Tc
                    for j in range(max_j):
                        c_start = j * Bc
                        c_end = min(c_start + Bc, N)
                        cur_Bc = c_end - c_start

                        Kj = K[b, h, c_start:c_end, :]  # [cur_Bc, D]
                        Vj = V[b, h, c_start:c_end, :]  # [cur_Bc, D]

                        # Tile score multiplication
                        S_tile = np.matmul(Qi, Kj.T) * scale  # [cur_Br, cur_Bc]

                        if is_causal:
                            row_idx = np.arange(r_start, r_end)[:, None]
                            col_idx = np.arange(c_start, c_end)[None, :]
                            S_tile = np.where(col_idx <= row_idx, S_tile, -1e9)

                        # Online Softmax Update
                        m_curr = np.max(S_tile, axis=-1, keepdims=True)
                        m_new = np.maximum(m_prev, m_curr)

                        alpha = np.exp(m_prev - m_new)
                        beta = np.exp(S_tile - m_new)

                        if is_causal:
                            row_idx = np.arange(r_start, r_end)[:, None]
                            col_idx = np.arange(c_start, c_end)[None, :]
                            beta = np.where(col_idx <= row_idx, beta, 0.0)

                        l_new = alpha * l_prev + np.sum(beta, axis=-1, keepdims=True)
                        acc_O = alpha * acc_O + np.matmul(beta, Vj)

                        m_prev = m_new
                        l_prev = l_new

                    # Final normalization and write to output
                    O[b, h, r_start:r_end, :] = acc_O / (l_prev + 1e-12)
                    L[b, h, r_start:r_end] = (m_prev + np.log(l_prev + 1e-12)).squeeze(-1)

        return {
            "O": O,
            "L": L,
        }`,
    },
  ],
};

export const page_01_dsa_foundations = page1;
