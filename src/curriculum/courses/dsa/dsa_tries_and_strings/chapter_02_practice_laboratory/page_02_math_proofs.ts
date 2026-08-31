import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_tries_and_strings_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Z-Algorithm Linear Complexity via Monotonic Boundary Extension",
      theorem:
        "The Z-Algorithm computes $Z[i] = \\max \\{ k \\mid S[i \\dots i+k-1] = S[0 \\dots k-1] \\}$ for all $i \\in [1, N-1]$ in strictly at most $2N$ character comparisons, running in $\\Theta(N)$ worst-case time.",
      proof: `
**Proof via Monotonic Right-Boundary Expansion:**
1. Maintain the current rightmost matching interval $[L, R]$ (the Z-box) where $R = \\max_{j < i} (j + Z[j] - 1)$ and $S[L \\dots R] = S[0 \\dots R - L]$.
2. Initially $L = 0, R = 0$.
3. For index $i$:
   - **Case 1 ($i > R$):** Index $i$ is outside the current Z-box. Directly compare $S[0 \\dots]$ with $S[i \\dots]$ starting from character 0 until a mismatch occurs. If a match of length $k > 0$ is found, update $L = i$ and $R = i + k - 1$.
   - **Case 2 ($i \\le R$):** Index $i$ is inside the current Z-box. Let $k = i - L$. By the Z-box invariant, $S[i \\dots R] = S[k \\dots R - L]$.
     - Subcase 2a: If $Z[k] < R - i + 1$, then by prefix uniqueness $Z[i] = Z[k]$ without any character comparisons ($0$ comparisons).
     - Subcase 2b: If $Z[k] \\ge R - i + 1$, we know $S[i \\dots R]$ matches $S[0 \\dots R - i]$. We start comparing characters starting strictly from $R + 1$ against $S[R - i + 1 \\dots]$, advancing $R$ forward.
4. In both Case 1 and Subcase 2b, every successful character comparison strictly increases $R$ by at least 1.
5. In every mismatch or boundary termination, at most 1 unsuccessful comparison occurs per index $i$.
6. Because $R$ starts at 0 and cannot exceed $N - 1$, the total number of successful comparisons is bounded by $N$.
7. The total number of unsuccessful comparisons across all $N-1$ iterations is bounded by $N - 1$.
8. Thus, total character comparisons $\\le N + (N - 1) < 2N$, proving guaranteed $\\Theta(N)$ runtime. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Polynomial Rolling Hash Collision Bound via Schwartz-Zippel Lemma",
      theorem:
        "Let string $S$ of length $L$ have polynomial rolling hash $H(S) = \\left( \\sum_{i=0}^{L-1} S[i] \\cdot B^{L-1-i} \\right) \\pmod P$ where $P$ is a prime. For any two distinct strings $S_1 \\neq S_2$ of length at most $L$, if base $B$ is chosen uniformly at random from $\\mathbb{Z}_P$, the collision probability is strictly bounded by $\\Pr[H(S_1) = H(S_2)] \\le \\frac{L}{P}$.",
      proof: `
**Proof via Root Counting in Finite Fields:**
1. Let $S_1, S_2$ be two distinct strings of length $L$. Define the difference polynomial $D(x) = H_{S_1}(x) - H_{S_2}(x) = \\sum_{i=0}^{L-1} (S_1[i] - S_2[i]) x^{L-1-i}$.
2. Because $S_1 \\neq S_2$, $D(x)$ is a non-zero polynomial in the finite field $\\mathbb{F}_P$ of degree at most $L - 1$.
3. A hash collision occurs if and only if $H(S_1) \\equiv H(S_2) \\pmod P \\iff D(B) \\equiv 0 \\pmod P$.
4. By the Fundamental Theorem of Algebra / Schwartz-Zippel Lemma over finite fields $\\mathbb{F}_P$, a non-zero polynomial of degree $d \\le L - 1$ has at most $d$ roots in $\\mathbb{F}_P$.
5. If the base $B$ is selected uniformly at random from $\\{0, 1, \\dots, P - 1\\}$, the probability that $B$ is a root of $D(x)$ is:
   $$\\Pr[D(B) = 0] = \\frac{\\text{number of roots}}{P} \\le \\frac{L - 1}{P} < \\frac{L}{P}$$
6. For a string of length $L = 10^5$ and single prime $P \\approx 10^9$, $\\Pr[\\text{collision}] \\le 10^5 / 10^9 = 10^{-4}$.
7. When using **Double Hashing** with two independent primes $P_1, P_2 \\approx 10^9$, the collision probability drops to $\\Pr[\\text{collision}] \\le \\frac{L}{P_1} \\cdot \\frac{L}{P_2} \\approx \\frac{10^{10}}{10^{18}} = 10^{-8}$, guaranteeing cryptographic reliability. $\\blacksquare$
      `,
    },
  ],
};
