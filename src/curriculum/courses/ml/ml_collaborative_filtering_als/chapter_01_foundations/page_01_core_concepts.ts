import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_collaborative_filtering_als_c1_p1",
  pageNumber: 1,
  title: "Collaborative Filtering: Implicit ALS & Matrix Factorization",
  subtitle:
    "Low-Rank Latent Spaces, Implicit Feedback Confidence, and Fast Gram Matrix Factorization",
  estimatedMinutes: 30,
  sections: [
    {
      type: "prose",
      title: "The Mathematics of Latent Factor Models & Implicit Recommenders",
      content:
        "Collaborative Filtering decomposes a massive, highly sparse user-item interaction matrix $R \\in \\mathbb{R}^{M \\times N}$ into low-rank user latent factors $U \\in \\mathbb{R}^{M \\times F}$ and item latent factors $V \\in \\mathbb{R}^{N \\times F}$ with rank $F \\ll \\min(M, N)$ (Stanford CS229 / CS336).\n\n1. **Implicit Feedback Formulation (Hu, Koren, Volinsky, 2008)**:\n   Unlike explicit 1-5 star ratings, real-world systems observe implicit interactions (clicks, watch time, purchases):\n   - **Binary Preference**: $p_{ui} = 1$ if $r_{ui} > 0$, and $p_{ui} = 0$ if $r_{ui} = 0$.\n   - **Confidence Score**: $c_{ui} = 1 + \\alpha r_{ui}$ where $\\alpha > 0$ scales interaction intensity.\n   - **Implicit Regularized Weighted Loss**:\n     $$\\mathcal{L}(U, V) = \\sum_{u=1}^M \\sum_{i=1}^N c_{ui} (p_{ui} - u_u^T v_i)^2 + \\lambda \\left( \\sum_{u=1}^M \\|u_u\\|_2^2 + \\sum_{i=1}^N \\|v_i\\|_2^2 \\right)$$\n\n2. **Alternating Least Squares (ALS) Decomposition**:\n   While optimizing $U$ and $V$ jointly is non-convex, fixing $V$ transforms $\\mathcal{L}$ into $M$ independent, strictly convex quadratic subproblems for each user $u_u \\in \\mathbb{R}^F$:\n   $$u_u = \\left( V^T C^u V + \\lambda I_F \\right)^{-1} V^T C^u p_u$$\n   where $C^u = \\text{diag}(c_{u1}, \\dots, c_{uN}) \\in \\mathbb{R}^{N \\times N}$ and $p_u = (p_{u1}, \\dots, p_{uN})^T \\in \\mathbb{R}^N$.\n\n3. **Fast Gram Matrix Acceleration**:\n   Computing $V^T C^u V$ directly costs $O(N F^2)$ per user, which is intractable for $N = 10^7$ items. Decomposing $C^u = I_N + (C^u - I_N)$:\n   $$V^T C^u V = V^T V + V^T (C^u - I_N) V = V^T V + \\sum_{i \\in \\mathcal{R}_u} (c_{ui} - 1) v_i v_i^T$$\n   Precomputing the global Gram matrix $V^T V = \\sum_{i=1}^N v_i v_i^T \\in \\mathbb{R}^{F \\times F}$ once in $O(N F^2)$ reduces each user update to iterating only over non-zero interactions $\\mathcal{R}_u = \\{i \\mid r_{ui} > 0\\}$, slashing per-user complexity to $O(|\\mathcal{R}_u| F^2 + F^3)$.",
    },
    {
      type: "mental_model",
      title: "Low-Rank Latent Space Projection & Fast Gram Sparsification",
      visualIntuition:
        "Matrix Factorization Geometry: R (M x N) approx U (M x F) @ V^T (F x N)\n     Users M [ . . . . . . . . . . ]     Users M [ . . . ]  Item Factors V^T (F x N)\n             [ . . . . . . . . . . ]  =          [ . . . ]  [ . . . . . . . . . . ]\n             [ . . . . . . . . . . ]             [ . . . ]  [ . . . . . . . . . . ]\n                     Items N                       F=64             Items N\n\nFast Gram Acceleration Principle:\n  V^T C^u V  =  [ Precomputed Dense Gram Matrix: V^T V (64 x 64) ]\n              + [ Sparse Rank-1 Updates: sum_{i in R_u} (c_ui - 1) v_i v_i^T ]\n  --> Flips complexity from iterating over 10,000,000 all items to only ~50 interacted items!",
      invariant:
        "ALS Positive Definiteness Invariant: V^T C^u V + lambda I_F is strictly positive definite (PSD) for any lambda > 0, ensuring non-singular Cholesky solvability.",
      stateTransitions:
        "Initialize Random Factors V -> Precompute Gram Matrix V^T V -> Solve All Users U_u in Parallel -> Precompute Gram Matrix U^T U -> Solve All Items V_i in Parallel -> Repeat.",
      naiveBottleneck:
        "Evaluating dense N x N confidence diagonal matrices for each user costs O(M * N * F^2), requiring 10^15 FLOPs for 10M users and 1M items.",
      optimalInsight:
        "Precompute V^T V in O(N F^2) and update user factors via sparse rank-1 accumulation over non-zero ratings |R_u|, dropping total ALS runtime by 10,000x.",
    },
    {
      type: "math_proof",
      title: "Derivation of the Implicit ALS User Closed-Form Update",
      theorem:
        "Given fixed item factor matrix $V \\in \\mathbb{R}^{N \\times F}$, the unique global minimizer $u_u^*$ of the implicit regularized user objective $\\mathcal{L}(u_u) = \\sum_{i=1}^N c_{ui} (p_{ui} - u_u^T v_i)^2 + \\lambda \\|u_u\\|_2^2$ is:\n$$u_u^* = \\left( V^T C^u V + \\lambda I_F \\right)^{-1} V^T C^u p_u = \\left( V^T V + \\sum_{i \\in \\mathcal{R}_u} (c_{ui} - 1) v_i v_i^T + \\lambda I_F \\right)^{-1} \\left( \\sum_{i \\in \\mathcal{R}_u} c_{ui} v_i \\right)$$",
      proof:
        "1. Write the scalar loss for user $u$ in matrix notation:\n   $$\\mathcal{L}(u_u) = (p_u - V u_u)^T C^u (p_u - V u_u) + \\lambda u_u^T u_u$$\n2. Expand the quadratic matrix expression:\n   $$\\mathcal{L}(u_u) = p_u^T C^u p_u - 2 u_u^T V^T C^u p_u + u_u^T (V^T C^u V + \\lambda I_F) u_u$$\n3. Differentiate with respect to vector $u_u$:\n   $$\\nabla_{u_u} \\mathcal{L} = -2 V^T C^u p_u + 2 (V^T C^u V + \\lambda I_F) u_u$$\n4. Setting the gradient to zero yields the normal equations:\n   $$(V^T C^u V + \\lambda I_F) u_u = V^T C^u p_u \\implies u_u^* = (V^T C^u V + \\lambda I_F)^{-1} V^T C^u p_u$$\n5. Split $C^u = I_N + (C^u - I_N)$:\n   $$V^T C^u V = V^T I_N V + V^T (C^u - I_N) V = V^T V + \\sum_{i=1}^N (c_{ui} - 1) v_i v_i^T$$\n   Since $c_{ui} = 1$ whenever $r_{ui} = 0$, the term $(c_{ui} - 1) = 0$ for all unobserved items $i \\notin \\mathcal{R}_u$. Thus:\n   $$V^T C^u V = V^T V + \\sum_{i \\in \\mathcal{R}_u} (c_{ui} - 1) v_i v_i^T$$\n6. Similarly, since $p_{ui} = 0$ for all $i \\notin \\mathcal{R}_u$ and $p_{ui} = 1$ for $i \\in \\mathcal{R}_u$:\n   $$V^T C^u p_u = \\sum_{i=1}^N c_{ui} p_{ui} v_i = \\sum_{i \\in \\mathcal{R}_u} c_{ui} v_i$$\n7. This proves that both the linear system matrix and right-hand vector depend strictly on the sparse set of observed interactions $\\mathcal{R}_u$.",
    },
  ],
};
