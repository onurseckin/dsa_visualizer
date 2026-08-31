import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_ensemble_xgboost_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Random Forest Variance & Shrinkage Bounds",
  subtitle: "Ensemble Variance Decompositions and Shrinkage Regularization Theorems",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "Random Forest Variance Reduction & De-correlation Theorem",
      theorem:
        "Let $B$ base tree predictors $f_1(x), \\dots, f_B(x)$ each have variance $\\sigma^2 = \\text{Var}(f_b(x))$ and pairwise correlation $\\rho = \\text{Corr}(f_b(x), f_{b'}(x))$ for all $b \\ne b'$. The variance of the averaged ensemble prediction $\\bar{f}(x) = \\frac{1}{B} \\sum_{b=1}^B f_b(x)$ is:\n$$\\text{Var}(\\bar{f}(x)) = \\rho \\sigma^2 + \\frac{1 - \\rho}{B} \\sigma^2$$\nAs $B \\to \\infty$, $\\text{Var}(\\bar{f}(x)) \\to \\rho \\sigma^2$, proving that feature subsampling ($m = \\sqrt{D}$) acts directly to lower the variance bound by decreasing $\\rho$.",
      proof:
        "1. Evaluate the variance of the sample average $\\bar{f}(x) = \\frac{1}{B} \\sum_{b=1}^B f_b(x)$:\n   $$\\text{Var}(\\bar{f}(x)) = \\text{Var}\\left( \\frac{1}{B} \\sum_{b=1}^B f_b(x) \\right) = \\frac{1}{B^2} \\left[ \\sum_{b=1}^B \\text{Var}(f_b(x)) + \\sum_{b=1}^B \\sum_{b' \\ne b} \\text{Cov}(f_b(x), f_{b'}(x)) \\right]$$\n2. By definition of correlation $\\text{Cov}(f_b(x), f_{b'}(x)) = \\rho \\sqrt{\\text{Var}(f_b)} \\sqrt{\\text{Var}(f_{b'})} = \\rho \\sigma^2$.\n3. Substitute the variances into the double sum:\n   $$\\text{Var}(\\bar{f}(x)) = \\frac{1}{B^2} \\left[ B \\sigma^2 + B(B - 1) \\rho \\sigma^2 \\right]$$\n   $$= \\frac{1}{B} \\sigma^2 + \\frac{B - 1}{B} \\rho \\sigma^2 = \\rho \\sigma^2 + \\frac{1}{B} (1 - \\rho) \\sigma^2 = \\rho \\sigma^2 + \\frac{1 - \\rho}{B} \\sigma^2$$\n4. Taking the limit as tree count $B \\to \\infty$:\n   $$\\lim_{B \\to \\infty} \\text{Var}(\\bar{f}(x)) = \\rho \\sigma^2$$\n5. This proves that increasing $B$ eliminates the second term, but cannot reduce variance below $\\rho \\sigma^2$. Random feature subsampling in Random Forests forces trees to split on different predictive subsets, reducing $\\rho$ toward zero and driving total variance down.",
    },
    {
      type: "math_proof",
      title: "Learning Rate Shrinkage as L2 Penalty in Function Space",
      theorem:
        "Scaling subsequent boosting tree predictions by learning rate $\\eta \\in (0, 1)$ (Shrinkage) in $\\hat{y}^{(t)} = \\hat{y}^{(t-1)} + \\eta f_t(x)$ is mathematically equivalent to regularizing the step size under an $L_2$ norm constraint in function space.",
      proof:
        "1. In functional gradient boosting, we seek a base tree function $f_t \\in \\mathcal{F}$ that maximizes descent along the functional gradient $g(x) = -\\left[ \\frac{\\partial \\ell(y, f)}{\\partial f} \\right]_{f = \\hat{y}^{(t-1)}}$.\n2. Consider the constrained functional optimization problem with $L_2$ penalty $\\frac{1}{2\\eta} \\|f\\|_2^2$:\n   $$\\min_{f \\in \\mathcal{F}} \\left\\{ \\sum_{i=1}^N \\ell(y_i, \\hat{y}_i^{(t-1)} + f(x_i)) + \\frac{1}{2\\eta} \\|f\\|_2^2 \\right\\}$$\n3. Expanding $\\ell(y_i, \\hat{y}_i^{(t-1)} + f(x_i)) \\approx \\ell(y_i, \\hat{y}_i^{(t-1)}) + \\nabla \\ell_i \\cdot f(x_i)$:\n   $$\\min_f \\sum_{i=1}^N \\nabla \\ell_i f(x_i) + \\frac{1}{2\\eta} \\sum_{i=1}^N f(x_i)^2$$\n4. Differentiating with respect to $f(x_i)$ and setting to zero yields the stationarity condition:\n   $$\\nabla \\ell_i + \\frac{1}{\\eta} f(x_i) = 0 \\implies f^*(x_i) = -\\eta \\nabla \\ell_i$$\n5. Therefore, scaling the update by $\\eta$ bounds the functional step size, preventing any single greedy tree from over-committing to early residual noise.",
    },
  ],
};

export const page2 = page_02_math_proofs;
