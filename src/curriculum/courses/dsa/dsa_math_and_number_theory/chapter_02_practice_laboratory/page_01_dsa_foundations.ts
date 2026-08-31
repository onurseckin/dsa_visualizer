import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_math_and_number_theory_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Modular Arithmetic & Primality Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "count-primes-linear-sieve",
      title: "Count Primes via Linear Euler Sieve",
      difficulty: "Medium",
      rationale:
        "Implement the Linear Euler Sieve to count and generate all prime numbers strictly less than $n$ in guaranteed strictly $O(N)$ linear time by ensuring every composite number is marked exactly once by its least prime factor.",
      starterCode: `/**
 * Linear Euler Sieve (Prime Counter) Solver
 */

export function countPrimes(n: number): number {
  if (n <= 2) return 0;

  const isPrime = new Uint8Array(n).fill(1);
  const primes: number[] = [];
  isPrime[0] = isPrime[1] = 0;

  for (let i = 2; i < n; i++) {
    if (isPrime[i]) {
      primes.push(i);
    }

    // Euler Sieve Step: filter composites with prime factors
    for (let j = 0; j < primes.length && i * primes[j] < n; j++) {
      const p = primes[j];
      isPrime[i * p] = 0;

      // Invariant: If p divides i, then p is the smallest prime factor of (i * p).
      // Any subsequent prime p' > p would violate the minimal-prime-factor invariant.
      if (i % p === 0) {
        break;
      }
    }
  }

  return primes.length;
}`,
    },
  ],
};
