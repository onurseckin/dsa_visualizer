import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_collaborative_filtering_als_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: ALS Subproblem Convexity & Eckart-Young SVD Equivalence",
  subtitle: "Hessian Positive Definiteness and Low-Rank Matrix Approximation Theorems",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "Strict Convexity of the ALS User/Item Subproblems",
      theorem:
        "For any fixed item matrix $V \\in \\mathbb{R}^{N \\times F}$ and confidence weights $c_{ui} \\ge 1$, the user subproblem Hessian $H = 2(V^T C^u V + \\lambda I_F)$ is strictly positive definite for any $\\lambda > 0$, guaranteeing a unique global analytical minimizer.",
      proof:
        "1. The quadratic user objective is $\\mathcal{L}(u_u) = (p_u - V u_u)^T C^u (p_u - V u_u) + \\lambda \\|u_u\\|_2^2$.\n2. Compute the second derivative (Hessian matrix) with respect to $u_u$:\n   $$H = \\nabla^2_{u_u} \\mathcal{L} = 2 \\left( V^T C^u V + \\lambda I_F \\right)$$\n3. Let $z \\in \\mathbb{R}^F$ be an arbitrary non-zero vector ($z \\ne 0$). Evaluate the quadratic form $z^T H z$:\n   $$z^T H z = 2 z^T (V^T C^u V) z + 2 \\lambda z^T I_F z = 2 (V z)^T C^u (V z) + 2 \\lambda \\|z\\|_2^2$$\n4. Since $C^u = \\text{diag}(c_{u1}, \\dots, c_{uN})$ with $c_{ui} = 1 + \\alpha r_{ui} \\ge 1 > 0$, $C^u$ is strictly positive definite.\n   Therefore, $(V z)^T C^u (V z) = \\sum_{i=1}^N c_{ui} (v_i^T z)^2 \\ge 0$.\n5. Furthermore, since $\\lambda > 0$ and $z \\ne 0$, the regularization term satisfies $2 \\lambda \\|z\\|_2^2 > 0$ strictly.\n6. Combining both terms:\n   $$z^T H z \\ge 2 \\lambda \\|z\\|_2^2 > 0$$\n7. This proves that the Hessian $H$ is strictly positive definite everywhere, guaranteeing that the ALS normal equation $(V^T C^u V + \\lambda I_F) u_u = V^T C^u p_u$ is non-singular and has a unique global minimum.",
    },
    {
      type: "math_proof",
      title: "Equivalence of Unweighted Matrix Factorization to SVD Rank-F Approximation",
      theorem:
        "Under fully observed ratings ($c_{ui} = 1$ for all entries) and unregularized loss $\\lambda = 0$, the optimal low-rank matrix factorization $\\min_{U, V} \\|R - U V^T\\|_F^2$ is mathematically identical to the truncated Singular Value Decomposition (SVD) $R_F = U_F \\Sigma_F V_F^T$, which uniquely attains the Eckart-Young-Mirsky minimum error.",
      proof:
        "1. Write the unweighted matrix loss in Frobenius norm notation: $\\min_{U, V} \\|R - U V^T\\|_F^2$, where $U \\in \\mathbb{R}^{M \\times F}$ and $V \\in \\mathbb{R}^{N \\times F}$.\n2. Note that any product $A = U V^T$ has matrix rank at most $F$: $\\text{rank}(A) \\le F$.\n3. Therefore, the optimization problem is equivalent to finding the best rank-$F$ matrix approximation in Frobenius norm:\n   $$\\min_{A \\in \\mathbb{R}^{M \\times N}, \\text{rank}(A) \\le F} \\|R - A\\|_F^2$$\n4. By the Eckart-Young-Mirsky Theorem, the unique global minimizer of this problem is the truncated SVD:\n   $$A^* = \\sum_{j=1}^F \\sigma_j u_j v_j^T = U_F \\Sigma_F V_F^T$$\n   where $\\sigma_1 \\ge \\sigma_2 \\dots \\ge \\sigma_F$ are the top $F$ singular values of $R$.\n5. Factoring $A^*$ as $U^* = U_F \\Sigma_F^{1/2}$ and $V^* = V_F \\Sigma_F^{1/2}$ yields the exact user and item factor matrices, attaining minimal approximation error $\\sum_{j=F+1}^{\\min(M, N)} \\sigma_j^2$.",
    },
  ],
};
