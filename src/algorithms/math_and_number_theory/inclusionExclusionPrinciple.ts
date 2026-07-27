import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface InclusionExclusionInput {
  n: number;
  primes: number[];
}

export const PYTHON_INCLUSION_EXCLUSION_CODE = `def get_mask_stats(mask: int, primes: list[int]) -> tuple[int, int]:
    prod, bits = 1, 0
    for i in range(len(primes)):
        if (mask >> i) & 1:
            prod *= primes[i]
            bits += 1
    return prod, bits

def inclusion_exclusion(n: int, primes: list[int]) -> int:
    k = len(primes)
    total_count = 0
    for mask in range(1, 1 << k):
        prod, bits = get_mask_stats(mask, primes)
        count = n // prod
        if bits % 2 == 1:
            total_count += count
        else:
            total_count -= count
    return total_count`;

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
  const primes = input.primes.length > 0 ? input.primes.map(p => Math.abs(Math.floor(p))) : [2, 3];
  const k = primes.length;

  let totalCount = 0;
  const subsetHistory: string[] = [];

  const makeElements = (activeMask: number, currentProd: number, sign: "+" | "-"): ArrayElement[] => {
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
          "Product": prod,
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
    "The Inclusion-Exclusion Principle (IEP) is a foundational counting technique in combinatorics and number theory. It computes the size of the union of multiple overlapping sets by alternating between adding the sizes of set intersections of odd cardinality and subtracting the sizes of set intersections of even cardinality.",
  sections: [
    {
      heading: "Why Alternating Sums Work",
      body: "If we simply sum the sizes of individual sets |A| + |B| + |C|, elements belonging to multiple sets are counted more than once. Subtracting pairwise intersections |A ∩ B| corrects pairwise overlaps but over-subtracts triple overlaps |A ∩ B ∩ C|. Adding back triple intersections fixes the counts for all elements.",
    },
    {
      heading: "Bitmask Generation of Subsets",
      body: "For k prime factors or conditions, there are 2^k - 1 non-empty subsets. Using integer bitmasks from 1 to 2^k - 1 lets us efficiently iterate over every subset, compute the product of selected primes, and alternate signs based on popcount.",
    },
  ],
  keyTerms: [
    {
      term: "Bitmask",
      definition: "An integer representation where the i-th bit indicates whether the i-th prime is included in the current subset.",
    },
    {
      term: "Parity / Popcount",
      definition: "The number of set bits in the bitmask determines whether the subset intersection size is added (+ for odd) or subtracted (- for even).",
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
  difficulty: "Medium",
  description:
    "Count elements in the union of multiple sets by alternating sums of set intersections for all sub-collections.",
  constraints: [
    "1 <= n <= 10^9",
    "1 <= primes.length <= 10",
    "2 <= primes[i] <= 10^5",
  ],
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

