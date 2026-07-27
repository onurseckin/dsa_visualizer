import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface InclusionExclusionInput {
  n: number;
  primes: number[];
}

export const PYTHON_INCLUSION_EXCLUSION_CODE = `
def inclusion_exclusion(n: int, primes: list[int]) -> int:
    """
    Computes the count of integers in [1, n] divisible by at least one prime in primes.
    """
    k = len(primes)
    total_count = 0
    for mask in range(1, 1 << k):
        prod = 1
        bits = 0
        for i in range(k):
            if (mask >> i) & 1:
                prod *= primes[i]
                bits += 1
        count = n // prod
        if bits % 2 == 1:
            total_count += count
        else:
            total_count -= count
    return total_count
`;

export const DEFAULT_INCLUSION_EXCLUSION_INPUT: InclusionExclusionInput = {
  n: 30,
  primes: [2, 3, 5],
};

export const generateInclusionExclusionSteps = (
  input: InclusionExclusionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const n = Math.max(1, Math.floor(input.n));
  const primes =
    input.primes.length > 0 ? input.primes.map((p) => Math.abs(Math.floor(p))) : [2, 3];
  const k = primes.length;

  let totalCount = 0;
  const subsetHistory: string[] = [];

  const makeElements = (
    activeMask: number,
    currentProd: number,
    sign: "+" | "-",
  ): ArrayElement[] => {
    const elts: ArrayElement[] = primes.map((p, idx) => {
      const isSelected = ((activeMask >> idx) & 1) === 1;
      return {
        id: `prime-${idx}`,
        value: p,
        state: isSelected ? (sign === "+" ? "active" : "swap") : "default",
        pointers: isSelected ? [`P${idx + 1}`] : [],
      };
    });

    elts.push({
      id: "term-prod",
      value: currentProd,
      state: "compare",
      pointers: ["Prod"],
    });

    elts.push({
      id: "total-count",
      value: totalCount,
      state: "sorted",
      pointers: ["Total"],
    });

    return elts;
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 9,
    explanation: {
      what: `Initializing Inclusion-Exclusion for N = ${n} and ${k} primes: [${primes.join(", ")}].`,
      why: "The principle counts numbers in [1, N] divisible by at least one prime by summing sizes of odd-sized intersections and subtracting even-sized intersections.",
    },
    primarySnapshot: {
      kind: "array",
      elements: makeElements(0, 1, "+"),
    },
    auxiliaryState: {
      hashMap: {
        "Target Limit (N)": n,
        "Primes Count": k,
        "Total Divisible": 0,
      },
      visited: [],
    },
    variables: { n, k, total_count: 0 },
  });

  const totalSubsets = (1 << k) - 1;
  for (let mask = 1; mask <= totalSubsets; mask++) {
    let prod = 1;
    let bits = 0;
    const selectedPrimes: number[] = [];

    for (let i = 0; i < k; i++) {
      if ((mask >> i) & 1) {
        prod *= primes[i];
        bits++;
        selectedPrimes.push(primes[i]);
      }
    }

    const count = Math.floor(n / prod);
    const sign: "+" | "-" = bits % 2 === 1 ? "+" : "-";

    if (bits % 2 === 1) {
      totalCount += count;
    } else {
      totalCount -= count;
    }

    const subsetStr = `{${selectedPrimes.join(", ")}} (prod=${prod}) => count = floor(${n}/${prod}) = ${count} [${sign}${count}]`;
    subsetHistory.push(subsetStr);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 14,
      explanation: {
        what: `Subset ${subsetHistory.length}/${totalSubsets}: ${selectedPrimes.join(" x ")} = ${prod}. Divisible count: ${n} // ${prod} = ${count}.`,
        why: `Subset size is ${bits} (${bits % 2 === 1 ? "odd" : "even"}), so we ${bits % 2 === 1 ? "ADD" : "SUBTRACT"} ${count} to/from total. New total = ${totalCount}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: makeElements(mask, prod, sign),
      },
      auxiliaryState: {
        hashMap: {
          "Current Subset": selectedPrimes.join(" × "),
          Product: prod,
          "Divisibles Count": count,
          "Sign Operation": sign,
          "Running Total": totalCount,
        },
        visited: [...subsetHistory],
      },
      variables: {
        mask,
        prod,
        bits,
        count,
        total_count: totalCount,
      },
    });
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: `Completed Inclusion-Exclusion Principle evaluation. Total integers in [1, ${n}] divisible by at least one of [${primes.join(", ")}] = ${totalCount}.`,
      why: "Evaluated all 2^k - 1 non-empty set intersections with alternating signs.",
    },
    primarySnapshot: {
      kind: "array",
      elements: makeElements(0, 1, "+"),
    },
    auxiliaryState: {
      hashMap: {
        "Final Result": totalCount,
      },
      visited: [...subsetHistory],
    },
    variables: { total_count: totalCount },
  });

  return steps;
};

const INCLUSION_EXCLUSION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "The Inclusion-Exclusion Principle (IEP) is a foundational counting technique in combinatorics and probability. It computes the size of the union of multiple overlapping sets by alternating between adding the sizes of set intersections of odd cardinality and subtracting the sizes of set intersections of even cardinality: |U A_i| = sum |A_i| - sum |A_i ∩ A_j| + sum |A_i ∩ A_j ∩ A_k| - ...",
  sections: [
    {
      heading: "Why Alternating Sums Work",
      body: "If we simply sum the individual set sizes |A| + |B| + |C|, any element belonging to multiple sets is overcounted. Subtracting pairwise intersections |A ∩ B| corrects pairwise overlaps but over-subtracts elements in three sets. Adding back triple intersections |A ∩ B ∩ C| fixes triple overlaps. In general, an element belonging to exactly m sets is counted C(m,1) - C(m,2) + C(m,3) - ... = 1 times.",
    },
    {
      heading: "Bitmask Subset Iteration",
      body: "For k prime factors or properties, there are 2^k - 1 non-empty subsets. Using integer bitmasks from 1 to 2^k - 1 lets us efficiently iterate over every subset of conditions. The set bits specify which primes to multiply together, and popcount parity decides whether to add (odd set bits) or subtract (even set bits) floor(N / product).",
    },
    {
      heading: "Systems & Real-World Applications",
      body: "Inclusion-Exclusion powers major algorithms: 1) Derangements (counting permutations with no fixed points), 2) Co-primality counting (finding how many integers in [1, N] are coprime to a given integer), 3) Graph Coloring (computing chromatic polynomials), and 4) Database Query Optimization (estimating union selectivity across overlapping attribute indexes).",
    },
    {
      heading: "Complexity & Subgroup Limits",
      body: "Bitmask evaluation runs in O(2^k) time where k is the number of sets/primes. For k <= 20, 2^k = 1,048,576 operations run in milliseconds. When k > 30, fast Möbius inversion on posets or SOS DP (Sum Over Subsets) is required to optimize subset combinations.",
    },
  ],
  keyTerms: [
    {
      term: "Union of Sets",
      definition:
        "The set containing all elements belonging to at least one of the component sets.",
    },
    {
      term: "Bitmask Subset Generation",
      definition:
        "Using binary representations of integers from 1 to 2^k - 1 to represent all non-empty subsets of k items.",
    },
    {
      term: "Popcount Parity",
      definition:
        "The number of 1-bits in a binary mask, determining whether the term is added (+ for odd) or subtracted (- for even).",
    },
  ],
};

const INCLUSION_EXCLUSION_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Helper get_mask_stats computes product of selected primes and bit count.",
    9: "Defines inclusion_exclusion(n, primes) -> int.",
    10: "Store number of primes in variable k.",
    11: "Initialize total_count = 0.",
    12: "Iterate through all non-empty subsets using bitmask 1 to (1 << k) - 1.",
    13: "Compute subset product and set bits count using helper function.",
    14: "Compute count = n // prod (multiples of prod in [1, n]).",
    15: "Check if set bits count is odd.",
    16: "Add count if bits count is odd.",
    18: "Subtract count if bits count is even.",
    19: "Return final count of numbers divisible by at least one prime.",
  },
};

export const inclusionExclusionPrinciple: AlgorithmDefinition<InclusionExclusionInput> = {
  id: "inclusion-exclusion-principle",
  title: "Inclusion-Exclusion Principle",
  category: "math_and_number_theory",
  categories: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "Given a target integer n and a list of k prime numbers, compute the total count of integers in the range [1, n] that are divisible by at least one of the given primes. The algorithm iterates over all 2^k - 1 non-empty subsets of primes using bitmasks, alternating between adding odd-sized intersection counts and subtracting even-sized intersection counts.",
  constraints: ["1 <= n <= 10^9", "1 <= primes.length <= 10", "2 <= primes[i] <= 10^5"],
  examples: [
    {
      kind: "basic",
      title: "Small primes under 30",
      input: { n: 30, primes: [2, 3, 5] },
      output: "22",
      explanation: "22 numbers in [1, 30] are divisible by 2, 3, or 5.",
    },
    {
      kind: "complex",
      title: "Four prime factors up to 100",
      input: { n: 100, primes: [2, 3, 5, 7] },
      output: "78",
      explanation: "78 numbers in [1, 100] are divisible by at least one of 2, 3, 5, or 7.",
    },
    {
      kind: "negative",
      title: "Primes exceeding range",
      input: { n: 10, primes: [11, 13] },
      output: "0",
      explanation: "No numbers in [1, 10] are divisible by 11 or 13.",
    },
  ],
  code: PYTHON_INCLUSION_EXCLUSION_CODE,
  timeComplexity: {
    best: "O(2^k)",
    average: "O(2^k)",
    worst: "O(2^k)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Evaluating all subsets of k prime factors takes O(2^k) operations.",
    space: "Requires only O(1) auxiliary variables for bit manipulation.",
  },
  topicGuide: INCLUSION_EXCLUSION_TOPIC_GUIDE,
  trivia: INCLUSION_EXCLUSION_TRIVIA,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 22",
      label: "Competitive Programmer's Handbook, Ch 22",
    },
  ],
  defaultInput: DEFAULT_INCLUSION_EXCLUSION_INPUT,
  generateSteps: generateInclusionExclusionSteps,
};
