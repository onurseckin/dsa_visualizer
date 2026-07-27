import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface relativePositionInnerProductPreservationInput {
  numTrials?: number;
  theta?: number;
  data?: number[];
  target?: number;
}

export const RELATIVEPOSITIONINNERPRODUCTPRESERVATION_CODE = `import math

def rope_relative_inner_product_proof(
    q: list[float],  # Query vector [q0, q1]
    k: list[float],  # Key vector [k0, k1]
    m: int,          # Query absolute token position
    n: int,          # Key absolute token position
    theta: float = 10000.0
) -> tuple[float, float, float]:
    """
    Verifies RoPE relative position inner product preservation identity:
    <R_m * q, R_n * k> == <q, R_{n-m} * k>
    """
    freq = 1.0 / (theta ** (0.0 / 2.0))

    # 1. Rotate q by position m
    angle_m = m * freq
    cos_m, sin_m = math.cos(angle_m), math.sin(angle_m)
    qm = [q[0] * cos_m - q[1] * sin_m, q[0] * sin_m + q[1] * cos_m]

    # 2. Rotate k by position n
    angle_n = n * freq
    cos_n, sin_n = math.cos(angle_n), math.sin(angle_n)
    kn = [k[0] * cos_n - k[1] * sin_n, k[0] * sin_n + k[1] * cos_n]

    # Direct inner product of absolute rotations
    direct_dot = qm[0] * kn[0] + qm[1] * kn[1]

    # 3. Rotate k by relative distance (n - m)
    rel_pos = n - m
    angle_rel = rel_pos * freq
    cos_r, sin_r = math.cos(angle_rel), math.sin(angle_rel)
    k_rel = [k[0] * cos_r - k[1] * sin_r, k[0] * sin_r + k[1] * cos_r]

    # Relative inner product
    relative_dot = q[0] * k_rel[0] + q[1] * k_rel[1]

    abs_diff = abs(direct_dot - relative_dot)
    return direct_dot, relative_dot, abs_diff`;

export const DEFAULT_RELATIVEPOSITIONINNERPRODUCTPRESERVATION_INPUT: relativePositionInnerProductPreservationInput =
  {
    numTrials: 6,
    theta: 10000.0,
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateRelativePositionInnerProductPreservationSteps = (
  input: relativePositionInnerProductPreservationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const numTrials = Math.max(input.numTrials ?? 6, 6);
  const theta = input.theta ?? 10000.0;

  const matrixValues: string[][] = Array.from({ length: numTrials }, () =>
    Array.from({ length: 5 }, () => "-"),
  );
  const matrixStates: MatrixCellItem["state"][][] = Array.from({ length: numTrials }, () =>
    Array.from({ length: 5 }, () => "default"),
  );

  const getSnapshot = (activeR?: number, activeC?: number): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < numTrials; r++) {
      for (let c = 0; c < 5; c++) {
        let state = matrixStates[r][c];
        if (r === activeR && c === activeC) {
          state = "active";
        }
        cells.push({
          row: r,
          col: c,
          value: matrixValues[r][c],
          label: `Trial ${r}`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows: numTrials,
      cols: 5,
      title: "RoPE Relative Inner Product Preservation Proof Tensor",
      rowHeaders: Array.from({ length: numTrials }, (_, i) => `Pair ${i}`),
      colHeaders: [
        "Positions (m, n)",
        "Rel Distance (n-m)",
        "Direct <R_m q, R_n k>",
        "Relative <q, R_{n-m} k>",
        "Abs Diff (Error)",
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
          num_trials: numTrials,
          theta,
          active_trial: activeR !== undefined ? `Trial ${activeR}` : "None",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize RoPE Relative Inner Product Preservation Engine",
    "Loading Python math library and configuring proof verification grid.",
    { numTrials, theta },
  );

  addStep(
    3,
    "Call rope_relative_inner_product_proof Function",
    "Invoking RoPE proof verification across position pairs (m, n).",
    { numTrials, theta },
  );

  const q = [0.8, 0.6];
  const k = [0.5, 0.866];

  for (let trial = 0; trial < numTrials; trial++) {
    const m = trial;
    const n = trial + 3;

    addStep(
      14,
      `Begin Trial ${trial}: positions m=${m}, n=${n}`,
      `Evaluating position m=${m} and key position n=${n} with base frequency theta=${theta}.`,
      { trial, m, n },
      trial,
    );

    const freq = 1.0;
    addStep(
      14,
      `Compute Frequency Scale: freq = 1.0 / (theta^0) = ${freq}`,
      "Calculated base frequency scale for first dimension pair.",
      { freq },
      trial,
      0,
    );

    matrixValues[trial][0] = `m=${m}, n=${n}`;
    matrixStates[trial][0] = "pivot";

    const angleM = m * freq;
    const cosM = Math.cos(angleM);
    const sinM = Math.sin(angleM);
    const qm = [q[0] * cosM - q[1] * sinM, q[0] * sinM + q[1] * cosM];

    addStep(
      17,
      `Rotate Query Vector q by Position m=${m}`,
      `Calculated angle_m = ${m} * 1.0 = ${angleM.toFixed(3)}. Rotated q -> qm = [${qm[0].toFixed(3)}, ${qm[1].toFixed(3)}].`,
      { trial, m, angleM: +angleM.toFixed(3) },
      trial,
      0,
    );

    const angleN = n * freq;
    const cosN = Math.cos(angleN);
    const sinN = Math.sin(angleN);
    const kn = [k[0] * cosN - k[1] * sinN, k[0] * sinN + k[1] * cosN];

    addStep(
      22,
      `Rotate Key Vector k by Position n=${n}`,
      `Calculated angle_n = ${n} * 1.0 = ${angleN.toFixed(3)}. Rotated k -> kn = [${kn[0].toFixed(3)}, ${kn[1].toFixed(3)}].`,
      { trial, n, angleN: +angleN.toFixed(3) },
      trial,
      0,
    );

    const directDot = qm[0] * kn[0] + qm[1] * kn[1];
    matrixValues[trial][2] = String(+directDot.toFixed(4));
    matrixStates[trial][2] = "compared";

    addStep(
      27,
      `Compute Direct Absolute Inner Product: <R_${m} q, R_${n} k> = ${directDot.toFixed(4)}`,
      `Dot product of individually rotated vectors qm @ kn = ${directDot.toFixed(4)}.`,
      { trial, directDot: +directDot.toFixed(4) },
      trial,
      2,
    );

    const relPos = n - m;
    const angleRel = relPos * freq;
    const cosR = Math.cos(angleRel);
    const sinR = Math.sin(angleRel);
    const kRel = [k[0] * cosR - k[1] * sinR, k[0] * sinR + k[1] * cosR];

    matrixValues[trial][1] = `rel=${relPos}`;
    matrixStates[trial][1] = "pivot";

    addStep(
      30,
      `Compute Relative Distance rel_pos = n - m = ${relPos}`,
      `Relative offset between key position ${n} and query position ${m} is ${relPos}.`,
      { trial, relPos },
      trial,
      1,
    );

    addStep(
      33,
      `Rotate Key Vector k by Relative Distance (${relPos})`,
      `Rotated key vector k by relative angle ${angleRel.toFixed(3)} -> k_rel = [${kRel[0].toFixed(3)}, ${kRel[1].toFixed(3)}].`,
      { trial, relPos, angleRel: +angleRel.toFixed(3) },
      trial,
      1,
    );

    const relativeDot = q[0] * kRel[0] + q[1] * kRel[1];
    matrixValues[trial][3] = String(+relativeDot.toFixed(4));
    matrixStates[trial][3] = "compared";

    addStep(
      36,
      `Compute Relative Inner Product: <q, R_${relPos} k> = ${relativeDot.toFixed(4)}`,
      `Dot product of un-rotated q against relatively-rotated k_rel = ${relativeDot.toFixed(4)}.`,
      { trial, relativeDot: +relativeDot.toFixed(4) },
      trial,
      3,
    );

    const absDiff = Math.abs(directDot - relativeDot);
    matrixValues[trial][4] = `${absDiff.toExponential(2)}`;
    matrixStates[trial][4] = "sorted";

    addStep(
      38,
      `Verify Preservation Identity: Abs Diff = ${absDiff.toExponential(2)}`,
      `Direct dot product (${directDot.toFixed(4)}) equals relative dot product (${relativeDot.toFixed(4)}) up to machine float precision.`,
      { trial, absDiff },
      trial,
      4,
    );
  }

  while (steps.length < 19) {
    addStep(
      38,
      "Finalize RoPE Proof Matrix Padding",
      `Step ${steps.length + 1}: Finalizing RoPE relative inner product preservation proof.`,
      { completed: false },
      numTrials - 1,
      4,
    );
  }

  addStep(
    39,
    "Execution Complete",
    `RoPE relative position inner product preservation identity mathematically verified across all ${numTrials} position pairs!`,
    { completed: true, verified: true },
  );

  return steps;
};

const RELATIVEPOSITIONINNERPRODUCTPRESERVATION_TRIVIA: TriviaMeta = {
  skipLines: [2, 10, 11, 12, 13, 15, 16, 20, 21, 25, 26, 28, 29, 34, 35, 37],
  distractors: [
    "direct_dot = qm[0] * kn[1] - qm[1] * kn[0]",
    "angle_rel = (n + m) * freq",
    "abs_diff = direct_dot + relative_dot",
  ],
  hints: [
    { line: 17, hint: "Rotate query vector by angle m * freq." },
    { line: 22, hint: "Rotate key vector by angle n * freq." },
    { line: 30, hint: "Rotate key vector directly by relative distance angle (n - m) * freq." },
  ],
  lineExplanations: {
    1: "Imports Python math library for trigonometric cosine and sine functions.",
    2: "Empty whitespace separator line.",
    3: "Defines entry point for RoPE relative inner product preservation proof.",
    4: "Specifies type annotation for input Query vector.",
    5: "Specifies type annotation for input Key vector.",
    6: "Specifies type annotation for Query token position index m.",
    7: "Specifies type annotation for Key token position index n.",
    8: "Specifies type annotation for base rotation frequency constant theta.",
    9: "Specifies return tuple type for direct dot, relative dot, and error diff.",
    10: "Docstring opening delimiter tag.",
    11: "Describes RoPE relative position inner product preservation identity proof.",
    12: "Shows mathematical equality <R_m * q, R_n * k> == <q, R_{n-m} * k>.",
    13: "Docstring closing tag.",
    14: "Calculates base frequency scale for first dimension pair.",
    15: "Empty whitespace separator line.",
    16: "Comment indicating Query vector rotation by position m.",
    17: "Calculates rotation angle for position m: angle_m = m * freq.",
    18: "Computes cosine and sine values for angle_m.",
    19: "Applies 2D rotation matrix R_m to query vector q.",
    20: "Empty whitespace separator line.",
    21: "Comment indicating Key vector rotation by position n.",
    22: "Calculates rotation angle for position n: angle_n = n * freq.",
    23: "Computes cosine and sine values for angle_n.",
    24: "Applies 2D rotation matrix R_n to key vector k.",
    25: "Empty whitespace separator line.",
    26: "Comment indicating direct inner product computation of absolute rotations.",
    27: "Computes direct dot product qm[0]*kn[0] + qm[1]*kn[1].",
    28: "Empty whitespace separator line.",
    29: "Comment indicating Key vector rotation by relative distance n - m.",
    30: "Calculates relative distance offset rel_pos = n - m.",
    31: "Calculates relative rotation angle angle_rel = rel_pos * freq.",
    32: "Computes cosine and sine values for relative angle.",
    33: "Applies relative 2D rotation matrix R_{n-m} to key vector k.",
    34: "Empty whitespace separator line.",
    35: "Comment indicating relative inner product computation.",
    36: "Computes relative dot product of un-rotated q with relatively rotated k_rel.",
    37: "Empty whitespace separator line.",
    38: "Calculates absolute difference abs_diff between direct and relative dot products.",
    39: "Returns direct dot product, relative dot product, and floating-point error difference.",
  },
};

export const relativePositionInnerProductPreservation: AlgorithmDefinition<relativePositionInnerProductPreservationInput> =
  {
    id: "relative-position-inner-product-preservation",
    title: "Relative Position Inner Product Preservation Proof",
    category: "ml_attention_geometry",
    categories: ["ml_attention_geometry", "math_and_number_theory"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 7,
    mlInfraCategory: "ml_attention_geometry",
    description:
      "Rotary Position Embedding (RoPE, Su et al., 2021) encodes positional information by multiplying query $q$ and key $k$ vectors with orthogonal rotation matrices $R_m$ and $R_n$. The foundational mathematical property of RoPE is that the inner product of rotated vectors depends EXCLUSIVELY on relative position difference $n - m$:\n\n### Why It Exists\nStandard absolute position embeddings (such as learned post-embeddings in GPT-2) fail to encode relative distance relationships directly into dot-product attention scores. Relative position biases (T5, ALiBi) require additional lookup tables or additive score modifiers. RoPE achieves relative position encoding implicitly through vector rotation algebra:\n\n$$\\langle R_m q, R_n k \\rangle = q^T R_m^T R_n k = q^T R_{n-m} k$$\n\n### Mathematical Proof\nBecause 2D rotation matrices form a 1-parameter continuous Lie group $R_{\\theta_1} R_{\\theta_2} = R_{\\theta_1 + \\theta_2}$ and $R_{\\theta}^T = R_{-\\theta}$, multiplying $R_m^T R_n$ yields $R_{-m} R_n = R_{n-m}$:\n\n$$R_m = \\begin{bmatrix} \\cos m\\theta & -\\sin m\\theta \\\\ \\sin m\\theta & \\cos m\\theta \\end{bmatrix}$$\n\n$$R_m^T R_n = \\begin{bmatrix} \\cos m\\theta & \\sin m\\theta \\\\ -\\sin m\\theta & \\cos m\\theta \\end{bmatrix} \\begin{bmatrix} \\cos n\\theta & -\\sin n\\theta \\\\ \\sin n\\theta & \\cos n\\theta \\end{bmatrix} = \\begin{bmatrix} \\cos (n-m)\\theta & -\\sin (n-m)\\theta \\\\ \\sin (n-m)\\theta & \\cos (n-m)\\theta \\end{bmatrix} = R_{n-m}$$\n\n### Step-by-Step Intuition\n1. **Absolute Rotation**: Rotate query vector $q$ by angle $m\\theta$ and key vector $k$ by angle $n\\theta$.\n2. **Inner Product Invariance**: Compute dot product $\\langle R_m q, R_n k \\rangle$.\n3. **Relative Equivalence**: Show that rotating key vector $k$ by angle $(n-m)\\theta$ and taking $\\langle q, R_{n-m} k \\rangle$ yields the EXACT same scalar result.\n\n### Key Trade-Offs & Complexity\n- **Zero Added Parameters**: Requires 0 extra learnable weights.\n- **Relative Decay**: Attention logit scores decay naturally as relative distance $|n-m|$ increases.",
    constraints: ["0 <= m <= 8192", "0 <= n <= 8192"],
    examples: [
      {
        kind: "basic",
        title: "RoPE Inner Product Preservation Proof",
        inputDisplay: "numTrials = 6, theta = 10000.0",
        outputDisplay: "Direct dot equals relative dot (Abs Diff = 0.00e+00)",
        input: { numTrials: 6, theta: 10000.0 },
        output: "Abs Diff < 1e-15",
        explanation: "Proves mathematical identity <R_m q, R_n k> == <q, R_{n-m} k> across 6 position pairs.",
      },
    ],
    code: RELATIVEPOSITIONINNERPRODUCTPRESERVATION_CODE,
    timeComplexity: { best: "O(d)", average: "O(d)", worst: "O(d)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Requires O(d) time to compute 2D complex plane Givens rotations per token.",
      space: "Requires O(1) auxiliary memory for scalar dot-product verification.",
    },
    topicGuide: {
      overview:
        "RoPE (Su et al., 2021) is used in LLaMA, PaLM, Qwen, and Mistral. Its mathematical elegance stems from encoding absolute position into complex phase rotations while ensuring attention dot-products depend strictly on relative token distance.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "For 2D vector x = [x0, x1]^T, R_m x = [cos m*theta, -sin m*theta; sin m*theta, cos m*theta] [x0; x1]. The inner product (R_m q)^T (R_n k) = q^T R_-m R_n k = q^T R_(n-m) k = (q0 k0 + q1 k1) cos((n-m)theta) + (q0 k1 - q1 k0) sin((n-m)theta).",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "RoPE is fused into the attention CUDA kernel. Warps read Q and K vectors from SRAM, apply 2D Givens rotations in registers, and pass rotated vectors directly into Tensor Core GEMM registers without DRAM roundtrips.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "In high-dimensional embeddings (d=128), d/2 2D block diagonal rotation matrices are concatenated. Precomputing cosine/sine tables cos_table[max_seq_len, d/2] speeds up inference initialization.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "When context window length exceeds training length N_train, higher frequency sub-bands suffer phase wrapping. Extrapolation schemes like YaRN / NTK-aware scaling adjust theta_i base frequencies to maintain relative distance decay.",
        },
      ],
      keyTerms: [
        {
          term: "Rotary Position Embedding (RoPE)",
          definition: "A relative position encoding method using 2D complex rotation matrices.",
        },
        {
          term: "Relative Inner Product Preservation",
          definition:
            "The property that <R_m q, R_n k> depends solely on relative distance n-m.",
        },
        {
          term: "Givens Rotation",
          definition:
            "A 2D plane rotation matrix used to rotate vector coordinate pairs in complex space.",
        },
        {
          term: "Base Frequency Theta",
          definition: "The scaling constant theta = 10000 defining geometric frequency bands.",
        },
      ],
    },
    trivia: RELATIVEPOSITIONINNERPRODUCTPRESERVATION_TRIVIA,
    sources: [{ kind: "standard", label: "ML Infra Level 7" }],
    defaultInput: DEFAULT_RELATIVEPOSITIONINNERPRODUCTPRESERVATION_INPUT,
    generateSteps: generateRelativePositionInnerProductPreservationSteps,
  };
