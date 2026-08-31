import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_hypothesis_testing_bootstrap_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Uniform p-Values & FDR Control",
  subtitle: "Probability Integral Transform and Benjamini-Hochberg Optimality Theorems",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "Uniform Distribution of p-Values Under the True Null Hypothesis",
      theorem:
        "Let test statistic $T(X)$ have a continuous cumulative distribution function $F_0(t) = P(T(X) \\le t \\mid H_0)$ under the null hypothesis $H_0$. For a right-tailed test where p-value is defined as $p(X) = 1 - F_0(T(X))$, the random variable $P = p(X)$ is uniformly distributed on the interval $[0, 1]$ ($P \\sim U(0, 1)$).",
      proof:
        "1. For any $u \\in [0, 1]$, evaluate the cumulative distribution function of the p-value random variable $P$:\n   $$P(P \\le u) = P(1 - F_0(T) \\le u) = P(F_0(T) \\ge 1 - u)$$\n2. Since $F_0$ is continuous and strictly monotonically increasing, its generalized inverse $F_0^{-1}$ exists. Therefore:\n   $$P(F_0(T) \\ge 1 - u) = P(T \\ge F_0^{-1}(1 - u))$$\n3. By definition of the null distribution $F_0$, the probability that test statistic $T$ exceeds threshold $t_0$ is $1 - F_0(t_0)$. Setting $t_0 = F_0^{-1}(1 - u)$:\n   $$P(T \\ge F_0^{-1}(1 - u)) = 1 - F_0\\left( F_0^{-1}(1 - u) \\right) = 1 - (1 - u) = u$$\n4. Since $P(P \\le u) = u$ for all $u \\in [0, 1]$, the random variable $P$ is identically distributed as a continuous uniform random variable $U(0, 1)$.\n5. Consequently, rejecting $H_0$ whenever $p \\le \\alpha$ guarantees that the false positive probability is precisely $P(P \\le \\alpha) = \\alpha$, proving exact Type I error calibration.",
    },
    {
      type: "math_proof",
      title: "Benjamini-Hochberg False Discovery Rate (FDR) Control Theorem",
      theorem:
        "Let $M$ hypotheses be tested with independent p-values $p_1, \\dots, p_M$, of which $M_0$ correspond to true null hypotheses. The Benjamini-Hochberg procedure with target rate $q^*$ controls the False Discovery Rate at:\n$$\\text{FDR} = \\mathbb{E}\\left[ \\frac{V}{\\max(R, 1)} \\right] = \\frac{M_0}{M} q^* \\le q^*$$\nwhere $R$ is the total number of rejections and $V$ is the number of false discoveries.",
      proof:
        "1. Let $I_0 \\subseteq \\{1, \\dots, M\\}$ be the index set of the $M_0$ true null hypotheses.\n2. We express the false discovery proportion as $\\text{FDP} = \\sum_{i \\in I_0} \\frac{\\mathbf{1}_{\\{H_i \\text{ rejected}\\}}}{\\max(R, 1)}$.\n3. Taking mathematical expectation:\n   $$\\text{FDR} = \\sum_{i \\in I_0} \\mathbb{E}\\left[ \\frac{\\mathbf{1}_{\\{H_i \\text{ rejected}\\}}}{\\max(R, 1)} \\right]$$\n4. In the BH procedure, $H_i$ is rejected if and only if $p_i \\le \\frac{R}{M} q^*$. Condition on the p-values of all other tests $p_{-i}$:\n   $$\\mathbb{E}\\left[ \\frac{\\mathbf{1}_{\\{p_i \\le \\frac{R}{M} q^*\\}}}{\\max(R, 1)} \\,\\middle|\\, p_{-i} \\right] = \\sum_{k=1}^M \\frac{1}{k} P\\left( p_i \\le \\frac{k}{M} q^* \\text{ and } R(p_i, p_{-i}) = k \\,\\middle|\\, p_{-i} \\right)$$\n5. Notice that if $p_i \\le \\frac{k}{M} q^*$ and $R = k$, the rank of $p_i$ is determined such that changing $p_i$ within $[0, \\frac{k}{M} q^*]$ does not change total rejections $R=k$.\n6. By independence, $p_i \\sim U(0, 1)$, so $P(p_i \\le \\frac{k}{M} q^*) = \\frac{k}{M} q^*$.\n7. Factoring out the probability:\n   $$\\sum_{k=1}^M \\frac{1}{k} \\cdot \\frac{k}{M} q^* \\cdot P(R = k \\mid p_{-i}) = \\frac{q^*}{M} \\sum_{k=1}^M P(R = k \\mid p_{-i}) = \\frac{q^*}{M}$$\n8. Summing over all $M_0$ true null hypotheses in $I_0$:\n   $$\\text{FDR} = \\sum_{i \\in I_0} \\frac{q^*}{M} = \\frac{M_0}{M} q^* \\le q^*$$\n9. This rigorously establishes that the expected proportion of false discoveries is bounded by $q^*$.",
    },
  ],
};
