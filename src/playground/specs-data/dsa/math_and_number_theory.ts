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
      defaultInputShape: "{ transitionMatrix: number[][]; initialDistribution: number[] }",
      argumentMapping: ["matrix <- $.transitionMatrix", "initial <- $.initialDistribution"],
      mutation: "No input mutation.",
      returnBehavior: "Returns distribution after steps.",
    },
  }),
  defineDsaExecution({
    id: "trial-division-primality",
    entrypoint: "factorize",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Composite number", input: 24, expected: [2, 2, 2, 3] },
      { label: "Prime number", input: 29, expected: [29] },
      { label: "Smallest non-prime", input: 4, expected: [2, 2] },
    ),
    audit: {
      signature: "factorize(n: int) -> list[int]",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns prime factors of n.",
    },
  }),
  defineDsaExecution({
    id: "divisor-functions",
    entrypoint: "sum_of_divisors",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Perfect number", input: 28, expected: 56 },
      { label: "Prime number", input: 13, expected: 14 },
      { label: "Small number", input: 6, expected: 12 },
    ),
    audit: {
      signature: "sum_of_divisors(n: int) -> int",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns sum of divisors.",
    },
  }),
  defineDsaExecution({
    id: "goldbach-conjecture",
    entrypoint: "goldbach",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Even number 28", input: 28, expected: [5, 23] },
      { label: "Even number 4", input: 4, expected: [2, 2] },
      { label: "Even number 100", input: 100, expected: [3, 97] },
    ),
    audit: {
      signature: "goldbach(n: int) -> list[int]",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns pair of primes summing to n.",
    },
  }),
  defineDsaExecution({
    id: "zeckendorf-theorem",
    entrypoint: "zeckendorf",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Value 74", input: 74, expected: [55, 13, 5, 1] },
      { label: "Value 10", input: 10, expected: [8, 2] },
      { label: "Value 1", input: 1, expected: [1] },
    ),
    audit: {
      signature: "zeckendorf(n: int) -> list[int]",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns non-consecutive Fibonacci terms.",
    },
  }),
  defineDsaExecution({
    id: "lagrange-four-square",
    entrypoint: "lagrange_four_square",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Value 123", input: 123, expected: [9, 5, 5, 2] },
      { label: "Value 7", input: 7, expected: [2, 1, 1, 1] },
      { label: "Value 1", input: 1, expected: [1, 0, 0, 0] },
    ),
    audit: {
      signature: "lagrange_four_square(n: int) -> list[int]",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns 4 squares summing to n.",
    },
  }),
  defineDsaExecution({
    id: "pythagorean-triples",
    entrypoint: "pythagorean_triples",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Limit 20",
        input: 20,
        expected: [
          [3, 4, 5],
          [5, 12, 13],
          [8, 15, 17],
          [12, 16, 20],
        ],
      },
      { label: "Limit 5", input: 5, expected: [[3, 4, 5]] },
      {
        label: "Limit 15",
        input: 15,
        expected: [
          [3, 4, 5],
          [5, 12, 13],
          [9, 12, 15],
        ],
      },
    ),
    audit: {
      signature: "pythagorean_triples(limit: int) -> list[list[int]]",
      defaultInputShape: "number",
      argumentMapping: ["limit <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns triples up to limit.",
    },
  }),
  defineDsaExecution({
    id: "wilson-theorem",
    entrypoint: "wilson_prime",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Prime 7", input: 7, expected: true },
      { label: "Composite 6", input: 6, expected: false },
      { label: "Prime 11", input: 11, expected: true },
    ),
    audit: {
      signature: "wilson_prime(n: int) -> bool",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Checks primality via Wilson's theorem.",
    },
  }),
  defineDsaExecution({
    id: "derangements",
    entrypoint: "count_derangements",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "N=4", input: 4, expected: 9 },
      { label: "N=1", input: 1, expected: 0 },
      { label: "N=5", input: 5, expected: 44 },
    ),
    audit: {
      signature: "count_derangements(n: int) -> int",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns count of derangements.",
    },
  }),
  defineDsaExecution({
    id: "burnside-lemma",
    entrypoint: "burnside_lemma",
    invocation: { kind: "function", arguments: [input("n"), input("k")] },
    cases: cases(
      { label: "4 beads 2 colors", input: { n: 4, k: 2 }, expected: 6 },
      { label: "1 bead 3 colors", input: { n: 1, k: 3 }, expected: 3 },
      { label: "6 beads 2 colors", input: { n: 6, k: 2 }, expected: 14 },
    ),
    audit: {
      signature: "burnside_lemma(n: int, k: int) -> int",
      defaultInputShape: "{ n: number; k: number }",
      argumentMapping: ["n <- $.n", "k <- $.k"],
      mutation: "No input mutation.",
      returnBehavior: "Returns necklace colorings under rotation.",
    },
  }),
  defineDsaExecution({
    id: "prufer-code",
    entrypoint: "prufer_code",
    invocation: { kind: "function", arguments: [input("n"), input("edges")] },
    cases: cases(
      {
        label: "Line tree 4 nodes",
        input: {
          n: 4,
          edges: [
            [0, 1],
            [1, 2],
            [2, 3],
          ],
        },
        expected: [1, 2],
      },
      {
        label: "Star tree 4 nodes",
        input: {
          n: 4,
          edges: [
            [0, 1],
            [0, 2],
            [0, 3],
          ],
        },
        expected: [0, 0],
      },
      {
        label: "3 node tree",
        input: {
          n: 3,
          edges: [
            [0, 1],
            [1, 2],
          ],
        },
        expected: [1],
      },
    ),
    audit: {
      signature: "prufer_code(n: int, edges: list[list[int]]) -> list[int]",
      defaultInputShape: "{ n: number; edges: number[][] }",
      argumentMapping: ["n <- $.n", "edges <- $.edges"],
      mutation: "No input mutation.",
      returnBehavior: "Returns Prufer code of tree.",
    },
  }),
  defineDsaExecution({
    id: "stirling-numbers-second",
    entrypoint: "stirling_second",
    invocation: { kind: "function", arguments: [input("n"), input("k")] },
    cases: cases(
      { label: "S(4,2)", input: { n: 4, k: 2 }, expected: 7 },
      { label: "S(5,5)", input: { n: 5, k: 5 }, expected: 1 },
      { label: "S(5,3)", input: { n: 5, k: 3 }, expected: 25 },
    ),
    audit: {
      signature: "stirling_second(n: int, k: int) -> int",
      defaultInputShape: "{ n: number; k: number }",
      argumentMapping: ["n <- $.n", "k <- $.k"],
      mutation: "No input mutation.",
      returnBehavior: "Returns Stirling number S(n,k).",
    },
  }),
  defineDsaExecution({
    id: "tribonacci-matrix",
    entrypoint: "tribonacci",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "T(4)", input: 4, expected: 4 },
      { label: "T(0)", input: 0, expected: 0 },
      { label: "T(25)", input: 25, expected: 1389537 },
    ),
    audit: {
      signature: "tribonacci(n: int) -> int",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns N-th Tribonacci number via matrix power.",
    },
  }),
  defineDsaExecution({
    id: "path-counting-matrix",
    entrypoint: "path_counting",
    invocation: { kind: "function", arguments: [input("n"), input("adj"), input("k")] },
    cases: cases(
      {
        label: "K=2 steps",
        input: {
          n: 3,
          adj: [
            [0, 1, 1],
            [1, 0, 1],
            [1, 1, 0],
          ],
          k: 2,
        },
        expected: [
          [2, 1, 1],
          [1, 2, 1],
          [1, 1, 2],
        ],
      },
      {
        label: "K=1 step",
        input: {
          n: 3,
          adj: [
            [0, 1, 1],
            [1, 0, 1],
            [1, 1, 0],
          ],
          k: 1,
        },
        expected: [
          [0, 1, 1],
          [1, 0, 1],
          [1, 1, 0],
        ],
      },
      {
        label: "K=3 steps",
        input: {
          n: 3,
          adj: [
            [0, 1, 1],
            [1, 0, 1],
            [1, 1, 0],
          ],
          k: 3,
        },
        expected: [
          [2, 3, 3],
          [3, 2, 3],
          [3, 3, 2],
        ],
      },
    ),
    audit: {
      signature: "path_counting(n: int, adj: list[list[int]], k: int) -> list[list[int]]",
      defaultInputShape: "{ n: number; adj: number[][]; k: number }",
      argumentMapping: ["n <- $.n", "adj <- $.adj", "k <- $.k"],
      mutation: "No input mutation.",
      returnBehavior: "Returns path count matrix after K steps.",
    },
  }),
  defineDsaExecution({
    id: "min-plus-matrix-multiplication",
    entrypoint: "min_plus",
    invocation: { kind: "function", arguments: [input("n"), input("adj"), input("k")] },
    cases: cases(
      {
        label: "K=2 steps",
        input: {
          n: 3,
          adj: [
            [0, 3, 8],
            [3, 0, 1],
            [8, 1, 0],
          ],
          k: 2,
        },
        expected: [
          [0, 3, 4],
          [3, 0, 1],
          [4, 1, 0],
        ],
      },
      {
        label: "K=1 step",
        input: {
          n: 3,
          adj: [
            [0, 3, 8],
            [3, 0, 1],
            [8, 1, 0],
          ],
          k: 1,
        },
        expected: [
          [0, 3, 8],
          [3, 0, 1],
          [8, 1, 0],
        ],
      },
      {
        label: "K=3 steps",
        input: {
          n: 3,
          adj: [
            [0, 3, 8],
            [3, 0, 1],
            [8, 1, 0],
          ],
          k: 3,
        },
        expected: [
          [0, 3, 4],
          [3, 0, 1],
          [4, 1, 0],
        ],
      },
    ),
    audit: {
      signature: "min_plus(n: int, adj: list[list[int]], k: int) -> list[list[int]]",
      defaultInputShape: "{ n: number; adj: number[][]; k: number }",
      argumentMapping: ["n <- $.n", "adj <- $.adj", "k <- $.k"],
      mutation: "No input mutation.",
      returnBehavior: "Returns min-plus K-step shortest path matrix.",
    },
  }),
  defineDsaExecution({
    id: "kirchhoff-matrix-tree",
    entrypoint: "kirchhoff_matrix_tree",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      {
        label: "Complete graph K3",
        input: {
          n: 3,
          edges: [
            [0, 1],
            [1, 2],
            [0, 2],
          ],
        },
        expected: 3,
      },
      {
        label: "Tree of 3 nodes",
        input: {
          n: 3,
          edges: [
            [0, 1],
            [1, 2],
          ],
        },
        expected: 1,
      },
      {
        label: "Cycle of 4 nodes",
        input: {
          n: 4,
          edges: [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 0],
          ],
        },
        expected: 4,
      },
    ),
    audit: {
      signature: "solve(input: dict) -> int",
      defaultInputShape: "{ n: number; edges: number[][] }",
      argumentMapping: ["input <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns number of spanning trees.",
    },
  }),
  defineDsaExecution({
    id: "probability-dp-expectation",
    entrypoint: "probability_dp_expectation",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Standard game", input: { k: 17, maxPts: 10 }, expected: 0.7328 },
      { label: "Boundary 0", input: { k: 0, maxPts: 10 }, expected: 1.0 },
      { label: "High target", input: { k: 21, maxPts: 10 }, expected: 0.7328 },
    ),
    audit: {
      signature: "solve(input: dict) -> float",
      defaultInputShape: "{ k: number; maxPts: number }",
      argumentMapping: ["input <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns probability.",
    },
  }),
  defineDsaExecution({
    id: "toss-strange-coins",
    entrypoint: "toss_strange_coins",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "3 coins target 2", input: { prob: [0.5, 0.5, 0.5], target: 2 }, expected: 0.375 },
      { label: "Target 0", input: { prob: [0.5, 0.5], target: 0 }, expected: 0.25 },
      { label: "Target 1", input: { prob: [0.8], target: 1 }, expected: 0.8 },
    ),
    audit: {
      signature: "solve(input: dict) -> float",
      defaultInputShape: "{ prob: number[]; target: number }",
      argumentMapping: ["input <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns coin probability.",
    },
  }),
  defineDsaExecution({
    id: "miller-rabin-primality",
    entrypoint: "miller_rabin_primality",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Prime 997", input: { n: 997 }, expected: true },
      { label: "Composite 561", input: { n: 561 }, expected: false },
      { label: "Prime 2", input: { n: 2 }, expected: true },
    ),
    audit: {
      signature: "solve(input: dict) -> bool",
      defaultInputShape: "{ n: number }",
      argumentMapping: ["input <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Checks primality using Miller-Rabin.",
    },
  }),
  defineDsaExecution({
    id: "fisher-yates-shuffle",
    entrypoint: "fisher_yates_shuffle",
    invocation: { kind: "function", arguments: [input()] },
    cases: cases(
      { label: "Array of 5 elements", input: { nums: [1, 2, 3, 4, 5] }, expected: [1, 2, 3, 4, 5] },
      { label: "Array of 1 element", input: { nums: [42] }, expected: [42] },
      { label: "Array of 3 elements", input: { nums: [10, 20, 30] }, expected: [10, 20, 30] },
    ),
    audit: {
      signature: "solve(input: dict) -> list",
      defaultInputShape: "{ nums: number[] }",
      argumentMapping: ["input <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns shuffled array.",
    },
  }),
];
