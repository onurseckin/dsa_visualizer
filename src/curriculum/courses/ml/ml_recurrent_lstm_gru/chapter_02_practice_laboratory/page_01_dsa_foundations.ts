import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "ml_recurrent_lstm_gru_c2_p1",
  pageNumber: 1,
  title: "Applied Laboratory: Fused-Gate LSTM Sequence Processing Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_recurrent_lstm_gru",
      title: "Implement Fused-Gate LSTM Forward Sequence Processor",
      difficulty: "Hard",
      rationale:
        "Implement a complete vectorized LSTM forward engine with fused 4-gate matrix projection, forget gate bias preservation, cell state updating, and output hidden sequence emission.",
      starterCode: `import numpy as np
from typing import Dict, Any, Tuple

class Solution:
    """
    Fused-Gate LSTM Sequence Processor.
    Computes forward pass over T timesteps using a single fused projection per step.
    """
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Args:
            inputs: Dictionary containing:
                - "X": np.ndarray of shape [T, B, d_in] (input sequence, float32)
                - "h_0": np.ndarray of shape [B, d_h] (initial hidden state)
                - "c_0": np.ndarray of shape [B, d_h] (initial cell state)
                - "W_all": np.ndarray of shape [d_in + d_h, 4 * d_h] (fused gate weights)
                - "b_all": np.ndarray of shape [4 * d_h] (fused gate bias: f, i, c, o)
        Returns:
            Dictionary containing:
                - "hidden_seq": np.ndarray of shape [T, B, d_h] (all hidden states)
                - "final_h": np.ndarray of shape [B, d_h]
                - "final_c": np.ndarray of shape [B, d_h]
                - "exact_match": bool
        """
        X = inputs["X"].astype(np.float32)
        h_0 = inputs["h_0"].astype(np.float32)
        c_0 = inputs["c_0"].astype(np.float32)
        W_all = inputs["W_all"].astype(np.float32)
        b_all = inputs["b_all"].astype(np.float32)

        T, B, d_in = X.shape
        d_h = h_0.shape[-1]

        hidden_seq = np.zeros((T, B, d_h), dtype=np.float32)
        h_prev = h_0
        c_prev = c_0

        for t in range(T):
            # 1. Concatenate input and previous hidden state: [B, d_in + d_h]
            combined = np.concatenate([X[t], h_prev], axis=-1)

            # 2. Fused GEMM: [B, 4 * d_h]
            gates = np.matmul(combined, W_all) + b_all

            # 3. Slice gates: f, i, c_tilde, o
            f_raw = gates[:, 0 : d_h]
            i_raw = gates[:, d_h : 2 * d_h]
            c_raw = gates[:, 2 * d_h : 3 * d_h]
            o_raw = gates[:, 3 * d_h : 4 * d_h]

            f_t = 1.0 / (1.0 + np.exp(-f_raw))
            i_t = 1.0 / (1.0 + np.exp(-i_raw))
            c_tilde = np.tanh(c_raw)
            o_t = 1.0 / (1.0 + np.exp(-o_raw))

            # 4. Cell state and Hidden state updates
            c_t = f_t * c_prev + i_t * c_tilde
            h_t = o_t * np.tanh(c_t)

            hidden_seq[t] = h_t
            h_prev = h_t
            c_prev = c_t

        return {
            "hidden_seq": hidden_seq,
            "final_h": h_prev,
            "final_c": c_prev,
            "exact_match": True,
        }`,
    },
  ],
};

export const page = page1;
export const page_01_dsa_foundations = page1;
