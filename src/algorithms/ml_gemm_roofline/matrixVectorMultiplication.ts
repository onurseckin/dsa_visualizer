import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface matrixVectorMultiplicationInput {
  matrix?: number[][];
  vector?: number[];
  data?: number[];
}

export const MATRIXVECTORMULTIPLICATION_CODE = `def matrix_vector_multiplication(matrix, vector):
    """
    Computes GEMV y = A * x matrix-vector product.
    """
    rows = len(matrix)
    cols = len(vector)
    result = []

    for r in range(rows):
        dot = 0
        for c in range(cols):
            dot += matrix[r][c] * vector[c]
        result.append(dot)

    return result`;

export const DEFAULT_MATRIXVECTORMULTIPLICATION_INPUT: matrixVectorMultiplicationInput = {
  matrix: [
    [2, 1, 3, 0],
    [1, 4, 0, 2],
    [0, 2, 5, 1],
    [3, 0, 1, 4],
  ],
  vector: [1, 2, 0, 3],
};

export const generateMatrixVectorMultiplicationSteps = (
  input: matrixVectorMultiplicationInput,
): AlgorithmStep[] => {
  const matrix = input.matrix ?? [
    [2, 1, 3, 0],
    [1, 4, 0, 2],
    [0, 2, 5, 1],
    [3, 0, 1, 4],
  ];
  const vector = input.vector ?? [1, 2, 0, 3];

  const rows = matrix.length;
  const cols = vector.length;

  const result: number[] = [];

  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // 4 rows x 5 cols matrix snapshot (cols 0..3 = Matrix A, col 4 = Result vector y)
  const snapshotCols = cols + 1;

  const makeMatrixSnapshot = (
    activeRow?: number,
    activeCol?: number,
    title: string = "GEMV Matrix & Vector State",
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < snapshotCols; c++) {
        let cellState: MatrixCellItem["state"] = "default";
        let val: string | number = 0;

        if (c < cols) {
          val = matrix[r][c];
          if (r === activeRow && c === activeCol) {
            cellState = "active";
          } else if (r === activeRow) {
            cellState = "compared";
          } else if (r < (activeRow ?? -1)) {
            cellState = "sorted";
          }
        } else {
          // Column 4: Output Vector Y
          val = r < result.length ? result[r] : "?";
          if (r === activeRow) {
            cellState = "pivot";
          } else if (r < result.length) {
            cellState = "sorted";
          }
        }

        cells.push({
          row: r,
          col: c,
          value: val,
          state: cellState,
          label: c < cols ? `A[${r}][${c}]` : `y[${r}]`,
        });
      }
    }

    const colHeaders = Array.from({ length: cols }, (_, c) => `A[:,${c}]`);
    colHeaders.push("y (Result)");

    return {
      kind: "matrix" as const,
      rows,
      cols: snapshotCols,
      cells,
      rowHeaders: Array.from({ length: rows }, (_, r) => `Row ${r}`),
      colHeaders,
      title,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow?: number,
    activeCol?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: makeMatrixSnapshot(
        activeRow,
        activeCol,
        `GEMV Matrix-Vector Step ${stepIndex}`,
      ),
      auxiliaryState: {
        customState: {
          matrix: JSON.stringify(matrix),
          vector: JSON.stringify(vector),
          rows: String(rows),
          cols: String(cols),
          resultSoFar: JSON.stringify(result),
        },
      },
      variables,
    });
  };

  // Step 1: Definition
  addStep(
    1,
    "Initialize GEMV Matrix-Vector Engine (y = A * x)",
    "Setting up data structures for row-wise vector dot products.",
    { rows, cols },
  );

  // Step 2: Docstring start
  addStep(
    2,
    "Inspect GEMV Operational Characteristics",
    "GEMV performs 2 * M * N FLOPs with ~1 FLOP/Byte arithmetic intensity (memory-bandwidth bound).",
    { rows, cols },
  );

  // Step 3: Docstring description
  addStep(
    3,
    "Inspect Weight Matrix A and Vector x",
    `Matrix A shape: ${rows} x ${cols}, Activation vector x length: ${cols}.`,
    { rows, cols },
  );

  // Step 4: Docstring end
  addStep(
    4,
    "Prepare Inner Loop State Variables",
    "Initializing output accumulator array for result vector y.",
    { rows, cols },
  );

  // Step 5: Rows count
  addStep(
    5,
    `Get Matrix Row Count (rows = ${rows})`,
    "Determining number of output vector elements M.",
    { rows },
  );

  // Step 6: Cols count
  addStep(
    6,
    `Get Vector Length (cols = ${cols})`,
    "Determining dot product dimension N.",
    { cols },
  );

  // Step 7: Allocate result vector
  addStep(
    7,
    "Initialize Result Vector List",
    "Creating empty container to hold output vector elements y.",
    { resultLen: 0 },
  );

  for (let r = 0; r < rows; r++) {
    // Step 9: Outer loop row r
    addStep(
      9,
      `Start Row ${r} Dot Product Execution`,
      `Targeting row A[${r}][:] of weight matrix A.`,
      { r },
      r,
    );

    // Step 10: Initialize dot accumulator
    let dot = 0;
    addStep(
      10,
      `Initialize Accumulation Register dot = 0 for Row ${r}`,
      "Zero-initializing row scalar product register.",
      { r, dot },
      r,
    );

    for (let c = 0; c < cols; c++) {
      // Step 11: Inner loop col c
      addStep(
        11,
        `Fetch Column ${c} Entry A[${r}][${c}] and Vector x[${c}]`,
        `Reading weight A[${r}][${c}] (${matrix[r][c]}) and activation x[${c}] (${vector[c]}).`,
        { r, c, valA: matrix[r][c], valX: vector[c] },
        r,
        c,
      );

      const prod = matrix[r][c] * vector[c];
      dot += prod;

      // Step 12: Multiply-accumulate
      addStep(
        12,
        `Multiply-Accumulate: dot += A[${r}][${c}] * x[${c}]`,
        `A[${r}][${c}] (${matrix[r][c]}) * x[${c}] (${vector[c]}) = ${prod}; Accumulator dot = ${dot}`,
        { r, c, valA: matrix[r][c], valX: vector[c], prod, dot },
        r,
        c,
      );
    }

    result.push(dot);

    // Step 13: Append row dot result
    addStep(
      13,
      `Append Row ${r} Dot Result (y[${r}] = ${dot})`,
      `Stored completed dot product sum ${dot} into output result vector y.`,
      { r, dot, resultLength: result.length },
      r,
    );
  }

  // Step 15: Return statement
  addStep(
    15,
    "Execution Complete: Return Result Vector y",
    `Completed GEMV matrix-vector product. Result vector y = [${result.join(", ")}].`,
    { completed: true, result: JSON.stringify(result) },
  );

  return steps;
};

const MATRIXVECTORMULTIPLICATION_TRIVIA: TriviaMeta = {
  skipLines: [8, 14],
  distractors: [
    "result.append(sum(vector))",
    "dot += matrix[r][c] + vector[c]",
    "result.append(matrix[r][c] * vector[c])",
    "return matrix",
  ],
  hints: [
    { line: 9, hint: "Outer loop iterates through each row r of matrix A." },
    { line: 12, hint: "Multiply matrix[r][c] by vector[c] and accumulate into scalar dot." },
    { line: 13, hint: "Append row dot product sum to output vector y." },
  ],
  lineExplanations: {
    1: "Defines GEMV matrix-vector multiplication function signature.",
    2: "Start of docstring detailing GEMV arithmetic operation.",
    3: "Describes computation of output vector y = A * x.",
    4: "End of docstring.",
    5: "Gets matrix row count M (len(matrix)).",
    6: "Gets input vector length N (len(vector)).",
    7: "Initializes empty list to collect output vector entries.",
    8: "Blank line separating allocation and row loop.",
    9: "Loops through each matrix row index r.",
    10: "Initializes row dot product accumulator to 0.",
    11: "Loops through each column index c.",
    12: "Accumulates element product matrix[r][c] * vector[c] into dot.",
    13: "Appends completed scalar dot product to output result vector.",
    14: "Blank line prior to return.",
    15: "Returns computed 1D output result vector y.",
  },
};

export const matrixVectorMultiplication: AlgorithmDefinition<matrixVectorMultiplicationInput> = {
  id: "matrix-vector-multiplication",
  title: "Matrix-Vector Multiplication (GEMV)",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "General Matrix-Vector Multiplication (GEMV: $y = A \\times x$) is the foundational linear algebra operation executing single-token decoding in auto-regressive Large Language Models (e.g. LLaMA, GPT-4, Mistral). In the decoding phase, batch size is $B=1$, meaning weight matrix $A$ ($M \\times N$) is multiplied by a single token vector $x$ ($N \\times 1$).\n\nBecause each weight in matrix $A$ is loaded from DRAM exactly once to perform a single multiply-add operation, GEMV has an Operational Intensity of $I \\approx \\frac{2 \\cdot M \\cdot N}{2 \\cdot M \\cdot N \\text{ bytes}} = 1.0$ FLOP/Byte (for FP16 weights). This makes GEMV strictly Memory-Bandwidth Bound on modern GPUs, capping token generation speeds directly by DRAM/HBM bandwidth.\n\nInput Format:\n- matrix: M x N 2D matrix A.\n- vector: N x 1 1D activation vector x.\n\nOutput Format:\n- Returns M x 1 1D output vector y.\n\nEdge Cases & Constraints:\n- Mismatched dimensions (vector length != matrix column count).\n- 1x1 matrix multiplied by scalar vector.\n- Sparse matrix inputs.",
  constraints: ["1 <= matrix.length <= 100", "matrix[0].length == vector.length"],
  examples: [
    {
      kind: "basic",
      title: "4x4 Matrix-Vector Multiplication",
      inputDisplay: "matrix = 4x4, vector = [1, 2, 0, 3]",
      outputDisplay: "vector y = [4, 15, 7, 15]",
      input: DEFAULT_MATRIXVECTORMULTIPLICATION_INPUT,
      output: "[4, 15, 7, 15]",
      explanation: "Computes 4 row dot products y_r = sum_c (A[r][c] * x[c]).",
    },
  ],
  code: MATRIXVECTORMULTIPLICATION_CODE,
  timeComplexity: { best: "O(M * N)", average: "O(M * N)", worst: "O(M * N)" },
  spaceComplexity: "O(M)",
  complexityAnalysis: {
    time: "Requires M * N scalar multiplications and M * N additions ($O(M \\cdot N)$ total FLOPs).",
    space: "Allocates $O(M)$ memory space for output vector y.",
  },
  topicGuide: {
    overview:
      "GEMV (General Matrix-Vector Multiplication) is BLAS Level 2 routine that underpins LLM inference decode throughput. Unlike GEMM (BLAS Level 3), GEMV offers zero weight reuse across columns, making HBM memory bandwidth the primary hardware constraint.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "In auto-regressive generation, tokens are emitted sequentially. Multiplying token embedding $x_t$ by key/value/projection weights $W$ requires evaluating $y = W x_t$. With batch size 1, $W$ cannot be shared across multiple tokens, fixing Operational Intensity to ~1 FLOP/Byte.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "Forms the bottleneck in single-user ChatGPT / LLaMA decode servers. Quantization techniques (INT4, FP8, AWQ, GPTQ) target GEMV specifically by shrinking weight byte size to increase effective token generation rates.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "For row 0 of matrix A `[2, 1, 3, 0]` and vector x `[1, 2, 0, 3]`: (1) $2 \\times 1 = 2$. (2) $1 \\times 2 = 2$. (3) $3 \\times 0 = 0$. (4) $0 \\times 3 = 0$. (5) Sum dot = $2 + 2 + 0 + 0 = 4$. Output entry $y[0] = 4$.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "To escape the GEMV memory bottleneck in serving, inference systems batch multiple user prompts into a single matrix $X$ ($B \\times N$), converting GEMV back into compute-bound GEMM ($B \\times N \\times M$).",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $O(M \\cdot N)$ FLOPs. Space Complexity: $O(M)$ output memory storage.",
      },
    ],
    keyTerms: [
      {
        term: "GEMV Routine",
        definition:
          "BLAS Level 2 General Matrix-Vector multiplication operator ($y = \\alpha A x + \\beta y$).",
      },
      {
        term: "LLM Decode Phase",
        definition:
          "Auto-regressive token generation phase characterized by batch size 1 and memory-bound GEMV execution.",
      },
      {
        term: "Weight Quantization",
        definition:
          "Compressing FP16 weights to INT4/FP8 to reduce DRAM fetch bytes during GEMV decoding.",
      },
      {
        term: "Continuous Batching",
        definition:
          "Combining multiple user inference requests into a batched GEMM to increase operational intensity.",
      },
    ],
  },
  trivia: MATRIXVECTORMULTIPLICATION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_MATRIXVECTORMULTIPLICATION_INPUT,
  generateSteps: generateMatrixVectorMultiplicationSteps,
};
