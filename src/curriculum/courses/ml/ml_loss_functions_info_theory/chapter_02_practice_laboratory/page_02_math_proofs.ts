import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_loss_functions_info_theory_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Entropy Invariants & InfoNCE Bounds",
  subtitle: "Jensen-Shannon Divergence Bounds and InfoNCE Mutual Information Lower Bounds",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "Jensen-Shannon Divergence Symmetrical Boundedness Theorem",
      theorem:
        "For any two probability distributions $P$ and $Q$, the Jensen-Shannon Divergence $\\text{JSD}(P \\parallel Q) = \\frac{1}{2} D_{\\text{KL}}(P \\parallel M) + \\frac{1}{2} D_{\\text{KL}}(Q \\parallel M)$ (where $M = \\frac{1}{2}(P + Q)$) is symmetric, non-negative, and strictly bounded by $[0, \\ln 2]$ (or $[0, 1]$ when measured in base-2 bits).",
      proof:
        "1. **Symmetry**: By definition, swapping $P$ and $Q$ leaves $M = \\frac{1}{2}(Q + P) = \\frac{1}{2}(P + Q)$ unchanged, so $\\text{JSD}(P \\parallel Q) = \\text{JSD}(Q \\parallel P)$.\n2. **Non-Negativity**: By Gibbs' Inequality, $D_{\\text{KL}}(P \\parallel M) \\ge 0$ and $D_{\\text{KL}}(Q \\parallel M) \\ge 0$, so $\\text{JSD}(P \\parallel Q) \\ge 0$ with equality iff $P = M = Q$.\n3. **Upper Bound**: Expand $\\text{JSD}(P \\parallel Q)$ using the definition of KL divergence:\n   $$\\text{JSD}(P \\parallel Q) = \\frac{1}{2} \\sum_x p(x) \\ln \\frac{p(x)}{\\frac{1}{2}(p(x) + q(x))} + \\frac{1}{2} \\sum_x q(x) \\ln \\frac{q(x)}{\\frac{1}{2}(p(x) + q(x))}$$\n   $$= \\frac{1}{2} \\sum_x p(x) [\\ln 2 + \\ln p(x) - \\ln(p(x) + q(x))] + \\frac{1}{2} \\sum_x q(x) [\\ln 2 + \\ln q(x) - \\ln(p(x) + q(x))]$$\n   $$= \\ln 2 + \\frac{1}{2} \\sum_x p(x) \\ln \\frac{p(x)}{p(x) + q(x)} + \\frac{1}{2} \\sum_x q(x) \\ln \\frac{q(x)}{p(x) + q(x)}$$\n4. Since $p(x) \\le p(x) + q(x)$ and $q(x) \\le p(x) + q(x)$, the fractions $\\frac{p(x)}{p(x) + q(x)} \\le 1$ and $\\frac{q(x)}{p(x) + q(x)} \\le 1$, meaning their natural logarithms are $\\le 0$.\n5. Therefore, the sum is less than or equal to $\\ln 2$:\n   $$\\text{JSD}(P \\parallel Q) \\le \\ln 2$$\n6. The upper bound $\\ln 2$ is attained when $P$ and $Q$ have disjoint supports ($p(x) q(x) = 0$ for all $x$), proving that $\\sqrt{\\text{JSD}(P \\parallel Q)}$ is a true bounded metric.",
    },
    {
      type: "math_proof",
      title: "InfoNCE Loss as a Lower Bound on Mutual Information",
      theorem:
        "Minimizing the InfoNCE contrastive loss $\\mathcal{L}_{\\text{InfoNCE}}$ with $K$ negative samples is mathematically equivalent to maximizing a lower bound on the mutual information $I(X; Y)$ between representations $X$ and $Y$:\n$$I(X; Y) \\ge \\ln(K) - \\mathcal{L}_{\\text{InfoNCE}}$$",
      proof:
        "1. Let $(x, y)$ be drawn from the joint distribution $p(x, y)$, and let $y_1, \\dots, y_K$ be negative samples drawn independently from the marginal distribution $p(y)$.\n2. Consider the optimal density ratio scoring function $f(x, y) = \\frac{p(x, y)}{p(x) p(y)} = \\exp(\\text{sim}(q_x, k_y) / \\tau)$.\n3. The conditional probability that sample $y_1 = y$ is the true positive given a set of $K$ samples $Y = \\{y_1, y_2, \\dots, y_K\\}$ containing 1 positive and $K-1$ negatives is:\n   $$p(\\text{positive} = 1 \\mid X = x, Y) = \\frac{p(x, y_1) \\prod_{j=2}^K p(y_j)}{\\sum_{i=1}^K p(x, y_i) \\prod_{j \\ne i} p(y_j)} = \\frac{\\frac{p(x, y_1)}{p(y_1)}}{\\sum_{i=1}^K \\frac{p(x, y_i)}{p(y_i)}} = \\frac{f(x, y_1)}{\\sum_{i=1}^K f(x, y_i)}$$\n4. The InfoNCE loss is the expected negative log-probability of correctly identifying the positive sample:\n   $$\\mathcal{L}_{\\text{InfoNCE}} = -\\mathbb{E}_{X, Y} \\left[ \\ln \\frac{f(x, y_1)}{\\sum_{i=1}^K f(x, y_i)} \\right] = \\mathbb{E}_{X, Y} \\left[ \\ln \\left( 1 + \\sum_{i=2}^K \\frac{f(x, y_i)}{f(x, y_1)} \\right) \\right]$$\n5. Applying Jensen's inequality to the convex expectation inside:\n   $$\\mathcal{L}_{\\text{InfoNCE}} \\ge \\ln \\left( 1 + \\mathbb{E}_{X, Y} \\left[ \\sum_{i=2}^K \\frac{f(x, y_i)}{f(x, y_1)} \\right] \\right)$$\n6. Since negatives $y_i$ are drawn from marginal $p(y)$, $\\mathbb{E}_{y_i \\sim p(y)}[f(x, y_i)] = \\int \\frac{p(x, y_i)}{p(x) p(y_i)} p(y_i) dy_i = \\int \\frac{p(x, y_i)}{p(x)} dy_i = 1$.\n7. Therefore $\\mathbb{E}_{X, Y} \\left[ \\sum_{i=2}^K \\frac{f(x, y_i)}{f(x, y_1)} \\right] = (K - 1) \\mathbb{E} \\left[ \\frac{1}{f(x, y)} \\right] = (K - 1) \\exp(-I(X; Y))$.\n8. Substituting this yields $\\mathcal{L}_{\\text{InfoNCE}} \\ge \\ln(1 + (K - 1) e^{-I(X; Y)}) \\ge \\ln(K e^{-I(X; Y)}) = \\ln K - I(X; Y)$, establishing $I(X; Y) \\ge \\ln K - \\mathcal{L}_{\\text{InfoNCE}}$.",
    },
  ],
};

export const page2 = page_02_math_proofs;
