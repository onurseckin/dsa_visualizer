import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  PrimaryVisualSnapshot,
  TopicGuide,
} from "../../types/dsa";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface TribonacciMatrixInput {
  n: number;
}

export const PYTHON_TRIBONACCI_MATRIX_CODE = `class Solution:
    def __init__(self):
        pass

    def tribonacci(self, n: int) -> int:
        def multiply(a, b):
            return [[sum(a[i][k] * b[k][j] for k in range(3)) for j in range(3)] for i in range(3)]

        if n == 0:
            return 0
        result = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
        base = [[1, 1, 1], [1, 0, 0], [0, 1, 0]]
        power = n - 1
        while power:
            if power & 1:
                result = multiply(result, base)
            base = multiply(base, base)
            power >>= 1
        return result[0][0]`;

export const DEFAULT_TRIBONACCI_MATRIX_INPUT: TribonacciMatrixInput = { n: 4 };

const createTribonacciMatrixSnapshot = (
  matRes: (number | string)[][],
  matBase: (number | string)[][],
  isDone = false,
  activeRole: "none" | "res" | "base" = "none",
): PrimaryVisualSnapshot => {
  const cells: MatrixCellItem[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++) {
      const isRes = c < 3;
      const val = isRes ? matRes[r][c] : matBase[r][c - 3];
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
        label: isRes ? `R[${r}][${c}]` : `B[${r}][${c - 3}]`,
        state,
      });
    }
  }

  return {
    kind: "matrix",
    name: "tribonacci_matrix_state",
    rows: 3,
    cols: 6,
    cells,
    rowHeaders: ["Row 0", "Row 1", "Row 2"],
    colHeaders: ["R[0]", "R[1]", "R[2]", "B[0]", "B[1]", "B[2]"],
  };
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      narrative:
        "The Tribonacci sequence generalizes Fibonacci by defining each term as the sum of the previous three terms: T(n) = T(n-1) + T(n-2) + T(n-3), with base cases T(0)=0, T(1)=1, T(2)=1.",
      res: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      base: [
        [1, 1, 1],
        [1, 0, 0],
        [0, 1, 0],
      ],
    },
    {
      narrative:
        "Sequential iterative calculation computes terms linearly in O(n) steps, requiring millions of additions when n becomes large.",
      res: [
        ["T(n-1)", "T(n-2)", "T(n-3)"],
        ["Add", "Loop", "Linear"],
        ["O(n)", "Step", "Count"],
      ],
      base: [
        [1, 1, 1],
        [1, 0, 0],
        [0, 1, 0],
      ],
    },
    {
      narrative:
        "We express 3-term linear recurrences as 3x3 matrix state transformations: state vector [T(k), T(k-1), T(k-2)]^T advances to [T(k+1), T(k), T(k-1)]^T via transition matrix M.",
      res: [
        ["T(k+1)", "T(k)", "T(k-1)"],
        ["T(k)", "T(k-1)", "T(k-2)"],
        [1, 1, 1],
      ],
      base: [
        [1, 1, 1],
        [1, 0, 0],
        [0, 1, 0],
      ],
    },
    {
      narrative:
        "The canonical 3x3 Tribonacci transition matrix M = [[1, 1, 1], [1, 0, 0], [0, 1, 0]] encapsulates state shifting and 3-term addition in one operation.",
      res: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      base: [
        [1, 1, 1],
        [1, 0, 0],
        [0, 1, 0],
      ],
    },
    {
      narrative:
        "Applying transition matrix M repeatedly n-2 times evaluates M^(n-2) x [T(2), T(1), T(0)]^T = M^(n-2) x [1, 1, 0]^T.",
      res: [
        ["M^(n-2)", "State", "Vector"],
        ["[1, 1, 0]^T", "Base", "Init"],
        [1, 0, 0],
      ],
      base: [
        [1, 1, 1],
        [1, 0, 0],
        [0, 1, 0],
      ],
    },
    {
      narrative:
        "Binary exponentiation calculates matrix power M^P in logarithmic O(log P) steps by repeatedly squaring base matrix B.",
      res: [
        ["R = I", "Accum", "Power"],
        ["B^1", "B^2", "B^4"],
        [1, 0, 0],
      ],
      base: [
        [1, 1, 1],
        [1, 0, 0],
        [0, 1, 0],
      ],
    },
    {
      narrative:
        "Result accumulator R starts as 3x3 identity matrix I = [[1,0,0],[0,1,0],[0,0,1]], and base matrix B starts as transition matrix M.",
      res: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      base: [
        [1, 1, 1],
        [1, 0, 0],
        [0, 1, 0],
      ],
    },
    {
      narrative:
        "When exponent power P is odd, result accumulator matrix R is updated via matrix multiplication R = R x B.",
      res: [
        [1, 1, 1],
        [1, 0, 0],
        [0, 1, 0],
      ],
      base: [
        [1, 1, 1],
        [1, 0, 0],
        [0, 1, 0],
      ],
    },
    {
      narrative:
        "At every step, base matrix B is squared (B <- B x B) and exponent power P is halved via integer division.",
      res: [
        [1, 1, 1],
        [1, 0, 0],
        [0, 1, 0],
      ],
      base: [
        [3, 2, 1],
        [2, 1, 1],
        [1, 1, 0],
      ],
    },
    {
      narrative:
        "Multiplying two 3x3 matrices requires 3^3 = 27 scalar multiplications, giving O(3^3 log n) = O(log n) total time and O(1) space.",
      res: [
        [4, 2, 1],
        [2, 1, 1],
        [1, 1, 0],
      ],
      base: [
        [13, 9, 5],
        [9, 6, 3],
        [5, 3, 2],
      ],
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: createTribonacciMatrixSnapshot(data.res, data.base),
    }),
  );
};

export const generateTribonacciMatrixSteps = (input?: TribonacciMatrixInput): AlgorithmStep[] => {
  const n = input && typeof input.n === "number" ? Math.max(0, Math.floor(input.n)) : 4;
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const matMult3x3 = (A: number[][], B: number[][]): number[][] => {
    const C = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let sum = 0;
        for (let k = 0; k < 3; k++) {
          sum += A[i][k] * B[k][j];
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
        narrative: `Target n = 0 is a base case, returning Tribonacci T(0) = 0 immediately.`,
        primarySnapshot: createTribonacciMatrixSnapshot(
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
          [
            [1, 1, 1],
            [1, 0, 0],
            [0, 1, 0],
          ],
          true,
        ),
      }),
    );
    return steps;
  }

  if (n === 1 || n === 2) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Target n = ${n} is a base case, returning Tribonacci T(${n}) = 1 immediately.`,
        primarySnapshot: createTribonacciMatrixSnapshot(
          [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
          ],
          [
            [1, 1, 1],
            [1, 0, 0],
            [0, 1, 0],
          ],
          true,
        ),
      }),
    );
    return steps;
  }

  let res = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  let base = [
    [1, 1, 1],
    [1, 0, 0],
    [0, 1, 0],
  ];

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize result accumulator R to 3x3 identity matrix and base matrix B to transition matrix M for exponent power P = ${n - 2}.`,
      primarySnapshot: createTribonacciMatrixSnapshot(res, base),
    }),
  );

  let power = n - 2;
  while (power > 0) {
    const isOdd = power % 2 === 1;

    if (isOdd) {
      res = matMult3x3(res, base);
      steps.push(
        createTutorialStep({
          stepIndex: stepIndex++,
          phase: "walkthrough",
          narrative: `Exponent power P = ${power} is odd, so we multiply result accumulator by base matrix: R = R x B.`,
          primarySnapshot: createTribonacciMatrixSnapshot(res, base, false, "res"),
        }),
      );
    }

    base = matMult3x3(base, base);
    power = Math.floor(power / 2);

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `We square base matrix B = B x B and halve exponent power to P = ${power}.`,
        primarySnapshot: createTribonacciMatrixSnapshot(res, base, false, "base"),
      }),
    );
  }

  // T(n) = res[0][0]*T(2) + res[0][1]*T(1) + res[0][2]*T(0) = res[0][0]*1 + res[0][1]*1 + res[0][2]*0
  const ans = res[0][0] + res[0][1];

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Matrix exponentiation completes: multiplying top row of R by initial state vector [1, 1, 0]^T gives T(${n}) = ${res[0][0]}*(1) + ${res[0][1]}*(1) + ${res[0][2]}*(0) = ${ans}.`,
      primarySnapshot: createTribonacciMatrixSnapshot(res, base, true),
    }),
  );

  return steps;
};

export const TRIBONACCI_MATRIX_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Tribonacci Matrix Exponentiation computes the n-th Tribonacci number in logarithmic time O(log n).</p>",
  sections: [
    {
      heading: "3x3 Transition Matrix",
      body: "<p>The 3x3 matrix [[1, 1, 1], [1, 0, 0], [0, 1, 0]] shifts state vectors and adds the three preceding terms.</p>",
    },
  ],
  keyTerms: [
    {
      term: "State Vector",
      definition: "Column vector storing three consecutive Tribonacci terms.",
    },
  ],
};

export const tribonacciMatrix: AlgorithmDefinition<TribonacciMatrixInput> = {
  id: "tribonacci-matrix",
  title: "N-th Tribonacci Matrix Exponentiation",
  topicIds: ["math_and_number_theory"],
  difficulty: "Hard",
  description:
    "<p>Given a non-negative integer <code>n</code>, compute the <code>n</code>-th Tribonacci number <code>T(n)</code>, defined by <code>T(0) = 0</code>, <code>T(1) = 1</code>, <code>T(2) = 1</code>, and <code>T(k) = T(k-1) + T(k-2) + T(k-3)</code> for <code>k &ge; 3</code>.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>n</code>: Target sequence index (<code>n &ge; 0</code>).</li></ul>" +
    "<h3>Output Format</h3>" +
    "<ul><li>An integer representing the <code>n</code>-th Tribonacci number <code>T(n)</code>.</li></ul>",
  constraints: ["0 <= n <= 37"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "4th Tribonacci number",
      input: { n: 4 },
      output: "4",
      explanation: "T(4) = T(3) + T(2) + T(1) = 2 + 1 + 1 = 4.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Base case n = 0",
      input: { n: 0 },
      output: "0",
      explanation: "T(0) = 0 by definition.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "5th Tribonacci number",
      input: { n: 5 },
      output: "7",
      explanation: "T(5) = T(4) + T(3) + T(2) = 4 + 2 + 1 = 7.",
    },
  ],
  code: PYTHON_TRIBONACCI_MATRIX_CODE,
  timeComplexity: {
    best: "O(log n)",
    average: "O(log n)",
    worst: "O(log n)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Matrix multiplication is O(3^3) = O(1). Exponentiation takes O(log n) steps.",
    space: "O(1) auxiliary space for 3x3 matrices.",
  },
  topicGuide: TRIBONACCI_MATRIX_TOPIC_GUIDE,
  trivia: { lineExplanations: {} },
  sources: [
    {
      kind: "leetcode",
      type: "leetcode",
      id: 1137,
      leetcodeId: 1137,
      url: "https://leetcode.com/problems/n-th-tribonacci-number/",
      label: "LeetCode #1137",
      title: "N-th Tribonacci Number",
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
    id: 1137,
    url: "https://leetcode.com/problems/n-th-tribonacci-number/",
  },
  defaultInput: DEFAULT_TRIBONACCI_MATRIX_INPUT,
  generateSteps: generateTribonacciMatrixSteps,
};

export default tribonacciMatrix;
