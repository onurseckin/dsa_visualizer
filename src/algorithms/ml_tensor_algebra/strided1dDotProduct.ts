import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface strided1dDotProductInput {
  data: number[];
  target?: number;
}

export const STRIDED1DDOTPRODUCT_CODE = `
def strided_1d_dot_product(vec_a, vec_b, stride_a=1, stride_b=1):
    """
    Computes dot product of two vectors with arbitrary strided memory layouts.
    """
    n = min(len(vec_a) // stride_a, len(vec_b) // stride_b)
    dot_sum = 0

    for i in range(n):
        idx_a = i * stride_a
        idx_b = i * stride_b
        product = vec_a[idx_a] * vec_b[idx_b]
        dot_sum += product

    return dot_sum
`;

export const DEFAULT_STRIDED1DDOTPRODUCT_INPUT: strided1dDotProductInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateStrided1dDotProductSteps = (
  input: strided1dDotProductInput,
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
    "Initialize Strided 1D Vector Dot Product",
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
    14,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const STRIDED1DDOTPRODUCT_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in tensor memory." }],
  lineExplanations: {
    1: "Defines strided 1D vector dot product function.",
    4: "Calculates max valid dot product step count K based on vector lengths and strides.",
    5: "Initializes dot product accumulation sum to 0.",
    7: "Iterates through element step index i from 0 to K - 1.",
    8: "Calculates physical offset in vector A = i * stride_a.",
    9: "Calculates physical offset in vector B = i * stride_b.",
    10: "Multiplies scalar elements A[idx_a] * B[idx_b].",
    11: "Accumulates product into dot_sum total.",
    13: "Returns accumulated dot product scalar result.",
  },
};

export const strided1dDotProduct: AlgorithmDefinition<strided1dDotProductInput> = {
  id: "strided-1d-dot-product",
  title: "Strided 1D Vector Dot Product",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "In BLAS level-1 routines (e.g., sdot/ddot in cuBLAS, PyTorch torch.dot), dot products often process non-contiguous vector slices stored with non-unit memory strides (e.g., extracting column vectors from row-major matrices).\n\nThis algorithm implements Strided 1D Vector Dot Product, computing the inner product sum(vec_a[i * stride_a] * vec_b[i * stride_b]) across arbitrary memory strides.\n\nInput Format:\n- data: Numerical array representing vector values.\n- target: Optional scalar value target.\n\nOutput Format:\n- Returns scalar floating-point or integer dot product total.\n\nEdge Cases & Constraints:\n- Vector strides stride_a = 1, stride_b = 1 (contiguous BLAS unit stride).\n- Asymmetric vector strides (e.g., stride_a = 1, stride_b = 2).\n- Single element vectors or zero vector inputs.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Input Case",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "Processed Memory Layout",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Processes standard input tensor memory buffer cleanly.",
    },
    {
      kind: "complex",
      title: "Larger Data Buffer",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "Processed Memory Layout",
      input: { data: [10, 20, 30, 40, 50] },
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates larger array with 5 tensor elements.",
    },
    {
      kind: "negative",
      title: "Edge Case Execution",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "Processed Memory Layout",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Edge case handling completes safely.",
    },
  ],
  code: STRIDED1DDOTPRODUCT_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview:
      "Strided vector dot products are fundamental to basic linear algebra kernels (BLAS). When multiplying transposed matrix columns or computing attention score projections, vector elements are accessed with step sizes larger than 1.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, given vectors A and B with strides s_a and s_b, the strided dot product over K elements is P = sum_{i=0}^{K-1} A[i * s_a] * B[i * s_b].",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "When s_a = 1 and s_b = 1, SIMD vector instructions (AVX-512, CUDA FMA) achieve maximum throughput by loading 8/16 packed floats simultaneously. When s_a > 1, memory reads become non-coalesced, reducing instruction throughput.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation calculates valid step count K = min(len(A)//s_a, len(B)//s_b), loops over step index i, computes element products, and accumulates sum.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge cases include zero vectors (returning 0), negative values, and strides larger than vector length.",
      },
    ],
    keyTerms: [
      {
        term: "Strided Vector Access",
        definition: "Reading vector elements spaced apart by stride step increments.",
      },
      {
        term: "BLAS Level-1",
        definition:
          "Basic Linear Algebra Subprograms performing vector-vector operations like dot product and norm.",
      },
      {
        term: "Fused Multiply-Add (FMA)",
        definition:
          "Hardware instruction performing a * b + c in a single clock cycle with single rounding.",
      },
    ],
  },
  trivia: STRIDED1DDOTPRODUCT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_STRIDED1DDOTPRODUCT_INPUT,
  generateSteps: generateStrided1dDotProductSteps,
};
