import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  TopicGuide,
} from "../../types/dsa";
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
  n: 25,
  modulo: 1000000007,
};

export const generateMatrixExponentiationSteps = (
  input: MatrixExponentiationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

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
    highlightTarget?: "res" | "base" | "res[0][0]",
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const isRes = c < 2;
        const val = isRes ? matRes[r][c] : matBase[r][c - 2];
        let state: "default" | "active" | "sorted" | "found" = isRes ? "sorted" : "default";

        if (highlightTarget === "res" && isRes) {
          state = "active";
        } else if (highlightTarget === "base" && !isRes) {
          state = "active";
        } else if (highlightTarget === "res[0][0]" && isRes && r === 0 && c === 0) {
          state = "found";
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
      rows: 2,
      cols: 4,
      cells,
      rowHeaders: ["Row 0", "Row 1"],
      colHeaders: ["Res[0]", "Res[1]", "Base[0]", "Base[1]"],
      title: "Result & Base 2x2 Exponentiation Matrices",
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

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 9,
    explanation: {
      what: `Evaluate base case condition for n = ${n}.`,
      why: "When n is 0, Fibonacci F(0) is 0 by definition and requires no matrix exponentiation.",
    },
    primarySnapshot: createMatrixSnapshot(
      [
        [0, 0],
        [0, 0],
      ],
      [
        [1, 1],
        [1, 0],
      ],
    ),
    auxiliaryState: {
      hashMap: { "Target n": n },
    },
    variables: { n },
  });

  if (n === 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: "Base case met: n = 0, returning 0.",
        why: "Fibonacci F(0) is defined as 0.",
      },
      primarySnapshot: createMatrixSnapshot(
        [
          [0, 0],
          [0, 0],
        ],
        [
          [1, 1],
          [1, 0],
        ],
      ),
      auxiliaryState: {
        hashMap: { "Fibonacci Term F(0)": 0 },
      },
      variables: { n, result: 0 },
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

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: "Initialize result matrix R to 2x2 identity matrix [[1,0],[0,1]].",
      why: "The identity matrix is the neutral multiplicative identity for matrix operations.",
    },
    primarySnapshot: createMatrixSnapshot(res, base, "res"),
    auxiliaryState: {
      hashMap: {
        "Res Matrix": "[[1,0],[0,1]] (Identity)",
      },
    },
    variables: { n, power: n - 1 },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 12,
    explanation: {
      what: "Initialize base matrix B to Fibonacci transformation matrix [[1,1],[1,0]].",
      why: "Multiplying [[1,1],[1,0]] by term vector [F(k), F(k-1)]^T yields next vector [F(k+1), F(k)]^T.",
    },
    primarySnapshot: createMatrixSnapshot(res, base, "base"),
    auxiliaryState: {
      hashMap: {
        "Base Matrix": "[[1,1],[1,0]] (Fibonacci Transition)",
      },
    },
    variables: { n, power: n - 1 },
  });

  let power = n - 1;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 13,
    explanation: {
      what: `Set initial exponent power = n - 1 = ${power}.`,
      why: "Computing matrix power B^(n-1) maps initial state vector [F(1), F(0)]^T to target vector [F(n), F(n-1)]^T.",
    },
    primarySnapshot: createMatrixSnapshot(res, base),
    auxiliaryState: {
      hashMap: {
        Exponent: power,
      },
    },
    variables: { n, power },
  });

  while (power > 0) {
    const isOdd = power % 2 === 1;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 14,
      explanation: {
        what: `Check loop condition: power = ${power} > 0. Current bit is ${isOdd ? "odd (1)" : "even (0)"}.`,
        why: "Binary exponentiation evaluates matrix powers in O(log n) steps by inspecting binary bit representations.",
      },
      primarySnapshot: createMatrixSnapshot(res, base),
      auxiliaryState: {
        hashMap: {
          Power: power,
          "Bit Parity": isOdd ? "Odd (Multiply Res)" : "Even (Skip Res)",
        },
      },
      variables: { power },
    });

    if (isOdd) {
      res = matMult(res, base);
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 16,
        explanation: {
          what: `Multiply result matrix: R = R × B (power is odd).`,
          why: "When the current binary exponent bit is set, accumulate the current base matrix power into the result matrix.",
        },
        primarySnapshot: createMatrixSnapshot(res, base, "res"),
        auxiliaryState: {
          hashMap: {
            Action: "Res = Res * Base",
            "Res[0][0]": res[0][0],
          },
        },
        variables: { power, res_00: res[0][0] },
      });
    }

    base = matMult(base, base);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 17,
      explanation: {
        what: `Square base matrix: B = B × B (modulo ${mod}).`,
        why: "Repeated squaring doubles the matrix exponent power (B -> B^2 -> B^4 -> B^8) in O(K^3) per step.",
      },
      primarySnapshot: createMatrixSnapshot(res, base, "base"),
      auxiliaryState: {
        hashMap: {
          Action: "Base = Base * Base",
          "Base[0][0]": base[0][0],
        },
      },
      variables: { power, base_00: base[0][0] },
    });

    power = Math.floor(power / 2);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Halve exponent power: power = power // 2 -> ${power}.`,
        why: "Integer division by 2 shifts to the next binary bit position.",
      },
      primarySnapshot: createMatrixSnapshot(res, base),
      auxiliaryState: {
        hashMap: {
          "New Power": power,
        },
      },
      variables: { power },
    });
  }

  const ans = res[0][0];
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: `Finalize Matrix Exponentiation: F(${n}) = ${ans} (mod ${mod}).`,
      why: "Top-left cell R[0][0] holds the exact n-th Fibonacci term after matrix binary exponentiation.",
    },
    primarySnapshot: createMatrixSnapshot(res, base, "res[0][0]"),
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
    "<p>The <strong>Matrix Exponentiation</strong> algorithm computes the <code>n</code>-th term of linear recurrences in <code>O(K³ log N)</code> time, where <code>K</code> is the order of the recurrence. By reformulating linear recurrence transitions as matrix-vector transformations and applying binary exponentiation (repeated squaring), evaluating terms for <code>N ≤ 10¹⁸</code> finishes in logarithmic steps.</p>",
  sections: [
    {
      heading: "Linear Recurrences as Matrix Transformations",
      body: "<p>Any <code>K</code>-th order linear recurrence <code>F(n) = ∑ c_i F(n-i)</code> can be expressed as a matrix vector transformation. For the Fibonacci sequence, the <code>2 × 2</code> transformation matrix <code>M = [[1, 1], [1, 0]]</code> satisfies <code>M^(n-1) × [F(1), F(0)]^T = [F(n), F(n-1)]^T</code>.</p>",
    },
    {
      heading: "Binary Matrix Exponentiation (Repeated Squaring)",
      body: "<p>Scalar exponentiation <code>a^N</code> computes in <code>O(log N)</code> operations via binary exponentiation. Similarly, matrix exponentiation evaluates <code>M^N</code> by halving the exponent at each step and squaring the <code>K × K</code> base matrix. When the current binary bit is 1, the accumulated result matrix R is multiplied by M. Each matrix multiplication takes <code>O(K³)</code> operations, yielding <code>O(K³ log N)</code> overall runtime.</p>",
    },
    {
      heading: "Systems & Advanced Applications",
      body: "<p>Matrix Exponentiation powers major computational fields including Graph Theory (counting paths of length N via adjacency matrix powers), Markov Chains (calculating state transition probability distributions after N steps), and Dynamic Programming (accelerating transitions across huge state spaces up to 10¹⁸).</p>",
    },
    {
      heading: "Implementation Nuances & Modular Arithmetic",
      body: "<p>All intermediate additions and multiplications during matrix operations must be reduced modulo <code>m</code> at every step to prevent integer overflow. Identity matrix serves as the multiplicative identity. For <code>2 × 2</code> matrices, unrolling inner loops avoids function call overhead.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Transformation Matrix M",
      definition:
        "A square matrix transitioning a vector of K previous recurrence terms to the next term vector.",
    },
    {
      term: "Binary Matrix Exponentiation",
      definition:
        "An algorithm computing powers of matrices M^N in logarithmic steps by repeated matrix squaring.",
    },
    {
      term: "Linear Recurrence",
      definition:
        "A sequence where each term F(n) is a fixed linear combination of preceding terms.",
    },
    {
      term: "Modulo Arithmetic",
      definition:
        "Mathematical operations performed under remainder arithmetic to prevent integer overflow.",
    },
  ],
};

export const MATRIX_EXPONENTIATION_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Empty leading line for code formatting.",
    2: "Defines multiply_matrix(A, B, mod) helper function for 2x2 matrix multiplication.",
    3: "Returns new 2x2 matrix resulting from scalar dot products.",
    4: "Computes row 0 cell multiplications modulo mod.",
    5: "Computes row 1 cell multiplications modulo mod.",
    6: "Closing bracket of 2x2 matrix return statement.",
    7: "Empty line separating helper function from main function.",
    8: "Defines fibonacci_matrix_pow(n, mod) -> int function signature.",
    9: "Checks base case n == 0.",
    10: "Returns 0 for base case F(0).",
    11: "Initializes result matrix R to identity matrix I_2 = [[1,0],[0,1]].",
    12: "Initializes base matrix to Fibonacci transformation matrix M = [[1,1],[1,0]].",
    13: "Sets initial power exponent = n - 1.",
    14: "Loops while binary exponent remains greater than 0.",
    15: "Checks if current exponent bit is odd (power % 2 == 1).",
    16: "Multiplies R by base matrix when current exponent bit is odd.",
    17: "Squares base matrix for next bit position (M <- M^2).",
    18: "Halves power exponent via integer division (power //= 2).",
    19: "Returns R[0][0] representing F(n).",
    20: "Empty trailing line for code formatting.",
  },
};

export const matrixExponentiation: AlgorithmDefinition<MatrixExponentiationInput> = {
  id: "matrix-exponentiation",
  title: "Matrix Exponentiation",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Compute the <code>n</code>-th term of a linear recurrence (such as Fibonacci <code>F(n)</code>) modulo <code>m</code> in <code>O(K³ log n)</code> time:</p><p><code>[[F(n)], [F(n-1)]] = [[1, 1], [1, 0]]^(n-1) × [[F(1)], [F(0)]]</code></p><h3>State Matrix Representation</h3><p>The execution state is visualized as a <code>2 × 4</code> combined matrix storing the <code>2 × 2</code> accumulated result matrix <strong>R</strong> and <code>2 × 2</code> base transformation matrix <strong>B</strong>.</p><h3>Input Parameters</h3><ul><li><code>n</code> (<code>int</code>): Target recurrence term index.</li><li><code>modulo</code> (<code>int</code>): Modulo m for arithmetic reduction.</li></ul><h3>Output</h3><ul><li><code>int</code>: The <code>n</code>-th term <code>F(n)</code> modulo m.</li></ul><h3>Edge Cases &amp; Constraints</h3><ul><li><strong>Base Case:</strong> <code>n = 0</code> implies <code>F(0) = 0</code>.</li><li><strong>Large n:</strong> Supports <code>n ≤ 10¹⁸</code> in logarithmic steps.</li></ul>",
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
    time: "Requires O(log n) matrix multiplications of size K × K, taking O(K³ log n) time.",
    space: "Requires O(K²) memory to store K × K result and base matrices.",
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
