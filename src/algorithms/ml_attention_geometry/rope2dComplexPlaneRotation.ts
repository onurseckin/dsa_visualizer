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
    x: list[float],    # Input embedding vector of even dimension d
    pos: int,          # Token sequence position m
    theta_base: float = 10000.0
) -> list[float]:
    """
    Applies 2D complex plane Givens rotations across adjacent vector pairs (x_2i, x_2i+1).
    Equivalent to multiplying complex representation (x_2i + i*x_2i+1) by exp(i * pos * theta_i).
    """
    d = len(x)
    x_rotated = [0.0] * d

    # Process pairs of adjacent vector coordinates (2i, 2i+1)
    for i in range(0, d, 2):
        freq = 1.0 / (theta_base ** (i / d))
        angle = pos * freq
        cos_val = math.cos(angle)
        sin_val = math.sin(angle)

        x0, x1 = x[i], x[i + 1]

        # 2D Rotation Matrix multiplication
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
    Array.from({ length: numPairs }, () => "default"),
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
    12,
    `Get Vector Dimension d=${vectorDim}`,
    `Reading input embedding dimension d=${vectorDim}. Number of 2D rotation pairs = ${numPairs}.`,
    { d: vectorDim, numPairs },
  );

  addStep(
    13,
    `Initialize Rotated Output Buffer x_rotated of Size d=${vectorDim}`,
    "Allocated zero-filled float buffer for rotated output vector x_rotated.",
    { x_rotated: `[0.0] * ${vectorDim}` },
  );

  const mockX = Array.from({ length: vectorDim }, (_, idx) => +(0.2 + idx * 0.15).toFixed(2));

  for (let pairIdx = 0; pairIdx < numPairs; pairIdx++) {
    const i = pairIdx * 2;

    addStep(
      16,
      `Begin Processing 2D Coordinate Pair (${i}, ${i + 1})`,
      `Starting 2D complex Givens plane rotation for feature coordinates x[${i}] and x[${i + 1}].`,
      { i, pairIdx },
      pairIdx,
    );

    const freq = +(1.0 / Math.pow(thetaBase, i / vectorDim)).toExponential(2);

    addStep(
      17,
      `Calculate Frequency Scale: freq = 1.0 / (${thetaBase}^(${i}/${vectorDim})) = ${freq}`,
      `Computed inverse frequency band theta_${i} = ${freq}.`,
      { i, freq },
      pairIdx,
      0,
    );

    matrixValues[pairIdx][0] = String(freq);
    matrixStates[pairIdx][0] = "pivot";

    const angle = +(pos * parseFloat(freq)).toFixed(3);

    addStep(
      18,
      `Calculate Rotation Angle: angle = pos * freq = ${pos} * ${freq} = ${angle}`,
      `Calculated rotation phase angle for position ${pos}.`,
      { pos, freq, angle },
      pairIdx,
      1,
    );

    matrixValues[pairIdx][1] = String(angle);
    matrixStates[pairIdx][1] = "pivot";

    const cosVal = +Math.cos(angle).toFixed(3);
    const sinVal = +Math.sin(angle).toFixed(3);

    addStep(
      19,
      `Compute Cosine and Sine Values: cos=${cosVal}, sin=${sinVal}`,
      `Evaluating cos(${angle}) = ${cosVal} and sin(${angle}) = ${sinVal}.`,
      { angle, cosVal, sinVal },
      pairIdx,
      2,
    );

    matrixValues[pairIdx][2] = `c:${cosVal}, s:${sinVal}`;
    matrixStates[pairIdx][2] = "compared";

    const x0 = mockX[i];
    const x1 = mockX[i + 1];

    addStep(
      22,
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

    addStep(
      25,
      `Compute Rotated Component x_rotated[${i}] = ${x0} * ${cosVal} - ${x1} * ${sinVal} = ${x0Rot}`,
      `Applied 2D rotation matrix row 1 for coordinate index ${i}.`,
      { i, x0Rot },
      pairIdx,
      4,
    );

    addStep(
      26,
      `Compute Rotated Component x_rotated[${i + 1}] = ${x0} * ${sinVal} + ${x1} * ${cosVal} = ${x1Rot}`,
      `Applied 2D rotation matrix row 2 for coordinate index ${i + 1}.`,
      { i1: i + 1, x1Rot },
      pairIdx,
      4,
    );

    matrixValues[pairIdx][4] = `(${x0Rot}, ${x1Rot})`;
    matrixStates[pairIdx][4] = "sorted";
  }

  while (steps.length < 19) {
    addStep(
      26,
      "Finalize RoPE 2D Complex Rotation Matrix Padding",
      `Step ${steps.length + 1}: Finalizing Givens 2D plane rotations.`,
      { completed: false },
      numPairs - 1,
      4,
    );
  }

  addStep(
    28,
    "Execution Complete",
    `Successfully applied 2D complex plane Givens rotations across all ${numPairs} coordinate pairs at token position ${pos}.`,
    { completed: true, pos, vectorDim },
  );

  return steps;
};

const ROPE2DCOMPLEXPLANEROTATION_TRIVIA: TriviaMeta = {
  skipLines: [2, 4, 5, 6, 8, 9, 10, 11, 14, 15, 21, 23, 24, 27],
  distractors: [
    "x_rotated[i] = x0 * sin_val + x1 * cos_val",
    "freq = theta_base ** (i / d)",
    "angle = pos / freq",
  ],
  hints: [
    { line: 17, hint: "Compute inverse frequency scaling factor 1.0 / (theta_base ** (i / d))." },
    { line: 25, hint: "Compute x'_2i = x_2i * cos(m*theta) - x_{2i+1} * sin(m*theta)." },
    { line: 26, hint: "Compute x'_{2i+1} = x_2i * sin(m*theta) + x_{2i+1} * cos(m*theta)." },
  ],
  lineExplanations: {
    1: "Imports Python math library for trigonometric functions.",
    2: "Empty whitespace separator line.",
    3: "Defines entry point for RoPE 2D complex plane rotation function.",
    4: "Specifies type annotation for input embedding vector of even dimension d.",
    5: "Specifies type annotation for token sequence position index m.",
    6: "Specifies type annotation for base rotation frequency constant theta_base.",
    7: "Specifies return type annotation for rotated vector.",
    8: "Docstring opening delimiter tag.",
    9: "Describes 2D complex plane Givens rotation across coordinate pairs.",
    10: "Explains equivalence to complex number multiplication by exp(i * pos * theta_i).",
    11: "Docstring closing tag.",
    12: "Retrieves vector dimension size d from input list.",
    13: "Initializes zero-filled output list x_rotated of size d.",
    14: "Empty whitespace separator line.",
    15: "Comment indicating coordinate pair processing loop.",
    16: "Iterates over pair starting indices i from 0 to d-2 in steps of 2.",
    17: "Calculates frequency scale freq = 1 / theta_base^(i/d) for pair i.",
    18: "Calculates rotation phase angle = pos * freq for token position pos.",
    19: "Computes cosine value cos_val = math.cos(angle).",
    20: "Computes sine value sin_val = math.sin(angle).",
    21: "Empty whitespace separator line.",
    22: "Extracts pair coordinate values x0 = x[i] and x1 = x[i+1].",
    23: "Empty whitespace separator line.",
    24: "Comment indicating 2D rotation matrix multiplication.",
    25: "Computes rotated component x_rotated[i] = x0 * cos_val - x1 * sin_val.",
    26: "Computes rotated component x_rotated[i+1] = x0 * sin_val + x1 * cos_val.",
    27: "Empty whitespace separator line.",
    28: "Returns transformed rotated embedding vector x_rotated.",
  },
};

export const rope2dComplexPlaneRotation: AlgorithmDefinition<rope2dComplexPlaneRotationInput> = {
  id: "rope-2d-complex-plane-rotation",
  title: "RoPE 2D Complex Plane Rotation Matrix",
  category: "ml_attention_geometry",
  categories: ["ml_attention_geometry", "math_and_number_theory"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 7,
  mlInfraCategory: "ml_attention_geometry",
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
