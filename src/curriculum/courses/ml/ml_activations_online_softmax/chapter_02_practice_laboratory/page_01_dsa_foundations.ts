import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_activations_online_softmax_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: Online Softmax & SwiGLU Gating Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_activations_online_softmax",
      title: "Implement Online Softmax Normalizer & SwiGLU Gated Feedforward Layer",
      difficulty: "Hard",
      rationale:
        "Implement a streaming Online Softmax algorithm with dynamic running max/normalizer updates and a SwiGLU activation module with exact numerical verification.",
      starterCode: `import numpy as np
from typing import Dict, Any, Tuple

class Solution:
    """
    Online Softmax Streaming Normalizer and SwiGLU Feedforward Engine.
    Executes block-tiled online max/sum rescaling and gated non-linear projections.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "logits": np.ndarray of shape [B, N] (input logits, float32)
                - "block_size": int (tile size for streaming online softmax)
                - "X_swiglu": np.ndarray of shape [B, D_in]
                - "W_gate": np.ndarray of shape [D_in, D_ffn]
                - "W_up": np.ndarray of shape [D_in, D_ffn]
                - "W_down": np.ndarray of shape [D_ffn, D_in]
        Returns:
            Dictionary containing:
                - "online_softmax_probs": np.ndarray of shape [B, N]
                - "swiglu_output": np.ndarray of shape [B, D_in]
                - "softmax_max_error": float (difference vs 3-pass safe softmax)
                - "exact_match": bool
        """
        logits = inputs["logits"].astype(np.float32)
        block_size = int(inputs.get("block_size", 64))
        X = inputs["X_swiglu"].astype(np.float32)
        W_gate = inputs["W_gate"].astype(np.float32)
        W_up = inputs["W_up"].astype(np.float32)
        W_down = inputs["W_down"].astype(np.float32)

        B, N = logits.shape
        online_probs = np.zeros_like(logits, dtype=np.float32)

        # 1. Online Softmax Pass
        for b in range(B):
            row = logits[b]
            m_prev = -float("inf")
            d_prev = 0.0

            # Pass 1: Stream running max and running normalizer
            for i in range(0, N, block_size):
                tile = row[i : min(i + block_size, N)]
                m_tile = np.max(tile)
                m_curr = max(m_prev, m_tile)

                scale_prev = np.exp(m_prev - m_curr) if m_prev != -float("inf") else 0.0
                d_curr = d_prev * scale_prev + np.sum(np.exp(tile - m_curr))

                m_prev = m_curr
                d_prev = d_curr

            # Pass 2: Write normalized output
            for i in range(0, N, block_size):
                i_end = min(i + block_size, N)
                online_probs[b, i:i_end] = np.exp(row[i:i_end] - m_prev) / d_prev

        # Reference safe softmax
        m_ref = np.max(logits, axis=-1, keepdims=True)
        exp_ref = np.exp(logits - m_ref)
        ref_probs = exp_ref / np.sum(exp_ref, axis=-1, keepdims=True)
        max_err = float(np.max(np.abs(online_probs - ref_probs)))

        # 2. SwiGLU Forward Pass
        # h_gate = X @ W_gate, h_up = X @ W_up
        h_gate = np.matmul(X, W_gate)
        h_up = np.matmul(X, W_up)
        # SiLU: h_gate / (1 + exp(-h_gate))
        silu = h_gate / (1.0 + np.exp(-h_gate))
        gated = silu * h_up
        swiglu_out = np.matmul(gated, W_down)

        return {
            "online_softmax_probs": online_probs,
            "swiglu_output": swiglu_out,
            "softmax_max_error": max_err,
            "exact_match": bool(max_err < 1e-6),
        }`,
    },
  ],
};

export const page = page1;
export const page_01_dsa_foundations = page1;
