import { cases, defineDsaExecution, extraCases, input } from "./helpers";

export const mathAndNumberTheoryExecutions = [
  defineDsaExecution({
    id: "sieve-primes",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "countPrimes",
      arguments: [input()],
    },
    cases: [
      ...cases(
        { label: "Primes less than ten", input: 10, expected: 4 },
        { label: "Below first prime", input: 1, expected: 0 },
        { label: "Primes less than thirty", input: 30, expected: 10 },
      ),
      ...extraCases(
        { label: "Zero bound", input: 0, expected: 0 },
        { label: "First prime excluded", input: 2, expected: 0 },
        { label: "First prime included", input: 3, expected: 1 },
        { label: "Hundred bound", input: 100, expected: 25 },
        { label: "Thousand bound", input: 1000, expected: 168 },
      ),
    ],
    audit: {
      signature: "Solution().countPrimes(n: int) -> int",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns count of primes strictly less than n.",
    },
  }),
  defineDsaExecution({
    id: "euclid-gcd",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "findGCD",
      arguments: [input()],
    },
    cases: [
      ...cases(
        { label: "Array [2, 5, 6, 9, 10]", input: [2, 5, 6, 9, 10], expected: 2 },
        { label: "Array [7, 5, 6, 8, 3]", input: [7, 5, 6, 8, 3], expected: 1 },
        { label: "Array [3, 3]", input: [3, 3], expected: 3 },
      ),
      ...extraCases(
        { label: "Unit and maximum", input: [1, 1000], expected: 1 },
        { label: "Repeated multiples", input: [12, 24, 36, 60], expected: 12 },
        { label: "Unsorted equal extremes", input: [24, 6, 12, 6, 24], expected: 6 },
        { label: "All maximum values", input: [1000, 1000, 1000], expected: 1000 },
        { label: "Prime extremes", input: [997, 499, 997], expected: 1 },
      ),
    ],
    audit: {
      signature: "Solution().findGCD(nums: list[int]) -> int",
      defaultInputShape: "number[]",
      argumentMapping: ["nums <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns GCD of min and max elements.",
    },
  }),
  defineDsaExecution({
    id: "modular-exponentiation-inverse",
    entrypoint: "mod_inverse",
    invocation: { kind: "function", arguments: [input("a"), input("mod")] },
    cases: [
      ...cases(
        { label: "Inverse modulo eleven", input: { a: 3, mod: 11 }, expected: 4 },
        { label: "Unit modulo two", input: { a: 1, mod: 2 }, expected: 1 },
        { label: "Inverse modulo forty-three", input: { a: 17, mod: 43 }, expected: 38 },
      ),
      ...extraCases(
        { label: "Inverse of two modulo three", input: { a: 2, mod: 3 }, expected: 2 },
        { label: "Self inverse modulo eleven", input: { a: 10, mod: 11 }, expected: 10 },
        { label: "Inverse modulo five", input: { a: 2, mod: 5 }, expected: 3 },
        { label: "Inverse modulo thirteen", input: { a: 6, mod: 13 }, expected: 11 },
        { label: "Larger prime modulus", input: { a: 37, mod: 101 }, expected: 71 },
      ),
    ],
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
    cases: [
      ...cases(
        { label: "Two common factors", input: { a: 30, b: 20 }, expected: [10, 1, -1] },
        { label: "Base case", input: { a: 7, b: 0 }, expected: [7, 1, 0] },
        { label: "Long recursive chain", input: { a: 240, b: 46 }, expected: [2, -9, 47] },
      ),
      ...extraCases(
        { label: "Unit pair", input: { a: 1, b: 1 }, expected: [1, 0, 1] },
        { label: "Coprime pair", input: { a: 99, b: 78 }, expected: [3, -11, 14] },
        { label: "Several quotient steps", input: { a: 270, b: 192 }, expected: [6, 5, -7] },
        { label: "First operand smaller", input: { a: 46, b: 240 }, expected: [2, 47, -9] },
        { label: "Equal operands", input: { a: 42, b: 42 }, expected: [42, 0, 1] },
      ),
    ],
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
    cases: [
      ...cases(
        {
          label: "Three congruences",
          input: { moduli: [3, 5, 7], remainders: [2, 3, 2] },
          expected: 23,
        },
        { label: "Single congruence", input: { moduli: [5], remainders: [4] }, expected: 4 },
        {
          label: "Larger prime moduli",
          input: { moduli: [5, 7, 11], remainders: [1, 3, 7] },
          expected: 381,
        },
      ),
      ...extraCases(
        {
          label: "All zero remainders",
          input: { moduli: [3, 5, 7], remainders: [0, 0, 0] },
          expected: 0,
        },
        { label: "Two moduli", input: { moduli: [2, 3], remainders: [1, 2] }, expected: 5 },
        {
          label: "All remainders one",
          input: { moduli: [2, 3, 5], remainders: [1, 1, 1] },
          expected: 1,
        },
        {
          label: "Two larger prime moduli",
          input: { moduli: [5, 7], remainders: [4, 6] },
          expected: 34,
        },
        {
          label: "Four congruences",
          input: { moduli: [2, 3, 5, 7], remainders: [1, 2, 3, 4] },
          expected: 53,
        },
      ),
    ],
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
    cases: [
      ...cases(
        { label: "Prime-power factors", input: 9, expected: 6 },
        { label: "Unit boundary", input: 1, expected: 1 },
        { label: "Several prime factors", input: 36, expected: 12 },
      ),
      ...extraCases(
        { label: "Smallest prime", input: 2, expected: 1 },
        { label: "Power of two", input: 64, expected: 32 },
        { label: "Prime input", input: 97, expected: 96 },
        { label: "Three distinct prime factors", input: 210, expected: 48 },
        { label: "Large prime", input: 997, expected: 996 },
      ),
    ],
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
    entrypoint: "Solution",
    invocation: { kind: "class-method", constructor: [], method: "generate", arguments: [input()] },
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
    entrypoint: "Solution",
    invocation: { kind: "class-method", constructor: [], method: "numTrees", arguments: [input()] },
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
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "nthUglyNumber",
      arguments: [input("n"), input("a"), input("b"), input("c")],
    },
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
    entrypoint: "Solution",
    invocation: { kind: "class-method", constructor: [], method: "fib", arguments: [input()] },
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
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "knightProbability",
      arguments: [input("n"), input("k"), input("row"), input("column")],
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
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "distinctPrimeFactors",
      arguments: [input()],
    },
    cases: [
      ...cases(
        { label: "Array of 5 numbers", input: [2, 4, 3, 7, 10], expected: 4 },
        { label: "Powers of two", input: [2, 4, 8, 16], expected: 1 },
        { label: "Single number 12", input: [12], expected: 2 },
      ),
      ...extraCases(
        { label: "Repeated prime", input: [97, 97, 97], expected: 1 },
        { label: "Five distinct primes", input: [2, 3, 5, 7, 11], expected: 5 },
        { label: "Mixed prime powers", input: [64, 81, 125, 49], expected: 4 },
        { label: "Large prime and composite", input: [997, 996], expected: 4 },
        { label: "Many repeated factors", input: [12, 18, 27, 50], expected: 3 },
      ),
    ],
    audit: {
      signature: "Solution().distinctPrimeFactors(nums: list[int]) -> int",
      defaultInputShape: "number[]",
      argumentMapping: ["nums <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns count of distinct prime factors of product.",
    },
  }),
  defineDsaExecution({
    id: "divisor-functions",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "checkPerfectNumber",
      arguments: [input()],
    },
    cases: [
      ...cases(
        { label: "Perfect number 28", input: 28, expected: true },
        { label: "Non-perfect number 7", input: 7, expected: false },
        { label: "Perfect number 6", input: 6, expected: true },
      ),
      ...extraCases(
        { label: "One is not perfect", input: 1, expected: false },
        { label: "Smallest prime", input: 2, expected: false },
        { label: "Abundant composite", input: 12, expected: false },
        { label: "Third perfect number", input: 496, expected: true },
        { label: "Fourth perfect number", input: 8128, expected: true },
      ),
    ],
    audit: {
      signature: "Solution().checkPerfectNumber(num: int) -> bool",
      defaultInputShape: "number",
      argumentMapping: ["num <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns True if num is a perfect number.",
    },
  }),
  defineDsaExecution({
    id: "goldbach-conjecture",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "findPrimePairs",
      arguments: [input()],
    },
    cases: [
      ...cases(
        {
          label: "Number 10",
          input: 10,
          expected: [
            [3, 7],
            [5, 5],
          ],
        },
        { label: "Number 4", input: 4, expected: [[2, 2]] },
        { label: "Number 2", input: 2, expected: [] },
      ),
      ...extraCases(
        { label: "Odd target with one pair", input: 5, expected: [[2, 3]] },
        { label: "Odd target without pairs", input: 3, expected: [] },
        {
          label: "Several pairs",
          input: 26,
          expected: [
            [3, 23],
            [7, 19],
            [13, 13],
          ],
        },
        {
          label: "Many pairs",
          input: 100,
          expected: [
            [3, 97],
            [11, 89],
            [17, 83],
            [29, 71],
            [41, 59],
            [47, 53],
          ],
        },
        { label: "Prime target", input: 31, expected: [[2, 29]] },
      ),
    ],
    audit: {
      signature: "Solution().findPrimePairs(n: int) -> list[list[int]]",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns 2D array of prime pairs summing to n.",
    },
  }),
  defineDsaExecution({
    id: "zeckendorf-theorem",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "findMinFibonacciNumbers",
      arguments: [input()],
    },
    cases: [
      ...cases(
        { label: "Value 7", input: 7, expected: 2 },
        { label: "Value 10", input: 10, expected: 2 },
        { label: "Value 19", input: 19, expected: 3 },
      ),
      ...extraCases(
        { label: "Smallest target", input: 1, expected: 1 },
        { label: "Fibonacci target", input: 2, expected: 1 },
        { label: "Two-term target", input: 123, expected: 2 },
        { label: "Three-term target", input: 100, expected: 3 },
        { label: "Large Fibonacci-neighbor target", input: 1000, expected: 2 },
      ),
    ],
    audit: {
      signature: "Solution().findMinFibonacciNumbers(k: int) -> int",
      defaultInputShape: "number",
      argumentMapping: ["k <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns minimum count of Fibonacci numbers summing to k.",
    },
  }),
  defineDsaExecution({
    id: "lagrange-four-square",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "numSquares",
      arguments: [input()],
    },
    cases: [
      ...cases(
        { label: "Value 12", input: 12, expected: 3 },
        { label: "Value 13", input: 13, expected: 2 },
        { label: "Value 1", input: 1, expected: 1 },
      ),
      ...extraCases(
        { label: "Two squares", input: 2, expected: 2 },
        { label: "Three squares", input: 3, expected: 3 },
        { label: "Perfect square", input: 4, expected: 1 },
        { label: "Four-square form", input: 7, expected: 4 },
        { label: "Large four-square form", input: 9999, expected: 4 },
      ),
    ],
    audit: {
      signature: "Solution().numSquares(n: int) -> int",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns minimum count of perfect squares summing to n.",
    },
  }),
  defineDsaExecution({
    id: "pythagorean-triples",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "countTriples",
      arguments: [input()],
    },
    cases: [
      ...cases(
        { label: "Limit 5", input: 5, expected: 2 },
        { label: "Limit 10", input: 10, expected: 4 },
        { label: "Limit 15", input: 15, expected: 8 },
      ),
      ...extraCases(
        { label: "No possible triple", input: 1, expected: 0 },
        { label: "Below the first hypotenuse", input: 4, expected: 0 },
        { label: "Three hypotenuse bound", input: 13, expected: 6 },
        { label: "Multiple primitive and scaled triples", input: 20, expected: 12 },
        { label: "Twenty-five bound", input: 25, expected: 16 },
      ),
    ],
    audit: {
      signature: "Solution().countTriples(n: int) -> int",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns count of square sum triples up to n.",
    },
  }),
  defineDsaExecution({
    id: "wilson-theorem",
    entrypoint: "wilson_prime",
    invocation: { kind: "function", arguments: [input()] },
    cases: [
      ...cases(
        { label: "Prime 7", input: 7, expected: true },
        { label: "Composite 6", input: 6, expected: false },
        { label: "Prime 5", input: 5, expected: true },
      ),
      ...extraCases(
        { label: "Smallest prime", input: 2, expected: true },
        { label: "Next prime", input: 3, expected: true },
        { label: "Smallest composite", input: 4, expected: false },
        { label: "Larger prime", input: 19, expected: true },
        { label: "Larger composite", input: 20, expected: false },
      ),
    ],
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
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "findDerangement",
      arguments: [input()],
    },
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
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "largestMultipleOfThree",
      arguments: [input()],
    },
    cases: cases(
      { label: "Digits [8, 1, 9]", input: [8, 1, 9], expected: "981" },
      { label: "Digits [8, 6, 7, 1, 0]", input: [8, 6, 7, 1, 0], expected: "8760" },
      { label: "Digits [1]", input: [1], expected: "" },
    ),
    audit: {
      signature: "Solution().largestMultipleOfThree(digits: list[int]) -> str",
      defaultInputShape: "number[]",
      argumentMapping: ["digits <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns largest multiple of three as string.",
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
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "rearrangeSticks",
      arguments: [input("n"), input("k")],
    },
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
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "tribonacci",
      arguments: [input()],
    },
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
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "checkRecord",
      arguments: [input()],
    },
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
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "findTheCity",
      arguments: [input("n"), input("edges"), input("distanceThreshold")],
    },
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
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "numOfWays",
      arguments: [input()],
    },
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
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "new21Game",
      arguments: [input("n"), input("k"), input("maxPts")],
    },
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
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "probabilityOfHeads",
      arguments: [input("prob"), input("target")],
    },
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
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "primePalindrome",
      arguments: [input()],
    },
    cases: cases(
      { label: "Number 6", input: 6, expected: 7 },
      { label: "Number 8", input: 8, expected: 11 },
      { label: "Number 13", input: 13, expected: 101 },
    ),
    audit: {
      signature: "Solution().primePalindrome(n: int) -> int",
      defaultInputShape: "number",
      argumentMapping: ["n <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns smallest prime palindrome >= n.",
    },
  }),
  defineDsaExecution({
    id: "fisher-yates-shuffle",
    entrypoint: "Solution",
    invocation: {
      kind: "class-method",
      constructor: [],
      method: "shuffle",
      arguments: [input()],
    },
    cases: cases(
      {
        label: "Array of 5 elements",
        input: [1, 2, 3, 4, 5],
        expected: [1, 2, 3, 4, 5],
        comparison: "unordered",
      },
      { label: "Array of 1 element", input: [42], expected: [42] },
      {
        label: "Array of 3 elements",
        input: [10, 20, 30],
        expected: [10, 20, 30],
        comparison: "unordered",
      },
    ),
    audit: {
      signature: "Solution().shuffle(nums: list[int]) -> list[int]",
      defaultInputShape: "number[]",
      argumentMapping: ["nums <- $"],
      mutation: "No input mutation.",
      returnBehavior: "Returns shuffled array.",
    },
  }),
];
