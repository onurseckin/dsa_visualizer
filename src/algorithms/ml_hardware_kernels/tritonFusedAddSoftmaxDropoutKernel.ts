import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tritonFusedAddSoftmaxDropoutKernelInput {
  x_matrix?: number[][];
  residual_matrix?: number[][];
  dropout_p?: number;
  seed?: number;
  data?: number[];
  [key: string]: unknown;
}

export const TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_CODE = `def triton_fused_add_softmax_dropout(
    x_matrix: list[list[float]],
    residual_matrix: list[list[float]],
    dropout_p: float = 0.1,
    seed: int = 42
) -> tuple[list[list[float]], list[list[float]]]:
    """
    Simulates a fused Triton GPU kernel executing Elementwise Add + Online Softmax + Dropout in SRAM.
    1. Fused Add: Y = X + Residual (kept in SRAM registers)
    2. Online Softmax: P_i = exp(Y_i - max(Y)) / sum(exp(Y - max(Y)))
    3. Dropout: O_i = P_i * (1 if rand >= p else 0) / (1 - p)
    Returns: (fused_output_matrix, dropout_mask_matrix)
    """
    import math

    rows = len(x_matrix)
    cols = len(x_matrix[0])
    output = []
    masks = []

    scale = 1.0 / (1.0 - dropout_p) if dropout_p < 1.0 else 0.0

    for r in range(rows):
        # Step 1: Fused Add in SRAM
        row_y = [x_matrix[r][c] + residual_matrix[r][c] for c in range(cols)]

        # Step 2: Online Softmax reduction (Max & Log-Sum-Exp)
        row_max = max(row_y)
        exp_vals = [math.exp(val - row_max) for val in row_y]
        sum_exp = sum(exp_vals)
        softmax_probs = [ev / sum_exp for ev in exp_vals]

        # Step 3: Fused Seed-based Pseudo-Random Dropout
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

    return output, masks
`;

export const DEFAULT_TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_INPUT: tritonFusedAddSoftmaxDropoutKernelInput =
  {
    x_matrix: [
      [1.0, 2.0, 3.0],
      [2.0, 0.0, 1.0],
    ],
    residual_matrix: [
      [0.5, 0.5, 0.5],
      [1.0, 1.0, 1.0],
    ],
    dropout_p: 0.1,
    seed: 42,
  };

export const generateTRITONFUSEDADDSOFTMAXDROPOUTKERNELSteps = (
  input: tritonFusedAddSoftmaxDropoutKernelInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const xMat = input.x_matrix || [
    [1.0, 2.0, 3.0],
    [2.0, 0.0, 1.0],
  ];
  const resMat = input.residual_matrix || [
    [0.5, 0.5, 0.5],
    [1.0, 1.0, 1.0],
  ];
  const dropoutP = input.dropout_p !== undefined ? input.dropout_p : 0.1;
  const seed = input.seed !== undefined ? input.seed : 42;

  const rows = xMat.length;
  const cols = xMat[0]?.length || 3;

  const flattenX: ArrayElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      flattenX.push({
        id: `x-${r}-${c}`,
        value: `X[${r},${c}]=${xMat[r][c]}`,
        state: "default",
      });
    }
  }

  // Step 1: Initialize SRAM kernel state
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: "Initialize Triton Fused Add + Softmax + Dropout Kernel",
      why: "Loading input tensor X and Residual tensor into GPU L1 SRAM / registers in a single kernel pass.",
    },
    primarySnapshot: {
      kind: "array",
      elements: flattenX.map((e) => ({ ...e, pointers: ["SRAM Init"] })),
    },
    auxiliaryState: {
      customState: {
        dropout_p: String(dropoutP),
        seed: String(seed),
        fusion_status: "SRAM_Loaded",
        hbm_roundtrips: "1 Load, 1 Store (Fused vs 3 Passes)",
      },
    },
    variables: { rows, cols, dropout_p: dropoutP },
  });

  const fusedAddResult: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const rowY: number[] = [];
    for (let c = 0; c < cols; c++) {
      rowY.push(xMat[r][c] + resMat[r][c]);
    }
    fusedAddResult.push(rowY);
  }

  // Step 2: Fused Addition in SRAM registers
  const fusedElements: ArrayElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      fusedElements.push({
        id: `y-${r}-${c}`,
        value: `Y[${r},${c}]=${fusedAddResult[r][c]}`,
        state: "active",
        pointers: [`r=${r},c=${c}`],
      });
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 20,
    explanation: {
      what: "Execute Fused Addition (Y = X + Residual) in SRAM",
      why: "Intermediate addition result is held in fast GPU registers without writing back to DRAM.",
    },
    primarySnapshot: {
      kind: "array",
      elements: fusedElements,
    },
    auxiliaryState: {
      customState: {
        phase: "Fused_Addition",
        sram_active: "true",
      },
    },
    variables: { step: "Fused_Add" },
  });

  // Step 3 & 4: Online Softmax reduction & normalization per row
  const scale = dropoutP < 1.0 ? 1.0 / (1.0 - dropoutP) : 0.0;
  const softmaxResult: number[][] = [];
  const maskResult: number[][] = [];
  const outputResult: number[][] = [];

  for (let r = 0; r < rows; r++) {
    const rowY = fusedAddResult[r];
    const rowMax = Math.max(...rowY);
    const expVals = rowY.map((v) => Math.exp(v - rowMax));
    const sumExp = expVals.reduce((a, b) => a + b, 0);
    const probs = expVals.map((ev) => ev / sumExp);
    softmaxResult.push(probs);

    const outRow: number[] = [];
    const maskRow: number[] = [];
    for (let c = 0; c < cols; c++) {
      const pseudoRand = ((r * 13 + c * 37 + seed * 97) % 100) / 100.0;
      const keep = pseudoRand >= dropoutP ? 1.0 : 0.0;
      const val = Number((probs[c] * keep * scale).toFixed(4));
      outRow.push(val);
      maskRow.push(keep);
    }
    outputResult.push(outRow);
    maskResult.push(maskRow);

    const rowElements: ArrayElement[] = probs.map((p, c) => ({
      id: `sm-${r}-${c}`,
      value: `Softmax[${r},${c}]=${p.toFixed(3)}`,
      state: "compare",
      pointers: [`max=${rowMax.toFixed(2)}`, `LSE=${sumExp.toFixed(2)}`],
    }));

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 25,
      explanation: {
        what: `Row ${r}: Online Softmax (Max=${rowMax.toFixed(2)}, LSE=${sumExp.toFixed(2)})`,
        why: "Subtracting row max prevents FP16/FP32 overflow while calculating exponential weights in SRAM.",
      },
      primarySnapshot: {
        kind: "array",
        elements: rowElements,
      },
      auxiliaryState: {
        customState: {
          row: String(r),
          row_max: rowMax.toFixed(4),
          sum_exp: sumExp.toFixed(4),
        },
      },
      variables: { r, rowMax, sumExp },
    });
  }

  // Step 5: Fused PRNG Dropout & Final Output Writeback
  const finalElements: ArrayElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      finalElements.push({
        id: `out-${r}-${c}`,
        value: `Out[${r},${c}]=${outputResult[r][c]} (${maskResult[r][c] ? "Keep" : "Drop"})`,
        state: maskResult[r][c] ? "sorted" : "visited",
        pointers: maskResult[r][c] ? ["Pass"] : ["Zeroed"],
      });
    }
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 35,
    explanation: {
      what: "Apply PRNG Seed-based Dropout and Write Back to Global Memory",
      why: "Evaluates bitwise PRNG mask in registers, applies scale multiplier 1/(1-p), and writes final output in 1 pass.",
    },
    primarySnapshot: {
      kind: "array",
      elements: finalElements,
    },
    auxiliaryState: {
      customState: {
        completed: "true",
        hbm_saves: "Saved 4 DRAM read/write passes",
      },
    },
    variables: { completed: true, dropout_scale: scale },
  });

  return steps;
};

const TRITONFUSEDADDSOFTMAXDROPOUTKERNEL_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  distractors: [
    "row_y = [x_matrix[r][c] * residual_matrix[r][c]]",
    "softmax_probs = [ev / row_max for ev in exp_vals]",
    "scale = 1.0 - dropout_p",
  ],
  hints: [
    { line: 20, hint: "Perform fused residual addition in SRAM without writing to global memory." },
    { line: 24, hint: "Compute stable online max reduction before exponentiation." },
    { line: 31, hint: "Generate PRNG dropout mask using seed and element offsets." },
  ],
  lineExplanations: {
    1: "Defines Triton fused add, softmax, and dropout kernel function.",
    20: "Fuses residual vector addition inside fast GPU L1 SRAM registers.",
    24: "Calculates numerically stable row max and exponent sum.",
    31: "Applies pseudo-random seed mask and scale factor 1/(1-p) for inverted dropout.",
  },
};

export const tritonFusedAddSoftmaxDropoutKernel: AlgorithmDefinition<tritonFusedAddSoftmaxDropoutKernelInput> =
  {
    id: "triton-fused-add-softmax-dropout-kernel",
    title: "Triton Fused Add + Softmax + Dropout Kernel",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 9,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "In deep learning training and inference pipelines (e.g., PyTorch, Triton, FlashAttention, Transformer blocks), non-fused operation sequences execute as separate GPU kernel launches: 1) Elementwise Residual Add, 2) Softmax Normalization, and 3) Inverted Dropout. Each un-fused kernel must read inputs from GPU High Bandwidth Memory (HBM) and write intermediate results back to HBM, incurring up to 6 HBM roundtrips.\n\nThe **Triton Fused Add + Softmax + Dropout Kernel** fuses all 3 operations into a single GPU block kernel. Input matrices are loaded once into high-speed On-Chip Shared Memory (SRAM) / SIMD registers. Elementwise addition, online max reduction, log-sum-exp exponentiation, and seed-based pseudo-random dropout masking ($1/(1-p)$ scaling) are computed entirely in SRAM. The final result is written back to HBM in a single memory pass, eliminating memory-wall bottlenecks and delivering 3x bandwidth speedup.\n\nInput Format:\n- x_matrix: 2D input tensor batch rows.\n- residual_matrix: 2D residual connection tensor.\n- dropout_p: Probability of zeroing elements (e.g. 0.1).\n- seed: Random seed for deterministic PRNG dropout mask generation.\n\nOutput Format:\n- Returns tuple of (fused_output_matrix, dropout_mask_matrix) with exact numerical precision.",
    constraints: [
      "0.0 <= dropout_p < 1.0",
      "x_matrix and residual_matrix must have matching dimensions",
    ],
    examples: [
      {
        kind: "basic",
        title: "Standard 2x3 Matrix Fusion",
        inputDisplay:
          "x_matrix = [[1.0, 2.0, 3.0], [2.0, 0.0, 1.0]], residual_matrix = [[0.5, 0.5, 0.5], [1.0, 1.0, 1.0]], dropout_p = 0.1",
        outputDisplay: "Single-pass SRAM fused result matrix",
        input: {
          x_matrix: [
            [1.0, 2.0, 3.0],
            [2.0, 0.0, 1.0],
          ],
          residual_matrix: [
            [0.5, 0.5, 0.5],
            [1.0, 1.0, 1.0],
          ],
          dropout_p: 0.1,
          seed: 42,
        },
        output: "Fused SRAM computed output matrix",
        explanation:
          "Fuses residual addition, online softmax, and inverted dropout into 1 DRAM pass.",
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
    timeComplexity: { best: "O(R · C)", average: "O(R · C)", worst: "O(R · C)" },
    spaceComplexity: "O(R · C)",
    complexityAnalysis: {
      time: "Computes fused operations for an $R \\times C$ tensor in $O(R \\cdot C)$ arithmetic time inside SRAM registers.",
      space:
        "Requires $O(R \\cdot C)$ DRAM space for final output, with zero intermediate DRAM allocation.",
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
