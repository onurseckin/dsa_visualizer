import type {
  AlgorithmDefinition,
  AlgorithmStep,
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
        k = min(k, n - k)
        row = [0] * (k + 1)
        row[0] = 1
        for i in range(1, n + 1):
            for j in range(min(i, k), 0, -1):
                row[j] += row[j - 1]
        return row[k]`;

export const DEFAULT_BINOMIAL_COEFFICIENTS_PASCAL_INPUT: BinomialCoefficientsInput = {
  n: 5,
  k: 3,
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introMatrices = [
    [[1, 0, 0, 0]],
    [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
    ],
    [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [1, 2, 1, 0],
    ],
    [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [1, 2, 1, 0],
      [1, 3, 3, 1],
    ],
    [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [1, 2, 1, 0],
      [1, 3, 3, 1],
      [1, 4, 6, 4],
    ],
    [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [1, 2, 1, 0],
      [1, 3, 3, 1],
      [1, 4, 6, 4],
      [1, 5, 10, 10],
    ],
    [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [1, 2, 1, 0],
      [1, 3, 3, 1],
      [1, 4, 6, 4],
      [1, 5, 10, 10],
    ],
    [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [1, 2, 1, 0],
      [1, 3, 3, 1],
      [1, 4, 6, 4],
      [1, 5, 10, 10],
    ],
    [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [1, 2, 1, 0],
      [1, 3, 3, 1],
      [1, 4, 6, 4],
      [1, 5, 10, 10],
    ],
  ];

  const introNarratives = [
    "The binomial coefficient C(n, k) counts the number of ways to choose an unordered subset of k elements from a set of n distinct elements.",
    "For example, selecting 2 items out of 4 distinct items yields 6 unique combinations, representing all non-overlapping subset choices.",
    "Directly evaluating C(n, k) = n! / (k! x (n-k)!) causes severe integer overflow because factorials grow rapidly even for modest values like n = 21.",
    "Pascal's identity computes combinations recursively without factorials via C(n, k) = C(n-1, k-1) + C(n-1, k).",
    "Focus on one element x: either include x (choose k-1 items from the remaining n-1) or exclude x (choose k items from n-1), adding both possibilities.",
    "Choosing 0 items yields C(i, 0) = 1 (the single empty set), and choosing all i items yields C(i, i) = 1 (the single full set), forming grid boundaries.",
    "We populate an (n+1) x (k+1) table row by row from top to bottom, computing each interior cell from two known cells in the row above.",
    "Choosing k items to include is mathematically equivalent to choosing n-k items to exclude, guaranteeing symmetry C(n, k) = C(n, n-k).",
    "Filling the DP grid takes O(n * k) time and O(n * k) space, which can be optimized to O(k) space using a single 1D array.",
  ];

  return introNarratives.map((narrative, idx) => {
    const mat = introMatrices[idx];
    const cells: MatrixCellItem[] = mat.flatMap((row, rIdx) =>
      row.map((val, cIdx) => {
        let state: MatrixCellItem["state"] = "default";
        if (idx === 6 && rIdx === 4 && (cIdx === 1 || cIdx === 2)) {
          state = "compared";
        } else if (idx === 6 && rIdx === 5 && cIdx === 2) {
          state = "active";
        } else if (idx === 7 && rIdx === 5 && (cIdx === 1 || cIdx === 4)) {
          state = "active";
        } else if (idx === 8) {
          state = "sorted";
        } else if (rIdx === mat.length - 1) {
          state = "active";
        }
        return {
          row: rIdx,
          col: cIdx,
          value: val,
          label: `r${rIdx}c${cIdx}`,
          state,
        };
      }),
    );

    return createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative,
      primarySnapshot: {
        kind: "matrix",
        name: "pascal_concept",
        rows: mat.length,
        cols: 4,
        cells,
        rowHeaders: mat.map((_, r) => `n=${r}`),
        colHeaders: ["k=0", "k=1", "k=2", "k=3"],
      },
    });
  });
};

export const generateBinomialCoefficientsPascalSteps = (
  input?: BinomialCoefficientsInput,
): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

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
      name: "pascal_matrix",
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
      narrative: `We initialize an (${nVal + 1}) x (${kVal + 1}) Pascal table to compute C(${nVal}, ${kVal}).`,
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
            narrative: `We set base case C(${i}, ${j}) = 1 (${j === 0 ? "choosing 0 items" : "choosing all items"}).`,
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
            narrative: `We calculate C(${i}, ${j}) = C(${i - 1}, ${j - 1}) + C(${i - 1}, ${j}) = ${val1} + ${val2} = ${dp[i][j]}.`,
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
      narrative: `Pascal table fill is complete: binomial coefficient C(${nVal}, ${kVal}) = ${ans}.`,
      primarySnapshot: createMatrixSnapshot(nVal, kVal, null, null, true),
    }),
  );

  return steps;
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
      title: "Standard Combination C(5, 3)",
      inputDisplay: "n = 5, k = 3",
      outputDisplay: "C(5, 3) = 10",
      input: { n: 5, k: 3 },
      output: "10",
      explanation: "5! / (3! * 2!) = 10.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Boundary Case C(4, 0)",
      inputDisplay: "n = 4, k = 0",
      outputDisplay: "C(4, 0) = 1",
      input: { n: 4, k: 0 },
      output: "1",
      explanation: "There is exactly 1 way to choose 0 items from 4.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Symmetric Property C(6, 2)",
      inputDisplay: "n = 6, k = 2",
      outputDisplay: "C(6, 2) = 15",
      input: { n: 6, k: 2 },
      output: "15",
      explanation: "C(6, 2) = C(6, 4) = 15.",
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
