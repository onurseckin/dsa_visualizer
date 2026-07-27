import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tritonFusedAddSoftmaxDropoutKernelInput {
  x_matrix?: number[][];
  residual_matrix?: number[][];
  dropout_p?: number;
  seed?: number;
  data?: number[];
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

  const createMatrixSnapshot = (
    activeRow?: number,
    activeCol?: number,
  ): MatrixCellItem[][] => {
    const grid: MatrixCellItem[][] = [];
    for (let r = 0; r < rows; r++) {
      const rowItems: MatrixCellItem[] = [];
      for (let c = 0; c < cols; c++) {
        const val = output[r] && output[r][c] !== undefined ? output[r][c] : xMat[r][c] + resMat[r][c];
        const isKept = masks[r] && masks[r][c] !== undefined ? masks[r][c] === 1.0 : true;

        let state: MatrixCellItem["state"] = "default";
        if (activeRow === r && activeCol === c) {
          state = "active";
        } else if (activeRow === r) {
          state = "compared";
        } else if (output[r] !== undefined) {
          state = isKept ? "sorted" : "inactive";
        }

        rowItems.push({
          row: r,
          col: c,
          value: Number(val.toFixed(3)),
          label: output[r] !== undefined ? `O[${r}][${c}]=${val.toFixed(3)}` : `Y[${r}][${c}]=${val.toFixed(2)}`,
          state,
        });
      }
      grid.push(rowItems);
    }
    return grid;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow?: number,
    activeCol?: number,
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        matrix: createMatrixSnapshot(activeRow, activeCol),
      },
      auxiliaryState: {
        customState: customState ?? {
          dropout_p: String(dropoutP),
          seed: String(seed),
          scale: scale.toFixed(3),
          fusion_status: "1 DRAM Pass (Add + Softmax + Dropout)",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Triton Fused Add + Softmax + Dropout Kernel",
    `Setting up single-pass SRAM fusion kernel: matrix [${rows}, ${cols}], dropout_p=${dropoutP}, seed=${seed}.`,
    { rows, cols, dropout_p: dropoutP, seed },
  );

  addStep(
    5,
    `Read rows = len(x_matrix) = ${rows}`,
    `Storing row dimension ${rows}.`,
    { rows },
  );

  addStep(
    6,
    `Read cols = len(x_matrix[0]) = ${cols}`,
    `Storing column dimension ${cols}.`,
    { cols },
  );

  addStep(
    10,
    `Calculate inverted dropout scale = 1.0 / (1.0 - ${dropoutP}) = ${scale.toFixed(3)}`,
    `Scale factor to maintain expected activation values during training dropout.`,
    { scale: Number(scale.toFixed(3)) },
  );

  for (let r = 0; r < rows; r++) {
    addStep(
      12,
      `Outer Loop r = ${r}/${rows - 1}: Process row ${r}`,
      `Executing fused Add, Softmax, and Dropout for matrix row ${r}.`,
      { r },
      r,
    );

    const rowY: number[] = [];
    for (let c = 0; c < cols; c++) {
      rowY.push(xMat[r][c] + resMat[r][c]);
    }

    addStep(
      13,
      `Execute Fused Add: row_y = X[${r}] + Residual[${r}] = [${rowY.map((v) => v.toFixed(2)).join(", ")}]`,
      `Elementwise sum X + Residual kept in fast L1 SRAM registers without writing to DRAM.`,
      { r, row_y: JSON.stringify(rowY.map((v) => Number(v.toFixed(2)))) },
      r,
    );

    const rowMax = Math.max(...rowY);
    addStep(
      15,
      `Compute row maximum row_max = max(row_y) = ${rowMax.toFixed(2)}`,
      `Row maximum subtracted from logits for FP16 stability in exponentiation.`,
      { r, row_max: Number(rowMax.toFixed(2)) },
      r,
    );

    const expVals = rowY.map((v) => Math.exp(v - rowMax));
    addStep(
      16,
      `Compute exp_vals = exp(row_y - ${rowMax.toFixed(2)}) = [${expVals.map((v) => v.toFixed(3)).join(", ")}]`,
      `Unnormalized exponent values calculated in SRAM registers.`,
      { r, exp_vals: JSON.stringify(expVals.map((v) => Number(v.toFixed(3)))) },
      r,
    );

    const sumExp = expVals.reduce((a, b) => a + b, 0);
    addStep(
      17,
      `Compute sum_exp = sum(exp_vals) = ${sumExp.toFixed(3)}`,
      `Softmax denominator sum-exp computed for row ${r}.`,
      { r, sum_exp: Number(sumExp.toFixed(3)) },
      r,
    );

    const softmaxProbs = expVals.map((ev) => ev / sumExp);
    addStep(
      18,
      `Compute softmax_probs = exp_vals / ${sumExp.toFixed(3)} = [${softmaxProbs.map((p) => p.toFixed(3)).join(", ")}]`,
      `Normalized row Softmax probability distribution.`,
      { r, softmax_probs: JSON.stringify(softmaxProbs.map((p) => Number(p.toFixed(3)))) },
      r,
    );

    const outRow: number[] = [];
    const maskRow: number[] = [];

    for (let c = 0; c < cols; c++) {
      addStep(
        22,
        `Inner Loop c = ${c}/${cols - 1}: Apply PRNG Dropout for cell (${r}, ${c})`,
        `Generating PRNG dropout bitmask for cell (${r}, ${c}).`,
        { r, c },
        r,
        c,
      );

      const pseudoRand = ((r * 13 + c * 37 + seed * 97) % 100) / 100.0;
      addStep(
        23,
        `Generate pseudo_rand = ${pseudoRand.toFixed(2)} (seed=${seed})`,
        `Philox pseudo-random generator evaluated in registers.`,
        { r, c, pseudo_rand: Number(pseudoRand.toFixed(2)) },
        r,
        c,
      );

      const keep = pseudoRand >= dropoutP ? 1.0 : 0.0;
      addStep(
        24,
        `Evaluate keep predicate: ${pseudoRand.toFixed(2)} >= ${dropoutP} -> keep = ${keep}`,
        `Dropout predicate evaluated: ${keep === 1.0 ? "KEEP element" : "DROPOUT element (zeroed)"}.`,
        { r, c, keep },
        r,
        c,
      );

      const dropoutVal = Number((softmaxProbs[c] * keep * scale).toFixed(4));
      addStep(
        25,
        `Compute dropout_val = ${softmaxProbs[c].toFixed(3)} * ${keep} * ${scale.toFixed(3)} = ${dropoutVal.toFixed(4)}`,
        `Final scaled output value calculated in SRAM registers.`,
        { r, c, prob: Number(softmaxProbs[c].toFixed(3)), keep, scale: Number(scale.toFixed(3)), dropout_val: dropoutVal },
        r,
        c,
      );

      outRow.push(dropoutVal);
      addStep(
        26,
        `Append ${dropoutVal.toFixed(4)} to out_row`,
        `Output value stored in row buffer.`,
        { r, c, val: dropoutVal },
        r,
        c,
      );

      maskRow.push(keep);
      addStep(
        27,
        `Append ${keep} to mask_row`,
        `Dropout mask bit stored in mask row buffer.`,
        { r, c, mask: keep },
        r,
        c,
      );
    }

    output.push(outRow);
    addStep(
      29,
      `Append out_row to output matrix: row ${r} complete`,
      `Row ${r} output vector stored.`,
      { r },
      r,
    );

    masks.push(maskRow);
    addStep(
      30,
      `Append mask_row to masks matrix: row ${r} complete`,
      `Row ${r} dropout mask vector stored.`,
      { r },
      r,
    );
  }

  addStep(
    32,
    "Return (output, masks)",
    `Triton Fused Add + Softmax + Dropout execution complete. Processed ${rows}x${cols} matrix in 1 single DRAM memory pass with zero HBM intermediate roundtrips.`,
    { completed: true, rows, cols },
  );

  return steps;
};

export const TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_TRIVIA: TriviaMeta = {
  skipLines: [4, 9, 11, 14, 19, 28, 31],
  distractors: [
    "row_y = [x_matrix[r][c] * residual_matrix[r][c]]",
    "softmax_probs = [ev / row_max for ev in exp_vals]",
    "scale = 1.0 - dropout_p",
    "dropout_val = softmax_probs[c] / keep",
  ],
  hints: [
    { line: 13, hint: "Perform fused residual addition in SRAM without writing to global memory." },
    { line: 15, hint: "Calculates numerically stable row max and exponent sum." },
    { line: 25, hint: "Applies pseudo-random seed mask and scale factor 1/(1-p) for inverted dropout." },
  ],
  lineExplanations: {
    1: "Defines triton_fused_add_softmax_dropout signature with input tensor, residual tensor, dropout probability, and seed.",
    2: "Docstring explaining fused add, online softmax, and inverted dropout GPU kernel.",
    3: "Imports math module for exponentiation.",
    4: "Blank line preceding matrix dimension extraction.",
    5: "Retrieves row dimension rows from input matrix X.",
    6: "Retrieves column dimension cols from input matrix X.",
    7: "Initializes output matrix list.",
    8: "Initializes dropout mask matrix list.",
    9: "Blank line preceding inverted dropout scale computation.",
    10: "Calculates inverted dropout scale factor 1 / (1 - dropout_p).",
    11: "Blank line preceding main row loop.",
    12: "Outer loop over row index r from 0 to rows - 1.",
    13: "Executes fused residual addition row_y = X[r] + Residual[r] in fast SRAM registers.",
    14: "Blank line preceding online Softmax calculation.",
    15: "Finds row maximum score row_max for FP16 stability.",
    16: "Calculates unnormalized exponents exp_vals = exp(row_y - row_max).",
    17: "Calculates sum-exp denominator sum_exp = sum(exp_vals).",
    18: "Normalizes Softmax probabilities softmax_probs = exp_vals / sum_exp.",
    19: "Blank line preceding PRNG dropout loop.",
    20: "Initializes out_row container for row outputs.",
    21: "Initializes mask_row container for row dropout masks.",
    22: "Inner loop over column index c from 0 to cols - 1.",
    23: "Generates Philox pseudo-random scalar in registers from row, col, and seed.",
    24: "Determines dropout keep predicate keep = 1.0 if rand >= p else 0.0.",
    25: "Applies inverted dropout scaling: dropout_val = prob * keep * scale.",
    26: "Appends rounded dropout value to out_row.",
    27: "Appends keep bit to mask_row.",
    28: "Blank line preceding row append.",
    29: "Appends out_row to output matrix.",
    30: "Appends mask_row to masks matrix.",
    31: "Blank line preceding return statement.",
    32: "Returns tuple of (output, masks) computed in 1 single DRAM memory pass.",
  },
};

export const tritonFusedAddSoftmaxDropoutKernel: AlgorithmDefinition<tritonFusedAddSoftmaxDropoutKernelInput> = {
  id: "triton-fused-add-softmax-dropout-kernel",
  title: "Triton Fused Add + Softmax + Dropout Kernel",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_hardware_kernels",
  description: `Master GPU Operator Fusion in OpenAI Triton: fuse Elementwise Residual Add, Online Softmax Normalization, and Seed-based Inverted Dropout into a single GPU kernel launch.

### Why It Exists & What It Solves
In deep learning training pipelines (e.g., PyTorch Transformer blocks, FlashAttention), non-fused operation sequences execute as separate GPU kernel launches:
1. **Kernel 1**: Elementwise Residual Add ($Y = X + \\text{Residual}$).
2. **Kernel 2**: Softmax Normalization ($P = \\text{Softmax}(Y)$).
3. **Kernel 3**: Inverted Dropout ($O = P \\cdot M / (1 - p)$).

Each un-fused kernel launch must read inputs from GPU High Bandwidth Memory (HBM DRAM) and write intermediate results back to HBM, incurring up to **6 HBM DRAM roundtrips**. Because DRAM bandwidth is $10\\times$ slower than on-chip SRAM, execution is bottlenecked by the DRAM memory wall.

**Triton Fused Add + Softmax + Dropout Kernel** fuses all 3 operations into a **single GPU block kernel**:
- Input matrices $X$ and $\\text{Residual}$ are loaded once into high-speed On-Chip Shared Memory (SRAM) / SIMD registers.
- Addition, online max reduction, log-sum-exp exponentiation, and Philox PRNG dropout masking are computed entirely in SRAM registers.
- The final result is written back to HBM in a **single memory pass**, delivering a 3x DRAM bandwidth speedup.

### Step-by-Step Intuition
1. **Fused Addition in SRAM**: For row $r$, compute $Y_{r,c} = X_{r,c} + \\text{Residual}_{r,c}$ directly in warp registers.
2. **Online Softmax Reduction**:
   - Find row maximum $m_r = \\max_c Y_{r,c}$.
   - Compute exponents $e_{r,c} = \\exp(Y_{r,c} - m_r)$ and sum $\\ell_r = \\sum_c e_{r,c}$.
   - Normalize probabilities $P_{r,c} = e_{r,c} / \\ell_r$.
3. **Fused PRNG Inverted Dropout**:
   - Generate Philox pseudo-random scalar $\\text{rand} \\in [0, 1)$ from row, col, and seed.
   - Determine keep predicate $\\text{keep} = 1.0$ if $\\text{rand} \\ge p$ else $0.0$.
   - Scale value: $O_{r,c} = P_{r,c} \\cdot \\text{keep} / (1 - p)$.
4. **Single Pass Writeback**: Write $O_{r,c}$ and mask bits to HBM.

### Input Parameters
- \`x_matrix\`: 2D input tensor $X$.
- \`residual_matrix\`: 2D residual tensor.
- \`dropout_p\`: Dropout probability $p$ (e.g. 0.1).
- \`seed\`: PRNG seed for deterministic mask generation.

### Output
- Returns tuple of \`(fused_output_matrix, dropout_mask_matrix)\` computed in 1 DRAM memory pass.

### Trade-offs & Complexity
- **Time Complexity**: $O(R \\cdot C)$ operations inside SRAM.
- **Space Complexity**: $O(R \\cdot C)$ DRAM output space with zero intermediate DRAM allocation.`,
  constraints: [
    "0.0 <= dropout_p < 1.0",
    "x_matrix and residual_matrix must have matching dimensions",
  ],
  examples: [
    {
      kind: "basic",
      title: "Standard 3x3 Matrix Fusion",
      inputDisplay: "x_matrix [3,3], residual [3,3], p = 0.1",
      outputDisplay: "Single-pass SRAM fused result matrix",
      input: {
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
      },
      output: "Fused SRAM computed output matrix",
      explanation: "Fuses residual addition, online softmax, and inverted dropout into 1 DRAM pass.",
    },
    {
      kind: "complex",
      title: "High Dropout Probability Test",
      inputDisplay: "dropout_p = 0.5, seed = 123",
      outputDisplay: "Dropout scaled output (2.0x scale multiplier)",
      input: {
        x_matrix: [[2.0, 4.0]],
        residual_matrix: [[0.0, 0.0]],
        dropout_p: 0.5,
        seed: 123,
      },
      output: "Scaled dropout matrix",
      explanation: "Applies inverted dropout scaling factor 1/(1-0.5) = 2.0 to kept elements.",
    },
    {
      kind: "negative",
      title: "Zero Dropout (Pure Fused Softmax)",
      inputDisplay: "dropout_p = 0.0",
      outputDisplay: "Pure softmax probabilities sum to 1.0 per row",
      input: {
        x_matrix: [[1.0, 1.0]],
        residual_matrix: [[0.0, 0.0]],
        dropout_p: 0.0,
        seed: 42,
      },
      output: "Probabilities [[0.5, 0.5]]",
      explanation: "Zero dropout retains 100% of softmax probability weights.",
    },
  ],
  code: TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_CODE,
  timeComplexity: { best: "O(R * C)", average: "O(R * C)", worst: "O(R * C)" },
  spaceComplexity: "O(R * C)",
  complexityAnalysis: {
    time: "Computes fused operations for an R x C tensor in O(R * C) arithmetic time inside SRAM registers.",
    space: "Requires O(R * C) DRAM space for final output, with zero intermediate DRAM allocation.",
  },
  topicGuide: {
    overview:
      "Triton Fused Add + Softmax + Dropout Kernel is a cornerstone optimization in modern ML compilers (Triton, PyTorch Inductor, FlashAttention). By fusing multiple memory-bound elementwise operations into a single kernel launch, it bypasses the GPU memory bandwidth ceiling.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "For input element $x_{r,c}$ and residual $r_{r,c}$, the fused value is $y_{r,c} = x_{r,c} + r_{r,c}$. The online softmax computes row max $m_r = \\max_c y_{r,c}$ and log-sum-exp $S_r = \\sum_c \\exp(y_{r,c} - m_r)$. Normalized probability is $p_{r,c} = \\exp(y_{r,c} - m_r) / S_r$. Inverted dropout applies mask $M_{r,c} \\in \\{0, 1\\}$ and scale factor $\\gamma = 1 / (1 - p_{\\text{drop}})$, yielding final output $o_{r,c} = p_{r,c} \\cdot M_{r,c} \\cdot \\gamma$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Un-fused kernel sequences issue 3 separate GPU grid dispatches, requiring 3 DRAM loads and 3 DRAM stores (total 6 HBM traffic passes). On NVIDIA H100 (3.3 TB/s DRAM vs ~33 TB/s SRAM), kernel fusion reduces DRAM transactions to 1 load and 1 store, improving operational throughput by up to 300%.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "In Triton Python (`@triton.jit`), fused kernels use `tl.load` to fetch contiguous vector blocks into SRAM, `tl.maximum` and `tl.sum` for warp reductions, and Philox PRNG generator (`tl.rand`) to compute dropout masks on-the-fly without allocating memory for mask buffers.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Subtracting row maximum $m_r$ prior to exponentiation is strictly required to prevent floating-point FP16 overflow ($> 65504$). Zero dropout ($p=0.0$) scales by 1.0, while boundary masking protects padded sequence tokens from influencing log-sum-exp totals.",
      },
    ],
    keyTerms: [
      {
        term: "Kernel Fusion",
        definition:
          "Combining multiple sequential mathematical operations into a single GPU kernel launch to keep intermediate data in SRAM/registers.",
      },
      {
        term: "Inverted Dropout",
        definition:
          "Scaling retained elements during forward pass by 1/(1-p) so that inference evaluation requires zero scaling.",
      },
      {
        term: "Philox PRNG",
        definition:
          "A fast counter-based pseudo-random number generator executed directly in GPU registers for parallel dropout masking.",
      },
      {
        term: "Log-Sum-Exp (LSE)",
        definition:
          "Numerically stable formulation of softmax denominator sum(exp(x_i - max(x))) preventing FP16 underflow/overflow.",
      },
    ],
  },
  trivia: TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_INPUT,
  generateSteps: generateTRITONFUSEDADDSOFTMAXDROPOUTKERNELSteps,
};
