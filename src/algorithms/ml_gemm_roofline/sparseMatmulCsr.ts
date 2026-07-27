import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface sparseMatmulCsrInput {
  values?: number[];
  col_indices?: number[];
  row_ptr?: number[];
  vector?: number[];
}

export const SPARSEMATMULCSR_CODE = `def sparse_matmul_csr(values, col_indices, row_ptr, vector):
    """
    Computes SpMV sparse matrix-vector product y = A_csr @ x.
    """
    num_rows = len(row_ptr) - 1
    result = []

    for r in range(num_rows):
        row_start = row_ptr[r]
        row_end = row_ptr[r + 1]
        dot = 0
        for i in range(row_start, row_end):
            val = values[i]
            col = col_indices[i]
            dot += val * vector[col]
        result.append(dot)

    return result`;

export const DEFAULT_SPARSEMATMULCSR_INPUT: sparseMatmulCsrInput = {
  values: [3, 4, 1, 5, 2, 6, 7, 8],
  col_indices: [0, 2, 1, 3, 0, 2, 1, 3],
  row_ptr: [0, 2, 4, 6, 8],
  vector: [2, 1, 4, 3],
};

export const generateSparseMatmulCsrSteps = (input: sparseMatmulCsrInput): AlgorithmStep[] => {
  const values = input.values ?? [3, 4, 1, 5, 2, 6, 7, 8];
  const col_indices = input.col_indices ?? [0, 2, 1, 3, 0, 2, 1, 3];
  const row_ptr = input.row_ptr ?? [0, 2, 4, 6, 8];
  const vector = input.vector ?? [2, 1, 4, 3];

  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const numRows = Math.max(0, row_ptr.length - 1);
  const numCols = vector.length > 0 ? vector.length : 4;

  // Build dense reference matrix representation for matrix snapshot
  const denseMatrix: number[][] = Array.from({ length: numRows }, () =>
    Array.from({ length: numCols }, () => 0),
  );

  for (let r = 0; r < numRows; r++) {
    const start = row_ptr[r];
    const end = row_ptr[r + 1];
    for (let i = start; i < end; i++) {
      const c = col_indices[i];
      if (c < numCols) {
        denseMatrix[r][c] = values[i];
      }
    }
  }

  const createMatrixSnapshot = (
    activeRow?: number,
    activeCol?: number,
    completedRows: number[] = [],
    titleExtra = "",
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const val = denseMatrix[r][c];
        let state: "default" | "active" | "compared" | "sorted" | "pivot" | "inactive" = "default";
        if (completedRows.includes(r)) {
          state = "sorted";
        } else if (r === activeRow && c === activeCol) {
          state = "active";
        } else if (r === activeRow) {
          state = val !== 0 ? "compared" : "inactive";
        } else if (val === 0) {
          state = "inactive";
        }

        cells.push({
          row: r,
          col: c,
          value: val,
          label: val !== 0 ? `A[${r},${c}]` : undefined,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows: numRows,
      cols: numCols,
      rowHeaders: Array.from({ length: numRows }, (_, r) => `Row ${r}`),
      colHeaders: Array.from({ length: numCols }, (_, c) => `x[${c}]=${vector[c]}`),
      title: `CSR Matrix A Sparse Grid (${numRows}x${numCols})${titleExtra}`,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow?: number,
    activeCol?: number,
    completedRows: number[] = [],
    titleExtra = "",
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: createMatrixSnapshot(activeRow, activeCol, completedRows, titleExtra),
      auxiliaryState: {
        customState: {
          values: `[${values.join(", ")}]`,
          col_indices: `[${col_indices.join(", ")}]`,
          row_ptr: `[${row_ptr.join(", ")}]`,
          vector: `[${vector.join(", ")}]`,
          numRows,
        },
      },
      variables,
    });
  };

  // Line 1: Setup
  addStep(
    1,
    "Initialize Sparse Matrix Multiplication (CSR Format)",
    "Set up inputs: values, col_indices, row_ptr, and vector x for SpMV evaluation.",
    { num_rows: numRows, num_nonzeros: values.length },
  );

  addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Computes SpMV sparse matrix-vector product y = A_csr @ x.",
    {},
  );

  addStep(
    3,
    "Docstring body: algorithm description",
    "See the Python docstring for the contract and purpose of this algorithm.",
    {},
  );

  addStep(
    4,
    "End of docstring",
    "Docstring complete. Entering the function body.",
    {},
  );

  // Line 5: num_rows calculation
  addStep(
    5,
    `Calculate Row Count: num_rows = ${numRows}`,
    `Extract matrix row count from row_ptr length (${row_ptr.length} - 1 = ${numRows}).`,
    { num_rows: numRows },
  );

  // Line 6: result initialization
  const result: number[] = [];
  const completedRows: number[] = [];
  addStep(
    6,
    "Initialize Output Result Vector",
    "Allocate empty list 'result' to hold dot products for each row.",
    { result: "[]" },
  );

  // Loop over rows
  for (let r = 0; r < numRows; r++) {
    addStep(
      8,
      `Start Processing Row ${r}`,
      `Iterate outer loop for row index r = ${r}.`,
      { r, num_rows: numRows },
      r,
    );

    const rowStart = row_ptr[r];
    const rowEnd = row_ptr[r + 1];

    addStep(
      9,
      `Get row_start = row_ptr[${r}] (${rowStart})`,
      `Fetch starting offset in values array for row ${r}.`,
      { r, row_start: rowStart },
      r,
    );

    addStep(
      10,
      `Get row_end = row_ptr[${r + 1}] (${rowEnd})`,
      `Fetch ending offset in values array for row ${r}. Non-zero count for row is ${rowEnd - rowStart}.`,
      { r, row_start: rowStart, row_end: rowEnd },
      r,
    );

    let dot = 0;
    addStep(
      11,
      `Initialize Row Accumulator: dot = 0`,
      `Reset dot product accumulator for row ${r}.`,
      { r, dot },
      r,
    );

    for (let i = rowStart; i < rowEnd; i++) {
      addStep(
        12,
        `Loop non-zero index i = ${i} (range ${rowStart}..${rowEnd})`,
        `Iterate over non-zero entry at index ${i}.`,
        { r, i, row_start: rowStart, row_end: rowEnd },
        r,
      );

      const val = values[i];
      addStep(
        13,
        `Fetch val = values[${i}] (${val})`,
        `Read non-zero coefficient value at index ${i}.`,
        { i, val },
        r,
        col_indices[i],
      );

      const col = col_indices[i];
      addStep(
        14,
        `Fetch col = col_indices[${i}] (${col})`,
        `Read column index for non-zero coefficient: col = ${col}.`,
        { i, val, col },
        r,
        col,
      );

      const prod = val * vector[col];
      dot += prod;
      addStep(
        15,
        `Accumulate Product: dot += ${val} * ${vector[col]} (${prod}) -> dot = ${dot}`,
        `Multiply non-zero val by vector[${col}] and add to row dot product total.`,
        { r, i, val, col, "vector[col]": vector[col], prod, dot },
        r,
        col,
      );
    }

    result.push(dot);
    completedRows.push(r);
    addStep(
      16,
      `Append Row Total: result.append(${dot})`,
      `Store finished dot product for row ${r} into result vector: [${result.join(", ")}].`,
      { r, dot, result: `[${result.join(", ")}]` },
      undefined,
      undefined,
      [...completedRows],
    );
  }

  // Line 18: Return result
  addStep(
    18,
    `SpMV Complete: Return result = [${result.join(", ")}]`,
    "Successfully computed sparse matrix-vector product for all rows.",
    { completed: true, result: `[${result.join(", ")}]` },
    undefined,
    undefined,
    [...completedRows],
    " - Complete",
  );

  return steps;
};

export const SPARSEMATMULCSR_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(val * vector[i])",
    "row_start = row_ptr[r + 1]",
    "dot += values[col] * vector[i]",
  ],
  hints: [
    { line: 5, hint: "Row count is given by len(row_ptr) - 1." },
    { line: 8, hint: "Iterate over each row index r in range(num_rows)." },
    { line: 12, hint: "Iterate non-zero entries from row_start to row_end." },
    { line: 15, hint: "Multiply non-zero value by vector[col] and accumulate into dot." },
  ],
  lineExplanations: {
    1: "Defines SpMV sparse matrix-vector multiplication function in CSR format.",
    2: "Starts docstring explaining SpMV kernel computation.",
    3: "Describes mathematical contract: y = A_csr @ x.",
    4: "Ends function docstring.",
    5: "Calculates total rows M = len(row_ptr) - 1 from offset pointer array.",
    6: "Initializes empty list 'result' to store computed output dot products.",
    7: "Blank line separating initialization from row processing loop.",
    8: "Iterates through row indices r from 0 up to num_rows - 1.",
    9: "Extracts row start offset pointer row_start = row_ptr[r].",
    10: "Extracts row end offset pointer row_end = row_ptr[r + 1].",
    11: "Resets scalar row dot product accumulator 'dot' to zero.",
    12: "Iterates non-zero entry index i from row_start to row_end - 1.",
    13: "Fetches non-zero coefficient value val = values[i].",
    14: "Fetches column index col = col_indices[i] for non-zero entry.",
    15: "Accumulates product val * vector[col] into row dot product total.",
    16: "Appends finalized row dot product 'dot' to output result vector.",
    17: "Blank line separating row processing loop from return statement.",
    18: "Returns output result vector containing SpMV matrix-vector product.",
  },
};

export const sparseMatmulCsr: AlgorithmDefinition<sparseMatmulCsrInput> = {
  id: "sparse-matmul-csr",
  title: "Sparse Matrix Multiplication (CSR Format)",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "In Graph Neural Networks (GNNs, e.g., PyTorch Geometric, DGL) and heavily pruned modern LLMs (e.g. 50-80% sparse weights), dense matrix storage wastes memory and compute on zero elements. Compressed Sparse Row (CSR) format compresses an $M \\times N$ sparse matrix into three 1D arrays: `values` (length $\\text{NNZ}$), `col_indices` (length $\\text{NNZ}$), and `row_ptr` (length $M + 1$).\n\nSparse Matrix-Vector Multiplication (SpMV) computes $\\mathbf{y} = A_{\\text{CSR}} \\mathbf{x}$ by iterating only over non-zero entries:\n$$y[r] = \\sum_{i=\\text{row\\_ptr}[r]}^{\\text{row\\_ptr}[r+1]-1} \\text{values}[i] \\times x[\\text{col\\_indices}[i]]$$\nIn CUDA/Triton kernels, SpMV presents high arithmetic intensity challenges because indirect memory accesses via `col_indices[i]` cause memory bandwidth bottlenecks and non-coalesced DRAM reads.",
  constraints: [
    "1 <= values.length <= 1000",
    "col_indices.length == values.length",
    "row_ptr.length >= 2",
    "1 <= vector.length <= 1000",
  ],
  examples: [
    {
      kind: "basic",
      title: "Standard CSR SpMV",
      inputDisplay: "values = [3, 4, 1, 5, 2, 6, 7, 8], row_ptr = [0, 2, 4, 6, 8], vector = [2, 1, 4, 3]",
      outputDisplay: "[22, 16, 28, 31]",
      input: DEFAULT_SPARSEMATMULCSR_INPUT,
      output: "[22, 16, 28, 31]",
      explanation: "Computes SpMV for 4x4 sparse matrix with 2 non-zeros per row.",
    },
    {
      kind: "complex",
      title: "Sparse Matrix with Empty Row",
      inputDisplay: "values = [5, 9], col_indices = [0, 2], row_ptr = [0, 1, 1, 2], vector = [3, 1, 2]",
      outputDisplay: "[15, 0, 18]",
      input: {
        values: [5, 9],
        col_indices: [0, 2],
        row_ptr: [0, 1, 1, 2],
        vector: [3, 1, 2],
      },
      output: "[15, 0, 18]",
      explanation: "Row 1 is completely zero (row_ptr[1] == row_ptr[2] == 1), resulting in 0.",
    },
  ],
  code: SPARSEMATMULCSR_CODE,
  timeComplexity: { best: "O(NNZ)", average: "O(NNZ)", worst: "O(NNZ)" },
  spaceComplexity: "O(M)",
  complexityAnalysis: {
    time: "O(NNZ) where NNZ is total number of non-zero entries. Skipping zeros avoids O(M * N) dense matrix multiplications.",
    space: "O(M) space for output vector y of length M.",
  },
  topicGuide: {
    overview:
      "Compressed Sparse Row (CSR) representation is a fundamental sparse matrix encoding scheme used across scientific computing, Graph Neural Networks, and sparse machine learning inference. By storing only non-zero matrix entries along with column index mappings and row offset pointers, CSR reduces memory consumption from $\\mathcal{O}(M \\times N)$ to $\\mathcal{O}(\\text{NNZ} + M)$.\n\nIn GPU roofline performance terms, SpMV is strictly memory-bandwidth bound. Because arithmetic intensity (FLOPs per byte transferred) is very low, optimizing SpMV relies heavily on hardware cache utilization and warp load balancing.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Large-scale deep learning models contain vast regions of zero weights. Storing full dense matrices wastes SRAM and memory bandwidth. CSR format compresses these matrices into three compact arrays: `values` (length $\\text{NNZ}$), `col_indices` (length $\\text{NNZ}$), and `row_ptr` (length $M + 1$). The offset difference $\\text{row\\_ptr}[r+1] - \\text{row\\_ptr}[r]$ gives the exact count of non-zeros in row $r$.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "SpMV solves high-throughput sparse matrix-vector multiplication in Graph Convolutional Networks (GCNs), PageRank algorithms, finite element simulations, and sparse LLM inference engines (e.g. vLLM, TensorRT-LLM with sparse Tensor Cores).",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "To compute $y[r]$, we look up $\\text{row\\_start} = \\text{row\\_ptr}[r]$ and $\\text{row\\_end} = \\text{row\\_ptr}[r+1]$. We initialize $\\text{dot} = 0$, then loop $i$ from $\\text{row\\_start}$ to $\\text{row\\_end} - 1$. For each non-zero, we read $v = \\text{values}[i]$ and $c = \\text{col\\_indices}[i]$, accumulating $v \\times \\mathbf{x}[c]$ into $\\text{dot}$. Finally, $\\text{dot}$ is written to $y[r]$.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "While CSR saves memory footprint, it introduces indirect memory indexing ($\\mathbf{x}[\\text{col\\_indices}[i]]$). On GPU hardware, non-consecutive column indices cause uncoalesced DRAM accesses. Furthermore, non-uniform non-zero distributions per row cause thread warp divergence.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(\\text{NNZ})$ where $\\text{NNZ}$ is non-zero element count. Space Complexity: $\\mathcal{O}(M)$ for output vector result $\\mathbf{y}$.",
      },
    ],
    keyTerms: [
      {
        term: "CSR Format",
        definition:
          "Compressed Sparse Row representation storing non-zero values, column indices, and row offset pointers.",
      },
      {
        term: "SpMV Kernel",
        definition: "Sparse Matrix-Vector Multiplication kernel executing y = A_sparse * x.",
      },
      {
        term: "Non-Zero Count (NNZ)",
        definition: "Total count of non-zero elements present in a sparse matrix.",
      },
      {
        term: "Indirect Memory Addressing",
        definition:
          "Fetching vector values via indexed lookup (vector[col_indices[i]]) leading to non-coalesced memory reads.",
      },
    ],
  },
  trivia: SPARSEMATMULCSR_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_SPARSEMATMULCSR_INPUT,
  generateSteps: generateSparseMatmulCsrSteps,
};
