import type { AlgorithmDefinition, AlgorithmStep, GridCellNode } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ArrayMatrixTraversalInput {
  matrix: number[][];
  order: "row-major" | "col-major";
}

export const ARRAY_MATRIX_TRAVERSAL_CODE = `def matrix_traversal(matrix: list[list[int]], order: str) -> list[int]:
    if not matrix or not matrix[0]:
        return []
    rows = len(matrix)
    cols = len(matrix[0])
    result = []
    
    if order == "row-major":
        for r in range(rows):
            for c in range(cols):
                result.append(matrix[r][c])
    else:
        for c in range(cols):
            for r in range(rows):
                result.append(matrix[r][c])
                
    return result`;

export const DEFAULT_ARRAY_MATRIX_TRAVERSAL_INPUT: ArrayMatrixTraversalInput = {
  matrix: [
    [10, 20, 30],
    [40, 50, 60],
    [70, 80, 90],
  ],
  order: "row-major",
};

export const generateArrayMatrixTraversalSteps = (
  input: ArrayMatrixTraversalInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { matrix, order } = input;
  const rows = matrix.length;
  const cols = rows > 0 ? matrix[0].length : 0;

  const buildGridSnapshot = (
    activeR: number | null,
    activeC: number | null,
    visitedSet: Set<string>,
  ): GridCellNode[][] => {
    return matrix.map((rowArr, r) =>
      rowArr.map((val, c) => {
        const key = `${r},${c}`;
        const isAct = r === activeR && c === activeC;
        const isVis = visitedSet.has(key);
        return {
          row: r,
          col: c,
          distance: val,
          isVisited: isVis,
          state: isAct ? "active" : isVis ? "visited" : "default",
        };
      }),
    );
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeR: number | null,
    activeC: number | null,
    visitedSet: Set<string>,
    resultAcc: number[],
    vars: Record<string, string | number | boolean>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "grid",
        grid: buildGridSnapshot(activeR, activeC, visitedSet),
      },
      auxiliaryState: {
        customState: {
          order,
          rows: String(rows),
          cols: String(cols),
          traversalResult: `[${resultAcc.join(", ")}]`,
        },
      },
      variables: vars,
    });
  };

  const visited = new Set<string>();
  const result: number[] = [];

  if (rows === 0 || cols === 0) {
    addStep(
      3,
      "Empty matrix check triggered",
      "Matrix has 0 rows or 0 columns. Returning empty list.",
      null,
      null,
      visited,
      result,
      { rows, cols, valid: false },
    );
    return steps;
  }

  addStep(
    4,
    `Initialize ${order} matrix traversal`,
    `Matrix size: ${rows}x${cols}. Traversing elements in ${order} memory order.`,
    null,
    null,
    visited,
    result,
    { rows, cols, order, count: 0 },
  );

  if (order === "row-major") {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = matrix[r][c];
        visited.add(`${r},${c}`);
        result.push(val);
        const offset = r * cols + c;

        addStep(
          11,
          `Visit cell (${r}, ${c}) = ${val} [Linear Offset: ${offset}]`,
          `Row-major accesses contiguous elements in row ${r}. Index = r*cols + c = ${r}*${cols} + ${c} = ${offset}.`,
          r,
          c,
          new Set(visited),
          [...result],
          { r, c, val, offset, count: result.length },
        );
      }
    }
  } else {
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const val = matrix[r][c];
        visited.add(`${r},${c}`);
        result.push(val);
        const offset = c * rows + r;

        addStep(
          15,
          `Visit cell (${r}, ${c}) = ${val} [Col-Major Offset: ${offset}]`,
          `Column-major accesses elements along column ${c}. Strided access jump across rows in C layout.`,
          r,
          c,
          new Set(visited),
          [...result],
          { r, c, val, offset, count: result.length },
        );
      }
    }
  }

  addStep(
    17,
    `Traversal complete (${result.length} elements)`,
    `Successfully traversed ${rows}x${cols} matrix in ${order} order. Result: [${result.join(", ")}].`,
    null,
    null,
    new Set(visited),
    [...result],
    { total: result.length, complete: true },
  );

  return steps;
};

export const ARRAY_MATRIX_TRAVERSAL_TRIVIA: TriviaMeta = {
  skipLines: [2, 4],
  hints: [
    { line: 9, hint: "Check outer row loop for row-major order" },
    { line: 13, hint: "Outer column loop drives column-major order" },
  ],
  distractors: ["for r in range(cols):", "result.append(matrix[c][r])", "offset = r + c * cols"],
};

export const arrayMatrixTraversal: AlgorithmDefinition<ArrayMatrixTraversalInput> = {
  id: "2d-array-matrix-traversal",
  title: "2D Array Matrix Traversal",
  topicIds: ["ml_tensor_algebra"],
  difficulty: "Easy",
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" }],
  description:
    "Traverse a 2D matrix in row-major vs column-major order, illustrating CPU cache spatial locality vs memory striding.",
  code: ARRAY_MATRIX_TRAVERSAL_CODE,
  defaultInput: DEFAULT_ARRAY_MATRIX_TRAVERSAL_INPUT,
  examples: [
    {
      kind: "basic",
      title: "3x3 Row-Major Traversal",
      input: {
        matrix: [
          [10, 20, 30],
          [40, 50, 60],
          [70, 80, 90],
        ],
        order: "row-major",
      },
      output: "[10, 20, 30, 40, 50, 60, 70, 80, 90]",
      explanation: "Row-by-row traversal matching contiguous C-style memory layout.",
    },
    {
      kind: "complex",
      title: "2x4 Column-Major Traversal",
      input: {
        matrix: [
          [1, 2, 3, 4],
          [5, 6, 7, 8],
        ],
        order: "col-major",
      },
      output: "[1, 5, 2, 6, 3, 7, 4, 8]",
      explanation: "Column-by-column access matching Fortran/MATLAB layout.",
    },
    {
      kind: "negative",
      title: "Empty Matrix Traversal",
      input: {
        matrix: [],
        order: "row-major",
      },
      output: "[]",
      explanation: "Empty input matrix returns empty traversal list safely.",
    },
  ],
  timeComplexity: {
    best: "O(R * C)",
    average: "O(R * C)",
    worst: "O(R * C)",
  },
  spaceComplexity: "O(R * C)",
  complexityAnalysis: {
    time: "Every matrix element is visited exactly once, resulting in O(R * C) time complexity.",
    space: "O(R * C) auxiliary memory to store the traversal result array.",
  },
  topicGuide: {
    overview:
      "2D Matrix Traversal is fundamental to understanding tensor layouts in hardware. Row-major layout (C-contiguous) stores consecutive elements of a row in contiguous memory addresses, ensuring high cache hit rates during row-wise iteration. Column-major layout (Fortran-contiguous) stores elements of a column contiguously.",
    sections: [
      {
        heading: "Cache Locality & Striding",
        body: "Iterating through memory sequentially uses hardware prefetchers effectively. Row-major traversal on a row-major tensor results in stride-1 access, whereas column-major traversal incurs stride-C access, causing cache misses when C exceeds cache line sizes.",
      },
      {
        heading: "Tensor Contiguity in ML Frameworks",
        body: "PyTorch and NumPy default to C-contiguous tensors. Calling .transpose() or .permute() changes strides without copying memory, turning row-major accesses into strided non-contiguous accesses.",
      },
    ],
    keyTerms: [
      {
        term: "Row-Major",
        definition: "Memory layout where rows are stored sequentially in memory.",
      },
      {
        term: "Column-Major",
        definition: "Memory layout where columns are stored sequentially in memory.",
      },
      {
        term: "Stride",
        definition:
          "The step size in memory elements required to move to the next item along a dimension.",
      },
    ],
  },
  trivia: ARRAY_MATRIX_TRAVERSAL_TRIVIA,
  generateSteps: generateArrayMatrixTraversalSteps,
};
