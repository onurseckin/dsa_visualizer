import type { AlgorithmDefinition, AlgorithmStep, GridCellNode } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface MatrixMultiplicationNaiveInput {
  A: number[][];
  B: number[][];
}

export const MATRIX_MULTIPLICATION_NAIVE_CODE = `def matrix_multiply_naive(A: list[list[int]], B: list[list[int]]) -> list[list[int]]:
    if not A or not A[0] or not B or not B[0]:
        return []
    M, K1 = len(A), len(A[0])
    K2, N = len(B), len(B[0])
    if K1 != K2:
        return []  # Dimension mismatch
    
    C = [[0] * N for _ in range(M)]
    for i in range(M):
        for j in range(N):
            acc = 0
            for k in range(K1):
                acc += A[i][k] * B[k][j]
            C[i][j] = acc
    return C`;

export const DEFAULT_MATRIX_MULTIPLICATION_NAIVE_INPUT: MatrixMultiplicationNaiveInput = {
  A: [
    [1, 2],
    [3, 4],
  ],
  B: [
    [5, 6],
    [7, 8],
  ],
};

export const generateMatrixMultiplicationNaiveSteps = (
  input: MatrixMultiplicationNaiveInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { A, B } = input;
  const M = A.length;
  const K1 = M > 0 ? A[0].length : 0;
  const K2 = B.length;
  const N = K2 > 0 ? B[0].length : 0;

  const buildGridSnapshot = (
    activeRowA: number | null,
    activeColB: number | null,
    _activeK: number | null,
    C: number[][]
  ): GridCellNode[][] => {
    // Render matrix C as grid
    return C.map((rowArr, r) =>
      rowArr.map((val, c) => ({
        row: r,
        col: c,
        distance: val,
        state: r === activeRowA && c === activeColB ? "active" : val !== 0 ? "visited" : "default",
      }))
    );
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeRowA: number | null,
    activeColB: number | null,
    activeK: number | null,
    C: number[][],
    vars: Record<string, string | number | boolean>
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "grid",
        grid: buildGridSnapshot(activeRowA, activeColB, activeK, C),
      },
      auxiliaryState: {
        customState: {
          dimA: `${M}x${K1}`,
          dimB: `${K2}x${N}`,
          dimC: `${M}x${N}`,
          activePair:
            activeRowA !== null && activeColB !== null ? `C[${activeRowA}][${activeColB}]` : "None",
        },
      },
      variables: vars,
    });
  };

  const emptyC: number[][] = Array.from({ length: Math.max(1, M) }, () =>
    Array(Math.max(1, N)).fill(0)
  );

  if (M === 0 || K1 === 0 || K2 === 0 || N === 0 || K1 !== K2) {
    addStep(
      6,
      "Dimension mismatch or empty matrix check",
      `Matrix inner dimensions must match (A: ${M}x${K1}, B: ${K2}x${N}). Incompatible GEMM.`,
      null,
      null,
      null,
      emptyC,
      { M, K1, K2, N, valid: false }
    );
    return steps;
  }

  const C: number[][] = Array.from({ length: M }, () => Array(N).fill(0));

  addStep(
    9,
    `Initialize GEMM C = A x B (${M}x${K1} * ${K2}x${N} -> ${M}x${N})`,
    `Computing output matrix C of shape ${M}x${N} with total ${M * N * K1} multiply-accumulate operations.`,
    null,
    null,
    null,
    C.map((r) => [...r]),
    { M, K1, N, totalMACs: M * N * K1 }
  );

  for (let i = 0; i < M; i++) {
    for (let j = 0; j < N; j++) {
      let acc = 0;
      addStep(
        12,
        `Start computing output cell C[${i}][${j}]`,
        `Dot product of Row ${i} in A and Column ${j} in B.`,
        i,
        j,
        null,
        C.map((r) => [...r]),
        { i, j, acc }
      );

      for (let k = 0; k < K1; k++) {
        const prod = A[i][k] * B[k][j];
        acc += prod;

        addStep(
          14,
          `K-loop step k=${k}: A[${i}][${k}] (${A[i][k]}) * B[${k}][${j}] (${B[k][j]}) = ${prod}`,
          `Accumulate product ${prod} into running dot product total = ${acc}.`,
          i,
          j,
          k,
          C.map((r) => [...r]),
          { i, j, k, aVal: A[i][k], bVal: B[k][j], prod, acc }
        );
      }

      C[i][j] = acc;
      addStep(
        15,
        `Store C[${i}][${j}] = ${acc}`,
        `Completed dot product for cell (${i}, ${j}).`,
        i,
        j,
        null,
        C.map((r) => [...r]),
        { i, j, resultVal: acc }
      );
    }
  }

  addStep(
    16,
    `Matrix Multiplication Complete`,
    `All ${M * N} elements of matrix C computed successfully.`,
    null,
    null,
    null,
    C.map((r) => [...r]),
    { complete: true }
  );

  return steps;
};

export const MATRIX_MULTIPLICATION_NAIVE_TRIVIA: TriviaMeta = {
  skipLines: [2, 4],
  hints: [
    { line: 10, hint: "Outer loop i iterates over rows of matrix A" },
    { line: 11, hint: "Middle loop j iterates over columns of matrix B" },
    { line: 13, hint: "Inner loop k computes dot product along dimension K" },
  ],
  distractors: [
    "for k in range(M):",
    "acc += A[k][i] * B[j][k]",
    "C[i][j] = A[i][j] * B[i][j]",
  ],
};

export const matrixMultiplicationNaive: AlgorithmDefinition<MatrixMultiplicationNaiveInput> = {
  id: "matrix-multiplication-naive",
  title: "Naive Matrix Multiplication (GEMM)",
  category: "ml_gemm_roofline",
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 1,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" }],
  description:
    "Triple-nested loop matrix multiplication (C = A * B) illustrating dot products and memory access patterns.",
  code: MATRIX_MULTIPLICATION_NAIVE_CODE,
  defaultInput: DEFAULT_MATRIX_MULTIPLICATION_NAIVE_INPUT,
  examples: [
    {
      kind: "basic",
      title: "2x2 Matrix Multiplication",
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
      output: "[[19, 22], [43, 50]]",
      explanation: "[1*5+2*7, 1*6+2*8], [3*5+4*7, 3*6+4*8] = [[19, 22], [43, 50]].",
    },
    {
      kind: "complex",
      title: "2x3 by 3x2 Matrix Multiplication",
      input: {
        A: [
          [1, 0, 2],
          [-1, 3, 1],
        ],
        B: [
          [3, 1],
          [2, 1],
          [1, 0],
        ],
      },
      output: "[[5, 1], [4, 2]]",
      explanation: "Inner dimension 3 contracts to produce a 2x2 matrix.",
    },
    {
      kind: "negative",
      title: "Mismatched Dimensions",
      input: {
        A: [[1, 2, 3]],
        B: [[1, 2]],
      },
      output: "[]",
      explanation: "Incompatible shapes (1x3 and 1x2) return empty result.",
    },
  ],
  timeComplexity: {
    best: "O(M * N * K)",
    average: "O(M * N * K)",
    worst: "O(M * N * K)",
  },
  spaceComplexity: "O(M * N)",
  complexityAnalysis: {
    time: "Three nested loops yield O(M * N * K) scalar multiplications and additions.",
    space: "O(M * N) space for storing output matrix C.",
  },
  topicGuide: {
    overview:
      "Naive GEMM evaluates C[i][j] = sum_k(A[i][k] * B[k][j]). While mathematically simple, row-by-column access incurs non-contiguous memory access along B's columns in row-major storage.",
    sections: [
      {
        heading: "Loop Reordering & Tiling",
        body: "Reordering loops from (i, j, k) to (i, k, j) improves spatial locality because access to B[k][j] becomes stride-1. Block tiling further fits data in SRAM caches.",
      },
    ],
    keyTerms: [
      { term: "GEMM", definition: "General Matrix Multiply operation: C = alpha*A*B + beta*C." },
      { term: "FLOPs", definition: "Floating Point Operations (2 * M * N * K for GEMM)." },
    ],
  },
  trivia: MATRIX_MULTIPLICATION_NAIVE_TRIVIA,
  generateSteps: generateMatrixMultiplicationNaiveSteps,
};
