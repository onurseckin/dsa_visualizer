import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_gradients_jacobians_hessians_c1_p1",
  pageNumber: 1,
  title: "Gradients, Jacobians, & Hessians: Differential Geometry of ML",
  subtitle: "Multivariate Calculus, Curvature Tensors, and the Pearlmutter HVP Identity",
  estimatedMinutes: 30,
  sections: [
    {
      type: "prose",
      title: "Differential Operators in Multidimensional Optimization",
      content:
        "Modern deep learning optimization is governed by the differential geometry of high-dimensional loss landscapes (Stanford CS229 / CS336). We distinguish three fundamental differential operators:\n\n1. **Gradient (Scalar Field $f: \\mathbb{R}^n \\to \\mathbb{R}$)**:\n   $$\\nabla f(x) = \\left[ \\frac{\\partial f}{\\partial x_1}, \\frac{\\partial f}{\\partial x_2}, \\dots, \\frac{\\partial f}{\\partial x_n} \\right]^T \\in \\mathbb{R}^n$$\n   The gradient defines the direction of steepest local ascent. Its orthogonal hyperplane represents the tangent space to the level set $f(x) = c$.\n\n2. **Jacobian (Vector Field $F: \\mathbb{R}^n \\to \\mathbb{R}^m$)**:\n   $$J_F(x) = \\begin{bmatrix} \\frac{\\partial F_1}{\\partial x_1} & \\dots & \\frac{\\partial F_1}{\\partial x_n} \\\\ \\vdots & \\ddots & \\vdots \\\\ \\frac{\\partial F_m}{\\partial x_1} & \\dots & \\frac{\\partial F_m}{\\partial x_n} \\end{bmatrix} \\in \\mathbb{R}^{m \\times n}$$\n   The Jacobian represents the best linear approximation of $F$ near $x$: $F(x + \\Delta x) \\approx F(x) + J_F(x) \\Delta x$.\n\n3. **Hessian Matrix (Curvature of Scalar Field $f: \\mathbb{R}^n \\to \\mathbb{R}$)**:\n   $$H(x) = \\nabla^2 f(x) = \\begin{bmatrix} \\frac{\\partial^2 f}{\\partial x_1^2} & \\frac{\\partial^2 f}{\\partial x_1 \\partial x_2} & \\dots & \\frac{\\partial^2 f}{\\partial x_1 \\partial x_n} \\\\ \\frac{\\partial^2 f}{\\partial x_2 \\partial x_1} & \\frac{\\partial^2 f}{\\partial x_2^2} & \\dots & \\frac{\\partial^2 f}{\\partial x_2 \\partial x_n} \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ \\frac{\\partial^2 f}{\\partial x_n \\partial x_1} & \\frac{\\partial^2 f}{\\partial x_n \\partial x_2} & \\dots & \\frac{\\partial^2 f}{\\partial x_n^2} \\end{bmatrix} \\in \\mathbb{R}^{n \\times n}$$\n\n**Second-Order Taylor Series**:\n$$f(x + \\Delta x) = f(x) + \\nabla f(x)^T \\Delta x + \\frac{1}{2} \\Delta x^T H(x) \\Delta x + \\mathcal{O}(\\|\\Delta x\\|^3)$$\n- If $H(x) \\succ 0$ (all eigenvalues $\\lambda_i > 0$), $f$ is strictly locally convex and $\\nabla f(x) = 0$ is a strict local minimum.\n- If $H(x)$ has both positive and negative eigenvalues (indefinite), $\\nabla f(x) = 0$ is a **saddle point**.\n- The condition number of the Hessian $\\kappa(H) = \\lambda_{\\max}(H) / \\lambda_{\\min}(H)$ dictates the convergence rate of first-order gradient descent, inducing severe ill-conditioned oscillations across narrow ravines.",
    },
    {
      type: "mental_model",
      title: "Geometric Curvature & Hessian-Vector Products (HVP)",
      visualIntuition:
        "Loss Landscape Surface z = f(x_1, x_2):\n      +\n     / \\   Local Maximum (H is Negative Definite: all lambda < 0)\n    /   \\\n\n  +---+---+ Saddle Point (H has mixed signs: lambda_1 > 0, lambda_2 < 0)\n   \\ / \\ /  --> Gradients vanish (||grad|| = 0), but negative curvature allows escape!\n    V   V\n\n    \\___/   Local Minimum (H is Positive Definite: all lambda > 0)\n\nMatrix-Free Curvature via Pearlmutter Trick:\n  Instead of allocating the full n x n Hessian matrix (Impossible for 70B models!):\n  Evaluate the directional derivative of the gradient along search direction v:\n  H(x) @ v = lim_{eps -> 0} (grad(x + eps * v) - grad(x)) / eps = grad_x ( <grad f(x), v> )\n  --> Exact HVP evaluated in O(n) memory using two backward autograd passes!",
      invariant:
        "Hessian symmetry: H = H^T (by Schwarz's theorem). Exact HVP identity: H(x) v = nabla_x (nabla f(x)^T v).",
      stateTransitions:
        "Forward Pass f(x) -> First Backward grad = nabla f(x) -> Directional Inner Product s = <grad, v> -> Second Backward HVP = nabla_x(s).",
      naiveBottleneck:
        "Instantiating the full Hessian matrix for an n=100,000 layer requires 100,000^2 * 4B = 40GB memory, causing immediate OOM.",
      optimalInsight:
        "Second-order Newton-CG solvers only require the matrix-vector product H @ v, which autograd computes in O(n) space via double-backward without ever storing H.",
    },
    {
      type: "math_proof",
      title: "Pearlmutter's Identity for Hessian-Vector Products (HVP)",
      theorem:
        "Let $f: \\mathbb{R}^n \\to \\mathbb{R}$ be twice continuously differentiable ($C^2$). For any vector $v \\in \\mathbb{R}^n$, the Hessian-vector product $H(x) v$ is identically equal to the gradient with respect to $x$ of the scalar product $\\langle \\nabla f(x), v \\rangle$:\n$$H(x) v = \\nabla_x \\left( \\langle \\nabla f(x), v \\rangle \\right) = \\left. \\frac{\\partial}{\\partial \\epsilon} \\nabla f(x + \\epsilon v) \\right|_{\\epsilon = 0}$$",
      proof:
        "1. Consider the auxiliary scalar function $g(x) = \\langle \\nabla f(x), v \\rangle = \\sum_{j=1}^n \\frac{\\partial f}{\\partial x_j}(x) v_j$.\n2. Take the partial derivative of $g(x)$ with respect to coordinate $x_i$:\n   $$\\frac{\\partial g}{\\partial x_i}(x) = \\frac{\\partial}{\\partial x_i} \\left( \\sum_{j=1}^n \\frac{\\partial f}{\\partial x_j}(x) v_j \\right) = \\sum_{j=1}^n \\frac{\\partial^2 f}{\\partial x_i \\partial x_j}(x) v_j$$\n3. Expressing this in vector notation for all $i \\in \\{1, \\dots, n\\}$:\n   $$\\nabla_x g(x) = \\begin{bmatrix} \\sum_{j=1}^n \\frac{\\partial^2 f}{\\partial x_1 \\partial x_j}(x) v_j \\\\ \\vdots \\\\ \\sum_{j=1}^n \\frac{\\partial^2 f}{\\partial x_n \\partial x_j}(x) v_j \\end{bmatrix} = \\begin{bmatrix} \\frac{\\partial^2 f}{\\partial x_1^2} & \\dots & \\frac{\\partial^2 f}{\\partial x_1 \\partial x_n} \\\\ \\vdots & \\ddots & \\vdots \\\\ \\frac{\\partial^2 f}{\\partial x_n \\partial x_1} & \\dots & \\frac{\\partial^2 f}{\\partial x_n^2} \\end{bmatrix} \\begin{bmatrix} v_1 \\\\ \\vdots \\\\ v_n \\end{bmatrix} = H(x) v$$\n4. Alternatively, by Taylor expanding the gradient around $x$ along direction $v$:\n   $$\\nabla f(x + \\epsilon v) = \\nabla f(x) + \\epsilon H(x) v + \\mathcal{O}(\\epsilon^2)$$\n5. Differentiating with respect to $\\epsilon$ and evaluating at $\\epsilon = 0$:\n   $$\\left. \\frac{\\partial}{\\partial \\epsilon} \\nabla f(x + \\epsilon v) \\right|_{\\epsilon = 0} = H(x) v$$\n6. This proves that an exact Hessian-vector product can be evaluated in standard automatic differentiation by computing the gradient of the scalar graph node $\\langle \\nabla f(x), v \\rangle$ with respect to $x$, with time complexity bounded by $C \\cdot \\text{Cost}(\\text{Forward})$ and $\\mathcal{O}(n)$ auxiliary memory.",
    },
  ],
};
