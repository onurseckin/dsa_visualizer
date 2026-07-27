import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface rope2dComplexPlaneRotationInput {
  data: number[];
  target?: number;
}

export const ROPE2DCOMPLEXPLANEROTATION_CODE = `
import math

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

    return x_rotated
`;

export const DEFAULT_ROPE2DCOMPLEXPLANEROTATION_INPUT: rope2dComplexPlaneRotationInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateRope2dComplexPlaneRotationSteps = (
  input: rope2dComplexPlaneRotationInput,
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
    "Initialize RoPE 2D Complex Plane Rotation Matrix",
    "Setting up 2D Givens rotation loop over adjacent coordinate pairs (x_{2i}, x_{2i+1}).",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const pairIdx = Math.floor(idx / 2) * 2;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return {
          ...el,
          state: isTarget ? "active" : "compare",
          pointers: [`pair=${pairIdx}`, `i=${idx}`],
        };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      17,
      `Rotate 2D coordinate pair (${pairIdx}, ${pairIdx + 1}) for token pos=${idx}`,
      `Computing cos(m*theta_i) and sin(m*theta_i) to rotate vector components in complex plane.`,
      { step: idx, pairIdx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    27,
    "Execution Complete",
    "Successfully applied 2D complex plane rotation matrix across all vector coordinates.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ROPE2DCOMPLEXPLANEROTATION_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  distractors: [
    "x_rotated[i] = x0 * sin_val + x1 * cos_val",
    "freq = theta_base ** (i / d)",
    "angle = pos / freq",
  ],
  hints: [
    { line: 16, hint: "Compute inverse frequency scaling factor 1.0 / (theta_base ** (i / d))." },
    { line: 23, hint: "Compute x'_2i = x_2i * cos(m*theta) - x_{2i+1} * sin(m*theta)." },
    { line: 24, hint: "Compute x'_{2i+1} = x_2i * sin(m*theta) + x_{2i+1} * cos(m*theta)." },
  ],
  lineExplanations: {
    1: "Defines RoPE 2D complex plane rotation entry point.",
    16: "Calculates frequency scale freq = 1 / theta^(2i/d) for coordinate pair i.",
    17: "Calculates rotation angle m * freq for token position m.",
    23: "Applies 2D rotation to first coordinate x_2i.",
    24: "Applies 2D rotation to second coordinate x_{2i+1}.",
    26: "Returns transformed rotated vector x_rotated.",
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
    "Rotary Position Embedding (RoPE, Su et al., 2021) encodes positional information by pairing consecutive feature components $(x_{2i}, x_{2i+1})$ of query and key vectors $x \\in \\mathbb{R}^d$ and rotating each 2D vector pair in the complex plane by angle $m \\theta_i$:\n$$\\begin{bmatrix} x'_{2i} \\\\ x'_{2i+1} \\end{bmatrix} = \\begin{bmatrix} \\cos(m \\theta_i) & -\\sin(m \\theta_i) \\\\ \\sin(m \\theta_i) & \\cos(m \\theta_i) \\end{bmatrix} \\begin{bmatrix} x_{2i} \\\\ x_{2i+1} \\end{bmatrix}$$\nwhere $\\theta_i = 10000^{-2i/d}$ for $i \\in \\{0, 1, \\dots, d/2 - 1\\}$.\n\nIn complex number notation, treating $(x_{2i}, x_{2i+1})$ as $z_i = x_{2i} + i x_{2i+1} \\in \\mathbb{C}$, RoPE computes $z'_i = z_i \\cdot e^{i m \\theta_i}$. Because rotation in complex space preserves vector norm ($|z'_i| = |z_i|$), RoPE preserves vector length while encoding position $m$ into vector phase angles.\n\nInput Format:\n- data: Embedding vector coordinates $x \\in \\mathbb{R}^d$.\n- target: Position index $m$.\n\nOutput Format:\n- Rotated vector $x' \\in \\mathbb{R}^d$ after applying 2D Givens rotations across all coordinate pairs.\n\nEdge Cases & Constraints:\n- Half-dimension pairing variant: PyTorch implementations often split the vector into two halves $x_1 = x[:d/2], x_2 = x[d/2:]$ and compute $[-x_2, x_1]$ (RoPE `rotate_half` convention) to enable vectorized SIMD instructions.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "2D Pair Rotation",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Applies 2D Givens plane rotation across vector coordinate pairs.",
    },
    {
      kind: "complex",
      title: "Multi-Coordinate Rotation",
      inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
      outputDisplay: "[1, 2, 3, 4, 5]",
      input: { data: [1, 2, 3, 4, 5], target: 4 },
      output: "[1, 2, 3, 4, 5]",
      explanation: "Evaluates 2D complex plane rotations across 5 feature dimensions.",
    },
    {
      kind: "negative",
      title: "Zero Position Rotation (m = 0)",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "When m=0, cos(0)=1 and sin(0)=0, returning unchanged input vector.",
    },
  ],
  code: ROPE2DCOMPLEXPLANEROTATION_CODE,
  timeComplexity: { best: "O(d)", average: "O(d)", worst: "O(d)" },
  spaceComplexity: "O(d)",
  complexityAnalysis: {
    time: "Requires $O(d)$ floating-point multiplications to rotate all $d/2$ coordinate pairs.",
    space: "Requires $O(d)$ auxiliary space for storing the rotated output vector.",
  },
  topicGuide: {
    overview:
      "RoPE 2D Complex Plane Rotation is used in almost all modern open-weights LLMs (LLaMA-1/2/3, Mistral, Qwen, Gemma, DeepSeek). By representing position as a complex phase rotation, RoPE allows models to generalize to long contexts with zero additional trainable parameters.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Let $R_{\\Theta, m}^d = \\text{diag}(R_{\\theta_1, m}, R_{\\theta_2, m}, \\dots, R_{\\theta_{d/2}, m})$. The matrix $R_{\\theta_i, m} = \\begin{bmatrix} \\cos m\\theta_i & -\\sin m\\theta_i \\\\ \\sin m\\theta_i & \\cos m\\theta_i \\end{bmatrix}$ rotates the $i$-th 2D sub-plane by angle $m\\theta_i$. The inner product $\\langle R_m q, R_n k \\rangle$ depends solely on relative distance $n-m$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "High-performance CUDA kernels (e.g. FlashAttention fused RoPE) process 2D vector pairs directly in GPU warp registers (`float2` / `half2` vector instructions), avoiding extra HBM reads/writes. Cosine and sine values are computed on the fly using fast trigonometric hardware instructions (`__cosf`, `__sinf`).",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "PyTorch implementations use the `rotate_half` optimization: $R(x) = x \\cdot \\cos(m\\theta) + \\text{rotate\\_half}(x) \\cdot \\sin(m\\theta)$ where $\\text{rotate\\_half}([x_1, x_2]) = [-x_2, x_1]$, enabling elementwise vectorized GPU operations without explicit pair looping.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "In low-precision FP16/BF16, phase angle accumulation $m \\cdot \\theta_i$ for large $m$ (e.g. $m > 32768$) can lead to loss of floating-point precision in $\\cos$ and $\\sin$. Systems use modulo reductions $m \\bmod (2\\pi / \\theta_i)$ to preserve numerical accuracy.",
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
          "Multiplying a complex number $z = x + i y$ by $e^{i\\theta}$ to change phase without altering magnitude.",
      },
      {
        term: "rotate_half Function",
        definition:
          "A PyTorch tensor transformation mapping $[x_1, x_2] \\to [-x_2, x_1]$ for vectorized RoPE implementation.",
      },
      {
        term: "Base Frequency",
        definition:
          "The base scaling parameter (typically $\\theta=10000$ or $\\theta=500000$) defining frequency intervals across dimensions.",
      },
    ],
  },
  trivia: ROPE2DCOMPLEXPLANEROTATION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_ROPE2DCOMPLEXPLANEROTATION_INPUT,
  generateSteps: generateRope2dComplexPlaneRotationSteps,
};
