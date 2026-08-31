import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_gradients_jacobians_hessians_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Newton Convergence & Mixed Partial Symmetry",
  subtitle: "Schwarz's Theorem and Quadratic Convergence of Exact Second-Order Methods",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "Schwarz's Theorem: Symmetry of the Hessian Matrix",
      theorem:
        "Let $f: U \\subseteq \\mathbb{R}^n \\to \\mathbb{R}$ have continuous second-order partial derivatives on an open set $U$. Then the mixed partial derivatives are symmetric for all $i, j \\in \\{1, \\dots, n\\}$:\n$$\\frac{\\partial^2 f}{\\partial x_i \\partial x_j}(x) = \\frac{\\partial^2 f}{\\partial x_j \\partial x_i}(x)$$\nConsequently, the Hessian matrix is symmetric ($H(x) = H(x)^T$) and admits an orthonormal eigendecomposition with real eigenvalues.",
      proof:
        "1. Fix indices $i, j$ with $i \\ne j$, and choose small increments $h, k > 0$. Consider the second-order finite difference operator:\n   $$W(h, k) = f(x + h e_i + k e_j) - f(x + h e_i) - f(x + k e_j) + f(x)$$\n2. Define the auxiliary single-variable function $u(t) = f(x + t e_i + k e_j) - f(x + t e_i)$. Then $W(h, k) = u(h) - u(0)$.\n3. By the Mean Value Theorem applied to $u(t)$ on $[0, h]$, there exists $\\xi \\in (0, h)$ such that:\n   $$W(h, k) = h u'(\\xi) = h \\left( \\frac{\\partial f}{\\partial x_i}(x + \\xi e_i + k e_j) - \\frac{\\partial f}{\\partial x_i}(x + \\xi e_i) \\right)$$\n4. Define $v(s) = \\frac{\\partial f}{\\partial x_i}(x + \\xi e_i + s e_j)$. Applying the Mean Value Theorem to $v(s)$ on $[0, k]$, there exists $\\eta \\in (0, k)$ such that:\n   $$W(h, k) = h k v'(\\eta) = h k \\frac{\\partial^2 f}{\\partial x_j \\partial x_i}(x + \\xi e_i + \\eta e_j)$$\n5. Symmetrically, defining $w(s) = f(x + h e_i + s e_j) - f(x + s e_j)$ and repeating the derivation produces points $\\tilde{\\xi} \\in (0, h)$ and $\\tilde{\\eta} \\in (0, k)$ such that:\n   $$W(h, k) = h k \\frac{\\partial^2 f}{\\partial x_i \\partial x_j}(x + \\tilde{\\xi} e_i + \\tilde{\\eta} e_j)$$\n6. Equating both expressions and dividing by $h k$:\n   $$\\frac{\\partial^2 f}{\\partial x_j \\partial x_i}(x + \\xi e_i + \\eta e_j) = \\frac{\\partial^2 f}{\\partial x_i \\partial x_j}(x + \\tilde{\\xi} e_i + \\tilde{\\eta} e_j)$$\n7. Taking the limit as $(h, k) \\to (0, 0)$, continuity of second partial derivatives yields $\\frac{\\partial^2 f}{\\partial x_j \\partial x_i}(x) = \\frac{\\partial^2 f}{\\partial x_i \\partial x_j}(x)$, proving $H(x) = H(x)^T$.",
    },
    {
      type: "math_proof",
      title: "Quadratic Convergence Rate of Pure Newton's Method",
      theorem:
        "Let $f: \\mathbb{R}^n \\to \\mathbb{R}$ be $C^2$ with Hessian $H(x)$ that is $\\mu$-strongly convex ($\\|H(x)^{-1}\\|_2 \\le 1/\\mu$) and $L$-Lipschitz continuous (\\|H(x) - H(y)\\|_2 \\le L \\|x - y\\|_2$). The Newton update $x_{k+1} = x_k - H(x_k)^{-1} \\nabla f(x_k)$ converges quadratically to the unique minimizer $x^*$:\n$$\\|x_{k+1} - x^*\\|_2 \\le \\frac{L}{2 \\mu} \\|x_k - x^*\\|_2^2$$",
      proof:
        "1. At the minimizer $x^*$, the gradient vanishes: $\\nabla f(x^*) = 0$.\n2. Using the fundamental theorem of calculus, we write the gradient at $x_k$ as an integral:\n   $$\\nabla f(x_k) = \\nabla f(x_k) - \\nabla f(x^*) = \\int_0^1 H(x^* + t(x_k - x^*)) (x_k - x^*) dt$$\n3. Substitute this into the Newton update formula for the error $e_{k+1} = x_{k+1} - x^*$:\n   $$x_{k+1} - x^* = x_k - x^* - H(x_k)^{-1} \\nabla f(x_k) = H(x_k)^{-1} \\left( H(x_k)(x_k - x^*) - \\nabla f(x_k) \\right)$$\n4. Substituting the integral representation of $\\nabla f(x_k)$:\n   $$x_{k+1} - x^* = H(x_k)^{-1} \\int_0^1 \\left( H(x_k) - H(x^* + t(x_k - x^*)) \\right) (x_k - x^*) dt$$\n5. Taking Euclidean norms and applying Cauchy-Schwarz:\n   $$\\|x_{k+1} - x^*\\| \\le \\|H(x_k)^{-1}\\|_2 \\int_0^1 \\|H(x_k) - H(x^* + t(x_k - x^*))\\|_2 dt \\cdot \\|x_k - x^*\\|$$\n6. Applying Lipschitz continuity $\\|H(x_k) - H(x^* + t(x_k - x^*))\\|_2 \\le L(1 - t) \\|x_k - x^*\\|$ and strong convexity $\\|H(x_k)^{-1}\\|_2 \\le 1/\\mu$:\n   $$\\|x_{k+1} - x^*\\| \\le \\frac{1}{\\mu} \\int_0^1 L(1 - t) dt \\cdot \\|x_k - x^*\\|^2 = \\frac{L}{\\mu} \\left[ t - \\frac{t^2}{2} \\right]_0^1 \\|x_k - x^*\\|^2 = \\frac{L}{2 \\mu} \\|x_k - x^*\\|^2$$\n7. This proves that near the optimum, the error squares at each iteration ($e_{k+1} = \\mathcal{O}(e_k^2)$), doubling the number of accurate decimal digits in every step.",
    },
  ],
};
