import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_svm_kernel_smo_c1_p1",
  pageNumber: 1,
  title: "Support Vector Machines: Maximum Margin, Kernels, & Platt's SMO",
  subtitle:
    "Primal-Dual Formulations, KKT Complementarity, Mercer Kernels, and 2-Variable Coordinate Updates",
  estimatedMinutes: 30,
  sections: [
    {
      type: "prose",
      title: "The Geometry of Maximum Margin Classifiers & Reproducing Kernel Hilbert Spaces",
      content:
        "Support Vector Machines (SVMs - Vapnik, 1995) construct an optimal separating hyperplane $w^T phi(x) + b = 0$ in a Reproducing Kernel Hilbert Space (RKHS) that maximizes the geometric margin $\\frac{2}{\\|w\\|_2}$ between binary classes $y_i \\in \\{-1, +1\\}$ (Stanford CS229 / MIT 18.065).\n\n1. **Primal Soft-Margin Optimization Problem**:\n   $$\\min_{w, b, \\xi} \\frac{1}{2} \\|w\\|_2^2 + C \\sum_{i=1}^N \\xi_i \\quad \\text{subject to} \\quad y_i(w^T \\phi(x_i) + b) \\ge 1 - \\xi_i, \\quad \\xi_i \\ge 0$$\n   where $\\xi_i$ are slack variables and $C > 0$ controls the trade-off between margin width and classification violations.\n\n2. **Lagrangian Dual Problem (Wolfe Dual)**:\n   Introducing Lagrange multipliers $\\alpha_i \\ge 0$:\n   $$\\max_{\\alpha} \\sum_{i=1}^N \\alpha_i - \\frac{1}{2} \\sum_{i=1}^N \\sum_{j=1}^N \\alpha_i \\alpha_j y_i y_j K(x_i, x_j) \\quad \\text{s.t.} \\quad 0 \\le \\alpha_i \\le C, \\quad \\sum_{i=1}^N \\alpha_i y_i = 0$$\n   The decision boundary depends only on inner products $K(x_i, x_j) = \\langle \\phi(x_i), \\phi(x_j) \\rangle$.\n\n3. **Karush-Kuhn-Tucker (KKT) Complementarity Conditions**:\n   - **$\\alpha_i = 0$**: Non-support vector ($y_i f(x_i) > 1$), strictly outside the margin, zero influence on decision boundary.\n   - **$0 < \\alpha_i < C$**: Free Support Vector ($y_i f(x_i) = 1$), lying exactly on the margin boundary.\n   - **$\\alpha_i = C$**: Bounded Support Vector ($y_i f(x_i) < 1$), lying inside the margin or misclassified ($\\xi_i > 0$).\n\n4. **Mercer's Theorem & Kernel Families**:\n   A symmetric kernel function $K(x, z)$ computes inner products in an implicit feature space $\\mathcal{H}$ if and only if the Gram matrix $K_{ij} = K(x_i, x_j)$ is positive semi-definite for all finite sample subsets:\n   - **Gaussian Radial Basis Function (RBF)**: $K(x, z) = \\exp(-\\gamma \\|x - z\\|_2^2)$ (maps to infinite-dimensional Hilbert space).\n   - **Polynomial Kernel**: $K(x, z) = (x^T z + c)^d$.\n\n5. **Platt's Sequential Minimal Optimization (SMO)**:\n   Because the linear constraint $\\sum \\alpha_i y_i = 0$ requires changing at least two multipliers simultaneously, SMO solves the QP analytically by updating two coordinates $(\\alpha_1, \\alpha_2)$ at a time in closed form without matrix inversion.",
    },
    {
      type: "mental_model",
      title: "Maximum Margin Street & 2-Variable Constraint Box",
      visualIntuition:
        "Maximum Geometric Margin in Feature Space:\n        +1  *   *   *           [ Upper Margin: w^T phi(x) + b = +1 ]\n            *   * (alpha_i > 0) <-- Support Vectors dictate hyperplane!\n    -------------------------- [ Decision Boundary: w^T phi(x) + b = 0 ]\n            o   o (alpha_j > 0) <-- Support Vectors\n        -1  o   o   o           [ Lower Margin: w^T phi(x) + b = -1 ]\n        <------ 2 / ||w|| ------> (Geometric Margin Width)\n\nSMO 2-Variable Coordinate Optimization Box [0, C] x [0, C]:\n     alpha_2 ^\n           C +-------------------+\n             |      \\ (Line: alpha_1 y_1 + alpha_2 y_2 = zeta)\n             |       \\  H (High Clip)\n             |        \\ \n             |         \\ L (Low Clip)\n           0 +----------+--------+-----> alpha_1\n             0                   C\n  SMO steps along the 1D line segment [L, H], computing the unclipped parabolic minimum\n  and clipping into the [0, C] bounding box analytically!",
      invariant:
        "KKT Dual Invariant: 0 <= alpha_i <= C and sum(alpha_i * y_i) = 0. Optimal weights w = sum_{i in SV} alpha_i y_i phi(x_i).",
      stateTransitions:
        "Select alpha_1 violating KKT -> Choose alpha_2 maximizing |E_1 - E_2| -> Compute Unclipped Update -> Clip to [L, H] -> Update Error Cache & Threshold b.",
      naiveBottleneck:
        "Instantiating the full N x N Kernel matrix requires 20 GB of RAM for N=50,000, triggering out-of-memory crashes.",
      optimalInsight:
        "Use an LRU kernel row cache that stores only active support vector rows and evaluates cold kernel products on-the-fly.",
    },
    {
      type: "math_proof",
      title: "Analytical Derivation of the SMO 2-Variable Update & Clipping Bounds",
      theorem:
        "In Platt's SMO, when updating two multipliers $(\\alpha_1, \\alpha_2)$ with all other $\\alpha_i$ fixed, the unclipped 1D quadratic minimum is:\n$$\\alpha_2^{\\text{new, unclipped}} = \\alpha_2^{\\text{old}} + \\frac{y_2 (E_1 - E_2)}{\\eta}$$\nwhere $\\eta = 2 K(x_1, x_2) - K(x_1, x_1) - K(x_2, x_2) \\le 0$ and $E_i = f(x_i) - y_i$. The new multiplier is clipped to interval $[L, H]$ where:\n$$\\text{If } y_1 \\ne y_2: L = \\max(0, \\alpha_2 - \\alpha_1), \\quad H = \\min(C, C + \\alpha_2 - \\alpha_1)$$\n$$\\text{If } y_1 = y_2: L = \\max(0, \\alpha_2 + \\alpha_1 - C), \\quad H = \\min(C, \\alpha_2 + \\alpha_1)$$",
      proof:
        "1. From the linear equality constraint $\\alpha_1 y_1 + \\alpha_2 y_2 = -\\sum_{i=3}^N \\alpha_i y_i = \\zeta$.\n2. Multiply by $y_1$ (since $y_1^2 = 1$): $\\alpha_1 = (\\zeta - \\alpha_2 y_2) y_1 = \\gamma - s \\alpha_2$, where $s = y_1 y_2$ and $\\gamma = \\zeta y_1$.\n3. Substitute $\\alpha_1 = \\gamma - s \\alpha_2$ into the dual objective $W(\\alpha)$ to obtain a 1D function of $\\alpha_2$:\n   $$W(\\alpha_2) = (\\gamma - s \\alpha_2) + \\alpha_2 - \\frac{1}{2} K_{11}(\\gamma - s \\alpha_2)^2 - \\frac{1}{2} K_{22} \\alpha_2^2 - s K_{12}(\\gamma - s \\alpha_2)\\alpha_2 - y_1(\\gamma - s \\alpha_2) v_1 - y_2 \\alpha_2 v_2 + \\text{const}$$\n   where $v_i = \\sum_{j=3}^N \\alpha_j y_j K(x_i, x_j) = f(x_i) - b - \\alpha_1 y_1 K_{i1} - \\alpha_2 y_2 K_{i2}$.\n4. Differentiating with respect to $\\alpha_2$:\n   $$\\frac{dW}{d\\alpha_2} = -s + 1 + s K_{11}(\\gamma - s \\alpha_2) - K_{22} \\alpha_2 + s^2 K_{12} \\alpha_2 - s K_{12}(\\gamma - s \\alpha_2) + s y_1 v_1 - y_2 v_2 = 0$$\n5. Grouping terms of $\\alpha_2$ and defining $\\eta = 2 K_{12} - K_{11} - K_{22}$:\n   $$\\alpha_2 (2 K_{12} - K_{11} - K_{22}) = y_2 \\left[ (f(x_1) - y_1) - (f(x_2) - y_2) \\right] + \\alpha_2^{\\text{old}} \\eta$$\n   $$\\alpha_2^{\\text{new}} \\eta = \\alpha_2^{\\text{old}} \\eta + y_2 (E_1 - E_2) \\implies \\alpha_2^{\\text{new, unclipped}} = \\alpha_2^{\\text{old}} + \\frac{y_2 (E_1 - E_2)}{\\eta}$$\n6. Because $0 \\le \\alpha_1, \\alpha_2 \\le C$ and $\\alpha_1 = \\gamma - s \\alpha_2$, the feasible values of $\\alpha_2$ lie along a line segment in $[0, C] \\times [0, C]$.\n7. If $y_1 \\ne y_2$, $\\alpha_1 - \\alpha_2 = k$, so $L = \\max(0, \\alpha_2 - \\alpha_1)$ and $H = \\min(C, C + \\alpha_2 - \\alpha_1)$.\n8. If $y_1 = y_2$, $\\alpha_1 + \\alpha_2 = k$, so $L = \\max(0, \\alpha_1 + \\alpha_2 - C)$ and $H = \\min(C, \\alpha_1 + \\alpha_2)$.\n9. Clipping $\\alpha_2^{\\text{new}} = \\min(H, \\max(L, \\alpha_2^{\\text{new, unclipped}}))$ guarantees feasibility and completes the step.",
    },
  ],
};
