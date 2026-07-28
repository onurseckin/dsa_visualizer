import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface antiDiagonalExtractionInput {
  data: number[];
  rows?: number;
  cols?: number;
  target?: number;
}

export const ANTIDIAGONALEXTRACTION_CODE = `def anti_diagonal_extraction(matrix):
    rows = len(matrix)
    cols = len(matrix[0]) if rows > 0 else 0
    diagonals = []

    for k in range(rows + cols - 1):
        diag = []
        for r in range(max(0, k - cols + 1), min(rows, k + 1)):
            c = k - r
            diag.append(matrix[r][c])
        diagonals.append(diag)

    return diagonals`;

export const DEFAULT_ANTIDIAGONALEXTRACTION_INPUT: antiDiagonalExtractionInput = {
  data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  rows: 3,
  cols: 4,
  target: 30,
};

export const generateAntiDiagonalExtractionSteps = (
  input: antiDiagonalExtractionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const numRows = Math.max(1, input.rows ?? 3);
  const numCols = Math.max(1, input.cols ?? 4);
  const totalElements = numRows * numCols;
  const rawData =
    input.data && input.data.length >= totalElements
      ? input.data.slice(0, totalElements)
      : Array.from({ length: totalElements }, (_, i) => i + 1);

  // Construct 2D array representation
  const matrix: number[][] = [];
  for (let r = 0; r < numRows; r++) {
    matrix.push(rawData.slice(r * numCols, (r + 1) * numCols));
  }

  const buildCells = (
    activeDiagK?: number,
    activeR?: number,
    activeC?: number,
    completedK: number[] = [],
  ): MatrixCellItem[] => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const val = matrix[r][c];
        const cellK = r + c;
        let state: MatrixCellItem["state"] = "default";

        if (completedK.includes(cellK)) {
          state = "sorted";
        } else if (r === activeR && c === activeC) {
          state = "active";
        } else if (cellK === activeDiagK) {
          state = "compared";
        }

        cells.push({
          row: r,
          col: c,
          value: val,
          label: `(${r},${c}) k=${cellK}`,
          state,
        });
      }
    }
    return cells;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeDiagK?: number,
    activeR?: number,
    activeC?: number,
    completedK: number[] = [],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: numRows,
        cols: numCols,
        cells: buildCells(activeDiagK, activeR, activeC, completedK),
        rowHeaders: Array.from({ length: numRows }, (_, i) => `Row ${i}`),
        colHeaders: Array.from({ length: numCols }, (_, i) => `Col ${i}`),
        title: "Anti-Diagonal Wavefront Matrix",
      },
      auxiliaryState: {
        customState: {
          rows: String(numRows),
          cols: String(numCols),
          totalDiagonals: String(numRows + numCols - 1),
        },
      },
      variables,
    });
  };

  // Step 1: Function entry point
  addStep(
    1,
    "Initialize Anti-Diagonal Wavefront Matrix Traversal",
    `Setting up execution data structures to slice ${numRows}x${numCols} matrix into parallel anti-diagonals (r + c = k).`,
    { rows: numRows, cols: numCols },
  );

  // Step 2: Measure rows
  addStep(2, "Extract Matrix Row Count", `Measured rows = ${numRows}.`, { rows: numRows });

  // Step 3: Measure cols
  addStep(3, "Extract Matrix Column Count", `Measured cols = ${numCols}.`, { cols: numCols });

  // Step 4: Init diagonals list
  addStep(
    4,
    "Initialize Wavefront Diagonals Container",
    "Created empty list diagonals to accumulate extracted anti-diagonal arrays.",
    { total_diagonals: numRows + numCols - 1 },
  );

  const completedK: number[] = [];
  const maxK = numRows + numCols - 1;
  const allDiagonals: number[][] = [];

  for (let k = 0; k < maxK; k++) {
    addStep(
      6,
      `Begin Wavefront Diagonal Step k = ${k}`,
      `Iterating outer loop for anti-diagonal sum k = ${k} (range 0 to ${maxK - 1}).`,
      { k, max_k: maxK - 1 },
      k,
    );

    const currentDiag: number[] = [];
    addStep(
      7,
      `Initialize Storage for Anti-Diagonal k = ${k}`,
      `Created empty list diag for wavefront step k = ${k}.`,
      { k, diag: "[]" },
      k,
    );

    const rMin = Math.max(0, k - numCols + 1);
    const rMax = Math.min(numRows, k + 1);

    for (let r = rMin; r < rMax; r++) {
      const c = k - r;
      const val = matrix[r][c];

      addStep(
        8,
        `Evaluate Row Index r = ${r} for Diagonal k = ${k}`,
        `Valid row range for k=${k}: [${rMin}, ${rMax - 1}]. Currently processing row r = ${r}.`,
        { k, r, r_min: rMin, r_max: rMax - 1 },
        k,
        r,
        c,
        completedK,
      );

      addStep(
        9,
        `Calculate Column Index c = ${k} - ${r} = ${c}`,
        `Derived column coordinate c = ${c} (satisfying r + c = ${k}).`,
        { k, r, c },
        k,
        r,
        c,
        completedK,
      );

      currentDiag.push(val);
      addStep(
        10,
        `Extract Element matrix[${r}][${c}] = ${val}`,
        `Appended cell value ${val} at position (${r}, ${c}) into diagonal k = ${k}.`,
        { k, r, c, val, diag: JSON.stringify(currentDiag) },
        k,
        r,
        c,
        completedK,
      );
    }

    allDiagonals.push([...currentDiag]);
    completedK.push(k);
    addStep(
      11,
      `Finalize Wavefront Anti-Diagonal k = ${k}`,
      `Completed anti-diagonal k = ${k} (${JSON.stringify(currentDiag)}). Appended array to diagonals container. Total completed: ${completedK.length}/${maxK}.`,
      { k, completed_diagonals: completedK.length, diag: JSON.stringify(currentDiag) },
      undefined,
      undefined,
      undefined,
      completedK,
    );
  }

  // Return step
  addStep(
    13,
    "Return Wavefront Anti-Diagonals",
    `Successfully extracted all ${maxK} parallel anti-diagonals across ${numRows}x${numCols} matrix.`,
    { completed: true, total_diagonals: maxK },
    undefined,
    undefined,
    undefined,
    completedK,
  );

  return steps;
};

const ANTIDIAGONALEXTRACTION_TRIVIA: TriviaMeta = {
  skipLines: [5, 12],
  distractors: [
    "for r in range(rows): diag.append(matrix[r][r])",
    "c = r - k",
    "for k in range(rows):",
  ],
  hints: [
    {
      line: 8,
      hint: "The row bounds range(max(0, k - cols + 1), min(rows, k + 1)) restrict iteration strictly to valid grid coordinates.",
    },
    {
      line: 9,
      hint: "Column index is uniquely calculated as c = k - r because all elements on anti-diagonal k satisfy r + c = k.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for anti-diagonal matrix extraction function.",
    2: "Measures total row count M in input 2D matrix.",
    3: "Measures column count N from first row, defaulting to 0 if matrix is empty.",
    4: "Initializes empty list diagonals to store extracted wavefront anti-diagonal arrays.",
    5: "Blank line before outer wavefront diagonal loop.",
    6: "Iterates through diagonal wavefront index k from 0 up to rows + cols - 2.",
    7: "Initializes empty temporary list diag for elements on current anti-diagonal k.",
    8: "Iterates row index r over valid bounded range max(0, k - cols + 1) to min(rows, k + 1) - 1.",
    9: "Calculates column index c = k - r for current anti-diagonal element.",
    10: "Appends matrix[r][c] scalar value into current anti-diagonal array diag.",
    11: "Appends collected anti-diagonal array diag to main diagonals list.",
    12: "Blank line before return statement.",
    13: "Returns final list of extracted wavefront anti-diagonal arrays.",
  },
};

export const antiDiagonalExtraction: AlgorithmDefinition<antiDiagonalExtractionInput> = {
  id: "anti-diagonal-extraction",
  title: "Anti-Diagonal Matrix Traversal",
  topicIds: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Medium",
  description:
    "In dynamic programming, dynamic time warping (DTW), sequence alignment, and parallel matrix solvers (such as Floyd-Warshall or Smith-Waterman), dependencies run along row and column indices such that element $(r, c)$ depends on $(r-1, c)$ and $(r, c-1)$. Consequently, all elements along anti-diagonal slices defined by $r + c = k$ are mutually independent and can be executed concurrently in a single GPU wavefront step.\n\nThis algorithm extracts anti-diagonal slices from 2D tensor buffers, grouping matrix elements by wavefront step $k$. Executing entire anti-diagonals concurrently enables lock-free parallel execution across GPU thread blocks without write conflicts.\n\n### Problem Solved & ML Compiler Relevance\nOn GPU SIMT architectures, serial nested loops ($r, c$) introduce massive thread stall cycles when calculating recurrence relations. By transforming matrix iteration into diagonal sweeps ($k = 0, 1, \\dots, M+N-2$), all threads in a CUDA thread block or Triton kernel process cells on diagonal $k$ in parallel before barrier synchronizing (`__syncthreads()`) to move to step $k+1$.\n\n### Step-by-Step Execution\n1. **Dimension Extraction**: Determine rows $M$ and columns $N$.\n2. **Wavefront Loop**: Iterate diagonal index $k$ from $0$ to $M + N - 2$.\n3. **Coordinate Bounding**: Compute valid row range $r \\in [\\max(0, k - N + 1), \\min(M, k + 1))$.\n4. **Column Derivation**: For each valid $r$, derive column coordinate $c = k - r$ and extract $matrix[r][c]$.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard 3x4 Anti-Diagonal Extraction",
      inputDisplay: "data = [1..12], rows = 3, cols = 4",
      outputDisplay: "6 Diagonals: [[1], [2,5], [3,6,9], [4,7,10], [8,11], [12]]",
      input: { data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], rows: 3, cols: 4 },
      output: "[[1], [2, 5], [3, 6, 9], [4, 7, 10], [8, 11], [12]]",
      explanation: "Extracts 6 parallel wavefront anti-diagonals from 3x4 matrix.",
    },
    {
      kind: "complex",
      title: "Square 3x3 Matrix Traversal",
      inputDisplay: "data = [10..90], rows = 3, cols = 3",
      outputDisplay: "5 Diagonals: [[10], [20,40], [30,50,70], [60,80], [90]]",
      input: { data: [10, 20, 30, 40, 50, 60, 70, 80, 90], rows: 3, cols: 3 },
      output: "[[10], [20, 40], [30, 50, 70], [60, 80], [90]]",
      explanation: "Processes 3x3 matrix into 5 wavefront diagonal parallel sets.",
    },
    {
      kind: "negative",
      title: "Single Row Matrix Edge Case",
      inputDisplay: "data = [5, 10, 15, 20], rows = 1, cols = 4",
      outputDisplay: "4 Diagonals: [[5], [10], [15], [20]]",
      input: { data: [5, 10, 15, 20], rows: 1, cols: 4 },
      output: "[[5], [10], [15], [20]]",
      explanation: "A 1x4 matrix produces 4 single-element anti-diagonals.",
    },
  ],
  code: ANTIDIAGONALEXTRACTION_CODE,
  timeComplexity: { best: "O(M * N)", average: "O(M * N)", worst: "O(M * N)" },
  spaceComplexity: "O(M * N)",
  complexityAnalysis: {
    time: "O(M * N) total operations visiting each matrix element exactly once.",
    space: "O(M * N) memory storage for output anti-diagonal slices.",
  },
  topicGuide: {
    overview:
      "Anti-diagonal extraction (also known as wavefront execution or diagonal sweep) is a fundamental pattern for parallelizing dynamic programming algorithms on SIMD/SIMT architectures. By organizing computation into independent diagonal waves (where $r + c = k$), GPU threads execute entire diagonals in parallel without encountering data races or write conflicts.\n\nThis technique is heavily utilized in CUDA implementations of sequence alignment, tensor contraction recurrence algorithms, and dynamic time warping kernels.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "In recurrence relations like $f(r, c) = g(f(r-1, c), f(r, c-1))$, evaluating cells row-by-row forces strictly serial execution because cell $(r, c)$ depends on its top and left neighbors. However, notice that cell $(r, c)$ depends only on cells with diagonal sum $k-1$. Therefore, all cells sharing the exact same diagonal index $k = r + c$ depend ONLY on cells from step $k-1$ and have ZERO dependencies on each other, enabling complete parallel execution across wavefront $k$.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "Wavefront anti-diagonal extraction is employed in ML infrastructure for sequence alignment (Smith-Waterman algorithm), dynamic time warping (DTW) in speech recognition, tri-diagonal matrix solvers, and edit distance computations in LLM evaluation pipelines.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "Consider a $3 \\times 3$ matrix:\n```\n[ 1,  2,  3 ]\n[ 4,  5,  6 ]\n[ 7,  8,  9 ]\n```\n1. $k=0$: $r+c=0 \\rightarrow (0,0) = [1]$\n2. $k=1$: $r+c=1 \\rightarrow (0,1), (1,0) = [2, 4]$\n3. $k=2$: $r+c=2 \\rightarrow (0,2), (1,1), (2,0) = [3, 5, 7]$\n4. $k=3$: $r+c=3 \\rightarrow (1,2), (2,1) = [6, 8]$\n5. $k=4$: $r+c=4 \\rightarrow (2,2) = [9]$",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "While wavefront execution unlocks parallelism, anti-diagonal accesses do not naturally align with row-major memory layouts. Accessing elements along $r + c = k$ across different rows causes strided DRAM reads. High-performance CUDA implementations load 2D matrix blocks into fast shared memory (SRAM) first, enabling unstrided anti-diagonal reads directly from SRAM with zero bank conflicts via index swizzling.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(M \\times N)$ total element sweeps, with $\\mathcal{O}(\\min(M, N))$ parallel work per wavefront step $k$. Space Complexity: $\\mathcal{O}(M \\times N)$ to store the extracted anti-diagonal partitions.",
      },
    ],
    keyTerms: [
      {
        term: "Wavefront Execution",
        definition:
          "Parallel processing pattern where independent diagonal computation steps advance sequentially through a matrix.",
      },
      {
        term: "Anti-Diagonal Index",
        definition:
          "The sum k = r + c identifying all matrix cells lying on the same diagonal slice.",
      },
      {
        term: "Shared Memory Swizzling",
        definition:
          "Remapping 2D indices in SRAM to eliminate memory bank conflicts during strided diagonal access.",
      },
      {
        term: "Recurrence Relation",
        definition:
          "An equation expressing grid cell values in terms of previously computed adjacent neighbor values.",
      },
    ],
  },
  trivia: ANTIDIAGONALEXTRACTION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_ANTIDIAGONALEXTRACTION_INPUT,
  generateSteps: generateAntiDiagonalExtractionSteps,
};
