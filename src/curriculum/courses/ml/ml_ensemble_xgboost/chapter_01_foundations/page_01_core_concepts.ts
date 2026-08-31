import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_ensemble_xgboost_c1_p1",
  pageNumber: 1,
  title: "Ensemble Learning & XGBoost: 2nd-Order Gradient Boosting",
  subtitle:
    "Bagging vs Boosting, Random Forest Decorrelation, and 2nd-Order Taylor Objective Formulations",
  estimatedMinutes: 30,
  sections: [
    {
      type: "prose",
      title: "From Additive Modeling to 2nd-Order Gradient Boosted Trees",
      content:
        "Ensemble methods represent the state of the art for tabular and structured machine learning (Stanford CS229 / CS336). We distinguish two core paradigms:\n\n1. **Bagging (Bootstrap Aggregating - Variance Reduction)**:\n   Trains $B$ independent, high-variance base learners $f_b(x)$ on bootstrap resamples. In **Random Forests** (Breiman, 2001), feature subsampling (considering only $m = \\sqrt{D}$ features per split) de-correlates trees, reducing ensemble variance from $\\sigma^2$ toward $\\rho \\sigma^2$.\n\n2. **Boosting (Sequential Bias Reduction)**:\n   Builds an additive model $\\hat{y}_i^{(t)} = \\hat{y}_i^{(t-1)} + \\eta f_t(x_i)$ where each subsequent tree $f_t$ fits the pseudo-residuals of the existing ensemble.\n\n3. **XGBoost 2nd-Order Taylor Expansion Formulation (Chen & Guestrin, 2016)**:\n   Rather than relying only on negative gradients, XGBoost expands an arbitrary differentiable loss function $\\ell(y_i, \\hat{y}_i)$ up to second order around the current prediction $\\hat{y}_i^{(t-1)}$:\n   $$\\mathcal{L}^{(t)} \\approx \\sum_{i=1}^N \\left[ \\ell(y_i, \\hat{y}_i^{(t-1)}) + g_i f_t(x_i) + \\frac{1}{2} h_i f_t(x_i)^2 \\right] + \\Omega(f_t)$$\n   where $g_i = \\left[ \\frac{\\partial \\ell(y_i, \\hat{y})}{\\partial \\hat{y}} \\right]_{\\hat{y} = \\hat{y}^{(t-1)}}$ and $h_i = \\left[ \\frac{\\partial^2 \\ell(y_i, \\hat{y})}{\\partial \\hat{y}^2} \\right]_{\\hat{y} = \\hat{y}^{(t-1)}}$.\n\n4. **Tree Structure Regularization & Optimal Weights**:\n   Defining tree complexity as $\\Omega(f) = \\gamma T + \\frac{1}{2} \\lambda \\sum_{j=1}^T w_j^2$ (where $T$ is leaf count and $w_j$ is leaf weight):\n   - Let $I_j = \\{i \\mid q(x_i) = j\\}$ be the sample indices in leaf $j$.\n   - Let $G_j = \\sum_{i \\in I_j} g_i$ and $H_j = \\sum_{i \\in I_j} h_i$.\n   - **Optimal Leaf Weight**: $w_j^* = -\\frac{G_j}{H_j + \\lambda}$\n   - **Optimal Objective Score**: $\\tilde{\\mathcal{L}}^{(t)}(q) = -\\frac{1}{2} \\sum_{j=1}^T \\frac{G_j^2}{H_j + \\lambda} + \\gamma T$\n   - **Split Gain Formula** (Impurity Reduction):\n     $$\\text{Gain} = \\frac{1}{2} \\left[ \\frac{G_L^2}{H_L + \\lambda} + \\frac{G_R^2}{H_R + \\lambda} - \\frac{(G_L + G_R)^2}{H_L + H_R + \\lambda} \\right] - \\gamma$$",
    },
    {
      type: "mental_model",
      title: "2nd-Order Parabolic Fitting & Random Forest De-correlation",
      visualIntuition:
        "Loss Manifold 2nd-Order Parabolic Fit at Leaf j:\n     Loss ^\n          |      * (True loss curve)\n          |     * \\   / *  (2nd-order Taylor approximation)\n          |      * \\_/ *\n          |         | (Minimum at w_j* = -G_j / (H_j + lambda))\n          +---------+---------> Leaf Weight w_j\n\nRandom Forest Variance Decomposition:\n  Ensemble Variance = rho * sigma^2 + ((1 - rho) / B) * sigma^2\n  - Increasing B (more trees) eliminates the second term ((1-rho)/B -> 0).\n  - Random feature subsampling (sqrt(D)) reduces pairwise tree correlation rho,\n    pushing the irreducible variance floor rho * sigma^2 to near zero!",
      invariant:
        "XGBoost Gain Invariant: Split is only performed if Gain > 0 (built-in pre-pruning parameterized by gamma). Optimal leaf weight w_j* = -G_j / (H_j + lambda).",
      stateTransitions:
        "Current Predictions y_hat -> Compute Gradients g_i & Hessians h_i -> Aggregate Histograms G_j, H_j -> Evaluate Split Gain -> Update Ensemble with w_j*.",
      naiveBottleneck:
        "Re-computing exact gradients and sorting continuous features across all boosting rounds dominates 90% of training time.",
      optimalInsight:
        "Use 8-bit quantized feature histograms and the histogram subtraction trick (H_R = H_parent - H_L), cutting split evaluation costs by 50%.",
    },
    {
      type: "math_proof",
      title: "Analytical Derivation of XGBoost Leaf Weight & Split Gain",
      theorem:
        "Given a fixed tree structure $q: \\mathbb{R}^D \\to \\{1, \\dots, T\\}$, the optimal leaf weights $w^*$ that minimize the 2nd-order Taylor objective $\\mathcal{L}^{(t)}$ and the resulting split gain are:\n$$w_j^* = -\\frac{G_j}{H_j + \\lambda}, \\quad \\text{Gain} = \\frac{1}{2} \\left[ \\frac{G_L^2}{H_L + \\lambda} + \\frac{G_R^2}{H_R + \\lambda} - \\frac{(G_L + G_R)^2}{H_L + H_R + \\lambda} \\right] - \\gamma$$",
      proof:
        "1. Write the 2nd-order objective by grouping sample indices by leaf node $j \\in \\{1, \\dots, T\\}$:\n   $$\\mathcal{L}^{(t)} = \\sum_{j=1}^T \\left[ \\sum_{i \\in I_j} \\left( g_i w_j + \\frac{1}{2} h_i w_j^2 \\right) + \\frac{1}{2} \\lambda w_j^2 \\right] + \\gamma T + \\text{const}$$\n2. Substitute $G_j = \\sum_{i \\in I_j} g_i$ and $H_j = \\sum_{i \\in I_j} h_i$:\n   $$\\mathcal{L}^{(t)} = \\sum_{j=1}^T \\left[ G_j w_j + \\frac{1}{2} (H_j + \\lambda) w_j^2 \\right] + \\gamma T$$\n3. Notice that the objective is decoupled into $T$ independent 1D quadratic functions of $w_j$.\n4. Differentiating with respect to $w_j$ and setting to zero:\n   $$\\frac{\\partial \\mathcal{L}^{(t)}}{\\partial w_j} = G_j + (H_j + \\lambda) w_j = 0 \\implies w_j^* = -\\frac{G_j}{H_j + \\lambda}$$\n5. Substituting $w_j^*$ back into the objective for leaf $j$:\n   $$G_j \\left( -\\frac{G_j}{H_j + \\lambda} \\right) + \\frac{1}{2} (H_j + \\lambda) \\left( -\\frac{G_j}{H_j + \\lambda} \\right)^2 = -\\frac{G_j^2}{H_j + \\lambda} + \\frac{1}{2} \\frac{G_j^2}{H_j + \\lambda} = -\\frac{1}{2} \\frac{G_j^2}{H_j + \\lambda}$$\n6. Summing over all $T$ leaves, the minimum objective value for tree structure $q$ is:\n   $$\\tilde{\\mathcal{L}}^{(t)}(q) = -\\frac{1}{2} \\sum_{j=1}^T \\frac{G_j^2}{H_j + \\lambda} + \\gamma T$$\n7. When considering splitting a leaf into left ($L$) and right ($R$) children, the reduction in objective (Gain) is:\n   $$\\text{Gain} = \\tilde{\\mathcal{L}}_{\\text{parent}} - \\tilde{\\mathcal{L}}_{\\text{children}} = \\left( -\\frac{1}{2} \\frac{(G_L + G_R)^2}{H_L + H_R + \\lambda} + \\gamma \\right) - \\left( -\\frac{1}{2} \\left[ \\frac{G_L^2}{H_L + \\lambda} + \\frac{G_R^2}{H_R + \\lambda} \\right] + 2\\gamma \\right)$$\n   $$= \\frac{1}{2} \\left[ \\frac{G_L^2}{H_L + \\lambda} + \\frac{G_R^2}{H_R + \\lambda} - \\frac{(G_L + G_R)^2}{H_L + H_R + \\lambda} \\right] - \\gamma$$\n8. This rigorously establishes the exact XGBoost split scoring formula.",
    },
  ],
};
