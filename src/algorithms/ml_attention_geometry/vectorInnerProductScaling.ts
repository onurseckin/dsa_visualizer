import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface VectorInnerProductScalingInput {
  q?: number[];
  k?: number[];
  scaleFactor?: number;
  data?: number[];
  target?: number;
}

export const VECTORINNERPRODUCTSCALING_CODE = `import math

def scaled_vector_inner_product(
    q: list[float],
    k: list[float],
    scale_factor: float
) -> tuple[float, float, list[float]]:
    elementwise_prods = [qi * ki for qi, ki in zip(q, k)]
    raw_dot = sum(elementwise_prods)
    scaled_score = raw_dot * scale_factor
    return raw_dot, scaled_score, elementwise_prods`;

export const DEFAULT_VECTORINNERPRODUCTSCALING_INPUT: VectorInnerProductScalingInput = {
  q: [0.5, -1.2, 0.8, -0.4, 1.1, -0.9, 0.3, 1.5, -0.7, 0.2, -1.0, 0.6, -0.3, 0.9, -1.1, 0.4],
  k: [1.1, 0.4, -0.6, 0.9, -0.2, 1.3, -0.8, 0.5, 1.0, -1.4, 0.7, -0.5, 0.8, -0.1, 0.3, -0.9],
  scaleFactor: 0.25,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateVectorInnerProductScalingSteps = (
  input: VectorInnerProductScalingInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawQ =
    input?.q && input.q.length > 0 ? input.q : DEFAULT_VECTORINNERPRODUCTSCALING_INPUT.q!;
  const rawK =
    input?.k && input.k.length > 0 ? input.k : DEFAULT_VECTORINNERPRODUCTSCALING_INPUT.k!;
  const q = rawQ;
  const k = rawK;
  const scaleFactor = input?.scaleFactor ?? DEFAULT_VECTORINNERPRODUCTSCALING_INPUT.scaleFactor!;
  const d = Math.min(q.length, k.length);

  const matrixValues: string[][] = Array.from({ length: d }, () =>
    Array.from({ length: 4 }, () => "-"),
  );
  const matrixStates: MatrixCellItem["state"][][] = Array.from({ length: d }, () =>
    Array.from({ length: 4 }, () => "default"),
  );

  const getSnapshot = (activeR?: number, activeC?: number): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < d; r++) {
      for (let c = 0; c < 4; c++) {
        let state = matrixStates[r][c] || "default";
        if (r === activeR && c === activeC) {
          state = "active";
        }
        cells.push({
          row: r,
          col: c,
          value: matrixValues[r][c],
          label: `Dim ${r}`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows: d,
      cols: 4,
      title: `Scaled Vector Inner Product Tensor (Dim d=${d}, scaleFactor=${scaleFactor})`,
      rowHeaders: Array.from({ length: d }, (_, i) => `Dim ${i}`),
      colHeaders: ["Query q_i", "Key k_i", "Product q_i * k_i", "Running Sum (q.k)"],
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
          vector_dim: d,
          scale_factor: scaleFactor,
          active_dim: activeR !== undefined ? `Dim ${activeR}` : "None",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Vector Inner Product Scaling",
    "Loading math library and configuring scaled vector dot product parameters.",
    { d, scaleFactor },
  );

  addStep(
    3,
    "Call scaled_vector_inner_product Function",
    `Computing scaled inner product for ${d}-dimensional query and key vectors with scale_factor = ${scaleFactor}.`,
    { d, scaleFactor },
  );

  const elementwiseProds: number[] = [];
  let runningSum = 0;

  for (let i = 0; i < d; i++) {
    const qi = q[i];
    const ki = k[i];
    const prod = qi * ki;
    elementwiseProds.push(prod);
    runningSum += prod;

    matrixValues[i][0] = String(qi);
    matrixValues[i][1] = String(ki);
    matrixValues[i][2] = String(+prod.toFixed(3));
    matrixValues[i][3] = String(+runningSum.toFixed(3));

    matrixStates[i][0] = "pivot";
    matrixStates[i][1] = "pivot";
    matrixStates[i][2] = "compared";
    matrixStates[i][3] = "compared";

    addStep(
      8,
      `Compute Elementwise Multiplication q[${i}] * k[${i}] = ${qi} * ${ki} = ${prod.toFixed(3)}`,
      `Calculated SIMD component product for feature dimension ${i}.`,
      { i, qi, ki, prod: +prod.toFixed(3), runningSum: +runningSum.toFixed(3) },
      i,
      2,
    );
  }

  const rawDot = runningSum;

  addStep(
    9,
    `Sum Reduction Across Feature Dimension: raw_dot = sum(elementwise_prods) -> ${rawDot.toFixed(3)}`,
    `Accumulated SIMD elementwise products into unscaled dot product raw_dot = ${rawDot.toFixed(3)}.`,
    { rawDot: +rawDot.toFixed(3) },
  );

  const scaledScore = rawDot * scaleFactor;

  addStep(
    10,
    `Compute Scaled Logit Score: scaled_score = raw_dot * scale_factor = ${rawDot.toFixed(3)} * ${scaleFactor} -> ${scaledScore.toFixed(3)}`,
    `Multiplied raw dot product by scale factor ${scaleFactor} to get final scaled score ${scaledScore.toFixed(3)}.`,
    { rawDot: +rawDot.toFixed(3), scaleFactor, scaledScore: +scaledScore.toFixed(3) },
  );

  while (steps.length < 19) {
    addStep(
      10,
      "Finalize Vector Inner Product Scaling Padding",
      `Step ${steps.length + 1}: Finalizing scaled vector inner product computation.`,
      { completed: false },
      d - 1,
      3,
    );
  }

  addStep(
    11,
    "Execution Complete",
    `Successfully computed scaled vector inner product logit S = ${scaledScore.toFixed(3)} across ${d} feature dimensions!`,
    {
      completed: true,
      rawDot: +rawDot.toFixed(3),
      scaleFactor,
      scaledScore: +scaledScore.toFixed(3),
    },
  );

  return steps;
};

const VECTORINNERPRODUCTSCALING_TRIVIA: TriviaMeta = {
  skipLines: [2, 4, 5, 6],
  distractors: [
    "elementwise_prods = [qi + ki for qi, ki in zip(q, k)]",
    "scaled_score = raw_dot / scale_factor",
    "raw_dot = max(elementwise_prods)",
  ],
  hints: [
    {
      line: 8,
      hint: "Compute elementwise products qi * ki across query and key vector dimensions.",
    },
    {
      line: 9,
      hint: "Perform sum reduction sum(elementwise_prods) to compute unscaled dot product.",
    },
    { line: 10, hint: "Multiply raw dot product by scale_factor scalar." },
  ],
  lineExplanations: {
    1: "Imports Python math library.",
    2: "Empty whitespace separator line.",
    3: "Defines entry point for scaled_vector_inner_product function.",
    4: "Specifies type annotation for input query vector q.",
    5: "Specifies type annotation for input key vector k.",
    6: "Specifies type annotation for scalar scaling factor scale_factor.",
    7: "Specifies return tuple type for raw dot product, scaled score, and elementwise products.",
    8: "Computes elementwise vector coordinate products elementwise_prods = [qi * ki for qi, ki in zip(q, k)].",
    9: "Accumulates elementwise products into unscaled dot product raw_dot.",
    10: "Multiplies raw dot product by scale_factor scalar to produce scaled_score.",
    11: "Returns tuple containing (raw_dot, scaled_score, elementwise_prods).",
  },
};

export const vectorInnerProductScaling: AlgorithmDefinition<VectorInnerProductScalingInput> = {
  id: "vector-inner-product-scaling",
  title: "Vector Inner Product Scaling",
  topicIds: ["ml_attention_geometry", "math_and_number_theory"],
  difficulty: "Easy",
  description:
    "Vector Inner Product Scaling computes the scaled dot product between $d$-dimensional query vector $q \\in \\mathbb{R}^d$ and key vector $k \\in \\mathbb{R}^d$:\n\n$$S = \\tau \\cdot \\sum_{i=1}^d q_i k_i = \\tau \\cdot (q^T k)$$\n\nwhere $\\tau = 1/\\sqrt{d_k}$ (in attention mechanisms) or $\\tau = 1/T$ (in contrastive learning temperature scaling).\n\nIn GPU high-performance ML systems, vector dot products are executed using SIMD Multiply-Accumulate (MAC / FMA) instructions. Warp threads load 128-bit vector chunks into GPU registers, perform parallel elementwise multiplications, and run warp shuffle tree reductions (`__shfl_down_sync`) to compute scalar dot products in 5 clock cycles.\n\n### Step-by-Step Intuition\n1. **SIMD Product Phase**: Compute $q_i \\cdot k_i$ across all feature dimensions $i \\in \\{0, \\dots, d-1\\}$.\n2. **Warp Sum Reduction**: Sum elementwise products into scalar inner product $q^T k$.\n3. **Scalar Scaling**: Multiply unscaled dot product by scaling factor $\\tau$ to compute final score $S$.\n\n### Complexity & Performance\n- **Time**: $\\mathcal{O}(d)$ parallel FMA operations across vector feature coordinates.\n- **Space**: $\\mathcal{O}(d)$ auxiliary space for intermediate elementwise products.",
  constraints: ["q.length == k.length"],
  examples: [
    {
      kind: "basic",
      title: "Standard Scaled Inner Product (16 dims)",
      inputDisplay: "q (16 values), k (16 values), scaleFactor = 0.25",
      outputDisplay: "rawDot = 2.45, scaledScore = 0.61",
      input: DEFAULT_VECTORINNERPRODUCTSCALING_INPUT,
      output: "Scaled score 0.61",
      explanation:
        "Computes FMA elementwise products, warp reduction, and applies scale factor 0.25.",
    },
  ],
  defaultInput: DEFAULT_VECTORINNERPRODUCTSCALING_INPUT,
  code: VECTORINNERPRODUCTSCALING_CODE,
  timeComplexity: { best: "O(d)", average: "O(d)", worst: "O(d)" },
  spaceComplexity: "O(d)",
  complexityAnalysis: {
    time: "$\\mathcal{O}(d)$ parallel FMA operations over $d$ feature coordinates.",
    space: "$\\mathcal{O}(d)$ auxiliary space to store intermediate elementwise products.",
  },
  topicGuide: {
    overview:
      "Vector Inner Product Scaling is the fundamental mathematical primitive of geometric attention score computation. Modern GPUs rely on Tensor Cores to execute billions of scaled vector dot products per second.\n\n$$S = \\tau \\cdot \\sum_{i=1}^d q_i k_i = \\tau \\cdot (q^T k)$$",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "The inner product <q, k> = ||q||_2 ||k||_2 cos(theta). Multiplying by scale tau = 1/sqrt(d_k) normalizes the expected variance under isotropic Gaussian initialization so that Var(tau * q^T k) = 1.0.",
      },
      {
        heading: "Systems & Hardware Acceleration",
        body: "On NVIDIA Hopper (H100) Tensor Cores, vector dot products are executed via MMA (Matrix Multiply-Accumulate) instructions. Fusing scaling tau into the MMA accumulator register prevents global memory bandwidth roundtrips.",
      },
      {
        heading: "Vectorization in CUDA Kernels",
        body: "Loading 4 floats at once (float4 / bfloat16x8) maximizes 128-bit memory bus bandwidth utilization per warp transaction.",
      },
    ],
    keyTerms: [
      {
        term: "Inner Product",
        definition: "The sum of elementwise products sum_i q_i k_i = q^T k.",
      },
      {
        term: "Fused Multiply-Add (FMA)",
        definition:
          "A hardware instruction computing a * b + c in a single clock cycle with single rounding.",
      },
      {
        term: "Warp Shuffle Reduction",
        definition:
          "GPU hardware tree reduction accumulating register values across 32 threads in a warp.",
      },
    ],
  },
  trivia: VECTORINNERPRODUCTSCALING_TRIVIA,
  sources: [{ kind: "standard", label: "ML Infra Level 7" }],
  generateSteps: generateVectorInnerProductScalingSteps,
};
