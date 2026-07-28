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

  const n = Math.max(1, Math.floor(input.n || 1));
  const primes =
    input.primes && input.primes.length > 0
      ? input.primes.map((p) => Math.abs(Math.floor(p)))
      : [2, 3, 5];
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
      what: `Initializing Inclusion-Exclusion for N = ${n} and ${k} primes: [${primes.join(", ")}].`,
      why: "The principle counts numbers in [1, N] divisible by at least one prime by summing sizes of odd-sized intersections and subtracting even-sized intersections.",
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
      what: `k = len(primes) = ${k}. Total non-empty subsets to evaluate: 2^${k} - 1 = ${(1 << k) - 1}.`,
      why: "Bitmask values from 1 to 2^k - 1 systematically enumerate every non-empty prime combination.",
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
      what: "Initializing total_count = 0.",
      why: "Accumulator for inclusion-exclusion sum.",
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
        what: `Evaluating bitmask ${mask} (binary: ${mask.toString(2).padStart(k, "0")}).`,
        why: `Bitmask ${mask.toString(2).padStart(k, "0")} selects prime factors corresponding to set bits.`,
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
        what: "Initial product of selected primes prod = 1.",
        why: "Identity element for multiplication.",
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
        what: "Initial count of selected primes bits = 0.",
        why: "Accumulator for subset cardinality (popcount).",
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
          what: `Checking bit ${i} for prime ${primes[i]}: bit is ${isSet ? 1 : 0}.`,
          why: `(mask >> ${i}) & 1 determines if prime ${primes[i]} is included in this subset.`,
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
            what: `Bit is 1: multiplying prime ${primes[i]} into prod. New prod = ${prod}.`,
            why: "Including prime in current subset intersection product.",
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
            what: `Incrementing selected bit count: bits = ${bits}.`,
            why: "Tracking total number of primes in this subset.",
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
        what: `Count of multiples of prod (${prod}) in [1, ${n}]: count = ${n} // ${prod} = ${count}.`,
        why: "Number of integers in [1, N] divisible by the product of primes in this subset.",
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
        what: `Checking cardinality parity: bits = ${bits} is ${bits % 2 === 1 ? "odd (bits % 2 == 1)" : "even (bits % 2 == 0)"}.`,
        why: `Odd cardinality subsets add to total_count, even cardinality subsets subtract from total_count.`,
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
          what: `Odd subset size (+): total_count += ${count}. New total_count = ${totalCount}.`,
          why: "Inclusion step: adding multiples of odd-sized prime combinations.",
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
          what: `Even subset size (-): total_count -= ${count}. New total_count = ${totalCount}.`,
          why: "Exclusion step: subtracting multiples of even-sized prime combinations.",
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
      what: `Completed Inclusion-Exclusion evaluation. Total integers in [1, ${n}] divisible by at least one of [${primes.join(", ")}] = ${totalCount}.`,
      why: `Evaluated all ${totalSubsets} non-empty set intersections with alternating inclusion-exclusion signs.`,
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
    "The Inclusion-Exclusion Principle (IEP) is a foundational counting technique in combinatorics and probability. It computes the size of the union of multiple overlapping sets by alternating between adding the sizes of odd-cardinality set intersections and subtracting even-cardinality set intersections:\n$$\\left| \\bigcup_{i=1}^k A_i \\right| = \\sum_{i} |A_i| - \\sum_{i < j} |A_i \\cap A_j| + \\sum_{i < j < m} |A_i \\cap A_j \\cap A_m| - \\dots$$",
  sections: [
    {
      heading: "Why Alternating Sums Work Mathematically",
      body: "If we simply sum the individual set sizes $\\sum |A_i|$, any element belonging to multiple sets is overcounted. Subtracting pairwise intersections $\\sum |A_i \\cap A_j|$ corrects pairwise overlaps but over-subtracts elements in three sets. In general, an element belonging to exactly $m$ sets is counted:\n$$\\sum_{j=1}^m (-1)^{j-1} \\binom{m}{j} = 1 - (1 - 1)^m = 1$$\nThis binomial identity proves every element in the union is counted exactly once.",
    },
    {
      heading: "Bitmask Subset Iteration & Popcount Parity",
      body: "For $k$ prime factors or properties, there are $2^k - 1$ non-empty subsets. Using integer bitmasks from $1$ to $2^k - 1$ lets us efficiently enumerate every subset of conditions. The set bits specify which primes to multiply together ($prod = \\prod_{i \\in S} p_i$), and popcount parity $|S|$ decides whether to add (odd $|S|$) or subtract (even $|S|$) $\\lfloor N / prod \\rfloor$.",
    },
    {
      heading: "Systems & Real-World Applications",
      body: "Inclusion-Exclusion powers major computer science algorithms:\n1. Derangements: Counting permutations with no fixed points ($!n = n! \\sum_{k=0}^n \\frac{(-1)^k}{k!}$).\n2. Co-primality Counting: Finding how many integers in $[1, N]$ are coprime to $N$.\n3. Graph Coloring: Computing chromatic polynomials of graphs.\n4. Database Selectivity: Estimating multi-attribute query union sizes across overlapping indexes.",
    },
    {
      heading: "Complexity & Advanced Optimizations",
      body: "Bitmask evaluation runs in $\\mathcal{O}(2^k \\cdot k)$ time. For $k \\le 20$, $2^{20} \\approx 1.05 \\times 10^6$ operations finish in milliseconds. When $k > 30$, fast Möbius inversion on posets or SOS DP (Sum Over Subsets) optimizes subset combinations.",
    },
  ],
  keyTerms: [
    {
      term: "Union of Sets",
      definition:
        "The set containing all elements belonging to at least one of the component sets $\\bigcup_{i=1}^k A_i$.",
    },
    {
      term: "Bitmask Subset Generation",
      definition:
        "Using binary representations of integers from $1$ to $2^k - 1$ to represent all non-empty subsets of $k$ items.",
    },
    {
      term: "Popcount Parity",
      definition:
        "The count of 1-bits in a binary mask, determining whether the term is added ($+$ for odd) or subtracted ($-$ for even).",
    },
  ],
};

export const INCLUSION_EXCLUSION_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Empty leading line for code formatting.",
    2: "Defines inclusion_exclusion function signature taking target $N$ and prime array.",
    3: "Stores number of prime factors in variable $k$.",
    4: "Initializes total_count accumulator = 0.",
    5: "Iterates through all non-empty subsets using bitmask 1 to $(1 \\ll k) - 1$.",
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
    "Given a target integer $N$ and a list of $k$ prime numbers, compute the total count of integers in $[1, N]$ divisible by at least one of the given primes using the Inclusion-Exclusion Principle:\n\n$$\\left| \\bigcup_{i=1}^k A_i \\right| = \\sum_{S \\subseteq \\{1..k\\}, S \\neq \\emptyset} (-1)^{|S|-1} \\left\\lfloor \\frac{N}{\\prod_{j \\in S} p_j} \\right\\rfloor$$\n\n### State Matrix Representation\nThe evaluation trace is recorded in a matrix $\\mathbf{M} \\in \\mathbb{Z}^{(2^k-1) \\times 6}$ storing $(\\text{Bitmask}, \\text{Primes}, \\text{Product}, \\text{Count}, \\text{Sign}, \\text{Total})$.\n\n### Input Parameters\n- `n` ($N \\in \\mathbb{Z}_{> 0}$): Upper bound limit.\n- `primes` (`list[int]`): Array of prime factors.\n\n### Output\n- `int`: Total count of integers in $[1, N]$ divisible by at least one prime.\n\n### Edge Cases & Constraints\n- Empty Primes: Returns 0.\n- Primes Exceeding $N$: Count is 0.",
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
    time: "Evaluating all $2^k - 1$ non-empty subsets of $k$ prime factors takes $\\mathcal{O}(2^k \\cdot k)$ operations.",
    space: "Requires $\\mathcal{O}(1)$ auxiliary space for bit manipulation.",
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
