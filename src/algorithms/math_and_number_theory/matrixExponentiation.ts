import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface MatrixExponentiationInput {
  n: number;
  modulo: number;
}

export const PYTHON_MATRIX_EXPONENTIATION_CODE = `class Solution:
    def __init__(self):
        pass

    def fib(self, n: int, modulo: int = 1_000_000_007) -> int:
        def multiply(a, b):
            return [[sum(a[i][k] * b[k][j] for k in range(2)) % modulo for j in range(2)] for i in range(2)]

        result = [[1, 0], [0, 1]]
        base = [[1, 1], [1, 0]]
        while n:
            if n & 1:
                result = multiply(result, base)
            base = multiply(base, base)
            n >>= 1
        return result[0][1]`;

export const DEFAULT_MATRIX_EXPONENTIATION_INPUT: MatrixExponentiationInput = {
  n: 10,
  modulo: 1000000007,
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      narrative:
        "Linear recurrence relations like the Fibonacci sequence define each term as a linear combination of preceding terms: F(n) = F(n-1) + F(n-2).",
      matrix: [
        [1, 0, 1, 1],
        [0, 1, 1, 0],
      ],
    },
    {
      narrative:
        "Sequential iterative calculation evaluates terms one by one, requiring O(n) scalar additions that become intractable when n reaches 10^18.",
      matrix: [
        ["F(n-1)", "F(n-2)", "Sequential", "O(n)"],
        ["Add", "Step", "Loop", "Linear"],
      ],
    },
    {
      narrative:
        "We reformulate state transitions as matrix-vector multiplications: multiplying the current state vector [F(k), F(k-1)] by a transition matrix M yields [F(k+1), F(k)].",
      matrix: [
        ["F(k+1)", "F(k)", 1, 1],
        ["F(k)", "F(k-1)", 1, 0],
      ],
    },
    {
      narrative:
        "The 2x2 Fibonacci transition matrix M = [[1, 1], [1, 0]] satisfies M x [F(k), F(k-1)]^T = [F(k+1), F(k)]^T.",
      matrix: [
        [1, 1, "F(k+1)", "F(k)"],
        [1, 0, "F(k)", "F(k-1)"],
      ],
    },
    {
      narrative:
        "By associativity of matrix multiplication, applying transition matrix M repeatedly n-1 times gives M^(n-1) x [F(1), F(0)]^T.",
      matrix: [
        ["M^(n-1)", "Power", 1, 1],
        ["Vector", "[1, 0]", 1, 0],
      ],
    },
    {
      narrative:
        "Binary exponentiation computes matrix power M^P in logarithmic O(log P) steps by repeatedly squaring the base matrix B and accumulating when exponent bit is 1.",
      matrix: [
        ["R = I", "R x B", "B^1", "B^2"],
        ["Accum", "Step", "Base", "Square"],
      ],
    },
    {
      narrative:
        "Result matrix R is initialized to the 2x2 identity matrix I = [[1, 0], [0, 1]], while base matrix B starts as transition matrix M = [[1, 1], [1, 0]].",
      matrix: [
        [1, 0, 1, 1],
        [0, 1, 1, 0],
      ],
    },
    {
      narrative:
        "When current exponent power is odd, result accumulator R is updated to R x B (modulo m).",
      matrix: [
        [1, 1, 2, 1],
        [1, 0, 1, 1],
      ],
    },
    {
      narrative:
        "At every step, base matrix B is squared (B <- B x B mod m) and exponent power is halved via integer division.",
      matrix: [
        [2, 1, 5, 3],
        [1, 1, 3, 2],
      ],
    },
    {
      narrative:
        "All intermediate additions and multiplications are reduced modulo m at every step to prevent integer overflow.",
      matrix: [
        ["R[0][0]", "Mod m", "B[0][0]", "Mod m"],
        ["R[1][0]", "Mod m", "B[1][0]", "Mod m"],
      ],
    },
    {
      narrative:
        "Matrix exponentiation achieves O(K^3 log n) time complexity and O(K^2) auxiliary space for K x K transition matrices.",
      matrix: [
        ["O(log n)", "Time", 55, 34],
        ["O(1)", "Space", 34, 21],
      ],
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: {
        kind: "matrix",
        name: "matrix_pow_concept",
        rows: 2,
        cols: 4,
        cells: data.matrix.flatMap((row, rIdx) =>
          row.map((val, cIdx) => ({
            row: rIdx,
            col: cIdx,
            value: val,
            label: cIdx < 2 ? `R[${rIdx}][${cIdx}]` : `B[${rIdx}][${cIdx - 2}]`,
            state: cIdx < 2 ? ("sorted" as const) : ("default" as const),
          })),
        ),
        rowHeaders: ["Row 0", "Row 1"],
        colHeaders: ["Res[0]", "Res[1]", "Base[0]", "Base[1]"],
      },
    }),
  );
};

export const generateMatrixExponentiationSteps = (
  input: MatrixExponentiationInput,
): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const rawN =
    input && typeof input.n === "number"
      ? Math.floor(input.n)
      : DEFAULT_MATRIX_EXPONENTIATION_INPUT.n;
  const n = rawN < 0 ? 0 : rawN;
  const mod =
    input && typeof input.modulo === "number" && input.modulo > 0
      ? Math.floor(input.modulo)
      : DEFAULT_MATRIX_EXPONENTIATION_INPUT.modulo;

  const createMatrixSnapshot = (
    matRes: number[][],
    matBase: number[][],
    isDone: boolean = false,
    activeRole: "none" | "res" | "base" = "none",
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const isRes = c < 2;
        const val = isRes ? matRes[r][c] : matBase[r][c - 2];
        let state: MatrixCellItem["state"] = isRes ? "sorted" : "default";

        if (isDone && r === 0 && c === 0) {
          state = "active";
        } else if (activeRole === "res" && isRes) {
          state = "active";
        } else if (activeRole === "base" && !isRes) {
          state = "active";
        }

        cells.push({
          row: r,
          col: c,
          value: val,
          label: isRes ? `R[${r}][${c}]` : `B[${r}][${c - 2}]`,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      name: "matrix_pow_state",
      rows: 2,
      cols: 4,
      cells,
      rowHeaders: ["Row 0", "Row 1"],
      colHeaders: ["Res[0]", "Res[1]", "Base[0]", "Base[1]"],
    };
  };

  const matMult = (A: number[][], B: number[][]): number[][] => {
    const C = [
      [0, 0],
      [0, 0],
    ];
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        let sum = 0;
        for (let k = 0; k < 2; k++) {
          sum = (sum + A[i][k] * B[k][j]) % mod;
        }
        C[i][j] = sum;
      }
    }
    return C;
  };

  if (n === 0) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Target n = 0 is the base case, returning Fibonacci F(0) = 0 immediately.`,
        primarySnapshot: createMatrixSnapshot(
          [
            [0, 0],
            [0, 0],
          ],
          [
            [1, 1],
            [1, 0],
          ],
          true,
        ),
      }),
    );
    return steps;
  }

  let res = [
    [1, 0],
    [0, 1],
  ];
  let base = [
    [1, 1],
    [1, 0],
  ];

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize result accumulator R to identity matrix [[1, 0], [0, 1]] and base matrix B to Fibonacci transition matrix [[1, 1], [1, 0]] for power P = ${n - 1}.`,
      primarySnapshot: createMatrixSnapshot(res, base),
    }),
  );

  let power = n - 1;
  while (power > 0) {
    const isOdd = power % 2 === 1;

    if (isOdd) {
      res = matMult(res, base);
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Exponent power ${power} is odd, so we multiply result accumulator by base matrix: R = R x B (modulo ${mod}).`,
          primarySnapshot: createMatrixSnapshot(res, base, false, "res"),
        }),
      );
    }

    base = matMult(base, base);
    power = Math.floor(power / 2);

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `We square base matrix B = B x B (modulo ${mod}) and halve exponent power to ${power}.`,
        primarySnapshot: createMatrixSnapshot(res, base, false, "base"),
      }),
    );
  }

  const ans = res[0][0];
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Matrix binary exponentiation completes: n-th Fibonacci number F(${n}) = ${ans} (modulo ${mod}).`,
      primarySnapshot: createMatrixSnapshot(res, base, true),
    }),
  );

  return steps;
};

export const MATRIX_EXPONENTIATION_TOPIC_GUIDE: TopicGuide = {
  overview: "<p>Matrix Exponentiation computes linear recurrence terms in O(K^3 log n) time.</p>",
  sections: [
    {
      heading: "Repeated Squaring",
      body: "<p>Squares the transformation matrix repeatedly to evaluate M^n in logarithmic steps.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Transformation Matrix",
      definition: "Square matrix defining linear recurrence state transitions.",
    },
  ],
};

export const MATRIX_EXPONENTIATION_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const matrixExponentiation: AlgorithmDefinition<MatrixExponentiationInput> = {
  id: "matrix-exponentiation",
  title: "Matrix Exponentiation",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Given a non-negative integer <code>n</code> and a modulo divisor <code>modulo</code>, compute the <code>n</code>-th Fibonacci number <code>F(n) mod modulo</code>.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>n</code>: Target term index in the Fibonacci sequence.</li>" +
    "<li><code>modulo</code>: Modulo integer divisor.</li></ul>" +
    "<h3>Output Format</h3>" +
    "<ul><li>An integer representing <code>F(n) mod modulo</code>.</li></ul>",
  constraints: ["0 <= n <= 10^18", "1 <= modulo <= 2 * 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "10th Fibonacci number",
      input: { n: 10, modulo: 1000000007 },
      output: "55",
      explanation: "F(10) = 55.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Zero term F(0)",
      input: { n: 0, modulo: 1000000007 },
      output: "0",
      explanation: "F(0) = 0.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "50th Fibonacci number modulo 10^9+7",
      input: { n: 50, modulo: 1000000007 },
      output: "203650110",
      explanation: "F(50) mod (10^9+7) = 203650110.",
    },
  ],
  code: PYTHON_MATRIX_EXPONENTIATION_CODE,
  timeComplexity: {
    best: "O(k^3 log n)",
    average: "O(k^3 log n)",
    worst: "O(k^3 log n)",
  },
  spaceComplexity: "O(k^2)",
  complexityAnalysis: {
    time: "Requires O(log n) matrix multiplications of size K x K, taking O(K^3 log n) time.",
    space: "Requires O(K^2) memory.",
  },
  topicGuide: MATRIX_EXPONENTIATION_TOPIC_GUIDE,
  trivia: MATRIX_EXPONENTIATION_TRIVIA,
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 509,
      leetcodeId: 509,
      url: "https://leetcode.com/problems/fibonacci-number/",
      label: "LeetCode #509",
      title: "Fibonacci Number",
    },
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 23,
      chapterTitle: "Matrices",
      section: "23.2 Linear recurrences",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  leetcode: {
    id: 509,
    url: "https://leetcode.com/problems/fibonacci-number/",
  },
  defaultInput: DEFAULT_MATRIX_EXPONENTIATION_INPUT,
  generateSteps: generateMatrixExponentiationSteps,
};

export default matrixExponentiation;
