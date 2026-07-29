import type { AlgorithmDefinition, AlgorithmStep, ElementState, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface GoldbachConjectureInput {
  n: number;
}

export const PYTHON_GOLDBACHCONJECTURE_CODE = `class Solution:
    def __init__(self):
        pass

    def findPrimePairs(self, n: int) -> list[list[int]]:
        if n < 4:
            return []
        is_prime = [True] * (n + 1)
        is_prime[0] = is_prime[1] = False
        p = 2
        while p * p <= n:
            if is_prime[p]:
                for i in range(p * p, n + 1, p):
                    is_prime[i] = False
            p += 1
        res = []
        for x in range(2, n // 2 + 1):
            if is_prime[x] and is_prime[n - x]:
                res.append([x, n - x])
        return res`;

export const DEFAULT_GOLDBACHCONJECTURE_INPUT: GoldbachConjectureInput = {
  n: 28,
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      narrative:
        "Goldbach's Strong Conjecture asserts that every even integer greater than 2 can be expressed as the sum of two prime numbers.",
      snapshot: {
        kind: "array" as const,
        name: "goldbach_conjecture_statement",
        mode: "box" as const,
        elements: [
          { id: "even_n", value: "Even n > 2", label: "Target Integer", state: "active" as const },
          {
            id: "sum_eq",
            value: "n = p1 + p2",
            label: "Goldbach Partition",
            state: "pivot" as const,
          },
          {
            id: "primes",
            value: "p1, p2 Prime",
            label: "Addend Constraint",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "For small even integers, Goldbach partitions are readily apparent: 4 = 2 + 2, 6 = 3 + 3, 10 = 3 + 7 = 5 + 5, and 28 = 5 + 23 = 11 + 17.",
      snapshot: {
        kind: "array" as const,
        name: "goldbach_examples",
        mode: "box" as const,
        elements: [
          { id: "ex4", value: "4 = 2 + 2", label: "Smallest Even", state: "sorted" as const },
          { id: "ex10", value: "10 = 3 + 7", label: "Multiple Pairs", state: "sorted" as const },
          { id: "ex28", value: "28 = 5 + 23", label: "Standard Target", state: "sorted" as const },
        ],
      },
    },
    {
      narrative:
        "To find a valid prime pair for even n, we iterate first candidate prime p1 from 2 up to n / 2, and calculate complement p2 = n - p1.",
      snapshot: {
        kind: "array" as const,
        name: "candidate_search",
        mode: "box" as const,
        elements: [
          {
            id: "p1_range",
            value: "p1 in [2, n/2]",
            label: "Candidate Search Range",
            state: "pivot" as const,
          },
          {
            id: "p2_calc",
            value: "p2 = n - p1",
            label: "Complement Addend",
            state: "compare" as const,
          },
        ],
      },
    },
    {
      narrative:
        "We test primality for both p1 and p2 using trial division in O(sqrt(n)) time or O(1) lookup with a precomputed prime sieve.",
      snapshot: {
        kind: "array" as const,
        name: "primality_check",
        mode: "box" as const,
        elements: [
          {
            id: "check_p1",
            value: "is_prime(p1)",
            label: "Check First Addend",
            state: "compare" as const,
          },
          {
            id: "check_p2",
            value: "is_prime(p2)",
            label: "Check Second Addend",
            state: "compare" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Symmetry implies that testing p1 beyond n / 2 is redundant, because any pair with p1 > n / 2 is simply a swapped duplicate of a pair where p1 <= n / 2.",
      snapshot: {
        kind: "array" as const,
        name: "symmetry_reduction",
        mode: "box" as const,
        elements: [
          {
            id: "bound",
            value: "Upper Bound: n / 2",
            label: "Search Boundary",
            state: "pivot" as const,
          },
          {
            id: "no_dups",
            value: "(p1, p2) == (p2, p1)",
            label: "Symmetric Pair",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "By Goldbach's conjecture, a valid prime pair exists for EVERY even integer n > 2, so the search loop is guaranteed to find a pair and terminate.",
      snapshot: {
        kind: "array" as const,
        name: "guaranteed_termination",
        mode: "box" as const,
        elements: [
          {
            id: "empiric",
            value: "Proven <= 4 * 10^18",
            label: "Empirical Bounds",
            state: "sorted" as const,
          },
          {
            id: "found",
            value: "Pair Always Exists",
            label: "Guaranteed Match",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "With a precomputed prime sieve up to n, finding a Goldbach pair takes O(1) average time due to high prime density, or O(n / log n) worst-case time.",
      snapshot: {
        kind: "array" as const,
        name: "search_complexity",
        mode: "box" as const,
        elements: [
          {
            id: "sieve_pre",
            value: "O(n log log n)",
            label: "Sieve Precomputation",
            state: "pivot" as const,
          },
          {
            id: "search_time",
            value: "O(1) Avg Time",
            label: "Pair Search",
            state: "sorted" as const,
          },
        ],
      },
    },
    {
      narrative:
        "Goldbach's Weak Conjecture (every odd number greater than 5 is the sum of three primes) was completely proven by Harald Helfgott in 2013.",
      snapshot: {
        kind: "array" as const,
        name: "weak_conjecture",
        mode: "box" as const,
        elements: [
          {
            id: "weak_stmt",
            value: "Odd n = p1 + p2 + p3",
            label: "3-Prime Sum",
            state: "sorted" as const,
          },
          {
            id: "proven",
            value: "Proven in 2013",
            label: "Helfgott Proof",
            state: "sorted" as const,
          },
        ],
      },
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: data.snapshot,
    }),
  );
};

export const generateGoldbachConjectureSteps = (
  input: GoldbachConjectureInput,
): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const rawInput = input as unknown;
  const n = Math.max(
    2,
    Math.floor(
      typeof rawInput === "number" ? rawInput : (input?.n ?? DEFAULT_GOLDBACHCONJECTURE_INPUT.n),
    ),
  );

  const isPrime = (x: number): boolean => {
    if (x < 2) return false;
    for (let i = 2; i * i <= x; i++) {
      if (x % i === 0) return false;
    }
    return true;
  };

  const getCompositeSnapshot = (
    candidateP1: number,
    candidateP2: number,
    p1IsPrime: boolean,
    p2IsPrime: boolean,
    statusLabel: string,
    foundPair?: [number, number],
  ) => {
    const p1State: ElementState = p1IsPrime ? "sorted" : "visited";
    const p2State: ElementState = p2IsPrime ? "sorted" : "visited";

    return {
      kind: "composite" as const,
      layout: "horizontal" as const,
      heading: `Goldbach Partition Search for even integer n = ${n}`,
      items: [
        {
          id: "candidate_panel",
          role: "primary" as const,
          snapshot: {
            kind: "array" as const,
            name: "current_candidate_pair",
            mode: "box" as const,
            elements: [
              { id: "target", value: n, label: "Target n", state: "active" as const },
              { id: "p1", value: candidateP1, label: "Candidate p1", state: p1State },
              { id: "p2", value: candidateP2, label: "Complement p2", state: p2State },
              { id: "status", value: statusLabel, label: "Pair Check", state: "compared" as const },
            ],
          },
        },
        {
          id: "result_panel",
          role: "auxiliary" as const,
          snapshot: {
            kind: "array" as const,
            name: "goldbach_result",
            mode: "box" as const,
            elements: foundPair
              ? [
                  { id: "res1", value: foundPair[0], label: "Prime p1", state: "sorted" as const },
                  { id: "res2", value: foundPair[1], label: "Prime p2", state: "sorted" as const },
                  {
                    id: "sum",
                    value: `${foundPair[0]} + ${foundPair[1]} = ${n}`,
                    label: "Verified Sum",
                    state: "pivot" as const,
                  },
                ]
              : [
                  {
                    id: "searching",
                    value: "Searching...",
                    label: "Goldbach Pair",
                    state: "default" as const,
                  },
                ],
          },
        },
      ],
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initializing Goldbach partition search for even integer n = ${n}. Candidate p1 loop range: [2, ${Math.floor(n / 2)}].`,
      primarySnapshot: getCompositeSnapshot(2, n - 2, isPrime(2), isPrime(n - 2), "Initializing"),
    }),
  );

  let foundP1 = -1;
  let foundP2 = -1;

  for (let p1 = 2; p1 <= Math.floor(n / 2); p1++) {
    const p2 = n - p1;
    const p1Prime = isPrime(p1);
    const p2Prime = isPrime(p2);

    if (!p1Prime) {
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Testing candidate p1 = ${p1}. Candidate p1 = ${p1} is composite (not prime), so candidate pair (${p1}, ${p2}) is rejected.`,
          primarySnapshot: getCompositeSnapshot(p1, p2, false, p2Prime, `p1=${p1} Composite`),
        }),
      );
    } else if (!p2Prime) {
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Testing candidate p1 = ${p1}. Candidate p1 = ${p1} is prime, but complement p2 = ${p2} is composite (not prime). Pair (${p1}, ${p2}) rejected.`,
          primarySnapshot: getCompositeSnapshot(p1, p2, true, false, `p2=${p2} Composite`),
        }),
      );
    } else {
      foundP1 = p1;
      foundP2 = p2;
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Testing candidate p1 = ${p1}. Both p1 = ${p1} and complement p2 = ${p2} are prime! Valid Goldbach partition found: ${p1} + ${p2} = ${n}.`,
          primarySnapshot: getCompositeSnapshot(p1, p2, true, true, "VALID PAIR!", [p1, p2]),
        }),
      );
      break;
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Goldbach partition search completed for n = ${n}: verified prime pair [${foundP1}, ${foundP2}].`,
      primarySnapshot: getCompositeSnapshot(foundP1, foundP2, true, true, "Completed", [
        foundP1,
        foundP2,
      ]),
    }),
  );

  return steps;
};

const GOLDBACHCONJECTURE_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Goldbach's Conjecture states that every even integer greater than 2 can be written as the sum of two prime numbers.</p>",
  sections: [
    {
      heading: "Intuition & Pair Partitioning",
      body: "<p>For any even integer <code>n</code>, splitting <code>n</code> into two addends <code>p1</code> and <code>p2 = n - p1</code> creates a search space bounded by <code>n / 2</code>. If both <code>p1</code> and <code>p2</code> pass primality testing, a valid Goldbach partition is confirmed.</p>",
    },
    {
      heading: "Search Mechanics & Prime Sieve Integration",
      body: "<p>Iterating <code>p1</code> from 2 to <code>n / 2</code> avoids duplicate swapped pairs. When combined with a precomputed Sieve of Eratosthenes up to <code>n</code>, primality queries take <strong>O(1)</strong> time, enabling near-instant partition discovery.</p>",
    },
    {
      heading: "Theoretical Bounds & Goldbach's Weak Conjecture",
      body: "<p>While Goldbach's Strong Conjecture remains unproven for all integers, it has been verified computationally up to 4 &times; 10<sup>18</sup>. Goldbach's Weak Conjecture (odd integers as the sum of three primes) was fully proven by Harald Helfgott in 2013.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Goldbach Partition",
      definition: "A pair of prime numbers (p1, p2) whose sum equals a given even integer n.",
    },
    {
      term: "Strong Goldbach Conjecture",
      definition: "Every even integer n > 2 is the sum of two primes.",
    },
    {
      term: "Complement Addend",
      definition: "The matching value p2 = n - p1 tested for primality.",
    },
  ],
};

const GOLDBACHCONJECTURE_TRIVIA: TriviaMeta = {
  lineExplanations: {
    15: "Iterate candidate p1 from 2 up to n // 2.",
    16: "Check if both p1 and its complement n - p1 are prime.",
    17: "Return the first valid prime pair found.",
  },
};

export const goldbachConjecture: AlgorithmDefinition<GoldbachConjectureInput> = {
  id: "goldbach-conjecture",
  title: "Goldbach's Conjecture",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Given an integer <code>n</code>, return every pair of prime numbers <code>[x, y]</code> such that <code>x + y = n</code> and <code>x &le; y</code>.</p><h3>Input Parameters</h3><ul><li><code>n</code>: Target sum.</li></ul><h3>Output Format</h3><ul><li><code>list[list[int]]</code>: All valid prime pairs in increasing order of their first value.</li></ul>",
  constraints: ["2 <= n <= 10^6"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Two Prime Pairs",
      inputDisplay: "n = 10",
      outputDisplay: "[[3, 7], [5, 5]]",
      input: { n: 10 },
      output: "[[3, 7], [5, 5]]",
      explanation: "Both 3 + 7 and 5 + 5 equal 10, and each addend is prime.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Smallest Target",
      inputDisplay: "n = 4",
      outputDisplay: "[[2, 2]]",
      input: { n: 4 },
      output: "[[2, 2]]",
      explanation: "The only prime pair that sums to 4 is [2, 2].",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "No Prime Pair",
      inputDisplay: "n = 2",
      outputDisplay: "[]",
      input: { n: 2 },
      output: "[]",
      explanation: "No pair of prime numbers sums to 2.",
    },
  ],
  code: PYTHON_GOLDBACHCONJECTURE_CODE,
  timeComplexity: {
    best: "O(n log log n)",
    average: "O(n log log n)",
    worst: "O(n log log n)",
  },
  spaceComplexity: "O(n)",
  complexityAnalysis: {
    time: "The sieve marks composites in O(n log log n) time, then one scan through candidates up to n / 2 collects every valid pair.",
    space: "The primality table uses O(n) space, in addition to the returned pairs.",
  },
  topicGuide: GOLDBACHCONJECTURE_TOPIC_GUIDE,
  trivia: GOLDBACHCONJECTURE_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 2761,
      leetcodeId: 2761,
      url: "https://leetcode.com/problems/prime-pairs-with-target-sum/",
      label: "LeetCode #2761",
      title: "Prime Pairs With Target Sum",
    },
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 21,
      chapterTitle: "Number Theory",
      section: "21.1 Primes and factors",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  leetcode: {
    id: 2761,
    url: "https://leetcode.com/problems/prime-pairs-with-target-sum/",
  },
  defaultInput: DEFAULT_GOLDBACHCONJECTURE_INPUT,
  generateSteps: generateGoldbachConjectureSteps,
};
