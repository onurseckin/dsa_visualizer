import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_dp_2d_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Exact Asymptotic Complexity of Submask Enumeration",
      theorem:
        "Iterating through all submasks $S \\subseteq M$ for all masks $M \\in [0, 2^N - 1]$ using the bitwise loop `for (sub = mask; sub > 0; sub = (sub - 1) & mask)` executes in exactly $\\Theta(3^N)$ operations, strictly outperforming naive $O(4^N)$ mask generation.",
      proof: `
**Proof via Binomial Theorem:**
1. Consider the set of elements $U = \\{0, 1, \\dots, N-1\\}$.
2. For a fixed mask $M \\subseteq U$ with cardinality $|M| = k$ (meaning $M$ has $k$ set bits), the number of submasks $S \\subseteq M$ is exactly $2^k$.
3. The number of masks $M \\subseteq U$ having exactly $k$ set bits is given by the binomial coefficient $\\binom{N}{k}$.
4. Summing the number of submasks across all possible cardinalities $k \\in [0, N]$:
   $$\\text{Total Iterations} = \\sum_{k=0}^N \\binom{N}{k} 2^k$$
5. By the Binomial Theorem, for any real numbers $x$ and $y$:
   $$(x + y)^N = \\sum_{k=0}^N \\binom{N}{k} x^k y^{N-k}$$
6. Setting $x = 2$ and $y = 1$:
   $$\\sum_{k=0}^N \\binom{N}{k} 2^k 1^{N-k} = (2 + 1)^N = 3^N$$
7. For $N = 15$, $4^{15} \\approx 1.07 \\times 10^9$ operations (which causes immediate TLE), whereas $3^{15} = 14,348,907$ operations (executing in under 15 milliseconds).
8. The bitwise idiom 'sub = (sub - 1) & mask' visits each valid submask exactly once without generating invalid intermediate states. Thus, exact complexity is $\\Theta(3^N)$. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Convex Hull Trick (CHT) Envelope Monotonicity Invariant",
      theorem:
        "Let a collection of lines be $L_i(x) = m_i x + c_i$ with strictly decreasing slopes $m_1 > m_2 > \\dots > m_k$. The x-coordinates of adjacent pairwise intersections $x(L_{i-1}, L_i) = \\frac{c_{i-1} - c_i}{m_i - m_{i-1}}$ form a strictly increasing sequence on the lower convex envelope. When inserting line $L_{k+1}$, a line $L_k$ is redundant and must be purged if and only if $x(L_k, L_{k+1}) \\le x(L_{k-1}, L_k)$.",
      proof: `
**Proof:**
1. The lower convex envelope is defined as $E(x) = \\min_{i} \\{ m_i x + c_i \\}$.
2. Because $m_1 > m_2 > \\dots > m_k$, for $x \\to -\\infty$, the line with largest slope $m_1$ is minimized. As $x$ increases towards $+\\infty$, lines with smaller slopes successively take over as the minimum.
3. The intersection point of two lines $L_a$ and $L_b$ is the unique point where $m_a x + c_a = m_b x + c_b \\implies x(L_a, L_b) = \\frac{c_a - c_b}{m_b - m_a}$.
4. For line $L_k$ to appear as part of the lower envelope between $L_{k-1}$ and $L_{k+1}$, there must exist some $x$ where $L_k(x) < L_{k-1}(x)$ and $L_k(x) < L_{k+1}(x)$.
5. This requires the intersection with $L_{k+1}$ to occur strictly to the right of the intersection with $L_{k-1}$:
   $$x(L_{k-1}, L_k) < x(L_k, L_{k+1})$$
6. If $x(L_k, L_{k+1}) \\le x(L_{k-1}, L_k)$, then at any $x$-coordinate, either $L_{k-1}(x)$ or $L_{k+1}(x)$ is strictly less than or equal to $L_k(x)$.
7. Therefore, $L_k$ never contributes to the lower envelope and can be safely purged from the monotonic deque in $O(1)$ amortized time. $\\blacksquare$
      `,
    },
  ],
};
