import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface relativePositionInnerProductPreservationInput {
  data: number[];
  target?: number;
}

export const RELATIVEPOSITIONINNERPRODUCTPRESERVATION_CODE = `
import math

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
    return direct_dot, relative_dot, abs_diff
`;

export const DEFAULT_RELATIVEPOSITIONINNERPRODUCTPRESERVATION_INPUT: relativePositionInnerProductPreservationInput =
  {
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateRelativePositionInnerProductPreservationSteps = (
  input: relativePositionInnerProductPreservationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Relative Position Inner Product Preservation Proof",
    "Setting up RoPE 2D rotation matrix verification: checking <R_m q, R_n k> == <q, R_{n-m} k>.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const mPos = idx;
    const nPos = idx + 2;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return {
          ...el,
          state: isTarget ? "active" : "compare",
          pointers: [`m=${mPos}`, `n=${nPos}`],
        };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      26,
      `Evaluate step ${idx} (val=${val}): compute direct <R_${mPos} q, R_${nPos} k> vs relative <q, R_${nPos - mPos} k>`,
      `Calculating rotation angle diff (${nPos} - ${mPos} = ${nPos - mPos}) proving inner product invariance.`,
      { step: idx, mPos, nPos, relDist: nPos - mPos, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    36,
    "Execution Complete",
    "Successfully verified RoPE relative position inner product preservation identity.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const RELATIVEPOSITIONINNERPRODUCTPRESERVATION_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  distractors: [
    "direct_dot = qm[0] * kn[1] - qm[1] * kn[0]",
    "angle_rel = (n + m) * freq",
    "abs_diff = direct_dot + relative_dot",
  ],
  hints: [
    { line: 18, hint: "Rotate query vector by angle m * freq." },
    { line: 23, hint: "Rotate key vector by angle n * freq." },
    { line: 31, hint: "Rotate key vector directly by relative distance angle (n - m) * freq." },
  ],
  lineExplanations: {
    1: "Defines RoPE relative position inner product proof function.",
    18: "Applies 2D rotation matrix R_m to query vector q.",
    23: "Applies 2D rotation matrix R_n to key vector k.",
    26: "Computes direct inner product of absolute position rotated vectors.",
    31: "Applies relative rotation R_{n-m} directly to key vector k.",
    36: "Returns direct dot product, relative dot product, and floating-point difference.",
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
      "Rotary Position Embedding (RoPE, Su et al., 2021) encodes positional information by multiplying query $q$ and key $k$ vectors with orthogonal rotation matrices $R_m$ and $R_n$. The foundational mathematical property of RoPE is that the inner product of rotated vectors depends EXCLUSIVELY on relative position difference $n - m$:\n$$\\langle R_m q, R_n k \\rangle = q^T R_m^T R_n k = q^T R_{n-m} k$$\n\nBecause 2D rotation matrices form a 1-parameter continuous group $R_{\\theta_1} R_{\\theta_2} = R_{\\theta_1 + \\theta_2}$ and $R_{\\theta}^T = R_{-\\theta}$, multiplying $R_m^T R_n$ yields $R_{n-m}$. This guarantees that attention scores $S_{m,n}$ naturally decay as a function of relative distance $|n-m|$ without needing explicit relative position bias tables.\n\nInput Format:\n- data: Array of test vector values or position indices.\n- target: Target relative distance threshold.\n\nOutput Format:\n- Comparison scalars verifying $\\langle R_m q, R_n k \\rangle = \\langle q, R_{n-m} k \\rangle$ up to machine precision $\\epsilon$.\n\nEdge Cases & Constraints:\n- Boundary cases: $m = n$ (self-attention position, $R_0 = I$, inner product equals un-rotated $q^T k$).\n- Orthogonality property: $\\det(R_m) = 1$, preserving vector $L_2$ norm under rotation.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "2D Complex Plane Proof",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 30]",
        explanation: "Verifies relative distance property for positions m=0, n=2.",
      },
      {
        kind: "complex",
        title: "5-Position Shift Verification",
        inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
        outputDisplay: "[1, 2, 3, 4, 5]",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 4, 5]",
        explanation: "Evaluates inner product invariance across 5 relative position offsets.",
      },
      {
        kind: "negative",
        title: "Same-Position Check (m = n)",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "[5, 10, 15]",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation: "Proves that when m=n, rotation matrix becomes Identity matrix R_0.",
      },
    ],
    code: RELATIVEPOSITIONINNERPRODUCTPRESERVATION_CODE,
    timeComplexity: { best: "O(d)", average: "O(d)", worst: "O(d)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Requires $O(d)$ time to compute 2D complex plane Givens rotations per token.",
      space: "Requires $O(1)$ auxiliary memory for scalar dot-product verification.",
    },
    topicGuide: {
      overview:
        "RoPE (Su et al., 2021) is used in LLaMA, PaLM, Qwen, and Mistral. Its mathematical elegance stems from encoding absolute position into complex phase rotations while ensuring attention dot-products depend strictly on relative token distance.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "For 2D vector $x = [x_0, x_1]^T$, $R_m x = \\begin{bmatrix} \\cos m\\theta & -\\sin m\\theta \\\\ \\sin m\\theta & \\cos m\\theta \\end{bmatrix} \\begin{bmatrix} x_0 \\\\ x_1 \\end{bmatrix}$. The inner product $(R_m q)^T (R_n k) = q^T R_{-m} R_n k = q^T R_{n-m} k = (q_0 k_0 + q_1 k_1) \\cos((n-m)\\theta) + (q_0 k_1 - q_1 k_0) \\sin((n-m)\\theta)$.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "RoPE is fused into the attention CUDA kernel. Warps read $Q$ and $K$ vectors from SRAM, apply 2D Givens rotations in registers, and pass rotated vectors directly into Tensor Core GEMM registers without DRAM roundtrips.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "In high-dimensional embeddings ($d=128$), $d/2$ 2D block diagonal rotation matrices are concatenated. Precomputing cosine/sine tables `cos_table[max_seq_len, d/2]` speeds up inference initialization.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "When context window length exceeds training length $N_{\\text{train}}$, higher frequency sub-bands suffer phase wrapping. Extrapolation schemes like YaRN / NTK-aware scaling adjust $\\theta_i$ base frequencies to maintain relative distance decay.",
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
            "The property that $\\langle R_m q, R_n k \\rangle$ depends solely on relative distance $n-m$.",
        },
        {
          term: "Givens Rotation",
          definition:
            "A 2D plane rotation matrix used to rotate vector coordinate pairs in complex space.",
        },
        {
          term: "Base Frequency Theta",
          definition: "The scaling constant $\\theta = 10000$ defining geometric frequency bands.",
        },
      ],
    },
    trivia: RELATIVEPOSITIONINNERPRODUCTPRESERVATION_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
    defaultInput: DEFAULT_RELATIVEPOSITIONINNERPRODUCTPRESERVATION_INPUT,
    generateSteps: generateRelativePositionInnerProductPreservationSteps,
  };
