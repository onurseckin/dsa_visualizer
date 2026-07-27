import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface asStridedTensorViewEngineInput {
  data: number[];
  target?: number;
}

export const ASSTRIDEDTENSORVIEWENGINE_CODE = `
def as_strided_tensor_view_engine(memory_buffer, shape, strides, storage_offset=0):
    """
    Calculates zero-copy strided tensor element access and checks contiguity.
    """
    rows, cols = shape
    r_stride, c_stride = strides
    flat_offsets = []

    is_contiguous = (c_stride == 1 and r_stride == cols)

    for r in range(rows):
        for c in range(cols):
            offset = storage_offset + r * r_stride + c * c_stride
            val = memory_buffer[offset] if offset < len(memory_buffer) else 0
            flat_offsets.append((r, c, offset, val))

    return is_contiguous, flat_offsets
`;

export const DEFAULT_ASSTRIDEDTENSORVIEWENGINE_INPUT: asStridedTensorViewEngineInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateAsStridedTensorViewEngineSteps = (
  input: asStridedTensorViewEngineInput,
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
    "Initialize PyTorch ATen `as_strided` Zero-Copy View Engine",
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
    17,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ASSTRIDEDTENSORVIEWENGINE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in tensor memory." }],
  lineExplanations: {
    1: "Defines ATen as_strided view engine entry point.",
    4: "Unpacks target row and column dimensions from shape tuple.",
    5: "Unpacks row and column stride step sizes.",
    8: "Verifies row-major C-contiguity: column stride is 1 and row stride equals column count.",
    10: "Iterates through row dimensions.",
    11: "Iterates through column dimensions.",
    12: "Computes 1D physical offset = storage_offset + r * r_stride + c * c_stride.",
    13: "Fetches value from memory buffer or returns 0 if out of bounds.",
    16: "Returns contiguity status and array of physical offset mapping tuples.",
  },
};

export const asStridedTensorViewEngine: AlgorithmDefinition<asStridedTensorViewEngineInput> = {
  id: "as-strided-tensor-view-engine",
  title: "PyTorch ATen `as_strided` Zero-Copy View Engine",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "In PyTorch's ATen C++ core and deep learning runtime engines, tensor views (e.g., permute, transpose, slice, expand) do not allocate new memory or copy underlying scalar buffers. Instead, they invoke torch.as_strided(), reinterpreting physical 1D memory buffers using custom shape dimensions and stride vectors.\n\nThis algorithm implements PyTorch ATen as_strided Zero-Copy View Engine, mapping 2D multi-dimensional coordinate spaces into physical 1D flat memory offsets while verifying row-major (C-style) memory contiguity.\n\nInput Format:\n- data: 1D flat memory buffer array representing physical storage.\n- target: Optional scalar value target.\n\nOutput Format:\n- Returns contiguity boolean flag and mapped physical offset tuples (r, c, offset, val).\n\nEdge Cases & Constraints:\n- Non-contiguous views (e.g., transposed tensors with swapped strides).\n- Zero-stride broadcasting (stride = 0 for expanded dimensions).\n- Storage offsets shifting the starting element pointer.",
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
  code: ASSTRIDEDTENSORVIEWENGINE_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview:
      "PyTorch's tensor architecture decouples logical tensor views from physical data storage (StorageImpl). Multiple Tensors can point to identical underlying CPU/GPU memory allocations with different shapes, strides, and offsets. Understanding as_strided mechanics is vital for analyzing PyTorch performance, avoiding unnecessary tensor.contiguous() copies, and optimizing Triton GPU kernels.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, given an N-dimensional tensor with shape (d_0, d_1, ..., d_k) and strides (s_0, s_1, ..., s_k), the physical 1D memory address of logical element (i_0, i_1, ..., i_k) is computed as Offset = StorageOffset + sum(i_j * s_j). A tensor is C-contiguous if s_k = 1 and s_j = s_{j+1} * d_{j+1} for all j.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Zero-copy tensor views eliminate DRAM memory allocations, achieving instantaneous O(1) performance regardless of tensor volume (e.g., reshaping a 10GB tensor takes <1 microsecond). However, operating on non-contiguous strided views can degrade downstream GPU kernel throughput due to non-coalesced memory access patterns during matrix multiplication.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation requires mapping multidimensional loops to 1D offset equations while checking bounds against memory buffer limits. Storage offsets allow slicing tensors without modifying underlying storage allocations.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes zero strides (broadcasting single scalars across dimensions), negative strides (flipping tensors), and overlapping memory views. Production engines validate stride sanity to prevent illegal memory reads.",
      },
    ],
    keyTerms: [
      {
        term: "as_strided",
        definition:
          "PyTorch ATen low-level API creating arbitrary zero-copy tensor views using explicit shape and stride parameters.",
      },
      {
        term: "Memory Stride",
        definition:
          "The physical memory step size (number of scalars) required to advance one position along a logical dimension.",
      },
      {
        term: "C-Contiguity",
        definition:
          "Memory layout where adjacent logical elements along the last dimension are stored in adjacent physical memory addresses.",
      },
    ],
  },
  trivia: ASSTRIDEDTENSORVIEWENGINE_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_ASSTRIDEDTENSORVIEWENGINE_INPUT,
  generateSteps: generateAsStridedTensorViewEngineSteps,
};
