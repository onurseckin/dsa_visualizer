import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface virtualMatrixAdditionZeroStrideInput {
  matrix: number[][];
  rowVec: number[];
}

export const VIRTUALMATRIXADDITIONZEROSTRIDE_CODE = `def virtual_matrix_addition_zero_stride(matrix, row_vec):
    """
    Adds 1D vector to 2D matrix rows using zero-stride virtual broadcasting.
    """
    rows = len(matrix)
    cols = len(matrix[0]) if rows > 0 else 0
    result = []

    for r in range(rows):
        row_res = []
        for c in range(cols):
            val = matrix[r][c] + row_vec[c]
            row_res.append(val)
        result.append(row_res)

    return result`;

export const DEFAULT_VIRTUALMATRIXADDITIONZEROSTRIDE_INPUT: virtualMatrixAdditionZeroStrideInput = {
  matrix: [
    [10, 20, 30],
    [40, 50, 60],
    [70, 80, 90],
    [100, 110, 120],
  ],
  rowVec: [1, 2, 3],
};

export const generateVirtualMatrixAdditionZeroStrideSteps = (
  input: virtualMatrixAdditionZeroStrideInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { matrix, rowVec } = input;
  const rows = matrix.length;
  const cols = rows > 0 ? matrix[0].length : 0;
  const result: number[][] = [];

  const buildMatrixSnapshot = (
    activeCell: [number, number] | null,
    title: string,
  ) => {
    const cells: MatrixCellItem[] = [];
    const [actR, actC] = activeCell ?? [-1, -1];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let state: MatrixCellItem["state"] = "default";
        let val: string | number = matrix[r][c];

        if (r < result.length && c < (result[r]?.length ?? 0)) {
          state = "sorted";
          val = result[r][c];
        }

        if (r === actR && c === actC) {
          state = "active";
          val = `${matrix[r][c]}+${rowVec[c]}`;
        }

        cells.push({
          row: r,
          col: c,
          value: val,
          label: `+b[${c}](${rowVec[c]})`,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows,
      cols,
      cells,
      rowHeaders: Array.from({ length: rows }, (_, i) => `R${i}`),
      colHeaders: Array.from({ length: cols }, (_, i) => `C${i} (+${rowVec[i]})`),
      title,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeCell: [number, number] | null = null,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: buildMatrixSnapshot(
        activeCell,
        `Zero-Stride Broadcasting Matrix Addition (${rows}x${cols})`,
      ),
      auxiliaryState: {
        customState: {
          matrixShape: `${rows}x${cols}`,
          biasVector: `[${rowVec.join(", ")}]`,
          computedRows: result.length,
          resultMatrix: JSON.stringify(result),
        },
      },
      variables,
    });
  };

  // Line 1: Call entry
  addStep(
    1,
    `Call virtual_matrix_addition_zero_stride(matrix [${rows}x${cols}], row_vec [${rowVec.join(", ")}])`,
    `Starting zero-stride virtual broadcasting addition of 1D vector [${rowVec.join(", ")}] across ${rows} matrix rows.`,
    { rows, cols, bias_len: rowVec.length },
  );

  // Line 5: rows = len(matrix)
  addStep(
    5,
    `rows = len(matrix) -> ${rows}`,
    `Determined row count M = ${rows}.`,
    { rows },
  );

  // Line 6: cols = len(matrix[0])
  addStep(
    6,
    `cols = len(matrix[0]) -> ${cols}`,
    `Determined column count N = ${cols}. Vector length matches columns.`,
    { rows, cols },
  );

  // Line 7: result = []
  addStep(
    7,
    "result = []",
    "Initialized empty result matrix array.",
    { rows, cols },
  );

  // Loop rows
  for (let r = 0; r < rows; r++) {
    // Line 9: Row loop
    addStep(
      9,
      `Outer loop: r = ${r} of ${rows}`,
      `Broadcasting bias vector [${rowVec.join(", ")}] into matrix row ${r}.`,
      { r, rows },
    );

    const rowRes: number[] = [];
    // Line 10: row_res = []
    addStep(
      10,
      `row_res = [] (Row ${r})`,
      `Initialized temporary container for computed row ${r}.`,
      { r },
    );

    for (let c = 0; c < cols; c++) {
      // Line 11: Column loop
      addStep(
        11,
        `Inner loop: c = ${c} (matrix[${r}][${c}] = ${matrix[r][c]}, row_vec[${c}] = ${rowVec[c]})`,
        `Reading matrix cell (${r}, ${c}) and broadcasted bias at index ${c} (row stride = 0).`,
        { r, c, "matrix[r][c]": matrix[r][c], "row_vec[c]": rowVec[c] },
        [r, c],
      );

      // Line 12: val = matrix[r][c] + row_vec[c]
      const val = matrix[r][c] + rowVec[c];
      addStep(
        12,
        `val = matrix[${r}][${c}] + row_vec[${c}] -> ${matrix[r][c]} + ${rowVec[c]} = ${val}`,
        `Computed element addition ${matrix[r][c]} + ${rowVec[c]} = ${val} via zero-stride virtual pointer offset.`,
        { r, c, val },
        [r, c],
      );

      // Line 13: row_res.append(val)
      rowRes.push(val);
      addStep(
        13,
        `row_res.append(${val})`,
        `Appended broadcasted sum ${val} to row ${r} results.`,
        { r, c, val, row_len: rowRes.length },
        [r, c],
      );
    }

    result.push(rowRes);
    // Line 14: result.append(row_res)
    addStep(
      14,
      `result.append([${rowRes.join(", ")}])`,
      `Completed broadcast addition for row ${r}. Added row [${rowRes.join(", ")}] to result matrix.`,
      { r, result_rows: result.length },
    );
  }

  // Line 16: Return
  addStep(
    16,
    "Return result",
    `Completed zero-stride broadcasting addition for all ${rows} rows. Output shape: ${rows}x${cols}.`,
    { completed: true },
  );

  return steps;
};

const VIRTUALMATRIXADDITIONZEROSTRIDE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "val = matrix[r][c] + row_vec[r]",
    "result.append(matrix[r] + row_vec)",
    "row_vec.expand(rows, cols)",
  ],
  hints: [{ line: 12, hint: "Index row_vec with column index c because row stride is virtually set to 0." }],
  lineExplanations: {
    1: "Defines entry point for zero-stride broadcasting matrix addition.",
    2: "Docstring opening tag.",
    3: "Describes adding a 1D vector across 2D matrix rows using virtual zero-stride broadcasting.",
    4: "Docstring closing tag.",
    5: "Gets matrix row count M = len(matrix).",
    6: "Gets matrix column count N = len(matrix[0]).",
    7: "Initializes result matrix list.",
    8: "Blank line preceding outer row iteration loop.",
    9: "Iterates through row index r from 0 to rows - 1.",
    10: "Initializes temporary row list for row r.",
    11: "Iterates through column index c from 0 to cols - 1.",
    12: "Adds matrix element matrix[r][c] and zero-stride broadcasted vector element row_vec[c].",
    13: "Appends element sum val to current row_res list.",
    14: "Appends completed row_res list to result matrix.",
    15: "Blank line preceding return statement.",
    16: "Returns computed broadcasted matrix sum result.",
  },
};

export const virtualMatrixAdditionZeroStride: AlgorithmDefinition<virtualMatrixAdditionZeroStrideInput> =
  {
    id: "virtual-matrix-addition-zero-stride",
    title: "Zero-Stride Broadcasting Matrix Addition",
    category: "ml_tensor_algebra",
    categories: ["ml_tensor_algebra", "arrays_and_hashing"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 1,
    mlInfraCategory: "ml_tensor_algebra",
    description:
      "In deep learning models (e.g. PyTorch Linear layers $Y = X W + \\mathbf{b}$, LayerNorm bias offset addition, ResNet residual addition), a 1D bias vector of shape $(N,)$ is added to every row of an $M \\times N$ activation matrix. Naively performing this operation by copying the 1D bias vector $M$ times creates an $M \\times N$ intermediate matrix, wasting DRAM bandwidth and GPU memory allocation. Instead, tensor runtimes (PyTorch ATen, NumPy, Triton) use zero-stride broadcasting: setting the row stride of the 1D vector to 0 (strides $= [0, 1]$). When calculating element memory addresses: $$\\text{Offset}(r, c) = r \\times \\text{stride}_{\\text{row}} + c \\times \\text{stride}_{\\text{col}}$$ setting $\\text{stride}_{\\text{row}} = 0$ reduces $r \\times 0 = 0$, forcing pointer math to read index $c$ regardless of row $r$. This virtually expands the vector to $M \\times N$ without allocating extra physical DRAM memory.",
    constraints: ["1 <= M, N <= 64", "rowVec.length == N"],
    examples: [
      {
        kind: "basic",
        title: "Standard 4x3 Matrix + 1D Bias Vector",
        inputDisplay: "matrix = 4x3, rowVec = [1, 2, 3]",
        outputDisplay: "[[11, 22, 33], [41, 52, 63], [71, 82, 93], [101, 112, 123]]",
        input: {
          matrix: [
            [10, 20, 30],
            [40, 50, 60],
            [70, 80, 90],
            [100, 110, 120],
          ],
          rowVec: [1, 2, 3],
        },
        output: "[[11, 22, 33], [41, 52, 63], [71, 82, 93], [101, 112, 123]]",
        explanation: "Broadcasted 1D vector [1, 2, 3] to every row without allocating intermediate 4x3 bias copy.",
      },
      {
        kind: "complex",
        title: "Negative Bias Offset Addition",
        inputDisplay: "matrix = [[5, 10], [15, 20]], rowVec = [-5, 10]",
        outputDisplay: "[[0, 20], [10, 30]]",
        input: {
          matrix: [
            [5, 10],
            [15, 20],
          ],
          rowVec: [-5, 10],
        },
        output: "[[0, 20], [10, 30]]",
        explanation: "Element-wise zero-stride addition supports negative bias vector elements.",
      },
      {
        kind: "negative",
        title: "1x1 Matrix Single Element Addition",
        inputDisplay: "matrix = [[100]], rowVec = [50]",
        outputDisplay: "[[150]]",
        input: {
          matrix: [[100]],
          rowVec: [50],
        },
        output: "[[150]]",
        explanation: "1x1 matrix adds single bias value correctly.",
      },
    ],
    code: VIRTUALMATRIXADDITIONZEROSTRIDE_CODE,
    timeComplexity: { best: "O(M * N)", average: "O(M * N)", worst: "O(M * N)" },
    spaceComplexity: "O(M * N)",
    complexityAnalysis: {
      time: "O(M * N) computes element-wise sum for every cell in M x N matrix.",
      space: "O(M * N) memory allocated solely for the output result matrix.",
    },
    topicGuide: {
      overview:
        "Zero-stride broadcasting is an essential technique in high-performance tensor algebra engines. Setting a dimension's stride to 0 allows tensor execution graphs to virtually expand low-dimensional tensors without performing DRAM memory allocations or eager tensor expansion copies.\n\nIn GPU kernel implementations (CUDA/Triton), zero-stride broadcasting enables warp threads to load bias values once into high-speed L1/SRAM registers and re-use them across hundreds of matrix rows at peak throughput.",
      sections: [
        {
          heading: "Why It Exists & Theoretical Foundations",
          body: "Tensor memory address offset calculation follows the strided formula:\n$$\\text{Offset}(i_0, i_1, \\dots, i_{D-1}) = \\sum_{j=0}^{D-1} i_j \\times s_j$$\nIf dimension $j$ is broadcasted from size 1 to size $M$, setting $s_j = 0$ guarantees that $i_j \\times 0 = 0$ regardless of index $i_j$. Mathematically, this enforces virtual equality $B'[r][c] = B[c]$ without writing a single extra byte to memory.",
        },
        {
          heading: "What It Solves & Real-World Applications",
          body: "In PyTorch models, adding a bias vector to an activation matrix ($Y = X + \\mathbf{b}$) occurs in every Linear, Conv2D, and LayerNorm layer. Without zero-stride broadcasting, computing `b.expand(M, N)` would require allocating $M \\times N$ floats in DRAM memory. Zero-stride views eliminate this DRAM memory footprint entirely.",
        },
        {
          heading: "Step-by-Step Intuition & Worked Example",
          body: "Given matrix $X$ of shape $3 \\times 3$ and bias vector $\\mathbf{b} = [10, 20, 30]$ of shape $(3,)$:\n1. Row 0: $X[0][0]+b[0]=10+10=20, \\dots, X[0][2]+b[2]=30+30=60$.\n2. Row 1: $X[1][0]+b[0]=40+10=50, \\dots, X[1][2]+b[2]=60+30=90$.\n3. Row 2: $X[2][0]+b[0]=70+10=80, \\dots, X[2][2]+b[2]=90+30=120$.\nPointer math reads $b[c]$ for all rows $r$ because $\\text{stride}_{\\text{row}} = 0$.",
        },
        {
          heading: "Trade-offs & Hardware Realities",
          body: "In GPU architectures (NVIDIA H100 / A100), reading a broadcasted scalar across 32 threads in a warp can cause shared memory register broadcast overhead. High-performance Triton kernels load vector $\\mathbf{b}$ into fast shared memory (SRAM) once per thread block, ensuring all threads read from SRAM without DRAM latency bottlenecks.",
        },
        {
          heading: "Time & Space Complexity Analysis",
          body: "Time Complexity: $\\mathcal{O}(M \\times N)$ arithmetic additions. Space Complexity: $\\mathcal{O}(M \\times N)$ space for output matrix. Zero auxiliary space allocated for bias expansion.",
        },
      ],
      keyTerms: [
        {
          term: "Zero-Stride Tensor",
          definition: "A tensor having a stride of 0 along one or more dimensions, causing index steps along that dimension to re-read identical DRAM addresses.",
        },
        {
          term: "Virtual Broadcasting",
          definition: "Expanding tensor shape metadata logically without duplicating data elements in physical memory.",
        },
        {
          term: "Bias Addition",
          definition: "Adding a 1D learned parameters vector to matrix activation outputs in neural network layers.",
        },
        {
          term: "HBM Bandwidth",
          definition: "High-Bandwidth Memory throughput on modern GPUs; zero-stride views conserve HBM bandwidth by preventing redundant DRAM writes.",
        },
      ],
    },
    trivia: VIRTUALMATRIXADDITIONZEROSTRIDE_TRIVIA,
    sources: [{ kind: "standard", label: "ML Infra Level 1" }],
    defaultInput: DEFAULT_VIRTUALMATRIXADDITIONZEROSTRIDE_INPUT,
    generateSteps: generateVirtualMatrixAdditionZeroStrideSteps,
};

export default virtualMatrixAdditionZeroStride;
