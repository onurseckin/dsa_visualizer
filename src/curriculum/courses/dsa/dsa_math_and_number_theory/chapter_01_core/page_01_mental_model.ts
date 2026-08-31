import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_math_and_number_theory_c1_p1",
  pageNumber: 1,
  title: "Modular Arithmetic Fields, Euclidean Invariants & Sieve Topologies",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Combinatorial Integer Explosion & Ring Arithmetic",
      content:
        "Standard integers quickly exceed hardware register capacity (64-bit unsigned integers overflow at $2^{64}-1 \\approx 1.84 \\times 10^{19}$). Cryptographic primitives (RSA, Elliptic Curves), combinatorial calculations, and hashing engines project computations onto modular rings $\\mathbb{Z}/m\\mathbb{Z}$ and finite fields $\\mathbb{F}_p$. By leveraging **Bézout's Identity**, the **Extended Euclidean Algorithm**, **Linear Euler Sieves**, and **Miller-Rabin Primality Testing**, number theoretic algorithms achieve sub-millisecond execution over massive 64-bit to 2048-bit domains.",
    },
    {
      type: "prose",
      title: "Taxonomy of Number Theoretic Algorithmic Engines",
      content:
        "Computational number theory is structured into modular rings, sieve generators, and primality witnesses:\n\n1. **Greatest Common Divisor (Euclid & Extended Euclid):**\n   - **Euclid's Invariant:** $\\gcd(a, b) = \\gcd(b, a \\bmod b)$. Halves the product of operands every two steps, terminating in $O(\\log(\\min(a, b)))$ steps (Lamé's Theorem).\n   - **Extended Euclidean Algorithm:** Computes integer coefficients $(x, y)$ satisfying **Bézout's Identity**: $a x + b y = \\gcd(a, b)$.\n   - **Modular Multiplicative Inverse:** If $\\gcd(a, m) = 1$, the inverse $a^{-1} \\pmod m$ exists and satisfies $a \\cdot x \\equiv 1 \\pmod m$. Recovered via Extended Euclid or Fermat's Little Theorem ($a^{-1} \\equiv a^{m-2} \\pmod m$ when $m$ is prime).\n\n2. **Prime Number Generation (Sieves):**\n   - **Sieve of Eratosthenes:** Marks multiples of each prime $p$, running in $O(N \\log \\log N)$ time by Mertens' Theorem.\n   - **Linear Euler Sieve (Euler's Sieve):** Guarantees that every composite number $c$ is marked **exactly once** by its unique minimum prime factor: $c = p \\cdot i$ where $p \\le \\text{minPrime}[i]$. Achieves strictly $O(N)$ linear time and computes multiplicative number-theoretic functions (Euler Totient $\\phi$, Möbius $\\mu$) in the same pass.\n\n3. **Modular Exponentiation & Linear Congruences:**\n   - **Binary Exponentiation:** Computes $a^b \\pmod m$ in $O(\\log b)$ multiplications via repeated squaring.\n   - **Chinese Remainder Theorem (CRT):** Solves systems of congruences $x \\equiv a_i \\pmod{m_i}$ with pairwise coprime moduli in $O(K \\log M)$ time.\n\n4. **Miller-Rabin Probabilistic / Deterministic Primality Test:**\n   - Decomposes $n - 1 = d \\cdot 2^s$ with $d$ odd. For base $a$, if $a^d \\not\\equiv 1 \\pmod n$ and $a^{d \\cdot 2^r} \\not\\equiv -1 \\pmod n$ for all $0 \\le r < s$, $a$ is a composite witness.\n   - Testing a deterministic set of 7 prime bases ($\\{2, 3, 5, 7, 11, 13, 17\\}$) guarantees 100% deterministic correctness for all 64-bit integers ($n < 2^{64}$) in $O(\\log n)$ time.",
    },
    {
      type: "mental_model",
      title: "Linear Euler Sieve & Extended Euclidean Mechanics",
      visualIntuition: `
=== LINEAR EULER SIEVE (O(N) STRICTLY ONCE COMPOSITE MARKING) ===
Target N = 12:

i = 2: 2 is prime -> primes = [2], minPrime[2] = 2.
       Mark 2 * 2 = 4 (minPrime = 2).
       Since 2 % 2 == 0 -> BREAK! (Prevents 2 * 3 = 6 from being marked with wrong factor!)

i = 3: 3 is prime -> primes = [2, 3], minPrime[3] = 3.
       Mark 2 * 3 = 6 (minPrime = 2).
       Mark 3 * 3 = 9 (minPrime = 3).
       Since 3 % 3 == 0 -> BREAK!

i = 4: 4 is composite.
       Mark 2 * 4 = 8 (minPrime = 2).
       Since 4 % 2 == 0 -> BREAK! (Prevents 3 * 4 = 12 from being marked here!)

Every composite c is visited exactly ONCE by its smallest prime factor! Total Time = O(N)!

=== EXTENDED EUCLIDEAN BÉZOUT IDENTITY (ax + by = gcd(a, b)) ===
Let a = 35, b = 15:
  35 = 2 * 15 + 5   ===>  5 = 35 - 2 * 15
  15 = 3 * 5  + 0   ===> gcd = 5

Backtracking:
  5 = 35 * (1) + 15 * (-2)  ===> x = 1, y = -2
      `,
      invariant:
        "Sieve & Congruence Invariants:\n1. Euler Sieve Invariant: Composite $c = p \\cdot i$ is filtered strictly when $p = \\text{minPrime}(c)$, eliminating redundant composite visits.\n2. Bézout Invariant: At every Euclidean recursion step $(a, b)$, $a x + b y = \\gcd(a, b)$ is preserved inductively.",
      stateTransitions:
        "Euler Sieve: For each prime $p \\le \\text{minPrime}[i]$: mark $p \\cdot i$; if $i \\bmod p == 0$ break.\nExtGCD: $(g, x, y) = \\text{extGCD}(b, a \\bmod b) \\implies (g, y, x - \\lfloor a/b \\rfloor \\cdot y)$.",
      naiveBottleneck:
        "Trial division primality test takes $O(\\sqrt{N})$ per query. Sieve of Eratosthenes marks composite numbers multiple times (e.g. 12 is visited by 2 and 3).",
      optimalInsight:
        "The Euler sieve bounds composite filtering to exactly 1 pass per number in $O(N)$ time, while Miller-Rabin verifies 64-bit primality in $O(\\log N)$ clock cycles.",
    },
  ],
};
