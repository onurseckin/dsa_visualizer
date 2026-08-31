import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_math_and_number_theory_c2_p2",
  pageNumber: 2,
  title: "Mathematical Foundations & Rigorous Invariants",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Lamé's Theorem on Euclidean Algorithm Complexity (Lamé 1844)",
      theorem:
        "The number of division steps performed by the Euclidean Algorithm to compute $\\gcd(a, b)$ with $a > b > 0$ is at most $5 \\log_{10} b$. Consequently, the time complexity is strictly $O(\\log(\\min(a, b)))$.",
      proof: `
**Proof via Fibonacci Sequence Minimality:**
1. Let the Euclidean division steps be:
   $$r_0 = a, \\quad r_1 = b$$
   $$r_0 = q_1 r_1 + r_2 \\quad (0 < r_2 < r_1)$$
   $$r_1 = q_2 r_2 + r_3 \\quad (0 < r_3 < r_2)$$
   $$\\dots$$
   $$r_{k-2} = q_{k-1} r_{k-1} + r_k \\quad (0 < r_k < r_{k-1})$$
   $$r_{k-1} = q_k r_k + 0$$
   where $k$ is the total number of division steps.
2. Note that each quotient $q_i \\ge 1$ for all $1 \\le i \\le k-1$, and the final quotient $q_k \\ge 2$ (since $r_k < r_{k-1}$).
3. **Bounding Remainders by Fibonacci Numbers:**
   - $r_k \\ge 1 = F_2$.
   - $r_{k-1} = q_k r_k \\ge 2 \\cdot 1 = 2 = F_3$.
   - $r_{k-2} = q_{k-1} r_{k-1} + r_k \\ge 1 \\cdot F_3 + F_2 = F_4$.
   - By induction: $r_{k-i} \\ge F_{i+2}$ for all $0 \\le i \\le k-1$.
4. Setting $i = k - 1$:
   $$b = r_1 \\ge F_{k+1}$$
5. By Binet's formula, for the golden ratio $\\phi = \\frac{1 + \\sqrt{5}}{2} \\approx 1.618033$:
   $$F_{k+1} > \\frac{\\phi^{k-1}}{\\sqrt{5}} \\implies b > \\frac{\\phi^{k-1}}{\\sqrt{5}} \\implies \\phi^{k-1} < \\sqrt{5} b$$
6. Taking base-10 logarithms:
   $$(k - 1) \\log_{10} \\phi < \\log_{10} \\sqrt{5} + \\log_{10} b$$
   $$k - 1 < \\frac{\\log_{10} b}{\\log_{10} \\phi} + \\frac{\\log_{10} \\sqrt{5}}{\\log_{10} \\phi} \\approx \\frac{\\log_{10} b}{0.20898} + 1.67 \\approx 4.785 \\log_{10} b + 1.67$$
   $$k \\le 5 \\log_{10} b$$
7. This establishes that the Euclidean algorithm terminates in at most 5 times the number of decimal digits in $b$, proving $O(\\log(\\min(a, b)))$ execution. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Sieve of Eratosthenes Complexity Bound via Mertens' Theorem",
      theorem:
        "The Sieve of Eratosthenes generates all prime numbers up to $N$ in strictly $O(N \\log \\log N)$ operations and $O(N)$ space.",
      proof: `
**Proof via Sum of Prime Reciprocals (Mertens 1874):**
1. The Sieve of Eratosthenes iterates over each prime $p \\le N$. For each prime $p$, it marks all multiples of $p$ up to $N$.
2. The number of operations performed for prime $p$ is $\\lfloor N/p \\rfloor$.
3. Summing across all primes $p \\le N$:
   $$T(N) = \\sum_{p \\le N, p \\text{ is prime}} \\left\\lfloor \\frac{N}{p} \\right\\rfloor \\le N \\sum_{p \\le N, p \\text{ is prime}} \\frac{1}{p}$$
4. **Mertens' Second Theorem (1874):** The sum of the reciprocals of all prime numbers up to $N$ satisfies the asymptotic expansion:
   $$\\sum_{p \\le N} \\frac{1}{p} = \\ln(\\ln N) + M + O\\left( \\frac{1}{\\ln N} \\right)$$
   where $M \\approx 0.261497$ is the Meissel-Mertens constant.
5. Substituting Mertens' result into the work summation:
   $$T(N) \\le N \\left( \\ln(\\ln N) + M + O\\left( \\frac{1}{\\ln N} \\right) \\right) = O(N \\log \\log N)$$
6. For $N = 10^9$, $\\log_2(\\log_2(10^9)) \\approx \\log_2(30) \\approx 4.9$, meaning the sieve performs fewer than 5 operations per number on average. $\\blacksquare$
      `,
    },
  ],
};
