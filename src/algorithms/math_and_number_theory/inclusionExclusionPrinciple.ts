import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface InclusionExclusionInput {
  n: number;
  primes: number[];
}

export const PYTHON_INCLUSION_EXCLUSION_CODE = `
def inclusion_exclusion(n: int, primes: list[int]) -> int:
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
  primes: [2, 3, 5, 7],
};

export const generateInclusionExclusionSteps = (
  input: InclusionExclusionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

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

  const createMatrixSnapshot = (
    activeMask?: number,
    activeRowData?: {
      label: string;
      prod: number;
      count: number | string;
      sign: string;
      total: number | string;
    },
  ) => {
    const cells: MatrixCellItem[] = [];
    const rows = subsetRecords.map((r) => ({ ...r }));
    if (activeRowData && activeMask !== undefined) {
      rows.push({
        mask: activeMask,
        label: activeRowData.label,
        prod: activeRowData.prod,
        count: typeof activeRowData.count === "number" ? activeRowData.count : 0,
        sign: activeRowData.sign as "+" | "-",
        total: typeof activeRowData.total === "number" ? activeRowData.total : 0,
      });
    }

    rows.forEach((rec, idx) => {
      const isCurrentActive =
        rec.mask === activeMask && idx === rows.length - 1 && activeRowData !== undefined;
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
          label: `Subset ${idx + 1}`,
          state: isCurrentActive ? "active" : "sorted",
        });
      });
    });

    return {
      kind: "matrix" as const,
      rows: Math.max(1, rows.length),
      cols: 6,
      cells,
      rowHeaders: rows.map((_, idx) => `Sub #${idx + 1}`),
      colHeaders: ["Bitmask", "Selected Primes", "Product", "Count=N//prod", "Sign", "Total"],
      title: "Inclusion-Exclusion Subset Matrix",
    };
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Initialize Inclusion-Exclusion setup for N = ${n} over prime set [${primes.join(", ")}].`,
      why: "The Inclusion-Exclusion Principle computes the size of set unions by systematically adding odd-sized intersection cardinalities and subtracting even-sized intersection cardinalities.",
    },
    primarySnapshot: createMatrixSnapshot(),
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

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Determine total non-empty prime subsets (2^${k} - 1 = ${(1 << k) - 1}).`,
      why: "Iterating binary bitmasks from 1 to 2^k - 1 generates every non-empty combination of prime conditions without duplicates.",
    },
    primarySnapshot: createMatrixSnapshot(),
    auxiliaryState: {
      hashMap: { k: k, "Total Subsets": (1 << k) - 1 },
    },
    variables: { k, total_count: 0 },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize running total divisible integer counter to 0.",
      why: "This register accumulates alternating subset contribution counts.",
    },
    primarySnapshot: createMatrixSnapshot(),
    auxiliaryState: {
      hashMap: { total_count: 0 },
    },
    variables: { total_count: 0 },
  });

  const totalSubsets = (1 << k) - 1;
  for (let mask = 1; mask <= totalSubsets; mask++) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `Inspect subset bitmask ${mask} (binary: ${mask.toString(2).padStart(k, "0")}).`,
        why: "Each bit position in the bitmask represents inclusion or exclusion of the corresponding prime factor.",
      },
      primarySnapshot: createMatrixSnapshot(mask, {
        label: "evaluating...",
        prod: 1,
        count: "?",
        sign: "?",
        total: totalCount,
      }),
      auxiliaryState: {
        hashMap: {
          "Current Mask": mask.toString(2).padStart(k, "0"),
          "Total Count": totalCount,
        },
      },
      variables: { mask, total_count: totalCount },
    });

    let prod = 1;
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: "Initialize prime product accumulator for current subset to 1.",
        why: "Multiplication starts from 1 as the identity element to multiply selected prime factors.",
      },
      primarySnapshot: createMatrixSnapshot(mask, {
        label: "evaluating...",
        prod: 1,
        count: "?",
        sign: "?",
        total: totalCount,
      }),
      auxiliaryState: {
        hashMap: { "Current Mask": mask.toString(2).padStart(k, "0"), prod: 1 },
      },
      variables: { mask, prod: 1, total_count: totalCount },
    });

    let bits = 0;
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: "Initialize active prime counter (popcount) to 0.",
        why: "Subset cardinality determines whether the resulting multiple count is included (odd size) or excluded (even size).",
      },
      primarySnapshot: createMatrixSnapshot(mask, {
        label: "evaluating...",
        prod: 1,
        count: "?",
        sign: "?",
        total: totalCount,
      }),
      auxiliaryState: {
        hashMap: { "Current Mask": mask.toString(2).padStart(k, "0"), prod: 1, bits: 0 },
      },
      variables: { mask, prod: 1, bits: 0, total_count: totalCount },
    });

    const selectedPrimes: number[] = [];
    for (let i = 0; i < k; i++) {
      const isSet = ((mask >> i) & 1) === 1;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 9,
        explanation: {
          what: `Check bit ${i} (prime ${primes[i]}): bit = ${isSet ? 1 : 0}.`,
          why: "Bitwise shift and mask operation checks if the i-th prime factor belongs to this subset.",
        },
        primarySnapshot: createMatrixSnapshot(mask, {
          label: `{${selectedPrimes.join(", ")}}`,
          prod,
          count: "?",
          sign: "?",
          total: totalCount,
        }),
        auxiliaryState: {
          hashMap: {
            "Current Mask": mask.toString(2).padStart(k, "0"),
            "Inspecting Bit": i,
            Prime: primes[i],
            "Bit Set": isSet ? "Yes" : "No",
            Product: prod,
            Bits: bits,
          },
        },
        variables: { mask, i, prod, bits, total_count: totalCount },
      });

      if (isSet) {
        prod *= primes[i];
        selectedPrimes.push(primes[i]);
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 10,
          explanation: {
            what: `Multiply prime ${primes[i]} into running product (new prod = ${prod}).`,
            why: "The least common multiple of a set of distinct prime factors is their direct product.",
          },
          primarySnapshot: createMatrixSnapshot(mask, {
            label: `{${selectedPrimes.join(", ")}}`,
            prod,
            count: "?",
            sign: "?",
            total: totalCount,
          }),
          auxiliaryState: {
            hashMap: {
              "Current Mask": mask.toString(2).padStart(k, "0"),
              "Selected Primes": selectedPrimes.join(" × "),
              Product: prod,
              Bits: bits,
            },
          },
          variables: { mask, i, prod, bits, total_count: totalCount },
        });

        bits++;
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 11,
          explanation: {
            what: `Increment subset cardinality count (bits = ${bits}).`,
            why: "Tracking the number of primes in the subset to compute alternating parity sign.",
          },
          primarySnapshot: createMatrixSnapshot(mask, {
            label: `{${selectedPrimes.join(", ")}}`,
            prod,
            count: "?",
            sign: "?",
            total: totalCount,
          }),
          auxiliaryState: {
            hashMap: {
              "Current Mask": mask.toString(2).padStart(k, "0"),
              Product: prod,
              Bits: bits,
            },
          },
          variables: { mask, i, prod, bits, total_count: totalCount },
        });
      }
    }

    const count = Math.floor(n / prod);
    const sign: "+" | "-" = bits % 2 === 1 ? "+" : "-";

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `Calculate divisible integers in [1, ${n}] for product ${prod}: ⌊${n} / ${prod}⌋ = ${count}.`,
        why: "Floor division counts how many integers up to N are divisible by all selected primes in this subset.",
      },
      primarySnapshot: createMatrixSnapshot(mask, {
        label: `{${selectedPrimes.join(", ")}}`,
        prod,
        count,
        sign,
        total: totalCount,
      }),
      auxiliaryState: {
        hashMap: {
          "Current Mask": mask.toString(2).padStart(k, "0"),
          "Selected Primes": selectedPrimes.join(" × "),
          Product: prod,
          "Divisibles Count": count,
        },
      },
      variables: {
        mask,
        prod,
        bits,
        count,
        total_count: totalCount,
      },
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 13,
      explanation: {
        what: `Evaluate parity sign for cardinality ${bits}: ${bits % 2 === 1 ? "odd (+ inclusion)" : "even (- exclusion)"}.`,
        why: "Inclusion-Exclusion adds odd-cardinality intersections to account for set coverage and subtracts even-cardinality intersections to correct overcounting.",
      },
      primarySnapshot: createMatrixSnapshot(mask, {
        label: `{${selectedPrimes.join(", ")}}`,
        prod,
        count,
        sign,
        total: totalCount,
      }),
      auxiliaryState: {
        hashMap: {
          "Bits Parity": bits % 2 === 1 ? "Odd (+)" : "Even (-)",
          "Applied Count": count,
        },
      },
      variables: { mask, prod, bits, count, total_count: totalCount },
    });

    if (bits % 2 === 1) {
      totalCount += count;
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 14,
        explanation: {
          what: `Include count (${count}) for odd subset size: new total = ${totalCount}.`,
          why: "Adding subset multiples to include numbers divisible by this prime combination.",
        },
        primarySnapshot: createMatrixSnapshot(mask, {
          label: `{${selectedPrimes.join(", ")}}`,
          prod,
          count,
          sign,
          total: totalCount,
        }),
        auxiliaryState: {
          hashMap: {
            Operation: `+${count}`,
            "Updated Total": totalCount,
          },
        },
        variables: { mask, prod, bits, count, total_count: totalCount },
      });
    } else {
      totalCount -= count;
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 16,
        explanation: {
          what: `Exclude count (${count}) for even subset size: new total = ${totalCount}.`,
          why: "Subtracting subset multiples to remove double-counted overlaps across multiple sets.",
        },
        primarySnapshot: createMatrixSnapshot(mask, {
          label: `{${selectedPrimes.join(", ")}}`,
          prod,
          count,
          sign,
          total: totalCount,
        }),
        auxiliaryState: {
          hashMap: {
            Operation: `-${count}`,
            "Updated Total": totalCount,
          },
        },
        variables: { mask, prod, bits, count, total_count: totalCount },
      });
    }

    subsetRecords.push({
      mask,
      label: `{${selectedPrimes.join(", ")}}`,
      prod,
      count,
      sign,
      total: totalCount,
    });
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 17,
    explanation: {
      what: `Finalize Inclusion-Exclusion count: exactly ${totalCount} integers in [1, ${n}] are divisible by at least one prime in [${primes.join(", ")}].`,
      why: "All 2^k - 1 non-empty subset intersections have been processed with exact alternating inclusion-exclusion coefficients.",
    },
    primarySnapshot: createMatrixSnapshot(),
    auxiliaryState: {
      hashMap: {
        "Final Result": totalCount,
      },
    },
    variables: { total_count: totalCount },
  });

  return steps;
};

export const INCLUSION_EXCLUSION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>The <strong>Inclusion-Exclusion Principle (IEP)</strong> is a foundational counting technique in combinatorics and probability. It computes the size of the union of multiple overlapping sets by alternating between adding the sizes of odd-cardinality set intersections and subtracting even-cardinality set intersections:</p><p><code>|A₁ ∪ A₂ ∪ ... ∪ Aₖ| = ∑ |Aᵢ| - ∑ |Aᵢ ∩ Aⱼ| + ∑ |Aᵢ ∩ Aⱼ ∩ Aₘ| - ...</code></p>",
  sections: [
    {
      heading: "Why Alternating Sums Work Mathematically",
      body: "<p>If we simply sum the individual set sizes, any element belonging to multiple sets is overcounted. Subtracting pairwise intersections corrects pairwise overlaps but over-subtracts elements in three sets. In general, an element belonging to exactly m sets is counted: <code>∑ (-1)^(j-1) (m choose j) = 1 - (1 - 1)^m = 1</code>. This binomial identity proves every element in the union is counted exactly once.</p>",
    },
    {
      heading: "Bitmask Subset Iteration & Popcount Parity",
      body: "<p>For <code>k</code> prime factors or properties, there are <code>2^k - 1</code> non-empty subsets. Using integer bitmasks from <code>1</code> to <code>2^k - 1</code> lets us efficiently enumerate every subset of conditions. The set bits specify which primes to multiply together, and popcount parity decides whether to add (odd size) or subtract (even size) floor division counts.</p>",
    },
    {
      heading: "Systems & Real-World Applications",
      body: "<p>Inclusion-Exclusion powers major computer science algorithms including derangements (counting permutations with no fixed points), co-primality counting in number theory, graph chromatic polynomials, and database query selectivity estimation across overlapping indexes.</p>",
    },
    {
      heading: "Complexity & Advanced Optimizations",
      body: "<p>Bitmask evaluation runs in <code>O(2^k × k)</code> time. For small <code>k</code> (such as <code>k ≤ 20</code>), operation counts remain within milliseconds. When <code>k &gt; 30</code>, fast Möbius inversion on posets or SOS DP (Sum Over Subsets) optimizes subset combinations.</p>",
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
        "The count of 1-bits in a binary mask, determining whether the term is added (+ for odd) or subtracted (- for even).",
    },
  ],
};

export const INCLUSION_EXCLUSION_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Empty leading line for code formatting.",
    2: "Defines inclusion_exclusion function signature taking target N and prime array.",
    3: "Stores number of prime factors in variable k.",
    4: "Initializes total_count accumulator = 0.",
    5: "Iterates through all non-empty subsets using bitmask 1 to (1 << k) - 1.",
    6: "Initializes product of selected primes prod = 1.",
    7: "Initializes count of selected primes bits = 0.",
    8: "Loops through each prime index i from 0 to k - 1.",
    9: "Checks if i-th bit is set in current mask.",
    10: "Multiplies prime[i] into running subset product prod.",
    11: "Increments selected bits count.",
    12: "Computes count = N // prod (number of multiples of prod in [1, N]).",
    13: "Checks if bits count is odd (bits % 2 == 1).",
    14: "Adds count if subset cardinality is odd.",
    15: "Else branch for even subset cardinality.",
    16: "Subtracts count if subset cardinality is even.",
    17: "Returns final count of numbers divisible by at least one prime.",
    18: "Empty trailing line for code formatting.",
  },
};

export const inclusionExclusionPrinciple: AlgorithmDefinition<InclusionExclusionInput> = {
  id: "inclusion-exclusion-principle",
  title: "Inclusion-Exclusion Principle",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Given a target integer <code>N</code> and a list of <code>k</code> prime numbers, compute the total count of integers in <code>[1, N]</code> divisible by at least one of the given primes using the Inclusion-Exclusion Principle:</p><p><code>|∪ A_i| = ∑_{S ⊆ {1..k}, S ≠ ∅} (-1)^{|S|-1} ⌊N / ∏_{j ∈ S} p_j⌋</code></p><h3>State Matrix Representation</h3><p>The evaluation trace is recorded in a matrix storing <code>(Bitmask, Primes, Product, Count, Sign, Total)</code>.</p><h3>Input Parameters</h3><ul><li><code>n</code> (<code>int</code>): Upper bound limit.</li><li><code>primes</code> (<code>int[]</code>): Array of prime factors.</li></ul><h3>Output</h3><ul><li><code>int</code>: Total count of integers in <code>[1, N]</code> divisible by at least one prime.</li></ul>",
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
    time: "Evaluating all 2^k - 1 non-empty subsets of k prime factors takes O(2^k × k) operations.",
    space: "Requires O(1) auxiliary space for bit manipulation.",
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
