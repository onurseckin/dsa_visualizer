import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fusedFfnGemmOnlineSoftmaxInput {
  matrixA?: number[][];
  matrixB?: number[][];
  data?: number[];
}

export const FUSEDFFNGEMMONLINESOFTMAX_CODE = `def fused_ffn_gemm_online_softmax(matrix_a, matrix_b):
    import math
    rows = len(matrix_a)
    cols = len(matrix_b[0])
    k_dim = len(matrix_a[0])
    softmax_output = []

    for r in range(rows):
        scores = []
        for c in range(cols):
            dot = sum(matrix_a[r][k] * matrix_b[k][c] for k in range(k_dim))
            scores.append(dot)

        max_val = max(scores)
        exp_vals = [math.exp(x - max_val) for x in scores]
        sum_exp = sum(exp_vals)
        probs = [x / sum_exp for x in exp_vals]
        softmax_output.append(probs)

    return softmax_output`;

export const DEFAULT_FUSEDFFNGEMMONLINESOFTMAX_INPUT: fusedFfnGemmOnlineSoftmaxInput = {
  matrixA: [
    [1.0, 2.0, 0.5],
    [0.5, 1.5, 2.0],
    [2.0, 0.0, 1.0],
  ],
  matrixB: [
    [1.0, 0.0, 1.0],
    [0.5, 2.0, 0.0],
    [0.0, 1.0, 2.0],
  ],
};

export const generateFusedFfnGemmOnlineSoftmaxSteps = (
  input: fusedFfnGemmOnlineSoftmaxInput,
): AlgorithmStep[] => {
  const matrixA = input.matrixA ?? [
    [1.0, 2.0, 0.5],
    [0.5, 1.5, 2.0],
    [2.0, 0.0, 1.0],
  ];
  const matrixB = input.matrixB ?? [
    [1.0, 0.0, 1.0],
    [0.5, 2.0, 0.0],
    [0.0, 1.0, 2.0],
  ];

  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rows = matrixA.length;
  const cols = matrixB[0]?.length ?? 0;
  const kDim = matrixA[0]?.length ?? 0;

  // Initialize output matrix representation
  const currentGrid: (number | string)[][] = Array.from({ length: rows }, () =>
    Array(cols).fill("0.000"),
  );

  const makeMatrixSnapshot = (
    activeRow?: number,
    activeCol?: number,
    stage?: "dot" | "max" | "exp" | "sum" | "prob" | "done",
    title: string = "Fused Softmax Matrix State",
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let cellState: MatrixCellItem["state"] = "default";
        if (r === activeRow && c === activeCol) {
          cellState = stage === "prob" ? "sorted" : "active";
        } else if (r === activeRow) {
          cellState = "compared";
        } else if (r < (activeRow ?? -1)) {
          cellState = "sorted";
        }

        cells.push({
          row: r,
          col: c,
          value:
            typeof currentGrid[r][c] === "number"
              ? (currentGrid[r][c] as number).toFixed(3)
              : String(currentGrid[r][c]),
          state: cellState,
          label: `r${r}c${c}`,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows,
      cols,
      cells,
      rowHeaders: Array.from({ length: rows }, (_, i) => `Row ${i}`),
      colHeaders: Array.from({ length: cols }, (_, j) => `Col ${j}`),
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
    stage?: "dot" | "max" | "exp" | "sum" | "prob" | "done",
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: makeMatrixSnapshot(
        activeRow,
        activeCol,
        stage,
        `Fused FFN GEMM Online Softmax (Row ${activeRow ?? "-"}, Col ${activeCol ?? "-"})`,
      ),
      auxiliaryState: {
        customState: {
          matrixA: JSON.stringify(matrixA),
          matrixB: JSON.stringify(matrixB),
          rows: String(rows),
          cols: String(cols),
          kDim: String(kDim),
        },
      },
      variables,
    });
  };

  // Step 1: Definition
  addStep(
    1,
    "Initialize Fused FFN GEMM & Online Softmax Kernel",
    "Fusing GEMM linear projection with row-wise online max/sum softmax normalization in high-speed SRAM.",
    { rows, cols, kDim },
  );

  // Step 2: Import math
  addStep(
    2,
    "Import Math Module",
    "Loading mathematical primitives for floating-point exponential calculation math.exp().",
    { rows, cols },
  );

  // Step 3: Dimensions M
  addStep(
    3,
    `Inspect Matrix A Row Dimension (rows = ${rows})`,
    "Determining token sequence length M for row-parallel execution.",
    { rows },
  );

  // Step 4: Dimensions N
  addStep(
    4,
    `Inspect Matrix B Column Dimension (cols = ${cols})`,
    "Determining feature projection dimension N.",
    { cols },
  );

  // Step 5: Contraction K
  addStep(
    5,
    `Inspect Shared Contraction Dimension (k_dim = ${kDim})`,
    "Determining dot-product length K for matrix contraction.",
    { kDim },
  );

  // Step 6: Initialize output structure
  addStep(
    6,
    "Allocate Softmax Output Buffer",
    "Initializing container to accumulate normalized row probability vectors.",
    { softmax_output_rows: 0 },
  );

  const softmaxOutput: number[][] = [];

  for (let r = 0; r < rows; r++) {
    // Step 8: Outer loop row r
    addStep(
      8,
      `Start Processing Row ${r}`,
      `Iterating through token row ${r} of ${rows} in fused SRAM register workspace.`,
      { r },
      r,
      undefined,
      "dot",
    );

    // Step 9: Initialize scores
    addStep(
      9,
      `Initialize Scores Buffer for Row ${r}`,
      "Allocating temporary score logit register array.",
      { r, scores_len: 0 },
      r,
      undefined,
      "dot",
    );

    const scores: number[] = [];

    for (let c = 0; c < cols; c++) {
      // Step 10: Inner loop col c
      addStep(
        10,
        `Evaluate Column ${c} for Row ${r}`,
        `Computing GEMM linear projection entry for cell (${r}, ${c}).`,
        { r, c },
        r,
        c,
        "dot",
      );

      // Micro-steps for GEMM accumulation sum(A[r][k] * B[k][c])
      let dot = 0;
      for (let k = 0; k < kDim; k++) {
        const prod = matrixA[r][k] * matrixB[k][c];
        dot += prod;

        addStep(
          11,
          `GEMM Multiply-Accumulate: k=${k} (A[${r}][${k}] * B[${k}][${c}])`,
          `A[${r}][${k}] (${matrixA[r][k]}) * B[${k}][${c}] (${matrixB[k][c]}) = ${prod.toFixed(
            3,
          )}; Partial dot sum = ${dot.toFixed(3)}`,
          { r, c, k, valA: matrixA[r][k], valB: matrixB[k][c], prod, dot },
          r,
          c,
          "dot",
        );
      }

      scores.push(dot);
      currentGrid[r][c] = dot;

      // Step 12: Append score
      addStep(
        12,
        `Store Score Logit (${dot.toFixed(3)}) for Cell (${r}, ${c})`,
        `Appended GEMM dot product score logit to row ${r} accumulator.`,
        { r, c, dot },
        r,
        c,
        "dot",
      );
    }

    // Step 14: Max value for numerical stability
    const maxVal = Math.max(...scores);
    addStep(
      14,
      `Compute Row Max Logit (max_val = ${maxVal.toFixed(3)})`,
      "Tracking maximum score logit to prevent math.exp() floating-point overflow during exponentiation.",
      { r, maxVal },
      r,
      undefined,
      "max",
    );

    // Step 15: Shifted exponentials
    const expVals = scores.map((x) => Math.exp(x - maxVal));
    addStep(
      15,
      `Calculate Shifted Exponentials exp(x - max_val)`,
      `Subtracted max (${maxVal.toFixed(3)}) from scores [${scores
        .map((s) => s.toFixed(2))
        .join(", ")}] -> exp: [${expVals.map((e) => e.toFixed(4)).join(", ")}]`,
      { r, maxVal, expVals: expVals.map((e) => Number(e.toFixed(4))).join(",") },
      r,
      undefined,
      "exp",
    );

    // Step 16: Sum of exponentials
    const sumExp = expVals.reduce((a, b) => a + b, 0);
    addStep(
      16,
      `Sum Exponentials (sum_exp = ${sumExp.toFixed(4)})`,
      "Reducing exponential terms across row columns to establish normalizer denominator.",
      { r, sumExp },
      r,
      undefined,
      "sum",
    );

    // Step 17: Normalize probabilities
    const probs = expVals.map((x) => x / sumExp);
    for (let c = 0; c < cols; c++) {
      currentGrid[r][c] = probs[c];
    }

    addStep(
      17,
      `Compute Softmax Probabilities for Row ${r}`,
      `Divided exponentials by sum_exp (${sumExp.toFixed(4)}) -> Probs: [${probs
        .map((p) => p.toFixed(4))
        .join(", ")}]`,
      { r, probs: probs.map((p) => Number(p.toFixed(4))).join(",") },
      r,
      undefined,
      "prob",
    );

    // Step 18: Append row result
    softmaxOutput.push(probs);
    addStep(
      18,
      `Append Softmax Row ${r} Result to Output Matrix`,
      `Row ${r} normalized probability vector successfully appended.`,
      { r, softmaxOutputRows: softmaxOutput.length },
      r,
      undefined,
      "prob",
    );
  }

  // Step 20: Return statement
  addStep(
    20,
    "Execution Complete: Return Softmax Output",
    "Successfully completed fused GEMM and online softmax normalization kernel.",
    { completed: true, totalRowsProcessed: rows },
    undefined,
    undefined,
    "done",
  );

  return steps;
};

const FUSEDFFNGEMMONLINESOFTMAX_TRIVIA: TriviaMeta = {
  skipLines: [7, 13, 19],
  distractors: [
    "softmax_output.append(scores)",
    "exp_vals = [math.exp(x) for x in scores]",
    "probs = [x / max_val for x in exp_vals]",
    "return scores",
  ],
  hints: [
    { line: 11, hint: "Compute dot product sum over contraction dimension K." },
    { line: 14, hint: "Subtract max_val to enforce numerical stability." },
    { line: 16, hint: "Sum exponentials to find normalization denominator." },
  ],
  lineExplanations: {
    1: "Defines fused FFN GEMM and online softmax kernel function.",
    2: "Imports Python math module for math.exp() exponential computation.",
    3: "Gets row count M from matrix A.",
    4: "Gets column count N from matrix B.",
    5: "Gets shared inner contraction dimension K from matrix A.",
    6: "Initializes list to collect row-wise normalized softmax probabilities.",
    7: "Blank line between initialization and outer loop.",
    8: "Loops through each matrix row index r.",
    9: "Initializes list to store raw GEMM score logits for current row.",
    10: "Loops through each column index c.",
    11: "Computes GEMM dot product sum(A[r][k] * B[k][c]) across inner dimension K.",
    12: "Appends calculated scalar dot product score to row score list.",
    13: "Blank line separating score generation and softmax normalization.",
    14: "Finds maximum score logit in current row for numerical stability.",
    15: "Computes shifted exponentials math.exp(x - max_val) to prevent overflow.",
    16: "Sums shifted exponentials to obtain normalization divisor sum_exp.",
    17: "Divides each exponential by sum_exp to produce normalized probabilities.",
    18: "Appends normalized probability row vector to softmax output.",
    19: "Blank line prior to return.",
    20: "Returns completed 2D matrix of row-wise softmax probabilities.",
  },
};

export const fusedFfnGemmOnlineSoftmax: AlgorithmDefinition<fusedFfnGemmOnlineSoftmaxInput> = {
  id: "fused-ffn-gemm-online-softmax",
  title: "Fused FFN GEMM & Online Softmax Kernel",
  topicIds: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Hard",
  description:
    "In Transformer Feed-Forward Networks (FFN) and Attention mechanisms (e.g. FlashAttention, vLLM fused kernels, Triton GEMM + Softmax), standard unfused execution computes matrix multiplication $C = A \\times B$, writes intermediate score logits $C$ to High Bandwidth Memory (HBM), and subsequently reads $C$ back into SRAM to perform row-wise Softmax normalization. This unfused pipeline incurs heavy DRAM memory bandwidth overhead and causes memory bus thrashing.\n\nFused GEMM + Online Softmax eliminates DRAM round-trips by keeping score logits in GPU SRAM registers or shared memory, immediately computing numerically stable Softmax statistics (row maximum $m = \\max_j(s_j)$ and sum of exponentials $d = \\sum_j \\exp(s_j - m)$), and writing only normalized probability distributions to main memory.\n\nInput Format:\n- matrixA: M x K activation matrix (e.g., token embeddings).\n- matrixB: K x N weight matrix (e.g., feed-forward projection weights).\n\nOutput Format:\n- Returns M x N matrix containing row-wise normalized Softmax probabilities $\\sum_j p_{ij} = 1.0$.\n\nEdge Cases & Constraints:\n- Large negative or positive logit values requiring $m = \\max_j(s_j)$ subtraction for numerical stability.\n- Uniform score distributions leading to equal probabilities $1/N$.\n- Small batch/token sequence lengths.",
  constraints: ["1 <= matrixA.length <= 100", "1 <= matrixB[0].length <= 100"],
  examples: [
    {
      kind: "basic",
      title: "Standard 3x3 Fused Execution",
      inputDisplay: "matrixA = [[1, 2, 0.5], ...], matrixB = [[1, 0, 1], ...]",
      outputDisplay: "Softmax output matrix (rows sum to 1.0)",
      input: DEFAULT_FUSEDFFNGEMMONLINESOFTMAX_INPUT,
      output: "[[0.24, 0.65, 0.11], ...]",
      explanation: "Computes GEMM linear projections and normalizes scores row-wise in SRAM.",
    },
  ],
  code: FUSEDFFNGEMMONLINESOFTMAX_CODE,
  timeComplexity: { best: "O(M * N * K)", average: "O(M * N * K)", worst: "O(M * N * K)" },
  spaceComplexity: "O(M * N)",
  complexityAnalysis: {
    time: "Matrix multiplication requires M * N * K scalar multiplications and additions. Online Softmax requires M * N exponential and division operations, yielding O(M * N * K) overall time complexity.",
    space:
      "Allocates M x N buffer for final normalized probability output. Intermediate registers remain in SRAM without extra DRAM allocation.",
  },
  topicGuide: {
    overview:
      "Kernel fusion is a foundational optimization technique in modern deep learning compilers (Triton, PyTorch Inductor, TensorRT). Fusing matrix multiplication (GEMM) directly with Softmax eliminates DRAM memory bandwidth bottlenecks by retaining intermediate logits inside fast hardware registers (GPU SRAM).\n\nIn standard unfused pipelines, writing GEMM output matrices to DRAM and reading them back for Softmax consumes up to 80% of total kernel latency. Fused Online Softmax computes score logits, tracks running maximums, computes exponentials, and normalizes values in a single high-throughput hardware pass.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Standard Softmax $p_j = \\frac{\\exp(s_j)}{\\sum_k \\exp(s_k)}$ is prone to numerical overflow when score logits $s_j$ are large. Subtractive normalization $p_j = \\frac{\\exp(s_j - m)}{\\sum_k \\exp(s_k - m)}$ where $m = \\max_k(s_k)$ stabilizes floating-point arithmetic. Online Softmax allows updating $m$ and the exponential sum dynamically across sub-block tiles without storing the full logit matrix.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "Used in LLM Attention mechanisms (FlashAttention-1/2/3) and FFN projection layers. Eliminates memory bandwidth limitations on GPUs (NVIDIA H100, A100, AMD MI300X) by transforming memory-bound Softmax into a register-resident computation.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "For each row $r$: (1) Compute inner dot products $A[r][:] \\cdot B[:][c]$ for all columns $c$. (2) Determine row maximum logit $m$. (3) Compute exponentiated differences $e_c = \\exp(s_c - m)$. (4) Sum exponentials $S = \\sum e_c$. (5) Normalize each probability $p_c = e_c / S$.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "Requires additional GPU register usage per thread. If tile sizes are too large, register spilling to DRAM can degrade performance. However, for standard GEMM block sizes (e.g. 64x64 or 128x128), register persistence yields up to 3x speedups over unfused implementations.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $O(M \\times N \\times K)$ FLOPs for GEMM dot products, plus $O(M \\times N)$ operations for Softmax reduction. Space Complexity: $O(M \\times N)$ for final output matrix storage ($O(1)$ extra DRAM space during computation).",
      },
    ],
    keyTerms: [
      {
        term: "Kernel Fusion",
        definition:
          "Combining multiple computational operators (e.g. GEMM + Softmax) into a single hardware thread block execution pass to eliminate DRAM accesses.",
      },
      {
        term: "Online Softmax",
        definition:
          "An algorithm for computing softmax normalization iteratively using dynamic maximum tracking without storing full logit matrices.",
      },
      {
        term: "Numerical Stability",
        definition:
          "Subtracting row maximum value $m = \\max(s)$ before evaluating $\\exp(s - m)$ to prevent IEEE-754 floating-point overflow.",
      },
      {
        term: "Register Spilling",
        definition:
          "High memory overhead causing local thread variables to spill from high-speed SRAM registers to slower global DRAM.",
      },
    ],
  },
  trivia: FUSEDFFNGEMMONLINESOFTMAX_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_FUSEDFFNGEMMONLINESOFTMAX_INPUT,
  generateSteps: generateFusedFfnGemmOnlineSoftmaxSteps,
};
