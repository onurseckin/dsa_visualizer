import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_decision_trees_cart_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Information Gain Bounds & Optimal Leaf Predictions",
  subtitle: "Gini Impurity Maximization and Minimal Variance Leaf Predictions",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "Optimal Constant Prediction in Regression Leaves Under L2 Loss",
      theorem:
        "For a regression tree leaf region $R_m$ containing subset $D_m = \\{(x_i, y_i)\\}_{i=1}^{N_m}$, the optimal constant prediction $c_m^*$ that minimizes the Mean Squared Error $\\mathcal{L}(c) = \\sum_{i \\in D_m} (y_i - c)^2$ is uniquely the empirical sample mean $\\bar{y}_m = \\frac{1}{N_m} \\sum_{i \\in D_m} y_i$.",
      proof:
        "1. Write the leaf objective function $\\mathcal{L}(c) = \\sum_{i=1}^{N_m} (y_i - c)^2$.\n2. Expand the squared terms:\n   $$\\mathcal{L}(c) = \\sum_{i=1}^{N_m} (y_i^2 - 2 c y_i + c^2) = \\sum_{i=1}^{N_m} y_i^2 - 2 c \\sum_{i=1}^{N_m} y_i + N_m c^2$$\n3. Differentiate with respect to $c$ and set to zero:\n   $$\\frac{d\\mathcal{L}}{dc} = -2 \\sum_{i=1}^{N_m} y_i + 2 N_m c = 0$$\n4. Solving for $c$:\n   $$2 N_m c = 2 \\sum_{i=1}^{N_m} y_i \\implies c^* = \\frac{1}{N_m} \\sum_{i=1}^{N_m} y_i = \\bar{y}_m$$\n5. The second derivative is $\\frac{d^2\\mathcal{L}}{dc^2} = 2 N_m > 0$, confirming that $\\bar{y}_m$ is the unique global minimum.\n6. (Corollary: For MAE $L_1$ loss $\\sum |y_i - c|$, subgradient optimality proves the optimal constant prediction is the sample median $\\text{median}(y_{D_m})$).",
    },
    {
      type: "math_proof",
      title: "Cost-Complexity Pruning Nested Sequence Theorem",
      theorem:
        "Let $T_0$ be a fully grown decision tree. As the complexity penalty parameter $\\alpha$ increases continuously from $0$ to $+\\infty$, the sequence of optimal subtrees $T_\\alpha = \\arg\\min_T \\{R(T) + \\alpha |T|\\}$ forms a finite, strictly nested sequence $T_0 \\supset T_1 \\supset T_2 \\supset \\dots \\supset \\{t_{\\text{root}}\\}$.",
      proof:
        "1. For any single node $t$ and subtree $T_t$ rooted at $t$, the cost complexity of the unpruned subtree is $R_\\alpha(T_t) = R(T_t) + \\alpha |T_t|$.\n2. If $T_t$ is collapsed into single leaf $t$, its cost complexity is $R_\\alpha(t) = R(t) + \\alpha \\cdot 1$.\n3. When $\\alpha = 0$, $R(T_t) < R(t)$ strictly (since the unpruned subtree fits training data better than a single leaf).\n4. As $\\alpha$ increases, the linear function $R(T_t) + \\alpha |T_t|$ (slope $|T_t| > 1$) increases faster than $R(t) + \\alpha$ (slope 1).\n5. Equating the two costs identifies the critical threshold $\\alpha_{\\text{eff}}(t)$:\n   $$R(t) + \\alpha_{\\text{eff}}(t) = R(T_t) + \\alpha_{\\text{eff}}(t) |T_t| \\implies \\alpha_{\\text{eff}}(t) = \\frac{R(t) - R(T_t)}{|T_t| - 1}$$\n6. For all $\\alpha < \\alpha_{\\text{eff}}(t)$, the expanded subtree $T_t$ is optimal; for all $\\alpha \\ge \\alpha_{\\text{eff}}(t)$, the collapsed leaf $t$ is strictly preferred.\n7. Pruning the node with the smallest $\\alpha_{\\text{eff}}$ produces subtree $T_1$, and repeating this process yields a strictly nested hierarchy of subtrees.",
    },
  ],
};
