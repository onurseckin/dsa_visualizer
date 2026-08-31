import type { CoursePage } from "../../../../courseTypes";

export const page_01_systems_scenarios: CoursePage = {
  id: "ml_activations_online_softmax_c2_p1_systems",
  pageNumber: 2,
  title: "Silicon Scenarios: FlashAttention Kernel Fusion & SFU Pipeline Stalls",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Production System Scenario: Online Softmax Fusion Inside FlashAttention-2",
      content:
        "In naive PyTorch SDPA, materializing the attention score matrix $S = Q K^T / \\sqrt{d}$ in DRAM and performing a 3-pass softmax consumes $O(N^2)$ memory bandwidth. For sequence length $N = 32{,}768$, the attention matrix requires **2.14 GB per head**! In FlashAttention-2, the online softmax normalizer update ($m_{\\text{new}} = \\max(m_{\\text{old}}, m_{\\text{tile}})$, $d_{\\text{new}} = d_{\\text{old}} e^{m_{\\text{old}}-m_{\\text{new}}} + d_{\\text{tile}}$) is fused directly with the value accumulation ($O_{\\text{new}} = O_{\\text{old}} e^{m_{\\text{old}}-m_{\\text{new}}} + P_{\\text{tile}} V_{\\text{tile}}$) in shared memory, requiring **strictly zero HBM allocations for attention scores** and achieving a $4\\times$ speedup.",
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_activations_swiglu_backward",
      title: "Analytical SwiGLU Backward Gradient Engine",
      difficulty: "Hard",
      rationale:
        "Derive and implement analytical backward gradients for the SwiGLU activation module with respect to input activations and gate/up weight matrices.",
      starterCode: `import numpy as np

def swiglu_backward(X: np.ndarray, W_gate: np.ndarray, W_up: np.ndarray, grad_out: np.ndarray):
    """
    Computes analytical gradients dX, dW_gate, dW_up for SwiGLU layer:
    Forward: Y = (SiLU(X @ W_gate) * (X @ W_up))
    """
    # 1. Forward intermediate tensors
    H_gate = np.matmul(X, W_gate)
    H_up = np.matmul(X, W_up)
    
    # Sigmoid and SiLU
    sig = 1.0 / (1.0 + np.exp(-H_gate))
    silu = H_gate * sig
    
    # 2. Backward gradients
    # dL/dH_up = grad_out * silu
    dH_up = grad_out * silu
    
    # dL/dH_gate = grad_out * H_up * silu'(H_gate)
    # silu'(z) = sig(z) * (1 + z * (1 - sig(z)))
    silu_prime = sig * (1.0 + H_gate * (1.0 - sig))
    dH_gate = grad_out * H_up * silu_prime
    
    # Matrix gradients
    dW_gate = np.matmul(X.T, dH_gate)
    dW_up = np.matmul(X.T, dH_up)
    dX = np.matmul(dH_gate, W_gate.T) + np.matmul(dH_up, W_up.T)
    
    return dX, dW_gate, dW_up`,
    },
  ],
};

export const page2 = page_01_systems_scenarios;
