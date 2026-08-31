import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_decision_trees_cart_c1_p1",
  pageNumber: 1,
  title: "Decision Trees & CART: Impurity, Splits, & Cost-Complexity Pruning",
  subtitle:
    "Gini Impurity, Axis-Aligned Spatial Partitions, Information Gain Concavity, and Weakest-Link Pruning",
  estimatedMinutes: 30,
  sections: [
    {
      type: "prose",
      title: "The Geometry of Recursive Axis-Aligned Partitioning",
      content:
        "Classification and Regression Trees (CART - Breiman et al., 1984) recursively partition the continuous input domain $\\mathcal{X} \\subseteq \\mathbb{R}^D$ into a collection of disjoint axis-aligned hyper-rectangles $\\{R_1, R_2, \\dots, R_M\\}$, assigning a constant model prediction $\\hat{y}_m$ to each region (Stanford CS229 / MIT 18.065).\n\nKey algorithmic principles:\n1. **Splitting Objective**:\n   At any node containing dataset $D$, the algorithm searches over all feature dimensions $j \\in \\{1, \\dots, D\\}$ and candidate split thresholds $s$ to maximize the **Information Gain** (Impurity Reduction):\n   $$\\Delta I(j, s) = I(D) - \\left( \\frac{|D_L|}{|D|} I(D_L) + \\frac{|D_R|}{|D|} I(D_R) \\right)$$\n   where $D_L = \\{x \\in D \\mid x_j \\le s\\}$ and $D_R = \\{x \\in D \\mid x_j > s\\}$.\n\n2. **Impurity Functions**:\n   - **Gini Impurity**: $I_G(p) = 1 - \\sum_{k=1}^K p_k^2 = \\sum_{k=1}^K p_k (1 - p_k)$ (probability of misclassifying a randomly chosen element when labeled according to the empirical class distribution).\n   - **Cross-Entropy**: $I_E(p) = -\\sum_{k=1}^K p_k \\ln p_k$.\n   - **Variance Reduction (Regression)**: $I_V(D) = \\frac{1}{|D|} \\sum_{i \\in D} (y_i - \\bar{y})^2$.\n\n3. **Minimal Cost-Complexity Post-Pruning**:\n   Growing trees to purity ($I(D) = 0$) causes severe overfitting. Cost-complexity pruning defines the regularized tree loss:\n   $$R_\\alpha(T) = R(T) + \\alpha |T|$$\n   where $R(T) = \\sum_{m=1}^{|T|} N_m I(R_m)$ is empirical tree error, $|T|$ is the number of terminal leaf nodes, and $\\alpha \\ge 0$ is the complexity penalty parameter. Weakest-link pruning collapses the internal node $t$ that minimizes the effective penalty $\\alpha_{\\text{eff}}(t) = \\frac{R(t) - R(T_t)}{|T_t| - 1}$.",
    },
    {
      type: "mental_model",
      title: "Axis-Aligned Space Tiling & Gini Concavity Curve",
      visualIntuition:
        "Feature Space Partitioning (2D):\n     x_2 ^\n         |  +--------------------+--------------------+\n         |  |                    |      Region 3      |\n         |  |      Region 1      | (Class: Positive)  |\n         |  | (Class: Negative)  +--------------------+\n    s_2 -+--|                    |      Region 2      |\n         |  |                    | (Class: Negative)  |\n         |  +--------------------+--------------------+\n         +-----------------------+--------------------> x_1\n                                s_1\n\nGini Impurity Strict Concavity Curve (Binary Classification p in [0, 1]):\n     I_G(p) ^\n       0.50 |          ***** (Max impurity at p = 0.5)\n            |        /       \\\n            |       /         \\\n            |      /           \\\n       0.00 +-----+-------------+-----> p\n                 0.0           1.0\n  Because I_G(p) is strictly concave (d^2 I_G / dp^2 = -2 < 0), any split that separates class proportions\n  yields a weighted average strictly BELOW the curve, guaranteeing Delta I >= 0!",
      invariant:
        "Information Gain Invariant: Delta I(j, s) >= 0 with equality iff p_L = p_R. Gini impurity bounds: 0 <= I_G(p) <= 1 - 1/K.",
      stateTransitions:
        "Root Dataset -> Sort Candidate Features -> Evaluate Gini Reductions -> Split Node into Left/Right Children -> Recurse until MaxDepth / MinSamples -> Cost-Complexity Pruning.",
      naiveBottleneck:
        "Dynamic allocation of recursive tree node objects causes pointer-chasing and frequent L1/L2 data cache misses during inference.",
      optimalInsight:
        "Flatten binary trees into contiguous 1D memory buffers (feature_idx, threshold, left_child_idx, right_child_idx), enabling cache-line streaming and SIMD evaluation.",
    },
    {
      type: "math_proof",
      title: "Strict Concavity of Gini Impurity & Non-Negativity of Information Gain",
      theorem:
        "1. For discrete probability vector $p = (p_1, \\dots, p_K)$ on the simplex $\\Delta^K$, the Gini Impurity $I_G(p) = 1 - \\sum_{k=1}^K p_k^2$ is strictly concave.\n2. Consequently, by Jensen's inequality, for any dataset partition $D = D_L \\cup D_R$ with $|D| = |D_L| + |D_R|$, the Information Gain is strictly non-negative: $\\Delta I = I_G(p) - \\left( \\frac{|D_L|}{|D|} I_G(p_L) + \\frac{|D_R|}{|D|} I_G(p_R) \\right) \\ge 0$, with equality if and only if $p_L = p_R = p$.",
      proof:
        "1. Evaluate the Hessian matrix of $I_G(p) = 1 - \\sum_{k=1}^K p_k^2$:\n   $$\\frac{\\partial I_G}{\\partial p_i} = -2 p_i, \\quad \\frac{\\partial^2 I_G}{\\partial p_i \\partial p_j} = -2 \\delta_{ij}$$\n   The Hessian is $H = -2 I_K$. For any non-zero displacement vector $v \\in \\mathbb{R}^K$:\n   $$v^T H v = -2 \\|v\\|_2^2 < 0$$\n   Because the Hessian is strictly negative definite, $I_G(p)$ is strictly concave over $\\mathbb{R}^K$.\n2. Let $\\lambda = \\frac{|D_L|}{|D|} \\in (0, 1)$ and $1 - \\lambda = \\frac{|D_R|}{|D|}$.\n3. Note that the aggregate class probability vector $p$ is the exact convex combination of children class distributions:\n   $$p = \\lambda p_L + (1 - \\lambda) p_R$$\n4. By definition of strict concavity (Jensen's inequality for concave functions):\n   $$I_G(p) = I_G(\\lambda p_L + (1 - \\lambda) p_R) \\ge \\lambda I_G(p_L) + (1 - \\lambda) I_G(p_R)$$\n5. Subtracting the right-hand side yields:\n   $$\\Delta I_G = I_G(p) - \\left[ \\lambda I_G(p_L) + (1 - \\lambda) I_G(p_R) \\right] \\ge 0$$\n6. Strict concavity implies that equality holds if and only if $p_L = p_R = p$, proving that a split can never increase impurity.",
    },
  ],
};
