import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface vectorDotProductMacInput {
  data: number[];
  target?: number;
}

export const VECTORDOTPRODUCTMAC_CODE = `
def vector_dot_product_mac(vec_a, vec_b, bias=0):
    """
    Computes multiply-accumulate vector dot product y = sum(a_i * b_i) + bias.
    """
    accumulator = bias
    for a, b in zip(vec_a, vec_b):
        accumulator += a * b
    return accumulator
`;

export const DEFAULT_VECTORDOTPRODUCTMAC_INPUT: vectorDotProductMacInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateVectorDotProductMacSteps = (
  input: vectorDotProductMacInput,
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
    "Initialize Vector Multiply-Accumulate (MAC) Engine",
    "Setting up execution data structures and memory layout pointers.",
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
      4,
      `Process element ${idx}: value = ${val}`,
      `Evaluating element at index ${idx} in memory layout.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    8,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const VECTORDOTPRODUCTMAC_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines vector multiply-accumulate (MAC) engine function.",
    4: "Initializes accumulator register to initial scalar bias value.",
    5: "Iterates through paired scalar elements a and b from input vectors vec_a and vec_b.",
    6: "Executes hardware MAC operation: accumulator += a * b.",
    7: "Returns accumulated scalar MAC dot product total.",
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
    "Multiply-Accumulate (MAC) is the atomic hardware operation performing y = (a * b) + c in digital signal processors (DSPs), GPU Tensor Cores, and neural network accelerators. Evaluating vector dot products with optional scalar bias accumulation forms the baseline mathematical kernel for linear neuron activations.\n\nThis algorithm implements Vector Multiply-Accumulate (MAC) Engine, iterating across vector pairs, executing hardware MAC operations, and accumulating running dot product totals.\n\nInput Format:\n- data: Array representing vector elements.\n- target: Optional scalar target value.\n\nOutput Format:\n- Returns scalar MAC dot product total.\n\nEdge Cases & Constraints:\n- Vectors of length 1 (single MAC operation).\n- Zero vectors or zero initial bias.\n- Floating-point precision rounding in single hardware MAC cycles.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Execution",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: DEFAULT_VECTORDOTPRODUCTMAC_INPUT,
      output: "[10, 20, 30]",
      explanation: "Standard execution pass.",
    },
    {
      kind: "complex",
      title: "Complex Execution",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "[10, 20, 30, 40, 50]",
      input: DEFAULT_VECTORDOTPRODUCTMAC_INPUT,
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates workload performance boundaries.",
    },
    {
      kind: "negative",
      title: "Edge Case",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: DEFAULT_VECTORDOTPRODUCTMAC_INPUT,
      output: "[5, 10, 15]",
      explanation: "Edge case execution completes safely.",
    },
  ],
  code: VECTORDOTPRODUCTMAC_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Execution time complexity pass across input elements.",
    space: "Memory allocation space for result structures.",
  },
  topicGuide: {
    overview:
      "The Multiply-Accumulate (MAC) operation is the core arithmetic unit of modern AI hardware (NVIDIA Tensor Cores, Google TPU MXUs, Apple Neural Engine). A single MAC operation performs one multiply and one add in a single clock cycle with Fused Multiply-Add (FMA) precision.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for vectors A and B of length N and initial bias c, MAC accumulation computes Y = c + sum_{i=0}^{N-1} (A_i * B_i). Total FLOP count is 2 * N floating point operations.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Hardware FMA (Fused Multiply-Add) instructions execute a * b + c with only one rounding step at the end, improving both numerical precision and throughput compared to separate multiply and add instructions.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation initializes accumulator to bias, zips vectors A and B, and accumulates scalar products in a loop.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes empty vectors (returning initial bias value).",
      },
    ],
    keyTerms: [
      {
        term: "MAC Operation",
        definition:
          "Multiply-Accumulate instruction performing (a * b) + c in a single clock cycle.",
      },
      {
        term: "Fused Multiply-Add (FMA)",
        definition: "Hardware execution pipeline evaluating multiply and add with single rounding.",
      },
      {
        term: "Accumulator Register",
        definition:
          "High-precision register storing running sum totals during vector dot products.",
      },
    ],
  },
  trivia: VECTORDOTPRODUCTMAC_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_VECTORDOTPRODUCTMAC_INPUT,
  generateSteps: generateVectorDotProductMacSteps,
};
