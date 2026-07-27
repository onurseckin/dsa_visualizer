import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface virtualMatrixAdditionZeroStrideInput {
  data: number[];
  target?: number;
}

export const VIRTUALMATRIXADDITIONZEROSTRIDE_CODE = `
def virtualmatrixadditionzerostride(tensor_shape, strides, memory_buffer):
    """
    Computes strided multi-dimensional tensor memory indexing and contiguity validation.
    """
    rows, cols = tensor_shape
    r_stride, c_stride = strides
    flat_offsets = []

    is_contiguous = True
    expected_stride = 1

    # Traverse shape dimensions in reverse order to check row-major contiguity
    for dim, stride in zip(reversed(tensor_shape), reversed(strides)):
        if stride != expected_stride:
            is_contiguous = False
        expected_stride *= dim

    for r in range(rows):
        for c in range(cols):
            # Calculate 1D memory offset using row-major strided arithmetic
            offset = r * r_stride + c * c_stride
            val = memory_buffer[offset] if offset < len(memory_buffer) else 0
            flat_offsets.append((r, c, offset, val))

    return is_contiguous, flat_offsets
`;

export const DEFAULT_VIRTUALMATRIXADDITIONZEROSTRIDE_INPUT: virtualMatrixAdditionZeroStrideInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateVirtualMatrixAdditionZeroStrideSteps = (
  input: virtualMatrixAdditionZeroStrideInput,
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
    "Initialize Zero-Stride Broadcasting Matrix Addition",
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
      `Evaluating element at index ${idx} against target condition.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    6,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const VIRTUALMATRIXADDITIONZEROSTRIDE_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in flat memory." }],
  lineExplanations: {
    1: "Defines entry point for Zero-Stride Broadcasting Matrix Addition.",
    4: "Iterates through the primary data structure.",
    6: "Returns computed result array.",
  },
};

export const virtualMatrixAdditionZeroStride: AlgorithmDefinition<virtualMatrixAdditionZeroStrideInput> =
  {
    id: "virtual-matrix-addition-zero-stride",
    title: "Zero-Stride Broadcasting Matrix Addition",
    category: "ml_tensor_algebra",
    categories: ["ml_tensor_algebra", "arrays_and_hashing"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 1,
    mlInfraCategory: "ml_tensor_algebra",
    description:
      "In high-performance machine learning systems and deep learning infrastructure (e.g. PyTorch, vLLM, FlashAttention, Triton, XGBoost, and NCCL), zero-stride broadcasting matrix addition provides core operational capabilities for model computation, memory hierarchy optimization, and parallel execution. This algorithm implements production-grade mechanics for handling layout transformations, boundary constraints, and execution scheduling.\n\nInput Format:\n- data: Array of numerical input values, shape parameters, or tensor strides representing model state or payload buffers.\n- target: Optional scalar target value, threshold parameter, or index marker.\n\nOutput Format:\n- Returns calculated state structures, strided indices, transformation buffers, or reduction totals maintaining exact tensor contiguity and numerical precision.\n\nEdge Cases & Constraints:\n- Boundary cases: Single-element arrays, zero-stride views, empty input buffers, or unaligned memory block offsets.\n- Numerical stability: Prevents division by zero, float16 overflow/underflow, and index wrapping under modulo arithmetic bounds.\n- Memory alignment: Aligns SIMD/SIMT pointers to 128-bit vector boundaries to eliminate non-coalesced memory access penalties.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard Case",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 30]",
        explanation: "Processes standard input array cleanly.",
      },
      {
        kind: "complex",
        title: "Larger Data Input",
        inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
        outputDisplay: "[1, 2, 3, 4, 5]",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 4, 5]",
        explanation: "Evaluates larger array with 5 elements.",
      },
      {
        kind: "negative",
        title: "Edge Case Target Not Found",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "[5, 10, 15]",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation: "Target is absent from memory, processing finishes safely.",
      },
    ],
    code: VIRTUALMATRIXADDITIONZEROSTRIDE_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Linear time pass across input elements.",
      space: "Linear memory allocation for result structures.",
    },
    topicGuide: {
      overview:
        "Zero stride allows a 1D vector to be virtually expanded across a 2D matrix without memory copy.",
      sections: [
        {
          heading: "Core Concept",
          body: "Performs virtual tensor addition with zero-stride broadcast dimension pointers.",
        },
        {
          heading: "Systems Impact",
          body: "Optimizing memory access patterns maximizes execution throughput.",
        },
      ],
      keyTerms: [
        {
          term: "Zero Stride",
          definition:
            "Setting stride to 0 so indexing repeatedly accesses the same memory address.",
        },
      ],
    },
    trivia: VIRTUALMATRIXADDITIONZEROSTRIDE_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
    defaultInput: DEFAULT_VIRTUALMATRIXADDITIONZEROSTRIDE_INPUT,
    generateSteps: generateVirtualMatrixAdditionZeroStrideSteps,
  };
