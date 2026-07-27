import type { AlgorithmDefinition, AlgorithmStep, GridCellNode, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface MatrixExponentiationInput {
  n: number;
  modulo: number;
}

export const PYTHON_MATRIX_EXPONENTIATION_CODE = `
def multiply_matrix(A: list[list[int]], B: list[list[int]], mod: int) -> list[list[int]]:
    return [
        [(A[0][0]*B[0][0] + A[0][1]*B[1][0]) % mod, (A[0][0]*B[0][1] + A[0][1]*B[1][1]) % mod],
        [(A[1][0]*B[0][0] + A[1][1]*B[1][0]) % mod, (A[1][0]*B[0][1] + A[1][1]*B[1][1]) % mod]
    ]

def fibonacci_matrix_pow(n: int, mod: int = 1000000007) -> int:
    """
    Computes the n-th Fibonacci number modulo mod using binary matrix exponentiation in O(log n) time.
    """
    if n == 0:
        return 0
    res = [[1, 0], [0, 1]]
    base = [[1, 1], [1, 0]]
    power = n - 1
    while power > 0:
        if power % 2 == 1:
            res = multiply_matrix(res, base, mod)
        base = multiply_matrix(base, base, mod)
        power //= 2
    return res[0][0]
`;

export const DEFAULT_MATRIX_EXPONENTIATION_INPUT: MatrixExponentiationInput = {
  n: 10,
  modulo: 1000000007,
};

export const generateMatrixExponentiationSteps = (
  input: MatrixExponentiationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawN = Math.floor(input.n);
  const n = rawN < 0 ? 0 : rawN;
  const mod = input.modulo > 0 ? Math.floor(input.modulo) : 1000000007;

  const matrixToGrid = (
    mat: number[][],
    baseMat: number[][],
    activePos?: { row: number; col: number },
  ): GridCellNode[][] => {
    // 2x4 grid: left 2x2 is res, right 2x2 is base
    const grid: GridCellNode[][] = [];
    for (let r = 0; r < 2; r++) {
      const row: GridCellNode[] = [];
      for (let c = 0; c < 4; c++) {
        const isRes = c < 2;
        const val = isRes ? mat[r][c] : baseMat[r][c - 2];
        const isActive =
          activePos &&
          (isRes
            ? activePos.row === r && activePos.col === c
            : activePos.row === r && activePos.col === c - 2);

        row.push({
          row: r,
          col: c,
          distance: val,
          isVisited: isRes,
          isPath: isActive,
          state: isActive ? "active" : isRes ? "sorted" : "default",
        });
      }
      grid.push(row);
    }
    return grid;
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
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: "N = 0 requested for Fibonacci calculation.",
        why: "Fibonacci F(0) is defined as 0.",
      },
      primarySnapshot: {
        kind: "grid",
        grid: matrixToGrid(
          [
            [0, 0],
            [0, 0],
          ],
          [
            [1, 1],
            [1, 0],
          ],
        ),
      },
      auxiliaryState: {
        hashMap: { "Fibonacci Term F(0)": 0 },
      },
      variables: { n: 0, result: 0 },
    });
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
  let power = n - 1;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 13,
    explanation: {
      what: `Initializing Matrix Exponentiation for F(${n}). Power required: ${power}.`,
      why: "Fibonacci matrix [[1,1],[1,0]] raised to power (n-1) yields [[F(n), F(n-1)], [F(n-1), F(n-2)]].",
    },
    primarySnapshot: {
      kind: "grid",
      grid: matrixToGrid(res, base),
    },
    auxiliaryState: {
      hashMap: {
        "Target Term F(n)": n,
        "Remaining Power": power,
        "Result Matrix": "Identity [[1,0],[0,1]]",
        "Base Matrix": "Transformation [[1,1],[1,0]]",
      },
    },
    variables: { power, n },
  });

  while (power > 0) {
    if (power % 2 === 1) {
      res = matMult(res, base);
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 18,
        explanation: {
          what: `Power is odd (${power}). Multiplied result matrix by current base matrix (mod ${mod}).`,
          why: "When binary power bit is 1, incorporate current base matrix square power into accumulated result matrix.",
        },
        primarySnapshot: {
          kind: "grid",
          grid: matrixToGrid(res, base, { row: 0, col: 0 }),
        },
        auxiliaryState: {
          hashMap: {
            "Power (odd)": power,
            "Res[0][0]": res[0][0],
            "Res[0][1]": res[0][1],
            "Res[1][0]": res[1][0],
            "Res[1][1]": res[1][1],
          },
        },
        variables: { power, "res[0][0]": res[0][0] },
      });
    }

    base = matMult(base, base);
    power = Math.floor(power / 2);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 19,
      explanation: {
        what: `Squared base matrix and halved power to ${power}.`,
        why: "Repeated squaring allows exponentiation in O(log n) matrix multiplications.",
      },
      primarySnapshot: {
        kind: "grid",
        grid: matrixToGrid(res, base),
      },
      auxiliaryState: {
        hashMap: {
          "Remaining Power": power,
          "Base Matrix (squared)": `[[${base[0][0]}, ${base[0][1]}], [${base[1][0]}, ${base[1][1]}]]`,
        },
      },
      variables: { power, "base[0][0]": base[0][0] },
    });
  }

  const ans = res[0][0];
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 21,
    explanation: {
      what: `Completed Matrix Exponentiation. F(${n}) = ${ans} (mod ${mod}).`,
      why: "Top-left cell res[0][0] holds the n-th Fibonacci number.",
    },
    primarySnapshot: {
      kind: "grid",
      grid: matrixToGrid(res, base, { row: 0, col: 0 }),
    },
    auxiliaryState: {
      hashMap: {
        [`F(${n})`]: ans,
      },
    },
    variables: { result: ans },
  });

  return steps;
};

export const MATRIX_EXPONENTIATION_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Matrix Exponentiation is an indispensable technique for computing the n-th term of linear recurrences in O(K^3 log N) time, where K is the size of the recurrence system. By reformulating linear recurrence transitions as matrix-vector multiplications and applying binary exponentiation (repeated squaring), calculating terms for N up to 10^18 finishes in logarithmic operations.",
  sections: [
    {
      heading: "Linear Recurrences as Matrix Transformations",
      body: "Any linear recurrence of order K defined by F(n) = c1*F(n-1) + c2*F(n-2) + ... + cK*F(n-K) can be expressed as a linear matrix transformation M * V(n-1) = V(n), where V(n) = [F(n), F(n-1), ..., F(n-K+1)]^T. For Fibonacci, the 2x2 transformation matrix M = [[1, 1], [1, 0]] acts on state [F(n-1), F(n-2)]^T to produce [F(n), F(n-1)]^T. Applying M repeatedly yields V(n) = M^(n-1) * V(1).",
    },
    {
      heading: "Binary Exponentiation on Matrices",
      body: "Scalar exponentiation a^N is computed in O(log N) operations using repeated squaring. Similarly, matrix exponentiation computes M^N by halving the exponent power at each step and squaring the K x K base matrix: when the current exponent bit is 1, the accumulated result matrix is multiplied by the current base matrix. Each K x K matrix multiplication takes O(K^3) operations, leading to O(K^3 log N) total runtime.",
    },
    {
      heading: "Systems & ML Applications",
      body: "Matrix exponentiation is widely applied across computational domains: 1) Graph Theory (computing the number of paths of length N between all pairs of nodes using adjacency matrix powers A^N), 2) Markov Chains (calculating state transition probabilities after N steps P^N), 3) DP Optimization (accelerating DP transitions with massive state steps N <= 10^18), and 4) Linear System Simulation.",
    },
    {
      heading: "Implementation Nuances & Modulo Arithmetic",
      body: "All intermediate additions and multiplications during matrix multiplication must be reduced modulo m at every step to prevent integer overflow. Identity matrices serve as the multiplicative base case (res = I_K). For 2x2 Fibonacci matrices, unrolling matrix multiplication loops into explicit scalar arithmetic avoids nested loop overhead.",
    },
  ],
  keyTerms: [
    {
      term: "Transformation Matrix",
      definition:
        "A square matrix M that transitions a state vector of previous recurrence terms to the next term vector.",
    },
    {
      term: "Binary Exponentiation",
      definition:
        "An algorithm computing powers of scalars or matrices in logarithmic steps by repeated squaring.",
    },
    {
      term: "Linear Recurrence",
      definition: "A sequence where each term is a fixed linear combination of previous terms.",
    },
  ],
};

export const MATRIX_EXPONENTIATION_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines matrix multiplication helper function.",
    10: "Defines main function computing n-th Fibonacci number via matrix power.",
    11: "Handles base case F(0) = 0.",
    13: "Sets up identity matrix res, Fibonacci base [[1,1],[1,0]], and power = n - 1.",
    16: "Loops while binary power remains greater than zero.",
    18: "Multiplies res by base when current power bit is odd.",
    19: "Squares base matrix and halves power.",
    21: "Returns top-left cell res[0][0] representing F(n).",
  },
};

export const matrixExponentiation: AlgorithmDefinition<MatrixExponentiationInput> = {
  id: "matrix-exponentiation",
  title: "Matrix Exponentiation",
  category: "math_and_number_theory",
  categories: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "Compute the n-th term of a linear recurrence (such as Fibonacci F(n)) modulo m in O(k^3 log n) time. The algorithm transforms the linear recurrence into a k x k matrix multiplication and applies binary matrix exponentiation (repeated squaring) to evaluate large n up to 10^18 logarithmic steps.",
  constraints: ["0 <= n <= 10^18", "1 <= modulo <= 2 * 10^9"],
  examples: [
    {
      kind: "basic",
      title: "10th Fibonacci number",
      input: { n: 10, modulo: 1000000007 },
      output: "55",
      explanation: "F(10) = 55.",
    },
    {
      kind: "complex",
      title: "50th Fibonacci number modulo 10^9+7",
      input: { n: 50, modulo: 1000000007 },
      output: "203650110",
      explanation: "F(50) mod (10^9+7) = 203650110.",
    },
    {
      kind: "negative",
      title: "Zero term F(0)",
      input: { n: 0, modulo: 1000000007 },
      output: "0",
      explanation: "F(0) = 0.",
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
    time: "Requires log(n) matrix multiplications of size k x k.",
    space: "Requires storage for k x k result and base matrices.",
  },
  topicGuide: MATRIX_EXPONENTIATION_TOPIC_GUIDE,
  trivia: MATRIX_EXPONENTIATION_TRIVIA,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 23",
      label: "Competitive Programmer's Handbook, Ch 23",
    },
  ],
  defaultInput: DEFAULT_MATRIX_EXPONENTIATION_INPUT,
  generateSteps: generateMatrixExponentiationSteps,
};
