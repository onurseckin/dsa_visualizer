import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_autodiff_engines_c1_p1",
  pageNumber: 1,
  title: "Automatic Differentiation Engines: Forward vs Reverse Mode",
  subtitle: "Dual Numbers, Computational DAGs, Adjoint Sensitivity, and Baur-Strassen Optimality",
  estimatedMinutes: 30,
  sections: [
    {
      type: "prose",
      title: "The Computational Graph: Forward vs Reverse Mode",
      content:
        "Automatic Differentiation (Autodiff / Autograd) is the computational backbone of all modern deep learning frameworks (PyTorch, JAX, TensorFlow) (Stanford CS336 / MIT 18.065). Autodiff is distinct from both symbolic differentiation (which suffers from expression swell) and numerical finite differences (which suffers from truncation and roundoff errors).\n\nAny differentiable computer program is represented as a **Directed Acyclic Graph (DAG)** of elementary operations $\\mathcal{G} = (\\mathcal{V}, \\mathcal{E})$, where vertices $v_i$ represent intermediate variables and directed edges $(v_j, v_i)$ represent dependencies $v_i = phi_i(\\text{parents}(v_i))$.\n\nThere are two fundamental modes of autodiff:\n\n1. **Forward-Mode AD (Tangents / Dual Numbers)**:\n   Propagates directional derivatives (tangents) $\\dot{v}_i = \\frac{\\partial v_i}{\\partial x}$ from input $x$ to all downstream nodes:\n   $$\\dot{v}_i = \\sum_{j \\in \\text{parents}(i)} \\frac{\\partial \\phi_i}{\\partial v_j} \\dot{v}_j$$\n   - Mathematically equivalent to algebra over **Dual Numbers** $\\mathbb{D} = \\{a + b\\epsilon \\mid a, b \\in \\mathbb{R}, \\epsilon^2 = 0\\}$.\n   - Computes Jacobian-Vector Products (JVPs) $J v$.\n   - Computational Cost: For $f: \\mathbb{R}^n \\to \\mathbb{R}^m$, requires $n$ forward passes. Ideal when $n \\ll m$.\n\n2. **Reverse-Mode AD (Adjoints / Backpropagation)**:\n   Propagates sensitivity gradients (adjoints) $\\bar{v}_i = \\frac{\\partial \\mathcal{L}}{\\partial v_i}$ backward from the scalar loss $\\mathcal{L} = v_N$ to all input variables:\n   $$\\bar{v}_j = \\sum_{k \\in \\text{children}(j)} \\bar{v}_k \\frac{\\partial \\phi_k}{\\partial v_j}$$\n   - Computes Vector-Jacobian Products (VJPs) $v^T J$.\n   - Computational Cost: For scalar loss $\\mathcal{L}: \\mathbb{R}^n \\to \\mathbb{R}$, computes the ENTIRE gradient $\\nabla_x \\mathcal{L} \\in \\mathbb{R}^n$ in a single backward sweep in time $\\mathcal{O}(\\text{Cost}(\\text{Forward}))$, completely independent of the parameter dimension $n$ (where $n$ can be 100+ billion parameters).",
    },
    {
      type: "mental_model",
      title: "DAG Topological Execution & Adjoint Accumulation",
      visualIntuition:
        "Computation Graph DAG for z = (x * y) + sin(x):\n\n       x --------+----------------+\n       |         |                |\n       | (v1)    | (v1)           |\n       v         |                |\n  [ x * y ]      |                |\n     (v3)        |                |\n       |         v                |\n       |     [ sin(x) ]           |\n       |        (v4)              |\n       v         v                |\n     [ v3   +   v4 ]              |\n            | (v5 = z)            |\n            v                     |\n\nForward Pass: Evaluated in Topological Order (v1, v2 -> v3, v4 -> v5).\n\nBackward Pass (Reverse Adjoints): Evaluated in REVERSE Topological Order:\n1. Seed: bar{v5} = dL/dz = 1.0\n2. bar{v4} = bar{v5} * d(v3+v4)/dv4 = 1.0 * 1.0 = 1.0\n3. bar{v3} = bar{v5} * d(v3+v4)/dv3 = 1.0 * 1.0 = 1.0\n4. bar{y}  = bar{v3} * d(x*y)/dy = bar{v3} * x\n5. bar{x}  = bar{v3} * d(x*y)/dx + bar{v4} * d(sin(x))/dx\n           = bar{v3} * y + bar{v4} * cos(x)  <-- MULTIVARIATE ACCUMULATION (+-)!",
      invariant:
        "Multivariate Chain Rule Invariant: bar{v_j} = sum_{k in children(j)} bar{v_k} * (d v_k / d v_j). Adjoints must accumulate additively (+=) for branched nodes.",
      stateTransitions:
        "Forward Evaluation -> Save Required Intermediate Activations -> Construct Topological Sort -> Seed Loss Adjoint -> Reverse Sweep Adjoint Accumulation.",
      naiveBottleneck:
        "Overwriting adjoints instead of accumulating (bar{x} = ... instead of bar{x} += ...) produces mathematically incorrect gradients for graph nodes with multiple consumers.",
      optimalInsight:
        "Topological sorting guarantees that a node's adjoint bar{v_j} is completely evaluated before it distributes backward to its parents.",
    },
    {
      type: "math_proof",
      title: "Baur-Strassen / Griewank Theorem for Reverse AD Complexity",
      theorem:
        "Let $f: \\mathbb{R}^n \\to \\mathbb{R}$ be computed by an algebraic computation graph $\\mathcal{G}$ using elementary arithmetic operations $(+, -, \\times, /, \\exp, \\ln, \\dots)$ in $T(f)$ operations and $S(f)$ space. Then the full gradient $\\nabla f(x) \\in \\mathbb{R}^n$ can be computed in time $T(\\nabla f)$ bounded by:\n$$T(\\nabla f) \\le 5 \\cdot T(f)$$\nwith auxiliary space $S(\\nabla f) = \\mathcal{O}(T(f))$.",
      proof:
        "1. Let the computation graph $\\mathcal{G}$ consist of vertices $v_1, \\dots, v_N$ where $v_1, \\dots, v_n$ are inputs and $v_N = f(x)$.\n2. The forward evaluation cost is $T(f) = \\sum_{i=n+1}^N \\text{cost}(\\phi_i)$.\n3. In reverse mode, for each elementary operation $v_i = \\phi_i(u, w)$, we evaluate:\n   $$\\bar{u} \\mathrel{+}= \\bar{v}_i \\cdot \\frac{\\partial \\phi_i}{\\partial u}(u, w), \\quad \\bar{w} \\mathrel{+}= \\bar{v}_i \\cdot \\frac{\\partial \\phi_i}{\\partial w}(u, w)$$\n4. We analyze the operation count for each elementary arithmetic primitive:\n   - Addition $v = u + w$: $\\bar{u} \\mathrel{+}= \\bar{v}$, $\\bar{w} \\mathrel{+}= \\bar{v}$ (2 additions $\\le 2 \\times \\text{cost}(+)$).\n   - Multiplication $v = u \\cdot w$: $\\bar{u} \\mathrel{+}= \\bar{v} \\cdot w$, $\\bar{w} \\mathrel{+}= \\bar{v} \\cdot u$ (2 multiplies + 2 additions $\\le 4 \\times \\text{cost}(\\times)$).\n   - Division $v = u / w$: $\\bar{u} \\mathrel{+}= \\bar{v} / w$, $\\bar{w} \\mathrel{+}= -\\bar{v} \\cdot u / w^2$ (2 multiplies + 1 divide + 2 additions $\\le 5 \\times \\text{cost}(/)$).\n   - Transcendental $v = \\exp(u)$: $\\bar{u} \\mathrel{+}= \\bar{v} \\cdot v$ (1 multiply + 1 addition $\\le 2 \\times \\text{cost}(\\exp)$ using cached $v$).\n5. Summing over all $N$ operations in the graph:\n   $$T(\\nabla f) = T(f) + \\sum_{i=n+1}^N \\text{cost}(\\text{backward}(\\phi_i)) \\le T(f) + 4 T(f) = 5 T(f)$$\n6. Hence the entire gradient vector of all $n$ parameters is computed in at most $5\\times$ the forward pass runtime, independent of $n$.",
    },
  ],
};
