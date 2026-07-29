import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface InclusionExclusionInput {
  n: number;
  primes: number[];
}

export const PYTHON_INCLUSION_EXCLUSION_CODE = `import math

class Solution:
    def __init__(self):
        pass

    def nthUglyNumber(self, n: int, a: int, b: int, c: int) -> int:
        ab = (a * b) // math.gcd(a, b)
        bc = (b * c) // math.gcd(b, c)
        ac = (a * c) // math.gcd(a, c)
        abc = (a * bc) // math.gcd(a, bc)

        def count(m: int) -> int:
            return m // a + m // b + m // c - m // ab - m // bc - m // ac + m // abc

        left, right = 1, 2 * 10**9
        while left < right:
            mid = (left + right) // 2
            if count(mid) < n:
                left = mid + 1
            else:
                right = mid
        return left`;

export const DEFAULT_INCLUSION_EXCLUSION_INPUT: InclusionExclusionInput = {
  n: 30,
  primes: [2, 3, 5],
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introRows = [
    [["001", "{2}", 2, 15, "+", 15]],
    [
      ["001", "{2}", 2, 15, "+", 15],
      ["010", "{3}", 3, 10, "+", 25],
    ],
    [
      ["001", "{2}", 2, 15, "+", 15],
      ["010", "{3}", 3, 10, "+", 25],
      ["011", "{2,3}", 6, 5, "-", 20],
    ],
    [
      ["001", "{2}", 2, 15, "+", 15],
      ["010", "{3}", 3, 10, "+", 25],
      ["011", "{2,3}", 6, 5, "-", 20],
      ["100", "{5}", 5, 6, "+", 26],
    ],
    [
      ["001", "{2}", 2, 15, "+", 15],
      ["010", "{3}", 3, 10, "+", 25],
      ["011", "{2,3}", 6, 5, "-", 20],
      ["100", "{5}", 5, 6, "+", 26],
      ["101", "{2,5}", 10, 3, "-", 23],
    ],
    [
      ["001", "{2}", 2, 15, "+", 15],
      ["010", "{3}", 3, 10, "+", 25],
      ["011", "{2,3}", 6, 5, "-", 20],
      ["100", "{5}", 5, 6, "+", 26],
      ["101", "{2,5}", 10, 3, "-", 23],
      ["110", "{3,5}", 15, 2, "-", 21],
    ],
    [
      ["001", "{2}", 2, 15, "+", 15],
      ["010", "{3}", 3, 10, "+", 25],
      ["011", "{2,3}", 6, 5, "-", 20],
      ["100", "{5}", 5, 6, "+", 26],
      ["101", "{2,5}", 10, 3, "-", 23],
      ["110", "{3,5}", 15, 2, "-", 21],
      ["111", "{2,3,5}", 30, 1, "+", 22],
    ],
    [
      ["001", "{2}", 2, 15, "+", 15],
      ["010", "{3}", 3, 10, "+", 25],
      ["011", "{2,3}", 6, 5, "-", 20],
      ["100", "{5}", 5, 6, "+", 26],
      ["101", "{2,5}", 10, 3, "-", 23],
      ["110", "{3,5}", 15, 2, "-", 21],
      ["111", "{2,3,5}", 30, 1, "+", 22],
      ["All", "Union", 30, 22, "=", 22],
    ],
    [
      ["001", "{2}", 2, 15, "+", 15],
      ["010", "{3}", 3, 10, "+", 25],
      ["011", "{2,3}", 6, 5, "-", 20],
      ["100", "{5}", 5, 6, "+", 26],
      ["101", "{2,5}", 10, 3, "-", 23],
      ["110", "{3,5}", 15, 2, "-", 21],
      ["111", "{2,3,5}", 30, 1, "+", 22],
      ["All", "Union", 30, 22, "=", 22],
    ],
  ];

  const introNarratives = [
    "The Inclusion-Exclusion Principle calculates the cardinality of the union of overlapping sets by systematically alternating addition and subtraction.",
    "Simply adding individual set sizes double-counts elements shared between sets, producing a count that exceeds the true union size.",
    "To correct overcounting, we add single set sizes, subtract pairwise intersections, add triple intersections, and alternate signs based on subset size.",
    "We iterate binary bitmasks from 1 to 2^k - 1, where each bit position indicates inclusion or exclusion of the corresponding prime factor.",
    "For distinct prime factors, the least common multiple of a prime subset equals the product of its elements.",
    "The floor division count = floor(n / prod) calculates how many integers in 1..n are divisible by all primes in the current subset.",
    "Subsets containing an odd number of prime factors are added (+), while subsets containing an even number of prime factors are subtracted (-).",
    "After processing all 2^k - 1 non-empty subsets, every element in the set union has been counted with a net weight of exactly 1.",
    "The Inclusion-Exclusion algorithm evaluates all 2^k - 1 non-empty subsets in O(2^k * k) time using O(1) auxiliary space.",
  ];

  return introNarratives.map((narrative, idx) => {
    const mat = introRows[idx];
    const cells: MatrixCellItem[] = mat.flatMap((row, rIdx) =>
      row.map((val, cIdx) => ({
        row: rIdx,
        col: cIdx,
        value: val,
        label: `r${rIdx}c${cIdx}`,
        state:
          idx === 8
            ? ("sorted" as const)
            : rIdx === mat.length - 1
              ? ("active" as const)
              : ("default" as const),
      })),
    );

    return createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative,
      primarySnapshot: {
        kind: "matrix",
        name: "iep_concept",
        rows: mat.length,
        cols: 6,
        cells,
        rowHeaders: mat.map((_, r) => `Sub #${r + 1}`),
        colHeaders: ["Bitmask", "Primes", "Product", "Count", "Sign", "Total"],
      },
    });
  });
};

export const generateInclusionExclusionSteps = (
  input: InclusionExclusionInput,
): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const n =
    input && typeof input.n === "number" && input.n > 0
      ? Math.floor(input.n)
      : DEFAULT_INCLUSION_EXCLUSION_INPUT.n;
  const primes =
    input && Array.isArray(input.primes) && input.primes.length > 0
      ? input.primes.map((p) => Math.abs(Math.floor(p)))
      : DEFAULT_INCLUSION_EXCLUSION_INPUT.primes;
  const k = primes.length;

  let totalCount = 0;
  const subsetRecords: {
    mask: number;
    label: string;
    prod: number;
    count: number;
    sign: "+" | "-";
    total: number;
  }[] = [];

  const createMatrixSnapshot = (activeMask?: number, isDone: boolean = false) => {
    const cells: MatrixCellItem[] = [];
    const rows = subsetRecords.map((r) => ({ ...r }));

    rows.forEach((rec, idx) => {
      const isCurrentActive = rec.mask === activeMask;
      const vals = [
        rec.mask.toString(2).padStart(k, "0"),
        rec.label,
        rec.prod,
        rec.count,
        rec.sign,
        rec.total,
      ];
      vals.forEach((val, c) => {
        cells.push({
          row: idx,
          col: c,
          value: val,
          label: `r${idx}c${c}`,
          state: isDone ? "sorted" : isCurrentActive ? "active" : "default",
        });
      });
    });

    return {
      kind: "matrix" as const,
      name: "iep_matrix",
      rows: Math.max(1, rows.length),
      cols: 6,
      cells,
      rowHeaders: rows.map((_, idx) => `Sub #${idx + 1}`),
      colHeaders: ["Bitmask", "Primes", "Product", "Count", "Sign", "Total"],
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize Inclusion-Exclusion setup for N = ${n} over prime set [${primes.join(", ")}].`,
      primarySnapshot: createMatrixSnapshot(),
    }),
  );

  const totalSubsets = (1 << k) - 1;
  for (let mask = 1; mask <= totalSubsets; mask++) {
    let prod = 1;
    let bits = 0;
    const selectedPrimes: number[] = [];

    for (let i = 0; i < k; i++) {
      if (((mask >> i) & 1) === 1) {
        prod *= primes[i];
        selectedPrimes.push(primes[i]);
        bits++;
      }
    }

    const count = Math.floor(n / prod);
    const sign: "+" | "-" = bits % 2 === 1 ? "+" : "-";

    if (bits % 2 === 1) {
      totalCount += count;
    } else {
      totalCount -= count;
    }

    subsetRecords.push({
      mask,
      label: `{${selectedPrimes.join(", ")}}`,
      prod,
      count,
      sign,
      total: totalCount,
    });

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Bitmask ${mask.toString(2).padStart(k, "0")} ({${selectedPrimes.join(", ")}}): product ${prod}, count floor(${n} / ${prod}) = ${count}, sign ${sign}. Running total = ${totalCount}.`,
        primarySnapshot: createMatrixSnapshot(mask),
      }),
    );
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Inclusion-Exclusion calculation complete: exactly ${totalCount} integers in [1, ${n}] are divisible by at least one prime in [${primes.join(", ")}].`,
      primarySnapshot: createMatrixSnapshot(undefined, true),
    }),
  );

  return steps;
};

export const INCLUSION_EXCLUSION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The Inclusion-Exclusion Principle computes the cardinality of the union of overlapping sets by alternating addition and subtraction based on subset parity.</p>",
  sections: [
    {
      heading: "Alternating Sum Mechanism",
      body: "<p>Adding single set cardinalities double-counts pairwise intersections. Subtracting pairwise intersections over-corrects triple intersections. By alternating signs, every element in the set union is counted exactly once.</p>",
    },
    {
      heading: "Bitmask Subset Iteration",
      body: "<p>Binary bitmasks from 1 to 2^k - 1 represent every non-empty subset of k prime factors. The count of set bits determines whether the subset contribution is added or subtracted.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Inclusion-Exclusion Principle",
      definition:
        "A combinatorial technique to calculate the size of a union of sets by alternating additions and subtractions of intersections.",
    },
    {
      term: "Bitmask Subset",
      definition:
        "A binary integer whose bits represent inclusion or exclusion of specific prime factors.",
    },
    {
      term: "Parity Sign Rule",
      definition:
        "Subsets with an odd number of elements are added (+), while subsets with an even number are subtracted (-).",
    },
  ],
};

export const INCLUSION_EXCLUSION_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const inclusionExclusionPrinciple: AlgorithmDefinition<InclusionExclusionInput> = {
  id: "inclusion-exclusion-principle",
  title: "Inclusion-Exclusion Principle",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Given a positive integer <code>n</code> and an array of prime numbers <code>primes</code>, count how many integers in <code>[1, n]</code> are divisible by at least one of the given primes.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>n</code> (<code>n &ge; 1</code>): Upper limit bound.</li>" +
    "<li><code>primes</code> (<code>int[]</code>): Array of prime factors.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>int</code>: Total count of integers in <code>[1, n]</code> divisible by at least one prime factor.</li></ul>",
  constraints: ["1 <= n <= 10^9", "1 <= primes.length <= 10", "2 <= primes[i] <= 10^5"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Small Primes Under 30",
      input: { n: 30, primes: [2, 3, 5] },
      output: "22",
      explanation: "22 numbers in [1, 30] are divisible by 2, 3, or 5.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Primes Exceeding Range",
      input: { n: 10, primes: [11, 13] },
      output: "0",
      explanation: "No numbers in [1, 10] are divisible by 11 or 13.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Four Prime Factors Up to 100",
      input: { n: 100, primes: [2, 3, 5, 7] },
      output: "78",
      explanation: "78 numbers in [1, 100] are divisible by 2, 3, 5, or 7.",
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
    time: "Evaluating all 2^k - 1 non-empty subsets takes O(2^k * k) time.",
    space: "Requires O(1) space.",
  },
  topicGuide: INCLUSION_EXCLUSION_TOPIC_GUIDE,
  trivia: INCLUSION_EXCLUSION_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 1201,
      leetcodeId: 1201,
      url: "https://leetcode.com/problems/ugly-number-iii/",
      label: "LeetCode #1201",
      title: "Ugly Number III",
    },
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 22,
      chapterTitle: "Combinatorics",
      section: "22.3 Inclusion-exclusion principle",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  leetcode: {
    id: 1201,
    url: "https://leetcode.com/problems/ugly-number-iii/",
  },
  defaultInput: DEFAULT_INCLUSION_EXCLUSION_INPUT,
  generateSteps: generateInclusionExclusionSteps,
};

export default inclusionExclusionPrinciple;
