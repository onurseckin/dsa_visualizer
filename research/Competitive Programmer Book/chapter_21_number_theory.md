# Chapter 21: Number Theory — Missing Questions & Topic Gap Analysis

> **Source**: *Competitive Programmer's Handbook* (Antti Laaksonen), Chapter 21: Number Theory  
> **Target Category**: `math_and_number_theory` ("Math & Number Theory")

---

## 1. Chapter Overview & Subtopics

Chapter 21 covers fundamental concepts and classical algorithms in integer number theory, grouped into 4 main sections:

1. **21.1 Primes and Factors**
   - Divisors, Prime Factorization ($n = p_1^{\alpha_1} p_2^{\alpha_2} \dots p_k^{\alpha_k}$)
   - Divisor functions: Count $\tau(n)$, Sum $\sigma(n)$, Product $\mu(n)$, Perfect Numbers ($\sigma(n) - n = n$)
   - Density of primes ($\pi(n) \approx n / \ln n$)
   - Conjectures: Goldbach's conjecture, Twin prime conjecture, Legendre's conjecture
   - $O(\sqrt{n})$ Trial division primality check and prime factor vector extraction
   - Sieve of Eratosthenes ($O(n \log \log n)$) and Smallest Prime Factor (SPF)
   - Euclidean Algorithm ($\gcd(a,b)$ & $\text{lcm}(a,b) = a \cdot b / \gcd(a,b)$)
   - Euler's Totient Function ($\phi(n) = n \prod_{p \mid n} (1 - 1/p)$)

2. **21.2 Modular Arithmetic**
   - Modular Addition, Subtraction, Multiplication, and Exponentiation rules
   - Fast Modular Exponentiation ($O(\log n)$)
   - Fermat's Little Theorem ($x^{m-1} \equiv 1 \pmod m$) & Euler's Theorem ($x^{\phi(m)} \equiv 1 \pmod m$)
   - Modular Multiplicative Inverse ($x^{-1} \equiv x^{m-2} \pmod m$)
   - Unsigned integer wraparound arithmetic modulo $2^k$

3. **21.3 Solving Equations**
   - Linear Diophantine Equations ($ax + by = c$) & Extended Euclidean Algorithm (Extended GCD)
   - Chinese Remainder Theorem (CRT for pairwise coprime moduli)

4. **21.4 Other Results**
   - Lagrange's Four-Square Theorem ($n = a^2 + b^2 + c^2 + d^2$)
   - Zeckendorf's Theorem (Unique non-consecutive Fibonacci sum representation)
   - Pythagorean Triples & Euclid's Formula ($(n^2-m^2, 2nm, n^2+m^2)$)
   - Wilson's Theorem ($(n-1)! \equiv -1 \pmod n \iff n$ is prime)

---

## 2. Currently Implemented in App (`math_and_number_theory`)

The app currently has **6 active items** directly implementing concepts from Chapter 21:

| ID | Title | Description / Chapter Section |
| :--- | :--- | :--- |
| `sieve-primes` | **Sieve of Eratosthenes** | Section 21.1 — $O(n \log \log n)$ prime sieve array |
| `euclid-gcd` | **Euclidean Algorithm (GCD)** | Section 21.1 — $\gcd(a, b)$ logarithmic reduction |
| `euler-totient-function` | **Euler's Totient Function** | Section 21.1 — Counting coprimes up to $n$ via prime factors |
| `modular-exponentiation-inverse` | **Modular Exponentiation & Inverse** | Section 21.2 — Fast exponentiation $O(\log n)$ and Fermat's inverse |
| `extended-euclidean-algorithm` | **Extended Euclidean Algorithm** | Section 21.3 — Bézout coefficients and Diophantine base solution |
| `chinese-remainder-theorem` | **Chinese Remainder Theorem** | Section 21.3 — System of coprime modular congruences |

*(Note: Other items currently enrolled in `math_and_number_theory`—such as `binomial-coefficients-pascal`, `catalan-numbers`, `inclusion-exclusion-principle`, `matrix-exponentiation`, and `markov-chains`—correspond to Chapters 22, 23, and 24).*

---

## 3. Missing Questions & Implementation Roadmap

The following topics from Chapter 21 were skipped or missing from the current catalog. They are prime candidates for addition under `math_and_number_theory`:

### 1. Trial Division Primality Test & Prime Factorization
- **Book Reference**: Section 21.1 ("Basic algorithms", p. 199)
- **Concept**: $O(\sqrt{n})$ primality test and trial division to decompose $n$ into its list of prime factors.
- **Matching LeetCode Questions**:
  - [LC 2521: Distinct Prime Factors of Product of Array](https://leetcode.com/problems/distinct-prime-factors-of-product-of-array/)
  - [LC 3115: Maximum Prime Difference](https://leetcode.com/problems/maximum-prime-difference/)

### 2. Divisor Functions & Perfect Numbers
- **Book Reference**: Section 21.1 ("Primes and factors", p. 197–198)
- **Concept**: Calculating divisor count $\tau(n)$, divisor sum $\sigma(n)$, and checking for Perfect Numbers where $\sigma(n) - n = n$.
- **Matching LeetCode Questions**:
  - [LC 507: Perfect Number](https://leetcode.com/problems/perfect-number/)
  - [LC 1390: Four Divisors](https://leetcode.com/problems/four-divisors/)

### 3. Goldbach's Conjecture Implementation
- **Book Reference**: Section 21.1 ("Conjectures", p. 199)
- **Concept**: Expressing any even integer $n > 2$ as a sum of two prime numbers $p_1 + p_2$.
- **Matching LeetCode Questions**:
  - [LC 2761: Prime Pairs With Target Sum](https://leetcode.com/problems/prime-pairs-with-target-sum/)

### 4. Zeckendorf's Theorem (Fibonacci Representation)
- **Book Reference**: Section 21.4 ("Zeckendorf's theorem", p. 206)
- **Concept**: Every positive integer can be uniquely represented as a sum of non-consecutive Fibonacci numbers.
- **Matching LeetCode Questions**:
  - [LC 1414: Find the Minimum Number of Fibonacci Numbers Whose Sum Is K](https://leetcode.com/problems/find-the-minimum-number-of-fibonacci-numbers-whose-sum-is-k/)

### 5. Lagrange's Four-Square Theorem
- **Book Reference**: Section 21.4 ("Lagrange's theorem", p. 205)
- **Concept**: Every positive integer can be represented as the sum of 4 or fewer integer squares ($a^2 + b^2 + c^2 + d^2$).
- **Matching LeetCode Questions**:
  - [LC 279: Perfect Squares](https://leetcode.com/problems/perfect-squares/)

### 6. Primitive Pythagorean Triples (Euclid's Formula)
- **Book Reference**: Section 21.4 ("Pythagorean triples", p. 206)
- **Concept**: Generating all primitive triples $(n^2-m^2, 2nm, n^2+m^2)$ where $0 < m < n$, $\gcd(m,n)=1$.
- **Matching LeetCode Questions**:
  - [LC 1925: Count Square Sum Triples](https://leetcode.com/problems/count-square-sum-triples/)

### 7. Wilson's Theorem Primality Check
- **Book Reference**: Section 21.4 ("Wilson's theorem", p. 206)
- **Concept**: Testing primality via $(n-1)! \equiv -1 \pmod n$. (Useful theoretically for small $n$ prime verification).
