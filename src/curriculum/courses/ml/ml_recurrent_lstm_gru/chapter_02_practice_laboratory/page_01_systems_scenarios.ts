import type { CoursePage } from "../../../../courseTypes";

export const page_01_systems_scenarios: CoursePage = {
  id: "ml_recurrent_lstm_gru_c2_p1_systems",
  pageNumber: 2,
  title: "Silicon Scenarios: Sequential Dependency Barrier & Parallel Associative Scans",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Production System Scenario: Overcoming the O(T) Recurrent Sequential Bottleneck",
      content:
        "When training an LSTM on sequence length $T = 4096$, each training step requires launching $4096$ sequential CUDA kernels. Even with cuDNN Persistent RNN kernels, GPU Streaming Multiprocessors remain idle waiting for the scalar temporal recurrence dependency $h_t = f(h_{t-1})$. In modern linear recurrent architectures (Mamba, RWKV, S5), the recurrence is restricted to linear time-invariant operators $h_t = A_t h_{t-1} + B_t x_t$, enabling the entire sequence to be computed in **$O(\\log T)$ span** using a **Blelloch Parallel Associative Prefix Scan** on GPU Tensor Cores.",
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_recurrent_gru_forward",
      title: "Gated Recurrent Unit (GRU) Vectorized Forward Engine",
      difficulty: "Hard",
      rationale:
        "Implement a vectorized GRU forward sequence processor with reset and update gating.",
      starterCode: `import numpy as np

def gru_sequence_forward(X: np.ndarray, h_0: np.ndarray, W_z: np.ndarray, W_r: np.ndarray, W_h: np.ndarray) -> np.ndarray:
    """
    GRU forward pass over T timesteps:
    r_t = sig(concat(x_t, h_{t-1}) @ W_r)
    z_t = sig(concat(x_t, h_{t-1}) @ W_z)
    h_tilde = tanh(concat(x_t, r_t * h_{t-1}) @ W_h)
    h_t = (1 - z_t) * h_{t-1} + z_t * h_tilde
    """
    T, B, _ = X.shape
    D_h = h_0.shape[-1]
    H = np.zeros((T, B, D_h), dtype=np.float32)
    h_prev = h_0
    
    for t in range(T):
        comb_zr = np.concatenate([X[t], h_prev], axis=-1)
        r_t = 1.0 / (1.0 + np.exp(-np.matmul(comb_zr, W_r)))
        z_t = 1.0 / (1.0 + np.exp(-np.matmul(comb_zr, W_z)))
        
        comb_h = np.concatenate([X[t], r_t * h_prev], axis=-1)
        h_tilde = np.tanh(np.matmul(comb_h, W_h))
        
        h_t = (1.0 - z_t) * h_prev + z_t * h_tilde
        H[t] = h_t
        h_prev = h_t
        
    return H`,
    },
  ],
};

export const page2 = page_01_systems_scenarios;
