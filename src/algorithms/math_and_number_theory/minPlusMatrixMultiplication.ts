import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface MinPlusMatrixMultiplicationInput {
  A: number[][];
  B: number[][];
}

export const PYTHON_MIN_PLUS_MATRIX_MULTIPLICATION_CODE = `class Solution:
    def __init__(self):
        pass

    def minPlusPower(self, n: int, adj: list[list[int]], k: int) -> list[list[int]]:
        inf = float("inf")

        def multiply(a, b):
            return [[min(a[i][t] + b[t][j] for t in range(n)) for j in range(n)] for i in range(n)]

        result = [[0 if i == j else inf for j in range(n)] for i in range(n)]
        base = [row[:] for row in adj]
        while k:
            if k & 1:
                result = multiply(result, base)
            base = multiply(base, base)
            k >>= 1
        return result`;

export const DEFAULT_MIN_PLUS_MATRIX_MULTIPLICATION_INPUT: MinPlusMatrixMultiplicationInput = {
  A: [
    [0, 3],
    [5, 0],
  ],
  B: [
    [0, 2],
    [1, 0],
  ],
};

const createMatrixSnapshot = (
  C: (number | string)[][],
  name: string,
  activeCell?: { r: number; c: number },
  isDone = false,
  isCellFinalized = false,
): PrimaryVisualSnapshot => {
  const rows = C.length;
  const cols = C[0].length;
  const cells: MatrixCellItem[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let state: MatrixCellItem["state"] = "default";
      if (isDone) {
        state = "sorted";
      } else if (activeCell && activeCell.r === r && activeCell.c === c) {
        state = isCellFinalized ? "sorted" : "active";
      } else if (C[r][c] !== "inf" && C[r][c] !== "INF" && C[r][c] !== "?") {
        state = "compared";
      }

      cells.push({
        row: r,
        col: c,
        value: C[r][c],
        label: `C[${r}][${c}]`,
        state,
      });
    }
  }

  return {
    kind: "matrix",
    name,
    rows,
    cols,
    cells,
    rowHeaders: Array.from({ length: rows }, (_, i) => `r${i}`),
    colHeaders: Array.from({ length: cols }, (_, i) => `c${i}`),
  };
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const sampleC1 = [
    ["?", "?"],
    ["?", "?"],
  ];

  const sampleC2 = [
    [0, "?"],
    ["?", "?"],
  ];

  const sampleC3 = [
    [0, 2],
    ["?", "?"],
  ];

  const sampleC4 = [
    [0, 2],
    [1, 0],
  ];

  const introData = [
    {
      narrative:
        "Min-Plus Matrix Multiplication (the Tropical Semiring product) modifies standard matrix multiplication by replacing scalar addition with minimum and multiplication with addition.",
      C: sampleC1,
      cell: undefined,
    },
    {
      narrative:
        "In standard matrix algebra, entry C[i][j] = sum_k (A[i][k] * B[k][j]). In Min-Plus matrix algebra, entry C[i][j] = min_k (A[i][k] + B[k][j]).",
      C: sampleC1,
      cell: { r: 0, c: 0 },
    },
    {
      narrative:
        "When matrices represent edge distance weights, A[i][k] + B[k][j] calculates the exact total weight of a 2-step path from vertex i to vertex j via intermediate vertex k.",
      C: sampleC2,
      cell: { r: 0, c: 0 },
    },
    {
      narrative:
        "Taking the minimum over all intermediate vertices k finds the optimal shortest 2-step path cost between vertex i and vertex j.",
      C: sampleC3,
      cell: { r: 0, c: 1 },
    },
    {
      narrative:
        "Evaluating all-pairs shortest paths in Floyd-Warshall is mathematically equivalent to computing repeated Min-Plus matrix power D^(N-1) = D x D x ... x D.",
      C: sampleC4,
      cell: { r: 1, c: 0 },
    },
    {
      narrative:
        "Standard nested three-loop iteration requires N^3 additions and comparisons, giving a baseline time complexity of O(N^3).",
      C: sampleC4,
      cell: { r: 1, c: 1 },
    },
    {
      narrative:
        "Because the Tropical Semiring lacks additive inverses (it forms a semiring rather than a ring), fast matrix algorithms like Strassen cannot be directly applied.",
      C: sampleC4,
      cell: { r: 0, c: 0 },
    },
    {
      narrative:
        "Min-Plus matrix algebra is vital in graph distance computation, dynamic programming optimization, Viterbi parsing, and tropical geometry.",
      C: sampleC4,
      cell: { r: 1, c: 1 },
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: createMatrixSnapshot(
        data.C,
        "min_plus_concept_matrix",
        data.cell,
        idx === introData.length - 1,
      ),
    }),
  );
};

export const generateMinPlusMatrixMultiplicationSteps = (
  input?: MinPlusMatrixMultiplicationInput,
): AlgorithmStep[] => {
  const A =
    input && Array.isArray(input.A) && input.A.length > 0
      ? input.A
      : DEFAULT_MIN_PLUS_MATRIX_MULTIPLICATION_INPUT.A;
  const B =
    input && Array.isArray(input.B) && input.B.length > 0
      ? input.B
      : DEFAULT_MIN_PLUS_MATRIX_MULTIPLICATION_INPUT.B;

  const n = A.length;
  const m = B[0].length;
  const kLen = B.length;

  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const C: (number | string)[][] = Array.from({ length: n }, () => Array(m).fill("?"));

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Initializing ${n}x${m} output distance matrix C for Min-Plus matrix product C[i][j] = min_k (A[i][k] + B[k][j]).`,
      primarySnapshot: createMatrixSnapshot(C, "min_plus_product_matrix"),
    }),
  );

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      let minVal = Infinity;
      let bestK = -1;

      for (let k = 0; k < kLen; k++) {
        const val = A[i][k] + B[k][j];
        if (val < minVal) {
          minVal = val;
          bestK = k;
        }

        C[i][j] = val;

        steps.push(
          createTutorialStep({
            stepIndex: stepIndex++,
            phase: "walkthrough",
            narrative: `Evaluating cell C[${i}][${j}] via intermediate k = ${k}: A[${i}][${k}] (${A[i][k]}) + B[${k}][${j}] (${B[k][j]}) = ${val}. Current minimum distance: ${minVal}.`,
            primarySnapshot: createMatrixSnapshot(C, "min_plus_product_matrix", { r: i, c: j }),
          }),
        );
      }

      C[i][j] = minVal;

      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Set C[${i}][${j}] = ${minVal} (optimal shortest 2-step path via intermediate node k = ${bestK}).`,
          primarySnapshot: createMatrixSnapshot(
            C,
            "min_plus_product_matrix",
            { r: i, c: j },
            false,
            true,
          ),
        }),
      );
    }
  }

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Min-Plus matrix multiplication completes. Output matrix C contains all minimum 2-step path costs.`,
      primarySnapshot: createMatrixSnapshot(C, "final_min_plus_product_matrix", undefined, true),
    }),
  );

  return steps;
};

export const MIN_PLUS_MATRIX_MULTIPLICATION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Min-Plus Matrix Multiplication (Tropical Semiring product) computes shortest 2-step paths in O(N^3) time.</p>",
  sections: [
    {
      heading: "Tropical Semiring Algebra",
      body: "<p>Replaces (x, +) with (+, min). Used in dynamic programming and graph shortest path computation.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Tropical Semiring",
      definition: "Algebraic structure over numbers with operations min and addition.",
    },
  ],
};

export const minPlusMatrixMultiplication: AlgorithmDefinition<MinPlusMatrixMultiplicationInput> = {
  id: "min-plus-matrix-multiplication",
  title: "Min-Plus Matrix Multiplication",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Given two <code>N &times; N</code> distance matrices <code>A</code> and <code>B</code>, compute their Min-Plus matrix product (Tropical Semiring product) matrix <code>C</code>.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "<li><code>A</code>: An <code>N &times; N</code> matrix of real or integer edge distance values.</li>" +
    "<li><code>B</code>: An <code>N &times; N</code> matrix of real or integer edge distance values.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<ul>" +
    "<li>An <code>N &times; N</code> matrix <code>C</code> representing the Min-Plus product of <code>A</code> and <code>B</code>.</li>" +
    "</ul>",
  constraints: ["1 <= N <= 10"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard 2x2 distance matrices",
      input: {
        A: [
          [0, 3],
          [5, 0],
        ],
        B: [
          [0, 2],
          [1, 0],
        ],
      },
      output: "[[0, 2], [1, 0]]",
      explanation:
        "C[0][0] = min(0+0, 3+1) = 0; C[0][1] = min(0+2, 3+0) = 2; C[1][0] = min(5+0, 0+1) = 1; C[1][1] = min(5+2, 0+0) = 0.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "1x1 single element matrices",
      input: { A: [[5]], B: [[3]] },
      output: "[[8]]",
      explanation: "C[0][0] = min(5 + 3) = 8.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "2x2 positive weights matrix product",
      input: {
        A: [
          [1, 2],
          [3, 4],
        ],
        B: [
          [5, 6],
          [7, 8],
        ],
      },
      output: "[[6, 7], [8, 9]]",
      explanation: "C[0][0] = min(1+5, 2+7) = 6; C[0][1] = min(1+6, 2+8) = 7.",
    },
  ],
  code: PYTHON_MIN_PLUS_MATRIX_MULTIPLICATION_CODE,
  timeComplexity: {
    best: "O(N^3)",
    average: "O(N^3)",
    worst: "O(N^3)",
  },
  spaceComplexity: "O(N^2)",
  complexityAnalysis: {
    time: "Three nested loops iterate N times to find minimum path additions.",
    space: "Requires O(N^2) space to store the product matrix.",
  },
  topicGuide: MIN_PLUS_MATRIX_MULTIPLICATION_TOPIC_GUIDE,
  trivia: {
    lineExplanations: {},
  },
  sources: [
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 23,
      chapterTitle: "Matrices",
      section: "23.3 Graphs and matrices",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  defaultInput: DEFAULT_MIN_PLUS_MATRIX_MULTIPLICATION_INPUT,
  generateSteps: generateMinPlusMatrixMultiplicationSteps,
};

export default minPlusMatrixMultiplication;
