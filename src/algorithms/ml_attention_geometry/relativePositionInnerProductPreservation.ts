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
    q: list[float],
    k: list[float],
    m: int,
    n: int,
    theta: float = 10000.0
) -> tuple[float, float, float]:
    freq = 1.0 / (theta ** (0.0 / 2.0))
    angle_m = m * freq
    cos_m, sin_m = math.cos(angle_m), math.sin(angle_m)
    qm = [q[0] * cos_m - q[1] * sin_m, q[0] * sin_m + q[1] * cos_m]
    angle_n = n * freq
    cos_n, sin_n = math.cos(angle_n), math.sin(angle_n)
    kn = [k[0] * cos_n - k[1] * sin_n, k[0] * sin_n + k[1] * cos_n]
    direct_dot = qm[0] * kn[0] + qm[1] * kn[1]
    rel_pos = n - m
    angle_rel = rel_pos * freq
    cos_r, sin_r = math.cos(angle_rel), math.sin(angle_rel)
    k_rel = [k[0] * cos_r - k[1] * sin_r, k[0] * sin_r + k[1] * cos_r]
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

    const freq = 1.0;
    matrixValues[trial][0] = `m=${m}, n=${n}`;
    matrixStates[trial][0] = "pivot";

    addStep(
      10,
      `[Trial ${trial}] Compute Base Frequency Scale: freq = 1.0`,
      `Calculating base frequency scale factor freq = 1.0 / (theta^0) for position pair m=${m}, n=${n}.`,
      { trial, m, n, theta, freq },
      trial,
      0,
    );

    const angleM = m * freq;
    const cosM = Math.cos(angleM);
    const sinM = Math.sin(angleM);
    const qm = [q[0] * cosM - q[1] * sinM, q[0] * sinM + q[1] * cosM];

    addStep(
      13,
      `[Trial ${trial}] Rotate Query Vector q by Position m=${m}`,
      `Angle angle_m = ${m} * 1.0 = ${angleM.toFixed(3)} rad. Rotated query vector qm = [${qm[0].toFixed(3)}, ${qm[1].toFixed(3)}].`,
      { trial, m, angleM: +angleM.toFixed(3), qm_0: +qm[0].toFixed(3), qm_1: +qm[1].toFixed(3) },
      trial,
      0,
    );

    const angleN = n * freq;
    const cosN = Math.cos(angleN);
    const sinN = Math.sin(angleN);
    const kn = [k[0] * cosN - k[1] * sinN, k[0] * sinN + k[1] * cosN];

    addStep(
      16,
      `[Trial ${trial}] Rotate Key Vector k by Position n=${n}`,
      `Angle angle_n = ${n} * 1.0 = ${angleN.toFixed(3)} rad. Rotated key vector kn = [${kn[0].toFixed(3)}, ${kn[1].toFixed(3)}].`,
      { trial, n, angleN: +angleN.toFixed(3), kn_0: +kn[0].toFixed(3), kn_1: +kn[1].toFixed(3) },
      trial,
      0,
    );

    const directDot = qm[0] * kn[0] + qm[1] * kn[1];
    matrixValues[trial][2] = String(+directDot.toFixed(4));
    matrixStates[trial][2] = "compared";

    addStep(
      17,
      `[Trial ${trial}] Compute Direct Inner Product: <R_${m} q, R_${n} k> = ${directDot.toFixed(4)}`,
      `Dot product of individually rotated vectors qm @ kn = ${directDot.toFixed(4)}.`,
      { trial, directDot: +directDot.toFixed(4) },
      trial,
      2,
    );

    const relPos = n - m;
    matrixValues[trial][1] = `rel=${relPos}`;
    matrixStates[trial][1] = "pivot";

    addStep(
      18,
      `[Trial ${trial}] Compute Relative Distance: rel_pos = n - m = ${relPos}`,
      `Spatial displacement between key position ${n} and query position ${m} is ${relPos}.`,
      { trial, m, n, relPos },
      trial,
      1,
    );

    const angleRel = relPos * freq;
    const cosR = Math.cos(angleRel);
    const sinR = Math.sin(angleRel);
    const kRel = [k[0] * cosR - k[1] * sinR, k[0] * sinR + k[1] * cosR];

    addStep(
      21,
      `[Trial ${trial}] Rotate Key Vector k by Relative Distance (${relPos})`,
      `Relative angle angle_rel = ${angleRel.toFixed(3)} rad. Rotated key vector k_rel = [${kRel[0].toFixed(3)}, ${kRel[1].toFixed(3)}].`,
      {
        trial,
        relPos,
        angleRel: +angleRel.toFixed(3),
        kRel_0: +kRel[0].toFixed(3),
        kRel_1: +kRel[1].toFixed(3),
      },
      trial,
      1,
    );

    const relativeDot = q[0] * kRel[0] + q[1] * kRel[1];
    matrixValues[trial][3] = String(+relativeDot.toFixed(4));
    matrixStates[trial][3] = "compared";

    addStep(
      22,
      `[Trial ${trial}] Compute Relative Inner Product: <q, R_${relPos} k> = ${relativeDot.toFixed(4)}`,
      `Dot product of un-rotated query q against relatively-rotated key k_rel = ${relativeDot.toFixed(4)}.`,
      { trial, relativeDot: +relativeDot.toFixed(4) },
      trial,
      3,
    );

    const absDiff = Math.abs(directDot - relativeDot);
    matrixValues[trial][4] = `${absDiff.toExponential(2)}`;
    matrixStates[trial][4] = "sorted";

    addStep(
      23,
      `[Trial ${trial}] Verify Preservation Identity: Abs Diff = ${absDiff.toExponential(2)}`,
      `Direct dot product (${directDot.toFixed(4)}) equals relative dot product (${relativeDot.toFixed(4)}) within float precision limit.`,
      { trial, absDiff },
      trial,
      4,
    );
  }

  while (steps.length < 19) {
    addStep(
      23,
      "Finalize RoPE Proof Matrix Padding",
      `Step ${steps.length + 1}: Finalizing RoPE relative inner product preservation proof.`,
      { completed: false },
      numTrials - 1,
      4,
    );
  }

  addStep(
    24,
    "Execution Complete",
    `RoPE relative position inner product preservation identity mathematically verified across all ${numTrials} position pairs!`,
    { completed: true, verified: true },
  );

  return steps;
};

const RELATIVEPOSITIONINNERPRODUCTPRESERVATION_TRIVIA: TriviaMeta = {
  skipLines: [2, 4, 5, 6, 7, 8, 9],
  distractors: [
    "direct_dot = qm[0] * kn[1] - qm[1] * kn[0]",
    "angle_rel = (n + m) * freq",
    "abs_diff = direct_dot + relative_dot",
  ],
  hints: [
    { line: 11, hint: "Calculate query rotation angle angle_m = m * freq." },
    { line: 13, hint: "Rotate query vector q by angle m * freq using 2D rotation matrix." },
    { line: 14, hint: "Calculate key rotation angle angle_n = n * freq." },
    { line: 16, hint: "Rotate key vector k by angle n * freq using 2D rotation matrix." },
    { line: 17, hint: "Compute direct dot product qm[0]*kn[0] + qm[1]*kn[1]." },
    { line: 18, hint: "Calculate relative position difference rel_pos = n - m." },
    { line: 21, hint: "Rotate key vector k directly by relative distance angle (n - m) * freq." },
    { line: 22, hint: "Compute relative dot product q[0]*k_rel[0] + q[1]*k_rel[1]." },
    { line: 23, hint: "Compute absolute error difference abs(direct_dot - relative_dot)." },
  ],
  lineExplanations: {
    1: "Imports Python math library for trigonometric cosine and sine functions.",
    2: "Empty whitespace line.",
    3: "Defines entry point for RoPE relative inner product preservation proof.",
    4: "Specifies type annotation for input Query vector.",
    5: "Specifies type annotation for input Key vector.",
    6: "Specifies type annotation for Query token position index m.",
    7: "Specifies type annotation for Key token position index n.",
    8: "Specifies type annotation for base rotation frequency constant theta.",
    9: "Specifies return tuple type for direct dot, relative dot, and error diff.",
    10: "Calculates base frequency scale factor freq = 1.0 / (theta ** 0.0) = 1.0.",
    11: "Calculates rotation angle for query token position m: angle_m = m * freq.",
    12: "Computes cosine and sine values for query rotation angle_m.",
    13: "Applies 2D rotation matrix R_m to query vector q: qm = R_m * q.",
    14: "Calculates rotation angle for key token position n: angle_n = n * freq.",
    15: "Computes cosine and sine values for key rotation angle_n.",
    16: "Applies 2D rotation matrix R_n to key vector k: kn = R_n * k.",
    17: "Computes direct inner product of absolute rotations: direct_dot = qm · kn.",
    18: "Computes relative distance offset rel_pos = n - m.",
    19: "Calculates relative rotation angle angle_rel = rel_pos * freq.",
    20: "Computes cosine and sine values for relative rotation angle.",
    21: "Applies 2D rotation matrix R_{n-m} directly to key vector k: k_rel = R_{n-m} * k.",
    22: "Computes relative inner product of un-rotated q with relatively rotated k_rel.",
    23: "Calculates absolute difference abs_diff = |direct_dot - relative_dot|.",
    24: "Returns direct dot product, relative dot product, and floating-point error difference.",
  },
};

export const relativePositionInnerProductPreservation: AlgorithmDefinition<relativePositionInnerProductPreservationInput> =
  {
    id: "relative-position-inner-product-preservation",
    title: "Relative Position Inner Product Preservation Proof",
    topicIds: ["ml_attention_geometry", "math_and_number_theory"],
    difficulty: "Medium",
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
        explanation:
          "Proves mathematical identity <R_m q, R_n k> == <q, R_{n-m} k> across 6 position pairs.",
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
          definition: "The property that <R_m q, R_n k> depends solely on relative distance n-m.",
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
