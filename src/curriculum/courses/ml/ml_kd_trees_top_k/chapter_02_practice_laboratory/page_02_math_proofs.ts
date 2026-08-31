import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_kd_trees_top_k_c2_p2",
  pageNumber: 3,
  title: "Mathematical Proofs: Bounding Box Pruning Invariant & Branch Complexity",
  sections: [
    {
      type: "math_proof",
      title: "Orthogonal Hyperplane Distance Pruning Invariant",
      theorem:
        "Let a K-D tree node split dimension $d$ at coordinate $x_{\\text{split}}$. For any query point $q$, if $|q_d - x_{\\text{split}}| \\ge r_k$ where $r_k$ is the current distance to the $k$-th nearest neighbor candidate in the search heap, every point $p$ in the opposite half-space satisfies $\\|q - p\\|_2 \\ge r_k$ strictly.",
      proof:
        "1. Euclidean Distance Projection Inequality:\\nFor any two points $p, q \\in \\mathbb{R}^D$ and any coordinate dimension $d \\in \\{1, \\dots, D\\}$:\\n$$\\|q - p\\|_2 = \\sqrt{\\sum_{i=1}^D (q_i - p_i)^2} \\ge \\sqrt{(q_d - p_d)^2} = |q_d - p_d|$$\\n\\n2. Opposite Half-Space Property:\\nWithout loss of generality, let $q_d < x_{\\text{split}}$. The near subtree contains points with $p_d \\le x_{\\text{split}}$, while the far subtree contains points with $p_d \\ge x_{\\text{split}}$.\\nFor any point $p$ in the far subtree:\\n$$p_d - q_d = (p_d - x_{\\text{split}}) + (x_{\\text{split}} - q_d) \\ge 0 + |x_{\\text{split}} - q_d| = |q_d - x_{\\text{split}}|$$\\n\\n3. Combining Inequalities:\\n$$\\|q - p\\|_2 \\ge |q_d - p_d| \\ge |q_d - x_{\\text{split}}| \\ge r_k$$\\n\\n4. Conclusion:\\nNo point $p$ in the far subtree can possibly be strictly closer to $q$ than $r_k$. Pruning the entire opposite branch preserves exact $k$-NN search correctness with zero false negative eliminations.",
    },
    {
      type: "math_proof",
      title: "Worst-Case Exponential Collapse in High Dimensions",
      theorem:
        "For any $D$-dimensional space, there exists an adversarial configuration of $N$ points such that exact nearest neighbor query on a K-D Tree requires visiting $\\Omega(2^D \\log N)$ nodes. When $D > \\log_2 N$, the search complexity is strictly $\\Omega(N)$.",
      proof:
        "1. Consider $N$ points arranged on the surface of a sphere of radius $R$ centered at the origin.\\n2. A query point at the origin $q = \\mathbf{0}$ has equal distance $R$ to all $N$ points.\\n3. At every split plane $x_d = 0$, the orthogonal distance is $|0 - 0| = 0 < R$.\\n4. Because the boundary distance is strictly smaller than the candidate distance $R$, the pruning condition $|q_d - x_{\\text{split}}| \\ge r_k$ is never satisfied at any level of the tree.\\n5. The search algorithm is forced to explore both the left child and right child at every internal node, visiting all $2^{\\log_2 N} = N$ leaves.\\n6. Including internal tree node comparisons, total node visits is $2N - 1 = \\Omega(N)$, proving that spatial bounding trees degrade to full exhaustive scans under adverse high-dimensional geometries.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
