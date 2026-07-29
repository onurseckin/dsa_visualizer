import type { AlgorithmDefinition } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { PYTHON_SIEVE_CODE } from "./pythonCode";
import { generateSieveSteps, type SieveInput } from "./stepGenerator";

export const DEFAULT_SIEVE_INPUT: SieveInput = {
  limit: 30,
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
    "<p>The Sieve of Eratosthenes is an ancient algorithm for finding all prime numbers up to a given limit <code>n</code>. Instead of testing numbers individually via trial division in <span>O(n &radic;n)</span> time, it crosses out multiples of each discovered prime <code>p</code> starting from <code>p&sup2;</code>, leaving only primes standing in nearly linear time: <span>O(n log log n)</span>.</p>" +
    "<h3>Primality State Vector</h3>" +
    "<p>The primality status is recorded in state vector <code>v</code> of size <code>n + 1</code> where <code>v[i] = 1</code> indicates <code>i</code> is prime and <code>v[i] = 0</code> indicates <code>i</code> is composite.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>limit</code> (<code>n &ge; 0</code>): Upper bound inclusive limit.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>list[int]</code>: List of all prime numbers <code>p &le; n</code>.</li></ul>" +
    "" +
    "<ul><li><code>limit &lt; 2</code>: Returns empty list <code>[]</code>.</li>" +
    "<li>Large <code>limit</code>: Memory scales linearly with limit <span>O(n)</span>.</li></ul>",
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
  topicGuide: {
    overview:
      "<p>A sieve is a table-building technique: instead of answering a question about one number, you answer it about every number in a range <code>[0, n]</code> at once by letting each fact propagate to the values it affects. The Sieve of Eratosthenes is the original and still the most useful instance, finding all primes up to a limit <code>n</code> by crossing out multiples rather than testing candidates. Reach for it whenever a problem needs the primes in a range, or needs some multiplicative fact about every number in a range, because the sieve turns per-number work into shared work. It is also the gateway to a whole family of relatives that compute factorizations, divisor counts, and totients with the same skeleton.</p>",
    sections: [
      {
        heading: "Elimination instead of testing",
        body: "<p>The direct way to list primes up to <code>n</code> is to test each candidate separately using trial division up to <code>&radic;n</code>, costing <span>O(n &radic;n)</span> work overall with nothing carried over between candidates. The sieve inverts the question. Since every composite number <code>m &le; n</code> has at least one prime factor <code>p &le; &radic;m</code>, if you take each prime in turn and cross out all of its multiples, then every composite is guaranteed to be struck at least once, and whatever is never struck cannot be composite. The data structure is a boolean vector <code>v</code> indexed directly by the integers, making state lookups <span>O(1)</span>.</p>",
      },
      {
        heading: "Optimization using the square root bound",
        body: "<p>You begin optimistically, setting <code>v[i] = 1</code> for all <code>0 &le; i &le; n</code>, then immediately correct the two non-prime exceptions <code>v[0] = v[1] = 0</code>. The outer loop walks candidate <code>p</code> upward. When it finds <code>v[p] = 1</code>, <code>p</code> is prime. The inner loop flags <code>p&sup2;, p&sup2; + p, p&sup2; + 2p, &hellip; &le; n</code> as composite. The outer loop can safely stop once <code>p&sup2; &gt; n</code>, because any composite <code>m &le; n</code> must have a prime factor <code>p &le; &radic;n</code>. The inner loop starts at <code>p&sup2;</code> because any smaller multiple <code>k &middot; p</code> with <code>k &lt; p</code> already carries a prime factor smaller than <code>p</code> and was crossed out in an earlier sweep.</p>",
      },
      {
        heading: "Mathematical time complexity derivation",
        body: "<p>The total number of elimination operations performed by the inner loops across all base primes <code>p &le; &radic;n</code> is proportional to <code>n &sum; (1 / p)</code> over all <code>p &le; &radic;n</code>. By Mertens' Second Theorem, the sum of the reciprocals of prime numbers up to <code>x</code> grows as <code>ln ln x + M</code>. Thus, the overall time complexity is <span>O(n log log n)</span>, which is nearly linear in <code>n</code>.</p>",
      },
      {
        heading: "When to sieve and when to test a single number",
        body: "<p>Sieving is optimal when finding all primes in range <code>[0, n]</code>, precomputing Smallest Prime Factors (SPF) for fast <span>O(log n)</span> factorization queries, or computing multiplicative functions over a range. It is sub-optimal for deciding the primality of a single massive candidate (where Miller-Rabin probabilistic test takes <span>O(k log&sup3; n)</span> time without allocating <span>O(n)</span> memory). For large but narrow ranges <code>[L, R]</code>, a Segmented Sieve sieves a window of size <code>R - L + 1</code> using base primes up to <code>&radic;R</code>, reducing space to <span>O(&radic;R + (R - L))</span>.</p>",
      },
      {
        heading: "Pitfalls and edge cases",
        body: "<p>Size the array as <code>n + 1</code> because indexing is 0-based and <code>n</code> is inclusive. The base cases <code>v[0] = v[1] = 0</code> must be set explicitly. For large bounds, calculating <code>p &middot; p</code> can overflow standard 32-bit integers, so use <code>p &le; n / p</code> or <code>p &le; &lfloor;&radic;n&rfloor;</code>. Starting the inner loop at <code>2p</code> instead of <code>p&sup2;</code> is redundant (though correct), while starting after <code>p&sup2;</code> misses composites.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Composite number",
        definition:
          "An integer m > 1 that is the product of two smaller integers, having at least one prime factor p <= sqrt(m).",
      },
      {
        term: "Base prime",
        definition:
          "A prime p discovered by the outer loop and used to eliminate its multiples p², p(p+1), ... Only primes p <= sqrt(n) serve as base primes.",
      },
      {
        term: "Square root bound",
        definition:
          "The mathematical principle that if m is composite, it must have a factor <= sqrt(m). Thus, outer loops terminate at p² > n.",
      },
      {
        term: "Smallest Prime Factor (SPF)",
        definition:
          "A sieve variation storing the smallest prime factor for each integer i, enabling complete prime factorization in O(log n) steps.",
      },
    ],
  },
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
