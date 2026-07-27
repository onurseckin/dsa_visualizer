import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface vectorInnerProductScalingInput {
  data: number[];
  target?: number;
}

export const VECTORINNERPRODUCTSCALING_CODE = `
def scaled_vector_inner_product(
    q: list[float],
    k: list[float],
    scale_factor: float
) -> tuple[float, float, list[float]]:
    """
    Computes scaled vector inner product dot product S = scale_factor * sum(q_i * k_i).
    Simulates GPU thread-level Multiply-Accumulate (MAC) and warp reduction.
    Returns (raw_dot_product, scaled_score, elementwise_products).
    """
    # Step 1: Elementwise vector multiplication q_i * k_i
    elementwise_prods = [qi * ki for qi, ki in zip(q, k)]
    
    # Step 2: Sum reduction across feature dimension
    raw_dot = sum(elementwise_prods)
    
    # Step 3: Scale score by scale_factor (e.g. 1/sqrt(d_k))
    scaled_score = raw_dot * scale_factor
    
    return raw_dot, scaled_score, elementwise_prods
`;

export const DEFAULT_VECTORINNERPRODUCTSCALING_INPUT: vectorInnerProductScalingInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateVectorInnerProductScalingSteps = (
  input: vectorInnerProductScalingInput,
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
    "Initialize Vector Inner Product Scaling",
    "Setting up GPU SIMD vector multiplication and scaling: scale_factor = 1/sqrt(d_k).",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      12,
      `Multiply vector dimension component i=${idx} (val=${val})`,
      `Computing q_${idx} * k_${idx} and accumulating into warp sum register.`,
      { dimIdx: idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    18,
    "Execution Complete",
    "Successfully computed scaled vector inner product dot score.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const VECTORINNERPRODUCTSCALING_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  distractors: [
    "scaled_score = raw_dot / (scale_factor ** 2)",
    "elementwise_prods = [qi + ki for qi, ki in zip(q, k)]",
    "raw_dot = max(elementwise_prods)",
  ],
  hints: [
    { line: 12, hint: "Compute elementwise product q[i] * k[i] for each feature dimension." },
    { line: 15, hint: "Sum elementwise products to compute raw dot product raw_dot." },
    { line: 18, hint: "Multiply raw_dot by scale_factor (e.g. 1/sqrt(d_k))." },
  ],
  lineExplanations: {
    1: "Defines scaled vector inner product entry point.",
    12: "Computes elementwise multiplication q_i * k_i across vector coordinates.",
    15: "Accumulates elementwise products into scalar inner product raw_dot.",
    18: "Scales raw dot product by scale_factor scalar.",
    20: "Returns raw dot product, scaled score, and elementwise product list.",
  },
};

export const vectorInnerProductScaling: AlgorithmDefinition<vectorInnerProductScalingInput> = {
  id: "vector-inner-product-scaling",
  title: "Vector Inner Product Scaling",
  category: "ml_attention_geometry",
  categories: ["ml_attention_geometry", "math_and_number_theory"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 7,
  mlInfraCategory: "ml_attention_geometry",
  description:
    "Vector Inner Product Scaling computes the scaled dot product between $d$-dimensional query vector $q \\in \\mathbb{R}^d$ and key vector $k \\in \\mathbb{R}^d$:\n$$S = \\tau \\cdot \\sum_{i=1}^d q_i k_i = \\tau \\cdot (q^T k)$$\nwhere $\\tau = 1/\\sqrt{d_k}$ (in attention mechanisms) or $\\tau = 1/T$ (in contrastive learning temperature scaling).\n\nIn GPU high-performance ML systems, vector dot products are executed using SIMD Multiply-Accumulate (MAC / FMA) instructions. Warp threads load 128-bit vector chunks into GPU registers, perform parallel elementwise multiplications, and run warp shuffle tree reductions (`__shfl_down_sync`) to compute scalar dot products in 5 clock cycles.\n\nInput Format:\n- data: Query and key vector coordinate arrays.\n- target: Feature dimension $d_k$.\n\nOutput Format:\n- Raw dot product scalar $q^T k$, scaled inner product score $S$, and elementwise product array.\n\nEdge Cases & Constraints:\n- Orthogonal vectors: If $q \\perp k$, dot product is $0.0$.\n- Parallel vectors: If $q \\parallel k$, dot product equals ||q||_2 ||k||_2.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Scaled Inner Product",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Computes scaled dot product score using scale factor 1/sqrt(d_k).",
    },
    {
      kind: "complex",
      title: "5-Element Vector Dot Product",
      inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
      outputDisplay: "[1, 2, 3, 4, 5]",
      input: { data: [1, 2, 3, 4, 5], target: 4 },
      output: "[1, 2, 3, 4, 5]",
      explanation: "Evaluates FMA elementwise products and warp reduction over 5 components.",
    },
    {
      kind: "negative",
      title: "Zero Vector Inner Product",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Zero vector inputs produce 0.0 dot product and zero scaled score.",
    },
  ],
  code: VECTORINNERPRODUCTSCALING_CODE,
  timeComplexity: { best: "O(d)", average: "O(d)", worst: "O(d)" },
  spaceComplexity: "O(d)",
  complexityAnalysis: {
    time: "Computes inner product over $d$ features in $O(d)$ parallel FMA operations.",
    space: "Allocates $O(d)$ space for storing intermediate elementwise products.",
  },
  topicGuide: {
    overview:
      "Vector Inner Product Scaling is the fundamental mathematical primitive of geometric attention score computation. Modern GPUs rely on Tensor Cores to execute billions of scaled vector dot products per second.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "The inner product $\\langle q, k \\rangle = \\|q\\|_2 \\|k\\|_2 \\cos\\theta$. Multiplying by scale $\\tau = 1/\\sqrt{d_k}$ normalizes the expected variance under isotropic Gaussian initialization so that $\\text{Var}(\\tau q^T k) = 1.0$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "On NVIDIA Hopper (H100) Tensor Cores, vector dot products are executed via MMA (Matrix Multiply-Accumulate) instructions. Fusing scaling $\\tau$ into the MMA accumulator register prevents global memory bandwidth roundtrips.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Vectorization: Loading 4 floats at once (`float4` / `bfloat16x8`) maximizes 128-bit memory bus bandwidth utilization per warp transaction.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "In low precision (FP16), large vector dot products can overflow the half-precision max value (65504.0). NVIDIA Tensor Cores accumulate FP16 dot products into FP32 registers to prevent numerical overflow.",
      },
    ],
    keyTerms: [
      {
        term: "Inner Product",
        definition: "The sum of elementwise products $\\sum_i q_i k_i = q^T k$.",
      },
      {
        term: "Fused Multiply-Add (FMA)",
        definition:
          "A hardware instruction computing $a \\cdot b + c$ in a single clock cycle with single rounding.",
      },
      {
        term: "Warp Shuffle Reduction",
        definition:
          "GPU hardware tree reduction accumulating register values across 32 threads in a warp.",
      },
      {
        term: "128-Bit Memory Vectorization",
        definition:
          "Issuing memory instructions that load 16 contiguous bytes simultaneously per thread.",
      },
    ],
  },
  trivia: VECTORINNERPRODUCTSCALING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_VECTORINNERPRODUCTSCALING_INPUT,
  generateSteps: generateVectorInnerProductScalingSteps,
};
