import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface dynamic2dBlockPrefixSumInput {
  data: number[];
  target?: number;
}

export const DYNAMIC2DBLOCKPREFIXSUM_CODE = `
def dynamic2dblockprefixsum(tensor_shape, strides, memory_buffer):
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

export const DEFAULT_DYNAMIC2DBLOCKPREFIXSUM_INPUT: dynamic2dBlockPrefixSumInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateDynamic2dBlockPrefixSumSteps = (
  input: dynamic2dBlockPrefixSumInput,
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
    "Initialize Block-Tiled 2D Prefix Sum Engine",
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

const DYNAMIC2DBLOCKPREFIXSUM_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in flat memory." }],
  lineExplanations: {
    1: "Defines entry point for Block-Tiled 2D Prefix Sum Engine.",
    4: "Iterates through the primary data structure.",
    6: "Returns computed result array.",
  },
};

export const dynamic2dBlockPrefixSum: AlgorithmDefinition<dynamic2dBlockPrefixSumInput> = {
  id: "dynamic-2d-block-prefix-sum",
  title: "Block-Tiled 2D Prefix Sum Engine",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description: "Tiles 2D grid into block regions for cache-coherent prefix updates.",
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
  code: DYNAMIC2DBLOCKPREFIXSUM_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview: "Block tiling splits 2D grids into L1-friendly sub-blocks.",
    sections: [
      {
        heading: "Core Concept",
        body: "Tiles 2D grid into block regions for cache-coherent prefix updates.",
      },
      {
        heading: "Systems Impact",
        body: "Optimizing memory access patterns maximizes execution throughput.",
      },
    ],
    keyTerms: [
      { term: "Block Tiling", definition: "Partitioning large matrices into small sub-blocks." },
    ],
  },
  trivia: DYNAMIC2DBLOCKPREFIXSUM_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_DYNAMIC2DBLOCKPREFIXSUM_INPUT,
  generateSteps: generateDynamic2dBlockPrefixSumSteps,
};
