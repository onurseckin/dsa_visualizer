import type { CoursePage } from "../../../../courseTypes";

export const page_01_systems_scenarios: CoursePage = {
  id: "ml_mlp_backpropagation_c2_p1_systems",
  pageNumber: 2,
  title: "Silicon Scenarios: Activation Memory Wall & Rematerialization Traces",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Production System Scenario: Microbatch Sizing Under VRAM Constraints",
      content:
        "When training a 70B parameter model across 8x H100 GPUs (80GB VRAM each), the MLP block (SwiGLU with hidden expansion $d_{\\text{ffn}} = \\frac{8}{3} d_{\\text{model}} = 14{,}336$) consumes 1.8 GB of activation memory per microbatch per layer. Across 80 layers and sequence length $S = 8192$, activation memory exceeds 144 GB per GPU, triggering immediate out-of-memory errors on microbatch size $B = 2$. By applying Selective Activation Checkpointing (recomputing SwiGLU activation tensors during backward while retaining only attention input matrices), activation memory drops to **18.2 GB**, enabling stable training at batch size $B = 4$.",
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_mlp_numerical_gradient_checker",
      title: "Finite Difference Numerical Gradient Verifier",
      difficulty: "Hard",
      rationale:
        "Implement a two-sided numerical gradient checking tool to verify exact analytical backpropagation derivatives within relative tolerance $10^{-5}$.",
      starterCode: `import numpy as np

def check_numerical_gradient(forward_fn, grad_analytical: np.ndarray, weight: np.ndarray, eps: float = 1e-5) -> float:
    """
    Computes two-sided finite difference gradient: (f(w + eps) - f(w - eps)) / (2 * eps)
    and evaluates relative error vs analytical gradient.
    """
    grad_num = np.zeros_like(weight)
    it = np.nditer(weight, flags=['multi_index'], op_flags=['readwrite'])
    while not it.finished:
        idx = it.multi_index
        orig = weight[idx]
        
        weight[idx] = orig + eps
        loss_plus = forward_fn(weight)
        
        weight[idx] = orig - eps
        loss_minus = forward_fn(weight)
        
        weight[idx] = orig
        grad_num[idx] = (loss_plus - loss_minus) / (2.0 * eps)
        it.iternext()
        
    rel_error = np.linalg.norm(grad_analytical - grad_num) / (np.linalg.norm(grad_analytical) + np.linalg.norm(grad_num) + 1e-8)
    return float(rel_error)`,
    },
  ],
};

export const page2 = page_01_systems_scenarios;
