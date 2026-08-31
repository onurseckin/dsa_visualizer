import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_math_and_number_theory_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "64-Bit Multiplication Overflow, Montgomery Multiplication & Cache Blocked Sieves",
      content:
        "High-performance cryptography (RSA-4096, Ed25519) and numerical libraries structure modular arithmetic under hardware silicon constraints:\n\n1. **64-Bit Multiplication Overflow under Modulo:** Multiplying two 64-bit integers $a, b \\in [0, m-1]$ produces a 128-bit product $a \\cdot b \\le m^2 \\approx 3.4 \\times 10^{38}$, overflowing standard 64-bit hardware registers. In C++, systems software uses `unsigned __int128` or assembly `mulx` instructions; in TypeScript/JS, native `BigInt` operations prevent numerical truncation.\n2. **Montgomery Multiplication:** Eliminates expensive hardware modulo division instructions (`idiv` takes 30-40 cycles) by transforming operands into Montgomery form $a R \\pmod m$ (where $R = 2^{64}$). Modular reductions are evaluated via bitwise shifts and additions in 2 cycles.\n3. **Cache-Blocked Segmented Sieves:** Sieve arrays of size $N = 10^9$ consume $1$ GB of memory, thrashing L3 cache and TLB buffers. **Segmented Sieve** chunks the domain into blocks of size $\\sqrt{N} \\approx 32\\text{ KB}$, pinning entire sieve blocks inside the 64-byte L1 data cache and boosting throughput by $>500\\%$.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Negative Modulo Inversions & Composite Moduli",
      content:
        "1. **The Negative Modulo Remainder Fallacy:** In C++, Java, and JavaScript, the `%` operator computes the truncated remainder rather than mathematical modulo: `-7 % 5 === -2`. Mathematical congruences in $\\mathbb{Z}/m\\mathbb{Z}$ *must* be normalized via `((x % m) + m) % m` to guarantee output in $[0, m - 1]$.\n2. **Fermat's Little Theorem on Composite Moduli Bug:** Using $a^{m-2} \\pmod m$ to compute the modular inverse fails whenever $m$ is composite (e.g. $m = 10^9 + 6$), because Fermat's theorem holds *only* for prime moduli. For composite moduli, the **Extended Euclidean Algorithm** *must* be used, which succeeds if and only if $\\gcd(a, m) = 1$.\n3. **Modular Inverse Non-Existence Crash:** Calling modular inverse on non-coprime inputs (e.g. $4^{-1} \\pmod 6$) throws errors or enters infinite loops because no modular inverse exists in the zero-divisor ring.\n4. **Miller-Rabin Incomplete Base False Positives:** Testing only base 2 falsely approves pseudoprimes (such as the Carmichael number $561 = 3 \\times 11 \\times 17$). To guarantee 100% deterministic correctness for all 64-bit integers, all 12 prime bases up to 37 must be evaluated.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Factorization Frontiers: Pollard's Rho & Baby-Step Giant-Step",
      content:
        "Advanced number-theoretic engines solve sub-exponential discrete logarithms and factorizations:\n- **Pollard's Rho Integer Factorization (Pollard 1975):** Employs Floyd's cycle-finding algorithm on the pseudorandom polynomial sequence $x_{k+1} = (x_k^2 + c) \\bmod N$. By the Birthday Paradox, cycle detection in the quotient group $\\mathbb{Z}/p\\mathbb{Z}$ yields a non-trivial factor $\\gcd(|x_i - x_j|, N) > 1$ in strictly $O(N^{1/4})$ expected time.\n- **Baby-Step Giant-Step (Shanks 1971):** Computes the discrete logarithm $a^x \\equiv b \\pmod m$ in strictly $O(\\sqrt{m} \\log m)$ time and space by balancing $m = i \\cdot \\lceil\\sqrt{m}\\rceil - j$ over a hash table.",
    },
    {
      type: "prose",
      title: "Number Theory Algorithmic Engine Selection Matrix",
      content: `
| Algorithm | Input Domain | Time Complexity | Space Complexity | Primary Application |
| :--- | :--- | :--- | :--- | :--- |
| **Euclidean GCD** | Arbitrary integers $(a, b)$ | $O(\\log(\\min(a, b)))$ | $O(1)$ | Fraction reduction, coprimality |
| **Extended Euclidean** | Integers $(a, m)$ | $O(\\log m)$ | $O(1)$ | Modular inverse for composite moduli |
| **Fermat Modular Inverse** | Prime modulus $p$ | $O(\\log p)$ | $O(1)$ | Combinatorics $\\binom{N}{K} \\pmod{10^9+7}$ |
| **Linear Euler Sieve** | Range $[1, N]$ | Strictly $O(N)$ | $O(N)$ | Multiplicative functions ($\\phi, \\mu$), bulk primes |
| **Miller-Rabin (64-Bit)** | Single integer $n < 2^{64}$ | $O(12 \\log^3 n)$ | $O(1)$ | Cryptographic key generation, prime testing |
| **Pollard's Rho** | Composite $N$ | $O(N^{1/4})$ expected | $O(1)$ | RSA key factorization, divisor analysis |
| **Baby-Step Giant-Step** | Discrete Log $a^x \\equiv b$ | $O(\\sqrt{m})$ | $O(\\sqrt{m})$ | Diffie-Hellman discrete log cryptanalysis |
      `,
    },
  ],
};
