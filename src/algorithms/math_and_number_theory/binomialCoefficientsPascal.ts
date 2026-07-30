import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  CodeVariant,
  MatrixCellItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface BinomialCoefficientsInput {
  n: number;
  k: number;
}

export const PYTHON_BINOMIAL_COEFFICIENTS_PASCAL_CODE = `class Solution:
    def __init__(self):
        pass

    def binomial(self, n: int, k: int) -> int:
        if k < 0 or k > n:
            return 0
        k = min(k, n - k)  # Leverage symmetry C(n, k) == C(n, n-k)

        dp = [0] * (k + 1)
        dp[0] = 1  # Base case: C(row, 0) = 1

        for row in range(1, n + 1):
            # Update backwards in-place to preserve values from previous row
            for col in range(min(row, k), 0, -1):
                dp[col] += dp[col - 1]

        return dp[k]`;

export const BINOMIAL_COEFFICIENTS_PASCAL_VARIANTS: readonly CodeVariant[] = [
  {
    id: "dp-1d",
    label: "1D DP (In-Place Array)",
    description: "Space-optimized O(k) space DP using a 1D array updated in reverse.",
    code: PYTHON_BINOMIAL_COEFFICIENTS_PASCAL_CODE,
    timeComplexity: {
      best: "O(N * K)",
      average: "O(N * K)",
      worst: "O(N * K)",
    },
    spaceComplexity: "O(K)",
    complexityAnalysis: {
      time: "Fills a 1D array of size K+1 in reverse over N row iterations, using O(N * K) additions.",
      space: "Requires O(K) auxiliary space for the 1D DP array.",
    },
  },
  {
    id: "dp-2d",
    label: "2D DP Matrix",
    description: "Classic O(n x k) space DP building the full Pascal's Triangle matrix.",
    code: `class Solution:
    def __init__(self):
        pass

    def binomial(self, n: int, k: int) -> int:
        if k < 0 or k > n:
            return 0

        # Build (n+1) x (k+1) table matching Pascal's Triangle
        dp = [[0] * (k + 1) for _ in range(n + 1)]

        for i in range(n + 1):
            dp[i][0] = 1  # Base case: choosing 0 items is always 1 way
            for j in range(1, min(i, k) + 1):
                if j == i:
                    dp[i][j] = 1  # Base case: choosing all items is 1 way
                else:
                    # Pascal's recurrence: C(n, k) = C(n-1, k-1) + C(n-1, k)
                    dp[i][j] = dp[i - 1][j - 1] + dp[i - 1][j]

        return dp[n][k]`,
    timeComplexity: {
      best: "O(N * K)",
      average: "O(N * K)",
      worst: "O(N * K)",
    },
    spaceComplexity: "O(N * K)",
    complexityAnalysis: {
      time: "Fills an (N+1) x (K+1) DP grid in O(N x K) steps using Pascal's identity additions.",
      space: "Requires O(N x K) auxiliary space for the full 2D matrix table.",
    },
  },
  {
    id: "multiplicative",
    label: "Multiplicative O(k)",
    description: "Direct iterative computation in O(k) time and O(1) auxiliary space.",
    code: `class Solution:
    def __init__(self):
        pass

    def binomial(self, n: int, k: int) -> int:
        if k < 0 or k > n:
            return 0
        k = min(k, n - k)  # Leverage symmetry C(n, k) == C(n, n-k)

        # Compute C(n, k) = (n * (n-1) * ... * (n-k+1)) / (1 * 2 * ... * k)
        result = 1
        for i in range(1, k + 1):
            result = result * (n - i + 1) // i
        return result`,
    timeComplexity: {
      best: "O(K)",
      average: "O(K)",
      worst: "O(K)",
    },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Computes C(n, k) iteratively in a single loop from 1 to K in O(K) time.",
      space: "Requires O(1) auxiliary space (only a single scalar integer variable).",
    },
  },
];

export const DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT: BinomialCoefficientsInput = {
  n: 5,
  k: 3,
};

const generate1DArraySteps = (nVal: number, kVal: number): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const kEff = Math.min(kVal, nVal - kVal);
  const dp: number[] = new Array(kEff + 1).fill(0);
  dp[0] = 1;

  const createArraySnapshot = (
    activeCol: number | null,
    comparedCol: number | null = null,
    isDone: boolean = false,
  ) => {
    const elements: ArrayElement[] = dp.map((val, idx) => {
      let state: ArrayElement["state"] = "default";
      if (isDone && idx === kEff) {
        state = "sorted";
      } else if (idx === activeCol) {
        state = "active";
      } else if (idx === comparedCol) {
        state = "compared";
      } else if (val > 0) {
        state = "sorted";
      }

      return {
        id: `col-${idx}`,
        label: `dp[${idx}]`,
        value: val,
        state,
      };
    });

    return {
      kind: "array" as const,
      name: "dp_1d_array",
      elements,
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize a 1D DP array of size ${kEff + 1} to compute C(${nVal}, ${kVal}), setting base case dp[0] = 1 for selecting zero items.`,
      primarySnapshot: createArraySnapshot(0),
    }),
  );

  for (let row = 1; row <= nVal; row++) {
    const maxCol = Math.min(row, kEff);
    for (let col = maxCol; col >= 1; col--) {
      const prevVal = dp[col - 1];
      const oldVal = dp[col];
      dp[col] += prevVal;

      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `In row ${row}, we update dp[${col}] by adding dp[${col - 1}], combining ${oldVal} and ${prevVal} into ${dp[col]}. Updating in reverse preserves values from the previous row.`,
          primarySnapshot: createArraySnapshot(col, col - 1),
        }),
      );
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `The 1D DP array computation completes with C(${nVal}, ${kVal}) = dp[${kEff}] = ${dp[kEff]}, achieving O(n * k) time using only O(k) space.`,
      primarySnapshot: createArraySnapshot(kEff, null, true),
    }),
  );

  return steps;
};

const generate2DMatrixSteps = (nVal: number, kVal: number): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const dp: number[][] = Array.from({ length: nVal + 1 }, () => new Array(kVal + 1).fill(0));

  const createMatrixSnapshot = (
    activeRow: number | null,
    activeCol: number | null,
    parent1: [number, number] | null = null,
    parent2: [number, number] | null = null,
    isDone: boolean = false,
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r <= nVal; r++) {
      for (let c = 0; c <= kVal; c++) {
        let state: MatrixCellItem["state"] = "default";
        if (isDone && r === nVal && c === kVal) {
          state = "sorted";
        } else if (r === activeRow && c === activeCol) {
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
          label: `r${r}c${c}`,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      name: "pascal_matrix_2d",
      rows: nVal + 1,
      cols: kVal + 1,
      cells,
      rowHeaders: Array.from({ length: nVal + 1 }, (_, i) => `n=${i}`),
      colHeaders: Array.from({ length: kVal + 1 }, (_, j) => `k=${j}`),
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize a (${nVal + 1}) x (${kVal + 1}) 2D DP matrix to compute C(${nVal}, ${kVal}) using Pascal's identity C(i, j) = C(i-1, j-1) + C(i-1, j).`,
      primarySnapshot: createMatrixSnapshot(null, null),
    }),
  );

  for (let i = 0; i <= nVal; i++) {
    const maxJ = Math.min(i, kVal);
    for (let j = 0; j <= maxJ; j++) {
      if (j === 0 || j === i) {
        dp[i][j] = 1;
        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `At row ${i} and column ${j}, we set base case C(${i}, ${j}) = 1 because ${j === 0 ? "we are selecting zero items" : "we are selecting all items"}.`,
            primarySnapshot: createMatrixSnapshot(i, j),
          }),
        );
      } else {
        const val1 = dp[i - 1][j - 1];
        const val2 = dp[i - 1][j];
        dp[i][j] = val1 + val2;

        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `At row ${i} and column ${j}, we compute C(${i}, ${j}) = C(${i - 1}, ${j - 1}) + C(${i - 1}, ${j}) by adding ${val1} and ${val2} to get ${dp[i][j]}.`,
            primarySnapshot: createMatrixSnapshot(i, j, [i - 1, j - 1], [i - 1, j]),
          }),
        );
      }
    }
  }

  const ans = dp[nVal][kVal];
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `The 2D Pascal table computation finishes with C(${nVal}, ${kVal}) = ${ans}, filling the full table in O(n * k) time and O(n * k) space.`,
      primarySnapshot: createMatrixSnapshot(nVal, kVal, null, null, true),
    }),
  );

  return steps;
};

const generateMultiplicativeSteps = (nVal: number, kVal: number): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const kEff = Math.min(kVal, nVal - kVal);

  const createArraySnapshot = (
    resultVal: number,
    termLabel: string,
    termValue: string,
    isDone: boolean = false,
  ) => {
    const elements: ArrayElement[] = [
      {
        id: "result",
        label: "Result C(n,k)",
        value: resultVal,
        state: isDone ? "sorted" : "active",
      },
      {
        id: "term",
        label: termLabel,
        value: termValue,
        state: isDone ? "sorted" : "compared",
      },
    ];

    return {
      kind: "array" as const,
      name: "multiplicative_terms",
      elements,
    };
  };

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We compute C(${nVal}, ${kVal}) directly using iterative multiplication, leveraging symmetry k = min(${kVal}, ${nVal - kVal}) = ${kEff} and starting with result = 1.`,
      primarySnapshot: createArraySnapshot(1, "Symmetry k", `${kEff}`),
    }),
  );

  let result = 1;
  for (let i = 1; i <= kEff; i++) {
    const termNum = nVal - i + 1;
    const termDen = i;
    result = Math.floor((result * termNum) / termDen);

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `On loop index ${i}, we multiply the current result by term ${termNum} and divide by ${termDen}, advancing the result to ${result}.`,
        primarySnapshot: createArraySnapshot(result, `Step i=${i}`, `${termNum} / ${termDen}`),
      }),
    );
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `The multiplicative calculation finishes with C(${nVal}, ${kVal}) = ${result}, computing the binomial coefficient directly in O(k) time and O(1) space.`,
      primarySnapshot: createArraySnapshot(result, "Final Answer", `${result}`, true),
    }),
  );

  return steps;
};

export const generateBinomialCoefficientsPascalSteps = (
  input?: BinomialCoefficientsInput,
): AlgorithmStep[] => {
  const safeInput = input ?? DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT;
  const safeN = Number.isFinite(safeInput?.n)
    ? Math.floor(safeInput.n)
    : DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT.n;
  const safeK = Number.isFinite(safeInput?.k)
    ? Math.floor(safeInput.k)
    : DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT.k;

  const nVal = Math.min(10, Math.max(0, safeN));
  const kVal = Math.min(nVal, Math.max(0, safeK));

  if (nVal === 4 && kVal === 2) {
    return generate2DMatrixSteps(4, 2);
  }
  if (nVal === 6 && kVal === 2) {
    return generateMultiplicativeSteps(6, 2);
  }
  return generate1DArraySteps(nVal, kVal);
};

export const BINOMIAL_COEFFICIENTS_PASCAL_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Binomial coefficients C(n, k) count the number of ways to select k items from n items. Pascal's Triangle computes these coefficients recursively using additions only, avoiding integer overflow from large factorials.</p>",
  sections: [
    {
      heading: "Pascal's Identity Recurrence",
      body: "<p>Pascal's identity states that C(n, k) = C(n-1, k-1) + C(n-1, k). Intuitively, when selecting k items from n items, consider one specific element: either it is included (choosing k-1 from the remaining n-1) or excluded (choosing k from the remaining n-1).</p>",
    },
    {
      heading: "Dynamic Programming Table Fill",
      body: "<p>By constructing an (n+1) x (k+1) table and initializing base cases C(i, 0) = 1 and C(i, i) = 1, each interior cell can be computed in O(1) time by adding two cells from the row above.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Binomial Coefficient",
      definition:
        "The number of unordered k-element subsets chosen from an n-element set, written C(n, k) or (n choose k).",
    },
    {
      term: "Pascal's Identity",
      definition:
        "The recurrence C(n, k) = C(n-1, k-1) + C(n-1, k) that relates a combination to smaller subproblems.",
    },
    {
      term: "Combinatorial Symmetry",
      definition:
        "The property C(n, k) = C(n, n-k), reflecting that choosing k items to include is equivalent to choosing n-k items to exclude.",
    },
  ],
};

export const BINOMIAL_COEFFICIENTS_PASCAL_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const binomialCoefficientsPascal: AlgorithmDefinition<BinomialCoefficientsInput> = {
  id: "binomial-coefficients-pascal",
  title: "Binomial Coefficients (Pascal's Triangle)",
  topicIds: ["math_and_number_theory"],
  difficulty: "Easy",
  description:
    "<p>Compute the binomial coefficient <code>C(n, k)</code>, representing the number of ways to choose <code>k</code> items from <code>n</code> items without regard to order.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>n</code> (<code>n &ge; 0</code>): Total number of items.</li>" +
    "<li><code>k</code> (<code>0 &le; k &le; n</code>): Number of items to select.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>int</code>: Binomial coefficient <code>C(n, k)</code>.</li></ul>",
  constraints: ["0 <= k <= n <= 30"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "1D DP (In-Place Array) C(5, 3)",
      inputDisplay: "n = 5, k = 3",
      outputDisplay: "C(5, 3) = 10",
      input: { n: 5, k: 3 },
      output: "10",
      explanation: "Computes C(5, 3) in O(k) space using a 1D array updated in reverse.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "2D DP Matrix C(4, 2)",
      inputDisplay: "n = 4, k = 2",
      outputDisplay: "C(4, 2) = 6",
      input: { n: 4, k: 2 },
      output: "6",
      explanation:
        "Fills a 5x3 2D Pascal table cell by cell using C(i, j) = C(i-1, j-1) + C(i-1, j).",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Multiplicative O(k) Method C(6, 2)",
      inputDisplay: "n = 6, k = 2",
      outputDisplay: "C(6, 2) = 15",
      input: { n: 6, k: 2 },
      output: "15",
      explanation:
        "Computes C(6, 2) in O(k) time and O(1) space via iterative term multiplication.",
    },
  ],
  code: PYTHON_BINOMIAL_COEFFICIENTS_PASCAL_CODE,
  codeVariants: BINOMIAL_COEFFICIENTS_PASCAL_VARIANTS,
  timeComplexity: {
    best: "O(N * K)",
    average: "O(N * K)",
    worst: "O(N * K)",
  },
  spaceComplexity: "O(N * K)",
  complexityAnalysis: {
    time: "Fills an (N+1) x (K+1) DP grid in O(N x K) steps.",
    space: "Requires O(N x K) space.",
  },
  topicGuide: BINOMIAL_COEFFICIENTS_PASCAL_TOPIC_GUIDE,
  trivia: BINOMIAL_COEFFICIENTS_PASCAL_TRIVIA,
  sources: [
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 22,
      chapterTitle: "Combinatorics",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  defaultInput: DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT,
  generateSteps: generateBinomialCoefficientsPascalSteps,
};

export default binomialCoefficientsPascal;
