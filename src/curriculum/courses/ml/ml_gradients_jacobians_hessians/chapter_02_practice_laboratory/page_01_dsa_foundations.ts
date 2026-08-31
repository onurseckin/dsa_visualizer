import type { CoursePage } from "../../../../courseTypes";

export const page_01_dsa_foundations: CoursePage = {
  id: "ml_gradients_jacobians_hessians_c2_p1",
  pageNumber: 1,
  title: "Silicon Playground: Matrix-Free Curvature & HVP Engines",
  subtitle: "Interactive Implementation of Pearlmutter Double Backward & Newton-CG",
  estimatedMinutes: 30,
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "ml_hvp_pearlmutter_engine",
      title: "Exact Hessian-Vector Product Engine via Double Backward",
      difficulty: "Hard",
      rationale:
        "Validates implementation of Pearlmutter's HVP trick using autograd graph retention to compute second-order directional derivatives without allocating a Hessian matrix.",
      starterCode: `import torch
from typing import Callable

def matrix_free_hvp(
    f: Callable[[torch.Tensor], torch.Tensor],
    x: torch.Tensor,
    v: torch.Tensor
) -> torch.Tensor:
    """
    Computes H(x) @ v exactly using Pearlmutter's double backward identity.
    
    Args:
        f: Scalar loss function f: R^n -> R
        x: Point of evaluation (n,) with requires_grad=True
        v: Direction vector (n,)
        
    Returns:
        hvp: Resulting vector H(x) @ v of shape (n,)
    """
    # Step 1: Forward pass to compute loss
    loss = f(x)
    
    # Step 2: Compute first gradient with graph creation enabled
    grad = torch.autograd.grad(loss, x, create_graph=True)[0]
    
    # Step 3: Compute inner product with v
    grad_v = torch.dot(grad, v)
    
    # Step 4: Differentiate inner product with respect to x
    hvp = torch.autograd.grad(grad_v, x, retain_graph=False)[0]
    
    return hvp

if __name__ == "__main__":
    # Test on quadratic: f(x) = 0.5 * x^T A x where A is known
    A = torch.tensor([[4.0, 1.0], [1.0, 3.0]], dtype=torch.float64)
    def test_loss(x: torch.Tensor) -> torch.Tensor:
        return 0.5 * torch.dot(x, torch.matmul(A, x))
        
    x_test = torch.tensor([2.0, -1.0], dtype=torch.float64, requires_grad=True)
    v_test = torch.tensor([1.0, 2.0], dtype=torch.float64)
    
    # True HVP = A @ v
    expected_hvp = torch.matmul(A, v_test)
    computed_hvp = matrix_free_hvp(test_loss, x_test, v_test)
    
    print("Expected HVP:", expected_hvp)
    print("Computed HVP:", computed_hvp)
    assert torch.allclose(computed_hvp, expected_hvp), "HVP computation error!"
`,
    },
    {
      type: "problem_checkpoint",
      problemId: "ml_vector_jacobian_product",
      title: "Batch Vector-Jacobian Product (VJP) Engine",
      difficulty: "Hard",
      rationale:
        "Computes adjoint vector-Jacobian products v^T J for a multi-output vector function F: R^n -> R^m in a single reverse-mode pass.",
      starterCode: `import torch
from typing import Callable

def batch_vjp(
    F: Callable[[torch.Tensor], torch.Tensor],
    x: torch.Tensor,
    v: torch.Tensor
) -> torch.Tensor:
    """
    Computes v^T @ J_F(x) via reverse-mode autograd in a single backward pass.
    
    Args:
        F: Vector function mapping (n,) -> (m,)
        x: Input tensor (n,) with requires_grad=True
        v: Cotangent vector (m,)
        
    Returns:
        vjp: Vector (n,) representing v^T J_F(x)
    """
    y = F(x)
    assert y.shape == v.shape, "Cotangent vector v must match output dimension"
    vjp = torch.autograd.grad(y, x, grad_outputs=v)[0]
    return vjp
`,
    },
  ],
};
