import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { PYTHON_SIEVE_CODE } from "./pythonCode";
import { generateSieveSteps, type SieveInput } from "./stepGenerator";

export const DEFAULT_SIEVE_INPUT: SieveInput = {
  limit: 30,
};

const SIEVE_PRIMES_TOPIC_GUIDE: TopicGuide = {
  overview:
    "A sieve is a table-building technique: instead of answering a question about one number, you answer it about every number in a range $[0, n]$ at once by letting each fact propagate to the values it affects. The Sieve of Eratosthenes is the original and still the most useful instance, finding all primes up to a limit $n$ by crossing out multiples rather than testing candidates. Reach for it whenever a problem needs the primes in a range, or needs some multiplicative fact about every number in a range, because the sieve turns per-number work into shared work. It is also the gateway to a whole family of relatives that compute factorizations, divisor counts, and totients with the same skeleton.",
  sections: [
    {
      heading: "Elimination instead of testing",
      body: "The direct way to list primes up to $n$ is to test each candidate separately using trial division up to $\\sqrt{n}$, costing $\\mathcal{O}(n \\sqrt{n})$ work overall with nothing carried over between candidates. The sieve inverts the question. Since every composite number $m \\le n$ has at least one prime factor $p \\le \\sqrt{m}$, if you take each prime in turn and cross out all of its multiples, then every composite is guaranteed to be struck at least once, and whatever is never struck cannot be composite. The data structure is a boolean vector $\\mathbf{v} \\in \\{0, 1\\}^{n+1}$ indexed directly by the integers, making state lookups $\\mathcal{O}(1)$.",
    },
    {
      heading: "Optimization using the square root bound",
      body: "You begin optimistically, setting $\\mathbf{v}[i] = 1$ for all $0 \\le i \\le n$, then immediately correct the two non-prime exceptions $\\mathbf{v}[0] = \\mathbf{v}[1] = 0$. The outer loop walks candidate $p$ upward. When it finds $\\mathbf{v}[p] = 1$, $p$ is prime. The inner loop flags $p^2, p^2 + p, p^2 + 2p, \\dots \\le n$ as composite. The outer loop can safely stop once $p^2 > n$, because any composite $m \\le n$ must have a prime factor $p \\le \\sqrt{n}$. The inner loop starts at $p^2$ because any smaller multiple $k \\cdot p$ with $k < p$ already carries a prime factor smaller than $p$ and was crossed out in an earlier sweep.",
    },
    {
      heading: "Mathematical time complexity derivation",
      body: "The total number of elimination operations performed by the inner loops across all base primes $p \\le \\sqrt{n}$ is proportional to:\n$$\\sum_{p \\le \\sqrt{n}} \\frac{n}{p} = n \\sum_{p \\le \\sqrt{n}} \\frac{1}{p}$$\nBy Mertens' Second Theorem, the sum of the reciprocals of prime numbers up to $x$ grows as $\\ln \\ln x + M$ (where $M \\approx 0.261497$ is the Meissel-Mertens constant). Thus, the overall time complexity is $\\mathcal{O}(n \\log \\log n)$, which is nearly linear in $n$.",
    },
    {
      heading: "When to sieve and when to test a single number",
      body: "Sieving is optimal when finding all primes in range $[0, n]$, precomputing Smallest Prime Factors (SPF) for fast $\\mathcal{O}(\\log n)$ factorization queries, or computing multiplicative functions over a range. It is sub-optimal for deciding the primality of a single massive candidate (where Miller-Rabin probabilistic test takes $\\mathcal{O}(k \\log^3 n)$ time without allocating $\\mathcal{O}(n)$ memory). For large but narrow ranges $[L, R]$, a Segmented Sieve sieves a window of size $R - L + 1$ using base primes up to $\\sqrt{R}$, reducing space to $\\mathcal{O}(\\sqrt{R} + (R - L))$.",
    },
    {
      heading: "Pitfalls and edge cases",
      body: "Size the array as $n + 1$ because indexing is 0-based and $n$ is inclusive. The base cases $\\mathbf{v}[0] = \\mathbf{v}[1] = 0$ must be set explicitly. For large bounds, calculating $p \\cdot p$ can overflow standard 32-bit integers, so use $p \\le n / p$ or $p \\le \\lfloor\\sqrt{n}\\rfloor$. Starting the inner loop at $2p$ instead of $p^2$ is redundant (though correct), while starting after $p^2$ misses composites.",
    },
  ],
  keyTerms: [
    {
      term: "Composite number",
      definition:
        "An integer $m > 1$ that is the product of two smaller integers, having at least one prime factor $p \\le \\sqrt{m}$.",
    },
    {
      term: "Base prime",
      definition:
        "A prime $p$ discovered by the outer loop and used to eliminate its multiples $p^2, p(p+1), \\dots$. Only primes $p \\le \\sqrt{n}$ serve as base primes.",
    },
    {
      term: "Square root bound",
      definition:
        "The mathematical principle that if $m$ is composite, it must have a factor $\\le \\sqrt{m}$. Thus, outer loops terminate at $p^2 > n$.",
    },
    {
      term: "Smallest Prime Factor (SPF)",
      definition:
        "A sieve variation storing the smallest prime factor for each integer $i$, enabling complete prime factorization in $\\mathcal{O}(\\log n)$ steps.",
    },
  ],
};

const SIEVE_PRIMES_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines the sieve_of_eratosthenes function signature taking integer limit $n$ and returning a list of prime numbers.",
    2: "Guards against limits smaller than the smallest prime 2.",
    3: "Returns an empty list immediately when $limit < 2$.",
    4: "Blank line separating boundary guard from state vector allocation.",
    5: "Allocates boolean array of size $limit + 1$ filled with True, representing vector $\\mathbf{v} \\in \\{1\\}^{n+1}$.",
    6: "Sets index 0 and 1 to False as neither 0 nor 1 are prime numbers.",
    7: "Blank line separating initialization from base prime elimination loop.",
    8: "Initializes outer candidate pointer $p = 2$, the smallest prime.",
    9: "Loops while $p^2 \\le limit$; composites $> p^2$ without factors $\\le p$ cannot exist.",
    10: "Checks if candidate $p$ is marked prime ($is\\_prime[p] == True$).",
    11: "Sweeps multiples of $p$ starting at $p^2$ up to limit with step $p$: $p^2, p^2+p, p^2+2p, \\dots$.",
    12: "Marks multiple $i$ as False (composite).",
    13: "Increments candidate pointer $p$ by 1.",
    14: "Blank line separating elimination sweep from prime collection.",
    15: "Initializes result array to collect surviving prime numbers.",
    16: "Iterates through candidate values from 2 to limit.",
    17: "Checks if number $i$ remained True (never eliminated by any prime factor).",
    18: "Appends prime number $i$ to result list.",
    19: "Blank line before function return.",
    20: "Returns the complete list of prime numbers $\\le limit$.",
  },
};

export const sievePrimes: AlgorithmDefinition<SieveInput> = {
  id: "sieve-primes",
  title: "Sieve of Eratosthenes",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "The Sieve of Eratosthenes is an ancient algorithm for finding all prime numbers up to a given limit $n$. Instead of testing numbers individually via trial division in $O(n \\sqrt{n})$ time, it crosses out multiples of each discovered prime $p$ starting from $p^2$, leaving only primes standing in nearly linear time:\n\n$$\\sum_{p \\le \\sqrt{n}} \\frac{n}{p} = \\mathcal{O}(n \\log \\log n)$$\n\n### Primality State Vector\nThe primality status is recorded in state vector $\\mathbf{v} \\in \\{0, 1\\}^{n+1}$ where $\\mathbf{v}[i] = 1$ indicates $i$ is prime and $\\mathbf{v}[i] = 0$ indicates $i$ is composite.\n\n### Input Parameters\n- `limit` ($n \\in \\mathbb{Z}_{\\ge 0}$): Upper bound inclusive limit.\n\n### Output\n- `list[int]`: List of all prime numbers $p \\le n$.\n\n### Edge Cases & Constraints\n- `limit < 2`: Returns empty list `[]`.\n- Large `limit`: Memory scales linearly with limit $\\mathcal{O}(n)$.",
  constraints: ["0 <= limit <= 10^5"],
  examples: [
    {
      kind: "basic",
      inputDisplay: "n = 10",
      outputDisplay: "[2, 3, 5, 7]",
      title: "Basic Example",
      input: { limit: 10 },
      output: "[2, 3, 5, 7]",
      explanation: "Composite numbers 4, 6, 8, 9, 10 are eliminated, leaving 4 prime numbers.",
    },
    {
      kind: "complex",
      inputDisplay: "n = 30",
      outputDisplay: "[2, 3, 5, 7, 11, 13, 17, 19, 23, 29]",
      title: "Complex Edge Case",
      input: { limit: 30 },
      output: "[2, 3, 5, 7, 11, 13, 17, 19, 23, 29]",
      explanation: "Iteratively marks multiples of base primes 2, 3, and 5 up to sqrt(30) ~ 5.47.",
    },
    {
      kind: "negative",
      inputDisplay: "n = 1",
      outputDisplay: "[]",
      title: "Failing / Boundary Case",
      input: { limit: 1 },
      output: "[]",
      explanation: "Boundary input limit=1 contains no prime numbers since 0 and 1 are non-prime.",
    },
  ],
  code: PYTHON_SIEVE_CODE,
  timeComplexity: {
    best: "O(n log log n)",
    average: "O(n log log n)",
    worst: "O(n log log n)",
  },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "Crossing out multiples of prime $p$ costs $\\frac{n}{p}$ work. Summing $\\sum_{p \\le \\sqrt{n}} \\frac{n}{p}$ over all primes yields $n \\log \\log n$ work via Mertens' Theorem. Outer loop stops at $p^2 > n$.",
    space: "Requires boolean array vector of size $n+1$, taking $\\mathcal{O}(n)$ auxiliary space.",
  },
  topicGuide: SIEVE_PRIMES_TOPIC_GUIDE,
  trivia: SIEVE_PRIMES_TRIVIA,
  leetcode: {
    id: 204,
    url: "https://leetcode.com/problems/count-primes/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #204",
      leetcodeId: 204,
      url: "https://leetcode.com/problems/count-primes/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 21",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      section: "21.1 Primes and factors",
    },
  ],
  defaultInput: DEFAULT_SIEVE_INPUT,
  generateSteps: generateSieveSteps,
};

export default sievePrimes;
