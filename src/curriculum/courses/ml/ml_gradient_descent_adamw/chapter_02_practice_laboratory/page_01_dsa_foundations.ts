import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_gradient_descent_adamw_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: AdamW Optimizer & Learning Rate Schedulers",
  subtitle: "Interactive Implementation of Decoupled Weight Decay and Warmup Schedulers",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_adamw_step_engine",
      title: "Decoupled AdamW Parameter Update Step Engine",
      difficulty: "Hard",
      rationale:
        "Validates exact implementation of AdamW moment tracking, bias correction, and decoupled weight decay to guarantee numerical convergence.",
      starterCode: `import numpy as np

def adamw_step(
    param: np.ndarray,
    grad: np.ndarray,
    m: np.ndarray,
    v: np.ndarray,
    step: int,
    lr: float = 1e-3,
    beta1: float = 0.9,
    beta2: float = 0.999,
    eps: float = 1e-8,
    weight_decay: float = 0.01
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Executes a single AdamW parameter update step with decoupled weight decay.
    
    Args:
        param: Current weight array (float64)
        grad: Current gradient array (float64)
        m: First moment buffer (float64)
        v: Second moment buffer (float64)
        step: Current step integer (1-indexed)
        lr: Learning rate
        beta1: First moment coefficient
        beta2: Second moment coefficient
        eps: Numerical stability constant
        weight_decay: Decoupled weight decay coefficient
        
    Returns:
        (param_next, m_next, v_next)
    """
    # 1. Apply decoupled weight decay
    param_decayed = param * (1.0 - lr * weight_decay)
    
    # 2. Update first and second moments
    m_next = beta1 * m + (1.0 - beta1) * grad
    v_next = beta2 * v + (1.0 - beta2) * (grad ** 2)
    
    # 3. Compute bias corrections
    m_hat = m_next / (1.0 - beta1 ** step)
    v_hat = v_next / (1.0 - beta2 ** step)
    
    # 4. Compute parameter update
    param_next = param_decayed - lr * (m_hat / (np.sqrt(v_hat) + eps))
    
    return param_next, m_next, v_next

if __name__ == "__main__":
    p = np.array([1.0, 2.0])
    g = np.array([0.1, -0.2])
    m = np.zeros(2)
    v = np.zeros(2)
    p_next, m_next, v_next = adamw_step(p, g, m, v, step=1)
    print("Updated Param:", p_next)
    assert not np.allclose(p, p_next), "Param did not update!"
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_cosine_annealing_warmup",
      title: "Cosine Annealing with Linear Warmup Engine",
      difficulty: "Medium",
      rationale:
        "Generates learning rates across training steps, preventing Adam second-moment explosion in early iterations while enabling smooth annealing.",
      starterCode: `import math

def compute_schedule_lr(
    step: int,
    warmup_steps: int,
    total_steps: int,
    base_lr: float,
    min_lr: float = 0.0
) -> float:
    """
    Computes scheduled learning rate:
    - Steps [0, warmup_steps): Linear warmup from 0 to base_lr.
    - Steps [warmup_steps, total_steps]: Cosine decay from base_lr to min_lr.
    """
    if step < warmup_steps:
        return base_lr * (float(step) / float(max(1, warmup_steps)))
    if step >= total_steps:
        return min_lr
        
    progress = float(step - warmup_steps) / float(max(1, total_steps - warmup_steps))
    return min_lr + 0.5 * (base_lr - min_lr) * (1.0 + math.cos(math.pi * progress))
`,
    },
  ],
};

export const page1 = page_01_dsa_foundations;
