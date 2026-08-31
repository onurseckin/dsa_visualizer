import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_math_and_number_theory_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_math_and_number_theory",
      title: "Math & Number Theory Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Count Primes (Linear Euler Sieve)",
          problemId: "count-primes-euler",
          difficulty: "Medium",
          description:
            "Given an integer $n$, return the number of prime numbers that are strictly less than $n$ in guaranteed strictly $O(N)$ linear time using the Euler Sieve.",
          rationale:
            "Tests single-visit composite number elimination via minimal prime factor breaking.",
        },
        {
          title: "Pow(x, n) via Binary Exponentiation",
          problemId: "powx-n-binary-exp",
          difficulty: "Medium",
          description:
            "Implement `pow(x, n)`, which calculates $x$ raised to the power $n$ ($x^n$) in $O(\\log N)$ time, handling negative exponents and 32-bit integer boundaries.",
          rationale: "Evaluates binary repeated squaring and integer sign parity handling.",
        },
        {
          title: "Modular Multiplicative Inverse (Extended GCD)",
          problemId: "modular-multiplicative-inverse",
          difficulty: "Hard",
          description:
            "Given two integers $a$ and $m$, find the modular multiplicative inverse $x$ such that $(a \\cdot x) \\equiv 1 \\pmod m$ in $O(\\log m)$ time using the Extended Euclidean Algorithm.",
          rationale: "Tests Bézout identity coefficient backtracking and coprimality verification.",
        },
        {
          title: "Deterministic Miller-Rabin Primality Test",
          problemId: "miller-rabin-primality-64",
          difficulty: "Hard",
          description:
            "Given a 64-bit integer $N$, determine if it is prime in $O(\\log N)$ time using the deterministic Miller-Rabin test across 12 prime bases.",
          rationale: "Tests strong pseudoprime witness testing and 64-bit modular squaring.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Bézout's Identity Existence Invariant",
          statement:
            "Prove that for any integers $a$ and $b$ (not both zero), the set of linear combinations $S = \\{ a x + b y \\mid x, y \\in \\mathbb{Z}, a x + b y > 0 \\}$ has a smallest element $d = \\min(S)$, and that $d = \\gcd(a, b)$.",
          proofOutline:
            "By the Well-Ordering Principle, $S$ has a smallest positive element $d = a x_0 + b y_0$. By division algorithm, $a = q d + r$ with $0 \\le r < d$. Then $r = a - q(a x_0 + b y_0) = a(1 - q x_0) + b(-q y_0) \\in S \\cup \\{0\\}$. Since $r < d$ and $d$ is minimal in $S$, we must have $r = 0$, so $d \\mid a$. Similarly $d \\mid b$. Thus $d$ is a common divisor. If $c \\mid a$ and $c \\mid b$, then $c \\mid (a x_0 + b y_0) = d$, so $c \\le d$. Thus $d = \\gcd(a, b)$.",
          engineeringContext:
            "Foundational theorem for Extended Euclidean inverses in RSA public-key cryptosystems.",
        },
        {
          title: "Chinese Remainder Theorem Coprimality Uniqueness Theorem",
          statement:
            "Prove that for pairwise coprime positive integers $m_1, m_2, \\dots, m_k$ ($M = \\prod m_i$) and integers $a_1, \\dots, a_k$, the system of congruences $x \\equiv a_i \\pmod{m_i}$ has a unique solution modulo $M$.",
          proofOutline:
            "Let $M_i = M / m_i$. Since $\\gcd(M_i, m_i) = 1$, the modular inverse $t_i = M_i^{-1} \\pmod{m_i}$ exists by Extended Euclid. Construct $x_0 = \\sum_{i=1}^k a_i M_i t_i$. For any $j$, $M_i \\equiv 0 \\pmod{m_j}$ for all $i \\neq j$, so $x_0 \\equiv a_j M_j t_j \\equiv a_j(1) \\equiv a_j \\pmod{m_j}$. If $x_1$ is another solution, $x_0 - x_1 \\equiv 0 \\pmod{m_i}$ for all $i$. Since $m_i$ are pairwise coprime, $M \\mid (x_0 - x_1)$, proving uniqueness modulo $M$.",
          engineeringContext:
            "Used to accelerate multi-precision arithmetic and high-speed NTT polynomial multiplication.",
        },
        {
          title: "Fermat's Little Theorem Group Coset Invariant",
          statement:
            "Prove that for any prime $p$ and integer $a$ coprime to $p$, $a^{p-1} \\equiv 1 \\pmod p$.",
          proofOutline:
            "Consider the set of non-zero residue classes $S = \\{1, 2, \\dots, p-1\\}$ in the multiplicative group $(\\mathbb{Z}/p\\mathbb{Z})^\\times$. Multiplying each element by $a \\pmod p$ yields $S' = \\{1a, 2a, \\dots, (p-1)a\\}$. Since $\\gcd(a, p) = 1$, multiplication by $a$ is a bijection on $S$, so $S'$ is a permutation of $S$. Taking the product of all elements in both sets: $\\prod_{k=1}^{p-1} (k a) \\equiv \\prod_{k=1}^{p-1} k \\pmod p \\implies a^{p-1} (p-1)! \\equiv (p-1)! \\pmod p$. Since $\\gcd((p-1)!, p) = 1$, dividing by $(p-1)!$ yields $a^{p-1} \\equiv 1 \\pmod p$.",
          engineeringContext:
            "Enables fast modular inverse computation $a^{-1} \\equiv a^{p-2} \\pmod p$ in finite field cryptography.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "64-Bit Multiplication Overflow under Modulo in Hardware",
          prompt:
            "Why does computing `(a * b) % m` overflow 64-bit hardware registers when $a, b > 2^{32}$, and how do compilers evaluate 128-bit products in registers?",
          engineeringContext:
            "Multiplying two 64-bit numbers produces a 128-bit result stored across two registers (`RDX:RAX`). Without compiler intrinsics or `BigInt`, 64-bit types truncate the upper 64 bits, producing corrupt values.",
        },
        {
          title: "Montgomery Form Reduction vs Hardware `idiv` Division",
          prompt:
            "Why does Montgomery multiplication run over $10\\times$ faster than standard modulo multiplication in RSA accelerators?",
          engineeringContext:
            "Hardware division (`idiv`) incurs 30-40 cycle latency. Montgomery representation maps modulo operations into right bit-shifts and additions, executing modular multiplications in 2 CPU cycles.",
        },
        {
          title: "Segmented Sieve L1/L2 Cache Pinning",
          prompt:
            "How does segmenting a sieve into $\\sqrt{N}$ blocks prevent L3 cache thrashing and memory bus saturation?",
          engineeringContext:
            "A monolithic boolean array of $10^9$ bytes exceeds CPU cache capacity, causing DRAM cache misses on every write. A 32 KB segmented block fits entirely within the L1 data cache, executing at processor register speeds.",
        },
      ],
      partD_stressTests: [
        {
          title: "Negative Modulo Remainder Inversion Bug",
          scenario:
            "Evaluating `-7 % 5` in JavaScript or C++ expecting mathematical congruence `3`.",
          failureMode:
            "The language returns `-2` (truncated remainder), violating ring non-negativity invariants $[0, m-1]$ and corrupting hash table indexing.",
        },
        {
          title: "Fermat Modular Inverse Failure on Composite Moduli",
          scenario: "Computing inverse of $a = 2$ modulo $m = 6$ using $a^{m-2} \\pmod m$.",
          failureMode:
            "Evaluates $2^4 \\pmod 6 = 16 \\pmod 6 = 4$, but $2 \\times 4 = 8 \\equiv 2 \\not\\equiv 1 \\pmod 6$. Fermat's Little Theorem fails completely on composite moduli.",
        },
        {
          title: "Carmichael Number False Positive in Flawed Primality Tests",
          scenario:
            "Running Fermat's primality test with base $a = 2$ on Carmichael number $561 = 3 \\times 11 \\times 17$.",
          failureMode:
            "561 satisfies $2^{560} \\equiv 1 \\pmod{561}$ despite being composite. Fermat's test falsely classifies 561 as prime.",
        },
      ],
    },
  ],
};
