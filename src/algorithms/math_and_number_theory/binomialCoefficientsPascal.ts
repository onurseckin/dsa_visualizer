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
  input: BinomialCoefficientsInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const safeN = Number.isFinite(input?.n) ? Math.floor(input.n) : 6;
  const safeK = Number.isFinite(input?.k) ? Math.floor(input.k) : 3;

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
      what: `Initializing Pascal's Triangle DP matrix of size (${nVal + 1}) × (${kVal + 1}) to compute C(${nVal}, ${kVal}).`,
      why: "We evaluate the combination recurrence C(n, k) = C(n-1, k-1) + C(n-1, k) row by row, avoiding factorial overflow.",
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
            what: `Base case C[${i}][${j}] = 1 (${j === 0 ? "j == 0" : "j == i"}).`,
            why:
              j === 0
                ? "Choosing 0 items from a set of size i can be done in exactly 1 way."
                : "Choosing all i items from a set of size i can be done in exactly 1 way.",
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
            what: `C[${i}][${j}] = C[${i - 1}][${j - 1}] + C[${i - 1}][${j}] = ${val1} + ${val2} = ${dp[i][j]}.`,
            why: "Pascal's identity: either include the i-th element (requires picking j-1 from i-1) or exclude it (requires picking j from i-1).",
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
      what: `Completed Pascal's triangle table! C(${nVal}, ${kVal}) = ${ans}.`,
      why: "Target DP matrix cell evaluated successfully.",
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
    "Binomial coefficients $\\binom{n}{k} = \\frac{n!}{k!(n-k)!}$ count the number of ways to choose $k$ items from a set of $n$ distinct elements without regard to order. Pascal's Triangle builds these values dynamically using the fundamental recurrence relation $\\binom{n}{k} = \\binom{n-1}{k-1} + \\binom{n-1}{k}$. This DP approach avoids factorial overflow in integer arithmetic and provides a clean 2D grid matrix representation.",
  sections: [
    {
      heading: "Pascal's Recurrence Identity & Combinatorial Proof",
      body: "To select $k$ items out of $n$, distinguish an arbitrary element $x$: either we include $x$ (requiring us to pick $k-1$ items from the remaining $n-1$), or we exclude $x$ (requiring us to pick $k$ items from the remaining $n-1$). Adding these mutually exclusive cases yields:\n$$\\binom{n}{k} = \\binom{n-1}{k-1} + \\binom{n-1}{k}$$\nBase cases are $\\binom{i}{0} = 1$ (the unique empty set) and $\\binom{i}{i} = 1$ (the unique full set selection).",
    },
    {
      heading: "Numeric Stability & Avoiding Factorial Overflow",
      body: "Computing $\\frac{n!}{k!(n-k)!}$ directly is extremely vulnerable to integer overflow, as $21!$ exceeds 64-bit integer limits ($2^{63}-1$). By constructing the DP table iteratively using addition only, arithmetic precision is maintained up to the final result limit. Furthermore, row-by-row DP calculation exhibits optimal spatial cache locality.",
    },
    {
      heading: "Symmetric Property & Space Optimization",
      body: "Because of the combinatorial symmetry $\\binom{n}{k} = \\binom{n}{n-k}$, we can optimize computation when $k > \\frac{n}{2}$ by substituting $k \\leftarrow n - k$. Space complexity can also be compressed from $\\mathcal{O}(n k)$ to $\\mathcal{O}(k)$ using a 1D array updated in-place from right to left.",
    },
    {
      heading: "Edge Cases & Boundary Analysis",
      body: "Key edge cases include $k = 0$ (always yields $1$), $k = n$ (always yields $1$), $k > n$ (yields $0$), and $n = 0$ (yielding $\\binom{0}{0} = 1$). Restricting inner loops to $j \\le \\min(i, k)$ prevents unnecessary matrix updates.",
    },
  ],
  keyTerms: [
    {
      term: "Pascal's Triangle",
      definition:
        "A triangular matrix of binomial coefficients where each entry is the sum of the two cells directly above it.",
    },
    {
      term: "Combination $\\binom{n}{k}$",
      definition: "The number of unordered $k$-element subsets chosen from an $n$-element set.",
    },
    {
      term: "Symmetric Property",
      definition:
        "The identity $\\binom{n}{k} = \\binom{n}{n-k}$, reflecting the equivalence of choosing $k$ elements to include or $n-k$ elements to exclude.",
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
    "Given non-negative integers $n$ and $k$, compute the binomial coefficient $\\binom{n}{k}$ representing the number of ways to choose $k$ items from $n$ distinct items without regard to order:\n\n$$\\binom{n}{k} = \\binom{n-1}{k-1} + \\binom{n-1}{k}$$\n\n### State Matrix Representation\nThe DP dynamic state is represented as a matrix $\\mathbf{C} \\in \\mathbb{Z}^{(n+1) \\times (k+1)}$ where cell $\\mathbf{C}[i][j]$ stores $\\binom{i}{j}$.\n\n### Input Parameters\n- `n` ($n \\in \\mathbb{Z}_{\\ge 0}$): Total number of items in the set.\n- `k` ($k \\in \\mathbb{Z}_{\\ge 0}$): Number of items to select from the set.\n\n### Output\n- `int`: Binomial coefficient $\\binom{n}{k}$.\n\n### Edge Cases & Constraints\n- Base Cases: $\\binom{n}{0} = 1$ and $\\binom{n}{n} = 1$.\n- Out of Bounds: $\\binom{n}{k} = 0$ for $k > n$.",
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
    time: "Fills an $(N+1) \\times (K+1)$ DP grid, executing in $\\mathcal{O}(N \\times K)$ operations.",
    space: "Requires $\\mathcal{O}(N \\times K)$ memory to store the 2D grid matrix.",
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
