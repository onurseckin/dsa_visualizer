import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_gradients_jacobians_hessians_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage Differential Operator Progression",
  subtitle: "Hessian Memory Impossibility, Finite Difference Traps, and Hessian-Free Newton-CG",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Microarchitecture Realities: The 19.6 Zettabyte Hessian Storage Barrier",
      content:
        "1. **Full Hessian Storage Barrier**: For a modest 70-billion parameter foundation model (Llama-3-70B), storing the full Hessian matrix $H = \\nabla^2 \\mathcal{L} \\in \\mathbb{R}^{70\\times 10^9 \\times 70\\times 10^9}$ in FP32 requires:\n$$70 \\times 10^9 \\times 70 \\times 10^9 \\times 4\\text{ bytes} = 1.96 \\times 10^{22}\\text{ bytes} = 19{,}600\\text{ Exabytes} = 19.6\\text{ Zettabytes}$$\nThis exceeds the total storage capacity of all datacenters on Earth combined. Hence, exact second-order optimization MUST be entirely matrix-free.\n2. **Finite Difference Numerical Precision Trap**: Approximating gradients via central difference $\\frac{f(x+\\epsilon) - f(x-\\epsilon)}{2\\epsilon}$ suffers from a catastrophic tradeoff: as $\\epsilon \\to 0$, roundoff error from subtracting nearly equal floating-point numbers explodes as $\\mathcal{O}(\\epsilon_{\\text{mach}} / \\epsilon)$. The optimal step size is $\\epsilon^* = \\sqrt{\\epsilon_{\\text{mach}}}$ (approx $10^{-4}$ in FP32, $10^{-8}$ in FP64), leaving significant truncation error.",
    },
    {
      type: "code_progression",
      title: "Gradients, Hessians, and Matrix-Free Newton-CG Solvers",
      language: "python",
      stages: [
        {
          label: "Stage 1: Finite Difference Numerical Approximation",
          code: `import numpy as np
from typing import Callable

def finite_difference_gradient(f: Callable[[np.ndarray], float], x: np.ndarray, eps: float = 1e-5) -> np.ndarray:
    """
    Computes gradient via central finite differences.
    Requires 2*N full function evaluations -> O(N) evaluations!
    """
    n = len(x)
    grad = np.zeros(n, dtype=np.float64)
    for i in range(n):
        x_plus = x.copy()
        x_minus = x.copy()
        x_plus[i] += eps
        x_minus[i] -= eps
        grad[i] = (f(x_plus) - f(x_minus)) / (2 * eps)
    return grad

def finite_difference_hessian(f: Callable[[np.ndarray], float], x: np.ndarray, eps: float = 1e-4) -> np.ndarray:
    """
    Computes full Hessian via central differences of gradient.
    Requires O(N^2) function evaluations -> Impractical for large N!
    """
    n = len(x)
    H = np.zeros((n, n), dtype=np.float64)
    for i in range(n):
        for j in range(i, n):
            x_pp = x.copy(); x_pp[i] += eps; x_pp[j] += eps
            x_pm = x.copy(); x_pm[i] += eps; x_pm[j] -= eps
            x_mp = x.copy(); x_mp[i] -= eps; x_mp[j] += eps
            x_mm = x.copy(); x_mm[i] -= eps; x_mm[j] -= eps
            
            val = (f(x_pp) - f(x_pm) - f(x_mp) + f(x_mm)) / (4 * eps * eps)
            H[i, j] = val
            H[j, i] = val
    return H`,
          explanation:
            "Finite differences require $2N$ forward passes for gradients and $4N^2$ forward passes for the Hessian, while suffering from floating-point roundoff cancellation.",
          timeComplexity: "O(N^2 * T_f) for Hessian, O(N * T_f) for Gradient",
          spaceComplexity: "O(N^2) for Hessian storage",
        },
        {
          label: "Stage 2: Vectorized PyTorch Exact Jacobian & Hessian",
          code: `import torch
from torch.autograd.functional import jacobian, hessian

def pytorch_exact_differentials():
    """
    Computes exact analytical Jacobians and Hessians via PyTorch autodiff.
    """
    # Example Vector-to-Vector Function: F(x) = [x0^2 + x1, x0 * sin(x1)]
    def F(x: torch.Tensor) -> torch.Tensor:
        return torch.stack([x[0]**2 + x[1], x[0] * torch.sin(x[1])])
        
    # Example Scalar Loss Function: f(x) = x0^4 + 2 * x0 * x1 + 3 * x1^2
    def f(x: torch.Tensor) -> torch.Tensor:
        return x[0]**4 + 2.0 * x[0] * x[1] + 3.0 * x[1]**2

    x = torch.tensor([1.5, 2.0], dtype=torch.float64, requires_grad=True)
    
    # 1. Exact Jacobian J in R^(2x2)
    J = jacobian(F, x)
    print("Exact Jacobian J:\\n", J)
    
    # 2. Exact Hessian H in R^(2x2)
    H = hessian(f, x)
    print("Exact Hessian H:\\n", H)
    
    return J, H`,
          explanation:
            "PyTorch functional utilities build exact computation graphs to compute Jacobians and Hessians to machine precision using reverse-mode autodiff.",
          timeComplexity: "O(M * T_f) for Jacobian (M outputs), O(N * T_f) for Hessian",
          spaceComplexity: "O(M * N) for Jacobian, O(N^2) for Hessian",
        },
        {
          label: "Stage 3: Hessian-Free Newton-Conjugate Gradient (Pearlmutter Double-Backward)",
          code: `import torch
from typing import Callable

def compute_hvp(loss_fn: Callable[[torch.Tensor], torch.Tensor], x: torch.Tensor, v: torch.Tensor) -> torch.Tensor:
    """
    Computes exact Hessian-Vector Product H(x) @ v using Pearlmutter's double-backward trick.
    Peak Memory: O(N) (Zero N x N matrix allocation!).
    """
    x = x.detach().requires_grad_(True)
    loss = loss_fn(x)
    
    # First backward pass: Compute gradient g = nabla f(x) (retaining computational graph!)
    grad = torch.autograd.grad(loss, x, create_graph=True)[0]
    
    # Directional scalar inner product: s = <g, v>
    grad_dot_v = torch.sum(grad * v)
    
    # Second backward pass: Compute H @ v = nabla_x (<g, v>)
    hvp = torch.autograd.grad(grad_dot_v, x, retain_graph=False)[0]
    return hvp

def newton_cg_step(
    loss_fn: Callable[[torch.Tensor], torch.Tensor],
    x_curr: torch.Tensor,
    cg_max_iter: int = 20,
    cg_tol: float = 1e-5
) -> torch.Tensor:
    """
    Solves for the Newton step Delta x = - H^{-1} g using Conjugate Gradient (CG) with matrix-free HVPs.
    Solves H @ p = -g without ever forming or inverting H.
    """
    x = x_curr.detach().requires_grad_(True)
    loss = loss_fn(x)
    g = torch.autograd.grad(loss, x, create_graph=False)[0]  # Gradient
    
    # Solve H @ p = -g via Conjugate Gradient
    p = torch.zeros_like(g)
    r = -g.clone()
    d = r.clone()
    
    for _ in range(cg_max_iter):
        Hd = compute_hvp(loss_fn, x, d)
        d_Hd = torch.dot(d, Hd)
        
        if d_Hd <= 1e-12:  # Negative or zero curvature encountered -> Terminate CG step
            break
            
        alpha = torch.dot(r, r) / d_Hd
        p = p + alpha * d
        r_next = r - alpha * Hd
        
        if torch.norm(r_next) < cg_tol:
            break
            
        beta = torch.dot(r_next, r_next) / torch.dot(r, r)
        r = r_next
        d = r_next + beta * d
        
    return p  # Optimal Newton direction`,
          explanation:
            "Hessian-Free Newton-CG computes exact second-order Newton updates using only matrix-vector products $H v$. Each HVP takes approximately $2\\times$ the cost of a standard backward pass, enabling second-order optimization in strictly $O(N)$ memory.",
          timeComplexity: "O(K_cg * T_backward) where K_cg is CG iterations",
          spaceComplexity: "O(N) memory",
        },
      ],
      stepByStep: [
        "1. Compute loss $\\mathcal{L}(x)$ and first-order gradient $g = \\nabla \\mathcal{L}(x)$ with `create_graph=True`.",
        "2. Form directional inner product $s = \\langle g, v \\rangle$.",
        "3. Differentiate $s$ with respect to $x$ to obtain exact vector $H v = \\nabla_x s$.",
        "4. Run Conjugate Gradient on $H p = -g$ to extract second-order Newton search direction $p$.",
      ],
    },
  ],
};
