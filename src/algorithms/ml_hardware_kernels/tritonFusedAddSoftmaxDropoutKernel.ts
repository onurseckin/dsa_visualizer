import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tritonFusedAddSoftmaxDropoutKernelInput {
  x_matrix?: number[][];
  residual_matrix?: number[][];
  dropout_p?: number;
  seed?: number;
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_CODE = `def triton_fused_add_softmax_dropout(x_matrix: list[list[float]], residual_matrix: list[list[float]], dropout_p: float = 0.1, seed: int = 42) -> tuple[list[list[float]], list[list[float]]]:
    """Simulates a fused Triton GPU kernel executing Elementwise Add + Online Softmax + Dropout in SRAM."""
    import math

    rows = len(x_matrix)
    cols = len(x_matrix[0])
    output = []
    masks = []

    scale = 1.0 / (1.0 - dropout_p) if dropout_p < 1.0 else 0.0

    for r in range(rows):
        row_y = [x_matrix[r][c] + residual_matrix[r][c] for c in range(cols)]

        row_max = max(row_y)
        exp_vals = [math.exp(val - row_max) for val in row_y]
        sum_exp = sum(exp_vals)
        softmax_probs = [ev / sum_exp for ev in exp_vals]

        out_row = []
        mask_row = []
        for c in range(cols):
            pseudo_rand = ((r * 13 + c * 37 + seed * 97) % 100) / 100.0
            keep = 1.0 if pseudo_rand >= dropout_p else 0.0
            dropout_val = softmax_probs[c] * keep * scale
            out_row.append(round(dropout_val, 4))
            mask_row.append(keep)

        output.append(out_row)
        masks.append(mask_row)

    return output, masks`;

export const DEFAULT_TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_INPUT: tritonFusedAddSoftmaxDropoutKernelInput = {
  x_matrix: [
    [1.0, 2.0, 3.0],
    [2.0, 0.0, 1.0],
    [0.5, 1.5, 2.5],
  ],
  residual_matrix: [
    [0.5, 0.5, 0.5],
    [1.0, 1.0, 1.0],
    [0.5, 0.5, 0.5],
  ],
  dropout_p: 0.1,
  seed: 42,
  data: [1, 2, 3, 2, 0, 1, 0.5, 1.5, 2.5],
  target: 0,
};

export const generateTRITONFUSEDADDSOFTMAXDROPOUTKERNELSteps = (
  input: tritonFusedAddSoftmaxDropoutKernelInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const xMat = input.x_matrix || DEFAULT_TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_INPUT.x_matrix!;
  const resMat = input.residual_matrix || DEFAULT_TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_INPUT.residual_matrix!;
  const dropoutP = input.dropout_p !== undefined ? input.dropout_p : 0.1;
  const seed = input.seed !== undefined ? input.seed : 42;

  const rows = xMat.length;
  const cols = xMat[0].length;
  const scale = dropoutP < 1.0 ? 1.0 / (1.0 - dropoutP) : 0.0;

  const output: number[][] = [];
  const masks: number[][] = [];

  const getSnapshot = (
    activeRow: number = -1,
    activeCol: number = -1,
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hasVal = output[r] && output[r][c] !== undefined;
        const val = hasVal ? output[r][c] : xMat[r][c] + resMat[r][c];
        const isKept = masks[r] && masks[r][c] !== undefined ? masks[r][c] === 1.0 : true;

        const isCurrent = r === activeRow && c === activeCol;
        const isInActiveRow = r === activeRow;
        const state = isCurrent ? "active" : isInActiveRow ? "compare" : hasVal ? (isKept ? "sorted" : "default") : "default";

        cells.push({
          row: r,
          col: c,
          value: val.toFixed(4),
          label: `Out[${r},${c}]`,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows,
      cols,
      rowHeaders: Array.from({ length: rows }, (_, r) => `Row ${r}`),
      colHeaders: Array.from({ length: cols }, (_, c) => `Col ${c}`),
      cells,
      title: `Triton Fused Add + Softmax + Dropout Output Matrix (${rows}x${cols}, p=${dropoutP})`,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow: number = -1,
    activeCol: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeRow, activeCol),
      auxiliaryState: {
        customState: {
          "Algorithm": "Triton Fused Add + Softmax + Dropout Kernel",
          "Matrix Size": `${rows} x ${cols}`,
          "Dropout Probability p": String(dropoutP),
          "Inverted Dropout Scale": scale.toFixed(4),
          "HBM DRAM Savings": "Eliminated 2 intermediate HBM DRAM roundtrips!",
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Triton Fused Add + Softmax + Dropout Kernel Entry",
    `Started Triton fused kernel executing Elementwise Add, Softmax, and Inverted Dropout inside GPU SRAM across ${rows}x${cols} matrix (p=${dropoutP}).`,
    { rows, cols, dropoutP, seed },
  );

  // Step 2: Import math (3)
  addStep(
    3,
    "Import Python math Module",
    "Imported math module for exponential math.exp().",
    { imported: true },
  );

  // Step 3: Measure rows & cols (5, 6)
  addStep(
    5,
    `Measure Matrix Rows: rows = ${rows}`,
    `Matrix row count rows = ${rows}.`,
    { rows },
  );

  addStep(
    6,
    `Measure Matrix Cols: cols = ${cols}`,
    `Matrix column count cols = ${cols}.`,
    { cols },
  );

  // Step 4: Allocate output & masks (7, 8)
  addStep(
    7,
    "Allocate output [] List in DRAM HBM",
    "Allocated list to store fused kernel output matrix.",
    { output_len: 0 },
  );

  addStep(
    8,
    "Allocate masks [] List in DRAM HBM",
    "Allocated list to store inverted dropout boolean mask matrix.",
    { masks_len: 0 },
  );

  // Step 5: Compute scale (10)
  addStep(
    10,
    `Calculate Inverted Dropout Scale Factor: scale = 1 / (1 - p) = ${scale.toFixed(4)}`,
    `Evaluated inverted dropout scale multiplier = ${scale.toFixed(4)} to preserve expected tensor activations during training.`,
    { scale },
  );

  // Loop over rows (12..30)
  for (let r = 0; r < rows; r++) {
    addStep(
      12,
      `Outer Row Loop: Process Row r = ${r}`,
      `Processing row ${r} of ${rows - 1}. Fusing Add + Softmax + Dropout in SRAM registers.`,
      { r },
      r,
    );

    const rowY = xMat[r].map((xVal, c) => xVal + resMat[r][c]);
    addStep(
      13,
      `Fused Step 1 (Elementwise Add): row_y = x_matrix[${r}] + residual_matrix[${r}]`,
      `Evaluated SRAM elementwise residual sum: [${rowY.map((v) => v.toFixed(2)).join(", ")}].`,
      { r, row_y: JSON.stringify(rowY.map((v) => v.toFixed(2))) },
      r,
    );

    const rowMax = Math.max(...rowY);
    addStep(
      15,
      `Fused Step 2a (Softmax Max): row_max = max(row_y) = ${rowMax.toFixed(4)}`,
      `Evaluated row maximum score row_max = ${rowMax.toFixed(4)} for zero-overflow numerical stability.`,
      { r, rowMax },
      r,
    );

    const expVals = rowY.map((val) => Math.exp(val - rowMax));
    addStep(
      16,
      `Fused Step 2b (Softmax Exponentiation): exp_vals = exp(row_y - row_max)`,
      `Evaluated exponentiated terms: [${expVals.map((v) => v.toFixed(4)).join(", ")}].`,
      { r, expVals: JSON.stringify(expVals.map((v) => v.toFixed(4))) },
      r,
    );

    const sumExp = expVals.reduce((a, b) => a + b, 0);
    addStep(
      17,
      `Fused Step 2c (Softmax Normalizer): sum_exp = ${sumExp.toFixed(4)}`,
      `Summed exponentiated terms sum_exp = ${sumExp.toFixed(4)}.`,
      { r, sumExp },
      r,
    );

    const softmaxProbs = expVals.map((ev) => ev / sumExp);
    addStep(
      18,
      `Fused Step 2d (Softmax Probabilities): softmax_probs`,
      `Evaluated exact row probability vector: [${softmaxProbs.map((v) => v.toFixed(4)).join(", ")}].`,
      { r, softmaxProbs: JSON.stringify(softmaxProbs.map((v) => v.toFixed(4))) },
      r,
    );

    const outRow: number[] = [];
    const maskRow: number[] = [];

    addStep(
      20,
      `Allocate out_row [] and mask_row [] for Row ${r}`,
      `Initialised empty registers for row ${r} output and dropout mask.`,
      { r },
      r,
    );

    for (let c = 0; c < cols; c++) {
      addStep(
        22,
        `Fused Step 3 (Dropout): Process Cell [${r}, ${c}]`,
        `Applying Philox PRNG and inverted dropout to Softmax probability cell [${r}, ${c}].`,
        { r, c },
        r,
        c,
      );

      const pseudoRand = ((r * 13 + c * 37 + seed * 97) % 100) / 100.0;
      addStep(
        23,
        `Generate Philox PRNG Pseudo-Random Value: pseudo_rand = ${pseudoRand.toFixed(2)}`,
        `Evaluated GPU Philox PRNG value = ${pseudoRand.toFixed(2)}.`,
        { r, c, pseudoRand },
        r,
        c,
      );

      const keep = pseudoRand >= dropoutP ? 1.0 : 0.0;
      addStep(
        24,
        `Evaluate Dropout Keep Condition: ${pseudoRand.toFixed(2)} >= ${dropoutP}`,
        keep === 1.0
          ? `True (${pseudoRand.toFixed(2)} >= ${dropoutP}) -> KEEP neuron activation!`
          : `False (${pseudoRand.toFixed(2)} < ${dropoutP}) -> DROP neuron activation to 0.0!`,
        { r, c, keep },
        r,
        c,
      );

      const dropoutVal = Math.round(softmaxProbs[c] * keep * scale * 10000) / 10000;
      addStep(
        25,
        `Calculate Final Inverted Dropout Cell: dropout_val = ${dropoutVal.toFixed(4)}`,
        `Evaluated final cell value = ${softmaxProbs[c].toFixed(4)} * ${keep} * ${scale.toFixed(4)} = ${dropoutVal.toFixed(4)}.`,
        { r, c, dropoutVal },
        r,
        c,
      );

      outRow.push(dropoutVal);
      addStep(
        26,
        `Append ${dropoutVal.toFixed(4)} to out_row`,
        `Recorded cell value into out_row.`,
        { dropoutVal },
        r,
        c,
      );

      maskRow.push(keep);
      addStep(
        27,
        `Append ${keep} to mask_row`,
        `Recorded keep mask into mask_row.`,
        { keep },
        r,
        c,
      );
    }

    output.push(outRow);
    addStep(
      29,
      `Write Fused Output Row ${r} to DRAM HBM`,
      `Wrote finalized output row ${r} into DRAM HBM.`,
      { r },
      r,
    );

    masks.push(maskRow);
    addStep(
      30,
      `Write Dropout Mask Row ${r} to DRAM HBM`,
      `Wrote boolean mask row ${r} into DRAM HBM for backward pass autograd.`,
      { r },
      r,
    );
  }

  // Return step (32)
  addStep(
    32,
    "Execution Complete: Return (output, masks)",
    `Completed Triton fused kernel execution. Fused 3 operations into 1 single GPU kernel call with zero intermediate HBM DRAM materialization!`,
    { rows, cols, completed: true },
  );

  return steps;
};

const TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_TRIVIA: TriviaMeta = {
  skipLines: [2, 4, 9, 11, 14, 21, 28, 31],
  distractors: [
    "scale = 1.0 / dropout_p",
    "keep = 1.0 if pseudo_rand < dropout_p else 0.0",
    "dropout_val = softmax_probs[c] + keep",
    "return output",
  ],
  hints: [
    { line: 10, hint: "Inverted dropout scaling factor formula: scale = 1.0 / (1.0 - dropout_p)." },
    { line: 25, hint: "Inverted dropout cell value equation: softmax_probs[c] * keep * scale." },
  ],
  lineExplanations: {
    1: "Defines entry point for triton_fused_add_softmax_dropout function.",
    2: "Docstring describing fused Triton GPU kernel executing Elementwise Add + Online Softmax + Dropout in SRAM.",
    3: "Imports Python math module for exponential math.exp().",
    4: "Blank line before measuring matrix dimensions.",
    5: "Measures matrix row count rows = len(x_matrix).",
    6: "Measures matrix column count cols = len(x_matrix[0]).",
    7: "Initializes empty list output for fused result matrix.",
    8: "Initializes empty list masks for dropout boolean mask matrix.",
    9: "Blank line before inverted dropout scale calculation.",
    10: "Calculates inverted dropout scaling factor scale = 1.0 / (1.0 - dropout_p) if dropout_p < 1.0 else 0.0.",
    11: "Blank line before row processing loop.",
    12: "Iterates over matrix row index r from 0 to rows - 1.",
    13: "Performs Fused Step 1: Elementwise residual addition row_y = [x_matrix[r][c] + residual_matrix[r][c]].",
    14: "Blank line before Softmax computation.",
    15: "Calculates row maximum score row_max = max(row_y) for numerical stability.",
    16: "Calculates exponentiated scores exp_vals = [exp(val - row_max) for val in row_y].",
    17: "Summation of exponentiated scores sum_exp = sum(exp_vals).",
    18: "Normalizes softmax probabilities softmax_probs = [ev / sum_exp for ev in exp_vals].",
    19: "Blank line before dropout application loop.",
    20: "Initializes empty list out_row for row r.",
    21: "Initializes empty list mask_row for row r.",
    22: "Iterates over matrix column index c from 0 to cols - 1.",
    23: "Generates Philox pseudo-random value pseudo_rand in [0, 1) range.",
    24: "Evaluates dropout keep flag keep = 1.0 if pseudo_rand >= dropout_p else 0.0.",
    25: "Calculates inverted dropout cell value dropout_val = softmax_probs[c] * keep * scale.",
    26: "Appends rounded dropout_val to out_row.",
    27: "Appends keep flag to mask_row.",
    28: "Blank line before row appending.",
    29: "Appends out_row to output matrix.",
    30: "Appends mask_row to masks matrix.",
    31: "Blank line separating row loop from return statement.",
    32: "Returns tuple of (output, masks).",
  },
};

export const tritonFusedAddSoftmaxDropoutKernel: AlgorithmDefinition<tritonFusedAddSoftmaxDropoutKernelInput> =
  {
    id: "tritonFusedAddSoftmaxDropoutKernel",
    title: "Triton Fused Add + Softmax + Dropout Kernel",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "The Triton Fused Add + Softmax + Dropout Kernel simulates OpenAI Triton's C-like GPU programming paradigm for **Kernel Fusion**. In standard PyTorch, executing residual addition (`y = x + res`), Softmax (`p = softmax(y)`), and Inverted Dropout (`out = dropout(p)`) requires **3 separate GPU kernel launches** and **2 intermediate DRAM roundtrips**. Triton fuses all 3 operations into a single C-like kernel where intermediate tensors reside entirely in fast **GPU SRAM registers**, achieving **3x higher memory bandwidth efficiency**.\n\n### Why It Exists\nElementwise and reduction kernels are memory-bandwidth bound ($I \\le 2 \\text{ FLOPs/B}$). Launching separate kernels forces the GPU to write intermediate matrices to DRAM ($3.35 \\text{ TB/s}$) only to immediately read them back into SRAM. Fusing operators in Triton eliminates DRAM intermediate writes completely.\n\n### Mathematical Formulation\nFor input tensor row $x$, residual vector $r$, dropout probability $p$, and Philox PRNG seed $S$:\n\n$$1. \\quad y_c = x_c + r_c \\quad (\\text{SRAM Fused Residual Addition})$$\n\n$$2. \\quad m = \\max_c(y_c), \\quad p_c = \\frac{e^{y_c - m}}{\\sum_k e^{y_k - m}} \\quad (\\text{SRAM Online Softmax})$$\n\n$$3. \\quad k_c = \\mathbb{I}(\\text{Philox}(r, c, S) \\ge p) \\in \\{0, 1\\} \\quad (\\text{Dropout Keep Mask})$$\n\n$$4. \\quad \\text{Out}_c = p_c \\cdot k_c \\cdot \\frac{1}{1 - p} \\quad (\\text{Inverted Dropout Scaling})$$\n\n### Step-by-Step Intuition\n1. **Thread Block Loading**: Load row $r$ of $x$ and $r$ of $residual$ directly into SRAM registers.\n2. **Fused Elementwise Add**: Compute $y = x + residual$ in GPU register file without DRAM write.\n3. **SRAM Online Softmax**: Compute row max $m = \\max(y)$, exponentiate $e^{y - m}$, sum, and normalize probabilities $p_c$.\n4. **Philox PRNG & Inverted Dropout**: Generate deterministic pseudo-random number $\\text{rand} \\in [0, 1)$ using Philox 4x32. Multiply by scale $\\frac{1}{1 - p}$ for kept elements.\n5. **Single DRAM Store**: Write final fused output row $\\text{Out}$ directly into global DRAM memory.\n\n### Key Trade-Offs & Hardware Execution\n- **Inverted Dropout Scaling ($\\frac{1}{1 - p}$)**: Scaling by $\\frac{1}{1 - p}$ during training ensures expected activation magnitude equals 1.0, eliminating scaling overhead during evaluation (inference).\n- **Compilation in OpenAI Triton**: `@triton.jit` compiles Python-like loop code directly into high-performance C++/PTX CUDA assembly.",
    constraints: [
      "1 <= rows <= 128",
      "1 <= cols <= 128",
      "0.0 <= dropout_p < 1.0",
    ],
    examples: [
      {
        kind: "basic",
        title: "3x3 Fused Add + Softmax + Dropout Execution (p=0.1)",
        inputDisplay: "3x3 Input Matrix & Residual Matrix, dropout p = 0.1",
        outputDisplay: "Fused Output Matrix & Boolean Dropout Mask",
        input: DEFAULT_TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_INPUT,
        output: "(output_matrix, boolean_mask_matrix)",
        explanation: "Fuses Add, Softmax, and Inverted Dropout in 1 SRAM kernel call. Eliminates DRAM intermediate materialization.",
      },
    ],
    code: TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_CODE,
    timeComplexity: {
      best: "O(R \\cdot C)",
      average: "O(R \\cdot C)",
      worst: "O(R \\cdot C)",
    },
    spaceComplexity: "O(R \\cdot C)",
    complexityAnalysis: {
      time: "Linear in matrix size $O(R \\cdot C)$, taking 1 fused pass over $R \\cdot C$ elements.",
      space: "Requires $O(R \\cdot C)$ memory space for output matrix and dropout mask array.",
    },
    topicGuide: {
      overview:
        "The Triton Fused Add + Softmax + Dropout Kernel fuses 3 neural network operators into a single GPU SRAM kernel.",
      sections: [
        {
          heading: "Core Concept & OpenAI Triton Kernel Fusion",
          body: "Triton @triton.jit fuses elementwise Add, Softmax reduction, and Inverted Dropout into a single C-like GPU kernel, keeping intermediate data in fast SRAM registers.",
        },
        {
          heading: "Eliminating DRAM Intermediate Materialization",
          body: "Standard PyTorch executes 3 separate kernel launches and 2 DRAM roundtrips. Triton kernel fusion eliminates DRAM roundtrips, boosting memory bandwidth efficiency by 3x.",
        },
        {
          heading: "Inverted Dropout Scaling (1 / (1 - p))",
          body: "Inverted dropout scales kept activations by 1 / (1 - p) during training, maintaining constant expected activation energy and zero-overhead inference.",
        },
        {
          heading: "GPU Philox Pseudo-Random Generator",
          body: "Triton uses the Philox PRNG counter-based generator to produce deterministic pseudo-random numbers per lane in single-cycle ALU math.",
        },
      ],
      keyTerms: [
        {
          term: "Kernel Fusion",
          definition: "Combining multiple neural network layers into a single GPU kernel to eliminate DRAM reads/writes.",
        },
        {
          term: "OpenAI Triton",
          definition: "Python-based C-like GPU programming language and compiler for high-performance deep learning kernels.",
        },
        {
          term: "Inverted Dropout",
          definition: "Scaling kept activations by 1 / (1 - p) during training so inference requires zero modifications.",
        },
        {
          term: "Philox PRNG",
          definition: "High-speed counter-based pseudo-random number generator designed for GPU parallel threads.",
        },
      ],
    },
    trivia: TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_INPUT,
    generateSteps: generateTRITONFUSEDADDSOFTMAXDROPOUTKERNELSteps,
  };
