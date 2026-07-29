# Chapter 21 LeetCode Alignment Design

## Goal

Keep the Competitive Programmer's Handbook Chapter 21 algorithms and their
book-oriented titles intact, while ensuring that any displayed LeetCode link
describes the same submission contract as the app's reference solution.

## Source-of-truth policy

The chapter algorithm is authoritative. A LeetCode association is retained or
introduced only when the external task has the same input shape, required
method/function signature, return value, and algorithmic outcome. A merely
related task is not a correspondence.

## Scope

The thirteen Chapter 21 definitions are classified as follows:

- Keep and align to the verified task: sieve primes (#204), Euclidean GCD
  (#1979), trial division (#2521), Goldbach (#2761), Zeckendorf (#1414),
  Lagrange four-square (#279), and Pythagorean triples (#1925).
- Correct the wrong association: divisor functions points to Perfect Number
  (#507), not Four Divisors (#1390).
- Remove unsupported associations while preserving the app-local executable
  contract: Chinese remainder theorem, Euler totient, extended Euclidean, and
  Wilson's theorem.
- Treat modular exponentiation and inverse separately: #372 is related but
  has a materially different Super Pow interface, so it is removed rather
  than changing the taught algorithm's contract.

## Changes

For each retained correspondence, make the definition description, constraints,
examples, reference code, and executable starter/spec agree with the LeetCode
submission interface. Retain the existing book title. For each removed
association, remove only the LeetCode source metadata and preserve the local
algorithm description, reference code, and execution contract.

## Verification

Run the catalog and visualizer audits plus typecheck, formatting, lint, and
build. Do not add automated tests; repository guidance explicitly excludes
tests from plans and implementation work.
