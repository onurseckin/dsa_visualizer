import { cases, defineDsaExecution, input } from "./helpers";

export const mathAndNumberTheoryExecutions = [
  defineDsaExecution({
    id: "sieve-primes",
    entrypoint: "sieve_of_eratosthenes",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Primes through ten", input: 10, expected: [2, 3, 5, 7] },
      { label: "Below first prime", input: 1, expected: [] },
      {
        label: "Primes through thirty",
        input: 30,
        expected: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29],
      },
    ),
    audit: {
      signature: "sieve_of_eratosthenes(limit: int) -> list[int]",
      defaultInputShape: "number",
      argumentMapping: ["limit <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns all primes up to and including limit.",
    },
  }),
  defineDsaExecution({
    id: "euclid-gcd",
    entrypoint: "gcd",
    invocation: { kind: "function", arguments: [input("a"), input("b")] },
    cases: cases(
      { label: "Shared factor", input: { a: 48, b: 18 }, expected: 6 },
      { label: "Zero operand", input: { a: 0, b: 7 }, expected: 7 },
      { label: "Large Euclidean chain", input: { a: 1071, b: 462 }, expected: 21 },
    ),
    audit: {
      signature: "gcd(a: int, b: int) -> int",
      defaultInputShape: "{ a: number; b: number }",
      argumentMapping: ["a <- $.a", "b <- $.b"],
      mutation: "Only local scalar rebinding.",
      returnBehavior: "Returns the greatest common divisor.",
    },
  }),
  defineDsaExecution({
    id: "modular-exponentiation-inverse",
    entrypoint: "mod_inverse",
    invocation: { kind: "function", arguments: [input("a"), input("mod")] },
    cases: cases(
      { label: "Inverse modulo eleven", input: { a: 3, mod: 11 }, expected: 4 },
      { label: "Unit modulo two", input: { a: 1, mod: 2 }, expected: 1 },
      { label: "Inverse modulo forty-three", input: { a: 17, mod: 43 }, expected: 38 },
    ),
    audit: {
      signature: "mod_inverse(a: int, m: int) -> int",
      defaultInputShape:
        "{ base: number; exponent: number; modulus: number; inverseValue: number }",
      argumentMapping: ["a <- $.a", "m <- $.mod"],
      mutation: "No input mutation.",
      returnBehavior: "Returns the Fermat modular inverse for the authored prime modulus.",
    },
  }),
  defineDsaExecution({
    id: "extended-euclidean-algorithm",
    entrypoint: "extended_gcd",
    invocation: { kind: "function", arguments: [input("a"), input("b")] },
    cases: cases(
      { label: "Two common factors", input: { a: 30, b: 20 }, expected: [10, 1, -1] },
      { label: "Base case", input: { a: 7, b: 0 }, expected: [7, 1, 0] },
      { label: "Long recursive chain", input: { a: 240, b: 46 }, expected: [2, -9, 47] },
    ),
    audit: {
      signature: "extended_gcd(a: int, b: int) -> tuple[int, int, int]",
      defaultInputShape: "{ a: number; b: number }",
      argumentMapping: ["a <- $.a", "b <- $.b"],
      mutation: "No input mutation.",
      returnBehavior:
        "Returns the canonical [gcd, x, y] produced by the recursive quotient recurrence, satisfying ax + by = gcd.",
    },
  }),
  defineDsaExecution({
    id: "chinese-remainder-theorem",
    entrypoint: "chinese_remainder",
    invocation: { kind: "function", arguments: [input("moduli"), input("remainders")] },
    cases: cases(
      {
        label: "Three congruences",
        input: { moduli: [3, 5, 7], remainders: [2, 3, 2] },
        expected: 23,
      },
      {
        label: "Single congruence",
        input: { moduli: [5], remainders: [4] },
        expected: 4,
      },
      {
        label: "Larger prime moduli",
        input: { moduli: [5, 7, 11], remainders: [1, 3, 7] },
        expected: 381,
      },
    ),
    audit: {
      signature: "chinese_remainder(num: list[int], rem: list[int]) -> int",
      defaultInputShape: "{ moduli: number[]; remainders: number[] }",
      argumentMapping: ["num <- $.moduli", "rem <- $.remainders"],
      mutation: "Does not mutate input arrays.",
      returnBehavior: "Returns the least non-negative simultaneous solution for prime moduli.",
    },
  }),
  defineDsaExecution({
    id: "euler-totient-function",
    entrypoint: "euler_totient",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Prime-power factors", input: 9, expected: 6 },
      { label: "Unit boundary", input: 1, expected: 1 },
      { label: "Several prime factors", input: 36, expected: 12 },
    ),
    audit: {
      signature: "euler_totient(n: int) -> int",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "Only local scalar rebinding.",
      returnBehavior: "Returns the count of integers in [1, n] coprime to n.",
    },
  }),
  defineDsaExecution({
    id: "binomial-coefficients-pascal",
    entrypoint: "binomial_coefficient",
    invocation: { kind: "function", arguments: [input("n"), input("k")] },
    cases: cases(
      { label: "Five choose two", input: { n: 5, k: 2 }, expected: 10 },
      { label: "Zero choose zero", input: { n: 0, k: 0 }, expected: 1 },
      { label: "Central coefficient", input: { n: 10, k: 5 }, expected: 252 },
    ),
    audit: {
      signature: "binomial_coefficient(n: int, k: int) -> int",
      defaultInputShape: "{ n: number; k: number }",
      argumentMapping: ["n <- $.n", "k <- $.k"],
      mutation: "No input mutation.",
      returnBehavior: "Returns C(n, k) from Pascal recurrence.",
    },
  }),
  defineDsaExecution({
    id: "catalan-numbers",
    entrypoint: "catalan_number",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Third Catalan number", input: 3, expected: 5 },
      { label: "Zeroth Catalan number", input: 0, expected: 1 },
      { label: "Fifth Catalan number", input: 5, expected: 42 },
    ),
    audit: {
      signature: "catalan_number(n: int) -> int",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns the nth Catalan number.",
    },
  }),
  defineDsaExecution({
    id: "inclusion-exclusion-principle",
    entrypoint: "inclusion_exclusion",
    invocation: { kind: "function", arguments: [input("n"), input("primes")] },
    cases: cases(
      { label: "Multiples of two or five", input: { n: 10, primes: [2, 5] }, expected: 6 },
      { label: "No divisors", input: { n: 50, primes: [] }, expected: 0 },
      {
        label: "Three-way overlap",
        input: { n: 100, primes: [2, 3, 5] },
        expected: 74,
      },
    ),
    audit: {
      signature: "inclusion_exclusion(n: int, primes: list[int]) -> int",
      defaultInputShape: "{ n: number; primes: number[] }",
      argumentMapping: ["n <- $.n", "primes <- $.primes"],
      mutation: "Does not mutate primes.",
      returnBehavior: "Returns values up to n divisible by at least one authored prime.",
    },
  }),
  defineDsaExecution({
    id: "matrix-exponentiation",
    entrypoint: "fibonacci_matrix_pow",
    invocation: { kind: "function", arguments: [input("n"), input("mod")] },
    cases: cases(
      { label: "Tenth Fibonacci", input: { n: 10, mod: 1_000_000_007 }, expected: 55 },
      { label: "Zeroth Fibonacci", input: { n: 0, mod: 97 }, expected: 0 },
      { label: "Large reduced Fibonacci", input: { n: 50, mod: 1000 }, expected: 25 },
    ),
    audit: {
      signature: "fibonacci_matrix_pow(n: int, mod: int = 1000000007) -> int",
      defaultInputShape: "{ n: number; mod: number }",
      argumentMapping: ["n <- $.n", "mod <- $.mod"],
      mutation: "No input mutation.",
      returnBehavior: "Returns Fibonacci(n) modulo mod via 2-by-2 exponentiation.",
    },
  }),
  defineDsaExecution({
    id: "markov-chains",
    entrypoint: "markov_chain",
    invocation: {
      kind: "function",
      arguments: [input("transition"), input("initial"), input("steps")],
    },
    cases: cases(
      {
        label: "One probabilistic step",
        input: {
          transition: [
            [0.5, 0.5],
            [0.25, 0.75],
          ],
          initial: [1, 0],
          steps: 1,
        },
        expected: [0.5, 0.5],
      },
      {
        label: "Zero steps",
        input: {
          transition: [
            [0, 1],
            [1, 0],
          ],
          initial: [0, 1],
          steps: 0,
        },
        expected: [0, 1],
      },
      {
        label: "Three deterministic swaps",
        input: {
          transition: [
            [0, 1],
            [1, 0],
          ],
          initial: [0.25, 0.75],
          steps: 3,
        },
        expected: [0.75, 0.25],
      },
    ),
    audit: {
      signature: "markov_chain(transition_matrix, initial_dist, steps) -> list[float]",
      defaultInputShape:
        "{ transitionMatrix: number[][]; initialDistribution: number[]; steps: number }",
      argumentMapping: [
        "transition_matrix <- $.transition",
        "initial_dist <- $.initial",
        "steps <- $.steps",
      ],
      mutation: "Copies the initial distribution; does not mutate inputs.",
      returnBehavior: "Returns the state distribution after the requested transitions.",
    },
  }),
] as const;
