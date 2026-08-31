import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_advanced_range_queries_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Fenwick Tree Dyadic Partitioning Correctness",
      theorem:
        "For any integer $x \\ge 1$, the prefix interval $[1, x]$ is partitioned into exactly $\\text{popcount}(x)$ disjoint half-open intervals $(x - \\text{lowbit}(x), x]$, where $\\text{lowbit}(x) = x \\ \\& \\ (-x)$. Furthermore, every point update at index $i$ affects at most $\\lfloor \\log_2 N \\rfloor + 1$ dyadic cells.",
      proof: `
**Proof:**
1. Let $x \\in \\mathbb{N}^+$ have binary representation $x = \\sum_{j=1}^m 2^{k_j}$ where $k_1 > k_2 > \\dots > k_m \\ge 0$. Here $m = \\text{popcount}(x)$.
2. The least significant bit (LSB) of $x$ is $2^{k_m}$, which is isolated in two's complement arithmetic by $\\text{lowbit}(x) = x \\ \\& \\ (-x)$.
3. In a Fenwick Tree, index $x$ stores the sum of elements in the range $(x - \\text{lowbit}(x), x] = (x - 2^{k_m}, x]$.
4. Subtracting $\\text{lowbit}(x)$ from $x$ yields $x' = x - 2^{k_m} = \\sum_{j=1}^{m-1} 2^{k_j}$.
5. Repeating this operation produces a sequence of prefixes $x_0 = x, x_1 = x - 2^{k_m}, \\dots, x_m = 0$.
6. Because the intervals $(x_j, x_{j-1}]$ are mutually disjoint and their union spans $(0, x] = [1, x]$, the sum of values at indices $x_0, x_1, \\dots, x_{m-1}$ equals $\\sum_{i=1}^x A[i]$.
7. Since any $x \\le N$ has at most $\\lfloor \\log_2 N \\rfloor + 1$ set bits, a prefix query evaluates in at most $O(\\log N)$ additions.
8. Similarly, updating index $i$ adds delta to all intervals $(k - \\text{lowbit}(k), k]$ containing $i$. The next covering interval is reached by $i \\leftarrow i + \\text{lowbit}(i)$. Since each addition strictly increases the power of the trailing zeros, the index reaches $> N$ in at most $\\le \\log_2 N$ steps. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Sparse Table Idempotence & O(1) RMQ Invariant",
      theorem:
        "For any idempotent operator $\\star$ on a set $S$ ($x \\star x = x$) and any query range $[L, R]$, let $k = \\lfloor \\log_2(R - L + 1) \\rfloor$. Then $\\bigoplus_{i=L}^R A[i] = \\text{ST}[k][L] \\star \\text{ST}[k][R - 2^k + 1]$, computing the exact range reduction in $\\Theta(1)$ operations.",
      proof: `
**Proof:**
1. Let the length of the query range be $\\Delta = R - L + 1 \\ge 1$.
2. Choose $k = \\lfloor \\log_2 \\Delta \\rfloor$. By definition of the floor logarithm, $2^k \\le \\Delta < 2^{k+1}$.
3. Consider two sub-intervals of length $2^k$:
   - $I_1 = [L, L + 2^k - 1]$
   - $I_2 = [R - 2^k + 1, R]$
4. We verify the union of these two intervals:
   - Left endpoint of $I_1$ is $L$.
   - Right endpoint of $I_2$ is $R$.
   - Since $2^k > \\Delta / 2$, the right endpoint of $I_1$ satisfies $L + 2^k - 1 \\ge R - 2^k + 1$ (the left endpoint of $I_2$).
   - Thus, $I_1 \\cup I_2 = [L, R]$ with non-empty overlap $I_1 \\cap I_2 = [R - 2^k + 1, L + 2^k - 1]$.
5. By the associativity and commutativity of $\\star$, $\\text{ST}[k][L] \\star \\text{ST}[k][R - 2^k + 1] = \\left(\\bigstar_{i \\in I_1} A[i]\\right) \\star \\left(\\bigstar_{j \\in I_2} A[j]\\right) = \\left(\\bigstar_{i \\in I_1 \\setminus I_2} A[i]\\right) \\star \\left(\\bigstar_{m \\in I_1 \\cap I_2} (A[m] \\star A[m])\\right) \\star \\left(\\bigstar_{j \\in I_2 \\setminus I_1} A[j]\\right)$.
6. By idempotence, $A[m] \\star A[m] = A[m]$ for all $m \\in I_1 \\cap I_2$.
7. Therefore, the expression simplifies exactly to $\\bigstar_{i=L}^R A[i]$. $\\blacksquare$
      `,
    },
  ],
};
