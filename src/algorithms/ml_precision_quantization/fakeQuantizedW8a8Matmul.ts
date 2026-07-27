import type { AlgorithmDefinition, AlgorithmStep, BitItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fakeQuantizedW8a8MatmulInput {
  matrixA?: number[][];
  matrixB?: number[][];
  scaleA?: number;
  scaleB?: number;
  values?: number[];
  scale?: number;
}

export const FAKEQUANTIZEDW8A8MATMUL_CODE = `def fake_quantized_w8a8_matmul(matrix_a, matrix_b, scale_a=0.1, scale_b=0.1):
    m, k_dim = len(matrix_a), len(matrix_a[0])
    n = len(matrix_b[0])
    q_a = [[max(-128, min(127, int(round(matrix_a[i][j] / scale_a)))) for j in range(k_dim)] for i in range(m)]
    q_b = [[max(-128, min(127, int(round(matrix_b[i][j] / scale_b)))) for j in range(n)] for i in range(k_dim)]
    output = [[0.0] * n for _ in range(m)]
    for i in range(m):
        for j in range(n):
            acc = sum(q_a[i][k] * q_b[k][j] for k in range(k_dim))
            output[i][j] = acc * (scale_a * scale_b)
    return output`;

export const DEFAULT_FAKEQUANTIZEDW8A8MATMUL_INPUT: fakeQuantizedW8a8MatmulInput = {
  matrixA: [
    [1.2, -0.5],
    [0.8, 2.0],
  ],
  matrixB: [
    [0.5, 1.0],
    [-1.5, 0.4],
  ],
  scaleA: 0.1,
  scaleB: 0.1,
};

const toBitItems = (val: number): BitItem[] => {
  const clamped = Math.max(-128, Math.min(127, Math.round(val)));
  const uval = clamped < 0 ? (clamped + 256) & 0xff : clamped & 0xff;
  const bitStr = uval.toString(2).padStart(8, "0");
  return bitStr.split("").map((b, i) => ({
    index: 7 - i,
    label: i === 0 ? "Sign" : `b${7 - i}`,
    value: b,
    state: i === 0 ? "sign" : "quantized",
  }));
};

export const generateFakeQuantizedW8a8MatmulSteps = (
  input: fakeQuantizedW8a8MatmulInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const matA = input?.matrixA || [
    [1.2, -0.5],
    [0.8, 2.0],
  ];
  const matB = input?.matrixB || [
    [0.5, 1.0],
    [-1.5, 0.4],
  ];
  const scaleA = input?.scaleA ?? input?.scale ?? 0.1;
  const scaleB = input?.scaleB ?? input?.scale ?? 0.1;

  const M = matA.length;
  const K = matA[0].length;
  const N = matB[0].length;

  const qA: number[][] = matA.map((row) =>
    row.map((val) => Math.max(-128, Math.min(127, Math.round(val / scaleA)))),
  );
  const qB: number[][] = matB.map((row) =>
    row.map((val) => Math.max(-128, Math.min(127, Math.round(val / scaleB)))),
  );
  const output: number[][] = Array.from({ length: M }, () => new Array(N).fill(0.0));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currValue?: number,
    currQuantized?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "quantization",
        originalValue: currValue ?? matA[0][0],
        quantizedValue: currQuantized ?? 0,
        scale: Number((scaleA * scaleB).toFixed(4)),
        zeroPoint: 0,
        bits: toBitItems(currQuantized ?? 0),
        title: "Fake Quantized W8A8 Matmul (INT8 GEMM)",
      },
      auxiliaryState: {
        customState: {
          dimensions: `${M}x${K} @ ${K}x${N}`,
          scaleA: String(scaleA),
          scaleB: String(scaleB),
        },
      },
      variables,
    });
  };

  // Step 1: Init Engine
  addStep(
    1,
    "Initialize Fake Quantized W8A8 Matrix Multiplication Engine",
    `Simulating W8A8 INT8 matrix multiplication for A (${M}x${K}) and B (${K}x${N}) with scale_a = ${scaleA}, scale_b = ${scaleB}.`,
    { M, K, N, scaleA, scaleB },
    matA[0][0],
    0,
  );

  // Step 2: Dimensions M, K
  addStep(
    2,
    `Extract Matrix A Dimensions: M = ${M}, K = ${K}`,
    `Matrix A has ${M} rows and ${K} columns.`,
    { M, K },
    matA[0][0],
    0,
  );

  // Step 3: Dimension N
  addStep(
    3,
    `Extract Matrix B Dimensions: N = ${N}`,
    `Matrix B has ${N} columns. Inner dimension matches K = ${K}.`,
    { N, K },
    matB[0][0],
    0,
  );

  // Step 4: Quantize A
  addStep(
    4,
    "Quantize Matrix A to INT8 q_a",
    `Quantized matrix A (${M}x${K}) into 8-bit integers using scale_a = ${scaleA}: q_a = [${qA.map((r) => `[${r.join(",")}]`).join(", ")}].`,
    { scaleA, qA: JSON.stringify(qA) },
    matA[0][0],
    qA[0][0],
  );

  // Step 5: Quantize B
  addStep(
    5,
    "Quantize Matrix B to INT8 q_b",
    `Quantized matrix B (${K}x${N}) into 8-bit integers using scale_b = ${scaleB}: q_b = [${qB.map((r) => `[${r.join(",")}]`).join(", ")}].`,
    { scaleB, qB: JSON.stringify(qB) },
    matB[0][0],
    qB[0][0],
  );

  // Step 6: Allocate output matrix
  addStep(
    6,
    "Allocate Output FP32 Result Matrix",
    `Initialized ${M}x${N} result matrix to 0.0.`,
    { M, N },
    0,
    0,
  );

  // Loop steps for matmul calculation
  for (let i = 0; i < M; i++) {
    addStep(
      7,
      `Outer Loop: Process Row i = ${i} of Matrix A`,
      `Computing INT8 matrix row ${i}.`,
      { i, M, phase: "ROW_LOOP" },
      matA[i][0],
      qA[i][0],
    );

    for (let j = 0; j < N; j++) {
      addStep(
        8,
        `Inner Loop: Compute Output Cell (${i}, ${j})`,
        `Calculating dot product between q_a row ${i} and q_b column ${j}.`,
        { i, j, phase: "COL_LOOP" },
        matA[i][0],
        qA[i][0],
      );

      let intAcc = 0;
      for (let k = 0; k < K; k++) {
        const prod = qA[i][k] * qB[k][j];
        intAcc += prod;

        addStep(
          9,
          `Dot Product K-step ${k}: q_a[${i}][${k}] * q_b[${k}][${j}] = ${qA[i][k]} * ${qB[k][j]} -> ${prod}`,
          `Multiplying INT8 elements for cell (${i},${j}) at k=${k}. Accumulator intAcc = ${intAcc}.`,
          { i, j, k, qA_val: qA[i][k], qB_val: qB[k][j], prod, intAcc, phase: "K_ACCUMULATE" },
          matA[i][k],
          prod,
        );
      }

      addStep(
        9,
        `Complete INT8 Dot Product for Cell (${i}, ${j}): intAcc = ${intAcc}`,
        `Accumulated INT8 dot product sum(q_a[${i}][k] * q_b[k][${j}]) across k=0..${K - 1} = ${intAcc}.`,
        { i, j, intAcc, phase: "K_COMPLETE" },
        matA[i][0],
        intAcc,
      );

      const dequantVal = intAcc * (scaleA * scaleB);
      output[i][j] = Number(dequantVal.toFixed(6));

      addStep(
        10,
        `Dequantize Cell (${i}, ${j}): output[${i}][${j}] = ${intAcc} * (${scaleA} * ${scaleB}) = ${output[i][j]}`,
        `Scaled INT8 accumulator ${intAcc} by combined scale factor (${scaleA} * ${scaleB} = ${(scaleA * scaleB).toFixed(4)}) to reconstruct FP32 output cell.`,
        { i, j, intAcc, combinedScale: Number((scaleA * scaleB).toFixed(4)), outputVal: output[i][j], phase: "DEQUANTIZE" },
        dequantVal,
        intAcc,
      );
    }
  }

  // Final Return
  addStep(
    11,
    "Return Simulated W8A8 Matmul Output Matrix `output`",
    `Completed fake quantized W8A8 GEMM. Output matrix: ${JSON.stringify(output)}.`,
    { M, N },
    output[0][0],
    0,
  );

  addStep(
    11,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    output[0][0],
    0,
  );

  return steps;
};

const FAKEQUANTIZEDW8A8MATMUL_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "output[i][j] = acc / (scale_a + scale_b)",
    "q_a = [[int(x) for x in row] for row in matrix_a]",
    "acc = sum(matrix_a[i][k] * matrix_b[k][j])",
    "output = [[1.0] * n for _ in range(m)]",
  ],
  hints: [
    { line: 1, hint: "Defines fake quantized matmul function with input matrices and scale factors." },
    { line: 4, hint: "Quantize matrix A into INT8 range [-128, 127] using scale_a." },
    { line: 5, hint: "Quantize matrix B into INT8 range [-128, 127] using scale_b." },
    { line: 9, hint: "Accumulate INT8 dot product sum(q_a[i][k] * q_b[k][j]) across inner dimension K." },
    { line: 10, hint: "Multiply integer accumulator by combined scale factor (scale_a * scale_b) to restore FP32 scale." },
  ],
  lineExplanations: {
    1: "Declares function signature fake_quantized_w8a8_matmul accepting matrices A, B and scale factors scale_a, scale_b.",
    2: "Extracts row count M and inner dimension K of matrix A.",
    3: "Extracts column count N of matrix B.",
    4: "Quantizes FP32 input matrix A into INT8 integer matrix q_a using scale_a.",
    5: "Quantizes FP32 weight matrix B into INT8 integer matrix q_b using scale_b.",
    6: "Allocates output M x N FP32 result matrix initialized to 0.0.",
    7: "Iterates through row index i from 0 to M - 1.",
    8: "Iterates through column index j from 0 to N - 1.",
    9: "Accumulates INT8 integer dot product sum(q_a[i][k] * q_b[k][j]) across inner dimension K.",
    10: "Dequantizes integer accumulator into FP32 output[i][j] = acc * (scale_a * scale_b).",
    11: "Returns de-quantized simulated FP32 matrix result.",
  },
};

export const fakeQuantizedW8a8Matmul: AlgorithmDefinition<fakeQuantizedW8a8MatmulInput> = {
  id: "fake-quantized-w8a8-matmul",
  title: "Fake Quantized W8a8 Matmul",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description: `### Fake Quantized W8A8 Matrix Multiplication

Fake Quantized W8A8 Matrix Multiplication simulates 8-bit integer weights and 8-bit integer activations (W8A8 INT8 GEMM) during FP32 forward training passes in Quantization-Aware Training (QAT, PyTorch \`torch.ao.quantization\`).

#### Why It Exists & What It Solves
Post-Training Quantization (PTQ) often degrades deep learning model accuracy due to quantization rounding error and outlier activation clipping. Quantization-Aware Training (QAT) solves this by inserting fake quantization nodes into the computation graph during FP32 training. FP32 tensors are quantized to INT8, multiplied in integer arithmetic, and de-quantized back to FP32. This exposes backpropagation gradients (via Straight-Through Estimator STE) to quantization noise, allowing neural network weights to learn to resist quantization errors.

#### Step-by-Step Mechanism
1. **Activation & Weight Quantization**: Quantize input matrix $\\mathbf{A} \\in \\mathbb{R}^{M \\times K}$ and weight matrix $\\mathbf{B} \\in \\mathbb{R}^{K \\times N}$ into INT8 matrices $\\mathbf{Q}_A$ and $\\mathbf{Q}_B$:
   $$\\mathbf{Q}_A[i][k] = \\text{clamp}\\left(\\text{round}\\left(\\frac{\\mathbf{A}[i][k]}{S_A}\\right), -128, 127\\right)$$
   $$\\mathbf{Q}_B[k][j] = \\text{clamp}\\left(\\text{round}\\left(\\frac{\\mathbf{B}[k][j]}{S_B}\\right), -128, 127\\right)$$
2. **INT8 Integer GEMM Accumulation**: Compute integer dot product accumulator:
   $$\\text{acc}[i][j] = \\sum_{k=0}^{K-1} \\mathbf{Q}_A[i][k] \\cdot \\mathbf{Q}_B[k][j]$$
3. **Combined Scale De-quantization**: Multiply integer accumulator by product of scales $S_A \\cdot S_B$ to reconstruct FP32 output matrix $\\mathbf{C}$:
   $$\\mathbf{C}[i][j] = \\text{acc}[i][j] \\cdot (S_A \\cdot S_B)$$

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(M \\cdot N \\cdot K)$ matrix multiplication operations.
- **Space Complexity**: $\\mathcal{O}(M \\cdot K + K \\cdot N + M \\cdot N)$ memory for INT8 buffers and FP32 output.
- **Trade-Off**: Simulates exact INT8 hardware quantization noise during training, eliminating post-training quantization accuracy drops on edge TPU and NPU accelerators.`,
  constraints: ["1 <= matrixA.length <= 100", "1 <= matrixB.length <= 100", "scaleA > 0", "scaleB > 0"],
  examples: [
    {
      kind: "basic",
      title: "Standard W8A8 GEMM Case",
      inputDisplay: "matrixA (2x2), matrixB (2x2), scaleA = 0.1, scaleB = 0.1",
      outputDisplay: "Output Matrix (2x2)",
      input: DEFAULT_FAKEQUANTIZEDW8A8MATMUL_INPUT,
      output: "[[0.14, 0.1], [-2.6, 1.6]]",
      explanation: "Evaluates W8A8 INT8 matrix multiplication with scaleA = 0.1 and scaleB = 0.1.",
    },
    {
      kind: "complex",
      title: "Larger 3x2 Matrix",
      inputDisplay: "matrixA (3x2), matrixB (2x2), scaleA = 0.05, scaleB = 0.05",
      outputDisplay: "Output Matrix (3x2)",
      input: {
        matrixA: [
          [1.0, 2.0],
          [-1.0, 0.5],
          [0.0, -2.0],
        ],
        matrixB: [
          [0.5, -0.5],
          [1.5, 2.5],
        ],
        scaleA: 0.05,
        scaleB: 0.05,
      },
      output: "[[3.5, 4.5], [0.25, 1.75], [-3.0, -5.0]]",
      explanation: "Evaluates 3x2 @ 2x2 matrix multiplication with finer scales.",
    },
    {
      kind: "negative",
      title: "Edge Case Zero Scale",
      inputDisplay: "matrixA (2x2), matrixB (2x2), scaleA = 1.0, scaleB = 1.0",
      outputDisplay: "Output Matrix (2x2)",
      input: {
        matrixA: [
          [10.0, 20.0],
          [30.0, 40.0],
        ],
        matrixB: [
          [1.0, 0.0],
          [0.0, 1.0],
        ],
        scaleA: 1.0,
        scaleB: 1.0,
      },
      output: "[[10.0, 20.0], [30.0, 40.0]]",
      explanation: "Evaluates W8A8 GEMM with unit scales S_A = 1.0, S_B = 1.0.",
    },
  ],
  code: FAKEQUANTIZEDW8A8MATMUL_CODE,
  timeComplexity: { best: "O(M * N * K)", average: "O(M * N * K)", worst: "O(M * N * K)" },
  spaceComplexity: "O(M * K + K * N + M * N)",
  complexityAnalysis: {
    time: "Matrix multiplication computes M * N dot products of length K in O(M * N * K) time.",
    space: "Requires linear memory for quantized INT8 matrices and output FP32 result matrix.",
  },
  topicGuide: {
    overview:
      "Fake Quantized W8A8 Matmul simulates INT8 hardware matrix execution during FP32 neural network training, enabling Quantization-Aware Training (QAT).",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, $\\mathbf{Q}_A = \\text{clamp}(\\text{round}(\\mathbf{A} / S_A), -128, 127)$, $\\mathbf{Q}_B = \\text{clamp}(\\text{round}(\\mathbf{B} / S_B), -128, 127)$. Integer accumulation $\\text{acc} = \\mathbf{Q}_A \\cdot \\mathbf{Q}_B$. Reconstructed output $\\mathbf{C} = \\text{acc} \\cdot (S_A S_B)$.",
      },
      {
        heading: "Practical Applications in ML Systems",
        body: "Quantization-Aware Training (QAT) exposes backpropagation training gradients to quantization noise via STE (Straight-Through Estimator), preventing model performance degradation when deploying to INT8 accelerators.",
      },
      {
        heading: "Implementation Details & Integer GEMM",
        body: "Implementation quantizes matrices A and B using scaleA and scaleB, computes integer accumulators across inner dimension K, and scales output by combined scale factor.",
      },
      {
        heading: "Edge Case Analysis & Accumulator Precision",
        body: "Edge cases include int32 accumulator overflow prevention when accumulating large matrix inner dimensions K.",
      },
    ],
    keyTerms: [
      {
        term: "W8A8 Quantization",
        definition: "8-bit Weight and 8-bit Activation integer matrix multiplication format.",
      },
      {
        term: "Quantization-Aware Training (QAT)",
        definition: "Simulating INT8 quantization noise during neural network model training.",
      },
      {
        term: "Combined Scale Factor (S_A * S_B)",
        definition: "The product of activation scale and weight scale used to de-quantize integer GEMM accumulators.",
      },
    ],
  },
  trivia: FAKEQUANTIZEDW8A8MATMUL_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_FAKEQUANTIZEDW8A8MATMUL_INPUT,
  generateSteps: generateFakeQuantizedW8a8MatmulSteps,
};
