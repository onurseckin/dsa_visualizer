import type { CoursePage } from "../../../../courseTypes";

export const page_02_systems: CoursePage = {
  id: "ml_autodiff_engines_c1_p2",
  pageNumber: 2,
  title: "Systems Realities & 3-Stage Autodiff Engine Progression",
  subtitle: "Dual Number Forward AD, Topological DAG Tape, and Tensor-Level Autograd",
  estimatedMinutes: 30,
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Microarchitecture Realities: Autograd Activation Caching & Activation Checkpointing",
      content:
        "1. **Activation Memory Lifecycle**: In deep Transformer models, backward passes require forward activations to compute gradients (e.g. $\\nabla_W (X W) = X^T \\bar{Y}$ requires keeping $X$ in VRAM). For sequence length $S = 8192$ and batch size $B = 4$, storing activations across 32 layers consumes $>80\\%$ of total GPU VRAM, far exceeding model weight storage.\n2. **Activation Checkpointing (Rematerialization)**: By saving activations only at layer boundaries (checkpoints) and recomputing intermediate activations during the backward pass, peak memory drops from $\\mathcal{O}(L)$ to $\\mathcal{O}(\\sqrt{L})$ at the cost of a single extra forward pass (~33% compute overhead).\n3. **Python GC Circular Reference Traps**: Attaching backward closures that capture `self` or other graph nodes creates reference cycles that bypass reference counting and force expensive Python GC pauses unless explicitly freed via `_backward = None`.",
    },
    {
      type: "code_progression",
      title: "Building Autodiff Engines: From Dual Numbers to Tensor Autograd",
      language: "python",
      stages: [
        {
          label: "Stage 1: Dual Number Forward-Mode Autodiff Engine",
          code: `import math

class DualNumber:
    """
    Forward-Mode AD via Dual Numbers: a + b * epsilon where epsilon^2 = 0.
    Simultaneously computes f(x) and f'(x) in a single forward evaluation.
    """
    def __init__(self, real: float, dual: float = 0.0):
        self.real = float(real)
        self.dual = float(dual)  # Derivative component (tangent)

    def __repr__(self) -> str:
        return f"DualNumber(real={self.real:.4f}, dual={self.dual:.4f})"

    def __add__(self, other: "DualNumber | float") -> "DualNumber":
        other = other if isinstance(other, DualNumber) else DualNumber(other)
        # (a + b eps) + (c + d eps) = (a + c) + (b + d) eps
        return DualNumber(self.real + other.real, self.dual + other.dual)

    def __mul__(self, other: "DualNumber | float") -> "DualNumber":
        other = other if isinstance(other, DualNumber) else DualNumber(other)
        # (a + b eps) * (c + d eps) = a*c + (a*d + b*c) eps + b*d*eps^2 (= 0)
        return DualNumber(
            self.real * other.real,
            self.real * other.dual + self.dual * other.real
        )

    def sin(self) -> "DualNumber":
        # d/dx sin(x) = cos(x) * x'
        return DualNumber(math.sin(self.real), math.cos(self.real) * self.dual)

    def exp(self) -> "DualNumber":
        # d/dx exp(x) = exp(x) * x'
        e = math.exp(self.real)
        return DualNumber(e, e * self.dual)

def forward_diff(f, x_val: float) -> tuple[float, float]:
    """Seed x with dual=1.0 to compute df/dx."""
    x = DualNumber(x_val, dual=1.0)
    result = f(x)
    return result.real, result.dual`,
          explanation:
            "Dual numbers compute exact analytic derivatives alongside function evaluation with zero numerical error and zero graph storage overhead.",
          timeComplexity: "O(1) forward overhead per operation",
          spaceComplexity: "O(1) auxiliary memory",
        },
        {
          label: "Stage 2: Scalar Reverse-Mode Autograd Engine (Topological Tape)",
          code: `import math

class Value:
    """
    Scalar Reverse-Mode Autograd Node.
    Constructs a dynamic Directed Acyclic Graph (DAG) for backward sensitivity propagation.
    """
    def __init__(self, data: float, _children: tuple["Value", ...] = (), _op: str = ""):
        self.data = float(data)
        self.grad = 0.0  # Adjoint accumulator
        self._backward = lambda: None
        self._prev = set(_children)
        self._op = _op

    def __repr__(self) -> str:
        return f"Value(data={self.data:.4f}, grad={self.grad:.4f})"

    def __add__(self, other: "Value | float") -> "Value":
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other), "+")
        
        def _backward():
            self.grad += 1.0 * out.grad   # Multivariate accumulation (+=)
            other.grad += 1.0 * out.grad
        out._backward = _backward
        return out

    def __mul__(self, other: "Value | float") -> "Value":
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other), "*")
        
        def _backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad
        out._backward = _backward
        return out

    def backward(self):
        """Topological sort followed by reverse-order adjoint propagation."""
        topo: list[Value] = []
        visited: set[Value] = set()
        
        def build_topo(v: Value):
            if v not in visited:
                visited.add(v)
                for child in v._prev:
                    build_topo(child)
                topo.append(v)
                
        build_topo(self)
        
        # Seed output loss gradient
        self.grad = 1.0
        # Traverse in reverse topological order
        for node in reversed(topo):
            node._backward()`,
          explanation:
            "The `Value` engine constructs a dynamic computational graph during the forward pass. Calling `backward()` runs a DFS topological sort and propagates adjoints using the multivariate chain rule with `+=` accumulation.",
          timeComplexity: "O(V + E) forward and backward traversal",
          spaceComplexity: "O(V + E) DAG node allocation",
        },
        {
          label: "Stage 3: Tensor-Level Autograd Engine with Broadcasting Adjoints",
          code: `import numpy as np

def unbroadcast_adjoint(grad: np.ndarray, target_shape: tuple[int, ...]) -> np.ndarray:
    """
    Sums gradient along broadcasted dimensions to match original tensor shape.
    Essential for operations where tensors of different shapes were combined.
    """
    grad_shape = grad.shape
    # If dimensions were prepended (e.g. shape (3, 4) broadcasted to (2, 3, 4))
    lead_dims = len(grad_shape) - len(target_shape)
    for _ in range(lead_dims):
        grad = grad.sum(axis=0)
    # Sum along singleton dimensions that were expanded (e.g. (1, 4) expanded to (3, 4))
    for dim, (g_dim, t_dim) in enumerate(zip(grad.shape, target_shape)):
        if t_dim == 1 and g_dim > 1:
            grad = grad.sum(axis=dim, keepdims=True)
    return grad

class Tensor:
    """
    Production Tensor Autograd Engine with multi-dimensional broadcasting & Matmul support.
    """
    def __init__(self, data: np.ndarray | list, requires_grad: bool = False, _children: tuple = ()):
        self.data = np.ascontiguousarray(np.asarray(data, dtype=np.float64))
        self.requires_grad = requires_grad
        self.grad: np.ndarray | None = None
        self._backward = lambda: None
        self._prev = set(_children)

    def __add__(self, other: "Tensor") -> "Tensor":
        out_data = self.data + other.data
        req_grad = self.requires_grad or other.requires_grad
        out = Tensor(out_data, requires_grad=req_grad, _children=(self, other))
        
        def _backward():
            if self.requires_grad:
                g = unbroadcast_adjoint(out.grad, self.data.shape)
                self.grad = g if self.grad is None else self.grad + g
            if other.requires_grad:
                g = unbroadcast_adjoint(out.grad, other.data.shape)
                other.grad = g if other.grad is None else other.grad + g
        out._backward = _backward
        return out

    def matmul(self, other: "Tensor") -> "Tensor":
        """Matrix multiplication C = A @ B. Backward: dA = dC @ B^T, dB = A^T @ dC."""
        out_data = np.matmul(self.data, other.data)
        req_grad = self.requires_grad or other.requires_grad
        out = Tensor(out_data, requires_grad=req_grad, _children=(self, other))
        
        def _backward():
            if self.requires_grad:
                # dA = dC @ B^T
                dA = np.matmul(out.grad, other.data.T)
                self.grad = dA if self.grad is None else self.grad + dA
            if other.requires_grad:
                # dB = A^T @ dC
                dB = np.matmul(self.data.T, out.grad)
                other.grad = dB if other.grad is None else other.grad + dB
        out._backward = _backward
        return out

    def backward(self, grad: np.ndarray | None = None):
        if grad is None:
            assert self.data.size == 1, "Grad can only be implicitly created for scalar outputs"
            grad = np.ones_like(self.data)
        self.grad = grad
        
        topo: list[Tensor] = []
        visited: set[Tensor] = set()
        def build_topo(v: Tensor):
            if v not in visited:
                visited.add(v)
                for child in v._prev:
                    build_topo(child)
                topo.append(v)
        build_topo(self)
        
        for node in reversed(topo):
            node._backward()`,
          explanation:
            "Handles multi-dimensional array operations, matrix multiplications, and automatically reduces adjoint gradients across broadcasted dimensions using `unbroadcast_adjoint`.",
          timeComplexity: "O(T_forward) for backward pass",
          spaceComplexity: "O(Total activations in graph)",
        },
      ],
      stepByStep: [
        "1. Construct forward computational tape linking parent nodes to child results.",
        "2. Save necessary forward activation tensors required by chain rule expressions.",
        "3. Sort graph nodes into topological order via depth-first search.",
        "4. Seed root scalar adjoint $\\bar{\\mathcal{L}} = 1.0$ and propagate $\\bar{v}_j = \\sum \\bar{v}_k \\frac{\\partial \\phi_k}{\\partial v_j}$.",
        "5. Reduce broadcasted gradient dimensions to match source parameter shapes.",
      ],
    },
  ],
};
