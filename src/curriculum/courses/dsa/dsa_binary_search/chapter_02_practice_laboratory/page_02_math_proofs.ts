import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_binary_search_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Semi-Open Binary Search Invariant & Termination Theorem",
      theorem:
        "Let $P: \\{0, 1, \\dots, N-1\\} \\to \\{0, 1\\}$ be a monotonic boolean predicate (if $P(i) = 1$, then $P(j) = 1$ for all $j \\ge i$). The semi-open binary search initialized with $L = 0, R = N$ and transition $\\text{mid} = L + \\lfloor(R - L)/2\\rfloor$ terminates in at most $\\lfloor \\log_2 N \\rfloor + 1$ iterations with $L = R$ equal to the exact minimum index $k$ such that $P(k) = 1$ (or $N$ if no such element exists).",
      proof: `
**Proof via Loop Invariants & Strict Interval Contraction:**
1. Define the loop invariant:
   - For all $x < L$, $P(x) = 0$.
   - For all $x \\ge R$, $P(x) = 1$.
2. **Base Case:** At initialization $L = 0, R = N$.
   - The range $x < 0$ is empty, so $P(x) = 0$ holds vacuously.
   - The range $x \\ge N$ contains no valid array indices, so $P(x) = 1$ holds vacuously.
   - The invariant holds prior to the first iteration.
3. **Inductive Step:** Assume the invariant holds at the beginning of an iteration where $L < R$.
   - Compute $\\text{mid} = L + \\lfloor(R - L)/2\\rfloor$.
   - Because $R > L$, $R - L \\ge 1 \\implies \\lfloor(R - L)/2\\rfloor \\ge 0$, so $\\text{mid} \\ge L$.
   - Furthermore, $\\lfloor(R - L)/2\\rfloor \\le \\frac{R - L - 1}{2} < R - L$, so $\\text{mid} < R$.
   - Thus, $L \\le \\text{mid} < R$.
   - **Case 1 ($P(\\text{mid}) = 1$):**
     - We update $R \\leftarrow \\text{mid}$.
     - Because $P(\\text{mid}) = 1$ and $P$ is monotonic, all $x \\ge \\text{mid}$ satisfy $P(x) = 1$.
     - The new upper bound $R = \\text{mid}$ preserves the upper invariant. $L$ is unchanged.
     - The new interval length is $R' - L' = \\text{mid} - L = \\lfloor(R - L)/2\\rfloor \\le \\frac{R - L}{2}$.
   - **Case 2 ($P(\\text{mid}) = 0$):**
     - We update $L \\leftarrow \\text{mid} + 1$.
     - Because $P(\\text{mid}) = 0$ and $P$ is monotonic, all $x \\le \\text{mid}$ satisfy $P(x) = 0$.
     - The new lower bound $L = \\text{mid} + 1$ preserves the lower invariant. $R$ is unchanged.
     - The new interval length is $R' - L' = R - (\\text{mid} + 1) = R - L - 1 - \\lfloor(R - L)/2\\rfloor \\le \\frac{R - L}{2}$.
4. **Termination & Convergence:**
   - In both cases, $R - L$ strictly decreases by at least 1 and is halved at every iteration: $R_{t+1} - L_{t+1} \\le \\lfloor (R_t - L_t)/2 \\rfloor$.
   - The while loop 'while (L < R)' terminates when $L = R$ after at most $\\lfloor \\log_2 N \\rfloor + 1$ steps.
5. **Correctness at Termination:**
   - At termination, $L = R$.
   - By the invariant, for all $x < L$, $P(x) = 0$, and for all $x \\ge L$, $P(x) = 1$.
   - Therefore, $L$ is the exact smallest index where $P(L) = 1$, or $L = N$ if $P(x) = 0$ everywhere. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Golden-Section / Ternary Search Convergence on Unimodal Functions",
      theorem:
        "Let $f: [A, B] \\to \\mathbb{R}$ be a strictly unimodal function with a unique global minimum at $x^*$. Ternary search evaluates points $m_1 = A + \\frac{B - A}{3}$ and $m_2 = B - \\frac{B - A}{3}$. Discarding the sub-interval $[A, m_1]$ if $f(m_1) > f(m_2)$ or $[m_2, B]$ if $f(m_1) \\le f(m_2)$ preserves $x^*$ in the remaining interval of length $\\frac{2}{3}(B - A)$. Golden-Section search achieves the optimal single-evaluation contraction ratio $\\phi = \\frac{\\sqrt{5} - 1}{2} \\approx 0.618033$.",
      proof: `
**Proof via Unimodal Monotonic Intervals:**
1. By definition of strict unimodality, $f(x)$ is strictly decreasing on $[A, x^*]$ and strictly increasing on $[x^*, B]$.
2. Consider two interior evaluation points $A < m_1 < m_2 < B$:
   - **Case 1 ($f(m_1) > f(m_2)$):**
     - Suppose for contradiction that $x^* \\in [A, m_1]$.
     - If $x^* \\le m_1$, then because $f$ is strictly increasing on $[x^*, B]$ and $m_1 < m_2$, we must have $f(m_1) < f(m_2)$, contradicting $f(m_1) > f(m_2)$.
     - Therefore, $x^* \\notin [A, m_1]$, meaning $x^* \\in (m_1, B]$. We safely update $A \\leftarrow m_1$.
   - **Case 2 ($f(m_1) \\le f(m_2)$):**
     - By symmetric reasoning, if $x^* \\ge m_2$, then $f$ is decreasing on $[A, x^*]$, forcing $f(m_1) > f(m_2)$, a contradiction.
     - Therefore, $x^* \\in [A, m_2)$. We safely update $B \\leftarrow m_2$.
3. Under symmetric trisection ($m_1 = A + \\frac{1}{3}(B-A), m_2 = A + \\frac{2}{3}(B-A)$), the remaining interval length is $B' - A' = \\frac{2}{3}(B - A)$.
4. After $k$ iterations, the uncertainty interval shrinks to $(\\frac{2}{3})^k (B - A)$.
5. Under Golden-Section search ($m_1 = B - \\phi(B - A), m_2 = A + \\phi(B - A)$ where $\\phi = \\frac{\\sqrt{5}-1}{2}$), the ratio satisfies $\\phi^2 = 1 - \\phi$. One interior point is reused on the next step, requiring only 1 new function evaluation per golden ratio contraction. $\\blacksquare$
      `,
    },
  ],
};
