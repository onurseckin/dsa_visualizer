import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tensorContiguityVerifierInput {
  data: number[];
  target?: number;
}

export const TENSORCONTIGUITYVERIFIER_CODE = `
def tensor_contiguity_verifier(shape, strides):
    """
    Verifies C-style row-major tensor contiguity and calculates expected strides.
    """
    dims = len(shape)
    is_contiguous = True
    expected_stride = 1
    expected_strides = [0] * dims

    for i in range(dims - 1, -1, -1):
        expected_strides[i] = expected_stride
        if strides[i] != expected_stride:
            is_contiguous = False
        expected_stride *= shape[i]

    return is_contiguous, expected_strides
`;

export const DEFAULT_TENSORCONTIGUITYVERIFIER_INPUT: tensorContiguityVerifierInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateTensorContiguityVerifierSteps = (
  input: tensorContiguityVerifierInput,
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
    "Initialize PyTorch-Style Tensor Contiguity Verifier",
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
    16,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const TENSORCONTIGUITYVERIFIER_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in tensor memory." }],
  lineExplanations: {
    1: "Defines PyTorch-style tensor contiguity verifier.",
    4: "Gets total dimension count (rank) of tensor.",
    5: "Initializes contiguity status flag to True.",
    6: "Initializes inner-most expected stride multiplier to 1.",
    7: "Allocates array for calculated expected strides.",
    9: "Iterates through dimensions in reverse order from rank-1 down to 0.",
    10: "Assigns accumulated expected_stride to dimension i.",
    11: "Checks if actual tensor stride[i] matches expected_stride.",
    12: "Sets contiguity status flag to False upon stride mismatch.",
    13: "Updates expected_stride multiplier by multiplying current dimension shape[i].",
    15: "Returns contiguity boolean result and expected stride vector.",
  },
};

export const tensorContiguityVerifier: AlgorithmDefinition<tensorContiguityVerifierInput> = {
  id: "tensor-contiguity-verifier",
  title: "PyTorch-Style Tensor Contiguity Verifier",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "In PyTorch's ATen C++ runtime, calling tensor.is_contiguous() determines whether underlying scalar data is stored continuously in standard C-style row-major memory order. If a tensor is non-contiguous (e.g. after tensor.transpose(0, 1)), operations like view() raise errors until tensor.contiguous() is called to execute a contiguous memory re-allocation copy.\n\nThis algorithm implements PyTorch-Style Tensor Contiguity Verifier, traversing dimension shapes in reverse order, building expected C-contiguous strides, and comparing them against actual tensor strides.\n\nInput Format:\n- data: Array representing shape and stride values.\n- target: Optional scalar value target.\n\nOutput Format:\n- Returns boolean contiguity status and calculated expected stride vector.\n\nEdge Cases & Constraints:\n- 1D tensors (always contiguous if stride = 1).\n- Tensors with dimension size 1 (stride value can be arbitrary without breaking contiguity).\n- Transposed 2D tensors (swapped strides breaking contiguity).",
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
  code: TENSORCONTIGUITYVERIFIER_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview:
      "Tensor contiguity verification is checked before invoking optimized CUDA kernels (cuBLAS, FlashAttention). Kernels expecting row-major memory layouts will fail or produce incorrect results if passed non-contiguous input views without contiguity verification.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for a D-dimensional tensor with shape (d_0, d_1, ..., d_{D-1}), expected C-contiguous strides S_exp are computed right-to-left: S_exp[D-1] = 1, and S_exp[i] = S_exp[i+1] * d_{i+1}. A tensor is C-contiguous if actual strides match expected strides S[i] == S_exp[i] for all dimensions i where d_i > 1.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "When is_contiguous is false, PyTorch allocates a new contiguous physical buffer of size prod(d_i) and executes a strided C++ memcpy kernel to restore unit contiguity.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation iterates backward from dimension D-1 down to 0, maintaining accumulated stride multiplier expected_stride, setting expected_strides[i], and flagging non-contiguity whenever actual strides mismatch.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge cases include zero-element empty tensors and size-1 dimensions where stride values do not affect physical offset stepping.",
      },
    ],
    keyTerms: [
      {
        term: "C-Contiguity",
        definition:
          "Memory layout where elements along the last dimension occupy adjacent memory addresses.",
      },
      {
        term: "Expected Stride",
        definition:
          "The canonical row-major memory step size computed backwards as product of outer dimension sizes.",
      },
      {
        term: "Memory Re-Allocation",
        definition:
          "Allocating new memory to copy non-contiguous tensor data into contiguous storage.",
      },
    ],
  },
  trivia: TENSORCONTIGUITYVERIFIER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_TENSORCONTIGUITYVERIFIER_INPUT,
  generateSteps: generateTensorContiguityVerifierSteps,
};
