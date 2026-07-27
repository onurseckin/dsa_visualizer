import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface vectorDotProductMacInput {
  vec_a?: number[];
  vec_b?: number[];
  bias?: number;
}

export const VECTORDOTPRODUCTMAC_CODE = `def vector_dot_product_mac(vec_a, vec_b, bias=0):
    """
    Computes multiply-accumulate vector dot product y = sum(a_i * b_i) + bias.
    """
    accumulator = bias
    for a, b in zip(vec_a, vec_b):
        accumulator += a * b
    return accumulator`;

export const DEFAULT_VECTORDOTPRODUCTMAC_INPUT: vectorDotProductMacInput = {
  vec_a: [2, 4, 1, 3, 5, 2, 3],
  vec_b: [1, 3, 2, 4, 1, 3, 2],
  bias: 5,
};

export const generateVectorDotProductMacSteps = (
  input: vectorDotProductMacInput,
): AlgorithmStep[] => {
  const vec_a = input.vec_a ?? DEFAULT_VECTORDOTPRODUCTMAC_INPUT.vec_a!;
  const vec_b = input.vec_b ?? DEFAULT_VECTORDOTPRODUCTMAC_INPUT.vec_b!;
  const bias = input.bias ?? DEFAULT_VECTORDOTPRODUCTMAC_INPUT.bias!;

  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const n = Math.min(vec_a.length, vec_b.length);

  const partialProducts: number[] = [];

  const createMatrixSnapshot = (
    activeIdx?: number,
    completed = false,
    titleExtra = "",
  ) => {
    const cells: MatrixCellItem[] = [];
    // Row 0: Vector A
    // Row 1: Vector B
    // Row 2: Partial Products
    for (let c = 0; c < n; c++) {
      let stateA: "default" | "active" | "compared" | "sorted" | "pivot" | "inactive" = "default";
      let stateB: "default" | "active" | "compared" | "sorted" | "pivot" | "inactive" = "default";
      let stateP: "default" | "active" | "compared" | "sorted" | "pivot" | "inactive" = "default";

      if (completed) {
        stateA = "sorted";
        stateB = "sorted";
        stateP = "sorted";
      } else if (c === activeIdx) {
        stateA = "active";
        stateB = "compared";
        stateP = "pivot";
      } else if (c < (activeIdx ?? 0)) {
        stateA = "sorted";
        stateB = "sorted";
        stateP = "sorted";
      }

      cells.push({
        row: 0,
        col: c,
        value: vec_a[c],
        label: `a[${c}]`,
        state: stateA,
      });

      cells.push({
        row: 1,
        col: c,
        value: vec_b[c],
        label: `b[${c}]`,
        state: stateB,
      });

      cells.push({
        row: 2,
        col: c,
        value: partialProducts[c] !== undefined ? partialProducts[c] : "-",
        label: partialProducts[c] !== undefined ? `a*b=${partialProducts[c]}` : undefined,
        state: stateP,
      });
    }

    return {
      kind: "matrix" as const,
      rows: 3,
      cols: n,
      rowHeaders: ["Vector A", "Vector B", "MAC Product"],
      colHeaders: Array.from({ length: n }, (_, i) => `Idx ${i}`),
      title: `Vector MAC Hardware Engine (${n} Elements, Bias=${bias})${titleExtra}`,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeIdx?: number,
    completed = false,
    titleExtra = "",
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: createMatrixSnapshot(activeIdx, completed, titleExtra),
      auxiliaryState: {
        customState: {
          vec_a: `[${vec_a.join(", ")}]`,
          vec_b: `[${vec_b.join(", ")}]`,
          bias: String(bias),
          accumulator: String(variables.accumulator ?? bias),
        },
      },
      variables,
    });
  };

  // Line 1: Setup
  addStep(
    1,
    "Initialize Vector Multiply-Accumulate (MAC) Engine",
    `Vectors vec_a and vec_b length N = ${n}, initial bias = ${bias}.`,
    { n, bias },
  );

  // Line 1 (detail): Validate input dimensions
  addStep(
    1,
    `Verify Vector Dimensions: len(vec_a) = ${vec_a.length}, len(vec_b) = ${vec_b.length}`,
    "Ensure paired vector elements align for hardware MAC vector execution.",
    { len_a: vec_a.length, len_b: vec_b.length, n, bias },
  );

  // Line 5: accumulator = bias
  let accumulator = bias;
  addStep(
    5,
    `Initialize Accumulator Register: accumulator = bias (${bias})`,
    `Set MAC accumulator register to initial scalar bias value (${bias}).`,
    { accumulator, bias },
  );

  // Loop over paired elements
  for (let i = 0; i < n; i++) {
    const a = vec_a[i];
    const b = vec_b[i];

    addStep(
      6,
      `Fetch Vector Pair at Index ${i}: a = ${a}, b = ${b}`,
      `Load paired scalar elements a = vec_a[${i}] and b = vec_b[${i}] into hardware MAC registers.`,
      { i, a, b, accumulator },
      i,
    );

    const prod = a * b;
    partialProducts.push(prod);

    addStep(
      6,
      `Compute Element Product: a * b = ${a} * ${b} = ${prod}`,
      `Execute hardware multiplication unit for index ${i}.`,
      { i, a, b, prod, accumulator },
      i,
    );

    accumulator += prod;

    addStep(
      7,
      `Execute MAC Accumulate: accumulator += ${prod} -> accumulator = ${accumulator}`,
      `Add element product ${prod} into running accumulator register total (${accumulator}).`,
      { i, a, b, prod, accumulator },
      i,
    );
  }

  // Summary accumulation step
  addStep(
    7,
    `MAC Vector Loop Complete: Total Accumulator = ${accumulator}`,
    `Successfully accumulated all ${n} element products plus initial bias (${bias}).`,
    { n, bias, total_products_sum: accumulator - bias, accumulator },
    undefined,
    true,
  );

  // Line 8: Return accumulator
  addStep(
    8,
    `Return Final MAC Result: ${accumulator}`,
    `Return accumulated scalar total y = sum(a_i * b_i) + bias = ${accumulator}.`,
    { accumulator, completed: true },
    undefined,
    true,
    " - Complete",
  );

  return steps;
};

export const VECTORDOTPRODUCTMAC_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "accumulator = 0",
    "for a in vec_a: accumulator += a",
    "return accumulator * bias",
  ],
  hints: [
    { line: 5, hint: "Accumulator must be initialized to the initial bias scalar value." },
    { line: 6, hint: "zip(vec_a, vec_b) pairs corresponding elements from vec_a and vec_b." },
    { line: 7, hint: "MAC operation adds the product a * b directly into accumulator." },
  ],
  lineExplanations: {
    1: "Defines vector multiply-accumulate (MAC) dot product function.",
    2: "Starts docstring explaining hardware MAC vector operation contract.",
    3: "Describes mathematical formula: y = sum(a_i * b_i) + bias.",
    4: "Ends function docstring.",
    5: "Initializes accumulator register to initial scalar bias value.",
    6: "Iterates through paired scalar elements a and b from input vectors vec_a and vec_b.",
    7: "Executes hardware MAC operation: accumulator += a * b.",
    8: "Returns accumulated scalar MAC dot product total.",
  },
};

export const vectorDotProductMac: AlgorithmDefinition<vectorDotProductMacInput> = {
  id: "vector-dot-product-mac",
  title: "Vector Multiply-Accumulate (MAC) Engine",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "Multiply-Accumulate (MAC) is the fundamental atomic hardware instruction performing $y = (a \\times b) + c$ in GPU Tensor Cores, Google TPUs, Apple Neural Engines, and Digital Signal Processors (DSPs). Evaluating vector dot products with optional scalar bias accumulation forms the baseline mathematical building block for matrix multiplication (GEMM) and neural network linear layers:\n$$\\text{Accumulator} = \\text{bias} + \\sum_{i=0}^{N-1} a_i \\times b_i$$\nHardware Fused Multiply-Add (FMA) units execute the multiplication and addition steps in a single clock cycle with single rounding, improving numerical accuracy and doubling arithmetic throughput compared to separate multiply and add instructions.",
  constraints: [
    "1 <= vec_a.length <= 1000",
    "vec_b.length == vec_a.length",
    "-10^9 <= vec_a[i], vec_b[i] <= 10^9",
  ],
  examples: [
    {
      kind: "basic",
      title: "Vector Dot Product with Bias",
      inputDisplay: "vec_a = [2, 4, 1, 3, 5, 2, 3], vec_b = [1, 3, 2, 4, 1, 3, 2], bias = 5",
      outputDisplay: "54",
      input: DEFAULT_VECTORDOTPRODUCTMAC_INPUT,
      output: "54",
      explanation: "Computes 5 + (2*1 + 4*3 + 1*2 + 3*4 + 5*1 + 2*3 + 3*2) = 5 + 49 = 54.",
    },
    {
      kind: "complex",
      title: "Zero Bias Dot Product",
      inputDisplay: "vec_a = [3, 5], vec_b = [2, 4], bias = 0",
      outputDisplay: "26",
      input: {
        vec_a: [3, 5],
        vec_b: [2, 4],
        bias: 0,
      },
      output: "26",
      explanation: "Computes (3*2 + 5*4) = 6 + 20 = 26.",
    },
  ],
  code: VECTORDOTPRODUCTMAC_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "O(N) linear time to iterate across N paired vector elements.",
    space: "O(1) auxiliary space stored in a single accumulator register.",
  },
  topicGuide: {
    overview:
      "The Multiply-Accumulate (MAC) operation is the primitive arithmetic unit powering artificial intelligence hardware across modern computing architectures. Every matrix multiplication (GEMM) kernel reduces down to millions of parallel MAC instructions.\n\nIn GPU architectures (e.g., NVIDIA H100 Tensor Cores, AMD Instinct MI300), specialized hardware Execution Units perform $16 \\times 16$ or $32 \\times 32$ matrix MAC operations per clock cycle, achieving multi-petaflop throughput.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Neural network forward passes spend over $90\\%$ of execution cycles performing linear dot products $\\mathbf{y} = W \\mathbf{x} + \\mathbf{b}$. Implementing MAC as a single hardware primitive (Fused Multiply-Add / FMA) eliminates intermediate memory writes to registers between multiplication and addition, cutting latency in half.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "MAC units power linear neural layers, 1D/2D convolutions, self-attention $Q K^T$ matrix products, Digital Signal Processing (DSP) FIR/IIR filters, and graphics transformation pipelines.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "1. Initialize accumulator $= \\text{bias}$.\n2. Iterate through vector pairs $(a_i, b_i)$.\n3. Multiply $a_i \\times b_i$.\n4. Add product to accumulator: $\\text{acc} \\leftarrow \\text{acc} + a_i \\times b_i$.\n5. Return final scalar total after all elements are processed.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "When accumulating low-precision floating point numbers (such as FP16 or FP8), summing many small numbers into a FP16 accumulator causes precision loss (catastrophic cancellation). Hardware Tensor Cores mitigate this by reading FP16/FP8 inputs but maintaining a high-precision FP32 accumulator register.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(N)$ FLOPs ($2 \\times N$ floating point operations). Space Complexity: $\\mathcal{O}(1)$ auxiliary register space.",
      },
    ],
    keyTerms: [
      {
        term: "MAC Operation",
        definition:
          "Multiply-Accumulate hardware instruction computing y = (a * b) + c in a single cycle.",
      },
      {
        term: "Fused Multiply-Add (FMA)",
        definition:
          "Hardware execution unit executing combined multiplication and addition with a single rounding step.",
      },
      {
        term: "Accumulator Register",
        definition:
          "High-precision hardware register holding running sum totals during dot product execution.",
      },
      {
        term: "Mixed-Precision Compute",
        definition:
          "Executing low-precision inputs (FP16/FP8) while accumulating into high-precision registers (FP32).",
      },
    ],
  },
  trivia: VECTORDOTPRODUCTMAC_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_VECTORDOTPRODUCTMAC_INPUT,
  generateSteps: generateVectorDotProductMacSteps,
};
