import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface BinomialCoefficientsInput {
  n: number;
  k: number;
}

export const PYTHON_BINOMIAL_COEFFICIENTS_PASCAL_CODE = `def binomial_coefficient(n: int, k: int) -> int:
    dp = [[0] * (k + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        for j in range(min(i, k) + 1):
            if j == 0 or j == i:
                dp[i][j] = 1
            else:
                dp[i][j] = dp[i - 1][j - 1] + dp[i - 1][j]
    return dp[n][k]
`;

export const DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT: BinomialCoefficientsInput = {
  n: 6,
  k: 3,
};

export const generateBinomialCoefficientsPascalSteps = (
  input?: BinomialCoefficientsInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const safeInput = input ?? DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT;
  const safeN = Number.isFinite(safeInput?.n)
    ? Math.floor(safeInput.n)
    : DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT.n;
  const safeK = Number.isFinite(safeInput?.k)
    ? Math.floor(safeInput.k)
    : DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT.k;

  const nVal = Math.min(10, Math.max(0, safeN));
  const kVal = Math.min(nVal, Math.max(0, safeK));

  const dp: number[][] = Array.from({ length: nVal + 1 }, () => new Array(kVal + 1).fill(0));

  const createMatrixSnapshot = (
    activeRow: number | null,
    activeCol: number | null,
    parent1: [number, number] | null = null,
    parent2: [number, number] | null = null,
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r <= nVal; r++) {
      for (let c = 0; c <= kVal; c++) {
        let state: MatrixCellItem["state"] = "default";
        if (r === activeRow && c === activeCol) {
          state = "active";
        } else if (
          (parent1 && parent1[0] === r && parent1[1] === c) ||
          (parent2 && parent2[0] === r && parent2[1] === c)
        ) {
          state = "compared";
        } else if (dp[r][c] > 0) {
          state = "sorted";
        }

        cells.push({
          row: r,
          col: c,
          value: dp[r][c],
          label: `C(${r},${c})`,
          state,
        });
      }
    }

    const rowHeaders = Array.from({ length: nVal + 1 }, (_, i) => `n=${i}`);
    const colHeaders = Array.from({ length: kVal + 1 }, (_, j) => `k=${j}`);

    return {
      kind: "matrix" as const,
      rows: nVal + 1,
      cols: kVal + 1,
      cells,
      rowHeaders,
      colHeaders,
      title: "Pascal's Triangle Matrix",
    };
  };

  // Step 0: Entry / Matrix Initialization
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Initializing Pascal's Triangle DP matrix of size (${nVal + 1}) × (${kVal + 1}) for target C(${nVal}, ${kVal}).`,
      why: "Constructing the table bottom-up evaluates combinations through additions rather than risky factorial divisions.",
    },
    primarySnapshot: createMatrixSnapshot(null, null),
    auxiliaryState: {
      hashMap: {
        "Target Combination": `C(${nVal}, ${kVal})`,
        "Matrix Dimensions": `${nVal + 1} x ${kVal + 1}`,
      },
      customState: {
        n: nVal,
        k: kVal,
      },
    },
    variables: {
      n: nVal,
      k: kVal,
    },
  });

  // DP table filling loop
  for (let i = 0; i <= nVal; i++) {
    const maxJ = Math.min(i, kVal);
    for (let j = 0; j <= maxJ; j++) {
      if (j === 0 || j === i) {
        dp[i][j] = 1;

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 6,
          explanation: {
            what: `Setting base case C[${i}][${j}] = 1 (${j === 0 ? "j = 0" : "j = i"}).`,
            why:
              j === 0
                ? "Choosing 0 items from any set can be done in exactly 1 way (the empty set)."
                : "Choosing all i items from an i-element set can be done in exactly 1 way (the entire set).",
          },
          primarySnapshot: createMatrixSnapshot(i, j),
          auxiliaryState: {
            hashMap: {
              "Cell Value": `C[${i}][${j}] = 1`,
              Reason:
                j === 0 ? "j == 0 (Empty subset selection)" : "j == i (Full subset selection)",
            },
            customState: {
              i,
              j,
              val: 1,
            },
          },
          variables: {
            i,
            j,
            val: 1,
          },
        });
      } else {
        const val1 = dp[i - 1][j - 1];
        const val2 = dp[i - 1][j];
        dp[i][j] = val1 + val2;

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 8,
          explanation: {
            what: `Computing C[${i}][${j}] = C[${i - 1}][${j - 1}] + C[${i - 1}][${j}] = ${val1} + ${val2} = ${dp[i][j]}.`,
            why: "Combining subset counts where the i-th item is included (C[i-1][j-1]) versus excluded (C[i-1][j]).",
          },
          primarySnapshot: createMatrixSnapshot(i, j, [i - 1, j - 1], [i - 1, j]),
          auxiliaryState: {
            hashMap: {
              "Parent C[i-1][j-1]": `${val1}`,
              "Parent C[i-1][j]": `${val2}`,
              "Calculated C[i][j]": `${dp[i][j]}`,
            },
            customState: {
              i,
              j,
              val: dp[i][j],
            },
          },
          variables: {
            i,
            j,
            val: dp[i][j],
          },
        });
      }
    }
  }

  // Final Step
  const ans = dp[nVal][kVal];
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 9,
    explanation: {
      what: `Completed Pascal's Triangle table: C(${nVal}, ${kVal}) = ${ans}.`,
      why: "The target entry C(${nVal}, ${kVal}) contains the final count of unordered combinations.",
    },
    primarySnapshot: createMatrixSnapshot(nVal, kVal),
    auxiliaryState: {
      hashMap: {
        "Final Result C(n, k)": `${ans}`,
      },
      customState: {
        result: ans,
      },
    },
    variables: {
      result: ans,
    },
  });

  return steps;
};

export const BINOMIAL_COEFFICIENTS_PASCAL_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Binomial coefficients <code>C(n, k) = n! / (k! &times; (n - k)!)</code> count the number of unordered <code>k</code>-element subsets chosen from an <code>n</code>-element set. Pascal's Triangle computes these values dynamically using the recurrence <code>C(n, k) = C(n-1, k-1) + C(n-1, k)</code>. This dynamic programming formulation avoids factorial overflow in fixed-precision integer arithmetic and provides a clean 2D grid matrix structure.</p>",
  sections: [
    {
      heading: "Pascal's Recurrence & Combinatorial Proof",
      body: "<p>To pick <code>k</code> items from <code>n</code>, select an arbitrary element <code>x</code>: either include <code>x</code> (requiring <code>k-1</code> items from the remaining <code>n-1</code>), or exclude <code>x</code> (requiring <code>k</code> items from the remaining <code>n-1</code>). Adding these disjoint choices proves the identity:</p><p><code>C(n, k) = C(n-1, k-1) + C(n-1, k)</code></p><p>Base cases are <code>C(i, 0) = 1</code> (empty set selection) and <code>C(i, i) = 1</code> (full set selection).</p>",
    },
    {
      heading: "Numeric Stability & Avoiding Overflow",
      body: "<p>Directly computing <code>n! / (k! &times; (n - k)!)</code> causes integer overflow for modest values (e.g. <code>21!</code> exceeds 64-bit integer limits). Iteratively building the DP table using addition guarantees exact integer results without overflow risk.</p>",
    },
    {
      heading: "Symmetric Property & Space Compression",
      body: "<p>Combinatorial symmetry yields <code>C(n, k) = C(n, n - k)</code>. Memory can be compressed from <code>O(n &times; k)</code> to <code>O(k)</code> space by maintaining a single 1D row array updated backwards from right to left.</p>",
    },
    {
      heading: "Boundary Conditions",
      body: "<ul><li><strong>k = 0 or k = n:</strong> Always yields <code>1</code>.</li><li><strong>k &gt; n:</strong> Returns <code>0</code> since choosing more elements than available is impossible.</li><li><strong>n = 0:</strong> Yields <code>C(0, 0) = 1</code>.</li></ul>",
    },
  ],
  keyTerms: [
    {
      term: "Pascal's Triangle",
      definition:
        "A triangular matrix of binomial coefficients where each entry is the sum of the two cells directly above it.",
    },
    {
      term: "Combination C(n, k)",
      definition: "The number of unordered k-element subsets chosen from an n-element set.",
    },
    {
      term: "Symmetric Property",
      definition:
        "The identity C(n, k) = C(n, n-k), reflecting the equivalence of choosing k elements to include or n-k elements to exclude.",
    },
  ],
};

export const BINOMIAL_COEFFICIENTS_PASCAL_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines binomial_coefficient(n, k) -> int using Pascal's triangle DP table.",
    2: "Initializes 2D DP matrix C of size (n + 1) × (k + 1) filled with 0s.",
    3: "Outer loop iterates through row index i from 0 to n.",
    4: "Inner loop iterates through column index j from 0 to min(i, k).",
    5: "Checks base cases: j == 0 (choose 0 elements) or j == i (choose all i elements).",
    6: "Sets base case value dp[i][j] = 1.",
    7: "Else branch for interior cells of Pascal's triangle.",
    8: "Pascal's identity: dp[i][j] = dp[i - 1][j - 1] + dp[i - 1][j].",
    9: "Returns dp[n][k] containing the binomial coefficient C(n, k).",
  },
};

export const binomialCoefficientsPascal: AlgorithmDefinition<BinomialCoefficientsInput> = {
  id: "binomial-coefficients-pascal",
  title: "Binomial Coefficients (Pascal's Triangle)",
  topicIds: ["math_and_number_theory"],
  difficulty: "Easy",
  description:
    "<p>Given non-negative integers <code>n</code> and <code>k</code>, compute the <strong>binomial coefficient</strong> <code>C(n, k)</code> representing the number of ways to choose <code>k</code> items from <code>n</code> distinct items without regard to order, built via <strong>Pascal's Triangle</strong> recurrence:</p><p><code>C(n, k) = C(n-1, k-1) + C(n-1, k)</code></p><h3>State Matrix Representation</h3><p>The DP table is stored as a 2D matrix <code>C &in; &mathbb;Z<sup>(n+1) &times; (k+1)</sup></code> where cell <code>C[i][j]</code> holds <code>C(i, j)</code>.</p><h3>Input Parameters</h3><ul><li><code>n</code>: Total number of items in the set.</li><li><code>k</code>: Number of items to select.</li></ul><h3>Output</h3><ul><li><code>int</code>: Binomial coefficient <code>C(n, k)</code>.</li></ul>",
  constraints: ["0 <= k <= n <= 30"],
  examples: [
    {
      kind: "basic",
      title: "Standard Combination C(5, 3)",
      inputDisplay: "n = 5, k = 3",
      outputDisplay: "C(5, 3) = 10",
      input: { n: 5, k: 3 },
      output: "10",
      explanation: "5! / (3! * 2!) = 120 / 12 = 10.",
    },
    {
      kind: "complex",
      title: "Symmetric Property C(6, 2)",
      inputDisplay: "n = 6, k = 2",
      outputDisplay: "C(6, 2) = 15",
      input: { n: 6, k: 2 },
      output: "15",
      explanation: "C(6, 2) = C(6, 4) = 15.",
    },
    {
      kind: "negative",
      title: "Boundary Case C(4, 0)",
      inputDisplay: "n = 4, k = 0",
      outputDisplay: "C(4, 0) = 1",
      input: { n: 4, k: 0 },
      output: "1",
      explanation: "There is exactly 1 way to choose 0 items from 4.",
    },
  ],
  code: PYTHON_BINOMIAL_COEFFICIENTS_PASCAL_CODE,
  timeComplexity: {
    best: "O(N * K)",
    average: "O(N * K)",
    worst: "O(N * K)",
  },
  spaceComplexity: "O(N * K)",
  complexityAnalysis: {
    time: "Fills an (N+1) x (K+1) DP grid, executing in O(N x K) operations.",
    space: "Requires O(N x K) memory to store the 2D grid matrix.",
  },
  topicGuide: BINOMIAL_COEFFICIENTS_PASCAL_TOPIC_GUIDE,
  trivia: BINOMIAL_COEFFICIENTS_PASCAL_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 22",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 22,
      section: "22.1 Binomial coefficients",
    },
  ],
  defaultInput: DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT,
  generateSteps: generateBinomialCoefficientsPascalSteps,
};
