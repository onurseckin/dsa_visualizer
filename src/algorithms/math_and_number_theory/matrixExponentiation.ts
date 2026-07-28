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

  const rawN = Math.floor(input.n);
  const n = rawN < 0 ? 0 : rawN;
  const mod = input.modulo > 0 ? Math.floor(input.modulo) : 1000000007;

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
      what: `Checking base case condition: n == 0 (n = ${n}).`,
      why: "If n is 0, F(0) is defined as 0 and returned immediately without matrix exponentiation.",
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
    codeLine: 11,
    explanation: {
      what: `Initializing Result Matrix res = Identity [[1,0],[0,1]] and Base Matrix base = [[1,1],[1,0]].`,
      why: "Fibonacci transformation matrix [[1,1],[1,0]] raised to power (n-1) yields [[F(n), F(n-1)], [F(n-1), F(n-2)]].",
    },
    primarySnapshot: createMatrixSnapshot(res, base, "res"),
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

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 13,
    explanation: {
      what: `Power required: power = n - 1 = ${n} - 1 = ${power}.`,
      why: "Binary matrix exponentiation evaluates M^(n-1) in O(log n) steps.",
    },
    primarySnapshot: createMatrixSnapshot(res, base),
    auxiliaryState: {
      hashMap: { "Remaining Power": power },
    },
    variables: { power, n },
  });

  while (power > 0) {
    const isOdd = power % 2 === 1;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 14,
      explanation: {
        what: `Evaluating while power > 0 (${power} > 0 is True).`,
        why: "Continue binary exponentiation loop while exponent power remains greater than 0.",
      },
      primarySnapshot: createMatrixSnapshot(res, base),
      auxiliaryState: {
        hashMap: {
          "Power (binary)": power.toString(2),
          "Power Parity": isOdd ? "Odd (1)" : "Even (0)",
        },
      },
      variables: { power, n },
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 15,
      explanation: {
        what: `Checking if power (${power}) is odd (power % 2 == 1: ${isOdd ? "True" : "False"}).`,
        why: isOdd
          ? `Power is odd (${power}), so multiply accumulated result matrix by current base matrix.`
          : `Power is even (${power}), skip multiplying into result matrix.`,
      },
      primarySnapshot: createMatrixSnapshot(res, base),
      auxiliaryState: {
        hashMap: {
          "Power (binary)": power.toString(2),
          "Power Parity": isOdd ? "Odd (1)" : "Even (0)",
        },
      },
      variables: { power, n },
    });

    if (isOdd) {
      res = matMult(res, base);
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 16,
        explanation: {
          what: `Multiplied result matrix by current base matrix (mod ${mod}).`,
          why: "When binary power bit is 1, incorporate current base matrix power into accumulated result matrix.",
        },
        primarySnapshot: createMatrixSnapshot(res, base, "res"),
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
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 17,
      explanation: {
        what: `Squared base matrix: base = base * base (mod ${mod}).`,
        why: "Repeated squaring doubles base power for next binary bit position.",
      },
      primarySnapshot: createMatrixSnapshot(res, base, "base"),
      auxiliaryState: {
        hashMap: {
          "Base Matrix (squared)": `[[${base[0][0]}, ${base[0][1]}], [${base[1][0]}, ${base[1][1]}]]`,
        },
      },
      variables: { power, "base[0][0]": base[0][0] },
    });

    power = Math.floor(power / 2);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Halved power: power //= 2 -> ${power}.`,
        why: "Shift to next binary bit position.",
      },
      primarySnapshot: createMatrixSnapshot(res, base),
      auxiliaryState: {
        hashMap: { "Remaining Power": power },
      },
      variables: { power },
    });
  }

  const ans = res[0][0];
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: `Completed Matrix Exponentiation. F(${n}) = ${ans} (mod ${mod}).`,
      why: "Top-left cell res[0][0] holds the n-th Fibonacci number.",
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
    "Matrix Exponentiation is an indispensable algorithm for computing the $n$-th term of linear recurrences in $\\mathcal{O}(K^3 \\log N)$ time, where $K$ is the order of the recurrence. By reformulating linear recurrence transitions as matrix-vector transformations and applying binary exponentiation (repeated squaring), evaluating terms for $N \\le 10^{18}$ finishes in logarithmic steps.",
  sections: [
    {
      heading: "Linear Recurrences as Matrix Transformations",
      body: "Any $K$-th order linear recurrence $F(n) = \\sum_{i=1}^K c_i F(n-i)$ can be expressed as a linear matrix vector transformation:\n$$\\mathbf{M} \\begin{pmatrix} F(n-1) \\\\ F(n-2) \\\\ \\vdots \\\\ F(n-K) \\end{pmatrix} = \\begin{pmatrix} F(n) \\\\ F(n-1) \\\\ \\vdots \\\\ F(n-K+1) \\end{pmatrix}$$\nFor the Fibonacci sequence ($F(n) = F(n-1) + F(n-2)$), the $2 \\times 2$ transformation matrix $\\mathbf{M} = \\begin{pmatrix} 1 & 1 \\\\ 1 & 0 \\end{pmatrix}$ satisfies:\n$$\\begin{pmatrix} 1 & 1 \\\\ 1 & 0 \\end{pmatrix}^{n-1} \\begin{pmatrix} F(1) \\\\ F(0) \\end{pmatrix} = \\begin{pmatrix} F(n) \\\\ F(n-1) \\end{pmatrix}$$",
    },
    {
      heading: "Binary Matrix Exponentiation (Repeated Squaring)",
      body: "Scalar exponentiation $a^N$ computes in $\\mathcal{O}(\\log N)$ operations via binary exponentiation. Similarly, matrix exponentiation evaluates $\\mathbf{M}^N$ by halving the exponent at each step and squaring the $K \\times K$ base matrix. When the current binary bit is $1$, the accumulated result matrix $\\mathbf{R}$ is multiplied by $\\mathbf{M}$. Each matrix multiplication takes $\\mathcal{O}(K^3)$ operations, yielding $\\mathcal{O}(K^3 \\log N)$ overall runtime.",
    },
    {
      heading: "Systems & Advanced Applications",
      body: "Matrix Exponentiation powers major computational fields:\n1. Graph Theory: Computing the number of paths of length $N$ between all pairs of nodes using adjacency matrix powers $\\mathbf{A}^N$.\n2. Markov Chains: Calculating state transition probability distributions after $N$ steps ($\\mathbf{P}^N$).\n3. Dynamic Programming: Accelerating DP transitions across huge state spaces ($N \\le 10^{18}$).\n4. Linear System Simulations in Physics & Engineering.",
    },
    {
      heading: "Implementation Nuances & Modular Arithmetic",
      body: "All intermediate additions and multiplications during matrix operations must be reduced modulo $m$ at every step to prevent integer overflow. Identity matrix $\\mathbf{I}_K$ serves as the multiplicative identity ($\\mathbf{R} \\leftarrow \\mathbf{I}_K$). For $2 \\times 2$ matrices, unrolling inner loops avoids function call overhead.",
    },
  ],
  keyTerms: [
    {
      term: "Transformation Matrix $\\mathbf{M}$",
      definition:
        "A square matrix transitioning a vector of $K$ previous recurrence terms to the next term vector.",
    },
    {
      term: "Binary Matrix Exponentiation",
      definition:
        "An algorithm computing powers of matrices $\\mathbf{M}^N$ in logarithmic steps by repeated matrix squaring.",
    },
    {
      term: "Linear Recurrence",
      definition:
        "A sequence where each term $F(n)$ is a fixed linear combination of preceding terms.",
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
    9: "Checks base case $n == 0$.",
    10: "Returns 0 for base case $F(0)$.",
    11: "Initializes result matrix $\\mathbf{R}$ to identity matrix $\\mathbf{I}_2 = [[1,0],[0,1]]$.",
    12: "Initializes base matrix to Fibonacci transformation matrix $\\mathbf{M} = [[1,1],[1,0]]$.",
    13: "Sets initial power exponent $= n - 1$.",
    14: "Loops while binary exponent remains greater than 0.",
    15: "Checks if current exponent bit is odd (power % 2 == 1).",
    16: "Multiplies $\\mathbf{R}$ by base matrix when current exponent bit is odd.",
    17: "Squares base matrix for next bit position ($\\mathbf{M} \\leftarrow \\mathbf{M}^2$).",
    18: "Halves power exponent via integer division (power //= 2).",
    19: "Returns $\\mathbf{R}[0][0]$ representing $F(n)$.",
    20: "Empty trailing line for code formatting.",
  },
};

export const matrixExponentiation: AlgorithmDefinition<MatrixExponentiationInput> = {
  id: "matrix-exponentiation",
  title: "Matrix Exponentiation",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "Compute the $n$-th term of a linear recurrence (such as Fibonacci $F(n)$) modulo $m$ in $\\mathcal{O}(K^3 \\log n)$ time:\n\n$$\\begin{pmatrix} F(n) \\\\ F(n-1) \\end{pmatrix} = \\begin{pmatrix} 1 & 1 \\\\ 1 & 0 \\end{pmatrix}^{n-1} \\begin{pmatrix} F(1) \\\\ F(0) \\end{pmatrix}$$\n\n### State Matrix Representation\nThe execution state is visualized as a $2 \\times 4$ combined matrix storing the $2 \\times 2$ accumulated result matrix $\\mathbf{R}$ and $2 \\times 2$ base transformation matrix $\\mathbf{B}$.\n\n### Input Parameters\n- `n` ($n \\in \\mathbb{Z}_{\\ge 0}$): Target recurrence term index.\n- `modulo` ($m \\in \\mathbb{Z}_{> 0}$): Modulo $m$ for arithmetic reduction.\n\n### Output\n- `int`: The $n$-th term $F(n)$ modulo $m$.\n\n### Edge Cases & Constraints\n- Base Case: $n = 0 \\implies F(0) = 0$.\n- Large $n$: Supports $n \\le 10^{18}$ in logarithmic steps.",
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
    time: "Requires $\\mathcal{O}(\\log n)$ matrix multiplications of size $K \\times K$, taking $\\mathcal{O}(K^3 \\log n)$ time.",
    space: "Requires $\\mathcal{O}(K^2)$ memory to store $K \\times K$ result and base matrices.",
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
