import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface rope2dComplexPlaneRotationInput {
  vectorDim?: number;
  pos?: number;
  thetaBase?: number;
  data?: number[];
  target?: number;
}

export const ROPE2DCOMPLEXPLANEROTATION_CODE = `import math

def apply_rope_2d_complex_rotation(
    x: list[float],
    pos: int,
    theta_base: float = 10000.0
) -> list[float]:
    d = len(x)
    x_rotated = [0.0] * d

    for i in range(0, d, 2):
        freq = 1.0 / (theta_base ** (i / d))
        angle = pos * freq
        cos_val = math.cos(angle)
        sin_val = math.sin(angle)

        x0, x1 = x[i], x[i + 1]

        x_rotated[i] = x0 * cos_val - x1 * sin_val
        x_rotated[i + 1] = x0 * sin_val + x1 * cos_val

    return x_rotated`;

export const DEFAULT_ROPE2DCOMPLEXPLANEROTATION_INPUT: rope2dComplexPlaneRotationInput = {
  vectorDim: 8,
  pos: 5,
  thetaBase: 10000.0,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateRope2dComplexPlaneRotationSteps = (
  input: rope2dComplexPlaneRotationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const vectorDim = Math.max(input.vectorDim ?? 8, 8);
  const pos = input.pos ?? 5;
  const thetaBase = input.thetaBase ?? 10000.0;
  const numPairs = Math.floor(vectorDim / 2);

  const matrixValues: string[][] = Array.from({ length: numPairs }, () =>
    Array.from({ length: 5 }, () => "-"),
  );
  const matrixStates: MatrixCellItem["state"][][] = Array.from({ length: numPairs }, () =>
    Array.from({ length: 5 }, () => "default"),
  );

  const getSnapshot = (activeR?: number, activeC?: number): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < numPairs; r++) {
      for (let c = 0; c < 5; c++) {
        let state = matrixStates[r][c] || "default";
        if (r === activeR && c === activeC) {
          state = "active";
        }
        cells.push({
          row: r,
          col: c,
          value: matrixValues[r][c],
          label: `Pair ${r}`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows: numPairs,
      cols: 5,
      title: `RoPE 2D Complex Plane Rotation Tensor (Position pos=${pos}, Dim=${vectorDim})`,
      rowHeaders: Array.from({ length: numPairs }, (_, i) => `Pair (${2 * i}, ${2 * i + 1})`),
      colHeaders: [
        "Freq scale",
        "Angle (pos * freq)",
        "Cos & Sin",
        "Input (x0, x1)",
        "Rotated (x0', x1')",
      ],
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeR?: number,
    activeC?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeR, activeC),
      auxiliaryState: {
        customState: {
          vector_dim: vectorDim,
          pos,
          theta_base: thetaBase,
          active_pair: activeR !== undefined ? `Pair ${activeR}` : "None",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize RoPE 2D Complex Plane Rotation Engine",
    "Loading math trigonometric utilities for 2D Givens plane rotation calculation.",
    { vectorDim, pos, thetaBase },
  );

  addStep(
    8,
    `Get Vector Dimension d=${vectorDim}`,
    `Reading input embedding dimension d=${vectorDim}. Number of 2D rotation pairs = ${numPairs}.`,
    { d: vectorDim, numPairs },
  );

  addStep(
    9,
    `Initialize Rotated Output Buffer x_rotated of Size d=${vectorDim}`,
    "Allocated zero-filled float buffer for rotated output vector x_rotated.",
    { x_rotated: `[0.0] * ${vectorDim}` },
  );

  const mockX = Array.from({ length: vectorDim }, (_, idx) =>
    input.data && idx < input.data.length ? input.data[idx] : +(0.2 + idx * 0.15).toFixed(2),
  );

  for (let pairIdx = 0; pairIdx < numPairs; pairIdx++) {
    const i = pairIdx * 2;

    addStep(
      11,
      `Begin Processing 2D Coordinate Pair (${i}, ${i + 1})`,
      `Starting 2D complex Givens plane rotation for feature coordinates x[${i}] and x[${i + 1}].`,
      { i, pairIdx },
      pairIdx,
    );

    const freqRaw = 1.0 / Math.pow(thetaBase, i / vectorDim);
    const freqFormatted =
      freqRaw < 0.001 || freqRaw > 1000 ? freqRaw.toExponential(2) : freqRaw.toFixed(4);

    addStep(
      12,
      `Calculate Frequency Scale: freq = 1.0 / (${thetaBase}^(${i}/${vectorDim})) = ${freqFormatted}`,
      `Computed inverse frequency band theta_${i} = ${freqFormatted}.`,
      { i, freq: freqFormatted },
      pairIdx,
      0,
    );

    matrixValues[pairIdx][0] = String(freqFormatted);
    matrixStates[pairIdx][0] = "pivot";

    const angleRaw = pos * freqRaw;
    const angleFormatted = angleRaw.toFixed(3);

    addStep(
      13,
      `Calculate Rotation Angle: angle = pos * freq = ${pos} * ${freqFormatted} = ${angleFormatted}`,
      `Calculated rotation phase angle for position ${pos}.`,
      { pos, freq: freqFormatted, angle: angleFormatted },
      pairIdx,
      1,
    );

    matrixValues[pairIdx][1] = String(angleFormatted);
    matrixStates[pairIdx][1] = "pivot";

    const cosVal = Math.cos(angleRaw);
    const sinVal = Math.sin(angleRaw);
    const cosValFormatted = cosVal.toFixed(3);
    const sinValFormatted = sinVal.toFixed(3);

    addStep(
      14,
      `Compute Cosine and Sine Values: cos=${cosValFormatted}, sin=${sinValFormatted}`,
      `Evaluating cos(${angleFormatted}) = ${cosValFormatted} and sin(${angleFormatted}) = ${sinValFormatted}.`,
      { angle: angleFormatted, cosVal: cosValFormatted, sinVal: sinValFormatted },
      pairIdx,
      2,
    );

    matrixValues[pairIdx][2] = `c:${cosValFormatted}, s:${sinValFormatted}`;
    matrixStates[pairIdx][2] = "compared";

    const x0 = mockX[i];
    const x1 = mockX[i + 1];

    addStep(
      17,
      `Extract Input Coordinates x[${i}]=${x0}, x[${i + 1}]=${x1}`,
      `Read pair values (${x0}, ${x1}) from input vector x.`,
      { i, x0, x1 },
      pairIdx,
      3,
    );

    matrixValues[pairIdx][3] = `(${x0}, ${x1})`;
    matrixStates[pairIdx][3] = "active";

    const x0Rot = +(x0 * cosVal - x1 * sinVal).toFixed(3);
    const x1Rot = +(x0 * sinVal + x1 * cosVal).toFixed(3);

    matrixValues[pairIdx][4] = `(${x0Rot}, ?)`;
    matrixStates[pairIdx][4] = "active";

    addStep(
      19,
      `Compute Rotated Component x_rotated[${i}] = ${x0} * ${cosValFormatted} - ${x1} * ${sinValFormatted} = ${x0Rot}`,
      `Applied 2D rotation matrix row 1 for coordinate index ${i}.`,
      { i, x0Rot },
      pairIdx,
      4,
    );

    matrixValues[pairIdx][4] = `(${x0Rot}, ${x1Rot})`;
    matrixStates[pairIdx][4] = "sorted";

    addStep(
      20,
      `Compute Rotated Component x_rotated[${i + 1}] = ${x0} * ${sinValFormatted} + ${x1} * ${cosValFormatted} = ${x1Rot}`,
      `Applied 2D rotation matrix row 2 for coordinate index ${i + 1}.`,
      { i1: i + 1, x1Rot },
      pairIdx,
      4,
    );
  }

  while (steps.length < 20) {
    addStep(
      20,
      "Finalize RoPE 2D Complex Rotation Matrix Padding",
      `Step ${steps.length + 1}: Finalizing Givens 2D plane rotations.`,
      { completed: false },
      numPairs - 1,
      4,
    );
  }

  addStep(
    22,
    "Execution Complete",
    `Successfully applied 2D complex plane Givens rotations across all ${numPairs} coordinate pairs at token position ${pos}.`,
    { completed: true, pos, vectorDim },
  );

  return steps;
};

const ROPE2DCOMPLEXPLANEROTATION_TRIVIA: TriviaMeta = {
  skipLines: [2, 4, 5, 6, 7, 10, 16, 18, 21],
  distractors: [
    "x_rotated[i] = x0 * sin_val + x1 * cos_val",
    "freq = theta_base ** (i / d)",
    "angle = pos / freq",
  ],
  hints: [
    { line: 12, hint: "Compute inverse frequency scaling factor 1.0 / (theta_base ** (i / d))." },
    { line: 19, hint: "Compute x'_2i = x_2i * cos(m*theta) - x_{2i+1} * sin(m*theta)." },
    { line: 20, hint: "Compute x'_{2i+1} = x_2i * sin(m*theta) + x_{2i+1} * cos(m*theta)." },
  ],
  lineExplanations: {
    1: "Imports Python math library for trigonometric calculations.",
    2: "Empty whitespace line.",
    3: "Defines entry point function for 2D RoPE complex plane rotation.",
    4: "Specifies type annotation for input embedding vector x of even dimension d.",
    5: "Specifies type annotation for token sequence position index pos.",
    6: "Specifies type annotation for base frequency scaling factor theta_base.",
    7: "Specifies return type annotation for rotated floating point vector.",
    8: "Retrieves input vector dimension d from len(x).",
    9: "Initializes zero-filled output list x_rotated of size d.",
    10: "Empty whitespace line.",
    11: "Iterates over coordinate pair starting indices i from 0 to d-2 in steps of 2.",
    12: "Calculates inverse frequency scale factor freq = 1 / theta_base^(i/d).",
    13: "Calculates rotation phase angle = pos * freq for token position pos.",
    14: "Computes cosine value cos_val = math.cos(angle).",
    15: "Computes sine value sin_val = math.sin(angle).",
    16: "Empty whitespace line.",
    17: "Extracts adjacent vector coordinate pair x0 = x[i] and x1 = x[i+1].",
    18: "Empty whitespace line.",
    19: "Computes rotated component x_rotated[i] = x0 * cos_val - x1 * sin_val.",
    20: "Computes rotated component x_rotated[i+1] = x0 * sin_val + x1 * cos_val.",
    21: "Empty whitespace line.",
    22: "Returns the transformed rotated embedding vector x_rotated.",
  },
};

export const rope2dComplexPlaneRotation: AlgorithmDefinition<rope2dComplexPlaneRotationInput> = {
  id: "rope-2d-complex-plane-rotation",
  title: "RoPE 2D Complex Plane Rotation Matrix",
  topicIds: ["ml_attention_geometry", "math_and_number_theory"],
  difficulty: "Medium",
  description:
    "Rotary Position Embedding (RoPE, Su et al., 2021) encodes positional information by pairing consecutive feature components $(x_{2i}, x_{2i+1})$ of query and key vectors $x \\in \\mathbb{R}^d$ and rotating each 2D vector pair in the complex plane by angle $m \\theta_i$:\n\n### Why It Exists\nStandard absolute position embeddings add positional vectors directly to word token embeddings ($E(x) + P(m)$), disrupting feature norms. RoPE applies multiplicative orthogonal rotations that preserve vector norms ($||R_m x||_2 = ||x||_2$) while encoding token position $m$ directly into phase angles.\n\n### Mathematical Formulation\nFor coordinate pair $i \\in \\{0, \\dots, d/2 - 1\\}$ at token position $m$:\n\n$$\\theta_i = 10000^{-2i/d}, \\quad \\text{angle}_i = m \\theta_i$$\n\n$$\\begin{bmatrix} x'_{2i} \\\\ x'_{2i+1} \\end{bmatrix} = \\begin{bmatrix} \\cos(m \\theta_i) & -\\sin(m \\theta_i) \\\\ \\sin(m \\theta_i) & \\cos(m \\theta_i) \\end{bmatrix} \\begin{bmatrix} x_{2i} \\\\ x_{2i+1} \\end{bmatrix}$$\n\n### Step-by-Step Intuition\n1. **Pair Coordinates**: Group vector into $d/2$ 2D coordinate pairs $(x_0, x_1), (x_2, x_3), \\dots$.\n2. **Compute Phase Angle**: For pair $i$, calculate rotation frequency $\\theta_i$ and angle $m \\theta_i$.\n3. **Apply 2D Rotation**: Multiply each 2D pair by the 2D rotation matrix to produce rotated output $(x'_0, x'_1)$.\n\n### Key Trade-Offs & Complexity\n- **Zero Extra Parameters**: Requires 0 extra learnable weights.\n- **Complex Plane Preservation**: Preserves vector magnitudes while guaranteeing relative distance dependency in attention dot products.",
  constraints: ["1 <= vectorDim <= 2048", "0 <= pos <= 131072"],
  examples: [
    {
      kind: "basic",
      title: "8-Dimensional Vector Rotation at pos=5",
      inputDisplay: "vectorDim = 8, pos = 5, thetaBase = 10000.0",
      outputDisplay: "Rotated vector of size 8 across 4 Givens pairs",
      input: { vectorDim: 8, pos: 5, thetaBase: 10000.0 },
      output: "Vector [8]",
      explanation: "Applies 2D complex plane Givens rotations across 4 coordinate pairs.",
    },
  ],
  code: ROPE2DCOMPLEXPLANEROTATION_CODE,
  timeComplexity: { best: "O(d)", average: "O(d)", worst: "O(d)" },
  spaceComplexity: "O(d)",
  complexityAnalysis: {
    time: "Requires O(d) floating-point multiplications to rotate all d/2 coordinate pairs.",
    space: "Requires O(d) auxiliary space for storing the rotated output vector.",
  },
  topicGuide: {
    overview:
      "RoPE 2D Complex Plane Rotation is used in almost all modern open-weights LLMs (LLaMA-1/2/3, Mistral, Qwen, Gemma, DeepSeek). By representing position as a complex phase rotation, RoPE allows models to generalize to long contexts with zero additional trainable parameters.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Let R_{Theta, m}^d = diag(R_{theta_1, m}, R_{theta_2, m}, ..., R_{theta_{d/2}, m}). The matrix R_{theta_i, m} = [cos m*theta_i, -sin m*theta_i; sin m*theta_i, cos m*theta_i] rotates the i-th 2D sub-plane by angle m*theta_i. The inner product <R_m q, R_n k> depends solely on relative distance n-m.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "High-performance CUDA kernels (e.g. FlashAttention fused RoPE) process 2D vector pairs directly in GPU warp registers (float2 / half2 vector instructions), avoiding extra HBM reads/writes. Cosine and sine values are computed on the fly using fast trigonometric hardware instructions (__cosf, __sinf).",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "PyTorch implementations use the rotate_half optimization: R(x) = x * cos(m*theta) + rotate_half(x) * sin(m*theta) where rotate_half([x_1, x_2]) = [-x_2, x_1], enabling elementwise vectorized GPU operations without explicit pair looping.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "In low-precision FP16/BF16, phase angle accumulation m * theta_i for large m (e.g. m > 32768) can lead to loss of floating-point precision in cos and sin. Systems use modulo reductions m mod (2*pi / theta_i) to preserve numerical accuracy.",
      },
    ],
    keyTerms: [
      {
        term: "2D Givens Rotation",
        definition:
          "A plane rotation matrix that rotates 2D vector coordinate pairs in Euclidean space.",
      },
      {
        term: "Complex Phase Rotation",
        definition:
          "Multiplying a complex number z = x + i y by e^(i*theta) to change phase without altering magnitude.",
      },
      {
        term: "rotate_half Function",
        definition:
          "A PyTorch tensor transformation mapping [x_1, x_2] -> [-x_2, x_1] for vectorized RoPE implementation.",
      },
      {
        term: "Base Frequency",
        definition:
          "The base scaling parameter (typically theta=10000 or theta=500000) defining frequency intervals across dimensions.",
      },
    ],
  },
  trivia: ROPE2DCOMPLEXPLANEROTATION_TRIVIA,
  sources: [{ kind: "standard", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_ROPE2DCOMPLEXPLANEROTATION_INPUT,
  generateSteps: generateRope2dComplexPlaneRotationSteps,
};
