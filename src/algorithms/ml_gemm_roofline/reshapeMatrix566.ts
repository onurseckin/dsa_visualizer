import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface reshapeMatrix566Input {
  matrix?: number[][];
  newShape?: [number, number];
  data?: number[];
}

export const RESHAPEMATRIX566_CODE = `def reshape_matrix(matrix, new_shape):
    """
    Reshapes 2D matrix into new_shape (new_rows, new_cols) without data copy.
    """
    orig_rows = len(matrix)
    orig_cols = len(matrix[0]) if orig_rows > 0 else 0
    new_r, new_c = new_shape
    reshaped = [[0] * new_c for _ in range(new_r)]

    for idx in range(orig_rows * orig_cols):
        r_old, c_old = idx // orig_cols, idx % orig_cols
        r_new, c_new = idx // new_c, idx % new_c
        reshaped[r_new][c_new] = matrix[r_old][c_old]

    return reshaped`;

export const DEFAULT_RESHAPEMATRIX566_INPUT: reshapeMatrix566Input = {
  matrix: [
    [1, 2, 3, 4, 5, 6],
    [7, 8, 9, 10, 11, 12],
  ],
  newShape: [3, 4],
};

export const generateReshapeMatrix566Steps = (
  input: reshapeMatrix566Input,
): AlgorithmStep[] => {
  const matrix = input.matrix ?? [
    [1, 2, 3, 4, 5, 6],
    [7, 8, 9, 10, 11, 12],
  ];
  const newShape = input.newShape ?? [3, 4];
  const [newR, newC] = newShape;

  const origRows = matrix.length;
  const origCols = matrix[0]?.length ?? 0;
  const totalElements = origRows * origCols;

  const reshaped: (number | string)[][] = Array.from({ length: newR }, () =>
    Array(newC).fill("?"),
  );

  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const makeMatrixSnapshot = (
    activeNewR?: number,
    activeNewC?: number,
    title: string = "Reshaped Output Matrix State",
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < newR; r++) {
      for (let c = 0; c < newC; c++) {
        let cellState: MatrixCellItem["state"] = "default";
        if (r === activeNewR && c === activeNewC) {
          cellState = "active";
        } else if (
          activeNewR !== undefined &&
          (r < activeNewR || (r === activeNewR && c < (activeNewC ?? 0)))
        ) {
          cellState = "sorted";
        }

        cells.push({
          row: r,
          col: c,
          value: reshaped[r][c],
          state: cellState,
          label: `r${r}c${c}`,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows: newR,
      cols: newC,
      cells,
      rowHeaders: Array.from({ length: newR }, (_, r) => `New R${r}`),
      colHeaders: Array.from({ length: newC }, (_, c) => `New C${c}`),
      title,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeNewR?: number,
    activeNewC?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: makeMatrixSnapshot(
        activeNewR,
        activeNewC,
        `Reshape Matrix Step ${stepIndex}`,
      ),
      auxiliaryState: {
        customState: {
          origRows: String(origRows),
          origCols: String(origCols),
          newRows: String(newR),
          newCols: String(newC),
          totalElements: String(totalElements),
          origMatrix: JSON.stringify(matrix),
        },
      },
      variables,
    });
  };

  // Step 1: Definition
  addStep(
    1,
    "Initialize Reshape Matrix Coordinates Engine",
    "Configuring spatial shape translation mapping for 2D memory arrays.",
    { origRows, origCols, newR, newC },
  );

  // Step 2: Docstring start
  addStep(
    2,
    "Inspect Tensor Reshape Operational Constraints",
    "Zero-copy reshaping preserves row-major memory layout order while mapping linear indices.",
    { origRows, origCols, newR, newC },
  );

  // Step 3: Docstring description
  addStep(
    3,
    "Verify Volume Conservation (Total Elements M*N == R*C)",
    `Original elements (${origRows} * ${origCols} = ${totalElements}) == Target elements (${newR} * ${newC} = ${newR * newC}).`,
    { totalOriginal: totalElements, totalTarget: newR * newC, isValid: totalElements === newR * newC },
  );

  // Step 4: Docstring end
  addStep(
    4,
    "Prepare Coordinate Translation Engine",
    "Initializing index mapping pointers and memory allocation containers.",
    { totalElements },
  );

  // Step 5: Original rows
  addStep(
    5,
    `Inspect Original Row Dimension (orig_rows = ${origRows})`,
    "Reading original matrix row count M.",
    { origRows },
  );

  // Step 6: Original cols
  addStep(
    6,
    `Inspect Original Column Dimension (orig_cols = ${origCols})`,
    "Reading original matrix column count N.",
    { origCols },
  );

  // Step 7: Target new shape
  addStep(
    7,
    `Unpack Target Reshape Dimensions: new_r=${newR}, new_c=${newC}`,
    "Setting target spatial shape dimensions R and C.",
    { newR, newC },
  );

  // Step 8: Allocate reshaped grid
  addStep(
    8,
    `Allocate ${newR} x ${newC} Output Grid`,
    "Zero-initializing target shape matrix storage.",
    { newR, newC, totalCells: newR * newC },
  );

  for (let idx = 0; idx < totalElements; idx++) {
    // Step 10: Flat index loop
    addStep(
      10,
      `Flat Memory Index Loop idx=${idx} of ${totalElements - 1}`,
      `Iterating through 1D linear memory offset index idx=${idx}.`,
      { idx, totalElements },
    );

    const rOld = Math.floor(idx / origCols);
    const cOld = idx % origCols;

    // Step 11: Map to old coordinates
    addStep(
      11,
      `Map idx=${idx} to Original Coordinates: (${rOld}, ${cOld})`,
      `r_old = ${idx} // ${origCols} = ${rOld}, c_old = ${idx} % ${origCols} = ${cOld}`,
      { idx, rOld, cOld },
    );

    const rNew = Math.floor(idx / newC);
    const cNew = idx % newC;

    // Step 12: Map to new coordinates
    addStep(
      12,
      `Map idx=${idx} to New Target Coordinates: (${rNew}, ${cNew})`,
      `r_new = ${idx} // ${newC} = ${rNew}, c_new = ${idx} % ${newC} = ${cNew}`,
      { idx, rNew, cNew },
      rNew,
      cNew,
    );

    const val = matrix[rOld][cOld];
    reshaped[rNew][cNew] = val;

    // Step 13: Write value
    addStep(
      13,
      `Write Value ${val} to Reshaped[${rNew}][${cNew}]`,
      `Copied element matrix[${rOld}][${cOld}] (${val}) into target position reshaped[${rNew}][${cNew}].`,
      { idx, rOld, cOld, rNew, cNew, val },
      rNew,
      cNew,
    );
  }

  // Step 15: Return reshaped matrix
  addStep(
    15,
    "Execution Complete: Return Reshaped Matrix",
    `Successfully reshaped ${origRows}x${origCols} matrix into ${newR}x${newC} shape.`,
    { completed: true, finalShape: `${newR}x${newC}` },
  );

  return steps;
};

const RESHAPEMATRIX566_TRIVIA: TriviaMeta = {
  skipLines: [9, 14],
  distractors: [
    "r_old, c_old = idx % orig_rows, idx // orig_rows",
    "r_new, c_new = idx % new_c, idx // new_c",
    "reshaped[r_old][c_old] = matrix[r_new][c_new]",
    "return matrix.flatten()",
  ],
  hints: [
    { line: 10, hint: "Flat index idx ranges from 0 to M*N - 1." },
    { line: 11, hint: "r_old = idx // orig_cols and c_old = idx % orig_cols." },
    { line: 12, hint: "r_new = idx // new_c and c_new = idx % new_c." },
  ],
  lineExplanations: {
    1: "Defines matrix coordinate reshape function signature.",
    2: "Start of docstring explaining tensor shape transformation.",
    3: "Describes reshaping 2D matrix into new_shape (new_r, new_c).",
    4: "End of docstring.",
    5: "Gets original matrix row count M.",
    6: "Gets original matrix column count N.",
    7: "Unpacks target reshape dimensions new_r and new_c.",
    8: "Allocates output grid reshaped of shape new_r x new_c initialized to zero.",
    9: "Blank line separating allocation and index mapping loop.",
    10: "Loops through flat element index idx from 0 to M*N - 1.",
    11: "Calculates original row r_old = idx // orig_cols and column c_old = idx % orig_cols.",
    12: "Calculates new row r_new = idx // new_c and column c_new = idx % new_c.",
    13: "Copies matrix element matrix[r_old][c_old] to target reshaped[r_new][c_new].",
    14: "Blank line prior to returning reshaped matrix.",
    15: "Returns completed reshaped 2D matrix of shape new_r x new_c.",
  },
};

export const reshapeMatrix566: AlgorithmDefinition<reshapeMatrix566Input> = {
  id: "reshape-matrix-566",
  title: "Reshape Matrix Coordinates Engine",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "In deep learning frameworks (PyTorch `torch.reshape()`, `tensor.view()`, NumPy `np.reshape()`, LeetCode 566), re-interpreting a matrix of shape $(M, N)$ into a new shape $(R, C)$ requires total element volume conservation ($M \\cdot N = R \\cdot C$). Reshaping preserves row-major memory order without reallocating physical data buffers.\n\nEach element's linear memory offset index $\\text{idx}$ relates spatial coordinates via division and modulo operations:\n- Original coordinates: $r_{\\text{old}} = \\lfloor \\text{idx} / N \\rfloor$, $c_{\\text{old}} = \\text{idx} \\bmod N$.\n- New target coordinates: $r_{\\text{new}} = \\lfloor \\text{idx} / C \\rfloor$, $c_{\\text{new}} = \\text{idx} \\bmod C$.\n\nIn zero-copy execution engines (e.g. PyTorch Strided Tensors), reshaping simply modifies metadata stride and shape vectors, achieving $O(1)$ constant-time execution without copying DRAM buffer memory.\n\nInput Format:\n- matrix: M x N input matrix.\n- newShape: Tuple [R, C] specifying target shape.\n\nOutput Format:\n- Returns R x C reshaped output matrix.\n\nEdge Cases & Constraints:\n- Invalid reshape request ($M \\cdot N \\ne R \\cdot C$).\n- Reshaping matrix to 1D vector (1 x MN or MN x 1).\n- Identity reshape ($R = M, C = N$).",
  constraints: ["1 <= matrix.length <= 100", "orig_rows * orig_cols == new_r * new_c"],
  examples: [
    {
      kind: "basic",
      title: "Reshape 2x6 Matrix to 3x4 Shape",
      inputDisplay: "matrix = 2x6, newShape = [3, 4]",
      outputDisplay: "Matrix of shape 3x4",
      input: DEFAULT_RESHAPEMATRIX566_INPUT,
      output: "3x4 reshaped matrix",
      explanation: "Maps 12 flat linear memory indices from (2, 6) layout to (3, 4) layout.",
    },
  ],
  code: RESHAPEMATRIX566_CODE,
  timeComplexity: { best: "O(M * N)", average: "O(M * N)", worst: "O(M * N)" },
  spaceComplexity: "O(R * C)",
  complexityAnalysis: {
    time: "Requires $O(M \\cdot N)$ linear scans for physical buffer copies ($O(1)$ constant time in strided zero-copy implementations).",
    space: "Allocates $O(R \\cdot C)$ memory space for output reshaped matrix.",
  },
  topicGuide: {
    overview:
      "Tensor reshaping is a core operation in modern deep learning models (e.g. multi-head attention projection, token flattening, CNN-to-linear transitions). Understanding linear memory indexing is essential for GPU kernel programming and strided memory views.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Tensors are stored in continuous linear memory blocks. A 2D matrix $(M, N)$ is mapped to 1D offset $\\text{idx} = r \\cdot N + c$. Reshaping changes how this 1D offset is partitioned into multidimensional coordinates without altering physical data locations.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "Enables flexible tensor dimension transformations across deep learning layers (e.g., reshaping $[B, S, H \\cdot D]$ token embeddings into $[B, S, H, D]$ multi-head attention inputs in PyTorch).",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "For element `val = 7` at index `idx = 6` in a 2x6 matrix: (1) $r_{\\text{old}} = 6 // 6 = 1, c_{\\text{old}} = 6 \\% 6 = 0$. (2) Target shape (3, 4): $r_{\\text{new}} = 6 // 4 = 1, c_{\\text{new}} = 6 \\% 4 = 2$. Output cell position `reshaped[1][2] = 7`.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "Zero-copy `view()` operations require memory contiguousness (`tensor.is_contiguous()`). Non-contiguous tensors (e.g. after transpose) must be copied via `.contiguous()` before reshaping.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $O(M \\cdot N)$ for physical element copy. Space Complexity: $O(R \\cdot C)$ for output array storage.",
      },
    ],
    keyTerms: [
      {
        term: "Tensor Reshape",
        definition:
          "Re-interpreting tensor spatial dimensions while preserving underlying memory order.",
      },
      {
        term: "Volume Conservation",
        definition:
          "Requirement that total element count $M \\cdot N$ remains equal to $R \\cdot C$.",
      },
      {
        term: "Strided Memory View",
        definition:
          "Zero-copy tensor representation modifying shape and stride vectors without moving DRAM data.",
      },
      {
        term: "Row-Major Layout",
        definition:
          "Memory layout storing elements of each row in contiguous memory addresses.",
      },
    ],
  },
  trivia: RESHAPEMATRIX566_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_RESHAPEMATRIX566_INPUT,
  generateSteps: generateReshapeMatrix566Steps,
};
