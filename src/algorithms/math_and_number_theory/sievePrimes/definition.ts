import type { AlgorithmDefinition, TopicGuide } from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { PYTHON_SIEVE_CODE } from "./pythonCode";
import { generateSieveSteps, type SieveInput } from "./stepGenerator";

export const DEFAULT_SIEVE_INPUT: SieveInput = {
  limit: 30,
};

const SIEVE_PRIMES_TOPIC_GUIDE: TopicGuide = {
  overview:
    "A sieve is a table-building technique: instead of answering a question about one number, you answer it about every number in a range at once by letting each fact propagate to the values it affects. The Sieve of Eratosthenes is the original and still the most useful instance, finding all primes up to a limit by crossing out multiples rather than testing candidates. Reach for it whenever a problem needs the primes in a range, or needs some multiplicative fact about every number in a range, because the sieve turns per-number work into shared work. It is also the gateway to a whole family of relatives that compute factorizations, divisor counts, and totients with the same skeleton.",
  sections: [
    {
      heading: "Elimination instead of testing",
      body: "The direct way to list primes is to test each number separately, trying divisors up to its square root, and that costs real work for every single candidate with nothing carried over between them. The sieve inverts the question. Since every composite number has at least one prime factor, if you take each prime in turn and cross out all of its multiples, then every composite is guaranteed to be struck at least once, and whatever is never struck cannot be composite. So you never ask whether a number is prime; you let the crossing out answer it for you. The data structure is deliberately trivial, one boolean flag per number indexed by the number itself, and that indexing is what makes the sharing possible.",
    },
    {
      heading: "How the crossing out actually runs",
      body: "You begin optimistic, marking every entry from 0 to the limit as prime, then immediately correct the two exceptions by flagging 0 and 1 as not prime. The outer loop walks a candidate p upward, and when it finds an entry still marked prime it treats p as a base prime and runs an inner loop that flags p times p, then p times p plus p, and so on up to the limit. Two refinements matter, and both come from the same observation about factor sizes. The outer loop can stop as soon as p times p exceeds the limit, because any composite in range must already have been hit by a factor no bigger than its own square root. The inner loop can start at p times p rather than at twice p, because a smaller multiple k times p with k less than p carries the prime factor of k, so it was already crossed out during an earlier base prime.",
    },
    {
      heading: "Why the survivors are exactly the primes",
      body: "The invariant to hold in your head is that by the time the outer loop reaches candidate p, every composite number possessing a prime factor smaller than p has already been marked as not prime. That single statement carries both halves of the correctness argument. First, it means that when you reach p and find it still marked, no smaller number divides it, so p must itself be prime and deserves to become a base prime, which is why the sieve needs no primality test at all. Second, it means that once p times p exceeds the limit you can stop safely, because any still-marked value m in range would, if composite, have a prime factor no larger than the square root of m and hence smaller than p, and the invariant says such a value would already have been struck. Termination is obvious since both loops only ever increase, and repeated marking of an already-marked entry is harmless, which is why the inner loop needs no membership check.",
    },
    {
      heading: "When to sieve and when to test a single number",
      body: "Sieving is the right choice when the range is the point: you need all primes up to a bound, you need to factor many numbers quickly, or you need a per-number quantity like the count of divisors for every value in the range. It is the wrong choice for deciding the primality of one enormous number, where a probabilistic test such as Miller-Rabin gives an answer in a handful of modular exponentiations without touching memory proportional to the value. When the range is high but narrow, say primes between two large bounds, the segmented sieve keeps only a window in memory and sieves it using base primes up to the square root of the upper bound. And if you need each composite touched exactly once, or want the smallest prime factor of every number as a by-product, the linear sieve is a small extra amount of bookkeeping that pays for itself.",
    },
    {
      heading: "Pitfalls and edge cases",
      body: "Size the array as limit plus 1, because here the index is the number and off-by-one errors silently drop the largest value from the answer. The definitional cases must be written explicitly, since 0 and 1 are not prime yet start out marked, and any limit below 2 has to return an empty result rather than falling into the loops. In fixed-width languages, comparing p times p against the limit can overflow for large limits, so it is safer to compare p against the limit divided by p or to loop while p is at most the integer square root. Starting the inner loop at twice p instead of p squared is not wrong but wastes a noticeable fraction of the work, and conversely starting after p squared is a genuine bug. Finally, remember that the memory cost is proportional to the limit and not to the number of primes found, which is what eventually caps how far a plain sieve can reach.",
    },
    {
      heading: "Variants built on the same skeleton",
      body: "Swap the boolean for an integer and store, for each composite, the smallest prime that struck it, and you get a table that factors any number in the range in as many steps as it has prime factors. Change what the inner loop does from marking to accumulating and you get the divisor sieve: for every d, add one to every multiple of d, and each slot ends up holding its divisor count, with the same loop shape yielding sums of divisors or the Euler totient of every number. The Möbius function and other multiplicative functions fall out the same way, which is why competitive problems about counting pairs by their greatest common divisor so often begin with a sieve. The transferable pattern is the phrase for each d, touch every multiple of d, and once you recognise it you will see that the harmonic sum it induces is what keeps these sweeps nearly linear.",
    },
  ],
  keyTerms: [
    {
      term: "Composite number",
      definition:
        "An integer greater than 1 that is the product of two smaller integers, so it has a divisor other than 1 and itself. Every composite has at least one prime factor, which is the fact the sieve exploits.",
    },
    {
      term: "Base prime",
      definition:
        "A prime discovered by the outer loop and then used to cross out its own multiples. Only base primes up to the square root of the limit are ever needed.",
    },
    {
      term: "Square root bound",
      definition:
        "The observation that a composite number always has a prime factor no larger than its square root. It is the reason the outer loop may stop once p squared passes the limit.",
    },
    {
      term: "Segmented sieve",
      definition:
        "A variant that sieves one window of the number line at a time using precomputed base primes, so the memory used depends on the window size rather than the upper bound. It is how you find primes in a high, narrow interval.",
    },
    {
      term: "Smallest prime factor table",
      definition:
        "A sieve that records which prime first struck each composite instead of a plain boolean. With it, factoring any number in the range becomes a short chain of table lookups.",
    },
  ],
};

const SIEVE_PRIMES_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines the function signature: it takes a limit and returns every prime number up to and including it.",
    2: "Guards the trivial case — the smallest prime is 2, so any limit below that can never contain one.",
    3: "Short-circuits with an empty list when no prime can possibly exist below the limit.",
    5: "Allocates one boolean flag per integer from 0 to limit, optimistically marking every number as a candidate prime.",
    6: "Manually excludes 0 and 1, which are not prime by definition but would otherwise stay marked True from the previous line.",
    8: "Starts the elimination sweep at the smallest prime, 2 — everything from here on is either a base prime or already crossed out by one.",
    9: "Stops the outer loop once p squared exceeds limit, because any composite that size must already have a factor no larger than its own square root, so it would already be marked.",
    10: "Only treats p as a base prime if nothing smaller has crossed it out yet — an unmarked number this far in must be prime.",
    11: "Walks p's multiples starting at p squared rather than 2p, since every smaller multiple already carries a smaller prime factor and was eliminated earlier.",
    12: "Marks each of those multiples as composite, since a number with a factor of p greater than 1 can never be prime.",
    13: "Advances to the next candidate regardless of whether p turned out to be prime, keeping the outer sweep moving.",
    15: "Prepares the output list that will collect every surviving (still-True) index.",
    16: "Sweeps every number from 2 through limit to harvest the final results.",
    17: "Only numbers that were never crossed out qualify — anything still True is prime.",
    18: "Records i as one of the discovered primes.",
    20: "Returns the completed list of primes up to limit.",
  },
};

export const sievePrimes: AlgorithmDefinition<SieveInput> = {
  id: "sieve-primes",
  title: "Sieve of Eratosthenes",
  category: "math_and_number_theory",
  difficulty: "Easy",
  description:
    "The Sieve of Eratosthenes is an ancient algorithm for finding all prime numbers up to a given limit. Instead of testing numbers individually, it crosses out the multiples of each discovered prime (starting from p²), leaving only primes standing — in nearly linear O(n log log n) time.",
  constraints: ["0 <= limit <= 10^5"],
  examples: [
    {
      input: "limit = 10",
      output: "[2, 3, 5, 7]",
      explanation: "Composite numbers 4, 6, 8, 9, 10 are eliminated, leaving primes 2, 3, 5, 7.",
    },
    {
      input: "limit = 30",
      output: "[2, 3, 5, 7, 11, 13, 17, 19, 23, 29]",
      explanation: "Iteratively marks multiples of 2, 3, 5 up to sqrt(30) ~ 5.",
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
    time: "Crossing out the multiples of a prime p costs about n/p work, so the total is n/2 + n/3 + n/5 + … taken over only the primes, and that sum famously grows as n log log n — barely worse than a single linear pass. We also stop taking new base primes once p² exceeds n, so most numbers are never used as a base at all; they just get crossed out once or twice.",
    space:
      "The boolean array keeps one flag per number from 0 to n, so memory grows linearly with the limit — O(n). The final list of primes is smaller and fits within that same bound.",
  },
  topicGuide: SIEVE_PRIMES_TOPIC_GUIDE,
  trivia: SIEVE_PRIMES_TRIVIA,
  defaultInput: DEFAULT_SIEVE_INPUT,
  generateSteps: generateSieveSteps,
};

export default sievePrimes;
