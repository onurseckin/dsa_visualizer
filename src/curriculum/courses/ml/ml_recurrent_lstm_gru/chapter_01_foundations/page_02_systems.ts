import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_recurrent_lstm_gru_c1_p2",
  pageNumber: 2,
  title: "3-Stage Code Progression & Silicon Realities",
  sections: [
    {
      type: "code_progression",
      title: "Recurrent Networks: 3-Stage Architectural Evolution",
      language: "python",
      stages: [
        {
          label: "Stage 1: Naive Unrolled Vanilla RNN Loop Baseline",
          code: `import numpy as np

def naive_rnn_forward(X: np.ndarray, h_0: np.ndarray, W_hh: np.ndarray, W_xh: np.ndarray, b_h: np.ndarray) -> np.ndarray:
    """
    Standard sequential vanilla RNN forward loop.
    X: [T, B, D_in], h_0: [B, D_h]
    """
    T, B, _ = X.shape
    D_h = h_0.shape[-1]
    
    H = np.zeros((T, B, D_h), dtype=np.float32)
    h_prev = h_0
    
    for t in range(T):
        # h_t = tanh(h_{t-1} @ W_hh + x_t @ W_xh + b)
        z = np.matmul(h_prev, W_hh) + np.matmul(X[t], W_xh) + b_h
        h_t = np.tanh(z)
        H[t] = h_t
        h_prev = h_t
        
    return H`,
          explanation:
            "Sequential loop over time $T$. Suffers from vanishing gradients on long sequences and launches $2T$ small matrix multiplications.",
          timeComplexity: "O(T * B * D_h * (D_in + D_h))",
          spaceComplexity: "O(T * B * D_h) stashed hidden states",
        },
        {
          label: "Stage 2: Vectorized Fused-Gate LSTM Cell Sequence Processor",
          code: `import numpy as np

class VectorizedLSTM:
    """
    Fused-Gate LSTM Implementation:
    Combines W_f, W_i, W_c, W_o into a single large projection W_4x.
    """
    def __init__(self, d_in: int, d_h: int):
        self.d_in = d_in
        self.d_h = d_h
        # Fused weights: [d_in + d_h, 4 * d_h]
        self.W_all = np.random.randn(d_in + d_h, 4 * d_h).astype(np.float32) * np.sqrt(2.0 / (d_in + d_h))
        self.b_all = np.zeros(4 * d_h, dtype=np.float32)
        # Initialize forget gate bias to 1.0 (CEC gradient preservation!)
        self.b_all[0 : d_h] = 1.0
        
    def forward(self, X: np.ndarray, h_0: np.ndarray, c_0: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        # X: [T, B, d_in]
        T, B, _ = X.shape
        H = np.zeros((T, B, self.d_h), dtype=np.float32)
        
        h_prev = h_0
        c_prev = c_0
        
        for t in range(T):
            # 1. Concatenate input and previous hidden state: [B, d_in + d_h]
            combined = np.concatenate([X[t], h_prev], axis=-1)
            
            # 2. Single Fused GEMM for all 4 gates: [B, 4 * d_h]
            gates = np.matmul(combined, self.W_all) + self.b_all
            
            # 3. Slice into individual gate activations
            f_raw = gates[:, 0 : self.d_h]
            i_raw = gates[:, self.d_h : 2 * self.d_h]
            c_raw = gates[:, 2 * self.d_h : 3 * self.d_h]
            o_raw = gates[:, 3 * self.d_h : 4 * self.d_h]
            
            f_t = 1.0 / (1.0 + np.exp(-f_raw))
            i_t = 1.0 / (1.0 + np.exp(-i_raw))
            c_tilde = np.tanh(c_raw)
            o_t = 1.0 / (1.0 + np.exp(-o_raw))
            
            # 4. Cell state & Hidden state updates
            c_t = f_t * c_prev + i_t * c_tilde
            h_t = o_t * np.tanh(c_t)
            
            H[t] = h_t
            h_prev = h_t
            c_prev = c_t
            
        return H, c_prev`,
          explanation:
            "Fuses the 4 separate gate matrix multiplications into a single BLAS GEMM per timestep, cutting kernel launch overhead by 75%.",
          timeComplexity: "O(T * B * (d_in + d_h) * 4 * d_h)",
          spaceComplexity: "O(T * B * d_h) activation memory",
        },
        {
          label: "Stage 3: Low-Level Fused BPTT Engine with cuDNN Caching Simulation",
          code: `import numpy as np

def fused_lstm_bptt_backward_sim(
    grad_H: np.ndarray,      # [T, B, d_h]
    cached_combined: np.ndarray, # [T, B, d_in + d_h]
    cached_gates: np.ndarray,    # [T, B, 4 * d_h] (f, i, c_tilde, o)
    cached_C: np.ndarray,        # [T+1, B, d_h]
    W_all: np.ndarray            # [d_in + d_h, 4 * d_h]
) -> np.ndarray:
    """
    Simulates high-performance cuDNN fused backward BPTT kernel:
    Traverses backward in time t = T-1 down to 0 inside GPU registers/SRAM,
    accumulating dW_all in-place.
    """
    T, B, d_h = grad_H.shape
    grad_W_all = np.zeros_like(W_all)
    
    dh_next = np.zeros((B, d_h), dtype=np.float32)
    dc_next = np.zeros((B, d_h), dtype=np.float32)
    
    for t in reversed(range(T)):
        # 1. Total hidden gradient at step t
        dh_t = grad_H[t] + dh_next
        
        # 2. Reconstruct gate activations from cache
        f_t = cached_gates[t, :, 0 : d_h]
        i_t = cached_gates[t, :, d_h : 2 * d_h]
        c_tilde = cached_gates[t, :, 2 * d_h : 3 * d_h]
        o_t = cached_gates[t, :, 3 * d_h : 4 * d_h]
        c_t = cached_C[t + 1]
        c_prev = cached_C[t]
        
        # 3. Adjoints
        tanh_c = np.tanh(c_t)
        do_t = dh_t * tanh_c * (o_t * (1.0 - o_t))
        
        dc_t = dc_next + dh_t * o_t * (1.0 - tanh_c ** 2)
        df_t = dc_t * c_prev * (f_t * (1.0 - f_t))
        di_t = dc_t * c_tilde * (i_t * (1.0 - i_t))
        dc_tilde_t = dc_t * i_t * (1.0 - c_tilde ** 2)
        
        # 4. Fused delta for all 4 gates: [B, 4 * d_h]
        delta_gates = np.concatenate([df_t, di_t, dc_tilde_t, do_t], axis=-1)
        
        # In-place parameter gradient accumulation
        grad_W_all += np.matmul(cached_combined[t].T, delta_gates)
        
        # Adjoint backprop to previous step
        d_combined = np.matmul(delta_gates, W_all.T)
        dh_next = d_combined[:, -d_h:]
        dc_next = dc_t * f_t
        
    return grad_W_all`,
          explanation:
            "Simulates the cuDNN persistent LSTM backward pass: propagates error backwards through time in registers, maintaining zero global memory traffic for intermediate gate gradients.",
          timeComplexity: "O(T * B * (d_in + d_h) * 4 * d_h)",
          spaceComplexity: "O(1) temporary buffer memory",
        },
      ],
    },
    {
      type: "callout",
      variant: "systems",
      title: "Silicon Realities: cuDNN Persistent RNN Architecture",
      content:
        "In standard PyTorch RNN loops, each timestep launches a separate CUDA kernel, causing high driver latency. NVIDIA **cuDNN Persistent RNNs** keep GPU Streaming Multiprocessors (SMs) resident in a persistent execution loop across all $T$ timesteps, storing recurrent weights ($W_{hh}$) in fast L2 cache and passing hidden states ($h_t, c_t$) directly between SM registers without global DRAM roundtrips.",
    },
  ],
};

export const page_02_systems = page2;
